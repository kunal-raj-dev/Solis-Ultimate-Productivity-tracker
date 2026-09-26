import { Flashcard } from '../../types/learning';

export type CramFilterCriteria = 'all' | 'hard' | 'unstudied' | 'image_occlusion' | 'cloze';

export interface CramFilterOptions {
  subjectId?: string;
  topicId?: string;
  criteria?: CramFilterCriteria;
  limit?: number | string;
  shuffle?: boolean;
}

/**
 * Filters and prepares an ad-hoc flashcard deck for Exam Cram Mode.
 * Ensures original card objects and spaced repetition states are never mutated.
 */
export function filterCramDeck(
  cards: Flashcard[],
  options: CramFilterOptions = {},
  randomFn: () => number = Math.random
): Flashcard[] {
  let result = [...cards];

  // Subject filter
  if (options.subjectId && options.subjectId !== 'all') {
    result = result.filter((c) => c.subjectId === options.subjectId);
  }

  // Topic filter
  if (options.topicId && options.topicId !== 'all') {
    result = result.filter((c) => c.topicId === options.topicId);
  }

  // Recall criteria filter
  const criteria = options.criteria || 'all';
  if (criteria === 'hard') {
    result = result.filter((c) => c.difficultyRating === 'hard' || c.difficultyRating === 'again');
  } else if (criteria === 'unstudied') {
    result = result.filter((c) => (c.repetitionCount || 0) === 0);
  } else if (criteria === 'image_occlusion') {
    result = result.filter((c) => c.cardType === 'image_occlusion');
  } else if (criteria === 'cloze') {
    result = result.filter((c) => c.cardType === 'cloze');
  }

  // Shuffle if requested (Fisher-Yates with injected random generator for pure tests)
  if (options.shuffle) {
    result = [...result];
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(randomFn() * (i + 1));
      const temp = result[i];
      result[i] = result[j];
      result[j] = temp;
    }
  }

  // Apply card limit
  if (options.limit && options.limit !== 'all') {
    const num = typeof options.limit === 'number' ? options.limit : parseInt(options.limit, 10);
    if (!isNaN(num) && num > 0) {
      result = result.slice(0, num);
    }
  }

  return result;
}
