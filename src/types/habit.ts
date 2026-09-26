import { BaseEntity } from './common';

export type HabitFrequency = 'daily' | 'weekdays' | 'weekends' | 'three_times_weekly';

export interface HabitRecord {
  date: string; // YYYY-MM-DD
  completed: boolean;
  notes?: string;
}

export interface Habit extends BaseEntity {
  title: string;
  description?: string;
  category: 'study' | 'wellness' | 'mindset' | 'routine';
  frequency: HabitFrequency;
  /**
   * Optional explicit schedule overriding `frequency` (0 = Sun, 1 = Mon ...).
   * Consumed by the frequency-aware streak engine (src/utils/streaks.ts).
   */
  customDays?: number[];
  color: string;
  currentStreak: number;
  longestStreak: number;
  completedToday: boolean;
  history: Record<string, boolean>; // date -> boolean
  /**
   * Plan §3.4 "Streak Amnesty": local dates (YYYY-MM-DD) excused as
   * non-evaluating days by the streak engine, so a gentle re-entry after an
   * absence never breaks habit continuity. Never fabricated as completions.
   */
  amnestyDates?: string[];
  goalId?: string;
  goalTitle?: string;
}
