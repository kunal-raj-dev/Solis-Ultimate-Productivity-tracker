import { BaseEntity, ID } from './common';

export type ResourceType = 'pdf' | 'paper' | 'book' | 'video' | 'documentation' | 'article';

export type ReadingStatus = 'unread' | 'in_progress' | 'completed';

export interface StudyResource extends BaseEntity {
  subjectId: ID;
  subjectName?: string;
  topicId?: ID;
  topicTitle?: string;
  title: string;
  author?: string;
  url?: string;
  type: ResourceType;
  status: ReadingStatus;
  rating?: number; // 1-5 scale
  notes?: string;
  tags: string[];
}

export interface ResourceFilterOptions {
  subjectId?: string;
  topicId?: string;
  type?: ResourceType;
  status?: ReadingStatus;
  search?: string;
}
