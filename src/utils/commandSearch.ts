/**
 * Solis Unified Workspace Search & Command Resolution Engine
 */

import { Task } from '../types/task';
import { StudySession, StudySubject, StudyTopic } from '../types/study';
import { FocusSession } from '../types/focus';
import { Note } from '../types/note';
import { Goal } from '../types/goal';
import { SOLIS_GUIDES } from '../data/guides';
import { getWeekStart } from './analytics/trends';

export type CommandItemType =
  | 'action'
  | 'navigation'
  | 'guide'
  | 'task'
  | 'note'
  | 'subject'
  | 'topic'
  | 'goal'
  | 'analytics';

export interface CommandItem {
  id: string;
  title: string;
  subtitle?: string;
  type: CommandItemType;
  badge?: string;
  shortcut?: string;
  iconName?: string;
  actionUrl?: string;
  guideId?: string;
  onSelect?: () => void;
}

export interface WorkspaceDataSources {
  tasks?: Task[];
  notes?: Note[];
  subjects?: StudySubject[];
  topics?: StudyTopic[];
  goals?: Goal[];
  studySessions?: StudySession[];
  focusSessions?: FocusSession[];
}

export const DEFAULT_NAVIGATION_COMMANDS: CommandItem[] = [
  {
    id: 'nav-guides',
    title: 'Open Guide Center & Philosophy',
    subtitle: '18 comprehensive guides on study mastery',
    type: 'navigation',
    actionUrl: '/app/guides',
    shortcut: 'G H'
  },
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
    id: 'nav-hourly-planner',
    title: 'Open 24h Hourly Planner',
    subtitle: 'Daily time-grid & synchronized block scheduler',
    type: 'action',
    actionUrl: '/app/tasks?mode=today',
    shortcut: 'T'
  },
  {
    id: 'nav-task-review',
    title: 'Review Daily Time Blocks',
    subtitle: 'Inspect cognitive velocity & planned vs actual focus',
    type: 'action',
    actionUrl: '/app/tasks?mode=review',
    shortcut: 'G R'
  },
  {
    id: 'nav-rooms',
    title: 'Go to Collaborative Study Rooms',
    subtitle: 'Peer focus pods, shared objectives & epoch timers',
    type: 'navigation',
    actionUrl: '/app/rooms',
    shortcut: 'G P'
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

/**
 * Phase 1 (P1.8): analytics quick facts for the Command Palette — the week's
 * headline numbers, reachable (and searchable) directly from Cmd+K.
 */
export function buildAnalyticsQuickFacts(sources: WorkspaceDataSources): CommandItem[] {
  const facts: CommandItem[] = [];
  const weekStartTime = getWeekStart(new Date()).getTime();
  const inCurrentWeek = (iso?: string | null): boolean => {
    if (!iso) return false;
    const t = new Date(iso).getTime();
    return !Number.isNaN(t) && t >= weekStartTime;
  };

  const studyMinutes = (sources.studySessions || [])
    .filter((s) => inCurrentWeek(s.completedAt || s.createdAt))
    .reduce((acc, s) => acc + (s.durationMinutes || 0), 0);
  const focusMinutes = (sources.focusSessions || [])
    .filter((f) => f.completed && inCurrentWeek(f.createdAt))
    .reduce((acc, f) => acc + (f.durationMinutes || 0), 0);

  const totalMinutes = studyMinutes + focusMinutes;
  if (totalMinutes > 0) {
    const h = Math.floor(totalMinutes / 60);
    const m = totalMinutes % 60;
    facts.push({
      id: 'fact-week-study',
      title: `This week: ${h > 0 ? `${h}h ${m}m` : `${m}m`} studied`,
      subtitle: 'Analytics quick fact — open the full report',
      type: 'analytics',
      badge: 'Stats',
      actionUrl: '/app/analytics'
    });
  }

  if (sources.tasks) {
    const tasksCompleted = sources.tasks.filter(
      (t) => t.status === 'completed' && inCurrentWeek(t.completedAt)
    ).length;
    facts.push({
      id: 'fact-week-tasks',
      title: `This week: ${tasksCompleted} task${tasksCompleted === 1 ? '' : 's'} completed`,
      subtitle: 'Analytics quick fact — open the full report',
      type: 'analytics',
      badge: 'Stats',
      actionUrl: '/app/analytics'
    });
  }

  return facts;
}

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
          actionUrl: `/app/notes?id=${n.id}`
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
          actionUrl: `/app/study?subjectId=${s.id}`
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
          actionUrl: top.subjectId ? `/app/study?subjectId=${top.subjectId}` : '/app/study'
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

  // 7. Search Guides & Philosophy
  for (const guide of SOLIS_GUIDES) {
    if (
      guide.title.toLowerCase().includes(normalized) ||
      guide.summary.toLowerCase().includes(normalized) ||
      guide.category.toLowerCase().includes(normalized) ||
      (guide.keywords && guide.keywords.some((k) => k.toLowerCase().includes(normalized)))
    ) {
      results.push({
        id: `guide-${guide.id}`,
        title: guide.title,
        subtitle: `Guide • ${guide.category.toUpperCase()} • ${guide.summary}`,
        type: 'guide',
        badge: 'Guide',
        guideId: guide.id,
        actionUrl: `/app/guides?guide=${guide.id}`
      });
    }
  }

  // 8. Analytics quick facts (Phase 1, P1.8) — searchable alongside content.
  for (const fact of buildAnalyticsQuickFacts(sources)) {
    if (
      fact.title.toLowerCase().includes(normalized) ||
      (fact.subtitle && fact.subtitle.toLowerCase().includes(normalized))
    ) {
      results.push(fact);
    }
  }

  return results.slice(0, 15);
}
