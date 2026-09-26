import { RecurringStudyRoutine, DayOfWeek } from '../../types/planning';
import { StudyTopic } from '../../types/study';
import { addDays, getISODateString, startOfDay } from '../date';

/**
 * Solis — Forward Time Cushion Engine (plan §2.1 / master.md §6 "BUILD CANONICAL")
 *
 * Tells students the honest mathematical truth about exam readiness in hours,
 * not percentages: how many open study hours remain between now and the exam
 * date versus how many hours the unmastered syllabus still requires.
 *
 *   Days Remaining          = max(0, ceil((ExamDate - Today) / 86400000))
 *   Net Available Hours     = Σ_days (DailyCapacity(d) - ScheduledCommitments(d)) / 60
 *   Required Syllabus Hours = Σ_unmasteredTopics EstimatedHours(t)
 *   Time Cushion (Hours)    = Net Available Hours - Required Syllabus Hours
 *   Required Daily Pace     = Required Syllabus Hours / max(1, Days Remaining)
 *
 * Pure, deterministic functions only — no React state, no DOM or network
 * side effects (master.md §18 Architectural Boundaries).
 *
 * Conventions shared with `calculateExamReadiness` (masteryIntelligence.ts):
 * exam dates are parsed with `new Date(examDate)` so the days-remaining
 * formula is identical across both engines, while per-day date keys for the
 * commitments map are generated with the local-timezone helpers from
 * `src/utils/date.ts` (never UTC `toISOString().split('T')[0]`).
 */

const MS_PER_DAY = 1000 * 60 * 60 * 24;

/**
 * Deterministic per-topic remaining-effort estimate in hours.
 *
 * `StudyTopic` carries no stored duration estimate on the client type, so
 * remaining effort is derived from the mastery level itself: a first full
 * pass over an untouched topic is budgeted at 4h, a topic already being
 * learned is assumed to be roughly half done, and mastered topics require
 * nothing (they are excluded from the required sum regardless).
 */
export const TOPIC_ESTIMATED_HOURS: Record<StudyTopic['masteryLevel'], number> = {
  unstudied: 4,
  learning: 2,
  mastered: 0
};

/** Plan §2.3 color tokens: Sage (comfortable, +6h), Amber (tight, 0–3h), Terracotta (deficit). */
const COMFORTABLE_CUSHION_HOURS = 6;
const TIGHT_CUSHION_HOURS = 3;

export interface TimeCushionInput {
  examDate: string;
  subjectId: string;
  topics: StudyTopic[];
  dailyCapacityMinutes: number;
  existingCommitmentsMinutesByDay?: Record<string, number>;
  referenceDate?: Date;
}

export interface TimeCushionAnalysis {
  daysRemaining: number;
  grossAvailableHours: number;
  netAvailableStudyHours: number;
  estimatedHoursRequired: number;
  cushionHours: number; // positive = ahead, negative = deficit
  status: 'comfortable' | 'on_track' | 'tight' | 'critical_deficit';
  requiredHoursPerDay: number;
  deficitSeverityPercentage: number;
}

/**
 * Calm, canonical presentation metadata for a cushion status (plan §2.3).
 * Anti-shame: a deficit renders in terracotta (brand accent), never in a
 * guilt-pattern alert color.
 */
export const TIME_CUSHION_STATUS_META: Record<
  TimeCushionAnalysis['status'],
  { label: string; colorToken: string; badgeVariant: 'sage' | 'amber' | 'coral' }
> = {
  comfortable: { label: 'Comfortable', colorToken: 'var(--color-sage-500)', badgeVariant: 'sage' },
  on_track: { label: 'On Track', colorToken: 'var(--color-sage-500)', badgeVariant: 'sage' },
  tight: { label: 'Tight', colorToken: 'var(--color-amber-500)', badgeVariant: 'amber' },
  critical_deficit: { label: 'Deficit', colorToken: 'var(--color-coral-500)', badgeVariant: 'coral' }
};

/** Formats hours for UI copy: whole hours plain ("4"), fractional to 1 decimal ("2.4"). */
export function formatCushionHours(hours: number): string {
  const rounded = Math.round(Math.abs(hours) * 10) / 10;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
}

/**
 * Projects recurring weekly Routines (master.md §13) into a per-day
 * scheduled-commitments map (YYYY-MM-DD local keys → minutes) covering each
 * remaining day before the exam. Active routines only — inactive ones no
 * longer consume capacity.
 */
