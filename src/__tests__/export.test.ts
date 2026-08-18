import { describe, it, expect } from 'vitest';
import {
  createWorkspaceBackup,
  convertTasksToCSV,
  convertStudySessionsToCSV,
  convertNotesToCSV,
  convertHabitsToCSV,
  convertGoalsToCSV,
  convertFocusSessionsToCSV
} from '../utils/export';
import { Task } from '../types/task';
import { StudySession } from '../types/study';
import { Note } from '../types/note';
import { Habit } from '../types/habit';

describe('Solis Data Export & Portability Suite', () => {
  it('creates a versioned workspace backup with schema solis-export-v1', () => {
    const backup = createWorkspaceBackup({
      profile: {
        id: 'usr-1',
        name: 'Scholar Kunal',
        email: 'kunal@solis.space',
        focusField: 'Computer Science',
        preferences: {
          theme: 'light',
          soundEnabled: true,
          defaultFocusDurationMinutes: 25,
          defaultBreakDurationMinutes: 5,
          dailyStudyGoalMinutes: 180,
          dailyTasksGoalCount: 5,
          focusGradientTheme: 'momentum'
        },
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z'
      },
      subjects: [],
      topics: [],
      studyPlans: [],
      studySessions: [],
      focusSessions: [],
      tasks: [],
      habits: [],
      goals: [],
      notes: []
    });

    expect(backup.schema).toBe('solis-export-v1');
    expect(backup.version).toBe(1);
    expect(backup.exportedAt).toBeDefined();
    expect(backup.profile.name).toBe('Scholar Kunal');
  });

  it('converts tasks to valid escaped CSV', () => {
    const mockTasks: Task[] = [
      {
        id: 't1',
        title: 'Complete "System" Architecture',
        category: 'study',
        priority: 'high',
        status: 'todo',
        dueDate: '2026-08-20',
        tags: ['arch', 'cs'],
        subTasks: [{ id: 'st1', title: 'Sub 1', completed: false, createdAt: '2026-08-17' }],
        createdAt: '2026-08-17T00:00:00Z',
        updatedAt: '2026-08-17T00:00:00Z'
      }
    ];

    const csv = convertTasksToCSV(mockTasks);
    expect(csv).toContain('ID,Title,Category,Priority,Status');
    expect(csv).toContain('"Complete ""System"" Architecture"');
    expect(csv).toContain('"arch; cs"');
  });

  it('converts study sessions to valid CSV with retention rating and topics', () => {
    const mockSessions: StudySession[] = [
      {
        id: 's1',
        subjectId: 'sub-1',
        subjectName: 'Algorithms',
        durationMinutes: 60,
        type: 'deep_study',
        retentionRating: 5,
        topicsCovered: ['Trees', 'Graphs'],
        completedAt: '2026-08-17T12:00:00Z',
        createdAt: '2026-08-17T11:00:00Z',
        updatedAt: '2026-08-17T12:00:00Z'
      }
    ];

    const csv = convertStudySessionsToCSV(mockSessions);
    expect(csv).toContain('ID,Subject Name,Duration (Minutes)');
    expect(csv).toContain('"Algorithms"');
    expect(csv).toContain('"Trees; Graphs"');
  });

  it('converts notes and computes word counts accurately', () => {
    const mockNotes: Note[] = [
      {
        id: 'n1',
        title: 'Memory Models',
        content: 'This is a test with six words.',
        category: 'concept',
        subjectId: 'sub-1',
        subjectName: 'Architecture',
        tags: ['memory'],
        createdAt: '2026-08-17T00:00:00Z',
        updatedAt: '2026-08-17T00:00:00Z'
      }
    ];

    const csv = convertNotesToCSV(mockNotes);
    expect(csv).toContain('"Memory Models"');
    expect(csv).toContain('"7"'); // 7 words in content
  });

  it('converts habits and calculates streak totals', () => {
    const mockHabits: Habit[] = [
      {
        id: 'h1',
        title: 'Daily Review',
        category: 'study',
        frequency: 'daily',
        color: 'coral',
        currentStreak: 5,
        longestStreak: 12,
        completedToday: true,
        history: { '2026-08-17': true, '2026-08-16': true },
        createdAt: '2026-08-01T00:00:00Z',
        updatedAt: '2026-08-01T00:00:00Z'
      }
    ];

    const csv = convertHabitsToCSV(mockHabits);
    expect(csv).toContain('"Daily Review"');
    expect(csv).toContain('"5"');
    expect(csv).toContain('"12"');
    expect(csv).toContain('"2"');
  });

  it('handles empty lists gracefully without errors', () => {
    expect(convertTasksToCSV([])).toBe('ID,Title,Category,Priority,Status,Due Date,Completed At,Subtasks Count,Tags');
    expect(convertNotesToCSV([])).toBe('ID,Title,Category,Subject Name,Tags,Word Count,Created At,Updated At');
    expect(convertGoalsToCSV([])).toBe('ID,Title,Horizon,Category,Priority,Status,Target Date,Milestones Count,Completed Milestones');
    expect(convertFocusSessionsToCSV([])).toBe('ID,Mode,Duration (Minutes),Subject Name,Topic,Completed At');
  });
});
