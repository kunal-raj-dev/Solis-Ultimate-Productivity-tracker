import { describe, it, expect } from 'vitest';
import {
  isCardLeech,
  getCardLeechStatus,
  updateCardLapseTelemetry,
  generateConceptAtomization,
  createAtomizedCardPayloads
} from '../leechDetector';
import { Flashcard } from '../../../types/learning';

describe('Active Leech Detection & Concept Atomization (Feature 3.4)', () => {
  const baseCard: Flashcard = {
    id: 'fc-1',
    subjectId: 'sub-bio',
    subjectName: 'Cell Biology',
    topicId: 'top-organelles',
    topicTitle: 'Organelles',
    frontPrompt: 'What are the two primary functions of the Golgi apparatus?',
    backAnswer: 'Modifying, sorting, and packaging proteins; Synthesizing glycolipids and glycoproteins.',
    cardType: 'standard',
    difficultyRating: 'good',
    repetitionCount: 4,
    intervalDays: 1,
    easeFactor: 1.7,
    nextReviewDate: '2026-09-27',
    createdAt: '2026-09-01T00:00:00Z',
    updatedAt: '2026-09-20T00:00:00Z'
  };

  describe('isCardLeech & getCardLeechStatus', () => {
    it('returns false for newly created or successful cards', () => {
      expect(isCardLeech(baseCard)).toBe(false);
      const status = getCardLeechStatus(baseCard);
      expect(status.isLeech).toBe(false);
      expect(status.frictionLevel).toBe('none');
      expect(status.recommendedAction).toBe('continue');
    });

    it('returns true if isLeech flag is explicitly set', () => {
      const leechCard = { ...baseCard, isLeech: true };
      expect(isCardLeech(leechCard)).toBe(true);
      const status = getCardLeechStatus(leechCard);
      expect(status.isLeech).toBe(true);
      expect(status.frictionLevel).toBe('high');
      expect(status.recommendedAction).toBe('atomize_concept');
    });

    it('identifies card as leech when lapses >= 4 within 14 days', () => {
      const now = new Date('2026-09-27T12:00:00Z');
      const recentLapse = new Date('2026-09-25T12:00:00Z').toISOString();

      const failedCard: Flashcard = {
        ...baseCard,
        lapsesCount: 4,
        lastLapseAt: recentLapse
      };

      expect(isCardLeech(failedCard, now)).toBe(true);
      const status = getCardLeechStatus(failedCard, now);
      expect(status.isLeech).toBe(true);
      expect(status.frictionLevel).toBe('high');
      expect(status.recommendedAction).toBe('atomize_concept');
    });

    it('does not flag card as leech if lapses occurred outside the 14-day rolling window', () => {
      const now = new Date('2026-09-27T12:00:00Z');
      const oldLapse = new Date('2026-09-01T12:00:00Z').toISOString(); // 26 days ago

      const oldFailedCard: Flashcard = {
        ...baseCard,
        lapsesCount: 4,
        lastLapseAt: oldLapse
      };

      expect(isCardLeech(oldFailedCard, now)).toBe(false);
    });

    it('marks cards with 2-3 lapses as moderate friction before reaching leech status', () => {
      const card: Flashcard = {
        ...baseCard,
        lapsesCount: 3,
        lastLapseAt: new Date().toISOString()
      };
      const status = getCardLeechStatus(card);
      expect(status.isLeech).toBe(false);
      expect(status.frictionLevel).toBe('moderate');
      expect(status.recommendedAction).toBe('review_fundamentals');
    });
  });

  describe('updateCardLapseTelemetry', () => {
    it('increments lapsesCount and flags leech status on 4th fail', () => {
      const now = new Date('2026-09-27T10:00:00Z');
      const card = { lapsesCount: 3, lastLapseAt: undefined, isLeech: false };

      const result = updateCardLapseTelemetry(card, 'again', now);
      expect(result.lapsesCount).toBe(4);
      expect(result.isLeech).toBe(true);
      expect(result.lastLapseAt).toBe(now.toISOString());
    });

    it('preserves lapsesCount on successful ratings without resetting', () => {
      const now = new Date('2026-09-27T10:00:00Z');
      const card = { lapsesCount: 2, lastLapseAt: '2026-09-26T10:00:00Z', isLeech: false };

      const result = updateCardLapseTelemetry(card, 'good', now);
      expect(result.lapsesCount).toBe(2);
      expect(result.isLeech).toBe(false);
    });
  });

  describe('generateConceptAtomization', () => {
    it('atomizes multi-line or semicolon separated answers into 2 distinct parts', () => {
      const pair = generateConceptAtomization(baseCard);
      expect(pair.splitStrategy).toBe('delimiter_split');
      expect(pair.card1.frontPrompt).toContain('Part 1');
      expect(pair.card2.frontPrompt).toContain('Part 2');
      expect(pair.card1.backAnswer).toContain('Modifying, sorting');
      expect(pair.card2.backAnswer).toContain('Synthesizing');
      expect(pair.rationale).toBeDefined();
    });

    it('atomizes cloze cards with multiple deletions into single-cloze cards', () => {
      const clozeCard: Flashcard = {
        ...baseCard,
        cardType: 'cloze',
        frontPrompt: 'The {{Krebs cycle}} produces {{NADH}} and FADH2 in the mitochondria.',
        backAnswer: 'Krebs cycle, NADH'
      };

      const pair = generateConceptAtomization(clozeCard);
      expect(pair.splitStrategy).toBe('cloze_split');
      expect(pair.card1.frontPrompt).toContain('{{Krebs cycle}}');
      expect(pair.card1.frontPrompt).not.toContain('{{NADH}}');
      expect(pair.card2.frontPrompt).toContain('{{NADH}}');
      expect(pair.card2.frontPrompt).not.toContain('{{Krebs cycle}}');
    });

    it('atomizes compound questions with two query marks', () => {
      const compoundCard: Flashcard = {
        ...baseCard,
        frontPrompt: 'Where is insulin synthesized? What stimulates its release?',
        backAnswer: 'Synthesized in pancreatic beta cells; stimulated by elevated blood glucose.'
      };

      const pair = generateConceptAtomization(compoundCard);
      expect(pair.card1.frontPrompt).toBe('Where is insulin synthesized?');
      expect(pair.card2.frontPrompt).toBe('What stimulates its release?');
    });

    it('falls back to definition/application splitting for general cards', () => {
      const singleCard: Flashcard = {
        ...baseCard,
        frontPrompt: 'What is Avogadro\'s number?',
        backAnswer: '6.022 x 10^23 particles per mole'
      };

      const pair = generateConceptAtomization(singleCard);
      expect(pair.splitStrategy).toBe('definition_application');
      expect(pair.card1.frontPrompt).toContain('fundamental concept');
      expect(pair.card2.frontPrompt).toContain('concrete example');
    });
  });

  describe('createAtomizedCardPayloads', () => {
    it('creates two valid Solis flashcard payloads with reset FSRS intervals', () => {
      const pair = generateConceptAtomization(baseCard);
      const [c1, c2] = createAtomizedCardPayloads(baseCard, pair);

      expect(c1.subjectId).toBe(baseCard.subjectId);
      expect(c1.topicId).toBe(baseCard.topicId);
      expect(c1.repetitionCount).toBe(0);
      expect(c1.intervalDays).toBe(1);
      expect(c1.isLeech).toBe(false);
      expect(c1.lapsesCount).toBe(0);

      expect(c2.subjectId).toBe(baseCard.subjectId);
      expect(c2.repetitionCount).toBe(0);
      expect(c2.isLeech).toBe(false);
    });
  });
});
