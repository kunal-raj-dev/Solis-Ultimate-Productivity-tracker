import { IAuthService } from '../../api.interface';
import { UserProfile, LoginCredentials, SignupCredentials, AuthSession } from '../../../types/auth';
import { mapProfile } from '../supabaseMappers';
import { SupabaseServiceContext } from './types';

export class SupabaseAuthService implements IAuthService {
  constructor(private ctx: SupabaseServiceContext) {}

  getCurrentUser = async (): Promise<UserProfile | null> => {
    try {
      // Fast-path: Check local session first to eliminate redundant HTTP roundtrips
      const { data: { session } } = await this.ctx.client.auth.getSession();
      let targetUser = session?.user;

      if (!targetUser) {
        // Guard network fetch with a 6s timeout against sleeping / paused Supabase instances
        const userPromise = this.ctx.client.auth.getUser();
        const timeoutPromise = new Promise<{ data: { user: null }; error: Error }>((resolve) =>
          setTimeout(() => resolve({ data: { user: null }, error: new Error('Supabase getUser timed out after 6000ms') }), 6000)
        );
        const { data: { user }, error } = await Promise.race([userPromise, timeoutPromise]);
        if (error || !user) return null;
        targetUser = user;
      }

      const { data: profile, error: profileErr } = await this.ctx.client
        .from('profiles')
        .select('*')
        .eq('id', targetUser.id)
        .single();

      if (profileErr || !profile) {
        return {
          id: targetUser.id,
          name: targetUser.user_metadata?.name || 'Solis Scholar',
          email: targetUser.email || '',
          focusField: targetUser.user_metadata?.focus_field || 'Systems Architecture & Computational Design',
          createdAt: targetUser.created_at,
          updatedAt: targetUser.created_at,
          preferences: {
            theme: 'light',
            soundEnabled: true,
            defaultFocusDurationMinutes: 25,
            defaultBreakDurationMinutes: 5,
            dailyStudyGoalMinutes: 180,
            dailyTasksGoalCount: 5,
            focusGradientTheme: 'momentum'
          }
        };
      }

      return mapProfile(profile);
    } catch (err) {
      console.warn('[SupabaseAuthService] Session retrieval error or timeout:', err);
      return null;
    }
  };

  login = async (credentials: LoginCredentials): Promise<AuthSession> => {
    const { data, error } = await this.ctx.client.auth.signInWithPassword({
      email: credentials.email,
      password: credentials.password || ''
    });

    if (error) throw error;
    if (!data.user || !data.session) {
      throw new Error('No active session returned after login.');
    }

    const currentUser = await this.getCurrentUser();
    if (!currentUser) {
      throw new Error('Failed to retrieve user profile after login.');
    }

    this.ctx.notify();
    return {
      token: data.session.access_token,
      user: currentUser,
      expiresAt: new Date(data.session.expires_at ? data.session.expires_at * 1000 : Date.now() + 86400000).toISOString()
    };
  };

  signup = async (credentials: SignupCredentials): Promise<AuthSession> => {
    const { data, error } = await this.ctx.client.auth.signUp({
      email: credentials.email,
      password: credentials.password || '',
      options: {
        data: {
          name: credentials.name,
          focus_field: credentials.focusField
        }
      }
    });

    if (error) throw error;
    if (!data.user) throw new Error('Failed to create account.');

    if (!data.session) {
      const unconfirmedErr = new Error(
        'Account created! Please check your email to confirm your account before signing in (or disable "Confirm email" in Supabase Authentication settings for instant signups).'
      );
      (unconfirmedErr as any).code = 'email_confirmation_required';
      throw unconfirmedErr;
    }

    // Upsert profile in case trigger had delay
    await this.ctx.client.from('profiles').upsert({
      id: data.user.id,
      name: credentials.name,
      email: credentials.email,
      focus_field: credentials.focusField || 'Systems Architecture & Computational Design'
    });

    const currentUser = await this.getCurrentUser();
    this.ctx.notify();

    return {
      token: data.session.access_token,
      user: currentUser || {
        id: data.user.id,
        name: credentials.name,
        email: credentials.email,
        focusField: credentials.focusField || 'Systems Architecture & Computational Design',
        preferences: {
          theme: 'light',
          soundEnabled: true,
          defaultFocusDurationMinutes: 25,
          defaultBreakDurationMinutes: 5,
          dailyStudyGoalMinutes: 180,
          dailyTasksGoalCount: 5,
          focusGradientTheme: 'momentum'
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      expiresAt: new Date(data.session.expires_at ? data.session.expires_at * 1000 : Date.now() + 86400000 * 7).toISOString()
    };
  };

  logout = async (): Promise<void> => {
    await this.ctx.client.auth.signOut();
    this.ctx.notify();
  };

  requestPasswordReset = async (email: string): Promise<void> => {
    const redirectUrl = typeof window !== 'undefined' && window.location?.origin
      ? `${window.location.origin}/auth/reset-password`
      : 'https://solis-ultimate-productivity-tracker.vercel.app/auth/reset-password';

    const { error } = await this.ctx.client.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: redirectUrl
    });

    if (error) {
      // Do not throw on user-not-found to prevent account enumeration
      const msg = error.message?.toLowerCase() || '';
      if (msg.includes('user not found') || msg.includes('not found') || (error as any).status === 404) {
        return;
      }
      throw error;
    }
  };

  updatePassword = async (password: string): Promise<void> => {
    const { error } = await this.ctx.client.auth.updateUser({
      password
    });

    if (error) throw error;
    this.ctx.notify();
  };
}
