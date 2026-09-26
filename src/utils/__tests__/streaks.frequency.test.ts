import { describe, it, expect } from 'vitest';
import { calculateStreaks } from '../streaks';

/**
 * Phase 0 — Streak Frequency Test Harness (plan §0.1 / §1.1)
 *
 * The "daily baseline" tests characterize already-correct calendar-day
 * behaviour of `calculateStreaks` and run live.
 *
 * The `HabitFrequency` matrix (weekdays / weekends / three_times_weekly /
 * customDays / grace days) pins the Phase 1.1 contract
 * (`StreakCalculationOptions`: frequency, customDays, allowGraceDays,
 * referenceDate) of the Frequency-Aware Habit Streak Engine. The engine now
 * implements that contract, so the full matrix runs live.
 */

// Local-noon reference dates keep weekday math timezone-safe (mirrors the
// engine's own "noon local time" convention). Week under test:
// Mon 2026-09-21 .. Sun 2026-09-27, next Mon 2026-09-28.
const atNoon = (isoDate: string): Date => new Date(`${isoDate}T12:00:00`);

describe('calculateStreaks — daily baseline (already-correct behaviour, runs live)', () => {
  it('returns zeroed streaks for an empty history', () => {
    expect(calculateStreaks({}, '2026-09-24')).toEqual({ currentStreak: 0, longestStreak: 0 });
  });

  it('counts consecutive daily completions ending yesterday when today is not yet done', () => {
    const history = { '2026-09-21': true, '2026-09-22': true, '2026-09-23': true };
    expect(calculateStreaks(history, '2026-09-24')).toEqual({ currentStreak: 3, longestStreak: 3 });
  });

  it('includes today when today is completed', () => {
    const history = { '2026-09-23': true, '2026-09-24': true };
    expect(calculateStreaks(history, '2026-09-24').currentStreak).toBe(2);
  });

  it('breaks the current streak at the first missing calendar day', () => {
    const history = { '2026-09-21': true, '2026-09-23': true };
    const result = calculateStreaks(history, '2026-09-24');
    expect(result.currentStreak).toBe(1);
    expect(result.longestStreak).toBe(1);
  });

  it('keeps the all-time best streak even when the current run is shorter', () => {
    const history = {
      '2026-09-14': true,
      '2026-09-15': true,
      '2026-09-16': true,
      '2026-09-23': true
    };
    const result = calculateStreaks(history, '2026-09-24');
    expect(result.currentStreak).toBe(1);
    expect(result.longestStreak).toBe(3);
  });

  it('treats explicitly recorded false days like missing days', () => {
    const history = { '2026-09-22': false, '2026-09-23': true };
    expect(calculateStreaks(history, '2026-09-24').currentStreak).toBe(1);
  });
});

