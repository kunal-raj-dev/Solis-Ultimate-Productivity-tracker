import { describe, it, expect } from 'vitest';
import { calculateStreaks } from '../streaks';

/**
 * Plan §3.4 — "Streak Amnesty" engine contract.
 *
 * Amnesty dates are excused absences from the WelcomeBackModal gentle
 * re-entry flow: they are transparent misses that neither count as
 * completions nor break a streak, in either direction of both walks.
 * They never fabricate history — a completion is still required to grow
 * a streak.
 *
 * Week under test: Mon 2026-09-21 .. Sun 2026-09-27.
 */

const atNoon = (isoDate: string): Date => new Date(`${isoDate}T12:00:00`);

describe('StreakCalculationOptions.amnestyDates — plan §3.4 gentle re-entry', () => {
  it('bridges a multi-day absence in the current streak', () => {
    // Active Mon–Tue, absent Wed–Fri (amnesty), back with a completion Sat.
    const history = { '2026-09-21': true, '2026-09-22': true, '2026-09-26': true };
    const result = calculateStreaks(history, {
      frequency: 'daily',
      allowGraceDays: true,
      amnestyDates: ['2026-09-23', '2026-09-24', '2026-09-25'],
      referenceDate: atNoon('2026-09-26')
    });
    // Sat completion + Tue/Mon completions across the excused gap = 3.
    expect(result.currentStreak).toBe(3);
  });

  it('without amnesty the same absence breaks the current streak (grace bridges one day only)', () => {
    const history = { '2026-09-21': true, '2026-09-22': true, '2026-09-26': true };
    const result = calculateStreaks(history, {
      frequency: 'daily',
      allowGraceDays: true,
      referenceDate: atNoon('2026-09-26')
    });
    expect(result.currentStreak).toBe(1);
  });

  it('never fabricates completions: an excused day is not counted', () => {
    // Only the Mon completion exists; the whole week in between is amnesty.
    const history = { '2026-09-21': true };
    const result = calculateStreaks(history, {
      frequency: 'daily',
      allowGraceDays: true,
      amnestyDates: ['2026-09-22', '2026-09-23', '2026-09-24', '2026-09-25', '2026-09-26'],
      referenceDate: atNoon('2026-09-26')
    });
    expect(result.currentStreak).toBe(1);
  });

  it('bridges the absence in the longest-streak walk too', () => {
    const history = { '2026-09-21': true, '2026-09-22': true, '2026-09-26': true, '2026-09-27': true };
    const result = calculateStreaks(history, {
      frequency: 'daily',
      allowGraceDays: true,
      amnestyDates: ['2026-09-23', '2026-09-24', '2026-09-25'],
      referenceDate: atNoon('2026-09-27')
    });
    expect(result.currentStreak).toBe(4);
    expect(result.longestStreak).toBe(4);
  });

  it('still counts a completion recorded on an amnesty day', () => {
    const history = { '2026-09-21': true, '2026-09-23': true, '2026-09-24': true };
    const result = calculateStreaks(history, {
      frequency: 'daily',
      allowGraceDays: true,
      amnestyDates: ['2026-09-22', '2026-09-23'],
      referenceDate: atNoon('2026-09-24')
    });
    // Mon + Wed + Thu = 3 (Tue excused; the Wed completion is real).
    expect(result.currentStreak).toBe(3);
  });

  it('keeps non-scheduled rest-day semantics intact for a weekdays habit', () => {
    // Weekdays habit: Fri completion, weekend rest days, Mon completion.
    const history = { '2026-09-25': true, '2026-09-28': true };
    const result = calculateStreaks(history, {
      frequency: 'weekdays',
      allowGraceDays: true,
      referenceDate: atNoon('2026-09-28')
    });
    expect(result.currentStreak).toBe(2);
  });

  it('amnesty respects customDays schedules', () => {
    // customDays = [1, 3, 5] (Mon, Wed, Fri): the absence spans two scheduled
    // days (Wed 09-23 + Fri 09-25). Excusing both keeps Mon->Mon continuity —
    // grace alone can only bridge one scheduled miss.
    const history = { '2026-09-21': true, '2026-09-28': true };
    const result = calculateStreaks(history, {
      frequency: 'daily',
      customDays: [1, 3, 5],
      allowGraceDays: true,
      amnestyDates: ['2026-09-23', '2026-09-25'],
      referenceDate: atNoon('2026-09-28')
    });
    expect(result.currentStreak).toBe(2);
  });

  it('without amnesty two consecutive scheduled misses still break the streak', () => {
    // Same customDays schedule without the amnesty days: grace bridges exactly
    // one scheduled miss, so the second one stops the walk.
    const history = { '2026-09-21': true, '2026-09-28': true };
    const result = calculateStreaks(history, {
      frequency: 'daily',
      customDays: [1, 3, 5],
      allowGraceDays: true,
      referenceDate: atNoon('2026-09-28')
    });
    expect(result.currentStreak).toBe(1);
  });
});
