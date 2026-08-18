import { BaseEntity, ID, PriorityLevel } from './common';

export type TaskStatus = 'todo' | 'in_progress' | 'completed' | 'archived';

export type TaskCategory = 'study' | 'project' | 'review' | 'admin' | 'deep_work';

export type TaskTimeFilter = 'all' | 'today' | 'upcoming' | 'overdue' | 'completed';

export type TaskSortField = 'priority' | 'dueDate' | 'createdAt' | 'title' | 'status';

export type TaskSortOrder = 'asc' | 'desc';

export interface SubTask {
  id: ID;
  title: string;
  completed: boolean;
  createdAt?: string;
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
  subTasks: SubTask[];
  tags: string[];
}

export interface TaskFilterOptions {
  status?: TaskStatus | 'all';
  timeFilter?: TaskTimeFilter;
  priority?: PriorityLevel | 'all';
  category?: TaskCategory | 'all';
  search?: string;
  sortBy?: TaskSortField;
  sortOrder?: TaskSortOrder;
}
