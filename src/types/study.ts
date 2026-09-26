import { BaseEntity, ID } from './common';

export type SubjectStatus = 'active' | 'archived';

export interface StudySubject extends BaseEntity {
  name: string;
  code?: string;
  description?: string;
  color: string; // token reference e.g., 'coral', 'amber', 'lavender', 'sage'
  targetHoursPerWeek: number;
  completedHoursThisWeek: number; // Derived dynamically from study_sessions
  status: SubjectStatus;
  iconName?: string;
  notesCount: number; // Derived dynamically from notes
}

export type TopicMasteryLevel = 'unstudied' | 'learning' | 'mastered';

/** Position in the hierarchical syllabus tree (Unit → Chapter → Concept, plan §4.2). */
export type TopicHierarchyLevel = 'unit' | 'chapter' | 'concept';

export interface StudyTopic extends BaseEntity {
  subjectId: ID;
  title: string;
  description?: string;
  orderIndex: number;
  masteryLevel: TopicMasteryLevel;
  /** Optional parent topic id. Absent (or pointing at a missing topic) = top-level topic. */
  parentId?: ID;
  /**
   * Position in the syllabus hierarchy (plan §4.2). Shipped optional — rather
   * than the plan's bare `level:` — so existing topics, services, and fixtures
   * keep compiling; absent topics render as leaf concepts.
   */
  level?: TopicHierarchyLevel;
}

export type StudySessionType =
  | 'deep_study'
  | 'active_recall'
  | 'spaced_repetition'
  | 'problem_solving'
  | 'reading';

export interface StudySession extends BaseEntity {
  subjectId: ID;
  subjectName: string; // Resolved dynamically or snapshot
  planItemId?: ID;
  focusSessionId?: ID;
  type: StudySessionType;
  durationMinutes: number;
  topicsCovered: string[];
  notes?: string;
  retentionRating: 1 | 2 | 3 | 4 | 5;
  completedAt: string;
}

export type PlanPriority = 'urgent' | 'high' | 'medium' | 'low';

export interface StudyPlanItem {
  id: ID;
  subjectId: ID;
  subjectName: string; // Resolved dynamically via Subject lookup
  topicId?: ID;
  title: string;
  targetMinutes: number;
  scheduledDate?: string;
  scheduledTime?: string;
  priority: PlanPriority;
  completed: boolean;
  notes?: string;
  linkedTaskId?: ID;
  actualMinutesLogged?: number; // Derived dynamically from study_sessions (never stored)
  createdAt?: string;
}
