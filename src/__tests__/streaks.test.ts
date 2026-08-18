import { describe, it, expect } from 'vitest';
import { calculateStreaks } from '../utils/streaks';

describe('Deterministic Habit Streak Engine', () => {
  it('returns 0 streak for empty habit history', () => {
    const res = calculateStreaks({}, '2026-08-17');
    expect(res.currentStreak).toBe(0);
    expect(res.longestStreak).toBe(0);
  });

  it('calculates current streak when today is completed', () => {
    const history = {
      '2026-08-17': true, // today
      '2026-08-16': true,
      '2026-08-15': true,
      '2026-08-14': false
    };

    const res = calculateStreaks(history, '2026-08-17');
    expect(res.currentStreak).toBe(3);
    expect(res.longestStreak).toBe(3);
  });

  it('preserves active streak from yesterday if today is not yet completed', () => {
    const history = {
      '2026-08-17': false, // today not yet completed
      '2026-08-16': true,  // yesterday completed
      '2026-08-15': true,  // 2 days ago completed
      '2026-08-14': true,
      '2026-08-13': false
    };

    const res = calculateStreaks(history, '2026-08-17');
    expect(res.currentStreak).toBe(3);
    expect(res.longestStreak).toBe(3);
  });

  it('resets current streak to 0 if both today and yesterday were missed', () => {
    const history = {
      '2026-08-17': false,
      '2026-08-16': false,
      '2026-08-15': true,
      '2026-08-14': true
    };

    const res = calculateStreaks(history, '2026-08-17');
    expect(res.currentStreak).toBe(0);
    expect(res.longestStreak).toBe(2);
  });

  it('tracks historical best longest streak properly', () => {
    const history = {
      '2026-08-01': true,
      '2026-08-02': true,
      '2026-08-03': true,
      '2026-08-04': true,
      '2026-08-05': true, // 5 day streak
      '2026-08-06': false, // gap
      '2026-08-16': true,
      '2026-08-17': true  // current streak = 2
    };

    const res = calculateStreaks(history, '2026-08-17');
    expect(res.currentStreak).toBe(2);
    expect(res.longestStreak).toBe(5);
  });
});
