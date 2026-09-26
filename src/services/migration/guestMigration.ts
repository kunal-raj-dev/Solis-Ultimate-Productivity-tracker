import { dataService } from '../dataService';
import type { StudySubject, StudyTopic } from '../../types/study';
import type { Task } from '../../types/task';
import type { Note } from '../../types/note';
import type { Habit } from '../../types/habit';
import type { Flashcard } from '../../types/learning';

/**
 * Solis - Guest-to-Cloud Automatic Data Migration Protocol (plan §1.3)
 *
 * When a visitor works in local/guest mode (MockDataService) and then signs up
 * or signs in, their subjects, topics, tasks (with subtask checklists), notes,
 * habits (with completion history), and flashcards (with SM-2 scheduling
 * state) are re-created in the cloud account with foreign keys re-mapped to
 * the newly assigned UUIDs. After a successful migration the guest workspace
 * is archived locally under `solis_mock_backup_${Date.now()}` so the
 * pre-migration snapshot is never lost.
 *
 * All writes go through the canonical `dataService` cloud services (single
 * write path, validation and cache invalidation included). Records whose
 * foreign keys cannot be resolved inside the migration contract are skipped
 * and counted instead of throwing, so a dangling link can never strand a
 * partially migrated workspace.
 */

export interface GuestWorkspaceSnapshot {
  subjects: StudySubject[];
  topics: StudyTopic[];
  tasks: Task[];
  notes: Note[];
  habits: Habit[];
  flashcards: Flashcard[];
}

export interface GuestMigrationCounts {
  subjects: number;
  topics: number;
  tasks: number;
  subTasks: number;
  notes: number;
  habits: number;
  habitRecords: number;
  flashcards: number;
  /** Records (or links) skipped because a foreign key could not be re-mapped. */
  skipped: number;
}

export interface GuestMigrationResult {
  counts: GuestMigrationCounts;
  backupKey: string | null;
}

/** Total records the migration would attempt to carry into the cloud. */
export function countGuestRecords(snapshot: GuestWorkspaceSnapshot): number {
  return (
    snapshot.subjects.length +
    snapshot.topics.length +
    snapshot.tasks.length +
    snapshot.notes.length +
    snapshot.habits.length +
    snapshot.flashcards.length
  );
}

/** True when a snapshot exists and holds at least one record. */
export function hasGuestData(snapshot: GuestWorkspaceSnapshot | null): boolean {
  return snapshot !== null && countGuestRecords(snapshot) > 0;
}

/**
 * Re-creates the guest workspace inside the freshly authenticated cloud
 * account. Foreign keys pointing at collections outside the migration
 * contract (goals, plan items, time blocks) are intentionally dropped so the
 * batch cannot violate foreign-key constraints.
 */
