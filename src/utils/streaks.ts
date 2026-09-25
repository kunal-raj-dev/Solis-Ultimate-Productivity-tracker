import { getISODateString, addDays } from './date';
import { Habit } from '../types/habit';

/**
 * Solis - Deterministic Streak Calculation Engine
 * Derives current streak and all-time best streak purely from immutable completion records.
 */

export interface StreakResult {
  currentStreak: number;
  longestStreak: number;
}

export function calculateStreaks(
  history: Record<string, boolean>,
  referenceDateStr?: string
): StreakResult {
  if (!history || Object.keys(history).length === 0) {
    return { currentStreak: 0, longestStreak: 0 };
  }

  const todayStr = referenceDateStr || getISODateString(new Date());

  // 1. Calculate Current Streak
  let currentStreak = 0;
  const todayCompleted = history[todayStr] === true;

  // Use noon local time to avoid any timezone/DST transitions
  let checkDate = new Date(`${todayStr}T12:00:00`);

  if (!todayCompleted) {
    // Check if yesterday was completed
    checkDate = addDays(checkDate, -1);
  }

  while (true) {
    const checkDateStr = getISODateString(checkDate);
    if (history[checkDateStr] === true) {
      currentStreak++;
      checkDate = addDays(checkDate, -1);
    } else {
      break;
    }
  }

  // 2. Calculate Longest Historical Streak
  // Extract all completed dates, sort them ascendingly
  const completedDates = Object.entries(history)
    .filter(([_, completed]) => completed === true)
    .map(([dateStr]) => dateStr)
    .sort();

  if (completedDates.length === 0) {
    return { currentStreak: 0, longestStreak: 0 };
  }

  let longestStreak = 1;
  let currentRun = 1;

  for (let i = 1; i < completedDates.length; i++) {
    const prevDate = new Date(`${completedDates[i - 1]}T12:00:00`);
    const currDate = new Date(`${completedDates[i]}T12:00:00`);

    const diffDays = Math.round(
      (currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (diffDays === 1) {
      currentRun++;
      if (currentRun > longestStreak) {
        longestStreak = currentRun;
      }
    } else if (diffDays > 1) {
      currentRun = 1;
    }
    // If diffDays === 0 (duplicate), ignore
  }

  // Longest streak is at least as large as current streak
  if (currentStreak > longestStreak) {
    longestStreak = currentStreak;
  }

  return {
    currentStreak,
    longestStreak
  };
}

/**
 * Calculates overall active habit streak across a collection of habits.
 */
export function calculateOverallHabitStreak(habits: Habit[]): number {
  if (!habits || habits.length === 0) return 0;
  return Math.max(...habits.map((h) => h.currentStreak || 0), 0);
}

/**
 * Calculates consecutive daily study streak from study sessions.
 */
export function calculateStudyStreak(
  sessions: Array<{ completedAt?: string; createdAt?: string }>,
  referenceDateStr?: string
): number {
  const datesSet: Record<string, boolean> = {};
  for (const s of sessions) {
    const raw = s.completedAt || s.createdAt;
    if (raw) {
      const d = new Date(raw);
      if (!isNaN(d.getTime())) {
        datesSet[getISODateString(d)] = true;
      }
    }
  }
  return calculateStreaks(datesSet, referenceDateStr).currentStreak;
}
