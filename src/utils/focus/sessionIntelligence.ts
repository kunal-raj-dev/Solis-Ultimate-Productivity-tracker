import { FocusSession, SoundscapeType } from '../../types/focus';
import { getISODateString } from '../date';

/**
 * Phase 6 — session-level intelligence (P6.1/P6.2/P6.3).
 * Deterministic personalization signals derived from the learner's own focus
 * history: peak focus windows, soundscape-flow affinity, and session
 * milestones. Pure functions, fully testable.
 */

export interface SoundscapeAffinity {
  soundscape: SoundscapeType;
  averageFlow: number;
  sessionCount: number;
}

/**
 * P6.2 — which soundscape correlates with the learner's highest flow.
 * Only soundscapes with at least `minSessions` rated sessions qualify.
 */
export function computeSoundscapeAffinity(
  focusSessions: FocusSession[],
  minSessions = 2
): SoundscapeAffinity | null {
  const bySoundscape = new Map<SoundscapeType, { total: number; count: number }>();
  for (const f of focusSessions) {
    if (!f.completed || !f.soundscapeType || f.soundscapeType === 'none') continue;
    if (typeof f.flowQuality !== 'number' || f.flowQuality <= 0) continue;
    const entry = bySoundscape.get(f.soundscapeType) || { total: 0, count: 0 };
    entry.total += f.flowQuality;
    entry.count += 1;
    bySoundscape.set(f.soundscapeType, entry);
  }

  let best: SoundscapeAffinity | null = null;
  bySoundscape.forEach((entry, soundscape) => {
    if (entry.count < minSessions) return;
    const averageFlow = entry.total / entry.count;
    if (!best || averageFlow > best.averageFlow) {
      best = { soundscape, averageFlow, sessionCount: entry.count };
    }
  });
  return best;
}

export interface PeakFocusWindow {
  startHour: number;
  endHour: number;
  averageFlow: number;
  sessionCount: number;
}

/**
 * P6.1 — the learner's best 2-hour focus window by historical flow quality.
 * Returns null until at least `minSessions` rated sessions exist.
 */
export function computePeakFocusWindow(
  focusSessions: FocusSession[],
  minSessions = 3
): PeakFocusWindow | null {
  const rated = focusSessions.filter(
    (f) => f.completed && typeof f.flowQuality === 'number' && f.flowQuality > 0 && f.createdAt
  );
  if (rated.length < minSessions) return null;

  // 12 two-hour buckets covering 0-24h.
  const buckets = new Map<number, { total: number; count: number }>();
  for (const f of rated) {
    const hour = new Date(f.createdAt as string).getHours();
    const bucket = Math.floor(hour / 2) * 2;
    const entry = buckets.get(bucket) || { total: 0, count: 0 };
    entry.total += f.flowQuality as number;
    entry.count += 1;
    buckets.set(bucket, entry);
  }

  let best: PeakFocusWindow | null = null;
  buckets.forEach((entry, startHour) => {
    if (entry.count < minSessions) return;
    const averageFlow = entry.total / entry.count;
    if (!best || averageFlow > best.averageFlow) {
      best = { startHour, endHour: startHour + 2, averageFlow, sessionCount: entry.count };
    }
  });
  return best;
}

/** Focus-count milestones — acknowledged once, at exact hits. */
export const FOCUS_SESSION_MILESTONES = [10, 25, 50, 100, 250, 500] as const;

/**
 * P6.3 — returns the milestone just reached by the learner's completed
 * session `count`, or null when `count` is not a milestone.
 */
export function getFocusMilestone(count: number): number | null {
  return (FOCUS_SESSION_MILESTONES as readonly number[]).includes(count) ? count : null;
}

/** "9–11am"-style label for a peak window. */
export function formatPeakWindowLabel(window: PeakFocusWindow): string {
  const fmt = (h: number) => {
    if (h === 0) return '12am';
    if (h === 12) return '12pm';
    return h < 12 ? `${h}am` : `${h - 12}pm`;
  };
  return `${fmt(window.startHour)}–${fmt(window.endHour)}`;
}

export function getTodayKey(reference: Date = new Date()): string {
  return getISODateString(reference);
}