export async function migrateGuestWorkspaceToCloud(
  snapshot: GuestWorkspaceSnapshot
): Promise<GuestMigrationResult> {
  const subjectIdMap = new Map<string, string>();
  const topicIdMap = new Map<string, string>();
  const noteIdMap = new Map<string, string>();
  const habitIdMap = new Map<string, string>();
  const counts: GuestMigrationCounts = {
    subjects: 0,
    topics: 0,
    tasks: 0,
    subTasks: 0,
    notes: 0,
    habits: 0,
    habitRecords: 0,
    flashcards: 0,
    skipped: 0
  };

  // 1. Subjects (roots of the knowledge graph).
  for (const subject of snapshot.subjects) {
    const created = await dataService.study.createSubject({
      name: subject.name,
      code: subject.code,
      description: subject.description,
      color: subject.color,
      targetHoursPerWeek: subject.targetHoursPerWeek,
      iconName: subject.iconName
    });
    subjectIdMap.set(subject.id, created.id);
    counts.subjects++;
  }

  // 2. Topics (re-mapped to their new subject UUIDs; orphans skipped).
  for (const topic of snapshot.topics) {
    const newSubjectId = subjectIdMap.get(topic.subjectId);
    if (!newSubjectId) {
      console.warn('[GuestMigration] Skipping topic with unresolvable subjectId:', topic.title);
      counts.skipped++;
      continue;
    }
    const created = await dataService.study.createTopic({
      subjectId: newSubjectId,
      title: topic.title,
      description: topic.description,
      orderIndex: topic.orderIndex,
      masteryLevel: topic.masteryLevel
    });
    topicIdMap.set(topic.id, created.id);
    counts.topics++;
  }

  // 3. Notes (subject re-mapped or dropped when unresolvable; notes may be
  // subject-less. Plan-item/session links are not migrated).
  for (const note of snapshot.notes) {
    let newSubjectId: string | undefined;
    if (note.subjectId) {
      newSubjectId = subjectIdMap.get(note.subjectId);
      if (!newSubjectId) {
        console.warn('[GuestMigration] Dropping dangling subject link on note:', note.title);
        counts.skipped++;
      }
    }
    const created = await dataService.notes.createNote({
      title: note.title,
      content: note.content,
      category: note.category,
      subjectId: newSubjectId,
      tags: note.tags || []
    });
    noteIdMap.set(note.id, created.id);
    counts.notes++;
  }

  // 4. Tasks (subject re-mapped or dropped when unresolvable; goal/plan-item/
  // block links are not migrated) + subtask checklists via the canonical
  // subtask service.
  for (const task of snapshot.tasks) {
    let newSubjectId: string | undefined;
    if (task.subjectId) {
      newSubjectId = subjectIdMap.get(task.subjectId);
      if (!newSubjectId) {
        console.warn('[GuestMigration] Dropping dangling subject link on task:', task.title);
        counts.skipped++;
      }
    }
    const created = await dataService.tasks.createTask({
      title: task.title,
      description: task.description,
      status: task.status,
      priority: task.priority,
      category: task.category,
      dueDate: task.dueDate,
      dueTime: task.dueTime,
      estimatedMinutes: task.estimatedMinutes,
      subjectId: newSubjectId,
      tags: task.tags || []
    });
    counts.tasks++;

    for (const sub of task.subTasks || []) {
      if (!sub.title || !sub.title.trim()) {
        counts.skipped++;
        continue;
      }
      try {
        await dataService.tasks.addSubTask(created.id, sub.title);
        counts.subTasks++;
      } catch (err) {
        console.warn('[GuestMigration] Failed to migrate subtask:', sub.title, err);
        counts.skipped++;
      }
    }
  }

  // 5. Habits (shell) + completion history replay so streaks survive —
  // through the canonical habit service (single write path).
  for (const habit of snapshot.habits) {
    const created = await dataService.habits.createHabit({
      title: habit.title,
      description: habit.description,
      category: habit.category,
      frequency: habit.frequency,
      color: habit.color
    });
    habitIdMap.set(habit.id, created.id);
    counts.habits++;
  }

  for (const habit of snapshot.habits) {
    const newHabitId = habitIdMap.get(habit.id);
    if (!newHabitId) continue;
    const completedDates = Object.entries(habit.history || {})
      .filter(([, completed]) => completed === true)
      .map(([date]) => date);
    if (completedDates.length > 0) {
      await dataService.habits.importHabitCompletions(newHabitId, completedDates);
      counts.habitRecords += completedDates.length;
    }
  }

  // 6. Flashcards (subject re-mapped; topic/note links dropped when
  // unresolvable) with their SM-2 scheduling state intact.
  for (const card of snapshot.flashcards) {
    const newSubjectId = subjectIdMap.get(card.subjectId);
    if (!newSubjectId) {
      console.warn('[GuestMigration] Skipping flashcard with unresolvable subjectId:', card.frontPrompt);
      counts.skipped++;
      continue;
    }
    let newTopicId: string | undefined;
    if (card.topicId) {
      newTopicId = topicIdMap.get(card.topicId);
      if (!newTopicId) counts.skipped++;
    }
    let newNoteId: string | undefined;
    if (card.noteId) {
      newNoteId = noteIdMap.get(card.noteId);
      if (!newNoteId) counts.skipped++;
    }
    await dataService.flashcards.createFlashcard({
      subjectId: newSubjectId,
      topicId: newTopicId,
      noteId: newNoteId,
      frontPrompt: card.frontPrompt,
      backAnswer: card.backAnswer,
      cardType: card.cardType,
      difficultyRating: card.difficultyRating,
      repetitionCount: card.repetitionCount,
      intervalDays: card.intervalDays,
      easeFactor: card.easeFactor,
      nextReviewDate: card.nextReviewDate
    });
    counts.flashcards++;
  }

  return { counts, backupKey: null };
}

/**
 * Archives the pre-migration guest workspace with a timestamped backup key so
 * no local record is ever destroyed by the protocol.
 */
export function archiveGuestSnapshot(snapshot: GuestWorkspaceSnapshot): string | null {
  try {
    const backupKey = `solis_mock_backup_${Date.now()}`;
    localStorage.setItem(backupKey, JSON.stringify(snapshot));
    return backupKey;
  } catch {
    // Storage unavailable: the archive is best-effort; migration already succeeded.
    return null;
  }
}
