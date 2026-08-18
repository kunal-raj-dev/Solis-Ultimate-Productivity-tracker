/**
 * Solis Intelligence Engine — Execution & Planning Realism Module
 * Plan adherence, execution rate, planning realism calibration, and postponement patterns.
 */

import {
  DateWindow,
  ExecutionIntelligenceInsight,
  IntelligenceSourceData,
  PostponementAlert
} from './types';

export function computeExecutionIntelligence(
  data: IntelligenceSourceData,
  window: DateWindow
): ExecutionIntelligenceInsight {
  const { sessions, planItems, tasks, subjects } = data;
  const startMs = new Date(window.startDate + 'T00:00:00').getTime();
  const endMs = new Date(window.endDate + 'T23:59:59').getTime();

  // Plan items in window
  const windowPlanItems = planItems.filter((p) => {
    if (!p.scheduledDate) return false;
    const pTime = new Date(p.scheduledDate + 'T00:00:00').getTime();
    return pTime >= startMs && pTime <= endMs;
  });

  const plannedStudyMinutes = windowPlanItems.reduce((acc, p) => acc + (p.targetMinutes || 0), 0);

  // Study sessions in window
  const windowSessions = sessions.filter((s) => {
    const time = new Date(s.completedAt || s.createdAt).getTime();
    return time >= startMs && time <= endMs;
  });

  const actualStudyMinutes = windowSessions.reduce((acc, s) => acc + (s.durationMinutes || 0), 0);

  // Plan Adherence Rate (0 - 100%)
  const planAdherenceRate = plannedStudyMinutes > 0
    ? Math.min(100, Math.round((actualStudyMinutes / plannedStudyMinutes) * 100))
    : (actualStudyMinutes > 0 ? 100 : 0);

  // Session completion rate (completed vs started)
  // In Solis, recorded study sessions with completedAt are completed sessions.
  const completedSessionsCount = windowSessions.length;
  const sessionCompletionRate = completedSessionsCount > 0 ? 100 : 0;

  // Task Execution Rate (completed tasks due in window vs total due in window)
  const windowTasks = tasks.filter((t) => {
    if (!t.dueDate) return false;
    const dTime = new Date(t.dueDate.split('T')[0] + 'T00:00:00').getTime();
    return dTime >= startMs && dTime <= endMs;
  });

  const completedTasksCount = windowTasks.filter((t) => t.status === 'completed').length;
  const taskExecutionRate = windowTasks.length > 0
    ? Math.round((completedTasksCount / windowTasks.length) * 100)
    : 0;

  // Planning Realism Calibration
  let planningRealismRatio = 1.0;
  let planningRealismVerdict: 'under_planning' | 'calibrated' | 'over_planning' | 'no_plan' = 'no_plan';

  if (plannedStudyMinutes > 0) {
    planningRealismRatio = +(actualStudyMinutes / plannedStudyMinutes).toFixed(2);
    if (planningRealismRatio >= 0.75 && planningRealismRatio <= 1.25) {
      planningRealismVerdict = 'calibrated';
    } else if (planningRealismRatio < 0.75) {
      planningRealismVerdict = 'over_planning';
    } else {
      planningRealismVerdict = 'under_planning';
    }
  }

  // Postponement Patterns
  // Group uncompleted plan items by title and subject to spot recurring reschedules
  const titleGroups: Record<string, { items: typeof planItems; subjectId: string; title: string }> = {};
  
  planItems.forEach((item) => {
    if (!item.completed) {
      const key = `${item.subjectId || 'none'}:${item.title.trim().toLowerCase()}`;
      if (!titleGroups[key]) {
        titleGroups[key] = { items: [], subjectId: item.subjectId, title: item.title };
      }
      titleGroups[key].items.push(item);
    }
  });

  const subjectMap = new Map(subjects.map((s) => [s.id, s.name]));

  const postponementPatterns: PostponementAlert[] = [];
  Object.values(titleGroups).forEach((group) => {
    if (group.items.length >= 2) {
      const dates = group.items
        .map((i) => i.scheduledDate || '')
        .filter(Boolean)
        .sort();
      postponementPatterns.push({
        planItemId: group.items[0].id,
        title: group.title,
        subjectId: group.subjectId,
        subjectName: subjectMap.get(group.subjectId) || 'General Study',
        uncompletedCount: group.items.length,
        scheduledDates: dates
      });
    }
  });

  const hasSufficientData = plannedStudyMinutes > 0 || windowSessions.length > 0;

  return {
    planAdherenceRate,
    sessionCompletionRate,
    taskExecutionRate,
    plannedStudyMinutes,
    actualStudyMinutes,
    planningRealismRatio,
    planningRealismVerdict,
    postponementPatterns,
    hasSufficientData
  };
}
