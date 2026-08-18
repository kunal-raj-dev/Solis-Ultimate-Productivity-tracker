/**
 * Solis Export & Data Portability Utilities
 * Pure deterministic transformations for JSON and CSV exports.
 */

import { Task } from '../types/task';
import { StudySubject, StudySession, StudyPlanItem, StudyTopic } from '../types/study';
import { Note } from '../types/note';
import { FocusSession } from '../types/focus';
import { Habit } from '../types/habit';
import { Goal } from '../types/goal';
import { UserProfile } from '../types/auth';

export interface SolisWorkspaceBackup {
  schema: 'solis-export-v1';
  version: number;
  exportedAt: string;
  client: string;
  profile: Partial<UserProfile>;
  subjects: StudySubject[];
  topics: StudyTopic[];
  studyPlans: StudyPlanItem[];
  studySessions: StudySession[];
  focusSessions: FocusSession[];
  tasks: Task[];
  habits: Habit[];
  goals: Goal[];
  notes: Note[];
}

export function createWorkspaceBackup(params: {
  profile?: UserProfile | null;
  subjects: StudySubject[];
  topics: StudyTopic[];
  studyPlans: StudyPlanItem[];
  studySessions: StudySession[];
  focusSessions: FocusSession[];
  tasks: Task[];
  habits: Habit[];
  goals: Goal[];
  notes: Note[];
}): SolisWorkspaceBackup {
  return {
    schema: 'solis-export-v1',
    version: 1,
    exportedAt: new Date().toISOString(),
    client: 'Solis Productivity OS',
    profile: params.profile ? {
      name: params.profile.name,
      email: params.profile.email,
      focusField: params.profile.focusField,
      preferences: params.profile.preferences
    } : {},
    subjects: params.subjects,
    topics: params.topics,
    studyPlans: params.studyPlans,
    studySessions: params.studySessions,
    focusSessions: params.focusSessions,
    tasks: params.tasks,
    habits: params.habits,
    goals: params.goals,
    notes: params.notes
  };
}

export function escapeCSVField(field: any): string {
  if (field === null || field === undefined) return '""';
  let str = String(field);
  // CSV Formula Injection Defense (CWE-1236):
  // Neutralize leading formula characters in spreadsheet applications
  if (/^[=+\-@\t\r]/.test(str)) {
    str = `'${str}`;
  }
  str = str.replace(/"/g, '""');
  return `"${str}"`;
}

export function convertTasksToCSV(tasks: Task[]): string {
  const headers = ['ID', 'Title', 'Category', 'Priority', 'Status', 'Due Date', 'Completed At', 'Subtasks Count', 'Tags'];
  const rows = tasks.map((t) => [
    escapeCSVField(t.id),
    escapeCSVField(t.title),
    escapeCSVField(t.category),
    escapeCSVField(t.priority),
    escapeCSVField(t.status),
    escapeCSVField(t.dueDate || ''),
    escapeCSVField(t.completedAt || ''),
    escapeCSVField(t.subTasks ? t.subTasks.length : 0),
    escapeCSVField(t.tags ? t.tags.join('; ') : '')
  ].join(','));

  return [headers.join(','), ...rows].join('\n');
}

export function convertStudySessionsToCSV(sessions: StudySession[]): string {
  const headers = ['ID', 'Subject Name', 'Duration (Minutes)', 'Type', 'Retention Rating', 'Completed At', 'Topics Covered', 'Notes'];
  const rows = sessions.map((s) => [
    escapeCSVField(s.id),
    escapeCSVField(s.subjectName || 'General Study'),
    escapeCSVField(s.durationMinutes),
    escapeCSVField(s.type),
    escapeCSVField(s.retentionRating || ''),
    escapeCSVField(s.completedAt || ''),
    escapeCSVField(s.topicsCovered ? s.topicsCovered.join('; ') : ''),
    escapeCSVField(s.notes || '')
  ].join(','));

  return [headers.join(','), ...rows].join('\n');
}

export function convertFocusSessionsToCSV(sessions: FocusSession[]): string {
  const headers = ['ID', 'Mode', 'Duration (Minutes)', 'Subject Name', 'Topic', 'Completed At'];
  const rows = sessions.map((s) => [
    escapeCSVField(s.id),
    escapeCSVField(s.mode),
    escapeCSVField(s.durationMinutes),
    escapeCSVField(s.subjectName || ''),
    escapeCSVField(s.topic || s.title || ''),
    escapeCSVField(s.createdAt || '')
  ].join(','));

  return [headers.join(','), ...rows].join('\n');
}

export function convertNotesToCSV(notes: Note[]): string {
  const headers = ['ID', 'Title', 'Category', 'Subject Name', 'Tags', 'Word Count', 'Created At', 'Updated At'];
  const rows = notes.map((n) => {
    const wordCount = n.content ? n.content.trim().split(/\s+/).filter(Boolean).length : 0;
    return [
      escapeCSVField(n.id),
      escapeCSVField(n.title),
      escapeCSVField(n.category),
      escapeCSVField(n.subjectName || ''),
      escapeCSVField(n.tags ? n.tags.join('; ') : ''),
      escapeCSVField(wordCount),
      escapeCSVField(n.createdAt),
      escapeCSVField(n.updatedAt)
    ].join(',');
  });

  return [headers.join(','), ...rows].join('\n');
}

export function convertHabitsToCSV(habits: Habit[]): string {
  const headers = ['ID', 'Title', 'Category', 'Frequency', 'Current Streak', 'Best Streak', 'Total Completions'];
  const rows = habits.map((h) => {
    const totalCompletions = h.history ? Object.values(h.history).filter(Boolean).length : 0;
    return [
      escapeCSVField(h.id),
      escapeCSVField(h.title),
      escapeCSVField(h.category),
      escapeCSVField(h.frequency),
      escapeCSVField(h.currentStreak || 0),
      escapeCSVField(h.longestStreak || 0),
      escapeCSVField(totalCompletions)
    ].join(',');
  });

  return [headers.join(','), ...rows].join('\n');
}

export function convertGoalsToCSV(goals: Goal[]): string {
  const headers = ['ID', 'Title', 'Horizon', 'Category', 'Priority', 'Status', 'Target Date', 'Milestones Count', 'Completed Milestones'];
  const rows = goals.map((g) => {
    const totalMilestones = g.milestones ? g.milestones.length : 0;
    const completedMilestones = g.milestones ? g.milestones.filter((m) => m.completed).length : 0;
    return [
      escapeCSVField(g.id),
      escapeCSVField(g.title),
      escapeCSVField(g.horizon),
      escapeCSVField(g.category),
      escapeCSVField(g.priority),
      escapeCSVField(g.status),
      escapeCSVField(g.targetDate || ''),
      escapeCSVField(totalMilestones),
      escapeCSVField(completedMilestones)
    ].join(',');
  });

  return [headers.join(','), ...rows].join('\n');
}

export function triggerDownload(content: string, filename: string, mimeType: string): void {
  if (typeof window === 'undefined') return;

  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}
