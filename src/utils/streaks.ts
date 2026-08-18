import { getISODateString } from './date';

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

  // Start evaluating from either today (if done) or yesterday (if today is not yet done)
  let checkDate = new Date(`${todayStr}T00:00:00Z`);

  if (!todayCompleted) {
    // Check if yesterday was completed
    checkDate.setUTCDate(checkDate.getUTCDate() - 1);
  }

  while (true) {
    const checkDateStr = checkDate.toISOString().split('T')[0];
    if (history[checkDateStr] === true) {
      currentStreak++;
      checkDate.setUTCDate(checkDate.getUTCDate() - 1);
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
    const prevDate = new Date(`${completedDates[i - 1]}T00:00:00Z`);
    const currDate = new Date(`${completedDates[i]}T00:00:00Z`);

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
