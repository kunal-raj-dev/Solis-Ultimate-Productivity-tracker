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

export interface StudyTopic extends BaseEntity {
  subjectId: ID;
  title: string;
  description?: string;
  orderIndex: number;
  masteryLevel: TopicMasteryLevel;
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
