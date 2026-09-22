import { describe, it, expect } from 'vitest';
import {
  findNextAvailableSlot,
  getReplanSuggestions,
  getTomorrowDateString
} from '../utils/tasks/replanEngine';
import { TaskTimeBlock } from '../types/task';
import { getISODateString } from '../utils/date';

describe('Milestone 4: 24-Hour Time Blocking & Auto-Replan Instrument', () => {
  const todayStr = getISODateString(new Date());

  const mockBlock = (overrides: Partial<TaskTimeBlock> = {}): TaskTimeBlock => ({
    id: 'block-1',
    taskId: 'task-1',
    taskTitle: 'Algorithm Complexity Analysis',
    date: todayStr,
    startHour: 10,
    startMinute: 0,
    durationMinutes: 60,
    priority: 'high',
    status: 'planned',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides
  });

  describe('Auto-Replan Engine: Slot Resolution', () => {
    it('finds the first unoccupied hour slot after current reference hour', () => {
      const existing: TaskTimeBlock[] = [
        mockBlock({ id: 'b1', startHour: 14 }),
        mockBlock({ id: 'b2', startHour: 15 })
      ];

      // Current hour is 13: next free should skip 14 and 15 and find 16
      const nextFree = findNextAvailableSlot(todayStr, existing, 13);
      expect(nextFree).not.toBeNull();
      expect(nextFree?.hour).toBe(16);
      expect(nextFree?.minute).toBe(0);
    });

    it('returns null if all remaining working hours today are occupied', () => {
      const existing: TaskTimeBlock[] = [];
      for (let h = 18; h <= 22; h++) {
        existing.push(mockBlock({ id: `b-${h}`, startHour: h }));
      }

      const nextFree = findNextAvailableSlot(todayStr, existing, 17);
      expect(nextFree).toBeNull();
    });

    it('correctly calculates tomorrow date without time zone drift', () => {
      const tomorrow = getTomorrowDateString('2026-09-22');
      expect(tomorrow).toBe('2026-09-23');
    });

    it('generates rich 1-click replan suggestion chips for a missed/partial block', () => {
      const target = mockBlock({
        id: 'target-1',
        startHour: 10,
        status: 'partial'
      });

      const existing: TaskTimeBlock[] = [
        target,
        mockBlock({ id: 'b-11', startHour: 11 })
      ];

      // Evaluated at 10 AM
      const suggestions = getReplanSuggestions(target, existing, 10);
      expect(suggestions.length).toBeGreaterThanOrEqual(3);

      // 1. Next free slot (11 is taken, so 12)
      const nextFree = suggestions.find((s) => s.reason.includes('unoccupied'));
      expect(nextFree).toBeDefined();
      expect(nextFree?.startHour).toBe(12);

      // 2. Tomorrow at same hour (10 AM)
      const tomorrowSame = suggestions.find((s) => s.reason.includes('identical'));
      expect(tomorrowSame).toBeDefined();
      expect(tomorrowSame?.startHour).toBe(10);
      expect(tomorrowSame?.date).toBe(getTomorrowDateString(todayStr));

      // 3. Tomorrow morning fresh start (9 AM)
      const tomorrowMorn = suggestions.find((s) => s.reason.includes('Fresh start'));
      expect(tomorrowMorn).toBeDefined();
      expect(tomorrowMorn?.startHour).toBe(9);
    });
  });

  describe('24-Hour Non-Work Hour Compaction Logic', () => {
    it('identifies empty non-work hours for visual compaction in 24h view', () => {
      const currentHour = 14;
      const hoursWithBlocks = new Set([9, 14, 21]);

      const shouldCompact = (h: number, viewMode: 'workday' | '24h') => {
        const hasBlocks = hoursWithBlocks.has(h);
        const isNow = h === currentHour;
        return viewMode === '24h' && (h < 8 || h > 20) && !hasBlocks && !isNow;
      };

      // 3 AM (empty, non-work, 24h) -> compact
      expect(shouldCompact(3, '24h')).toBe(true);

      // 9 AM (workday hour) -> NOT compact
      expect(shouldCompact(9, '24h')).toBe(false);

      // 21 (9 PM, non-work but HAS blocks) -> NOT compact
      expect(shouldCompact(21, '24h')).toBe(false);

      // In workday mode -> compaction rule is not applied
      expect(shouldCompact(3, 'workday')).toBe(false);
    });
  });
});
