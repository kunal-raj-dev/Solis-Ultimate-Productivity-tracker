/**
 * Solis Unified Workspace Search & Command Resolution Engine
 */

import { Task } from '../types/task';
import { StudySubject, StudyTopic } from '../types/study';
import { Note } from '../types/note';
import { Goal } from '../types/goal';

export type CommandItemType =
  | 'action'
  | 'navigation'
  | 'task'
  | 'note'
  | 'subject'
  | 'topic'
  | 'goal';

export interface CommandItem {
  id: string;
  title: string;
  subtitle?: string;
  type: CommandItemType;
  badge?: string;
  shortcut?: string;
  iconName?: string;
  actionUrl?: string;
  onSelect?: () => void;
}

export interface WorkspaceDataSources {
  tasks?: Task[];
  notes?: Note[];
  subjects?: StudySubject[];
  topics?: StudyTopic[];
  goals?: Goal[];
}

export const DEFAULT_NAVIGATION_COMMANDS: CommandItem[] = [
  {
    id: 'nav-dashboard',
    title: 'Go to Dashboard',
    subtitle: 'Daily horizon & momentum overview',
    type: 'navigation',
    actionUrl: '/app/dashboard',
    shortcut: 'G D'
  },
  {
    id: 'nav-study',
    title: 'Go to Study Studio',
    subtitle: 'Syllabus, topics & study logs',
    type: 'navigation',
    actionUrl: '/app/study',
    shortcut: 'G S'
  },
  {
    id: 'nav-focus',
    title: 'Go to Focus Sanctuary',
    subtitle: 'Deep flow timers & ambient audio',
    type: 'navigation',
    actionUrl: '/app/focus',
    shortcut: 'G F'
  },
  {
    id: 'nav-notes',
    title: 'Go to Knowledge Notes',
    subtitle: 'Concepts, summaries & reflections',
    type: 'navigation',
    actionUrl: '/app/notes',
    shortcut: 'G N'
  },
  {
    id: 'nav-tasks',
    title: 'Go to Tasks Sanctuary',
    subtitle: 'Milestones & execution lists',
    type: 'navigation',
    actionUrl: '/app/tasks',
    shortcut: 'G T'
  },
  {
    id: 'nav-analytics',
    title: 'Go to Intelligence & Analytics',
    subtitle: 'Mastery metrics & cognitive rhythm',
    type: 'navigation',
    actionUrl: '/app/analytics',
    shortcut: 'G A'
  },
  {
    id: 'nav-habits',
    title: 'Go to Habits & Rituals',
    subtitle: 'Consistency streaks & daily habits',
    type: 'navigation',
    actionUrl: '/app/habits'
  },
  {
    id: 'nav-goals',
    title: 'Go to Horizons & Goals',
    subtitle: 'Long-term aspirations & milestones',
    type: 'navigation',
    actionUrl: '/app/goals'
  },
  {
    id: 'nav-review',
    title: 'Go to Weekly Review Ritual',
    subtitle: '5-pillar reflection & strategic calibration',
    type: 'navigation',
    actionUrl: '/app/review',
    shortcut: 'G W'
  },
  {
    id: 'nav-settings',
    title: 'Go to Settings & Data Hub',
    subtitle: 'Preferences, backup & exports',
    type: 'navigation',
    actionUrl: '/app/settings'
  }
];

export function searchWorkspace(
  query: string,
  sources: WorkspaceDataSources
): CommandItem[] {
  const normalized = query.trim().toLowerCase();

  if (!normalized) {
    return [];
  }

  const results: CommandItem[] = [];

  // 1. Search Tasks
  if (sources.tasks) {
    for (const t of sources.tasks) {
      if (
        t.title.toLowerCase().includes(normalized) ||
        (t.tags && t.tags.some((tag) => tag.toLowerCase().includes(normalized))) ||
        t.category.toLowerCase().includes(normalized)
      ) {
        results.push({
          id: `task-${t.id}`,
          title: t.title,
          subtitle: `Task • ${t.category} • Priority: ${t.priority}`,
          type: 'task',
          badge: t.status === 'completed' ? 'Done' : 'Task',
          actionUrl: '/app/tasks'
        });
      }
    }
  }

  // 2. Search Notes
  if (sources.notes) {
    for (const n of sources.notes) {
      if (
        n.title.toLowerCase().includes(normalized) ||
        (n.content && n.content.toLowerCase().includes(normalized)) ||
        (n.tags && n.tags.some((tag) => tag.toLowerCase().includes(normalized)))
      ) {
        results.push({
          id: `note-${n.id}`,
          title: n.title,
          subtitle: `Note • ${n.category || 'General'}${n.subjectName ? ` • ${n.subjectName}` : ''}`,
          type: 'note',
          badge: 'Note',
          actionUrl: '/app/notes'
        });
      }
    }
  }

  // 3. Search Subjects
  if (sources.subjects) {
    for (const s of sources.subjects) {
      if (
        s.name.toLowerCase().includes(normalized) ||
        (s.description && s.description.toLowerCase().includes(normalized))
      ) {
        results.push({
          id: `subject-${s.id}`,
          title: s.name,
          subtitle: `Subject • Target: ${s.targetHoursPerWeek || 0} hrs/week`,
          type: 'subject',
          badge: 'Subject',
          actionUrl: '/app/study'
        });
      }
    }
  }

  // 4. Search Topics
  if (sources.topics) {
    for (const top of sources.topics) {
      if (
        top.title.toLowerCase().includes(normalized) ||
        (top.description && top.description.toLowerCase().includes(normalized))
      ) {
        results.push({
          id: `topic-${top.id}`,
          title: top.title,
          subtitle: `Topic • Mastery: ${top.masteryLevel}`,
          type: 'topic',
          badge: 'Topic',
          actionUrl: '/app/study'
        });
      }
    }
  }

  // 5. Search Goals
  if (sources.goals) {
    for (const g of sources.goals) {
      if (
        g.title.toLowerCase().includes(normalized) ||
        (g.description && g.description.toLowerCase().includes(normalized))
      ) {
        results.push({
          id: `goal-${g.id}`,
          title: g.title,
          subtitle: `Goal • Horizon: ${g.horizon} • Priority: ${g.priority}`,
          type: 'goal',
          badge: 'Goal',
          actionUrl: '/app/goals'
        });
      }
    }
  }

  // 6. Search Navigation
  for (const nav of DEFAULT_NAVIGATION_COMMANDS) {
    if (
      nav.title.toLowerCase().includes(normalized) ||
      (nav.subtitle && nav.subtitle.toLowerCase().includes(normalized))
    ) {
      results.push(nav);
    }
  }

  return results.slice(0, 15);
}
