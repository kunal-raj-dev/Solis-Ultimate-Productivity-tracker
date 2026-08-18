import { describe, it, expect } from 'vitest';
import { isTargetEditable } from '../hooks/useKeyboardShortcuts';

describe('Solis Accessibility & Keyboard Navigation Suite (Phase 8)', () => {
  describe('Focus & Input Guardrails', () => {
    it('detects standard input elements as editable to prevent keyboard collision', () => {
      const inputEl = { tagName: 'INPUT' };
      expect(isTargetEditable(inputEl)).toBe(true);

      const textareaEl = { tagName: 'TEXTAREA' };
      expect(isTargetEditable(textareaEl)).toBe(true);

      const selectEl = { tagName: 'SELECT' };
      expect(isTargetEditable(selectEl)).toBe(true);
    });

    it('detects contentEditable elements as editable', () => {
      const divEl = { tagName: 'DIV', isContentEditable: true };
      expect(isTargetEditable(divEl)).toBe(true);

      const spanEl = { tagName: 'SPAN', contentEditable: 'true' };
      expect(isTargetEditable(spanEl)).toBe(true);
    });

    it('allows global single-key shortcuts when focus is on non-editable canvas/body', () => {
      const buttonEl = { tagName: 'BUTTON' };
      expect(isTargetEditable(buttonEl)).toBe(false);

      const divEl = { tagName: 'DIV' };
      expect(isTargetEditable(divEl)).toBe(false);

      expect(isTargetEditable(null)).toBe(false);
      expect(isTargetEditable(undefined)).toBe(false);
    });
  });

  describe('ARIA Clamping & Value Calculations', () => {
    it('calculates clamped percentage values for progress indicators safely', () => {
      const calculatePercentage = (value: number, max = 100) => {
        return Math.min(100, Math.max(0, (value / max) * 100));
      };

      expect(calculatePercentage(50, 100)).toBe(50);
      expect(calculatePercentage(150, 100)).toBe(100);
      expect(calculatePercentage(-20, 100)).toBe(0);
      expect(calculatePercentage(3, 5)).toBe(60);
    });
  });
});
