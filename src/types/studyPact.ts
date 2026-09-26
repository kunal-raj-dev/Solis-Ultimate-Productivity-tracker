/**
 * Solis — Plan §8.3: Study Pact Accountability System
 *
 * Pairs two students in weekly mutual goal commitments and produces automatic
 * end-of-week progress summaries. Pure types + deterministic helpers only
 * (master.md §18): no React state, no DOM/network side effects. Persistence
 * is owned by the feature page; progress is computed from real logged
 * StudySessions via dataService — never invented.
 */

import { ID } from './common';
import { StudySession } from './study';

export type StudyPactStatus = 'active' | 'completed';

export interface StudyPact {
  id: ID;
  /** Accountability partner's display name (peer, not a Supabase profile). */
  partnerName: string;
  /** Shared focus for the week, e.g. "Finish Chapter 6 problem sets". */
  sharedObjective?: string;
  /** Optional subject the pact is scoped to; otherwise all sessions count. */
  subjectId?: ID;
  subjectName?: string;
  /** Local `YYYY-MM-DD` week window (Monday → Sunday, inclusive). */
  weekStartDate: string;
  weekEndDate: string;
  /** The caller's pledged minutes for the week. */
  myWeeklyTargetMinutes: number;
  /** The partner's pledged minutes for the week. */
  partnerWeeklyTargetMinutes: number;
  /**
   * Minutes the partner has personally confirmed this week. Partners run
   * their own Solis (or any tracker); this value is recorded from their
   * check-in, never estimated — no simulated peer progress.
   */
  partnerConfirmedMinutes?: number;
  status: StudyPactStatus;
  createdAt: string;
  completedAt?: string;
  summary?: StudyPactWeekSummary;
}

export interface StudyPactWeekSummary {
  myMinutes: number;
  myTargetMinutes: number;
  /** null until the partner confirms their week. */
  partnerMinutes: number | null;
  partnerTargetMinutes: number;
  mutualCommitmentMet: boolean;
  /** Calm, anti-shame narrative (master.md §4 principle 7 tone). */
  narrative: string;
}

export interface StudyPactWeekWindow {
  start: Date;
  end: Date;
  startKey: string;
  endKey: string;
}

