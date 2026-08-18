/**
 * Solis Intelligence Engine — Cognitive Rhythm Module
 * Deterministic study and focus velocity, time-of-day concentration, and subject distribution.
 */

import {
  CognitiveRhythmInsight,
  DateWindow,
  DayOfWeekDistribution,
  IntelligenceSourceData,
  SubjectEffortShare,
  TimeOfDayBucket,
  TimeOfDayDistribution
} from './types';

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function calculateDateWindow(scope: 'today' | 'this_week' | '28_days', referenceDate = new Date()): DateWindow {
  const end = new Date(referenceDate);
  end.setHours(23, 59, 59, 999);

  const start = new Date(referenceDate);
  start.setHours(0, 0, 0, 0);

  let daysCount = 1;
  if (scope === 'today') {
    daysCount = 1;
  } else if (scope === 'this_week') {
    // Current week starting from Monday
    const currentDay = start.getDay();
    const diffToMonday = (currentDay + 6) % 7;
    start.setDate(start.getDate() - diffToMonday);
    daysCount = 7;
  } else {
    // 28 days
    start.setDate(start.getDate() - 27);
    daysCount = 28;
  }

  const formatDate = (d: Date) => d.toISOString().split('T')[0];
  return {
    startDate: formatDate(start),
    endDate: formatDate(end),
    daysCount
  };
}

export function getTimeOfDayBucket(isoDateString: string): TimeOfDayBucket {
  const d = new Date(isoDateString);
  const hour = d.getHours();
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 22) return 'evening';
  return 'night';
}

