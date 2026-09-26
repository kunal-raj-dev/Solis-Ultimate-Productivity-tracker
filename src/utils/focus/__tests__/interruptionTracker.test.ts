import { describe, it, expect } from 'vitest';
import {
  createInterruptionEvent,
  calculateDistractionSummary
} from '../interruptionTracker';
import { InterruptionEvent } from '../../../types/focus';

describe('Feature 2.5: Distraction Counter & Interruption Tracking', () => {
  describe('createInterruptionEvent', () => {
    it('generates an event with unique id, correct type, and timestamp', () => {
      const fixedTime = new Date('2026-09-27T10:15:00Z');
      const event = createInterruptionEvent('internal', 'Urge to check emails', fixedTime);

      expect(event.id).toMatch(/^intr_\d+_[a-z0-9]+/);
      expect(event.type).toBe('internal');
      expect(event.note).toBe('Urge to check emails');
      expect(event.timestamp).toBe('2026-09-27T10:15:00.000Z');
    });

    it('handles external events without note', () => {
      const event = createInterruptionEvent('external');
      expect(event.type).toBe('external');
      expect(event.note).toBeUndefined();
      expect(event.timestamp).toBeDefined();
    });
  });

  describe('calculateDistractionSummary', () => {
    it('grades a zero-interruption session as pristine flow', () => {
      const summary = calculateDistractionSummary(0, 25);
      expect(summary.totalCount).toBe(0);
      expect(summary.internalCount).toBe(0);
      expect(summary.externalCount).toBe(0);
      expect(summary.focusScore).toBe(100);
      expect(summary.frictionTier).toBe('pristine');
      expect(summary.frictionLabel).toBe('Pristine Flow');
      expect(summary.cognitiveInsight).toContain('Deep absorption state achieved');
    });

    it('grades 1-2 interruptions as mild turbulence', () => {
      const events: InterruptionEvent[] = [
        createInterruptionEvent('internal', 'Felt restless'),
        createInterruptionEvent('external', 'Door knock')
      ];
      const summary = calculateDistractionSummary(events, 25);
      expect(summary.totalCount).toBe(2);
      expect(summary.internalCount).toBe(1);
      expect(summary.externalCount).toBe(1);
      expect(summary.focusScore).toBeGreaterThanOrEqual(70);
      expect(summary.frictionTier).toBe('mild');
      expect(summary.frictionLabel).toBe('Mild Turbulence');
    });

    it('grades 3-4 interruptions as noticeable friction', () => {
      const summary = calculateDistractionSummary({ internal: 3, external: 1 }, 25);
      expect(summary.totalCount).toBe(4);
      expect(summary.frictionTier).toBe('moderate');
      expect(summary.frictionLabel).toBe('Noticeable Friction');
    });

    it('grades 5+ interruptions as fragmented attention', () => {
      const summary = calculateDistractionSummary({ internal: 4, external: 2 }, 25);
      expect(summary.totalCount).toBe(6);
      expect(summary.frictionTier).toBe('high');
      expect(summary.frictionLabel).toBe('Fragmented Attention');
    });

    it('emits internal cognitive wander insight when internal urges dominate', () => {
      const events: InterruptionEvent[] = [
        createInterruptionEvent('internal', 'Tab switch impulse'),
        createInterruptionEvent('internal', 'Mind wandered to groceries')
      ];
      const summary = calculateDistractionSummary(events, 25);
      expect(summary.cognitiveInsight).toContain('internal mind drift');
      expect(summary.cognitiveInsight).toContain('Cognitive Drift Pad');
    });

    it('emits external environmental insight when external intrusions dominate', () => {
      const events: InterruptionEvent[] = [
        createInterruptionEvent('external', 'Phone call'),
        createInterruptionEvent('external', 'Colleague ping')
      ];
      const summary = calculateDistractionSummary(events, 25);
      expect(summary.cognitiveInsight).toContain('external surroundings');
      expect(summary.cognitiveInsight).toContain('muting alerts');
    });

    it('scales friction score appropriately for longer sessions', () => {
      // 3 interruptions in a 90m deep block are less disruptive per minute than in a 15m sprint
      const shortSession = calculateDistractionSummary(3, 15);
      const longSession = calculateDistractionSummary(3, 90);

      expect(longSession.focusScore).toBeGreaterThan(shortSession.focusScore);
    });
  });
});
