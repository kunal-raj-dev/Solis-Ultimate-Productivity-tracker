import { describe, it, expect } from 'vitest';
import { calculateNextOccurrenceDate } from '../utils/tasks/recurrenceEngine';
import { ToastMessage } from '../context/ToastContext';

describe('Milestone 3 — High-Velocity Task System & Recurring Engine', () => {
  describe('Enhanced Weekly Recurrence with daysOfWeek', () => {
    it('schedules next occurrence within the same week for multi-day schedule (Mon -> Wed)', () => {
      // 2026-10-19 is a Monday (day 1)
      const monday = '2026-10-19';
      const recurrence = {
        frequency: 'weekly' as const,
        daysOfWeek: [1, 3, 5] // Mon, Wed, Fri
      };

      const next = calculateNextOccurrenceDate(monday, recurrence);
      // Expected next is Wednesday (2026-10-21)
      expect(next).toBe('2026-10-21');
    });

    it('schedules next occurrence within the same week (Wed -> Fri)', () => {
      // 2026-10-21 is a Wednesday (day 3)
      const wednesday = '2026-10-21';
      const recurrence = {
        frequency: 'weekly' as const,
        daysOfWeek: [1, 3, 5]
      };

      const next = calculateNextOccurrenceDate(wednesday, recurrence);
      // Expected next is Friday (2026-10-23)
      expect(next).toBe('2026-10-23');
    });

    it('wraps to the first day of next interval week (Fri -> next Mon)', () => {
      // 2026-10-23 is a Friday (day 5)
      const friday = '2026-10-23';
      const recurrence = {
        frequency: 'weekly' as const,
        daysOfWeek: [1, 3, 5],
        interval: 1
      };

      const next = calculateNextOccurrenceDate(friday, recurrence);
      // Expected next is Monday next week (2026-10-26)
      expect(next).toBe('2026-10-26');
    });

    it('handles bi-weekly recurrence with daysOfWeek (interval = 2)', () => {
      const friday = '2026-10-23';
      const recurrence = {
        frequency: 'weekly' as const,
        daysOfWeek: [1, 5],
        interval: 2
      };

      const next = calculateNextOccurrenceDate(friday, recurrence);
      // Friday (Oct 23) -> jump over next week -> Monday Nov 02
      expect(next).toBe('2026-11-02');
    });

    it('falls back to 7 * interval days when daysOfWeek is empty', () => {
      const thursday = '2026-10-15';
      const recurrence = {
        frequency: 'weekly' as const,
        interval: 1
      };

      const next = calculateNextOccurrenceDate(thursday, recurrence);
      expect(next).toBe('2026-10-22');
    });
  });

  describe('Toast Notification with Undo Action', () => {
    it('supports interactive action callback on ToastMessage', () => {
      let actionInvoked = false;
      const toast: ToastMessage = {
        id: 'toast-1',
        title: 'Task Completed',
        description: 'Read Chapter 4',
        type: 'success',
        durationMs: 5000,
        action: {
          label: 'Undo (⌘Z)',
          onClick: () => {
            actionInvoked = true;
          }
        }
      };

      expect(toast.durationMs).toBe(5000);
      expect(toast.action?.label).toBe('Undo (⌘Z)');
      toast.action?.onClick();
      expect(actionInvoked).toBe(true);
    });
  });
});
