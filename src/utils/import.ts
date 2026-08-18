/**
 * Solis Workspace Import & Recovery Engine
 * Validates, normalizes, and restores versioned backup schemas safely.
 */

import { SolisWorkspaceBackup } from './export';
import { IDataService } from '../services/api.interface';

export type ImportConflictStrategy = 'merge_skip' | 'create_copies' | 'replace';

export interface ImportSummary {
  subjectsCount: number;
  topicsCount: number;
  plansCount: number;
  studySessionsCount: number;
  focusSessionsCount: number;
  tasksCount: number;
  habitsCount: number;
  goalsCount: number;
  notesCount: number;
  exportedAt?: string;
  client?: string;
}

export interface BackupValidationResult {
  isValid: boolean;
  error?: string;
  backup?: SolisWorkspaceBackup;
  summary?: ImportSummary;
}

export function validateSolisBackup(content: string | Record<string, any>): BackupValidationResult {
  let parsed: any;

  if (typeof content === 'string') {
    try {
      parsed = JSON.parse(content);
    } catch {
      return {
        isValid: false,
        error: 'Invalid JSON file. Please ensure the file contains valid JSON formatting.'
      };
    }
  } else {
    parsed = content;
  }

  if (!parsed || typeof parsed !== 'object') {
    return { isValid: false, error: 'Backup root must be a valid JSON object.' };
  }

  if (parsed.schema !== 'solis-export-v1') {
    return {
      isValid: false,
      error: `Unsupported backup schema: "${parsed.schema || 'unknown'}". Expected "solis-export-v1".`
    };
  }

  if (parsed.version !== 1) {
    return {
      isValid: false,
      error: `Unsupported schema version: ${parsed.version}. Expected version 1.`
    };
  }

  // Ensure all collections are arrays
  const subjects = Array.isArray(parsed.subjects) ? parsed.subjects : [];
  const topics = Array.isArray(parsed.topics) ? parsed.topics : [];
  const studyPlans = Array.isArray(parsed.studyPlans) ? parsed.studyPlans : [];
  const studySessions = Array.isArray(parsed.studySessions) ? parsed.studySessions : [];
  const focusSessions = Array.isArray(parsed.focusSessions) ? parsed.focusSessions : [];
  const tasks = Array.isArray(parsed.tasks) ? parsed.tasks : [];
  const habits = Array.isArray(parsed.habits) ? parsed.habits : [];
  const goals = Array.isArray(parsed.goals) ? parsed.goals : [];
  const notes = Array.isArray(parsed.notes) ? parsed.notes : [];

  const summary: ImportSummary = {
    subjectsCount: subjects.length,
    topicsCount: topics.length,
    plansCount: studyPlans.length,
    studySessionsCount: studySessions.length,
    focusSessionsCount: focusSessions.length,
    tasksCount: tasks.length,
    habitsCount: habits.length,
    goalsCount: goals.length,
    notesCount: notes.length,
    exportedAt: parsed.exportedAt,
    client: parsed.client
  };

  const backup: SolisWorkspaceBackup = {
    schema: 'solis-export-v1',
    version: 1,
    exportedAt: parsed.exportedAt || new Date().toISOString(),
    client: parsed.client || 'Solis Productivity OS',
    profile: parsed.profile || {},
    subjects,
    topics,
    studyPlans,
    studySessions,
    focusSessions,
    tasks,
    habits,
    goals,
    notes
  };

  return {
    isValid: true,
    backup,
    summary
  };
}

