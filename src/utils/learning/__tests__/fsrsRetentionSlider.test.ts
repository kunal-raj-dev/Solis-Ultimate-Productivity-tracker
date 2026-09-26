import { describe, it, expect, beforeEach } from 'vitest';
import {
  DEFAULT_REQUEST_RETENTION,
  computeIntervalForRetention,
  computeIntervalPerStability,
  calculateNextCardReview
} from '../spacedRepetition';
import { MockDataService } from '../../../services/mock/mockService';
import { Flashcard } from '../../../types/learning';

describe('Feature 1.5: FSRS-5 Promotion & Retention Slider Engine', () => {
  it('defaults request retention to 0.90 (90% target)', () => {
    expect(DEFAULT_REQUEST_RETENTION).toBe(0.9);
  });

  describe('Forgetting curve interval sensitivity to retention target', () => {
    it('generates longer intervals for lower target retention (relaxed 85%)', () => {
      const stability = 10; // 10 days stability
      const interval85 = computeIntervalForRetention(stability, 0.85);
      const interval90 = computeIntervalForRetention(stability, 0.90);
      const interval95 = computeIntervalForRetention(stability, 0.95);

      // Lower retention requirement allows more time to elapse before review
      expect(interval85).toBeGreaterThan(interval90);
      expect(interval90).toBeGreaterThan(interval95);
    });

    it('matches exact power-law forgetting curve formula R(t, S) = (1 + 0.19 * t / S)^-0.5', () => {
      const factor90 = computeIntervalPerStability(0.90);
      // (0.9^-2 - 1) / 0.19 = (1.2345679 - 1) / 0.19 = 0.2345679 / 0.19 ≈ 1.234568
      expect(factor90).toBeCloseTo(1.2345, 3);
    });
  });

  describe('calculateNextCardReview with variable retention targets', () => {
    const baseCard: Pick<Flashcard, 'intervalDays' | 'easeFactor' | 'repetitionCount' | 'lastReviewedAt'> = {
      intervalDays: 10,
      easeFactor: 2.5,
      repetitionCount: 2,
      lastReviewedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString()
    };

    it('computes tighter intervals when retention target is increased to 95% (exam mastery)', () => {
      const baseDate = new Date();
      const sched90 = calculateNextCardReview(baseCard, 'good', baseDate, 0.90);
      const sched95 = calculateNextCardReview(baseCard, 'good', baseDate, 0.95);

      expect(sched95.intervalDays).toBeLessThan(sched90.intervalDays);
    });

    it('computes extended intervals when retention target is lowered to 85% (relaxed)', () => {
      const baseDate = new Date();
      const sched90 = calculateNextCardReview(baseCard, 'good', baseDate, 0.90);
      const sched85 = calculateNextCardReview(baseCard, 'good', baseDate, 0.85);

      expect(sched85.intervalDays).toBeGreaterThan(sched90.intervalDays);
    });

    it('handles brand new cards across different retention targets', () => {
      const newCard: Pick<Flashcard, 'intervalDays' | 'easeFactor' | 'repetitionCount' | 'lastReviewedAt'> = {
        intervalDays: 1,
        easeFactor: 2.5,
        repetitionCount: 0
      };

      const schedEasy90 = calculateNextCardReview(newCard, 'easy', new Date(), 0.90);
      const schedEasy85 = calculateNextCardReview(newCard, 'easy', new Date(), 0.85);

      expect(schedEasy85.intervalDays).toBeGreaterThanOrEqual(schedEasy90.intervalDays);
      expect(schedEasy90.repetitionCount).toBe(1);
    });
  });

  describe('mockService recordCardAttempt integration with retention preferences', () => {
    let mockService: MockDataService;

    beforeEach(async () => {
      mockService = new MockDataService();
    });

    it('applies explicit requestRetention override in recordCardAttempt', async () => {
      const cards = await mockService.flashcards.getFlashcards();
      expect(cards.length).toBeGreaterThan(0);
      const card = cards[0];

      // Record with 85% vs 95%
      const updated85 = await mockService.flashcards.recordCardAttempt(card.id, 'easy', 0.85);
      expect(updated85.intervalDays).toBeGreaterThan(1);

      const updated95 = await mockService.flashcards.recordCardAttempt(card.id, 'easy', 0.95);
      expect(updated95.intervalDays).toBeGreaterThan(0);
    });
  });
});
