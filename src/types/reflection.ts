import { BaseEntity } from './common';

export interface DailyReflection extends BaseEntity {
  date: string; // YYYY-MM-DD
  energyScore: number; // 1 to 5
  focusScore: number; // 1 to 5
  wins: string[];
  frictionPoints: string[];
  tomorrowIntentions: string[];
  synthesisNotes?: string;
  completedHabitsCount: number;
  completedTasksCount: number;
  studyMinutesLogged: number;
  reviewCardsCompleted: number;
}

export interface ReflectionSummary {
  totalReflections: number;
  averageEnergy: number;
  averageFocus: number;
  topWins: string[];
}
