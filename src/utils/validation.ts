/**
 * Solis - Domain Validation Layer
 * Enforces business constraints close to the domain boundary.
 */

import { HabitKind } from '../types/habit';

export class ValidationError extends Error {
  public readonly field?: string;

  constructor(message: string, field?: string) {
    super(message);
    this.name = 'ValidationError';
    this.field = field;
  }
}

export type Result<T> =
  | { success: true; data: T }
  | { success: false; error: string; field?: string };

export function validateTaskInput(data: {
  title?: string;
  category?: string;
  priority?: string;
  estimatedMinutes?: number;
  dueDate?: string;
}): Result<boolean> {
  if (!data.title || data.title.trim().length === 0) {
    return { success: false, error: 'Task title is required and cannot be empty.', field: 'title' };
  }

  if (data.title.trim().length > 200) {
    return { success: false, error: 'Task title must be 200 characters or fewer.', field: 'title' };
  }

  if (data.estimatedMinutes !== undefined && (data.estimatedMinutes < 0 || data.estimatedMinutes > 1440)) {
    return { success: false, error: 'Estimated minutes must be between 1 and 1440 (24h).', field: 'estimatedMinutes' };
  }

  if (data.dueDate && isNaN(Date.parse(data.dueDate))) {
    return { success: false, error: 'Due date is not a valid ISO date string.', field: 'dueDate' };
  }

  return { success: true, data: true };
}

export function validateStudySessionInput(data: {
  subjectId?: string;
  subjectName?: string;
  durationMinutes?: number;
  topicsCovered?: string[];
}): Result<boolean> {
  const hasSubject =
    (data.subjectName && data.subjectName.trim().length > 0) ||
    (data.subjectId && data.subjectId.trim().length > 0);

  if (!hasSubject) {
    return { success: false, error: 'Subject is required for study logging.', field: 'subject' };
  }

  if (!data.durationMinutes || data.durationMinutes <= 0 || data.durationMinutes > 720) {
    return { success: false, error: 'Duration must be between 1 and 720 minutes.', field: 'durationMinutes' };
  }

  if (!data.topicsCovered || data.topicsCovered.length === 0 || !data.topicsCovered[0]?.trim()) {
    return { success: false, error: 'At least one topic covered is required.', field: 'topicsCovered' };
  }

  return { success: true, data: true };
}

export function validateHabitInput(data: {
  title?: string;
  category?: string;
  frequency?: string;
  kind?: HabitKind;
  unit?: string;
  targetValue?: number;
  baseTierValue?: number;
  stretchTierValue?: number;
}): Result<boolean> {
  if (!data.title || data.title.trim().length === 0) {
    return { success: false, error: 'Habit title is required.', field: 'title' };
  }

  if (data.title.trim().length > 120) {
    return { success: false, error: 'Habit title must be 120 characters or fewer.', field: 'title' };
  }

  if (data.kind === 'quantitative') {
    if (data.targetValue === undefined || isNaN(data.targetValue) || data.targetValue <= 0) {
      return { success: false, error: 'Target goal must be a positive number.', field: 'targetValue' };
    }

    if (data.baseTierValue !== undefined && data.baseTierValue !== null && !isNaN(data.baseTierValue)) {
      if (data.baseTierValue <= 0) {
        return { success: false, error: 'Base tier value must be greater than zero.', field: 'baseTierValue' };
      }
      if (data.baseTierValue > data.targetValue) {
        return {
          success: false,
          error: 'Base tier (minimum viable habit) cannot exceed the target goal.',
          field: 'baseTierValue'
        };
      }
    }

    if (data.stretchTierValue !== undefined && data.stretchTierValue !== null && !isNaN(data.stretchTierValue)) {
      if (data.stretchTierValue < data.targetValue) {
        return {
          success: false,
          error: 'Mastery stretch goal must be greater than or equal to the target goal.',
          field: 'stretchTierValue'
        };
      }
    }
  }

  return { success: true, data: true };
}

export function validateGoalInput(data: {
  title?: string;
  targetDate?: string;
}): Result<boolean> {
  if (!data.title || data.title.trim().length === 0) {
    return { success: false, error: 'Goal title is required.', field: 'title' };
  }

  if (data.title.trim().length > 200) {
    return { success: false, error: 'Goal title must be 200 characters or fewer.', field: 'title' };
  }

  if (data.targetDate && isNaN(Date.parse(data.targetDate))) {
    return { success: false, error: 'Target date must be a valid date.', field: 'targetDate' };
  }

  return { success: true, data: true };
}

export function validateFlashcardInput(data: {
  front?: string;
  back?: string;
  topic?: string;
}): Result<boolean> {
  if (!data.front || data.front.trim().length === 0) {
    return { success: false, error: 'Flashcard question/front is required.', field: 'front' };
  }

  if (data.front.trim().length > 1000) {
    return { success: false, error: 'Flashcard question must be 1000 characters or fewer.', field: 'front' };
  }

  if (!data.back || data.back.trim().length === 0) {
    return { success: false, error: 'Flashcard answer/back is required.', field: 'back' };
  }

  if (data.back.trim().length > 2000) {
    return { success: false, error: 'Flashcard answer must be 2000 characters or fewer.', field: 'back' };
  }

  return { success: true, data: true };
}

export function validateTimeBlockInput(data: {
  date?: string;
  startHour?: number;
  durationMinutes?: number;
}): Result<boolean> {
  if (data.date && isNaN(Date.parse(data.date))) {
    return { success: false, error: 'Date must be a valid ISO date string.', field: 'date' };
  }

  if (data.startHour !== undefined && (data.startHour < 0 || data.startHour > 23)) {
    return { success: false, error: 'Start hour must be between 0 and 23.', field: 'startHour' };
  }

  if (data.durationMinutes !== undefined && (data.durationMinutes <= 0 || data.durationMinutes > 720)) {
    return { success: false, error: 'Duration must be between 1 and 720 minutes (12h).', field: 'durationMinutes' };
  }

  return { success: true, data: true };
}

