/**
 * Deterministic 5-Sentence Weekly Narrative Report (plan §5.6, audit item #23)
 *
 * Converts a `SolisIntelligenceReport` into an encouraging five-sentence
 * paragraph covering: study volume, rhythm, top subject, neglected area, and
 * the strategic goal for next week. Pure and deterministic — same input always
 * yields the same string; works with zero data and zero AI keys
 * (master.md §4.4 "Deterministic First, AI Optional").
 */

import { SolisIntelligenceReport } from './types';
import { getISODateString } from '../date';

export interface WeeklyNarrative {
  /** Exactly five sentences joined into one paragraph. */
  paragraph: string;
  sentences: [string, string, string, string, string];
}

function formatHours(hours: number): string {
  return hours.toFixed(1);
}

/**
 * Builds the 5-sentence weekly narrative from the intelligence report.
 * Anti-shame tone (master.md §4.7): absences and neglected areas are framed
 * as gentle invitations, never guilt.
 */
export function generateWeeklyNarrativeReport(report: SolisIntelligenceReport): WeeklyNarrative {
  const { rhythm, attention, recommendations } = report;

  // Sentence 1 — study volume
  const studyHours = formatHours(rhythm.totalStudyHours);
  const activeDays = rhythm.activeStudyDaysCount;
  const volumeSentence =
    rhythm.totalStudyMinutes > 0
      ? `This week you logged ${studyHours} hours of focused study across ${activeDays} active day${activeDays === 1 ? '' : 's'}.`
      : 'This week was a quiet one for logged study time, and that is completely okay.';

  // Sentence 2 — rhythm & consistency
  const consistency = Math.round(rhythm.consistencyPercentage);
  const rhythmSentence =
    rhythm.totalStudyMinutes > 0
      ? consistency >= 70
        ? `Your rhythm was steady and dependable, with ${consistency}% of your days carrying real momentum.`
        : consistency >= 40
        ? `Your rhythm had a natural ebb and flow this week, active on ${consistency}% of days.`
        : `Your rhythm was gentle this week with ${consistency}% of days active — every session still counts.`
      : 'Your rhythm is waiting to be rediscovered whenever you are ready.';

  // Sentence 3 — top subject
  const topSubject =
    rhythm.subjectEfforts.length > 0
      ? rhythm.subjectEfforts.reduce((top, s) => (s.actualMinutes > top.actualMinutes ? s : top))
      : null;
  const topSubjectSentence =
    topSubject && topSubject.actualMinutes > 0
      ? `${topSubject.subjectName} received the most attention with ${formatHours(topSubject.actualHours)} hours invested.`
      : 'Your attention had room to roam, with no single subject dominating the week.';

  // Sentence 4 — neglected area (gentle invitation, never blame)
  const neglectAlert = attention.neglectAlerts.length > 0 ? attention.neglectAlerts[0] : null;
  const neglectSentence = neglectAlert
    ? `${neglectAlert.subjectName} would appreciate a gentle catch-up next week — it has been waiting patiently.`
    : 'All of your subjects stayed on a healthy, balanced trajectory.';

  // Sentence 5 — strategic goal for next week
  const strategicSentence =
    recommendations.length > 0
      ? `Next week's smartest next step: ${recommendations[0].title}.`
      : "Next week, one small consistent focus block per day will keep your momentum building.";

  const sentences: [string, string, string, string, string] = [
    volumeSentence,
    rhythmSentence,
    topSubjectSentence,
    neglectSentence,
    strategicSentence
  ];

  return { paragraph: sentences.join(' '), sentences };
}

/**
 * Actual study minutes logged in the previous calendar week (Mon–Sun window
 * immediately before the current week's Monday), computed with local-timezone
 * date keys (master.md §16.2). Used to default next week's target hours to
 * `lastWeekActual * 1.1` (plan §5.6, audit item #27).
 */
export function getPreviousWeekStudyMinutes(
  sessions: Array<{ durationMinutes?: number; completedAt?: string; createdAt?: string }>,
  referenceDate = new Date()
): number {
  const thisWeekStart = new Date(referenceDate);
  thisWeekStart.setHours(0, 0, 0, 0);
  const diffToMonday = (thisWeekStart.getDay() + 6) % 7;
  thisWeekStart.setDate(thisWeekStart.getDate() - diffToMonday);

  const lastWeekStart = new Date(thisWeekStart);
  lastWeekStart.setDate(lastWeekStart.getDate() - 7);
  const lastWeekEnd = new Date(thisWeekStart);
  lastWeekEnd.setDate(lastWeekEnd.getDate() - 1);

  const startKey = getISODateString(lastWeekStart);
  const endKey = getISODateString(lastWeekEnd);

  return sessions.reduce((acc, s) => {
    const raw = s.completedAt || s.createdAt;
    if (!raw) return acc;
    const d = new Date(raw);
    if (Number.isNaN(d.getTime())) return acc;
    const key = getISODateString(d);
    if (key < startKey || key > endKey) return acc;
    return acc + (s.durationMinutes || 0);
  }, 0);
}
