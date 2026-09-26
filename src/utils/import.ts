/**
 * Solis Workspace Import & Recovery Engine
 * Validates, normalizes, and restores versioned backup schemas safely.
 */

import { SolisWorkspaceBackup, fetchAllTimeBlocks } from './export';
import { IDataService } from '../services/api.interface';
import { Task, TaskTimeBlock } from '../types/task';
import { StudySubject, StudySession, StudyPlanItem, StudyTopic } from '../types/study';
import { Note } from '../types/note';
import { FocusSession } from '../types/focus';
import { Habit } from '../types/habit';
import { Goal } from '../types/goal';
import { RecurringStudyRoutine } from '../types/planning';
import { StudyResource } from '../types/resource';
import { Flashcard } from '../types/learning';
import { DailyReflection } from '../types/reflection';

export type ImportConflictStrategy = 'merge_skip' | 'create_copies' | 'replace';

// Reflections are one-per-day; 3650 covers ~10 years of daily entries.
const FULL_REFLECTION_LIMIT = 3650;

const normKey = (value?: string | null): string => (value || '').trim().toLowerCase();

const routineKey = (r: Pick<RecurringStudyRoutine, 'title' | 'subjectName' | 'scheduledTime' | 'daysOfWeek'>): string =>
  `${normKey(r.title)}|${normKey(r.subjectName)}|${normKey(r.scheduledTime)}|${[...(r.daysOfWeek || [])].sort().join(',')}`;

const resourceKey = (r: Pick<StudyResource, 'title' | 'url' | 'subjectName'>): string =>
  `${normKey(r.title)}|${normKey(r.url)}|${normKey(r.subjectName)}`;

const blockKey = (b: Pick<TaskTimeBlock, 'date' | 'startHour' | 'startMinute' | 'taskTitle'>): string =>
  `${b.date}|${b.startHour}|${b.startMinute ?? 0}|${normKey(b.taskTitle)}`;

const sessionKey = (s: Pick<StudySession, 'subjectName' | 'type' | 'durationMinutes'>): string =>
  `${normKey(s.subjectName)}|${s.type}|${s.durationMinutes}`;

