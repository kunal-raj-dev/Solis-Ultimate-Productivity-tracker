/**
 * Solis Intelligence Engine — Attention Intelligence & Neglect Detection Module
 * Focus completion, interruption rate, and subject effort imbalance detection.
 */

import {
  AttentionIntelligenceInsight,
  DateWindow,
  IntelligenceSourceData,
  NeglectAlert
} from './types';

export function computeAttentionIntelligence(
  data: IntelligenceSourceData,
  window: DateWindow,
  referenceDate = new Date()
): AttentionIntelligenceInsight {
  const { focusSessions, subjects, sessions, planItems } = data;
  const startMs = new Date(window.startDate + 'T00:00:00').getTime();
  const endMs = new Date(window.endDate + 'T23:59:59').getTime();

  // Focus sessions in window
  const windowFocusSessions = focusSessions.filter((f) => {
    const time = new Date(f.createdAt).getTime();
    return time >= startMs && time <= endMs;
  });

  const totalFocusSessions = windowFocusSessions.length;
  const completedFocusSessions = windowFocusSessions.filter((f) => f.completed).length;
  const completionRate = totalFocusSessions > 0
    ? Math.round((completedFocusSessions / totalFocusSessions) * 100)
    : 0;

  const totalFocusMinutes = windowFocusSessions
    .filter((f) => f.completed)
    .reduce((acc, f) => acc + (f.durationMinutes || 0), 0);

  const averageFocusDurationMinutes = completedFocusSessions > 0
    ? Math.round(totalFocusMinutes / completedFocusSessions)
    : 0;

  const totalInterruptions = windowFocusSessions.reduce(
    (acc, f) => acc + (f.interruptionsCount || 0),
    0
  );

  const focusHours = totalFocusMinutes / 60;
  const interruptionsPerHour = focusHours > 0
    ? +(totalInterruptions / focusHours).toFixed(1)
    : 0;

  // Neglect Detection across Active Subjects
  // 1. Calculate actual minutes by subject in window
  const actualMinutesBySubject: Record<string, number> = {};
  const plannedMinutesBySubject: Record<string, number> = {};

  subjects.forEach((s) => {
    actualMinutesBySubject[s.id] = 0;
    plannedMinutesBySubject[s.id] = 0;
  });

  // Window study sessions
  const windowStudySessions = sessions.filter((s) => {
    const time = new Date(s.completedAt || s.createdAt).getTime();
    return time >= startMs && time <= endMs;
  });

  windowStudySessions.forEach((s) => {
    if (s.subjectId && actualMinutesBySubject[s.subjectId] !== undefined) {
      actualMinutesBySubject[s.subjectId] += s.durationMinutes || 0;
    }
  });

  // Window plan items
  const windowPlanItems = planItems.filter((p) => {
    if (!p.scheduledDate) return false;
    const time = new Date(p.scheduledDate + 'T00:00:00').getTime();
    return time >= startMs && time <= endMs;
  });

  windowPlanItems.forEach((p) => {
    if (p.subjectId && plannedMinutesBySubject[p.subjectId] !== undefined) {
      plannedMinutesBySubject[p.subjectId] += p.targetMinutes || 0;
    }
  });

  const totalActualMinutes = Object.values(actualMinutesBySubject).reduce((a, b) => a + b, 0);
  const totalPlannedMinutes = Object.values(plannedMinutesBySubject).reduce((a, b) => a + b, 0);

  const MS_PER_DAY = 1000 * 60 * 60 * 24;
  const refTime = referenceDate.getTime();

  const neglectAlerts: NeglectAlert[] = [];

  subjects.filter((s) => s.status === 'active').forEach((subj) => {
    const actualMins = actualMinutesBySubject[subj.id] || 0;
    const plannedMins = plannedMinutesBySubject[subj.id] || 0;

    const actualShare = totalActualMinutes > 0 ? Math.round((actualMins / totalActualMinutes) * 100) : 0;
    const plannedShare = totalPlannedMinutes > 0 ? Math.round((plannedMins / totalPlannedMinutes) * 100) : 0;

    // Find last studied timestamp for this subject
    const subjectSessions = sessions.filter((s) => s.subjectId === subj.id);
    let daysSinceLastStudied: number | null = null;
    if (subjectSessions.length > 0) {
      const latestTime = Math.max(...subjectSessions.map((s) => new Date(s.completedAt || s.createdAt).getTime()));
      daysSinceLastStudied = Math.max(0, Math.floor((refTime - latestTime) / MS_PER_DAY));
    }

    // Condition A: Planned share vs Actual share divergence >= 15%
    if (totalPlannedMinutes > 0 && totalActualMinutes > 0 && (plannedShare - actualShare) >= 15) {
      neglectAlerts.push({
        subjectId: subj.id,
        subjectName: subj.name,
        color: subj.color || 'coral',
        plannedShare,
        actualShare,
        divergence: plannedShare - actualShare,
        daysSinceLastStudied,
        reason: `${subj.name} received ${actualShare}% of actual study time vs ${plannedShare}% planned (${plannedShare - actualShare}% under-served).`
      });
    }
    // Condition B: Active subject with target hours > 0 has 0 study minutes in past 7 days
    else if ((subj.targetHoursPerWeek || 0) > 0 && (daysSinceLastStudied === null || daysSinceLastStudied >= 7)) {
      neglectAlerts.push({
        subjectId: subj.id,
        subjectName: subj.name,
        color: subj.color || 'coral',
        plannedShare,
        actualShare,
        divergence: plannedShare - actualShare,
        daysSinceLastStudied,
        reason: daysSinceLastStudied === null
          ? `${subj.name} has a weekly target of ${subj.targetHoursPerWeek}h but has no recorded study sessions yet.`
          : `${subj.name} has not been studied in ${daysSinceLastStudied} days despite a ${subj.targetHoursPerWeek}h/week target.`
      });
    }
  });

  const hasSufficientData = windowFocusSessions.length > 0 || windowStudySessions.length > 0;

  return {
    totalFocusSessions,
    completedFocusSessions,
    completionRate,
    averageFocusDurationMinutes,
    totalInterruptions,
    interruptionsPerHour,
    neglectAlerts,
    hasSufficientData
  };
}
