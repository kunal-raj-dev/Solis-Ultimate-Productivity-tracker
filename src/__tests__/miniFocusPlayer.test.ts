import { describe, it, expect } from 'vitest';
import { formatTime, calculateTimerRemaining } from '../utils/timer';

describe('Phase 8 — Mini Focus Player & Timer Architecture Continuity', () => {
  it('formats remaining seconds accurately into MM:SS display strings', () => {
    expect(formatTime(1500)).toBe('25:00');
    expect(formatTime(1421)).toBe('23:41');
    expect(formatTime(65)).toBe('01:05');
    expect(formatTime(9)).toBe('00:09');
    expect(formatTime(0)).toBe('00:00');
  });

  it('calculates remaining seconds truthfully from target timestamp while running', () => {
    const now = Date.now();
    const targetEndTimeMs = now + 120000; // 2 minutes in future

    const remaining = calculateTimerRemaining(targetEndTimeMs, null, 'running', 1500);
    expect(remaining).toBe(120);
  });

  it('preserves paused remaining time accurately regardless of elapsed real time', () => {
    const pausedRemainingMs = 45000; // 45 seconds paused
    const targetEndTimeMs = Date.now() + 100000; // Stale timestamp

    const remaining = calculateTimerRemaining(targetEndTimeMs, pausedRemainingMs, 'paused', 1500);
    expect(remaining).toBe(45);
  });

  it('clamps remaining seconds to 0 when target timestamp is passed', () => {
    const now = Date.now();
    const pastEndTimeMs = now - 5000; // 5 seconds in the past

    const remaining = calculateTimerRemaining(pastEndTimeMs, null, 'running', 1500);
    expect(remaining).toBe(0);
  });

  it('returns full duration when status is idle', () => {
    const remaining = calculateTimerRemaining(null, null, 'idle', 3000);
    expect(remaining).toBe(3000);
  });
});
