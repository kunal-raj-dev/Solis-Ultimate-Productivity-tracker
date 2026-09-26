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
export type CloudStudyPactStatus = 'pending' | 'active' | 'completed' | 'cancelled';

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

/**
 * Multi-User Cloud Study Pact (Phase 1 / F-103)
 * Maps directly to public.study_pacts in Supabase PostgreSQL with RLS.
 */
export interface CloudStudyPact {
  id: ID;
  createdBy: string;
  creatorName: string;
  partnerId?: string | null;
  partnerName: string;
  partnerEmail?: string | null;
  inviteCode: string;
  sharedObjective?: string;
  subjectId?: string;
  subjectName?: string;
  weekStartDate: string;
  weekEndDate: string;
  creatorTargetMinutes: number;
  partnerTargetMinutes: number;
  creatorConfirmedMinutes: number;
  partnerConfirmedMinutes: number;
  status: CloudStudyPactStatus;
  createdAt: string;
  updatedAt: string;
  completedAt?: string | null;
  summary?: StudyPactWeekSummary;
}

export interface CreateStudyPactPayload {
  partnerName?: string;
  sharedObjective?: string;
  subjectId?: string;
  subjectName?: string;
  myWeeklyTargetMinutes: number;
  partnerWeeklyTargetMinutes: number;
  inviteCode?: string;
}

export interface NormalizedStudyPactView {
  id: ID;
  raw: CloudStudyPact;
  isCreator: boolean;
  isPartner: boolean;
  myName: string;
  partnerDisplayName: string;
  myTargetMinutes: number;
  myConfirmedMinutes: number;
  myProgressPercent: number;
  partnerTargetMinutes: number;
  partnerConfirmedMinutes: number;
  partnerProgressPercent: number;
  mutualCommitmentMet: boolean;
  status: CloudStudyPactStatus;
  inviteCode: string;
  sharedObjective?: string;
  subjectId?: string;
  subjectName?: string;
  weekStartDate: string;
  weekEndDate: string;
  isWeekOver: boolean;
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

/**
 * Generate a 6-character uppercase alphanumeric invite code.
 * Excludes ambiguous glyphs (0, O, 1, I).
 */
export function generatePactInviteCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

/**
 * Normalizes a CloudStudyPact from the perspective of the current user.
 * Ensures consistent presentation of "My Progress" vs "Partner's Progress"
 * regardless of whether the current user is the creator or the partner.
 */
export function normalizePactPerspective(
  pact: CloudStudyPact,
  currentUserId?: string
): NormalizedStudyPactView {
  // If no user ID provided (e.g. guest or testing), default to creator perspective
  const isCreator = !currentUserId || pact.createdBy === currentUserId;
  const isPartner = Boolean(currentUserId && pact.partnerId === currentUserId);

  const myName = isCreator
    ? pact.creatorName
    : isPartner
      ? pact.partnerName
      : 'You';

  const partnerDisplayName = isCreator
    ? (pact.partnerId
        ? pact.partnerName
        : pact.partnerName && pact.partnerName !== 'Pending Peer'
          ? pact.partnerName
          : 'Awaiting Partner...')
    : pact.creatorName;

  const myTargetMinutes = isCreator ? pact.creatorTargetMinutes : pact.partnerTargetMinutes;
  const myConfirmedMinutes = isCreator ? pact.creatorConfirmedMinutes : pact.partnerConfirmedMinutes;
  const partnerTargetMinutes = isCreator ? pact.partnerTargetMinutes : pact.creatorTargetMinutes;
  const partnerConfirmedMinutes = isCreator ? pact.partnerConfirmedMinutes : pact.creatorConfirmedMinutes;

  const myProgressPercent = myTargetMinutes > 0
    ? Math.min(100, Math.round((myConfirmedMinutes / myTargetMinutes) * 100))
    : 0;

  const partnerProgressPercent = partnerTargetMinutes > 0
    ? Math.min(100, Math.round((partnerConfirmedMinutes / partnerTargetMinutes) * 100))
    : 0;

  const mutualCommitmentMet =
    myConfirmedMinutes >= myTargetMinutes &&
    partnerConfirmedMinutes >= partnerTargetMinutes;

  const now = new Date();
  const end = new Date(pact.weekEndDate + 'T23:59:59.999');
  const isWeekOver = !isNaN(end.getTime()) && now.getTime() > end.getTime();

  return {
    id: pact.id,
    raw: pact,
    isCreator,
    isPartner,
    myName,
    partnerDisplayName,
    myTargetMinutes,
    myConfirmedMinutes,
    myProgressPercent,
    partnerTargetMinutes,
    partnerConfirmedMinutes,
    partnerProgressPercent,
    mutualCommitmentMet,
    status: pact.status,
    inviteCode: pact.inviteCode,
    sharedObjective: pact.sharedObjective,
    subjectId: pact.subjectId,
    subjectName: pact.subjectName,
    weekStartDate: pact.weekStartDate,
    weekEndDate: pact.weekEndDate,
    isWeekOver
  };
}

/**
 * Builds an anti-shame end-of-week summary for a CloudStudyPact.
 */
export function buildCloudPactSummary(
  pact: CloudStudyPact,
  currentUserId?: string
): StudyPactWeekSummary {
  const norm = normalizePactPerspective(pact, currentUserId);
  const myMet = norm.myConfirmedMinutes >= norm.myTargetMinutes;
  const partnerMet = norm.partnerConfirmedMinutes >= norm.partnerTargetMinutes;
  const mutualCommitmentMet = myMet && partnerMet;

  const myPart = myMet
    ? `You logged ${norm.myConfirmedMinutes} of your ${norm.myTargetMinutes} pledged minutes — commitment met.`
    : `You logged ${norm.myConfirmedMinutes} of your ${norm.myTargetMinutes} pledged minutes — every minute dedicated to learning counts.`;

  const partnerPart =
    pact.status === 'pending' || !pact.partnerId
      ? `Partner pledge: ${norm.partnerTargetMinutes} minutes (awaiting partner join).`
      : partnerMet
        ? `${norm.partnerDisplayName} confirmed ${norm.partnerConfirmedMinutes} of ${norm.partnerTargetMinutes} pledged minutes — commitment met.`
        : `${norm.partnerDisplayName} confirmed ${norm.partnerConfirmedMinutes} of ${norm.partnerTargetMinutes} pledged minutes.`;

  return {
    myMinutes: norm.myConfirmedMinutes,
    myTargetMinutes: norm.myTargetMinutes,
    partnerMinutes: norm.partnerConfirmedMinutes,
    partnerTargetMinutes: norm.partnerTargetMinutes,
    mutualCommitmentMet,
    narrative: `Week of ${norm.weekStartDate} → ${norm.weekEndDate}. ${myPart} ${partnerPart}`
  };
}

