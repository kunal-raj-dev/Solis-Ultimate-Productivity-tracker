import { BaseEntity, ID, PriorityLevel } from './common';

export type GoalHorizon = 'short_term' | 'medium_term' | 'long_term' | 'vision';

export type GoalStatus = 'active' | 'completed' | 'paused' | 'archived';

export type GoalExperienceType = 'standard' | 'exam' | 'project';

export interface GoalMilestone {
  id: ID;
  title: string;
  targetDate: string;
  completed: boolean;
  completedAt?: string;
}

export interface Goal extends BaseEntity {
  title: string;
  description?: string;
  horizon: GoalHorizon;
  status: GoalStatus;
  category: 'academic' | 'career' | 'skill' | 'personal';
  experienceType?: GoalExperienceType; // 'standard' | 'exam' | 'project'
  subjectId?: ID;
  subjectName?: string;
  targetDate: string;
  progressPercentage: number;
  priority: PriorityLevel;
  color: string;
  milestones: GoalMilestone[];
  // Exam workspace metadata
  targetScore?: string;
  examWeight?: number; // e.g. 40% of grade
  // Project workspace metadata
  projectRepositoryUrl?: string;
  deliverables?: string[];
}
