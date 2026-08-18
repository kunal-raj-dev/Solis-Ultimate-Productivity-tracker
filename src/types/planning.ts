import { BaseEntity, ID } from './common';

export type TimeBlockType = 'study_plan' | 'focus_session' | 'task_deadline' | 'routine';

export interface TimeBlock {
  id: string;
  entityId: string;
  type: TimeBlockType;
  title: string;
  startTime: string; // "14:00"
  endTime: string;   // "15:30"
  durationMinutes: number;
  date: string;      // YYYY-MM-DD
  subjectId?: string;
  subjectName?: string;
  color?: string;
  completed: boolean;
  priority?: 'urgent' | 'high' | 'medium' | 'low';
}

export interface TimeBlockConflict {
  blockA: TimeBlock;
  blockB: TimeBlock;
  overlapMinutes: number;
}

export interface TimeAllocationStats {
  totalPlannedMinutes: number;
  deepStudyMinutes: number;
  taskMinutes: number;
  focusMinutes: number;
  conflictCount: number;
}

export type DayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6; // 0 = Sunday, 1 = Monday ... 6 = Saturday

export interface RecurringStudyRoutine extends BaseEntity {
  subjectId: ID;
  subjectName?: string;
  topicId?: ID;
  topicTitle?: string;
  title: string;
  targetMinutes: number;
  daysOfWeek: DayOfWeek[];
  scheduledTime: string; // "14:00"
  priority: 'urgent' | 'high' | 'medium' | 'low';
  isActive: boolean;
}
