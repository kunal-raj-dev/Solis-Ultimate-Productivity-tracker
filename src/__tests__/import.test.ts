import { describe, it, expect } from 'vitest';
import { validateSolisBackup, executeWorkspaceImport } from '../utils/import';
import { createWorkspaceBackup } from '../utils/export';
import { MockDataService } from '../services/mock/mockService';

describe('Solis Workspace Import & Recovery Engine', () => {
  it('validates a correct solis-export-v1 backup successfully', () => {
    const validBackup = createWorkspaceBackup({
      profile: {
        id: 'usr-1',
        name: 'Scholar',
        email: 'scholar@solis.space',
        focusField: 'Systems',
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
      subjects: [
        {
          id: 'sub-1',
          name: 'Distributed Systems',
          color: 'coral',
          targetHoursPerWeek: 6,
          completedHoursThisWeek: 2,
          status: 'active',
          notesCount: 4,
          createdAt: '2026-08-17T00:00:00Z',
          updatedAt: '2026-08-17T00:00:00Z'
        }
      ],
      topics: [
        { id: 'top-1', subjectId: 'sub-1', title: 'Raft Consensus', masteryLevel: 'mastered', orderIndex: 0, createdAt: '2026-08-17T00:00:00Z', updatedAt: '2026-08-17T00:00:00Z' }
      ],
      studyPlans: [],
      studySessions: [],
      focusSessions: [],
      tasks: [
        { id: 't-1', title: 'Review Paper', category: 'study', priority: 'high', status: 'todo', subTasks: [], tags: [], createdAt: '2026-08-17T00:00:00Z', updatedAt: '2026-08-17T00:00:00Z' }
      ],
      habits: [],
      goals: [],
      notes: []
    });

    const result = validateSolisBackup(validBackup);
    expect(result.isValid).toBe(true);
    expect(result.summary?.subjectsCount).toBe(1);
    expect(result.summary?.topicsCount).toBe(1);
    expect(result.summary?.tasksCount).toBe(1);
  });

  it('rejects corrupt JSON strings', () => {
    const result = validateSolisBackup('{ "schema": "solis-export-v1", invalid_json ');
    expect(result.isValid).toBe(false);
    expect(result.error).toContain('Invalid JSON file');
  });

  it('rejects unsupported schemas', () => {
    const result = validateSolisBackup({ schema: 'notion-backup-v2', version: 1 });
    expect(result.isValid).toBe(false);
    expect(result.error).toContain('Unsupported backup schema');
  });

  it('rejects unsupported schema versions', () => {
    const result = validateSolisBackup({ schema: 'solis-export-v1', version: 99 });
    expect(result.isValid).toBe(false);
    expect(result.error).toContain('Unsupported schema version');
  });

  it('executes workspace import into MockDataService safely', async () => {
    const mockService = new MockDataService();
    const backup = createWorkspaceBackup({
      profile: null,
      subjects: [
        {
          id: 's-import',
          name: 'Database Internals',
          color: 'amber',
          targetHoursPerWeek: 5,
          completedHoursThisWeek: 0,
          status: 'active',
          notesCount: 0,
          createdAt: '2026-08-17',
          updatedAt: '2026-08-17'
        }
      ],
      topics: [{ id: 'top-import', subjectId: 's-import', title: 'LSM Trees', masteryLevel: 'learning', orderIndex: 0, createdAt: '2026-08-17', updatedAt: '2026-08-17' }],
      studyPlans: [],
      studySessions: [],
      focusSessions: [],
      tasks: [{ id: 't-import', title: 'Implement SSTable', category: 'project', priority: 'medium', status: 'todo', subTasks: [], tags: [], createdAt: '2026-08-17', updatedAt: '2026-08-17' }],
      habits: [],
      goals: [],
      notes: [{ id: 'n-import', title: 'Write-Ahead Log Notes', content: 'WAL is appended sequentially.', category: 'concept', tags: ['storage'], createdAt: '2026-08-17', updatedAt: '2026-08-17' }]
    });

    const result = await executeWorkspaceImport(backup, 'merge_skip', mockService);
    expect(result.importedCount).toBeGreaterThanOrEqual(4);

    const subjects = await mockService.study.getSubjects();
    expect(subjects.some((s) => s.name === 'Database Internals')).toBe(true);

    const notes = await mockService.notes.getNotes();
    expect(notes.some((n) => n.title === 'Write-Ahead Log Notes')).toBe(true);
  });
});
