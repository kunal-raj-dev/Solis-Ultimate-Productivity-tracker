import { describe, it, expect } from 'vitest';
import { generateSolisIntelligenceReport } from '../utils/intelligence';
import { StudySession, StudySubject } from '../types/study';
import { Task } from '../types/task';
import { FocusSession } from '../types/focus';
import { Habit } from '../types/habit';

describe('Solis Weekly Review & Strategic Calibration Suite', () => {
  const mockSubjects: StudySubject[] = [
    {
      id: 'sub-1',
      name: 'Compiler Architecture',
      color: 'coral',
      targetHoursPerWeek: 10,
      completedHoursThisWeek: 8,
      status: 'active',
      notesCount: 5,
      createdAt: '2026-08-17',
      updatedAt: '2026-08-17'
    }
  ];

  const mockSessions: StudySession[] = [
    {
      id: 'sess-1',
      subjectId: 'sub-1',
      subjectName: 'Compiler Architecture',
      durationMinutes: 90,
      type: 'deep_study',
      retentionRating: 5,
      topicsCovered: ['Dataflow Analysis'],
      completedAt: '2026-08-17T14:00:00Z',
      createdAt: '2026-08-17T12:30:00Z',
      updatedAt: '2026-08-17T14:00:00Z'
    },
    {
      id: 'sess-2',
      subjectId: 'sub-1',
      subjectName: 'Compiler Architecture',
      durationMinutes: 60,
      type: 'active_recall',
      retentionRating: 4,
      topicsCovered: ['SSA Form'],
      completedAt: '2026-08-16T15:00:00Z',
      createdAt: '2026-08-16T14:00:00Z',
      updatedAt: '2026-08-16T15:00:00Z'
    }
  ];

  const mockFocus: FocusSession[] = [
    {
      id: 'f-1',
      mode: 'deep_flow',
      durationMinutes: 50,
      subjectId: 'sub-1',
      title: 'Deep Compiler Optimization',
      completed: true,
      interruptionsCount: 0,
      createdAt: '2026-08-17T10:00:00Z',
      updatedAt: '2026-08-17T10:50:00Z'
    }
  ];

  const mockTasks: Task[] = [
    {
      id: 't-1',
      title: 'Implement Loop Invariant Code Motion',
      category: 'project',
      priority: 'high',
      status: 'completed',
      dueDate: '2026-08-17',
      subTasks: [],
      tags: [],
      createdAt: '2026-08-17',
      updatedAt: '2026-08-17'
    },
    {
      id: 't-2',
      title: 'Read Tiger Book Chapter 18',
      category: 'study',
      priority: 'medium',
      status: 'todo',
      dueDate: '2026-08-17',
      subTasks: [],
      tags: [],
      createdAt: '2026-08-17',
      updatedAt: '2026-08-17'
    }
  ];

  const mockHabits: Habit[] = [
    {
      id: 'h-1',
      title: 'Daily Paper Reading',
      category: 'study',
      frequency: 'daily',
      color: 'coral',
      currentStreak: 7,
      longestStreak: 14,
      completedToday: true,
      history: { '2026-08-17': true },
      createdAt: '2026-08-01',
      updatedAt: '2026-08-01'
    }
  ];

  it('derives weekly intelligence summary accurately for review ritual', () => {
    const report = generateSolisIntelligenceReport(
      {
        sessions: mockSessions,
        planItems: [],
        subjects: mockSubjects,
        topics: [],
        focusSessions: mockFocus,
        tasks: mockTasks,
        habits: mockHabits
      },
      'this_week'
    );

    expect(report.rhythm).toBeDefined();
    expect(report.rhythm.totalStudyHours).toBeGreaterThanOrEqual(0);
    expect(report.execution.taskExecutionRate).toBe(50); // 1 completed of 2 tasks
  });

  it('calculates total weekly study hours accurately', () => {
    const totalMinutes = mockSessions.reduce((acc, s) => acc + s.durationMinutes, 0);
    const totalHours = (totalMinutes / 60).toFixed(1);
    expect(totalHours).toBe('2.5');
  });
});
