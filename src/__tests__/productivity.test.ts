import { describe, it, expect } from 'vitest';
import { calculateDailySummary } from '../utils/productivity';
import { Task } from '../types/task';
import { StudySession } from '../types/study';
import { FocusSession } from '../types/focus';
import { Habit } from '../types/habit';
import { getISODateString } from '../utils/date';

describe('Productivity Engine & Momentum Score Formula', () => {
  const todayStr = getISODateString(new Date());

  const mockTasks: Task[] = [
    {
      id: 't1',
      title: 'Task 1',
      status: 'completed',
      priority: 'high',
      category: 'study',
      subTasks: [],
      tags: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 't2',
      title: 'Task 2',
      status: 'todo',
      priority: 'medium',
      category: 'deep_work',
      subTasks: [],
      tags: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ];

  const mockStudySessions: StudySession[] = [
    {
      id: 's1',
      subjectId: 'sbj_1',
      subjectName: 'Distributed Systems',
      type: 'deep_study',
      durationMinutes: 90,
      topicsCovered: ['Raft'],
      retentionRating: 5,
      completedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ];

  const mockFocusSessions: FocusSession[] = [
    {
      id: 'f1',
      mode: 'pomodoro',
      durationMinutes: 50,
      title: 'Focus 1',
      completed: true,
      interruptionsCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ];

  const mockHabits: Habit[] = [
    {
      id: 'h1',
      title: 'Habit 1',
      category: 'study',
      frequency: 'daily',
      color: 'coral',
      currentStreak: 5,
      longestStreak: 10,
      completedToday: true,
      history: { [todayStr]: true },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'h2',
      title: 'Habit 2',
      category: 'routine',
      frequency: 'daily',
      color: 'amber',
      currentStreak: 2,
      longestStreak: 4,
      completedToday: false,
      history: { [todayStr]: false },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ];

  it('calculates summary correctly based on domain records', () => {
    const { summary, breakdown } = calculateDailySummary({
      tasks: mockTasks,
      studySessions: mockStudySessions,
      focusSessions: mockFocusSessions,
      habits: mockHabits,
      dailyStudyGoalMinutes: 180,
      targetFocusMinutes: 100
    });

    expect(summary.completedTasksCount).toBe(1);
    expect(summary.totalTasksCount).toBe(2);
    expect(summary.totalStudyMinutes).toBe(90);
    expect(summary.focusSessionsCount).toBe(1);
    expect(summary.habitsCompletedRatio).toBe('1/2');

    // Task score = 1/2 = 50%
    expect(breakdown.taskScore).toBe(50);
    // Study score = 90 / 180 = 50%
    expect(breakdown.studyScore).toBe(50);
    // Focus score = 50 / 100 = 50%
    expect(breakdown.focusScore).toBe(50);
    // Habit score = 1/2 = 50%
    expect(breakdown.habitScore).toBe(50);

    // Total momentum score = 0.3(50) + 0.3(50) + 0.2(50) + 0.2(50) = 50
    expect(summary.momentumScore).toBe(50);
  });
});
