import { Task } from '../types/task';
import { StudySession } from '../types/study';
import { FocusSession } from '../types/focus';
import { Habit } from '../types/habit';
import { DailySummary } from '../types/analytics';
import { isToday, getISODateString } from './date';

/**
 * Solis - Productivity Engine & Momentum Scoring Algorithm
 * Transparent, deterministic derivation of daily summaries from underlying domain models.
 */

export interface ProductivityScoreBreakdown {
  taskScore: number;       // 0 - 100 (30% weight)
  studyScore: number;      // 0 - 100 (30% weight)
  focusScore: number;      // 0 - 100 (20% weight)
  habitScore: number;      // 0 - 100 (20% weight)
  totalMomentumScore: number; // 0 - 100 weighted
}

export function calculateDailySummary({
  tasks,
  studySessions,
  focusSessions,
  habits,
  dailyStudyGoalMinutes = 180,
  targetFocusMinutes = 120
}: {
  tasks: Task[];
  studySessions: StudySession[];
  focusSessions: FocusSession[];
  habits: Habit[];
  dailyStudyGoalMinutes?: number;
  targetFocusMinutes?: number;
}): { summary: DailySummary; breakdown: ProductivityScoreBreakdown } {
  const todayStr = getISODateString(new Date());

  // 1. Task Metrics
  const relevantTasks = tasks.filter((t) => t.status !== 'archived');
  const completedTasks = relevantTasks.filter((t) => t.status === 'completed');
  const taskCount = relevantTasks.length;
  const completedCount = completedTasks.length;

  const taskScore = taskCount > 0 ? Math.min(100, Math.round((completedCount / taskCount) * 100)) : 0;

  // 2. Study Session Minutes Today
  const todayStudySessions = studySessions.filter((s) => isToday(s.completedAt || s.createdAt));
  const totalStudyMinutes = todayStudySessions.reduce((acc, curr) => acc + (curr.durationMinutes || 0), 0);
  const studyScore = Math.min(100, Math.round((totalStudyMinutes / Math.max(1, dailyStudyGoalMinutes)) * 100));

  // 3. Focus Minutes Today
  const todayFocusSessions = focusSessions.filter((f) => f.completed && isToday(f.createdAt));
  const totalFocusMinutes = todayFocusSessions.reduce((acc, curr) => acc + (curr.durationMinutes || 0), 0);
  const focusScore = Math.min(100, Math.round((totalFocusMinutes / Math.max(1, targetFocusMinutes)) * 100));

  // 4. Habit Completion Ratio Today
  const totalHabitsCount = habits.length;
  const completedHabitsCount = habits.filter((h) => h.completedToday || h.history[todayStr] === true).length;
  const habitScore = totalHabitsCount > 0 ? Math.round((completedHabitsCount / totalHabitsCount) * 100) : 0;

  // 5. Weighted Momentum Score Formula (Deterministic)
  // Weighting: 30% Tasks + 30% Study + 20% Focus + 20% Habits
  const totalMomentumScore = Math.min(
    100,
    Math.max(
      0,
      Math.round(
        taskScore * 0.3 +
        studyScore * 0.3 +
        focusScore * 0.2 +
        habitScore * 0.2
      )
    )
  );

  const summary: DailySummary = {
    date: todayStr,
    totalStudyMinutes,
    completedTasksCount: completedCount,
    totalTasksCount: taskCount,
    focusSessionsCount: todayFocusSessions.length,
    habitsCompletedRatio: `${completedHabitsCount}/${totalHabitsCount}`,
    momentumScore: totalMomentumScore
  };

  const breakdown: ProductivityScoreBreakdown = {
    taskScore,
    studyScore,
    focusScore,
    habitScore,
    totalMomentumScore
  };

  return { summary, breakdown };
}
