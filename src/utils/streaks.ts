import { getISODateString, addDays } from './date';
import { Habit, HabitFrequency } from '../types/habit';

/**
 * Solis - Deterministic Streak Calculation Engine
 * Derives current streak and all-time best streak purely from immutable completion records.
 *
 * Frequency-aware (plan §1.1): a habit only "evaluates" on its scheduled days.
 * A `weekdays` habit stays alive across the weekend, a `weekends` habit stays
 * alive across the week, and `three_times_weekly` is evaluated with rolling
 * 7-day completion windows so rest days never break momentum. An optional
 * 1-day grace period ("never miss twice") keeps a single isolated miss from
 * resetting the streak to zero.
 */

export interface StreakResult {
  currentStreak: number;
  longestStreak: number;
}

export interface StreakCalculationOptions {
  frequency?: HabitFrequency;
  customDays?: number[]; // 0 = Sun, 1 = Mon ...
  allowGraceDays?: boolean;
  /**
   * Plan §3.4 "Streak Amnesty": local dates (YYYY-MM-DD) explicitly excused
   * after an absence. Amnesty days are transparent — never counted as
   * completions and never treated as misses — so a gentle re-entry keeps
   * habit continuity without fabricating history. Ignored by the
   * `three_times_weekly` rolling-window evaluation (its window already
   * counts only real completions).
   */
  amnestyDates?: string[];
  referenceDate?: Date;
}

/** Required completions inside a rolling 7-day window for `three_times_weekly`. */
const THREE_TIMES_WEEKLY_QUOTA = 3;
/** Days in a rolling evaluation window. */
const ROLLING_WINDOW_DAYS = 7;

/** Normalizes any reference date to local noon to avoid DST/timezone edges. */
const atLocalNoon = (date: Date): Date =>
  new Date(`${getISODateString(date)}T12:00:00`);

export function calculateStreaks(
  history: Record<string, boolean>,
  options?: StreakCalculationOptions | string
): StreakResult {
  if (!history || Object.keys(history).length === 0) {
    return { currentStreak: 0, longestStreak: 0 };
  }

  // Backward compatibility: a bare string is treated as the reference date.
  const opts: StreakCalculationOptions =
    typeof options === 'string' ? { referenceDate: new Date(`${options}T12:00:00`) } : options || {};

  const referenceDate = opts.referenceDate
    ? atLocalNoon(opts.referenceDate)
    : atLocalNoon(new Date());

  const frequency: HabitFrequency = opts.frequency || 'daily';
  const customDays = opts.customDays && opts.customDays.length > 0 ? opts.customDays : undefined;
  const allowGrace = opts.allowGraceDays === true;
  const amnestySet = new Set(opts.amnestyDates || []);

  const isScheduledDay = (date: Date): boolean => {
    if (customDays) return customDays.includes(date.getDay());
    switch (frequency) {
      case 'weekdays':
        return date.getDay() >= 1 && date.getDay() <= 5;
      case 'weekends':
        return date.getDay() === 0 || date.getDay() === 6;
      case 'three_times_weekly':
      case 'daily':
      default:
        return true;
    }
  };

  // `three_times_weekly` (without an explicit customDays schedule) is evaluated
  // with rolling 7-day windows: every day whose trailing window meets the
  // quota keeps the streak alive, so rest days never reset it.
  if (frequency === 'three_times_weekly' && !customDays) {
    return calculateRollingWindowStreaks(history, referenceDate, allowGrace);
  }

  return calculateScheduledDayStreaks(history, referenceDate, isScheduledDay, allowGrace, amnestySet);
}

/**
 * Streaks for habits evaluated on specific calendar days
 * (daily / weekdays / weekends / customDays schedules).
 */
