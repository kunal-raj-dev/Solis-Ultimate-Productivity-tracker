import { BaseEntity, ID, PriorityLevel } from './common';

export type TaskStatus = 'todo' | 'in_progress' | 'completed' | 'partial' | 'missed' | 'archived';

export type TaskCategory = 'study' | 'project' | 'review' | 'admin' | 'deep_work';

export type TaskTimeFilter = 'all' | 'today' | 'upcoming' | 'overdue' | 'completed';

export type TaskSortField = 'priority' | 'dueDate' | 'createdAt' | 'title' | 'status';

export type TaskSortOrder = 'asc' | 'desc';

export type TimeBlockStatus = 'planned' | 'active' | 'completed' | 'partial' | 'missed';

export type TaskViewMode = 'today' | 'timeline' | 'inbox' | 'matrix' | 'review';

export interface SubTask {
  id: ID;
  title: string;
  completed: boolean;
  createdAt?: string;
}

export interface TaskTimeBlock {
  id: string;
  userId?: string;
  taskId?: ID;
  taskTitle: string;
  description?: string;
  date: string; // YYYY-MM-DD
  startHour: number; // 0..23
  startMinute?: number; // 0..59
  durationMinutes: number; // default 60
  subjectId?: ID;
  goalId?: ID;
  priority: PriorityLevel;
  status: TimeBlockStatus;
  actualMinutes?: number;
  progressPercent?: number; // 0..100
  reflection?: string;
  blocker?: string;
  nextAction?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TimeBlockReviewPayload {
  status: 'completed' | 'partial' | 'missed';
  progressPercent: number;
  actualMinutes: number;
  reflection?: string;
  blocker?: string;
  nextAction?: string;
  rescheduleToHour?: number;
  rescheduleToDate?: string;
}

export type RecurrenceFrequency = 'daily' | 'weekdays' | 'weekly' | 'custom';

export interface TaskRecurrence {
  frequency: RecurrenceFrequency;
  interval?: number; // e.g., every 2 days or 2 weeks
  daysOfWeek?: number[]; // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  endDate?: string;
  occurrenceCount?: number;
  maxOccurrences?: number;
  parentTaskId?: string; // Link back to series
}

export interface Task extends BaseEntity {
  title: string;
  description?: string;
  status: TaskStatus;
  priority: PriorityLevel;
  category: TaskCategory;
  dueDate?: string; // ISO String or YYYY-MM-DD
  dueTime?: string; // HH:mm
  estimatedMinutes?: number;
  completedMinutes?: number;
  completedAt?: string;
  subjectId?: ID;
  goalId?: ID;
  planItemId?: ID;
  timeBlockId?: string;
  subTasks: SubTask[];
  tags: string[];
  recurrence?: TaskRecurrence;
  isRecurring?: boolean;
  naturalLanguageInput?: string;
}

export interface TaskFilterOptions {
  status?: TaskStatus | 'all';
  timeFilter?: TaskTimeFilter;
  priority?: PriorityLevel | 'all';
  category?: TaskCategory | 'all';
  search?: string;
  sortBy?: TaskSortField;
  sortOrder?: TaskSortOrder;
  isRecurring?: boolean;
}

export type WorkloadState = 'light' | 'optimal' | 'heavy' | 'overcommitted';

export interface WorkloadSummary {
  plannedTasksMinutes: number;
  plannedBlocksMinutes: number;
  totalPlannedMinutes: number;
  dailyCapacityMinutes: number;
  remainingCapacityMinutes: number;
  overcommittedMinutes: number;
  state: WorkloadState;
  rescheduleCandidates: Task[];
}

