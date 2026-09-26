import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { UserProfile, UserPreferences, LoginCredentials, SignupCredentials } from '../types/auth';
import { dataService, ServiceContainer } from '../services/dataService';
import { supabase, isSupabaseConfigured } from '../services/supabase/supabaseClient';
import {
  migrateGuestWorkspaceToCloud,
  archiveGuestSnapshot,
  hasGuestData,
  GuestWorkspaceSnapshot
} from '../services/migration/guestMigration';
import { formatAuthError } from '../utils/authErrors';

export type AuthStatus = 'initializing' | 'authenticated' | 'unauthenticated' | 'auth_error';

type GuestMigrationState = { status: 'idle' | 'running' | 'error'; message?: string };

interface AuthContextValue {
  user: UserProfile | null;
  authStatus: AuthStatus;
  isAuthenticated: boolean;
  isLoading: boolean;
  isLoggingOut: boolean;
  authError: string | null;
  login: (credentials: LoginCredentials, options?: { guest?: boolean }) => Promise<void>;
  signup: (credentials: SignupCredentials) => Promise<void>;
  logout: () => Promise<void>;
  requestPasswordReset: (email: string) => Promise<void>;
  updatePassword: (password: string) => Promise<void>;
  updateProfile: (updates: {
    name?: string;
    email?: string;
    focusField?: string;
    preferences?: Partial<UserPreferences>;
  }) => Promise<UserProfile>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [authStatus, setAuthStatus] = useState<AuthStatus>('initializing');
  const [isLoggingOut, setIsLoggingOut] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [guestMigration, setGuestMigration] = useState<GuestMigrationState>({ status: 'idle' });

  // Sequence ID to prevent out-of-order race conditions
  const seqRef = useRef<number>(0);
  // Auth-operation ID: bumped ONLY by login/signup/logout, never by
  // syncUserSession or ServiceContainer switches (whose subscriber callbacks
  // bump seqRef and would otherwise invalidate in-flight auth guards).
  const authOpRef = useRef<number>(0);
  const isMountedRef = useRef<boolean>(true);
  const migrationContinueRef = useRef<(() => void) | null>(null);
  const migrationOverlayRef = useRef<HTMLDivElement | null>(null);

  /**
   * Guest-to-Cloud Migration Protocol (plan §1.3): carries the local guest
   * workspace into the freshly authenticated cloud account, then archives the
   * guest snapshot locally with a timestamp backup. A failure never blocks
   * authentication — the user is shown an honest status and their local work
   * remains intact.
   */
  const runGuestMigration = useCallback(async (snapshot: GuestWorkspaceSnapshot): Promise<void> => {
    setGuestMigration({ status: 'running' });
    try {
      await migrateGuestWorkspaceToCloud(snapshot);
      archiveGuestSnapshot(snapshot);
      if (isMountedRef.current) setGuestMigration({ status: 'idle' });
    } catch (err) {
      console.error('[AuthContext] Guest-to-cloud migration failed:', err);
      // Archive everything that did not reach the cloud BEFORE surfacing the
      // failure, so "nothing was deleted" is literally true (plan §1.3).
      const backupKey = archiveGuestSnapshot(snapshot);
      if (isMountedRef.current) {
        setGuestMigration({
          status: 'error',
          message: backupKey
            ? 'Some items could not be synced to your cloud account just now. Nothing was deleted: your workspace was archived on this device, and the items that did sync are already in your account.'
            : 'Some items could not be synced to your cloud account just now, and a local archive could not be written. Your cloud account and this browser session are otherwise unaffected.'
        });
        await new Promise<void>((resolve) => {
          migrationContinueRef.current = resolve;
        });
      }
    }
  }, []);

  const continueAfterMigrationError = useCallback(() => {
    migrationContinueRef.current?.();
    migrationContinueRef.current = null;
    setGuestMigration({ status: 'idle' });
  }, []);

