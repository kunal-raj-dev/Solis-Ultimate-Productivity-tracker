import { describe, it, expect } from 'vitest';
import {
  computeSoundscapeAffinity,
  computePeakFocusWindow,
  getFocusMilestone,
  formatPeakWindowLabel
} from '../sessionIntelligence';
import { FocusSession } from '../../../types/focus';

function session(partial: Partial<FocusSession>): FocusSession {
  return {
    id: 'f',
    mode: 'pomodoro',
    durationMinutes: 25,
    completed: true,
    createdAt: new Date(2026, 8, 23, 10, 0, 0).toISOString(),
    ...partial
  } as FocusSession;
}

describe('computeSoundscapeAffinity', () => {
  it('returns the highest-average soundscape with enough sessions', () => {
    const sessions = [
      session({ soundscapeType: 'pink_noise', flowQuality: 3 }),
      session({ soundscapeType: 'pink_noise', flowQuality: 4 }),
      session({ soundscapeType: 'binaural_alpha', flowQuality: 5 }),
      session({ soundscapeType: 'binaural_alpha', flowQuality: 5 }),
      session({ id: 'x', soundscapeType: 'rain', flowQuality: 5, completed: true })
    ];
    const best = computeSoundscapeAffinity(sessions);
    expect(best).toMatchObject({ soundscape: 'binaural_alpha', averageFlow: 5, sessionCount: 2 });
  });

  it('ignores none/unrated/incomplete sessions and under-sampled soundscapes', () => {
    const sessions = [
      session({ soundscapeType: 'none', flowQuality: 5 }),
      session({ soundscapeType: 'rain', flowQuality: 5 }),
      session({ id: 'p', soundscapeType: 'pink_noise', flowQuality: undefined }),
      session({ id: 'c', soundscapeType: 'pink_noise', flowQuality: 5, completed: false })
    ];
    expect(computeSoundscapeAffinity(sessions)).toBeNull();
  });
});

describe('computePeakFocusWindow', () => {
  it('finds the two-hour window with the best average flow', () => {
    const at = (h: number) => new Date(2026, 8, 23, h, 0, 0).toISOString();
    const sessions = [
      session({ id: '1', createdAt: at(9), flowQuality: 3 }),
      session({ id: '2', createdAt: at(10), flowQuality: 4 }),
      session({ id: '3', createdAt: at(9), flowQuality: 5 }),
      session({ id: '4', createdAt: at(20), flowQuality: 3 }),
      session({ id: '5', createdAt: at(21), flowQuality: 3 })
    ];
    const peak = computePeakFocusWindow(sessions, 2);
    expect(peak).toMatchObject({ startHour: 8, endHour: 10, sessionCount: 2, averageFlow: 4 });
  });

  it('returns null with too few rated sessions', () => {
    expect(computePeakFocusWindow([session({ flowQuality: 4 })], 3)).toBeNull();
  });
});

describe('milestones and labels', () => {
  it('recognizes exact milestones only', () => {
    expect(getFocusMilestone(100)).toBe(100);
    expect(getFocusMilestone(99)).toBeNull();
    expect(getFocusMilestone(250)).toBe(250);
  });

  it('formats peak window labels', () => {
    expect(formatPeakWindowLabel({ startHour: 9, endHour: 11, averageFlow: 4, sessionCount: 3 })).toBe('9am–11am');
    expect(formatPeakWindowLabel({ startHour: 14, endHour: 16, averageFlow: 4, sessionCount: 3 })).toBe('2pm–4pm');
  });
});
