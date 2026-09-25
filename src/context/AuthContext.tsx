import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { UserProfile, UserPreferences, LoginCredentials, SignupCredentials } from '../types/auth';
import { dataService } from '../services/dataService';
import { supabase, isSupabaseConfigured } from '../services/supabase/supabaseClient';
import { formatAuthError } from '../utils/authErrors';

export type AuthStatus = 'initializing' | 'authenticated' | 'unauthenticated' | 'auth_error';

interface AuthContextValue {
  user: UserProfile | null;
  authStatus: AuthStatus;
  isAuthenticated: boolean;
  isLoading: boolean;
  isLoggingOut: boolean;
  authError: string | null;
  login: (credentials: LoginCredentials) => Promise<void>;
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

  // Sequence ID to prevent out-of-order race conditions
  const seqRef = useRef<number>(0);
  const isMountedRef = useRef<boolean>(true);

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

    // React to dataService repository switches (e.g. switching between Mock and Supabase via OfflineBanner)
    const unsubscribeDataService = dataService.subscribe(() => {
      syncUserSession();
    });

    return () => {
      isMountedRef.current = false;
      if (unsubscribeSupabase) unsubscribeSupabase();
      if (unsubscribeDataService) unsubscribeDataService();
    };
  }, [syncUserSession]);

  const login = useCallback(async (credentials: LoginCredentials) => {
    const currentSeq = ++seqRef.current;
    setAuthStatus('initializing');
    setAuthError(null);
    try {
      const session = await dataService.auth.login(credentials);
      if (isMountedRef.current && currentSeq === seqRef.current) {
        setUser(session.user);
        setAuthStatus('authenticated');
      }
    } catch (err) {
      if (isMountedRef.current && currentSeq === seqRef.current) {
        const formatted = formatAuthError(err);
        setAuthError(formatted.userMessage);
        setAuthStatus('auth_error');
        throw new Error(formatted.userMessage);
      }
    }
  }, []);

  const signup = useCallback(async (credentials: SignupCredentials) => {
    const currentSeq = ++seqRef.current;
    setAuthStatus('initializing');
    setAuthError(null);
    try {
      const session = await dataService.auth.signup(credentials);
      if (isMountedRef.current && currentSeq === seqRef.current) {
        setUser(session.user);
        setAuthStatus('authenticated');
      }
    } catch (err) {
      if (isMountedRef.current && currentSeq === seqRef.current) {
        const formatted = formatAuthError(err);
        setAuthError(formatted.userMessage);
        setAuthStatus('auth_error');
        throw new Error(formatted.userMessage);
      }
    }
  }, []);

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
