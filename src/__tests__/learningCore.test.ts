import { describe, it, expect } from 'vitest';
import {
  calculateNextCardReview,
  parseClozeSyntax,
  evaluateTopicReviewNeed,
  MIN_EASE_FACTOR,
  MAX_EASE_FACTOR
} from '../utils/learning/spacedRepetition';
import { MockDataService } from '../services/mock/mockService';
import { Flashcard } from '../types/learning';

describe('Stage A — Learning Core & Spaced Retrieval Suite', () => {
  describe('SM-2 / Solis Spaced Repetition Algorithm', () => {
    const baseCard: Pick<Flashcard, 'intervalDays' | 'easeFactor' | 'repetitionCount'> = {
      intervalDays: 3,
      easeFactor: 2.5,
      repetitionCount: 1
    };

    it('handles "again" rating by resetting interval to 1 and reducing ease factor', () => {
      const schedule = calculateNextCardReview(baseCard, 'again', new Date('2026-08-17'));
      expect(schedule.intervalDays).toBe(1);
      expect(schedule.repetitionCount).toBe(0);
      expect(schedule.easeFactor).toBe(2.3);
      expect(schedule.nextReviewDate).toBe('2026-08-18');
    });

    it('handles "hard" rating with modest interval scaling and ease penalty', () => {
      const schedule = calculateNextCardReview(baseCard, 'hard', new Date('2026-08-17'));
      expect(schedule.intervalDays).toBe(4); // round(3 * 1.2) = 4
      expect(schedule.repetitionCount).toBe(2);
      expect(schedule.easeFactor).toBe(2.35);
    });

    it('handles "good" rating with standard ease multiplication', () => {
      const initialCard = { intervalDays: 1, easeFactor: 2.5, repetitionCount: 0 };
      const rep1 = calculateNextCardReview(initialCard, 'good', new Date('2026-08-17'));
      expect(rep1.intervalDays).toBe(1);
      expect(rep1.repetitionCount).toBe(1);

      const rep2 = calculateNextCardReview(rep1, 'good', new Date('2026-08-17'));
      expect(rep2.intervalDays).toBe(3);
      expect(rep2.repetitionCount).toBe(2);

      const rep3 = calculateNextCardReview(rep2, 'good', new Date('2026-08-17'));
      expect(rep3.intervalDays).toBe(8); // round(3 * 2.5) = 8
      expect(rep3.repetitionCount).toBe(3);
    });

    it('handles "easy" rating with bonus multiplier and ease increase', () => {
      const initialCard = { intervalDays: 1, easeFactor: 2.5, repetitionCount: 0 };
      const rep1 = calculateNextCardReview(initialCard, 'easy', new Date('2026-08-17'));
      expect(rep1.intervalDays).toBe(3);
      expect(rep1.easeFactor).toBe(2.65);

      const rep2 = calculateNextCardReview(rep1, 'easy', new Date('2026-08-17'));
      expect(rep2.intervalDays).toBe(6);
      expect(rep2.easeFactor).toBe(2.80);
    });

    it('clamps ease factor within safe limits [1.30, 3.00]', () => {
      const lowEaseCard = { intervalDays: 1, easeFactor: 1.35, repetitionCount: 0 };
      const lowResult = calculateNextCardReview(lowEaseCard, 'again');
      expect(lowResult.easeFactor).toBe(MIN_EASE_FACTOR);

      const highEaseCard = { intervalDays: 1, easeFactor: 2.95, repetitionCount: 0 };
      const highResult = calculateNextCardReview(highEaseCard, 'easy');
      expect(highResult.easeFactor).toBe(MAX_EASE_FACTOR);
    });
  });

  describe('Cloze Deletion Parsing', () => {
    it('parses single cloze deletion bracket correctly', () => {
      const raw = 'The {{mitochondria}} is the powerhouse of the cell.';
      const result = parseClozeSyntax(raw);

      expect(result.hasCloze).toBe(true);
      expect(result.promptText).toBe('The [...] is the powerhouse of the cell.');
      expect(result.extractedAnswers).toEqual(['mitochondria']);
    });

    it('parses multiple cloze deletion brackets in sequence', () => {
      const raw = 'In Raft, a {{leader}} is elected by a {{majority}} of votes.';
      const result = parseClozeSyntax(raw);

      expect(result.hasCloze).toBe(true);
      expect(result.promptText).toBe('In Raft, a [...] is elected by a [...] of votes.');
      expect(result.extractedAnswers).toEqual(['leader', 'majority']);
    });

    it('handles standard text without cloze brackets safely', () => {
      const raw = 'Standard question without cloze tags.';
      const result = parseClozeSyntax(raw);

      expect(result.hasCloze).toBe(false);
      expect(result.promptText).toBe(raw);
      expect(result.extractedAnswers).toEqual([]);
    });
  });

  describe('Topic Retention Decay Evaluation', () => {
    it('evaluates newly studied topics with high retention as not due', () => {
      const result = evaluateTopicReviewNeed('2026-08-16', 5, new Date('2026-08-17'));
      expect(result.isDue).toBe(false); // 1 day elapsed, target interval is 7 days
      expect(result.recommendedIntervalDays).toBe(7);
    });

    it('evaluates topics past their retention window as due for spaced review', () => {
      const result = evaluateTopicReviewNeed('2026-08-10', 4, new Date('2026-08-17'));
      expect(result.isDue).toBe(true); // 7 days elapsed, target interval was 5 days
      expect(result.reason).toContain('7 days elapsed');
    });

    it('evaluates unstudied topics as immediately due for review drill', () => {
      const result = evaluateTopicReviewNeed(undefined);
      expect(result.isDue).toBe(true);
      expect(result.recommendedIntervalDays).toBe(1);
    });
  });

  describe('Mock Learning Service Integration', () => {
    it('creates and retrieves flashcards linked to subjects and topics', async () => {
      const mockService = new MockDataService();
      const card = await mockService.flashcards.createFlashcard({
        subjectId: 'sbj_1',
        topicId: 'top_1',
        frontPrompt: 'What is Linearizability?',
        backAnswer: 'A strong consistency model where operations appear instantaneous.',
        cardType: 'concept'
      });

      expect(card.id).toBeDefined();
      expect(card.frontPrompt).toBe('What is Linearizability?');

      const allCards = await mockService.flashcards.getFlashcards({ subjectId: 'sbj_1' });
      expect(allCards.some((c) => c.id === card.id)).toBe(true);
    });

    it('advances topic mastery level on successful active recall drills', async () => {
      const mockService = new MockDataService();
      const card = await mockService.flashcards.createFlashcard({
        subjectId: 'sbj_1',
        topicId: 'top_2', // unstudied topic in mock data
        frontPrompt: 'Explain PBFT protocol phases',
        backAnswer: 'Pre-prepare, Prepare, Commit',
        cardType: 'standard'
      });

      // Record successful drill
      await mockService.flashcards.recordCardAttempt(card.id, 'good');

      const topics = await mockService.study.getTopics('sbj_1');
      const topic = topics.find((t) => t.id === 'top_2');
      expect(topic?.masteryLevel).toBe('learning'); // Dynamically advanced from unstudied
    });

    it('creates and completes review queue items safely', async () => {
      const mockService = new MockDataService();
      const reviewItem = await mockService.reviews.createReviewItem({
        subjectId: 'sbj_1',
        topicId: 'top_1',
        priority: 'urgent',
        reason: 'Pre-exam retention rehearsal'
      });

      expect(reviewItem.id).toBeDefined();
      expect(reviewItem.completed).toBe(false);

      const completed = await mockService.reviews.completeReviewItem(reviewItem.id);
      expect(completed).toBe(true);
    });

    it('simulates a 7-day student active recall session across all 4 rating choices', async () => {
      const mockService = new MockDataService();
      const card = await mockService.flashcards.createFlashcard({
        subjectId: 'sbj_1',
        topicId: 'top_1',
        frontPrompt: 'What is Raft log compaction?',
        backAnswer: 'Snapshots are written to disk and log entries up to lastIncludedIndex are discarded.',
        cardType: 'concept'
      });

      // Attempt 1: 'again' -> resets interval to 1
      const res1 = await mockService.flashcards.recordCardAttempt(card.id, 'again');
      expect(res1.intervalDays).toBe(1);
      expect(res1.repetitionCount).toBe(0);

      // Attempt 2: 'good' -> interval becomes 1
      const res2 = await mockService.flashcards.recordCardAttempt(card.id, 'good');
      expect(res2.intervalDays).toBe(1);
      expect(res2.repetitionCount).toBe(1);

      // Attempt 3: 'good' -> interval becomes 3
      const res3 = await mockService.flashcards.recordCardAttempt(card.id, 'good');
      expect(res3.intervalDays).toBe(3);
      expect(res3.repetitionCount).toBe(2);

      // Attempt 4: 'easy' -> interval becomes 6+
      const res4 = await mockService.flashcards.recordCardAttempt(card.id, 'easy');
      expect(res4.intervalDays).toBeGreaterThanOrEqual(6);
    });
  });
});
