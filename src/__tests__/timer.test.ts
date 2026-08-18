import { describe, it, expect } from 'vitest';
import { calculateTimerRemaining } from '../utils/timer';

describe('Timestamp-based Timer Calculation Engine', () => {
  it('returns total duration when idle', () => {
    const res = calculateTimerRemaining(null, null, 'idle', 1500);
    expect(res).toBe(1500);
  });

  it('returns exact remaining seconds derived from future target timestamp', () => {
    const futureMs = Date.now() + 60000; // 60 seconds from now
    const res = calculateTimerRemaining(futureMs, null, 'running', 1500);
    expect(res).toBeGreaterThanOrEqual(59);
    expect(res).toBeLessThanOrEqual(60);
  });

  it('returns paused remaining seconds accurately when paused', () => {
    const pausedMs = 45000; // 45 seconds paused remaining
    const res = calculateTimerRemaining(null, pausedMs, 'paused', 1500);
    expect(res).toBe(45);
  });

  it('returns 0 when completed or cancelled', () => {
    expect(calculateTimerRemaining(null, null, 'completed', 1500)).toBe(0);
    expect(calculateTimerRemaining(null, null, 'cancelled', 1500)).toBe(0);
  });
});