function calculateScheduledDayStreaks(
  history: Record<string, boolean>,
  referenceDate: Date,
  isScheduledDay: (date: Date) => boolean,
  allowGrace: boolean,
  amnestySet: Set<string>
): StreakResult {
  const isAmnestyDay = (date: Date): boolean => amnestySet.has(getISODateString(date));
  const completedDates = Object.entries(history)
    .filter(([dateStr, completed]) => completed === true && new Date(`${dateStr}T12:00:00`) <= referenceDate)
    .map(([dateStr]) => dateStr)
    .sort();

  if (completedDates.length === 0) {
    return { currentStreak: 0, longestStreak: 0 };
  }

  // 1. Current streak. Walking backward from the reference date: the open
  // frontier after the last completion tolerates a limited run of missed
  // scheduled days — one by default (a single missed day never resets a
  // streak to zero), two when grace is active (the not-yet-done today plus
  // one recovery day). Beyond that run, or on a confirmed miss deeper in
  // history (bridged exactly once when grace is active), the walk stops.
  const maxFrontierMisses = allowGrace ? 2 : 1;
  let currentStreak = 0;
  let missedConsecutiveDays = 0;
  let frontierMisses = 0;
  let checkDate = referenceDate;

  while (true) {
    // Non-scheduled days (rest days) are transparent in both streak walks:
    // completions recorded on them are neither counted here nor by the
    // longest-streak walk, so both walks score identical history identically.
    if (!isScheduledDay(checkDate)) {
      checkDate = addDays(checkDate, -1);
      continue;
    }
    if (history[getISODateString(checkDate)] === true) {
      currentStreak++;
      missedConsecutiveDays = 0;
      checkDate = addDays(checkDate, -1);
      continue;
    }
    // Amnesty days (plan §3.4): excused absences are transparent misses —
    // they neither count as completions nor break the walk.
    if (isAmnestyDay(checkDate)) {
      checkDate = addDays(checkDate, -1);
      continue;
    }
    if (currentStreak === 0) {
      // Frontier miss (no completion counted yet): forgive up to the budget.
      frontierMisses++;
      if (frontierMisses > maxFrontierMisses) break;
      checkDate = addDays(checkDate, -1);
      continue;
    }
    // Confirmed miss (a completion was already counted): forgive exactly one
    // isolated miss when grace is active.
    if (allowGrace && missedConsecutiveDays === 0) {
      missedConsecutiveDays = 1;
      checkDate = addDays(checkDate, -1);
      continue;
    }
    break;
  }

  // 2. Longest historical streak — walk the scheduled-day timeline forward
  // from the first completion, bridging single confirmed misses with grace.
  let longestStreak = 0;
  let runLength = 0;
  let missedStreak = 0;

  let cursor = new Date(`${completedDates[0]}T12:00:00`);
  while (cursor <= referenceDate) {
    if (!isScheduledDay(cursor)) {
      cursor = addDays(cursor, 1);
      continue;
    }
    const key = getISODateString(cursor);
    if (history[key] === true) {
      runLength++;
      missedStreak = 0;
      if (runLength > longestStreak) longestStreak = runLength;
    } else if (isAmnestyDay(cursor)) {
      // Plan §3.4: excused absences bridge the longest-streak walk without
      // resetting the run and without counting as completions.
      cursor = addDays(cursor, 1);
      continue;
    } else {
      missedStreak++;
      if (!allowGrace || missedStreak >= 2) {
        runLength = 0;
      }
    }
    cursor = addDays(cursor, 1);
  }

  // Longest streak is at least as large as current streak
  if (currentStreak > longestStreak) {
    longestStreak = currentStreak;
  }

  return { currentStreak, longestStreak };
}

/**
 * Streaks for `three_times_weekly`: the streak stays alive on any day whose
 * trailing 7-day window contains the weekly completion quota. Grace lowers
 * the bar by one completion ("a single missed day never resets to zero").
 */
function calculateRollingWindowStreaks(
  history: Record<string, boolean>,
  referenceDate: Date,
  allowGrace: boolean
): StreakResult {
  const quota = allowGrace ? THREE_TIMES_WEEKLY_QUOTA - 1 : THREE_TIMES_WEEKLY_QUOTA;

  const countCompletionsInWindow = (windowEnd: Date): number => {
    let count = 0;
    for (let offset = 0; offset < ROLLING_WINDOW_DAYS; offset++) {
      if (history[getISODateString(addDays(windowEnd, -offset))] === true) count++;
    }
    return count;
  };

  // 1. Current streak — count consecutive day-anchors (walking backward from
  // the reference) whose trailing 7-day window meets the quota.
  let currentStreak = 0;
  let windowEnd = referenceDate;
  while (countCompletionsInWindow(windowEnd) >= quota) {
    currentStreak++;
    windowEnd = addDays(windowEnd, -1);
  }

  // 2. Longest streak — scan every window anchor from the first completion to
  // the reference and take the longest run of quota-satisfied windows.
  const completedDates = Object.entries(history)
    .filter(([dateStr, completed]) => completed === true && new Date(`${dateStr}T12:00:00`) <= referenceDate)
    .map(([dateStr]) => dateStr)
    .sort();

  let longestStreak = 0;
  if (completedDates.length > 0) {
    let runLength = 0;
    let anchor = new Date(`${completedDates[0]}T12:00:00`);
    while (anchor <= referenceDate) {
      if (countCompletionsInWindow(anchor) >= quota) {
        runLength++;
        if (runLength > longestStreak) longestStreak = runLength;
      } else {
        runLength = 0;
      }
      anchor = addDays(anchor, 1);
    }
  }

  if (currentStreak > longestStreak) {
    longestStreak = currentStreak;
  }

  return { currentStreak, longestStreak };
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
