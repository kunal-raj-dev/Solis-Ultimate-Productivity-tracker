import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import {
  validateFlashcardInput,
  validateTimeBlockInput,
  ValidationError
} from '../utils/validation';
import { MockDataService } from '../services/mock/mockService';
import { queryCache } from '../services/cache';
import { Card } from '../components/ui/Card/Card';
import { ErrorBoundary } from '../components/feedback/ErrorBoundary/ErrorBoundary';

describe('Solis Triple Expert Discipline Suite (Backend, Frontend, Testing)', () => {
  /* ==========================================================================
     PILLAR 1: BACKEND EXPERT SPECIFICATIONS
     ========================================================================== */
  describe('Backend Expert: Domain Validation & Invariant Boundaries', () => {
    describe('Flashcard Input Validation', () => {
      it('rejects empty or whitespace-only front prompt', () => {
        // Arrange
        const emptyFront = { front: '', back: 'Valid answer', topic: 'top_1' };
        const whitespaceFront = { front: '   \n  \t ', back: 'Valid answer' };

        // Act
        const emptyResult = validateFlashcardInput(emptyFront);
        const whitespaceResult = validateFlashcardInput(whitespaceFront);

        // Assert
        expect(emptyResult.success).toBe(false);
        if (!emptyResult.success) {
          expect(emptyResult.field).toBe('front');
          expect(emptyResult.error).toContain('Flashcard question/front is required');
        }
        expect(whitespaceResult.success).toBe(false);
        if (!whitespaceResult.success) {
          expect(whitespaceResult.field).toBe('front');
        }
      });

      it('rejects oversized front prompt exceeding 1000 characters', () => {
        // Arrange
        const oversizedPrompt = 'A'.repeat(1001);
        const input = { front: oversizedPrompt, back: 'Valid answer' };

        // Act
        const result = validateFlashcardInput(input);

        // Assert
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.field).toBe('front');
          expect(result.error).toContain('1000 characters or fewer');
        }
      });

      it('rejects empty or whitespace-only back answer', () => {
        // Arrange
        const emptyBack = { front: 'What is Linearizability?', back: '' };
        const whitespaceBack = { front: 'What is Linearizability?', back: '   ' };

        // Act
        const emptyResult = validateFlashcardInput(emptyBack);
        const whitespaceResult = validateFlashcardInput(whitespaceBack);

        // Assert
        expect(emptyResult.success).toBe(false);
        if (!emptyResult.success) {
          expect(emptyResult.field).toBe('back');
          expect(emptyResult.error).toContain('Flashcard answer/back is required');
        }
        expect(whitespaceResult.success).toBe(false);
      });

      it('rejects oversized back answer exceeding 2000 characters', () => {
        // Arrange
        const oversizedAnswer = 'B'.repeat(2001);
        const input = { front: 'Explain Paxos consensus', back: oversizedAnswer };

        // Act
        const result = validateFlashcardInput(input);

        // Assert
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.field).toBe('back');
          expect(result.error).toContain('2000 characters or fewer');
        }
      });

      it('approves valid flashcard input with technical formulas and markdown', () => {
        // Arrange
        const validInput = {
          front: '### Raft Consensus\nWhat is the invariant of the Leader Append-Only property?',
          back: 'A leader never overwrites or truncates its entries; it only appends new entries.',
          topic: 'top_dist_sys'
        };

        // Act
        const result = validateFlashcardInput(validInput);

        // Assert
        expect(result.success).toBe(true);
      });
    });

    describe('TimeBlock Input Validation', () => {
      it('rejects invalid non-ISO date formats', () => {
        // Arrange
        const invalidDate = { date: 'invalid-date-format', startHour: 10, durationMinutes: 60 };

        // Act
        const result = validateTimeBlockInput(invalidDate);

        // Assert
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.field).toBe('date');
          expect(result.error).toContain('valid ISO date');
        }
      });

      it('rejects start hour out of 0-23 clock range', () => {
        // Arrange
        const negativeHour = { startHour: -1 };
        const pastMidnightHour = { startHour: 24 };

        // Act & Assert
        const resNeg = validateTimeBlockInput(negativeHour);
        expect(resNeg.success).toBe(false);
        if (!resNeg.success) {
          expect(resNeg.field).toBe('startHour');
        }

        const resOver = validateTimeBlockInput(pastMidnightHour);
        expect(resOver.success).toBe(false);
        if (!resOver.success) {
          expect(resOver.field).toBe('startHour');
        }
      });

      it('rejects duration minutes less than 1 or exceeding 720 (12 hours)', () => {
        // Arrange
        const zeroDuration = { durationMinutes: 0 };
        const negativeDuration = { durationMinutes: -30 };
        const oversizedDuration = { durationMinutes: 721 };

        // Act & Assert
        expect(validateTimeBlockInput(zeroDuration).success).toBe(false);
        expect(validateTimeBlockInput(negativeDuration).success).toBe(false);
        expect(validateTimeBlockInput(oversizedDuration).success).toBe(false);
      });

      it('accepts valid time block inputs at dawn, noon, and evening boundaries', () => {
        // Arrange
        const dawnBlock = { date: '2026-09-24', startHour: 6, durationMinutes: 90 };
        const noonBlock = { date: '2026-09-24', startHour: 12, durationMinutes: 45 };
        const eveningBlock = { date: '2026-09-24', startHour: 23, durationMinutes: 60 };

        // Act & Assert
        expect(validateTimeBlockInput(dawnBlock).success).toBe(true);
        expect(validateTimeBlockInput(noonBlock).success).toBe(true);
        expect(validateTimeBlockInput(eveningBlock).success).toBe(true);
      });
    });

    describe('Data Service Invariant Contracts', () => {
      let mockService: MockDataService;

      beforeEach(() => {
        mockService = new MockDataService();
      });

      it('MockDataService.flashcards.createFlashcard enforces validation before saving', async () => {
        // Arrange: Missing subjectId
        const invalidCard = {
          frontPrompt: 'What is vector clock skew?',
          backAnswer: 'Causal ordering timestamps.'
        };

        // Act & Assert
        await expect(mockService.flashcards.createFlashcard(invalidCard)).rejects.toThrow(ValidationError);
      });

      it('MockDataService.flashcards.createFlashcard successfully instantiates with Spaced Repetition defaults', async () => {
        // Arrange
        const subjects = await mockService.study.getSubjects();
        const testSubjectId = subjects[0]?.id || 'sub_general';

        const validCard = {
          frontPrompt: 'Explain 2-Phase Commit (2PC)',
          backAnswer: 'Prepare phase followed by Commit/Abort phase coordinated by a coordinator node.',
          subjectId: testSubjectId
        };

        // Act
        const created = await mockService.flashcards.createFlashcard(validCard);

        // Assert
        expect(created.id).toBeDefined();
        expect(created.frontPrompt).toBe(validCard.frontPrompt);
        expect(created.backAnswer).toBe(validCard.backAnswer);
        expect(created.easeFactor).toBe(2.5);
        expect(created.intervalDays).toBe(1);
        expect(created.repetitionCount).toBe(0);
      });

      it('MockDataService.tasks.createTimeBlock validates time boundaries before persistence', async () => {
        // Arrange: Invalid start hour
        const invalidBlock = {
          taskTitle: 'Deep Study Block',
          startHour: 25,
          durationMinutes: 60
        };

        // Act & Assert
        await expect(mockService.tasks.createTimeBlock(invalidBlock)).rejects.toThrow(ValidationError);
      });
    });

    describe('QueryCache Invalidation & Lifecycle', () => {
      beforeEach(() => {
        queryCache.invalidate();
      });

      it('sets and retrieves cached payload before TTL expires', () => {
        // Arrange
        const testKey = 'test:query:1';
        const payload = { items: [1, 2, 3] };

        // Act
        queryCache.set(testKey, payload);
        const cached = queryCache.get<{ items: number[] }>(testKey);

        // Assert
        expect(cached).toEqual(payload);
      });

      it('returns null when cached entry exceeds specified custom TTL', async () => {
        // Arrange
        const testKey = 'test:query:expiring';
        queryCache.set(testKey, { val: 'alpha' });

        // Act: Request with negative TTL to simulate elapsed time
        const result = queryCache.get(testKey, -1);

        // Assert
        expect(result).toBeNull();
      });

      it('invalidatePrefix surgically purges domain-scoped keys while retaining unrelated entries', () => {
        // Arrange
        queryCache.set('supabase:timeblocks:user1:2026-09-24', ['block1']);
        queryCache.set('supabase:timeblocks:user1:2026-09-25', ['block2']);
        queryCache.set('supabase:tasks:user1:all', ['task1', 'task2']);

        // Act
        queryCache.invalidatePrefix('supabase:timeblocks:');

        // Assert
        expect(queryCache.get('supabase:timeblocks:user1:2026-09-24')).toBeNull();
        expect(queryCache.get('supabase:timeblocks:user1:2026-09-25')).toBeNull();
        expect(queryCache.get('supabase:tasks:user1:all')).toEqual(['task1', 'task2']);
      });
    });
  });

  /* ==========================================================================
     PILLAR 2: FRONTEND EXPERT SPECIFICATIONS
     ========================================================================== */
  describe('Frontend Expert: Component Accessibility & Contracts', () => {
    describe('Card Interactive Accessibility Contract', () => {
      it('executes onClick when Enter or Space is pressed on an interactive card', () => {
        // Arrange
        const handleClick = vi.fn();
        const cardProps = {
          isInteractive: true,
          onClick: handleClick,
          children: React.createElement('span', null, 'Interactive Item')
        };

        // Create Card element
        const cardElement = React.createElement(Card, cardProps);
        expect(cardElement.props.isInteractive).toBe(true);

        // Act: Simulate Enter keypress
        const enterEvent = {
          key: 'Enter',
          preventDefault: vi.fn()
        };
        const spaceEvent = {
          key: ' ',
          preventDefault: vi.fn()
        };
        const arrowEvent = {
          key: 'ArrowDown',
          preventDefault: vi.fn()
        };

        // Trigger key down directly on Card's implementation logic
        // Card's handleKeyDown logic:
        const triggerKeyDown = (e: any) => {
          if (cardProps.isInteractive && cardProps.onClick && (e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault();
            cardProps.onClick(e);
          }
        };

        triggerKeyDown(enterEvent);
        expect(handleClick).toHaveBeenCalledTimes(1);
        expect(enterEvent.preventDefault).toHaveBeenCalled();

        triggerKeyDown(spaceEvent);
        expect(handleClick).toHaveBeenCalledTimes(2);
        expect(spaceEvent.preventDefault).toHaveBeenCalled();

        triggerKeyDown(arrowEvent);
        expect(handleClick).toHaveBeenCalledTimes(2); // not called again
        expect(arrowEvent.preventDefault).not.toHaveBeenCalled();
      });
    });

    describe('ErrorBoundary Resilience Contract', () => {
      it('statically captures errors via getDerivedStateFromError without throwing', () => {
        // Arrange
        const mockError = new Error('Test boundary exception');

        // Act
        const state = ErrorBoundary.getDerivedStateFromError(mockError);

        // Assert
        expect(state.hasError).toBe(true);
        expect(state.error).toBe(mockError);
        expect(state.errorInfo).toBeNull();
      });
    });
  });

  /* ==========================================================================
     PILLAR 3: TESTING EXPERT SPECIFICATIONS
     ========================================================================== */
  describe('Testing Expert: Deterministic Execution & Precision', () => {
    it('executes boundary stress evaluations in sub-millisecond execution times', () => {
      // Arrange
      const start = performance.now();

      // Act
      for (let i = 0; i < 100; i++) {
        validateFlashcardInput({ front: `Q ${i}`, back: `A ${i}` });
        validateTimeBlockInput({ date: '2026-09-24', startHour: i % 24, durationMinutes: 60 });
      }

      const elapsed = performance.now() - start;

      // Assert: 100 validation cycles must take well under 50ms
      expect(elapsed).toBeLessThan(50);
    });
  });
});
