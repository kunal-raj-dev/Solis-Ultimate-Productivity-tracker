import { BaseEntity } from './common';

export interface UserPreferences {
  theme: 'light' | 'dark' | 'sepia' | 'system';
  soundEnabled: boolean;
  defaultFocusDurationMinutes: number;
  defaultBreakDurationMinutes: number;
  dailyStudyGoalMinutes: number;
  dailyTasksGoalCount: number;
  focusGradientTheme: 'focus' | 'momentum' | 'achievement' | 'reflection';
  /** Desired retention probability for FSRS-5 spaced repetition (0.75 - 0.97, default 0.90). */
  fsrsRetention?: number;
  /** Active spaced repetition algorithm (default 'fsrs-5'). */
  fsrsAlgorithm?: 'fsrs-5' | 'sm-2';
}

export interface UserProfile extends BaseEntity {
  name: string;
  email: string;
  avatarUrl?: string;
  bio?: string;
  focusField?: string; // e.g., "Computer Science", "Medical Board Prep", "Design Architecture"
  preferences: UserPreferences;
}

export interface AuthSession {
  token: string;
  user: UserProfile;
  expiresAt: string;
}

export interface AuthState {
  user: UserProfile | null;
  session: AuthSession | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface LoginCredentials {
  email: string;
  password?: string;
  rememberMe?: boolean;
}

export interface SignupCredentials {
  name: string;
  email: string;
  password?: string;
  focusField?: string;
  studyGoalHours?: number;
}