/** `YYYY-MM-DD` local date key (never UTC `toISOString().split('T')[0]`). */
function toLocalDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * The pact week window: Monday 00:00 → Sunday 23:59:59.999 in the user's
 * local timezone (mirrors the app's Monday-first week convention).
 */
export function getPactWeekWindow(referenceDate: Date = new Date()): StudyPactWeekWindow {
  const start = new Date(referenceDate);
  start.setHours(0, 0, 0, 0);
  const day = start.getDay(); // 0 = Sunday … 6 = Saturday
  const daysSinceMonday = (day + 6) % 7;
  start.setDate(start.getDate() - daysSinceMonday);

  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  end.setHours(23, 59, 59, 999);

  return { start, end, startKey: toLocalDateKey(start), endKey: toLocalDateKey(end) };
}

/**
 * True when the pact's week window has fully elapsed relative to `now`
 * (i.e. the summary should be frozen automatically).
 */
export function isPactWeekOver(pact: StudyPact, now: Date = new Date()): boolean {
  const end = new Date(pact.weekEndDate + 'T23:59:59.999');
  if (isNaN(end.getTime())) return false;
  return now.getTime() > end.getTime();
}

/**
 * Minutes actually logged (from real StudySessions) inside the pact's week
 * window. When the pact names a subject, only that subject's sessions count.
 */
export function computePactMinutesThisWeek(
  pact: StudyPact,
  sessions: StudySession[]
): number {
  const start = new Date(pact.weekStartDate + 'T00:00:00');
  const end = new Date(pact.weekEndDate + 'T23:59:59.999');
  if (isNaN(start.getTime()) || isNaN(end.getTime())) return 0;

  return sessions.reduce((total, session) => {
    const completedAt = new Date(session.completedAt);
    if (isNaN(completedAt.getTime())) return total;
    if (completedAt.getTime() < start.getTime() || completedAt.getTime() > end.getTime()) {
      return total;
    }
    if (pact.subjectId && session.subjectId !== pact.subjectId) {
      return total;
    }
    const minutes = Math.max(0, Math.round(session.durationMinutes || 0));
    return total + minutes;
  }, 0);
}

/**
 * Deterministic end-of-week summary. Calm, honest, anti-shame: never frames a
 * partial week as failure, and leaves the partner's side open until they
 * confirm it (no simulated peer data).
 */
export function buildPactWeekSummary(
  pact: StudyPact,
  myMinutes: number
): StudyPactWeekSummary {
  const partnerMinutes =
    typeof pact.partnerConfirmedMinutes === 'number'
      ? Math.max(0, Math.round(pact.partnerConfirmedMinutes))
      : null;
  const myMet = myMinutes >= pact.myWeeklyTargetMinutes;
  const partnerMet = partnerMinutes !== null && partnerMinutes >= pact.partnerWeeklyTargetMinutes;
  const mutualCommitmentMet = myMet && (partnerMinutes === null ? false : partnerMet);

  const myPart = myMet
    ? `You logged ${myMinutes} of your ${pact.myWeeklyTargetMinutes} pledged minutes — commitment met.`
    : `You logged ${myMinutes} of your ${pact.myWeeklyTargetMinutes} pledged minutes — every session counts, and the hours are real.`;

  const partnerPart =
    partnerMinutes === null
      ? `Partner pledge: ${pact.partnerWeeklyTargetMinutes} minutes (awaiting their check-in).`
      : partnerMet
        ? `Partner confirmed ${partnerMinutes} of ${pact.partnerWeeklyTargetMinutes} pledged minutes — commitment met.`
        : `Partner confirmed ${partnerMinutes} of ${pact.partnerWeeklyTargetMinutes} pledged minutes.`;

  return {
    myMinutes,
    myTargetMinutes: pact.myWeeklyTargetMinutes,
    partnerMinutes,
    partnerTargetMinutes: pact.partnerWeeklyTargetMinutes,
    mutualCommitmentMet,
    narrative: `Week of ${pact.weekStartDate} → ${pact.weekEndDate}. ${myPart} ${partnerPart}`
  };
}

/** Construction with validation; returns null when the pledge is not usable. */
export function createStudyPact(input: {
  id?: ID;
  partnerName: string;
  sharedObjective?: string;
  subjectId?: ID;
  subjectName?: string;
  myWeeklyTargetMinutes: number;
  partnerWeeklyTargetMinutes: number;
  now?: Date;
}): StudyPact | null {
  const partnerName = (input.partnerName || '').trim();
  if (partnerName.length < 2) return null;
  const myMinutes = Math.round(input.myWeeklyTargetMinutes);
  const partnerMinutes = Math.round(input.partnerWeeklyTargetMinutes);
  if (!Number.isFinite(myMinutes) || myMinutes < 15) return null;
  if (!Number.isFinite(partnerMinutes) || partnerMinutes < 15) return null;

  const now = input.now ? new Date(input.now.getTime()) : new Date();
  const window = getPactWeekWindow(now);

  return {
    id: input.id || `pact_${now.getTime()}`,
    partnerName,
    sharedObjective: input.sharedObjective?.trim() || undefined,
    subjectId: input.subjectId || undefined,
    subjectName: input.subjectName || undefined,
    weekStartDate: window.startKey,
    weekEndDate: window.endKey,
    myWeeklyTargetMinutes: myMinutes,
    partnerWeeklyTargetMinutes: partnerMinutes,
    status: 'active',
    createdAt: now.toISOString()
  };
}

/**
 * Passive quiet peer presence (plan §8.3): anonymous count of scholars inside
 * running rooms right now. Derived purely from real room state — zero when
 * nobody is focusing, and never padded.
 */
export function countScholarsFocusingNow(
  rooms: Array<{ timerState?: string; participantsCount?: number }>
): number {
  return rooms.reduce(
    (total, room) =>
      room.timerState === 'running' ? total + Math.max(0, room.participantsCount ?? 0) : total,
    0
  );
}