export function projectRoutineCommitmentsByDay(
  routines: RecurringStudyRoutine[],
  examDate: string,
  referenceDate: Date = new Date()
): Record<string, number> {
  const reference = startOfDay(referenceDate);
  const examMs = new Date(examDate).getTime();
  const daysRemaining = Number.isNaN(examMs)
    ? 0
    : Math.max(0, Math.ceil((examMs - referenceDate.getTime()) / MS_PER_DAY));

  const activeRoutines = routines.filter((r) => r.isActive && r.targetMinutes > 0);
  const commitments: Record<string, number> = {};

  for (let dayIndex = 0; dayIndex < daysRemaining; dayIndex++) {
    const day = addDays(reference, dayIndex);
    const dayKey = getISODateString(day);
    const weekday = day.getDay() as DayOfWeek;
    const committedMinutes = activeRoutines
      .filter((routine) => routine.daysOfWeek.includes(weekday))
      .reduce((sum, routine) => sum + routine.targetMinutes, 0);
    if (committedMinutes > 0) {
      commitments[dayKey] = committedMinutes;
    }
  }

  return commitments;
}

/**
 * Computes the forward Time Cushion for one exam goal (plan §2.1).
 * All outputs are raw deterministic hours; consumers format for display via
 * `formatCushionHours`.
 */
export function calculateTimeCushion(input: TimeCushionInput): TimeCushionAnalysis {
  const reference = input.referenceDate ?? new Date();

  // Days Remaining — same formula and date-parsing convention as
  // calculateExamReadiness so every countdown in the app agrees.
  const examMs = new Date(input.examDate).getTime();
  const daysRemaining = Number.isNaN(examMs)
    ? 0
    : Math.max(0, Math.ceil((examMs - reference.getTime()) / MS_PER_DAY));

  // Net Available Study Hours across the horizon. Per-day commitment lookup
  // uses local-timezone date keys; days absent from the map count as free.
  const capacityMinutes = Math.max(0, input.dailyCapacityMinutes);
  const commitments = input.existingCommitmentsMinutesByDay ?? {};
  const dayStart = startOfDay(reference);
  let grossAvailableMinutes = 0;
  let netAvailableMinutes = 0;
  for (let dayIndex = 0; dayIndex < daysRemaining; dayIndex++) {
    grossAvailableMinutes += capacityMinutes;
    const committedMinutes = commitments[getISODateString(addDays(dayStart, dayIndex))] ?? 0;
    netAvailableMinutes += capacityMinutes - committedMinutes;
  }

  // Required Syllabus Hours over unmastered topics of the exam's subject.
  const subjectTopics = input.subjectId
    ? input.topics.filter((t) => t.subjectId === input.subjectId)
    : input.topics;
  const estimatedHoursRequired = subjectTopics
    .filter((t) => t.masteryLevel !== 'mastered')
    .reduce((sum, t) => sum + (TOPIC_ESTIMATED_HOURS[t.masteryLevel] ?? 0), 0);

  const grossAvailableHours = grossAvailableMinutes / 60;
  const netAvailableStudyHours = netAvailableMinutes / 60;
  const cushionHours = netAvailableStudyHours - estimatedHoursRequired;
  const requiredHoursPerDay = estimatedHoursRequired / Math.max(1, daysRemaining);
  const deficitSeverityPercentage =
    estimatedHoursRequired > 0
      ? Math.round((Math.max(0, -cushionHours) / estimatedHoursRequired) * 100)
      : 0;

  let status: TimeCushionAnalysis['status'];
  if (estimatedHoursRequired <= 0) {
    // Nothing required — no deficit and no tightness is possible.
    status = 'comfortable';
  } else if (cushionHours >= COMFORTABLE_CUSHION_HOURS) {
    status = 'comfortable';
  } else if (cushionHours > TIGHT_CUSHION_HOURS) {
    status = 'on_track';
  } else if (cushionHours >= 0) {
    status = 'tight';
  } else {
    status = 'critical_deficit';
  }

  return {
    daysRemaining,
    grossAvailableHours,
    netAvailableStudyHours,
    estimatedHoursRequired,
    cushionHours,
    status,
    requiredHoursPerDay,
    deficitSeverityPercentage
  };
}
