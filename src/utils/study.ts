import { StudyPlanItem, StudySession, StudySubject } from '../types/study';
import { ValidationError } from './validation';
import { isThisWeek } from './date';

/**
 * Pure Study Plan Validation
 */
export function validateStudyPlanInput(plan: Partial<StudyPlanItem>): void {
  if (!plan.title || plan.title.trim().length === 0) {
    throw new ValidationError('Study plan topic title cannot be empty.', 'title');
  }

  if (plan.title.trim().length > 150) {
    throw new ValidationError('Topic title cannot exceed 150 characters.', 'title');
  }

  if (!plan.subjectId) {
    throw new ValidationError('A valid subject must be selected for the study plan.', 'subjectId');
  }

  if (plan.targetMinutes !== undefined) {
    if (plan.targetMinutes <= 0 || plan.targetMinutes > 720) {
      throw new ValidationError('Target duration must be between 1 and 720 minutes (12 hours).', 'targetMinutes');
    }
  }
}

/**
 * Derives actual logged study time per plan item dynamically from actual sessions.
 * Never stores or duplicates actual minutes in database columns.
 */
export function calculatePlannedVsActual(
  planItems: StudyPlanItem[],
  sessions: StudySession[]
): {
  enrichedPlan: StudyPlanItem[];
  totalPlannedMinutes: number;
  totalActualMinutes: number;
  adherencePercentage: number;
} {
  let totalPlannedMinutes = 0;
  let totalActualMinutes = 0;

  const enrichedPlan = planItems.map((item) => {
    totalPlannedMinutes += item.targetMinutes || 0;

    // Sum actual duration of study sessions fulfilling this plan item
    const matchedSessions = sessions.filter(
      (s) => s.planItemId === item.id || (s.subjectId === item.subjectId && s.topicsCovered.some((t) => t.toLowerCase() === item.title.toLowerCase()))
    );

    const actualMinutes = matchedSessions.reduce((acc, s) => acc + (s.durationMinutes || 0), 0);
    totalActualMinutes += actualMinutes;

    return {
      ...item,
      actualMinutesLogged: actualMinutes
    };
  });

  const adherencePercentage =
    totalPlannedMinutes > 0
      ? Math.min(100, Math.round((totalActualMinutes / totalPlannedMinutes) * 100))
      : 0;

  return {
    enrichedPlan,
    totalPlannedMinutes,
    totalActualMinutes,
    adherencePercentage
  };
}

/**
 * Derives completed hours this week for a subject dynamically from historical study sessions.
 */
export function calculateSubjectWeeklyProgress(
  subject: StudySubject,
  sessions: StudySession[]
): number {
  const weeklyMinutes = sessions
    .filter((s) => s.subjectId === subject.id && isThisWeek(s.completedAt))
    .reduce((acc, s) => acc + (s.durationMinutes || 0), 0);

  // Return hours with 1 decimal precision
  return Math.round((weeklyMinutes / 60) * 10) / 10;
}
