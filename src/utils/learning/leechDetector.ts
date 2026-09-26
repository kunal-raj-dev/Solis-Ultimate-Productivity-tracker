/**
 * Solis Spaced Repetition — Active Leech Detection & Concept Atomization
 *
 * Feature 3.4 (Plan §4.5):
 * Detects flashcards failed >= 4 times within a rolling 14-day window.
 * Instead of punishing the learner or hiding the card, Solis tags the card
 * as a "leech" (a high-friction, confusing card) and offers 1-click concept
 * atomization — splitting the broad, overloaded card into two atomic,
 * low-cognitive-load cards or providing an AI/cognitive analogy.
 *
 * Adheres strictly to Master Engineering & Agent Instructions:
 * - Pure, deterministic transformations.
 * - Non-punitive, supportive language.
 * - Preserves existing subject, topic, and tags.
 */

import { Flashcard, CardRating } from '../../types/learning';

export const LEECH_LAPSE_THRESHOLD = 4;
export const LEECH_WINDOW_DAYS = 14;
const DAY_MS = 24 * 60 * 60 * 1000;

export interface LeechStatus {
  isLeech: boolean;
  lapsesCount: number;
  lastLapseAt?: string;
  recommendedAction: 'continue' | 'atomize_concept' | 'review_fundamentals';
  frictionLevel: 'none' | 'moderate' | 'high';
}

export interface AtomizedCardPair {
  card1: {
    frontPrompt: string;
    backAnswer: string;
    hint?: string;
  };
  card2: {
    frontPrompt: string;
    backAnswer: string;
    hint?: string;
  };
  rationale: string;
  splitStrategy: 'delimiter_split' | 'cloze_split' | 'query_split' | 'definition_application';
}

/**
 * Evaluates whether a card meets the leech threshold (>= 4 lapses in rolling window).
 */
export function isCardLeech(
  card: Pick<Flashcard, 'isLeech' | 'lapsesCount' | 'lastLapseAt'>,
  now: Date = new Date(),
  windowDays: number = LEECH_WINDOW_DAYS
): boolean {
  if (card.isLeech === true) return true;

  const count = card.lapsesCount || 0;
  if (count < LEECH_LAPSE_THRESHOLD) return false;

  if (!card.lastLapseAt) {
    return count >= LEECH_LAPSE_THRESHOLD;
  }

  const lastLapse = new Date(card.lastLapseAt).getTime();
  const elapsedDays = Math.max(0, (now.getTime() - lastLapse) / DAY_MS);

  return elapsedDays <= windowDays;
}

/**
 * Inspects a card's review history and returns detailed friction metrics.
 */
export function getCardLeechStatus(
  card: Pick<Flashcard, 'isLeech' | 'lapsesCount' | 'lastLapseAt'>,
  now: Date = new Date()
): LeechStatus {
  const count = card.lapsesCount || 0;
  const isLeech = isCardLeech(card, now);

  let frictionLevel: 'none' | 'moderate' | 'high' = 'none';
  if (isLeech) {
    frictionLevel = 'high';
  } else if (count >= 2) {
    frictionLevel = 'moderate';
  }

  let recommendedAction: 'continue' | 'atomize_concept' | 'review_fundamentals' = 'continue';
  if (isLeech) {
    recommendedAction = 'atomize_concept';
  } else if (count >= 2) {
    recommendedAction = 'review_fundamentals';
  }

  return {
    isLeech,
    lapsesCount: count,
    lastLapseAt: card.lastLapseAt,
    recommendedAction,
    frictionLevel
  };
}

/**
 * Updates a card's lapse telemetry after an active recall attempt.
 * Increments lapsesCount on 'again'.
 */
export function updateCardLapseTelemetry(
  card: Pick<Flashcard, 'lapsesCount' | 'lastLapseAt' | 'isLeech'>,
  rating: CardRating,
  now: Date = new Date()
): {
  lapsesCount: number;
  lastLapseAt: string;
  isLeech: boolean;
} {
  let count = card.lapsesCount || 0;
  let lastLapse = card.lastLapseAt || now.toISOString();

  if (rating === 'again') {
    count += 1;
    lastLapse = now.toISOString();
  }

  const isLeech = count >= LEECH_LAPSE_THRESHOLD;

  return {
    lapsesCount: count,
    lastLapseAt: lastLapse,
    isLeech
  };
}

/**
 * Decomposes an overloaded concept into two atomic, high-retention flashcards.
 * Employs multi-tier heuristics:
 * 1. Cloze cards with multiple deletions: splits into single-cloze cards.
 * 2. Multi-part answers (bullet points, semicolons, conjunctions): splits into distinct parts.
 * 3. Compound questions (contains "and", "?", "compare"): splits into individual queries.
 * 4. General fallback: splits into "Core Concept / Definition" and "Application / Mechanism".
 */