describe('HabitFrequency matrix — Phase 1.1 contract (frequency-aware streak engine)', () => {
  // Frequency-aware engine contract (plan §1.1): every test in this block
  // exercises the StreakCalculationOptions signature.

  it('UNSKIP in Phase 1.1: daily frequency keeps counting plain calendar days', () => {
    const history = { '2026-09-21': true, '2026-09-22': true, '2026-09-23': true };
    const result = calculateStreaks(history, {
      frequency: 'daily',
      referenceDate: atNoon('2026-09-24')
    });
    expect(result.currentStreak).toBe(3);
  });

  it('UNSKIP in Phase 1.1: weekdays frequency keeps a Friday streak alive on Saturday', () => {
    const history = { '2026-09-25': true };
    const result = calculateStreaks(history, {
      frequency: 'weekdays',
      referenceDate: atNoon('2026-09-26') // Saturday — non-evaluating skip day
    });
    expect(result.currentStreak).toBe(1);
  });

  it('UNSKIP in Phase 1.1: weekdays frequency keeps a Friday streak alive on Sunday', () => {
    const history = { '2026-09-25': true };
    const result = calculateStreaks(history, {
      frequency: 'weekdays',
      referenceDate: atNoon('2026-09-27') // Sunday — non-evaluating skip day
    });
    expect(result.currentStreak).toBe(1);
  });

  it('UNSKIP in Phase 1.1: weekdays frequency counts consecutive weekday completions', () => {
    const history = {
      '2026-09-21': true, // Mon
      '2026-09-22': true, // Tue
      '2026-09-23': true, // Wed
      '2026-09-24': true, // Thu
      '2026-09-25': true // Fri
    };
    const result = calculateStreaks(history, {
      frequency: 'weekdays',
      referenceDate: atNoon('2026-09-25')
    });
    expect(result.currentStreak).toBe(5);
  });

  it('UNSKIP in Phase 1.1: weekdays frequency bridges the weekend without resetting', () => {
    const history = {
      '2026-09-21': true, // Mon
      '2026-09-22': true, // Tue
      '2026-09-23': true, // Wed
      '2026-09-24': true, // Thu
      '2026-09-25': true, // Fri
      '2026-09-28': true // Mon (next week)
    };
    const result = calculateStreaks(history, {
      frequency: 'weekdays',
      referenceDate: atNoon('2026-09-28')
    });
    expect(result.currentStreak).toBe(6);
  });

  it('UNSKIP in Phase 1.1: weekdays frequency breaks on a missed evaluating weekday', () => {
    const history = {
      '2026-09-21': true, // Mon
      '2026-09-22': true, // Tue
      // Wed 2026-09-23 missed — an evaluating day for a weekdays habit
      '2026-09-24': true, // Thu
      '2026-09-25': true // Fri
    };
    const result = calculateStreaks(history, {
      frequency: 'weekdays',
      referenceDate: atNoon('2026-09-25')
    });
    expect(result.currentStreak).toBe(2);
  });

  it('UNSKIP in Phase 1.1: weekends frequency keeps a Saturday streak alive across weekdays', () => {
    const history = { '2026-09-26': true }; // Sat
    const result = calculateStreaks(history, {
      frequency: 'weekends',
      referenceDate: atNoon('2026-09-30') // Wed — non-evaluating skip day
    });
    expect(result.currentStreak).toBe(1);
  });

  it('UNSKIP in Phase 1.1: weekends frequency counts consecutive weekend completions', () => {
    const history = {
      '2026-09-26': true, // Sat
      '2026-09-27': true // Sun
    };
    const result = calculateStreaks(history, {
      frequency: 'weekends',
      referenceDate: atNoon('2026-09-27')
    });
    expect(result.currentStreak).toBe(2);
  });

  it('UNSKIP in Phase 1.1: weekends frequency breaks on a missed evaluating weekend day', () => {
    const history = {
      '2026-09-26': true, // Sat
      // Sun 2026-09-27 missed — an evaluating day for a weekends habit
      '2026-10-03': true // Sat (next weekend)
    };
    const result = calculateStreaks(history, {
      frequency: 'weekends',
      referenceDate: atNoon('2026-10-03')
    });
    expect(result.currentStreak).toBe(1);
  });

  it('UNSKIP in Phase 1.1: three_times_weekly stays alive with 3 completions in the rolling 7-day window', () => {
    const history = {
      '2026-09-22': true, // Tue
      '2026-09-24': true, // Thu
      '2026-09-26': true // Sat
    };
    const result = calculateStreaks(history, {
      frequency: 'three_times_weekly',
      referenceDate: atNoon('2026-09-28') // window 2026-09-22 .. 2026-09-28
    });
    expect(result.currentStreak).toBeGreaterThanOrEqual(1);
  });

  it('UNSKIP in Phase 1.1: three_times_weekly resets with fewer than 3 completions in the window', () => {
    const history = {
      '2026-09-22': true, // Tue
      '2026-09-24': true // Thu — only 2 completions inside the window
    };
    const result = calculateStreaks(history, {
      frequency: 'three_times_weekly',
      referenceDate: atNoon('2026-09-28')
    });
    expect(result.currentStreak).toBe(0);
  });

  it('UNSKIP in Phase 1.1: three_times_weekly ignores completions just outside the 7-day window', () => {
    const history = {
      '2026-09-21': true, // 7 days before the reference — one day before the
      // rolling window starts (window = referenceDate-6 .. referenceDate = 2026-09-22 .. 2026-09-28)
      '2026-09-24': true,
      '2026-09-26': true
    };
    const result = calculateStreaks(history, {
      frequency: 'three_times_weekly',
      referenceDate: atNoon('2026-09-28') // window 2026-09-22 .. 2026-09-28
    });
    expect(result.currentStreak).toBe(0);
  });

  it('UNSKIP in Phase 1.1: a single missed day with grace active never resets the streak to zero', () => {
    const history = {
      '2026-09-21': true, // Mon
      '2026-09-22': true // Tue
      // Wed 2026-09-23 missed (single miss), Thu 2026-09-24 not yet done
    };
    const result = calculateStreaks(history, {
      frequency: 'daily',
      allowGraceDays: true,
      referenceDate: atNoon('2026-09-24')
    });
    // "Never miss twice": one isolated miss enters recovery, never zeroes out.
    expect(result.currentStreak).toBeGreaterThan(0);
  });

  it('UNSKIP in Phase 1.1: customDays frequency keeps the streak alive across non-scheduled days', () => {
    const history = { '2026-09-25': true }; // Fri — in customDays [Mon, Wed, Fri]
    const result = calculateStreaks(history, {
      customDays: [1, 3, 5],
      referenceDate: atNoon('2026-09-27') // Sun — not a scheduled day
    });
    expect(result.currentStreak).toBeGreaterThanOrEqual(1);
  });
});