const focusKey = (f: Pick<FocusSession, 'title' | 'mode' | 'durationMinutes' | 'subjectName'>): string =>
  `${normKey(f.title)}|${f.mode}|${f.durationMinutes}|${normKey(f.subjectName)}`;

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
  routinesCount: number;
  resourcesCount: number;
  timeBlocksCount: number;
  flashcardsCount: number;
  reflectionsCount: number;
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

  // Ensure all collections are arrays. Collections introduced after the
  // original v1 backup default to empty so older backups still validate.
  const subjects = Array.isArray(parsed.subjects) ? parsed.subjects : [];
  const topics = Array.isArray(parsed.topics) ? parsed.topics : [];
  const studyPlans = Array.isArray(parsed.studyPlans) ? parsed.studyPlans : [];
  const studySessions = Array.isArray(parsed.studySessions) ? parsed.studySessions : [];
  const studyRoutines = Array.isArray(parsed.studyRoutines) ? parsed.studyRoutines : [];
  const studyResources = Array.isArray(parsed.studyResources) ? parsed.studyResources : [];
  const focusSessions = Array.isArray(parsed.focusSessions) ? parsed.focusSessions : [];
  const tasks = Array.isArray(parsed.tasks) ? parsed.tasks : [];
  const taskTimeBlocks = Array.isArray(parsed.taskTimeBlocks) ? parsed.taskTimeBlocks : [];
  const habits = Array.isArray(parsed.habits) ? parsed.habits : [];
  const goals = Array.isArray(parsed.goals) ? parsed.goals : [];
  const notes = Array.isArray(parsed.notes) ? parsed.notes : [];
  const flashcards = Array.isArray(parsed.flashcards) ? parsed.flashcards : [];
  const dailyReflections = Array.isArray(parsed.dailyReflections) ? parsed.dailyReflections : [];

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
    routinesCount: studyRoutines.length,
    resourcesCount: studyResources.length,
    timeBlocksCount: taskTimeBlocks.length,
    flashcardsCount: flashcards.length,
    reflectionsCount: dailyReflections.length,
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
    studyRoutines,
    studyResources,
    focusSessions,
    tasks,
    taskTimeBlocks,
    habits,
    goals,
    notes,
    flashcards,
    dailyReflections
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

  // 1. Replace mode: clear every collection this import restores (children
  //    before parents so foreign keys never block a delete).
  if (strategy === 'replace') {
    const clearCollection = async <T>(fetchList: () => Promise<T[]>, remove: (item: T) => Promise<unknown>) => {
      let list: T[] = [];
      try {
        list = await fetchList();
      } catch {
        return;
      }
      for (const item of list) {
        await remove(item).catch(() => {});
      }
    };

    const existingSubjectsToClear = await service.study.getSubjects(true).catch(() => [] as StudySubject[]);
    for (const subject of existingSubjectsToClear) {
      const topicList = await service.study.getTopics(subject.id).catch(() => [] as StudyTopic[]);
      for (const topic of topicList) {
        await service.study.deleteTopic(topic.id).catch(() => {});
      }
    }

    await clearCollection(() => fetchAllTimeBlocks(service), (b) => service.tasks.deleteTimeBlock(b.id));
    await clearCollection(() => service.flashcards.getFlashcards(), (c) => service.flashcards.deleteFlashcard(c.id));
    await clearCollection(() => service.routines.getRoutines(), (r) => service.routines.deleteRoutine(r.id));
    await clearCollection(() => service.resources.getResources(), (r) => service.resources.deleteResource(r.id));
    await clearCollection(() => service.study.getRecentSessions(), (s) => service.study.deleteSession(s.id));
    await clearCollection(() => service.study.getTodayPlan(), (p) => service.study.deletePlanItem(p.id));
    await clearCollection(() => service.study.getSubjects(true), (s) => service.study.deleteSubject(s.id));
    await clearCollection(() => service.tasks.getTasks(), (t) => service.tasks.deleteTask(t.id));
    await clearCollection(() => service.notes.getNotes(), (n) => service.notes.deleteNote(n.id));
    await clearCollection(() => service.habits.getHabits(), (h) => service.habits.deleteHabit(h.id));
    await clearCollection(() => service.goals.getGoals(), (g) => service.goals.deleteGoal(g.id));
    await clearCollection(
      () => service.reflections.getReflections(FULL_REFLECTION_LIMIT),
      (r) => service.reflections.deleteReflection(r.id)
    );
  }

  // 2. Merge-skip mode: index existing records by natural keys so records that
  //    already exist are skipped instead of duplicated.
  const existingSubjectByName = new Map<string, StudySubject>();
  const existingSubjectById = new Map<string, StudySubject>();
  const existingTopicKeys = new Map<string, StudyTopic>();
  const existingTaskKeys = new Map<string, Task>();
  const existingNoteKeys = new Map<string, Note>();
  const existingHabitKeys = new Map<string, Habit>();
  const existingGoalKeys = new Map<string, Goal>();
  const existingFlashcardKeys = new Map<string, Flashcard>();
  const existingRoutineKeys = new Map<string, RecurringStudyRoutine>();
  const existingResourceKeys = new Map<string, StudyResource>();
  const existingBlockKeys = new Map<string, TaskTimeBlock>();
  const existingSessionKeys = new Map<string, StudySession>();
  const existingFocusKeys = new Map<string, FocusSession>();
  const existingPlanKeys = new Map<string, StudyPlanItem>();
  const existingReflectionDates = new Set<string>();

  if (strategy === 'merge_skip') {
    const subjects = await service.study.getSubjects(true).catch(() => [] as StudySubject[]);
    for (const s of subjects) {
      existingSubjectById.set(s.id, s);
      existingSubjectByName.set(normKey(s.name), s);
    }

    const topicLists = await Promise.all(
      subjects.map((s) => service.study.getTopics(s.id).catch(() => [] as StudyTopic[]))
    );
    for (const list of topicLists) {
      for (const t of list) {
        const subjectName = normKey(existingSubjectById.get(t.subjectId)?.name);
        existingTopicKeys.set(`${subjectName}|${normKey(t.title)}`, t);
      }
    }

    const tasks = await service.tasks.getTasks().catch(() => [] as Task[]);
    for (const t of tasks) existingTaskKeys.set(`${normKey(t.title)}|${t.dueDate || ''}`, t);

    const notes = await service.notes.getNotes().catch(() => [] as Note[]);
    for (const n of notes) existingNoteKeys.set(normKey(n.title), n);

    const habits = await service.habits.getHabits().catch(() => [] as Habit[]);
    for (const h of habits) existingHabitKeys.set(normKey(h.title), h);

    const goals = await service.goals.getGoals().catch(() => [] as Goal[]);
    for (const g of goals) existingGoalKeys.set(normKey(g.title), g);

    const flashcards = await service.flashcards.getFlashcards().catch(() => [] as Flashcard[]);
    // Key by subjectId, not subjectName: backends populate subjectName on read,
    // while backup cards only carry subjectId — name-based keys never matched.
    for (const c of flashcards) existingFlashcardKeys.set(`${c.subjectId}|${normKey(c.frontPrompt)}`, c);

    const routines = await service.routines.getRoutines().catch(() => [] as RecurringStudyRoutine[]);
    for (const r of routines) existingRoutineKeys.set(routineKey(r), r);

    const resources = await service.resources.getResources().catch(() => [] as StudyResource[]);
    for (const r of resources) existingResourceKeys.set(resourceKey(r), r);

    const blocks = await fetchAllTimeBlocks(service).catch(() => [] as TaskTimeBlock[]);
    for (const b of blocks) existingBlockKeys.set(blockKey(b), b);

    const sessions = await service.study.getRecentSessions().catch(() => [] as StudySession[]);
    for (const s of sessions) existingSessionKeys.set(sessionKey(s), s);

    const plans = await service.study.getTodayPlan().catch(() => [] as StudyPlanItem[]);
    for (const p of plans) {
      existingPlanKeys.set(`${normKey(p.subjectName)}|${normKey(p.title)}|${p.scheduledDate || ''}`, p);
    }

    const reflections = await service.reflections
      .getReflections(FULL_REFLECTION_LIMIT)
      .catch(() => [] as DailyReflection[]);
    for (const r of reflections) existingReflectionDates.add(r.date);
  }

  // Focus sessions have no delete API on any backend (IFocusService), so
  // replace mode cannot clear them before re-importing. Index them by natural
  // key for merge_skip AND replace so an existing session is skipped instead
  // of duplicated (master.md §16.3). 'create_copies' intentionally re-imports.
  if (strategy === 'merge_skip' || strategy === 'replace') {
    const focusSessions = await service.focus.getRecentSessions().catch(() => [] as FocusSession[]);
    for (const f of focusSessions) existingFocusKeys.set(focusKey(f), f);
  }

  // ID mapping tables for preserving foreign key relationships when
  // generating new IDs (or resolving to matched existing records).
  const subjectIdMap = new Map<string, string>();
  const topicIdMap = new Map<string, string>();
  const taskIdMap = new Map<string, string>();
  const noteIdMap = new Map<string, string>();
  const goalIdMap = new Map<string, string>();

  // 3. Import Subjects
  for (const s of backup.subjects) {
    try {
      if (strategy === 'merge_skip') {
        const existing = existingSubjectByName.get(normKey(s.name));
        if (existing) {
          subjectIdMap.set(s.id, existing.id);
          continue;
        }
      }
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

  // 4. Import Topics linked to mapped subject IDs
  for (const t of backup.topics) {
    try {
      const targetSubjectId = subjectIdMap.get(t.subjectId) || t.subjectId;
      if (strategy === 'merge_skip') {
        const backupSubjectName = normKey(backup.subjects.find((x) => x.id === t.subjectId)?.name);
        const existing = existingTopicKeys.get(`${backupSubjectName}|${normKey(t.title)}`);
        if (existing) {
          topicIdMap.set(t.id, existing.id);
          continue;
        }
      }
      const created = await service.study.createTopic({
        subjectId: targetSubjectId,
        title: t.title,
        description: t.description,
        masteryLevel: t.masteryLevel || 'unstudied',
        orderIndex: t.orderIndex || 0
      });
      topicIdMap.set(t.id, created.id);
      totalImported++;
    } catch {
      // ignore individual topic error
    }
  }

  // 5. Import Tasks
  for (const t of backup.tasks) {
    try {
      const targetSubjectId = t.subjectId ? (subjectIdMap.get(t.subjectId) || t.subjectId) : undefined;
      if (strategy === 'merge_skip') {
        const existing = existingTaskKeys.get(`${normKey(t.title)}|${t.dueDate || ''}`);
        if (existing) {
          taskIdMap.set(t.id, existing.id);
          continue;
        }
      }
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
      // master.md §16.3 restore fidelity: carry the plan §3.3 deferral counter
      // through the task update path (supported by both storage backends).
      if (typeof t.deferralCount === 'number') {
        await service.tasks.updateTask(created.id, { deferralCount: t.deferralCount }).catch(() => {});
      }
      taskIdMap.set(t.id, created.id);

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

  // 6. Import Notes linked to mapped subjects
  for (const n of backup.notes) {
    try {
      const targetSubjectId = n.subjectId ? (subjectIdMap.get(n.subjectId) || n.subjectId) : undefined;
      if (strategy === 'merge_skip') {
        const existing = existingNoteKeys.get(normKey(n.title));
        if (existing) {
          noteIdMap.set(n.id, existing.id);
          continue;
        }
      }
      const created = await service.notes.createNote({
        title: n.title,
        content: n.content,
        category: n.category,
        subjectId: targetSubjectId,
        tags: n.tags || []
      });
      noteIdMap.set(n.id, created.id);
      totalImported++;
    } catch {
      // ignore
    }
  }

  // 7. Import Habits (completion history restored via toggleHabitDate so it
  //    persists in both the in-memory and Supabase backends)
  for (const h of backup.habits) {
    try {
      if (strategy === 'merge_skip' && existingHabitKeys.has(normKey(h.title))) {
        continue;
      }
      const created = await service.habits.createHabit({
        title: h.title,
        description: h.description,
        category: h.category,
        frequency: h.frequency,
        color: h.color,
        kind: h.kind,
        unit: h.unit,
        targetValue: h.targetValue,
        baseTierValue: h.baseTierValue,
        stretchTierValue: h.stretchTierValue
      });

      if (h.kind === 'quantitative' && h.valueHistory) {
        for (const [date, val] of Object.entries(h.valueHistory)) {
          if (val > 0) {
            await service.habits.logHabitProgress(created.id, val, date).catch(() => {});
          }
        }
      } else {
        const completedDates = Object.keys(h.history || {}).filter((date) => h.history && h.history[date] === true);
        for (const date of completedDates) {
          await service.habits.toggleHabitDate(created.id, date).catch(() => {});
        }
      }
      // master.md §16.3 restore fidelity: re-attach the plan §3.4 amnesty
      // dates after the completion history so the streak engine re-evaluates
      // with both in place and Streak Amnesty's continuity promise survives
      // a backup/restore round-trip.
      if (h.amnestyDates && h.amnestyDates.length > 0) {
        await service.habits.updateHabit(created.id, { amnestyDates: [...h.amnestyDates] }).catch(() => {});
      }
      totalImported++;
    } catch {
      // ignore
    }
  }

  // 8. Import Goals & Milestones (milestone `completed` flags are passed at
  //    create time so they survive the restore untouched)
  for (const g of backup.goals) {
    try {
      const targetSubjectId = g.subjectId ? (subjectIdMap.get(g.subjectId) || g.subjectId) : undefined;
      if (strategy === 'merge_skip' && existingGoalKeys.has(normKey(g.title))) {
        continue;
      }
      const created = await service.goals.createGoal({
        title: g.title,
        description: g.description,
        horizon: g.horizon,
        category: g.category,
        priority: g.priority,
        status: g.status,
        targetDate: g.targetDate,
        color: g.color,
        subjectId: targetSubjectId,
        milestones: (g.milestones || []).map((m) => ({
          id: m.id,
          title: m.title,
          completed: m.completed === true,
          targetDate: m.targetDate
        }))
      });
      goalIdMap.set(g.id, created.id);
      totalImported++;
    } catch {
      // ignore
    }
  }

  // 9. Import Study Sessions
  for (const sess of backup.studySessions) {
    try {
      const targetSubjectId = sess.subjectId ? (subjectIdMap.get(sess.subjectId) || sess.subjectId) : undefined;
      if (strategy === 'merge_skip' && existingSessionKeys.has(sessionKey(sess))) {
        continue;
      }
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

  // 10. Import Focus Sessions
  for (const f of backup.focusSessions) {
    try {
      const targetSubjectId = f.subjectId ? (subjectIdMap.get(f.subjectId) || f.subjectId) : undefined;
      const targetTaskId = f.taskId ? (taskIdMap.get(f.taskId) || f.taskId) : undefined;
      // Keys exist for merge_skip and replace (see index above); a match means
      // the session already lives in this workspace — skip it rather than save
      // a duplicate that double-counts focus minutes.
      if (existingFocusKeys.has(focusKey(f))) {
        continue;
      }
      await service.focus.saveFocusSession({
        mode: f.mode,
        durationMinutes: f.durationMinutes,
        subjectId: targetSubjectId,
        subjectName: f.subjectName,
        taskId: targetTaskId,
        topic: f.topic || f.title,
        title: f.title,
        completed: f.completed
      });
      totalImported++;
    } catch {
      // ignore
    }
  }

  // 11. Import Study Plan Items linked to mapped subject/topic/task IDs
  for (const p of backup.studyPlans) {
    try {
      const targetSubjectId = subjectIdMap.get(p.subjectId) || p.subjectId;
      const targetTopicId = p.topicId ? (topicIdMap.get(p.topicId) || p.topicId) : undefined;
      const targetTaskId = p.linkedTaskId ? (taskIdMap.get(p.linkedTaskId) || p.linkedTaskId) : undefined;
      const backupSubjectName = normKey(backup.subjects.find((x) => x.id === p.subjectId)?.name || p.subjectName);
      if (strategy === 'merge_skip' && existingPlanKeys.has(`${backupSubjectName}|${normKey(p.title)}|${p.scheduledDate || ''}`)) {
        continue;
      }
      const created = await service.study.createPlanItem({
        subjectId: targetSubjectId,
        subjectName: p.subjectName,
        topicId: targetTopicId,
        title: p.title,
        targetMinutes: p.targetMinutes,
        scheduledDate: p.scheduledDate,
        scheduledTime: p.scheduledTime,
        priority: p.priority,
        notes: p.notes,
        linkedTaskId: targetTaskId
      });

      // createPlanItem forces completed=false in both backends; restore the
      // stored completion state explicitly.
      if (p.completed === true) {
        await service.study.updatePlanItem(created.id, { completed: true }).catch(() => {});
      }
      totalImported++;
    } catch {
      // ignore
    }
  }

  // 12. Import Study Routines linked to mapped subject/topic IDs
  for (const r of backup.studyRoutines ?? []) {
    try {
      const targetSubjectId = subjectIdMap.get(r.subjectId) || r.subjectId;
      const targetTopicId = r.topicId ? (topicIdMap.get(r.topicId) || r.topicId) : undefined;
      if (strategy === 'merge_skip' && existingRoutineKeys.has(routineKey(r))) {
        continue;
      }
      await service.routines.createRoutine({
        subjectId: targetSubjectId,
        topicId: targetTopicId,
        title: r.title,
        targetMinutes: r.targetMinutes,
        daysOfWeek: r.daysOfWeek,
        scheduledTime: r.scheduledTime,
        priority: r.priority,
        isActive: r.isActive
      });
      totalImported++;
    } catch {
      // ignore
    }
  }

  // 13. Import Study Resources linked to mapped subject/topic IDs
  for (const r of backup.studyResources ?? []) {
    try {
      const targetSubjectId = subjectIdMap.get(r.subjectId) || r.subjectId;
      const targetTopicId = r.topicId ? (topicIdMap.get(r.topicId) || r.topicId) : undefined;
      if (strategy === 'merge_skip' && existingResourceKeys.has(resourceKey(r))) {
        continue;
      }
      await service.resources.createResource({
        subjectId: targetSubjectId,
        topicId: targetTopicId,
        title: r.title,
        author: r.author,
        url: r.url,
        type: r.type,
        status: r.status,
        rating: r.rating,
        notes: r.notes,
        tags: r.tags || []
      });
      totalImported++;
    } catch {
      // ignore
    }
  }

  // 14. Import Time Blocks linked to mapped task/subject/goal IDs
  for (const b of backup.taskTimeBlocks ?? []) {
    try {
      const targetTaskId = b.taskId ? (taskIdMap.get(b.taskId) || b.taskId) : undefined;
      const targetSubjectId = b.subjectId ? (subjectIdMap.get(b.subjectId) || b.subjectId) : undefined;
      const targetGoalId = b.goalId ? (goalIdMap.get(b.goalId) || b.goalId) : undefined;
      if (strategy === 'merge_skip' && existingBlockKeys.has(blockKey(b))) {
        continue;
      }
      await service.tasks.createTimeBlock({
        taskId: targetTaskId,
        taskTitle: b.taskTitle,
        description: b.description,
        date: b.date,
        startHour: b.startHour,
        startMinute: b.startMinute,
        durationMinutes: b.durationMinutes,
        subjectId: targetSubjectId,
        goalId: targetGoalId,
        priority: b.priority,
        status: b.status,
        actualMinutes: b.actualMinutes,
        progressPercent: b.progressPercent,
        reflection: b.reflection,
        blocker: b.blocker,
        nextAction: b.nextAction
      });
      totalImported++;
    } catch {
      // ignore
    }
  }

  // 15. Import Flashcards linked to mapped subject/topic/note IDs, then
  //     restore their SM-2 scheduling fields where the backend allows it.
  for (const f of backup.flashcards ?? []) {
    try {
      const targetSubjectId = subjectIdMap.get(f.subjectId) || f.subjectId;
      const targetTopicId = f.topicId ? (topicIdMap.get(f.topicId) || f.topicId) : undefined;
      const targetNoteId = f.noteId ? (noteIdMap.get(f.noteId) || f.noteId) : undefined;
      if (strategy === 'merge_skip' && existingFlashcardKeys.has(`${targetSubjectId}|${normKey(f.frontPrompt)}`)) {
        continue;
      }
      const created = await service.flashcards.createFlashcard({
        subjectId: targetSubjectId,
        topicId: targetTopicId,
        noteId: targetNoteId,
        frontPrompt: f.frontPrompt,
        backAnswer: f.backAnswer,
        cardType: f.cardType
      });

      // Restore SM-2 scheduling fields explicitly (createFlashcard resets them
      // to defaults in both backends). Only set fields present in the backup so
      // partial data never overwrites stored state with undefined.
      const sm2Updates: Partial<Flashcard> = {};
      if (f.difficultyRating !== undefined) sm2Updates.difficultyRating = f.difficultyRating;
      if (f.repetitionCount !== undefined) sm2Updates.repetitionCount = f.repetitionCount;
      if (f.intervalDays !== undefined) sm2Updates.intervalDays = f.intervalDays;
      if (f.easeFactor !== undefined) sm2Updates.easeFactor = f.easeFactor;
      if (f.nextReviewDate !== undefined) sm2Updates.nextReviewDate = f.nextReviewDate;
      if (f.lastReviewedAt !== undefined) sm2Updates.lastReviewedAt = f.lastReviewedAt;
      if (Object.keys(sm2Updates).length > 0) {
        await service.flashcards.updateFlashcard(created.id, sm2Updates).catch(() => {});
      }
      totalImported++;
    } catch {
      // ignore
    }
  }

  // 16. Import Daily Reflections (standalone, keyed by date)
  for (const r of backup.dailyReflections ?? []) {
    try {
      if (strategy === 'merge_skip' && existingReflectionDates.has(r.date)) {
        continue;
      }
      await service.reflections.saveDailyReflection({
        date: r.date,
        energyScore: r.energyScore,
        focusScore: r.focusScore,
        wins: r.wins || [],
        frictionPoints: r.frictionPoints || [],
        tomorrowIntentions: r.tomorrowIntentions || [],
        synthesisNotes: r.synthesisNotes,
        completedHabitsCount: r.completedHabitsCount,
        completedTasksCount: r.completedTasksCount,
        studyMinutesLogged: r.studyMinutesLogged,
        reviewCardsCompleted: r.reviewCardsCompleted
      });
      totalImported++;
    } catch {
      // ignore
    }
  }

  return { importedCount: totalImported };
}
