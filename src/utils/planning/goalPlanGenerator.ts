import { Goal } from '../../types/goal';
import { StudyTopic } from '../../types/study';
import { getISODateString, addDays } from '../date';

/**
 * Phase 3 (P3.2/P3.3) — Goal → Study Plan generation.
 * Translates an exam goal into concrete, date-scoped study plan items and a
 * weekly-hours target, using the same deterministic philosophy as the rest of
 * the planning engines: pure functions, explainable outputs.
 */

export interface GoalPlanDraft {
  scheduledDate: string;
  title: string;
  targetMinutes: number;
  priority: 'urgent' | 'high' | 'medium' | 'low';
  notes?: string;
}

/** Weekday offsets (0 = Monday) used to spread sessions across a week. */
const SPREAD_OFFSETS = [0, 2, 4, 6, 1, 3, 5];

/**
 * Suggested weekly hours needed to cover the goal's unmastered topics by the
 * target date (P3.3). Falls back to the goal title alone when no topics exist.
 */
export function computeRequiredWeeklyHours({
  topics,
  targetDate,
  minutesPerTopic = 90,
  referenceDate = new Date()
}: {
  topics: StudyTopic[];
  targetDate: string;
  minutesPerTopic?: number;
  referenceDate?: Date;
}): number {
  const target = new Date(`${targetDate}T00:00:00`);
  if (Number.isNaN(target.getTime())) return 0;
  const daysRemaining = Math.max(
    1,
    Math.ceil((target.getTime() - referenceDate.getTime()) / (24 * 60 * 60 * 1000))
  );
  const weeksRemaining = Math.max(1, daysRemaining / 7);
  const openTopics =
    topics.length > 0
      ? topics.filter((t) => t.masteryLevel !== 'mastered').length
      : 0;
  const topicsToCover = Math.max(topics.length > 0 ? 1 : 0, openTopics);
  const totalMinutes = topicsToCover * minutesPerTopic;
  return Math.round((totalMinutes / 60 / weeksRemaining) * 10) / 10;
}

/**
 * Generates date-scoped study plan item drafts for an exam goal (P3.2).
 * Sessions are spread across spaced weekdays (Mon/Wed/Fri pattern first),
 * titled by cycling through the goal's unmastered topics (or the goal title),
 * and never scheduled past the goal's target date.
 */
export function generateGoalStudyPlanDrafts({
  goal,
  topics,
  sessionsPerWeek = 3,
  minutesPerSession = 60,
  weeks = 6,
  referenceDate = new Date()
}: {
  goal: Goal;
  topics: StudyTopic[];
  sessionsPerWeek?: number;
  minutesPerSession?: number;
  weeks?: number;
  referenceDate?: Date;
}): GoalPlanDraft[] {
  if (!goal.targetDate) return [];
  const target = new Date(`${goal.targetDate}T00:00:00`);
  if (Number.isNaN(target.getTime())) return [];

  const openTopics = topics.filter((t) => t.masteryLevel !== 'mastered');
  const topicTitles = openTopics.length > 0
    ? openTopics.map((t) => t.title)
    : goal.title
    ? [goal.title]
    : [];

  const examImminent = daysUntil(target, referenceDate) <= 14;
  const priority: GoalPlanDraft['priority'] = examImminent ? 'high' : 'medium';
  const offsets = SPREAD_OFFSETS.slice(0, Math.max(1, Math.min(7, sessionsPerWeek)));

  const drafts: GoalPlanDraft[] = [];
  let topicCursor = 0;

  for (let w = 0; w < weeks; w++) {
    for (const offset of offsets) {
      const sessionDate = addDays(referenceDate, w * 7 + offset);
      if (sessionDate.getTime() >= target.getTime()) continue;
      const topicTitle = topicTitles.length > 0 ? topicTitles[topicCursor++ % topicTitles.length] : goal.title;
      drafts.push({
        scheduledDate: getISODateString(sessionDate),
        title: topicTitle ? `Study: ${topicTitle}` : `Study session — ${goal.title}`,
        targetMinutes: minutesPerSession,
        priority,
        notes: `Generated from goal "${goal.title}"`
      });
    }
  }

  // Cap the batch so a long horizon can never flood the planner.
  return drafts.slice(0, 40);
}

function daysUntil(target: Date, reference: Date): number {
  return Math.ceil((target.getTime() - reference.getTime()) / (24 * 60 * 60 * 1000));
}