  // Modal a11y (master.md §17.3): move focus into the overlay, trap Tab
  // (single-focusable content), and let Escape acknowledge the error state.
  useEffect(() => {
    if (guestMigration.status === 'idle') return;
    const node = migrationOverlayRef.current;
    if (node) {
      const focusable = node.querySelector<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      (focusable ?? node).focus();
    }
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Tab') {
        event.preventDefault();
      } else if (event.key === 'Escape' && guestMigration.status === 'error') {
        continueAfterMigrationError();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [guestMigration.status, continueAfterMigrationError]);

  /**
   * Resolves the guest snapshot + container routing for a REAL (non-guest)
   * authentication attempt: the guest workspace is captured while the mock
   * repository is still active, then the container switches to Supabase so
   * the signup/login creates a real cloud session to migrate into.
   */
  const prepareRealAuthAttempt = useCallback((): {
    guestSnapshot: GuestWorkspaceSnapshot | null;
    switchedToSupabase: boolean;
  } => {
    if (!isSupabaseConfigured() || ServiceContainer.getMode() !== 'mock') {
      return { guestSnapshot: null, switchedToSupabase: false };
    }
    const guestSnapshot = ServiceContainer.snapshotMockWorkspace();
    ServiceContainer.switchToSupabase();
    return { guestSnapshot, switchedToSupabase: true };
  }, []);

  const syncUserSession = useCallback(async () => {
    const currentSeq = ++seqRef.current;
    setAuthError(null);

    try {
      const currentUser = await dataService.auth.getCurrentUser();

      // Guard against race condition: only update if this is the newest request
      if (!isMountedRef.current || currentSeq !== seqRef.current) return;

      if (currentUser) {
        setUser(currentUser);
        setAuthStatus('authenticated');
      } else {
        setUser(null);
        setAuthStatus('unauthenticated');
      }
    } catch (err) {
      if (!isMountedRef.current || currentSeq !== seqRef.current) return;
      console.error('Session sync error:', err);
      setUser(null);
      setAuthStatus('unauthenticated');
    }
  }, []);

  useEffect(() => {
    isMountedRef.current = true;

    // Initial session hydration
    syncUserSession();

    // Setup Supabase real-time auth subscription if configured
    let unsubscribeSupabase: (() => void) | undefined;

    if (isSupabaseConfigured()) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event) => {
        if (!isMountedRef.current) return;

        if (event === 'SIGNED_OUT') {
          seqRef.current++;
          setUser(null);
          setAuthError(null);
          setAuthStatus('unauthenticated');
        } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'INITIAL_SESSION') {
          syncUserSession();
        }
      });

