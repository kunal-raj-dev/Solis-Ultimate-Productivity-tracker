import { BaseEntity, ID } from './common';

export type NoteCategory =
  | 'lecture'
  | 'concept'
  | 'revision'
  | 'problem_solving'
  | 'idea'
  | 'reflection'
  | 'reference';

export interface Note extends BaseEntity {
  userId?: ID;
  subjectId?: ID;
  subjectName?: string;
  planItemId?: ID;
  studySessionId?: ID;
  title: string;
  content: string;
  category: NoteCategory;
  tags: string[];
}

export interface NoteFilterOptions {
  category?: string;
  tag?: string;
  subjectId?: string;
  searchQuery?: string;
}
