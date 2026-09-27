import { Task } from '../../types/task';
import { StudySession, StudySubject } from '../../types/study';
import { FocusSession } from '../../types/focus';
import { Habit } from '../../types/habit';
import { getISODateString } from '../date';

/**
 * Solis — Trend & Comparison Analytics (Phase 1)
 * Pure, deterministic derivations powering the visual trend charts:
 * weekly study bars, week-over-week deltas, per-subject breakdown,
 * and the focus-quality sparkline. No side effects, fully testable.
 */

export interface WeeklyBucket {
  /** ISO date (YYYY-MM-DD) of the Monday anchoring this week. */
  weekStart: string;
  /** Short display label, e.g. "Sep 1". */
  label: string;
  studyMinutes: number;
  focusMinutes: number;
  tasksCompleted: number;
}

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/** Monday-anchored week start (local time), matching the analytics heatmap. */
export function getWeekStart(date: Date): Date {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const dayOfWeek = (d.getDay() + 6) % 7; // 0 = Monday
  d.setDate(d.getDate() - dayOfWeek);
  return d;
}

function toISODate(d: Date): string {
  return getISODateString(d);
}

function safeTime(iso?: string | null): number | null {
  if (!iso) return null;
  const t = new Date(iso).getTime();
  return Number.isNaN(t) ? null : t;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/**
 * Builds the trailing `weeks` Monday-anchored buckets (oldest → newest) with
 * study minutes, focus minutes, and completed-task counts per week.
 */
export function computeWeeklyBuckets({
  tasks,
  studySessions,
  focusSessions,
  weeks = 8,
  referenceDate = new Date()
}: {
  tasks: Task[];
  studySessions: StudySession[];
  focusSessions: FocusSession[];
  weeks?: number;
  referenceDate?: Date;
}): WeeklyBucket[] {
  const thisWeek = getWeekStart(referenceDate);
  const buckets: WeeklyBucket[] = [];
  for (let i = weeks - 1; i >= 0; i--) {
    const start = new Date(thisWeek.getTime() - i * 7 * MS_PER_DAY);
    buckets.push({
      weekStart: toISODate(start),
      label: `${MONTHS[start.getMonth()]} ${start.getDate()}`,
      studyMinutes: 0,
      focusMinutes: 0,
      tasksCompleted: 0
    });
  }
  const indexOf = (iso: string | null | undefined): number | null => {
    const t = safeTime(iso);
    if (t === null) return null;
    const weekStartDate = toISODate(getWeekStart(new Date(t)));
    return buckets.findIndex((b) => b.weekStart === weekStartDate);
  };

  for (const s of studySessions) {
    const idx = indexOf(s.completedAt || s.createdAt);
    if (idx !== null && idx >= 0) buckets[idx].studyMinutes += s.durationMinutes || 0;
  }
  for (const f of focusSessions) {
    if (!f.completed) continue;
    const idx = indexOf(f.createdAt);
    if (idx !== null && idx >= 0) buckets[idx].focusMinutes += f.durationMinutes || 0;
  }
  for (const t of tasks) {
    if (t.status !== 'completed') continue;
    const idx = indexOf(t.completedAt);
    if (idx !== null && idx >= 0) buckets[idx].tasksCompleted += 1;
  }
  return buckets;
}

export interface WeekWindowStat {
  studyMinutes: number;
  focusMinutes: number;
  tasksCompleted: number;
  /** Habit completions recorded / expected slots in the window (0–1). */
  habitCompletionRate: number | null;
}

function computeWindowStat({
  tasks,
  studySessions,
  focusSessions,
  habits,
  windowStart,
  windowEnd,
  referenceDate
}: {
  tasks: Task[];
  studySessions: StudySession[];
  focusSessions: FocusSession[];
  habits: Habit[];
  windowStart: Date;
  windowEnd: Date;
  referenceDate: Date;
}): WeekWindowStat {
  const startT = windowStart.getTime();
  const endT = windowEnd.getTime();
  const inWindow = (iso?: string | null): boolean => {
    const t = safeTime(iso);
    return t !== null && t >= startT && t < endT;
  };

  const studyMinutes = studySessions
    .filter((s) => inWindow(s.completedAt || s.createdAt))
    .reduce((acc, s) => acc + (s.durationMinutes || 0), 0);
  const focusMinutes = focusSessions
    .filter((f) => f.completed && inWindow(f.createdAt))
    .reduce((acc, f) => acc + (f.durationMinutes || 0), 0);
  const tasksCompleted = tasks.filter((t) => t.status === 'completed' && inWindow(t.completedAt)).length;

  const days = Math.max(1, Math.round((Math.min(endT, referenceDate.getTime()) - startT) / MS_PER_DAY));
  let completedSlots = 0;
  if (habits.length > 0) {
    for (let i = 0; i < days; i++) {
      const dayKey = getISODateString(new Date(startT + i * MS_PER_DAY));
      for (const h of habits) {
        if (h.history && h.history[dayKey] === true) completedSlots += 1;
      }
    }
  }
  const habitCompletionRate = habits.length > 0 ? Math.min(1, completedSlots / (habits.length * days)) : null;

  return { studyMinutes, focusMinutes, tasksCompleted, habitCompletionRate };
}

function deltaPct(current: number, previous: number): number | null {
  if (previous === 0) return current > 0 ? 100 : null;
  return Math.round(((current - previous) / previous) * 100);
}

export interface WeekOverWeekComparison {
  current: WeekWindowStat;
  previous: WeekWindowStat;
  /** Percentage change in total study minutes (null when not computable). */
  studyMinutesDeltaPct: number | null;
  tasksCompletedDelta: number;
  habitRateDeltaPct: number | null;
}

/**
 * Compares the current Monday-anchored week (up to the reference moment)
 * against the preceding seven-day window.
 */
export function computeWeekOverWeekComparison({
  tasks,
  studySessions,
  focusSessions,
  habits,
  referenceDate = new Date()
}: {
  tasks: Task[];
  studySessions: StudySession[];
  focusSessions: FocusSession[];
  habits: Habit[];
  referenceDate?: Date;
}): WeekOverWeekComparison {
  const weekStart = getWeekStart(referenceDate);
  const current = computeWindowStat({
    tasks,
    studySessions,
    focusSessions,
    habits,
    windowStart: weekStart,
    windowEnd: new Date(weekStart.getTime() + 7 * MS_PER_DAY),
    referenceDate
  });
  const prevStart = new Date(weekStart.getTime() - 7 * MS_PER_DAY);
  const previous = computeWindowStat({
    tasks,
    studySessions,
    focusSessions,
    habits,
    windowStart: prevStart,
    windowEnd: weekStart,
    referenceDate
  });

  const currentTotal = current.studyMinutes + current.focusMinutes;
  const previousTotal = previous.studyMinutes + previous.focusMinutes;

  return {
    current,
    previous,
    studyMinutesDeltaPct: deltaPct(currentTotal, previousTotal),
    tasksCompletedDelta: current.tasksCompleted - previous.tasksCompleted,
    habitRateDeltaPct:
      current.habitCompletionRate !== null && previous.habitCompletionRate !== null && previous.habitCompletionRate > 0
        ? Math.round(((current.habitCompletionRate - previous.habitCompletionRate) / previous.habitCompletionRate) * 100)
        : null
  };
}

export interface SubjectTimeSlice {
  subjectId: string;
  name: string;
  color?: string;
  minutes: number;
}

/** Total logged study + focus minutes per subject, sorted descending. */
export function computeSubjectTimeBreakdown({
  studySessions,
  focusSessions,
  subjects
}: {
  studySessions: StudySession[];
  focusSessions: FocusSession[];
  subjects: StudySubject[];
}): SubjectTimeSlice[] {
  const byId = new Map<string, SubjectTimeSlice>();
  const ensure = (subjectId: string, name: string, color?: string): SubjectTimeSlice => {
    let slice = byId.get(subjectId);
    if (!slice) {
      slice = { subjectId, name, color, minutes: 0 };
      byId.set(subjectId, slice);
    }
    return slice;
  };
  for (const s of subjects) ensure(s.id, s.name, s.color);
  const general = ensure('general', 'General / Unlinked');

  for (const s of studySessions) {
    const key = s.subjectId || 'general';
    const slice = key === 'general' ? general : byId.get(key) ?? ensure(key, 'Unknown subject');
    slice.minutes += s.durationMinutes || 0;
  }
  for (const f of focusSessions) {
    if (!f.completed) continue;
    const key = f.subjectId || 'general';
    const slice = key === 'general' ? general : byId.get(key) ?? ensure(key, 'Unknown subject');
    slice.minutes += f.durationMinutes || 0;
  }

  return Array.from(byId.values())
    .filter((s) => s.minutes > 0)
    .sort((a, b) => b.minutes - a.minutes);
}

export interface FocusQualityPoint {
  flowQuality: number;
  label: string;
}

/** Last `limit` completed focus sessions with a flow rating, oldest → newest. */
export function computeFocusQualityTrend({
  focusSessions,
  limit = 20
}: {
  focusSessions: FocusSession[];
  limit?: number;
}): FocusQualityPoint[] {
  return focusSessions
    .filter((f) => f.completed && typeof f.flowQuality === 'number' && f.flowQuality > 0)
    .sort((a, b) => safeTime(a.createdAt)! - safeTime(b.createdAt)!)
    .slice(-limit)
    .map((f) => ({
      flowQuality: f.flowQuality as number,
      label: f.createdAt ? getISODateString(new Date(f.createdAt)) : ''
    }));
}
