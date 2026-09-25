import { describe, it, expect } from 'vitest';
import {
  findNextAvailableSlot,
  getOccupiedHours,
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

    /* =========================================================================
       Milestone 1: Multi-Hour Collision Detection & Occupied Hour Calculations
       ========================================================================= */

    describe('getOccupiedHours: Multi-Hour Span & Filtering', () => {
      it('calculates single hour for 60-minute or default duration block', () => {
        const blocks = [mockBlock({ id: 'b1', startHour: 9, durationMinutes: 60 })];
        const occupied = getOccupiedHours(blocks, todayStr);
        expect(occupied.size).toBe(1);
        expect(occupied.has(9)).toBe(true);
        expect(occupied.has(10)).toBe(false);
      });

      it('marks 1h, 2h, and 3h blocks as occupying all spanned hours', () => {
        const blocks: TaskTimeBlock[] = [
          mockBlock({ id: 'b-1h', startHour: 9, durationMinutes: 60 }),    // spans: 9
          mockBlock({ id: 'b-2h', startHour: 11, durationMinutes: 120 }),  // spans: 11, 12
          mockBlock({ id: 'b-3h', startHour: 14, durationMinutes: 180 }),  // spans: 14, 15, 16
        ];

        const occupied = getOccupiedHours(blocks);

        // 1h block at 9 occupies 9
        expect(occupied.has(9)).toBe(true);
        expect(occupied.has(10)).toBe(false);

        // 2h block at 11 occupies 11 and 12
        expect(occupied.has(11)).toBe(true);
        expect(occupied.has(12)).toBe(true);
        expect(occupied.has(13)).toBe(false);

        // 3h block at 14 occupies 14, 15, and 16
        expect(occupied.has(14)).toBe(true);
        expect(occupied.has(15)).toBe(true);
        expect(occupied.has(16)).toBe(true);
        expect(occupied.has(17)).toBe(false);

        expect(Array.from(occupied).sort((a, b) => a - b)).toEqual([9, 11, 12, 14, 15, 16]);
      });

      it('rounds up fractional durations using Math.ceil (90m occupies 2h, 150m occupies 3h)', () => {
        const blocks: TaskTimeBlock[] = [
          mockBlock({ id: 'b-90m', startHour: 8, durationMinutes: 90 }),    // spans: 8, 9
          mockBlock({ id: 'b-150m', startHour: 18, durationMinutes: 150 }), // spans: 18, 19, 20
        ];

        const occupied = getOccupiedHours(blocks);
        expect(occupied.has(8)).toBe(true);
        expect(occupied.has(9)).toBe(true);
        expect(occupied.has(10)).toBe(false);

        expect(occupied.has(18)).toBe(true);
        expect(occupied.has(19)).toBe(true);
        expect(occupied.has(20)).toBe(true);
        expect(occupied.has(21)).toBe(false);
      });

      it('handles missing or zero durationMinutes by defaulting to 60 minutes (span 1)', () => {
        const blocks: TaskTimeBlock[] = [
          mockBlock({ id: 'b-undef', startHour: 10, durationMinutes: undefined }),
          mockBlock({ id: 'b-zero', startHour: 12, durationMinutes: 0 }),
        ];

        const occupied = getOccupiedHours(blocks);
        expect(occupied.has(10)).toBe(true);
        expect(occupied.has(11)).toBe(false);
        expect(occupied.has(12)).toBe(true);
        expect(occupied.has(13)).toBe(false);
      });

      it('clamps hours within 0..23 boundary', () => {
        const blocks: TaskTimeBlock[] = [
          mockBlock({ id: 'b-late', startHour: 23, durationMinutes: 120 }), // spans 23, clamped from 24
        ];

        const occupied = getOccupiedHours(blocks);
        expect(occupied.has(23)).toBe(true);
        expect(occupied.has(24)).toBe(false);
        expect(occupied.size).toBe(1);
      });

      it('filters blocks by targetDate when provided, and includes all blocks when omitted', () => {
        const targetDate = '2026-10-15';
        const otherDate = '2026-10-16';
        const blocks: TaskTimeBlock[] = [
          mockBlock({ id: 'b-today', date: targetDate, startHour: 9, durationMinutes: 120 }), // spans 9, 10 on targetDate
          mockBlock({ id: 'b-other', date: otherDate, startHour: 14, durationMinutes: 60 }),   // spans 14 on otherDate
        ];

        const filtered = getOccupiedHours(blocks, targetDate);
        expect(filtered.has(9)).toBe(true);
        expect(filtered.has(10)).toBe(true);
        expect(filtered.has(14)).toBe(false);
        expect(filtered.size).toBe(2);

        const unfiltered = getOccupiedHours(blocks);
        expect(unfiltered.has(9)).toBe(true);
        expect(unfiltered.has(10)).toBe(true);
        expect(unfiltered.has(14)).toBe(true);
        expect(unfiltered.size).toBe(3);
      });

      it('excludes block matching excludeBlockId to avoid self-collision during replan', () => {
        const target = mockBlock({ id: 'rescheduling-block', date: todayStr, startHour: 10, durationMinutes: 120 });
        const other = mockBlock({ id: 'fixed-block', date: todayStr, startHour: 14, durationMinutes: 60 });
        const blocks = [target, other];

        const occupied = getOccupiedHours(blocks, todayStr, 'rescheduling-block');
        expect(occupied.has(10)).toBe(false);
        expect(occupied.has(11)).toBe(false);
        expect(occupied.has(14)).toBe(true);
        expect(occupied.size).toBe(1);
      });
    });

    describe('findNextAvailableSlot: Multi-Hour Candidate Allocation', () => {
      it('skips full span of multi-hour existing blocks when finding slots for single-hour block', () => {
        // b1 is 120m starting at 14:00 (occupies 14 and 15)
        const existing: TaskTimeBlock[] = [
          mockBlock({ id: 'b1', startHour: 14, durationMinutes: 120 })
        ];

        // Searching after 13:00 for a 1-hour block:
        // 14 is occupied, 15 is occupied by b1 -> must skip both and pick 16:00
        const slot = findNextAvailableSlot(todayStr, existing, 13);
        expect(slot).not.toBeNull();
        expect(slot?.hour).toBe(16);
        expect(slot?.minute).toBe(0);
      });

      it('finds contiguous free hours for 120-minute block when hour 9 is free but hour 10 is occupied', () => {
        // Hour 9 is free, hour 10 is occupied by a 60m block
        const existing: TaskTimeBlock[] = [
          mockBlock({ id: 'b10', startHour: 10, durationMinutes: 60 })
        ];

        // A 60-minute candidate block after 8:00 can take 9:00
        const slot1h = findNextAvailableSlot(todayStr, existing, 8, 60);
        expect(slot1h).toEqual({ hour: 9, minute: 0 });

        // A 120-minute candidate block after 8:00 requires 2 contiguous hours (9 & 10).
        // Hour 10 is occupied, so it cannot take 9:00.
        // Hours 11 and 12 are both free, so it must return 11:00.
        const slot2h = findNextAvailableSlot(todayStr, existing, 8, 120);
        expect(slot2h).toEqual({ hour: 11, minute: 0 });
      });

      it('finds contiguous free hours for 180-minute block across scattered existing blocks', () => {
        // Blocks at 9 (60m) and 13 (60m)
        const existing: TaskTimeBlock[] = [
          mockBlock({ id: 'b9', startHour: 9, durationMinutes: 60 }),
          mockBlock({ id: 'b13', startHour: 13, durationMinutes: 60 })
        ];

        // A 180-minute block after 8:00 needs 3 contiguous hours.
        // 9 is occupied.
        // 10 is checked: 10, 11, 12 are free! (13 is occupied, but candidate finishes at 13:00).
        const slot3h = findNextAvailableSlot(todayStr, existing, 8, 180);
        expect(slot3h).toEqual({ hour: 10, minute: 0 });
      });

      it('respects 22:00 operating bounds for multi-hour candidate blocks', () => {
        const existing: TaskTimeBlock[] = [];
        // After hour 20:
        // A 2-hour block (120m) can start at 21:00 because 21 and 22 are <= 22:00.
        const slot2h = findNextAvailableSlot(todayStr, existing, 20, 120);
        expect(slot2h).toEqual({ hour: 21, minute: 0 });

        // After hour 21:
        // Only hour 22 is remaining within bounds. A 2-hour block would end at 24:00 (past 22:00) -> returns null.
        const slot2hLate = findNextAvailableSlot(todayStr, existing, 21, 120);
        expect(slot2hLate).toBeNull();

        // A 3-hour block (180m) after hour 20 would need 21, 22, 23 (23 > 22) -> returns null.
        const slot3h = findNextAvailableSlot(todayStr, existing, 20, 180);
        expect(slot3h).toBeNull();
      });

      it('supports excludeBlockId parameter to prevent self-collision in findNextAvailableSlot', () => {
        const existing: TaskTimeBlock[] = [
          mockBlock({ id: 'self-block', startHour: 9, durationMinutes: 120 })
        ];

        // Searching after 8 without excludeBlockId would see 9 and 10 occupied -> returns 11
        const slotWithoutExclude = findNextAvailableSlot(todayStr, existing, 8, 120);
        expect(slotWithoutExclude?.hour).toBe(11);

        // Searching with excludeBlockId 'self-block' treats 9 and 10 as free -> returns 9
        const slotWithExclude = findNextAvailableSlot(todayStr, existing, 8, 120, 'self-block');
        expect(slotWithExclude?.hour).toBe(9);
      });
    });

    describe('getReplanSuggestions: Multi-Hour Non-Overlapping Suggestions & Self-Exclusion', () => {
      it('generates non-overlapping suggestions for multi-hour blocks, skipping non-contiguous slots', () => {
        // Target block is 120 minutes at 10:00
        const target = mockBlock({
          id: 'target-2h',
          startHour: 10,
          durationMinutes: 120,
          status: 'partial'
        });

        // Block at 13:00 occupies 13:00-14:00
        const existing: TaskTimeBlock[] = [
          target,
          mockBlock({ id: 'b13', startHour: 13, durationMinutes: 60 })
        ];

        // Evaluated at 11:00 AM:
        // Hour 12 is free, but hour 13 is occupied -> 120m block cannot start at 12:00!
        // Hours 14 and 15 are free -> Next Free Slot should be 14:00 (2:00 PM).
        const suggestions = getReplanSuggestions(target, existing, 11);

        const nextFree = suggestions.find((s) => s.reason.includes('unoccupied'));
        expect(nextFree).toBeDefined();
        expect(nextFree?.startHour).toBe(14);

        // Verify no suggestion recommends hour 12 (incomplete span) or 13 (occupied)
        const todaySuggestions = suggestions.filter((s) => s.date === todayStr);
        for (const s of todaySuggestions) {
          expect(s.startHour).not.toBe(12);
          expect(s.startHour).not.toBe(13);
        }
      });

      it('prevents getReplanSuggestions from recommending overlapping slots when existing blocks are multi-hour', () => {
        // Target is 60m block at 09:00
        const target = mockBlock({
          id: 'target-1h',
          startHour: 9,
          durationMinutes: 60,
          status: 'partial'
        });

        // Existing block at 10:00 is 120m (occupies 10:00 and 11:00)
        const existing: TaskTimeBlock[] = [
          target,
          mockBlock({ id: 'multi-block', startHour: 10, durationMinutes: 120 })
        ];

        // Evaluated at 9:00 AM:
        // Slots checked after 9:
        // 10 is occupied by multi-block, 11 is also occupied by multi-block!
        // Fixed engine: skips 10 and 11, recommending 12:00 PM!
        const suggestions = getReplanSuggestions(target, existing, 9);
        const nextFree = suggestions.find((s) => s.reason.includes('unoccupied'));
        expect(nextFree).toBeDefined();
        expect(nextFree?.startHour).toBe(12);
      });

      it('does not recommend "Later Today" if the +2h slot or its spanned hours are occupied', () => {
        const target = mockBlock({
          id: 'target-1h',
          startHour: 10,
          durationMinutes: 60,
          status: 'partial'
        });

        // Evaluated at 10:00 AM. Later Today candidate is 10 + 2 = 12:00.
        // Block at 12:00 occupies 12:00.
        const existing: TaskTimeBlock[] = [
          target,
          mockBlock({ id: 'block-at-12', startHour: 12, durationMinutes: 60 })
        ];

        const suggestions = getReplanSuggestions(target, existing, 10);
        const laterToday = suggestions.find((s) => s.label.includes('Later Today'));
        // Hour 12 is occupied, so Later Today at 12:00 must NOT be suggested
        expect(laterToday).toBeUndefined();
      });

      it('excludes the target block from occupancy calculation to prevent self-collision', () => {
        // Target block is 120 minutes at 10:00 (planned or partial)
        const target = mockBlock({
          id: 'target-self',
          startHour: 10,
          durationMinutes: 120,
          status: 'partial'
        });

        // No other blocks today except target
        const existing = [target];

        // Evaluated at 8:00 AM:
        // If target was not excluded, hour 10 would be considered occupied, so candidate at 9:00
        // (which requires 9 and 10) would be rejected.
        // With target excluded, hours 9 and 10 are free, so Next Free Slot is 9:00 AM!
        const suggestions = getReplanSuggestions(target, existing, 8);
        const nextFree = suggestions.find((s) => s.reason.includes('unoccupied'));
        expect(nextFree).toBeDefined();
        expect(nextFree?.startHour).toBe(9);
      });

      it('omits today suggestions when no contiguous slots fit within operating window (late night)', () => {
        const target = mockBlock({
          id: 'target-late',
          startHour: 20,
          durationMinutes: 120,
          status: 'partial'
        });

        // Evaluated at 21:00 (9 PM).
        // Candidate slots today after 21: only 22 is left.
        // A 120m block needs 22 and 23 (23 > 22 bound) -> no slot today fits.
        // Later Today would be 21 + 2 = 23 (exceeds 22 bound).
        const suggestions = getReplanSuggestions(target, [target], 21);

        // No suggestions for today
        const todaySuggestions = suggestions.filter((s) => s.date === todayStr);
        expect(todaySuggestions.length).toBe(0);

        // Still returns tomorrow suggestions
        const tomorrowSuggestions = suggestions.filter((s) => s.date === getTomorrowDateString(todayStr));
        expect(tomorrowSuggestions.length).toBeGreaterThanOrEqual(1);
      });
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