export function computeCognitiveRhythm(
  data: IntelligenceSourceData,
  window: DateWindow
): CognitiveRhythmInsight {
  const { sessions, focusSessions, subjects, planItems } = data;
  const startMs = new Date(window.startDate + 'T00:00:00').getTime();
  const endMs = new Date(window.endDate + 'T23:59:59').getTime();

  // Filter sessions within window
  const windowStudySessions = sessions.filter((s) => {
    const time = new Date(s.completedAt || s.createdAt).getTime();
    return time >= startMs && time <= endMs;
  });

  const windowFocusSessions = focusSessions.filter((f) => {
    const time = new Date(f.createdAt).getTime();
    return time >= startMs && time <= endMs && f.completed;
  });

  const totalStudyMinutes = windowStudySessions.reduce((acc, s) => acc + (s.durationMinutes || 0), 0);
  const totalFocusMinutes = windowFocusSessions.reduce((acc, f) => acc + (f.durationMinutes || 0), 0);

  // Active study days
  const activeDaysSet = new Set<string>();
  windowStudySessions.forEach((s) => {
    const d = (s.completedAt || s.createdAt).split('T')[0];
    activeDaysSet.add(d);
  });
  const activeStudyDaysCount = activeDaysSet.size;
  const consistencyPercentage = window.daysCount > 0
    ? Math.round((activeStudyDaysCount / window.daysCount) * 100)
    : 0;

  const averageSessionDurationMinutes = windowStudySessions.length > 0
    ? Math.round(totalStudyMinutes / windowStudySessions.length)
    : 0;

  // Time of Day distribution
  const timeOfDayBuckets: Record<TimeOfDayBucket, { count: number; minutes: number }> = {
    morning: { count: 0, minutes: 0 },
    afternoon: { count: 0, minutes: 0 },
    evening: { count: 0, minutes: 0 },
    night: { count: 0, minutes: 0 }
  };

  windowStudySessions.forEach((s) => {
    const bucket = getTimeOfDayBucket(s.completedAt || s.createdAt);
    timeOfDayBuckets[bucket].count += 1;
    timeOfDayBuckets[bucket].minutes += s.durationMinutes || 0;
  });

  const timeOfDay: TimeOfDayDistribution[] = [
    {
      bucket: 'morning',
      label: 'Morning (05:00 - 12:00)',
      hours: +(timeOfDayBuckets.morning.minutes / 60).toFixed(1),
      percentage: totalStudyMinutes > 0 ? Math.round((timeOfDayBuckets.morning.minutes / totalStudyMinutes) * 100) : 0,
      sessionCount: timeOfDayBuckets.morning.count
    },
    {
      bucket: 'afternoon',
      label: 'Afternoon (12:00 - 17:00)',
      hours: +(timeOfDayBuckets.afternoon.minutes / 60).toFixed(1),
      percentage: totalStudyMinutes > 0 ? Math.round((timeOfDayBuckets.afternoon.minutes / totalStudyMinutes) * 100) : 0,
      sessionCount: timeOfDayBuckets.afternoon.count
    },
    {
      bucket: 'evening',
      label: 'Evening (17:00 - 22:00)',
      hours: +(timeOfDayBuckets.evening.minutes / 60).toFixed(1),
      percentage: totalStudyMinutes > 0 ? Math.round((timeOfDayBuckets.evening.minutes / totalStudyMinutes) * 100) : 0,
      sessionCount: timeOfDayBuckets.evening.count
    },
    {
      bucket: 'night',
      label: 'Night (22:00 - 05:00)',
      hours: +(timeOfDayBuckets.night.minutes / 60).toFixed(1),
      percentage: totalStudyMinutes > 0 ? Math.round((timeOfDayBuckets.night.minutes / totalStudyMinutes) * 100) : 0,
      sessionCount: timeOfDayBuckets.night.count
    }
  ];

  // Identify dominant time of day if session count >= 3
  let dominantTimeOfDay: TimeOfDayBucket | null = null;
  if (windowStudySessions.length >= 3) {
    const sorted = [...timeOfDay].sort((a, b) => b.hours - a.hours);
    if (sorted[0].hours > 0) {
      dominantTimeOfDay = sorted[0].bucket;
    }
  }

  // Day of Week distribution (Mon = 1, Sun = 0)
  const dayOfWeekBuckets: { minutes: number; count: number }[] = Array.from({ length: 7 }, () => ({
    minutes: 0,
    count: 0
  }));

  windowStudySessions.forEach((s) => {
    const dayIdx = new Date(s.completedAt || s.createdAt).getDay();
    dayOfWeekBuckets[dayIdx].minutes += s.durationMinutes || 0;
    dayOfWeekBuckets[dayIdx].count += 1;
  });

  // Reorder Monday (1) through Sunday (0)
  const orderedDays = [1, 2, 3, 4, 5, 6, 0];
  const dayOfWeek: DayOfWeekDistribution[] = orderedDays.map((dayIdx) => {
    const bucket = dayOfWeekBuckets[dayIdx];
    return {
      dayIndex: dayIdx,
      dayName: DAY_NAMES[dayIdx],
      minutes: bucket.minutes,
      hours: +(bucket.minutes / 60).toFixed(1),
      percentage: totalStudyMinutes > 0 ? Math.round((bucket.minutes / totalStudyMinutes) * 100) : 0,
      sessionCount: bucket.count
    };
  });

  // Subject Effort Distribution
  const subjectEffortMap: Record<
    string,
    { actualMinutes: number; plannedMinutes: number; count: number }
  > = {};

  subjects.forEach((subj) => {
    subjectEffortMap[subj.id] = { actualMinutes: 0, plannedMinutes: 0, count: 0 };
  });

  windowStudySessions.forEach((s) => {
    if (s.subjectId && subjectEffortMap[s.subjectId]) {
      subjectEffortMap[s.subjectId].actualMinutes += s.durationMinutes || 0;
      subjectEffortMap[s.subjectId].count += 1;
    }
  });

  // Calculate planned minutes from plan items in window
  planItems.forEach((p) => {
    if (p.scheduledDate) {
      const pTime = new Date(p.scheduledDate + 'T00:00:00').getTime();
      if (pTime >= startMs && pTime <= endMs && p.subjectId && subjectEffortMap[p.subjectId]) {
        subjectEffortMap[p.subjectId].plannedMinutes += p.targetMinutes || 0;
      }
    }
  });

  const totalPlannedMinutes = Object.values(subjectEffortMap).reduce((acc, curr) => acc + curr.plannedMinutes, 0);

  const subjectEfforts: SubjectEffortShare[] = subjects.map((subj) => {
    const stats = subjectEffortMap[subj.id] || { actualMinutes: 0, plannedMinutes: 0, count: 0 };
    return {
      subjectId: subj.id,
      subjectName: subj.name,
      color: subj.color || 'coral',
      actualMinutes: stats.actualMinutes,
      actualHours: +(stats.actualMinutes / 60).toFixed(1),
      plannedMinutes: stats.plannedMinutes,
      plannedHours: +(stats.plannedMinutes / 60).toFixed(1),
      actualSharePercentage: totalStudyMinutes > 0 ? Math.round((stats.actualMinutes / totalStudyMinutes) * 100) : 0,
      plannedSharePercentage: totalPlannedMinutes > 0 ? Math.round((stats.plannedMinutes / totalPlannedMinutes) * 100) : 0,
      sessionCount: stats.count
    };
  }).sort((a, b) => b.actualMinutes - a.actualMinutes);

  const hasSufficientData = windowStudySessions.length >= 3;

  return {
    totalStudyMinutes,
    totalStudyHours: +(totalStudyMinutes / 60).toFixed(1),
    totalFocusMinutes,
    totalFocusHours: +(totalFocusMinutes / 60).toFixed(1),
    activeStudyDaysCount,
    consistencyPercentage,
    averageSessionDurationMinutes,
    timeOfDay,
    dominantTimeOfDay,
    dayOfWeek,
    subjectEfforts,
    hasSufficientData
  };
}
