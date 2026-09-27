import { describe, it, expect } from 'vitest';
import {
  computeWeeklyBuckets,
  computeWeekOverWeekComparison,
  computeSubjectTimeBreakdown,
  computeFocusQualityTrend,
  getWeekStart
} from '../trends';
import { Task } from '../../../types/task';
import { StudySession, StudySubject } from '../../../types/study';
import { FocusSession } from '../../../types/focus';
import { Habit } from '../../../types/habit';
import { getISODateString } from '../../date';

// Fixed reference: Wednesday, Sep 23, 2026 (local noon to dodge TZ edges).
const REFERENCE = new Date(2026, 8, 23, 12, 0, 0);
const THIS_MONDAY = getISODateString(getWeekStart(REFERENCE)); // 2026-09-21
const LAST_MONDAY = getISODateString(new Date(getWeekStart(REFERENCE).getTime() - 7 * 86400000));

function isoAt(dayOffsetFromMonday: number, hour = 10): string {
  const d = new Date(new Date(`${THIS_MONDAY}T00:00:00`).getTime() + dayOffsetFromMonday * 86400000);
  d.setHours(hour, 0, 0, 0);
  return d.toISOString();
}

function makeTask(partial: Partial<Task>): Task {
  return {
    id: 't',
    title: 'Task',
    status: 'completed',
    priority: 'medium',
    category: 'study',
    createdAt: isoAt(0),
    ...partial
  } as Task;
}

function makeStudySession(partial: Partial<StudySession>): StudySession {
  return {
    id: 's',
    subjectId: 'sub-1',
    subjectName: 'Physics',
    type: 'active_recall',
    durationMinutes: 60,
    createdAt: isoAt(0),
    ...partial
  } as StudySession;
}

function makeFocusSession(partial: Partial<FocusSession>): FocusSession {
  return {
    id: 'f',
    mode: 'pomodoro',
    durationMinutes: 25,
    completed: true,
    createdAt: isoAt(0),
    ...partial
  } as FocusSession;
}

describe('computeWeeklyBuckets', () => {
  it('produces N Monday-anchored buckets ending with the current week', () => {
    const buckets = computeWeeklyBuckets({ tasks: [], studySessions: [], focusSessions: [], weeks: 8, referenceDate: REFERENCE });
    expect(buckets).toHaveLength(8);
    expect(buckets[7].weekStart).toBe(THIS_MONDAY);
    // Monday: weekday index check
    expect(new Date(`${buckets[7].weekStart}T00:00:00`).getDay()).toBe(1);
  });

  it('aggregates study minutes, focus minutes, and completed tasks into the right week', () => {
    const sessions = [
      makeStudySession({ id: 's1', durationMinutes: 45, createdAt: isoAt(1) }),
      makeStudySession({ id: 's2', durationMinutes: 30, createdAt: new Date(new Date(`${LAST_MONDAY}T10:00:00`).getTime() + 3600000).toISOString() })
    ];
    const focus = [
      makeFocusSession({ id: 'f1', durationMinutes: 25, createdAt: isoAt(2) }),
      makeFocusSession({ id: 'f2', durationMinutes: 99, completed: false, createdAt: isoAt(2) })
    ];
    const tasks = [
      makeTask({ id: 't1', completedAt: isoAt(3) }),
      makeTask({ id: 't2', status: 'todo', completedAt: isoAt(3) })
    ];

    const buckets = computeWeeklyBuckets({ tasks, studySessions: sessions, focusSessions: focus, weeks: 8, referenceDate: REFERENCE });
    const current = buckets[7];
    expect(current.studyMinutes).toBe(45);
    expect(current.focusMinutes).toBe(25); // incomplete session excluded
    expect(current.tasksCompleted).toBe(1);
    const previous = buckets[6];
    expect(previous.weekStart).toBe(LAST_MONDAY);
    expect(previous.studyMinutes).toBe(30);
  });
});

describe('computeWeekOverWeekComparison', () => {
  const habits: Habit[] = [
    {
      id: 'h1',
      title: 'Review cards',
      category: 'study',
      frequency: 'daily',
      kind: 'boolean',
      color: 'coral',
      history: {
        [THIS_MONDAY]: true,
        [LAST_MONDAY]: true,
        [getISODateString(new Date(new Date(`${LAST_MONDAY}T00:00:00`).getTime() + 1 * 86400000))]: true
      },
      currentStreak: 2,
      longestStreak: 2
    } as unknown as Habit
  ];

  it('computes deltas between this week and the previous window', () => {
    const sessions = [
      makeStudySession({ durationMinutes: 60, createdAt: isoAt(1) }),
      makeStudySession({ durationMinutes: 60, createdAt: new Date(new Date(`${LAST_MONDAY}T09:00:00`).getTime()).toISOString() })
    ];
    const comparison = computeWeekOverWeekComparison({
      tasks: [makeTask({ completedAt: isoAt(2) })],
      studySessions: sessions,
      focusSessions: [],
      habits,
      referenceDate: REFERENCE
    });

    expect(comparison.current.studyMinutes).toBe(60);
    expect(comparison.previous.studyMinutes).toBe(60);
    expect(comparison.studyMinutesDeltaPct).toBe(0);
    expect(comparison.tasksCompletedDelta).toBe(1);
    // Current week so far: 1 of 3 habit slots; previous window: 2 of 7.
    expect(comparison.current.habitCompletionRate).toBeCloseTo(1 / 3, 2);
    expect(comparison.previous.habitCompletionRate).toBeCloseTo(2 / 7, 2);
  });

  it('returns 100% delta when previous window was empty and current has data', () => {
    const comparison = computeWeekOverWeekComparison({
      tasks: [],
      studySessions: [makeStudySession({ durationMinutes: 30, createdAt: isoAt(1) })],
      focusSessions: [],
      habits: [],
      referenceDate: REFERENCE
    });
    expect(comparison.studyMinutesDeltaPct).toBe(100);
  });
});

describe('computeSubjectTimeBreakdown', () => {
  it('aggregates minutes per subject and sorts descending', () => {
    const slices = computeSubjectTimeBreakdown({
      studySessions: [
        makeStudySession({ subjectId: 'a', durationMinutes: 30 }),
        makeStudySession({ subjectId: 'b', durationMinutes: 90 }),
        makeStudySession({ subjectId: undefined as unknown as string, durationMinutes: 15 })
      ],
      focusSessions: [makeFocusSession({ subjectId: 'a', durationMinutes: 25 })],
      subjects: [
        { id: 'a', name: 'Alpha' } as StudySubject,
        { id: 'b', name: 'Beta' } as StudySubject
      ]
    });
    expect(slices[0]).toMatchObject({ subjectId: 'b', name: 'Beta', minutes: 90 });
    expect(slices.find((s) => s.subjectId === 'a')?.minutes).toBe(55);
    expect(slices.find((s) => s.subjectId === 'general')?.minutes).toBe(15);
  });
});

describe('computeFocusQualityTrend', () => {
  it('returns the last N rated sessions oldest → newest', () => {
    const sessions = [
      makeFocusSession({ id: 'f1', flowQuality: 2, createdAt: isoAt(1) }),
      makeFocusSession({ id: 'f2', flowQuality: 5, createdAt: isoAt(2) }),
      makeFocusSession({ id: 'f3', flowQuality: undefined, createdAt: isoAt(3) }),
      makeFocusSession({ id: 'f4', flowQuality: 4, createdAt: isoAt(4) })
    ];
    const trend = computeFocusQualityTrend({ focusSessions: sessions, limit: 2 });
    expect(trend.map((p) => p.flowQuality)).toEqual([5, 4]);
  });
});