      unsubscribeSupabase = () => {
        subscription.unsubscribe();
      };
    }

    // React to dataService repository switches (e.g. switching between Mock and Supabase via OfflineBanner).
    // Deliberately unscoped (plan §6.1): the events this context reacts to are
    // global lifecycle events — provider switches dispatch with no channel and
    // auth mutations broadcast on 'all' — both of which bypass every channel
    // filter, so a filter could not reduce its wake-ups.
    const unsubscribeDataService = dataService.subscribe(() => {
      syncUserSession();
    });

    return () => {
      isMountedRef.current = false;
      if (unsubscribeSupabase) unsubscribeSupabase();
      if (unsubscribeDataService) unsubscribeDataService();
    };
  }, [syncUserSession]);

  const login = useCallback(async (credentials: LoginCredentials, options?: { guest?: boolean }) => {
    const opId = ++authOpRef.current;
    setAuthStatus('initializing');
    setAuthError(null);

    // Guest sessions authenticate against the mock repository by design.
    const isGuestLogin = options?.guest === true;
    const { guestSnapshot, switchedToSupabase } = isGuestLogin
      ? { guestSnapshot: null, switchedToSupabase: false }
      : prepareRealAuthAttempt();

    try {
      const session = await dataService.auth.login(credentials);
      if (isMountedRef.current && authOpRef.current === opId) {
        // Intercept the successful session BEFORE the UI enters the workspace:
        // migrate any stranded guest workspace into the cloud account first.
        if (hasGuestData(guestSnapshot)) {
          await runGuestMigration(guestSnapshot!);
        }
        if (isMountedRef.current && authOpRef.current === opId) {
          setUser(session.user);
          setAuthStatus('authenticated');
        }
      }
    } catch (err) {
      // A failed real auth attempt returns the container to the guest session
      // it came from — restored with the captured snapshot, not fresh demo
      // seeds, so no local work is stranded behind a dead provider.
      if (switchedToSupabase) {
        ServiceContainer.switchToMock(guestSnapshot ?? undefined);
      }
      if (isMountedRef.current && authOpRef.current === opId) {
        const formatted = formatAuthError(err);
        setAuthError(formatted.userMessage);
        setAuthStatus('auth_error');
        throw new Error(formatted.userMessage);
      }
    }
  }, [prepareRealAuthAttempt, runGuestMigration]);

  const signup = useCallback(async (credentials: SignupCredentials) => {
    const opId = ++authOpRef.current;
    setAuthStatus('initializing');
    setAuthError(null);

    const { guestSnapshot, switchedToSupabase } = prepareRealAuthAttempt();

    try {
      const session = await dataService.auth.signup(credentials);
      if (isMountedRef.current && authOpRef.current === opId) {
        // Intercept the successful session BEFORE the UI enters the workspace:
        // migrate any stranded guest workspace into the new cloud account.
        if (hasGuestData(guestSnapshot)) {
          await runGuestMigration(guestSnapshot!);
        }
        if (isMountedRef.current && authOpRef.current === opId) {
          setUser(session.user);
          setAuthStatus('authenticated');
        }
      }
    } catch (err) {
      if (switchedToSupabase) {
        ServiceContainer.switchToMock(guestSnapshot ?? undefined);
      }
      if (isMountedRef.current && authOpRef.current === opId) {
        const formatted = formatAuthError(err);
        setAuthError(formatted.userMessage);
        setAuthStatus('auth_error');
        throw new Error(formatted.userMessage);
      }
    }
  }, [prepareRealAuthAttempt, runGuestMigration]);

  const logout = useCallback(async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    try {
      await dataService.auth.logout();
    } catch (err) {
      console.error('Logout failed:', err);
    } finally {
      if (isMountedRef.current) {
        seqRef.current++;
        // Invalidate any in-flight login/signup so a stale session can never
        // override the signed-out state.
        authOpRef.current++;
        setUser(null);
        setAuthError(null);
        setAuthStatus('unauthenticated');
        setIsLoggingOut(false);
      }
    }
  }, [isLoggingOut]);

  const requestPasswordReset = useCallback(async (email: string) => {
    setAuthError(null);
    try {
      await dataService.auth.requestPasswordReset(email);
    } catch (err) {
      if (isMountedRef.current) {
        const formatted = formatAuthError(err);
        setAuthError(formatted.userMessage);
        throw new Error(formatted.userMessage);
      }
    }
  }, []);

  const updatePassword = useCallback(async (password: string) => {
    setAuthError(null);
    try {
      await dataService.auth.updatePassword(password);
    } catch (err) {
      if (isMountedRef.current) {
        const formatted = formatAuthError(err);
        setAuthError(formatted.userMessage);
        throw new Error(formatted.userMessage);
      }
    }
  }, []);

  const updateProfile = useCallback(async (updates: {
    name?: string;
    email?: string;
    focusField?: string;
    preferences?: Partial<UserPreferences>;
  }): Promise<UserProfile> => {
    setAuthError(null);
    try {
      const updated = await dataService.auth.updateProfile(updates);
      if (isMountedRef.current) {
        setUser(updated);
      }
      return updated;
    } catch (err) {
      if (isMountedRef.current) {
        const formatted = formatAuthError(err);
        setAuthError(formatted.userMessage);
        throw new Error(formatted.userMessage);
      }
      throw err;
    }
  }, []);

  const clearError = useCallback(() => setAuthError(null), []);

  const isLoading = authStatus === 'initializing';
  const isAuthenticated = authStatus === 'authenticated' && user !== null;

  const value = React.useMemo<AuthContextValue>(
    () => ({
      user,
      authStatus,
      isAuthenticated,
      isLoading,
      isLoggingOut,
      authError,
      login,
      signup,
      logout,
      requestPasswordReset,
      updatePassword,
      updateProfile,
      clearError
    }),
    [
      user,
      authStatus,
      isAuthenticated,
      isLoading,
      isLoggingOut,
      authError,
      login,
      signup,
      logout,
      requestPasswordReset,
      updatePassword,
      updateProfile,
      clearError
    ]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
      {guestMigration.status !== 'idle' && (
        <div
          role="dialog"
          aria-modal="true"
          aria-live="polite"
          aria-label={guestMigration.status === 'running' ? 'Migrating your local workspace' : 'Workspace sync status'}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(28, 25, 23, 0.55)',
            padding: '24px'
          }}
        >
        <div
          ref={migrationOverlayRef}
          tabIndex={-1}
          style={{
            backgroundColor: 'var(--bg-surface-elevated, #FFFFFF)',
            border: '1px solid var(--border-subtle, #E7E2DA)',
            borderRadius: 'var(--radius-lg, 16px)',
            boxShadow: '0 24px 64px rgba(28, 25, 23, 0.28)',
            maxWidth: '420px',
            width: '100%',
            padding: '28px 26px',
            textAlign: 'center',
            outline: 'none'
          }}
        >
            {guestMigration.status === 'running' ? (
              <>
                <div
                  aria-hidden="true"
                  style={{
                    width: '38px',
                    height: '38px',
                    margin: '0 auto 16px',
                    borderRadius: '50%',
                    border: '3px solid var(--border-subtle, #E7E2DA)',
                    borderTopColor: 'var(--color-coral-500, #E05A47)',
                    animation: 'pulseSubtle 1.4s ease-in-out infinite'
                  }}
                />
                <h2
                  style={{
                    fontFamily: 'var(--font-display, serif)',
                    fontSize: 'var(--text-heading-3, 20px)',
                    margin: '0 0 8px',
                    color: 'var(--text-primary, #1C1917)'
                  }}
                >
                  Syncing your local workspace to your new cloud account...
                </h2>
                <p style={{ fontSize: 'var(--text-body-sm, 14px)', color: 'var(--text-secondary, #57534E)', margin: 0 }}>
                  Your subjects, notes, tasks, habits, and flashcards are coming with you.
                </p>
              </>
            ) : (
              <>
                <h2
                  style={{
                    fontFamily: 'var(--font-display, serif)',
                    fontSize: 'var(--text-heading-3, 20px)',
                    margin: '0 0 8px',
                    color: 'var(--text-primary, #1C1917)'
                  }}
                >
                  Workspace sync needs your attention
                </h2>
                <p style={{ fontSize: 'var(--text-body-sm, 14px)', color: 'var(--text-secondary, #57534E)', margin: '0 0 18px' }}>
                  {guestMigration.message}
                </p>
                <button
                  type="button"
                  onClick={continueAfterMigrationError}
                  style={{
                    border: 'none',
                    cursor: 'pointer',
                    padding: '10px 22px',
                    borderRadius: 'var(--radius-md, 10px)',
                    backgroundColor: 'var(--color-coral-500, #E05A47)',
                    color: '#FFFFFF',
                    fontWeight: 600,
                    fontSize: 'var(--text-body-sm, 14px)'
                  }}
                >
                  Continue
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </AuthContext.Provider>
  );
};

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