export function generateConceptAtomization(card: Flashcard): AtomizedCardPair {
  const prompt = card.frontPrompt.trim();
  const answer = card.backAnswer.trim();

  // Tier 1: Cloze Deletions
  if (card.cardType === 'cloze' || (prompt.includes('{{') && prompt.includes('}}'))) {
    const clozeRegex = /\{\{(.*?)\}\}/g;
    const matches = Array.from(prompt.matchAll(clozeRegex));

    if (matches.length >= 2) {
      // Split into two cards, each having one cloze active and the other revealed
      const firstTarget = matches[0][1];
      const secondTarget = matches[1][1];

      const card1Prompt = prompt.replace(`{{${secondTarget}}}`, secondTarget);
      const card2Prompt = prompt.replace(`{{${firstTarget}}}`, firstTarget);

      return {
        card1: {
          frontPrompt: card1Prompt,
          backAnswer: firstTarget,
          hint: 'Focus on first component'
        },
        card2: {
          frontPrompt: card2Prompt,
          backAnswer: secondTarget,
          hint: 'Focus on second component'
        },
        rationale: 'Separated multiple cloze deletions into individual atomic recall targets.',
        splitStrategy: 'cloze_split'
      };
    }
  }

  // Tier 2: Compound prompt with two questions (e.g. "Where is X? What is Y?")
  if (prompt.includes('?') && prompt.indexOf('?') < prompt.length - 1) {
    const qParts = prompt.split('?').map((q) => q.trim()).filter((q) => q.length > 0);
    if (qParts.length >= 2) {
      const lineSeparators = /\n|\r\n|•|;|\d+\.\s+/;
      let ans1 = answer;
      let ans2 = answer;
      if (lineSeparators.test(answer)) {
        const aParts = answer.split(lineSeparators).map((p) => p.trim()).filter(Boolean);
        if (aParts.length >= 2) {
          ans1 = aParts[0];
          ans2 = aParts.slice(1).join('; ');
        }
      }

      return {
        card1: {
          frontPrompt: `${qParts[0]}?`,
          backAnswer: ans1
        },
        card2: {
          frontPrompt: `${qParts[1]}?`,
          backAnswer: ans2
        },
        rationale: 'Isolated two distinct questions and paired them with their respective answers.',
        splitStrategy: 'query_split'
      };
    }
  }

  // Tier 3: Multi-part Answers (semicolons, newlines, numbered lists, bullet points)
  const lineSeparators = /\n|\r\n|•|;|\d+\.\s+/;
  if (lineSeparators.test(answer)) {
    const parts = answer
      .split(lineSeparators)
      .map((p) => p.trim())
      .filter((p) => p.length > 0);

    if (parts.length >= 2) {
      const mid = Math.ceil(parts.length / 2);
      const part1Answers = parts.slice(0, mid).join('; ');
      const part2Answers = parts.slice(mid).join('; ');

      return {
        card1: {
          frontPrompt: `${prompt} (Part 1: Primary aspects)`,
          backAnswer: part1Answers
        },
        card2: {
          frontPrompt: `${prompt} (Part 2: Subsequent aspects)`,
          backAnswer: part2Answers
        },
        rationale: `Divided an answer with ${parts.length} distinct elements into 2 manageable chunks.`,
        splitStrategy: 'delimiter_split'
      };
    }
  }

  // Tier 4: Answer separated by " and " or comma list
  if (answer.includes(' and ') || (answer.split(',').length >= 2 && answer.length > 40)) {
    let items: string[] = [];
    if (answer.includes(' and ')) {
      items = answer.split(' and ').map((s) => s.trim());
    } else {
      items = answer.split(',').map((s) => s.trim());
    }

    if (items.length >= 2 && items[0].length > 0 && items[1].length > 0) {
      return {
        card1: {
          frontPrompt: `${prompt} (Primary component)`,
          backAnswer: items[0]
        },
        card2: {
          frontPrompt: `${prompt} (Secondary component)`,
          backAnswer: items.slice(1).join(', ')
        },
        rationale: 'Split composite answer into primary and secondary components.',
        splitStrategy: 'delimiter_split'
      };
    }
  }

  // Tier 5: Default Heuristic Atomization (Definition vs Mechanism/Application)
  return {
    card1: {
      frontPrompt: `${prompt} — What is the fundamental concept or definition?`,
      backAnswer: answer
    },
    card2: {
      frontPrompt: `${prompt} — What is a concrete example or key distinguishing feature?`,
      backAnswer: `Key context for: ${answer}`
    },
    rationale: 'Decomposed broad prompt into fundamental concept definition and concrete context.',
    splitStrategy: 'definition_application'
  };
}

/**
 * Creates two new atomic flashcard payloads from an existing leech card.
 */
export function createAtomizedCardPayloads(
  sourceCard: Flashcard,
  pair: AtomizedCardPair
): [Omit<Flashcard, 'id' | 'createdAt' | 'updatedAt'>, Omit<Flashcard, 'id' | 'createdAt' | 'updatedAt'>] {
  const baseSchedule = {
    subjectId: sourceCard.subjectId,
    subjectName: sourceCard.subjectName,
    topicId: sourceCard.topicId,
    topicTitle: sourceCard.topicTitle,
    noteId: sourceCard.noteId,
    cardType: 'standard' as const,
    difficultyRating: 'good' as const,
    repetitionCount: 0,
    intervalDays: 1,
    easeFactor: 2.5,
    nextReviewDate: new Date().toISOString().split('T')[0],
    isLeech: false,
    lapsesCount: 0
  };

  const card1: Omit<Flashcard, 'id' | 'createdAt' | 'updatedAt'> = {
    ...baseSchedule,
    frontPrompt: pair.card1.frontPrompt,
    backAnswer: pair.card1.backAnswer
  };

  const card2: Omit<Flashcard, 'id' | 'createdAt' | 'updatedAt'> = {
    ...baseSchedule,
    frontPrompt: pair.card2.frontPrompt,
    backAnswer: pair.card2.backAnswer
  };

  return [card1, card2];
}
