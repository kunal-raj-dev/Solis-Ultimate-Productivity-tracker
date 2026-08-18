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
  color: string;
  currentStreak: number;
  longestStreak: number;
  completedToday: boolean;
  history: Record<string, boolean>; // date -> boolean
  goalId?: string;
  goalTitle?: string;
}
