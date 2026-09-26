import { describe, it, expect } from 'vitest';
import { filterCramDeck } from '../examCram';
import { Flashcard } from '../../../types/learning';

const mockCards: Flashcard[] = [
  {
    id: 'c1',
    subjectId: 'sub-bio',
    topicId: 'top-cells',
    cardType: 'standard',
    frontPrompt: 'What is the mitochondria?',
    backAnswer: 'Powerhouse of the cell',
    difficultyRating: 'good',
    repetitionCount: 4,
    intervalDays: 14,
    easeFactor: 2.5,
    nextReviewDate: '2026-10-10',
    createdAt: '2026-09-01T00:00:00Z',
    updatedAt: '2026-09-01T00:00:00Z'
  },
  {
    id: 'c2',
    subjectId: 'sub-bio',
    topicId: 'top-cells',
    cardType: 'image_occlusion',
    frontPrompt: 'Identify Organelle [1]',
    backAnswer: 'Ribosome',
    difficultyRating: 'hard',
    repetitionCount: 2,
    intervalDays: 3,
    easeFactor: 2.2,
    nextReviewDate: '2026-09-28',
    imageUrl: 'https://example.com/cell.png',
    occlusionZones: [{ id: 'z1', x: 20, y: 30, width: 15, height: 10, label: 'Ribosome' }],
    createdAt: '2026-09-01T00:00:00Z',
    updatedAt: '2026-09-01T00:00:00Z'
  },
  {
    id: 'c3',
    subjectId: 'sub-chem',
    topicId: 'top-thermo',
    cardType: 'cloze',
    frontPrompt: 'The {{c1::Gibbs}} free energy determines spontaneity',
    backAnswer: 'The Gibbs free energy determines spontaneity',
    difficultyRating: 'again',
    repetitionCount: 1,
    intervalDays: 1,
    easeFactor: 2.0,
    nextReviewDate: '2026-09-27',
    createdAt: '2026-09-01T00:00:00Z',
    updatedAt: '2026-09-01T00:00:00Z'
  },
  {
    id: 'c4',
    subjectId: 'sub-chem',
    topicId: 'top-kinetics',
    cardType: 'standard',
    frontPrompt: 'What order is radioactive decay?',
    backAnswer: 'First order kinetics',
    difficultyRating: 'good',
    repetitionCount: 0, // Unstudied
    intervalDays: 0,
    easeFactor: 2.5,
    nextReviewDate: '2026-09-27',
    createdAt: '2026-09-01T00:00:00Z',
    updatedAt: '2026-09-01T00:00:00Z'
  },
  {
    id: 'c5',
    subjectId: 'sub-bio',
    topicId: 'top-genetics',
    cardType: 'cloze',
    frontPrompt: 'DNA replication occurs in the {{c1::5 to 3}} direction',
    backAnswer: 'DNA replication occurs in the 5 to 3 direction',
    difficultyRating: 'easy',
    repetitionCount: 5,
    intervalDays: 30,
    easeFactor: 2.8,
    nextReviewDate: '2026-10-25',
    createdAt: '2026-09-01T00:00:00Z',
    updatedAt: '2026-09-01T00:00:00Z'
  }
];

describe('Feature 2.4: Exam Cram Mode (Filtered Decks Without FSRS Damage)', () => {
  it('returns all cards when no filters or defaults are passed', () => {
    const result = filterCramDeck(mockCards);
    expect(result).toHaveLength(5);
    expect(result.map((c) => c.id)).toEqual(['c1', 'c2', 'c3', 'c4', 'c5']);
  });

  it('filters by subjectId and topicId', () => {
    const bioOnly = filterCramDeck(mockCards, { subjectId: 'sub-bio' });
    expect(bioOnly.map((c) => c.id)).toEqual(['c1', 'c2', 'c5']);

    const cellsOnly = filterCramDeck(mockCards, { subjectId: 'sub-bio', topicId: 'top-cells' });
    expect(cellsOnly.map((c) => c.id)).toEqual(['c1', 'c2']);
  });

  it('filters specifically for Hard & Lapsed cards (hard or again ratings)', () => {
    const hardCards = filterCramDeck(mockCards, { criteria: 'hard' });
    expect(hardCards.map((c) => c.id)).toEqual(['c2', 'c3']);
    expect(hardCards.every((c) => c.difficultyRating === 'hard' || c.difficultyRating === 'again')).toBe(true);
  });

  it('filters specifically for New / Unstudied cards (repetitionCount === 0)', () => {
    const unstudied = filterCramDeck(mockCards, { criteria: 'unstudied' });
    expect(unstudied.map((c) => c.id)).toEqual(['c4']);
    expect(unstudied[0].repetitionCount).toBe(0);
  });

  it('filters specifically for Visual Diagram Image Occlusion cards', () => {
    const ioCards = filterCramDeck(mockCards, { criteria: 'image_occlusion' });
    expect(ioCards.map((c) => c.id)).toEqual(['c2']);
    expect(ioCards[0].cardType).toBe('image_occlusion');
  });

  it('filters specifically for Cloze Deletion cards', () => {
    const clozeCards = filterCramDeck(mockCards, { criteria: 'cloze' });
    expect(clozeCards.map((c) => c.id)).toEqual(['c3', 'c5']);
  });

  it('respects numeric and string card limits', () => {
    const limited2 = filterCramDeck(mockCards, { limit: 2 });
    expect(limited2).toHaveLength(2);

    const limitedStr = filterCramDeck(mockCards, { limit: '3' });
    expect(limitedStr).toHaveLength(3);

    const unlimited = filterCramDeck(mockCards, { limit: 'all' });
    expect(unlimited).toHaveLength(5);
  });

  it('shuffles cards using deterministic random sequence without mutating source array', () => {
    const sourceCopy = [...mockCards];
    // Deterministic reverse order mock generator
    let callIdx = 0;
    const deterministicRandom = () => {
      callIdx++;
      return 0; // Will always swap with index 0
    };

    const shuffled = filterCramDeck(mockCards, { shuffle: true }, deterministicRandom);
    expect(shuffled).toHaveLength(5);
    // Source array is not mutated
    expect(mockCards.map((c) => c.id)).toEqual(sourceCopy.map((c) => c.id));
  });

  it('guarantees source cards spaced repetition fields remain untouched', () => {
    const sourceCard = mockCards[0];
    const originalEase = sourceCard.easeFactor;
    const originalInterval = sourceCard.intervalDays;

    const cramDeck = filterCramDeck(mockCards, { criteria: 'all' });
    expect(cramDeck[0].easeFactor).toBe(originalEase);
    expect(cramDeck[0].intervalDays).toBe(originalInterval);
  });
});
