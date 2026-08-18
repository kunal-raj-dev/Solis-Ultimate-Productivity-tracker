import { BaseEntity, ID, PriorityLevel } from './common';

export type CardType = 'standard' | 'cloze' | 'concept';
export type CardRating = 'again' | 'hard' | 'good' | 'easy';

export interface Flashcard extends BaseEntity {
  subjectId: ID;
  subjectName?: string;
  topicId?: ID;
  topicTitle?: string;
  noteId?: ID;
  frontPrompt: string;
  backAnswer: string;
  cardType: CardType;
  difficultyRating: CardRating;
  repetitionCount: number;
  intervalDays: number;
  easeFactor: number;
  nextReviewDate: string; // ISO date 'YYYY-MM-DD'
  lastReviewedAt?: string;
}

export interface ReviewQueueItem {
  id: ID;
  subjectId: ID;
  subjectName: string;
  subjectColor: string;
  topicId: ID;
  topicTitle: string;
  flashcardId?: ID;
  dueDate: string; // ISO date 'YYYY-MM-DD'
  priority: PriorityLevel;
  reason: string;
  completed: boolean;
  completedAt?: string;
  createdAt: string;
}

export interface CardReviewResult {
  cardId: ID;
  rating: CardRating;
  previousInterval: number;
  nextInterval: number;
  nextReviewDate: string;
}
