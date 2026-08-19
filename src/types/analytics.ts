import { ID } from './common';

export interface ProductivityMetric {
  id: string;
  label: string;
  value: number | string;
  unit?: string;
  changePercentage?: number | null;
  trend?: 'up' | 'down' | 'neutral' | null;
  timeframe: 'today' | 'this_week' | 'this_month';
}

export interface DayStudyHeatmap {
  date: string;
  hours: number;
  level: 0 | 1 | 2 | 3 | 4; // intensity
}

export interface SubjectDistribution {
  subjectId: ID;
  subjectName: string;
  hours: number;
  percentage: number;
  color: string;
}

export interface DailySummary {
  date: string;
  totalStudyMinutes: number;
  completedTasksCount: number;
  totalTasksCount: number;
  focusSessionsCount: number;
  habitsCompletedRatio: string;
  momentumScore: number; // 0 - 100
}