export async function executeWorkspaceImport(
  backup: SolisWorkspaceBackup,
  strategy: ImportConflictStrategy,
  service: IDataService
): Promise<{ importedCount: number }> {
  let totalImported = 0;

  // 1. If replace strategy, clear existing records where supported
  if (strategy === 'replace') {
    const existingTasks = await service.tasks.getTasks();
    for (const t of existingTasks) {
      await service.tasks.deleteTask(t.id).catch(() => {});
    }

    const existingNotes = await service.notes.getNotes();
    for (const n of existingNotes) {
      await service.notes.deleteNote(n.id).catch(() => {});
    }

    const existingHabits = await service.habits.getHabits();
    for (const h of existingHabits) {
      await service.habits.deleteHabit(h.id).catch(() => {});
    }

    const existingGoals = await service.goals.getGoals();
    for (const g of existingGoals) {
      await service.goals.deleteGoal(g.id).catch(() => {});
    }
  }

  // ID mapping table for preserving foreign key relationships when generating new IDs
  const subjectIdMap = new Map<string, string>();

  // 2. Import Subjects
  for (const s of backup.subjects) {
    try {
      const created = await service.study.createSubject({
        name: s.name,
        color: s.color,
        description: s.description,
        status: s.status || 'active',
        targetHoursPerWeek: s.targetHoursPerWeek || 5
      });
      subjectIdMap.set(s.id, created.id);
      totalImported++;
    } catch {
      // ignore individual item error in merge mode
    }
  }

  // 3. Import Topics linked to new subject IDs
  for (const t of backup.topics) {
    try {
      const targetSubjectId = subjectIdMap.get(t.subjectId) || t.subjectId;
      await service.study.createTopic({
        subjectId: targetSubjectId,
        title: t.title,
        description: t.description,
        masteryLevel: t.masteryLevel || 'unstudied',
        orderIndex: t.orderIndex || 0
      });
      totalImported++;
    } catch {
      // ignore individual topic error
    }
  }

  // 4. Import Tasks
  for (const t of backup.tasks) {
    try {
      const targetSubjectId = t.subjectId ? (subjectIdMap.get(t.subjectId) || t.subjectId) : undefined;
      const created = await service.tasks.createTask({
        title: t.title,
        description: t.description,
        category: t.category,
        priority: t.priority,
        status: t.status,
        dueDate: t.dueDate,
        subjectId: targetSubjectId,
        tags: t.tags || []
      });

      // Import subtasks if present
      if (t.subTasks && t.subTasks.length > 0) {
        for (const st of t.subTasks) {
          await service.tasks.addSubTask(created.id, st.title).catch(() => {});
        }
      }
      totalImported++;
    } catch {
      // ignore
    }
  }

  // 5. Import Notes linked to mapped subjects
  for (const n of backup.notes) {
    try {
      const targetSubjectId = n.subjectId ? (subjectIdMap.get(n.subjectId) || n.subjectId) : undefined;
      await service.notes.createNote({
        title: n.title,
        content: n.content,
        category: n.category,
        subjectId: targetSubjectId,
        tags: n.tags || []
      });
      totalImported++;
    } catch {
      // ignore
    }
  }

  // 6. Import Habits
  for (const h of backup.habits) {
    try {
      await service.habits.createHabit({
        title: h.title,
        description: h.description,
        category: h.category,
        frequency: h.frequency,
        color: h.color
      });
      totalImported++;
    } catch {
      // ignore
    }
  }

  // 7. Import Goals & Milestones
  for (const g of backup.goals) {
    try {
      const targetSubjectId = g.subjectId ? (subjectIdMap.get(g.subjectId) || g.subjectId) : undefined;
      const created = await service.goals.createGoal({
        title: g.title,
        description: g.description,
        horizon: g.horizon,
        category: g.category,
        priority: g.priority,
        status: g.status,
        targetDate: g.targetDate,
        color: g.color,
        subjectId: targetSubjectId
      });

      if (g.milestones && g.milestones.length > 0) {
        for (const m of g.milestones) {
          await service.goals.addMilestone(created.id, {
            title: m.title,
            completed: m.completed,
            targetDate: m.targetDate
          }).catch(() => {});
        }
      }
      totalImported++;
    } catch {
      // ignore
    }
  }

  // 8. Import Study Sessions
  for (const sess of backup.studySessions) {
    try {
      const targetSubjectId = sess.subjectId ? (subjectIdMap.get(sess.subjectId) || sess.subjectId) : undefined;
      await service.study.logSession({
        subjectId: targetSubjectId,
        subjectName: sess.subjectName,
        durationMinutes: sess.durationMinutes,
        type: sess.type,
        topicsCovered: sess.topicsCovered || [],
        notes: sess.notes,
        retentionRating: sess.retentionRating
      });
      totalImported++;
    } catch {
      // ignore
    }
  }

  // 9. Import Focus Sessions
  for (const f of backup.focusSessions) {
    try {
      const targetSubjectId = f.subjectId ? (subjectIdMap.get(f.subjectId) || f.subjectId) : undefined;
      await service.focus.saveFocusSession({
        mode: f.mode,
        durationMinutes: f.durationMinutes,
        subjectId: targetSubjectId,
        subjectName: f.subjectName,
        topic: f.topic || f.title,
        title: f.title,
        completed: f.completed
      });
      totalImported++;
    } catch {
      // ignore
    }
  }

  return { importedCount: totalImported };
}
