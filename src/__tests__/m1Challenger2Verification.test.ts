import { describe, it, expect } from 'vitest';
import {
  findNextAvailableSlot,
  getOccupiedHours,
  getReplanSuggestions,
  getTomorrowDateString
} from '../utils/tasks/replanEngine';
import { TaskTimeBlock } from '../types/task';
import { getISODateString } from '../utils/date';

describe('Challenger 2 Empirical Verification: Multi-Hour Collision Detection & Replan Engine', () => {
  const todayStr = getISODateString(new Date());

  const mockBlock = (overrides: Partial<TaskTimeBlock> = {}): TaskTimeBlock => ({
    id: `block-${Math.random().toString(36).substring(2, 9)}`,
    taskId: 'task-test',
    taskTitle: 'Test Task',
    date: todayStr,
    startHour: 10,
    startMinute: 0,
    durationMinutes: 60,
    priority: 'medium',
    status: 'planned',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides
  });

  // Independent brute-force oracle for slot allocation
  function oracleFindSlot(
    date: string,
    existingBlocks: TaskTimeBlock[],
    afterHour: number = 7,
    durationMinutes: number = 60,
    excludeBlockId?: string
  ): { hour: number; minute: number } | null {
    const span = Math.max(1, Math.ceil((durationMinutes || 60) / 60));
    const occupied = new Set<number>();

    for (const b of existingBlocks) {
      if (excludeBlockId && b.id === excludeBlockId) continue;
      if (b.date && b.date !== date) continue;
      if (typeof b.startHour !== 'number' || isNaN(b.startHour)) continue;
      const bSpan = Math.max(1, Math.ceil((b.durationMinutes || 60) / 60));
      for (let i = 0; i < bSpan; i++) {
        const h = b.startHour + i;
        if (h >= 0 && h <= 23) {
          occupied.add(h);
        }
      }
    }

    const startH = Math.max(8, afterHour + 1);
    const endH = 23 - span;

    for (let h = startH; h <= endH; h++) {
      let free = true;
      for (let offset = 0; offset < span; offset++) {
        if (occupied.has(h + offset)) {
          free = false;
          break;
        }
      }
      if (free) {
        return { hour: h, minute: 0 };
      }
    }
    return null;
  }

  describe('Task 1.1: 180-min candidate block properly finds 3 consecutive unoccupied hours', () => {
    it('finds 3 consecutive hours in an empty day starting at 8:00 AM', () => {
      const slot = findNextAvailableSlot(todayStr, [], 7, 180);
      expect(slot).toEqual({ hour: 8, minute: 0 });
    });

    it('skips 1-hour and 2-hour gaps to find first 3-hour contiguous window', () => {
      // Setup schedule:
      // Hour 8: occupied (60m)
      // Hour 9: FREE (gap = 1 hour)
      // Hour 10: occupied (60m)
      // Hour 11, 12: FREE (gap = 2 hours)
      // Hour 13: occupied (60m)
      // Hour 14, 15, 16: FREE (gap = 3 hours!)
      const existing: TaskTimeBlock[] = [
        mockBlock({ id: 'b8', startHour: 8, durationMinutes: 60 }),
        mockBlock({ id: 'b10', startHour: 10, durationMinutes: 60 }),
        mockBlock({ id: 'b13', startHour: 13, durationMinutes: 60 }),
      ];

      // A 60m block after 7 can fit in gap at 9
      expect(findNextAvailableSlot(todayStr, existing, 7, 60)).toEqual({ hour: 9, minute: 0 });

      // A 120m block after 7 skips 9 (only 1h), and fits in gap at 11
      expect(findNextAvailableSlot(todayStr, existing, 7, 120)).toEqual({ hour: 11, minute: 0 });

      // A 180m block after 7 must skip 9 (1h) and 11 (2h), finding 14:00 (14, 15, 16)
      const slot180 = findNextAvailableSlot(todayStr, existing, 7, 180);
      expect(slot180).toEqual({ hour: 14, minute: 0 });
    });

    it('verifies boundary limits: 180-min block fits at 20:00 (20, 21, 22) but NOT after 20:00', () => {
      const existing: TaskTimeBlock[] = [];

      // After 19:00: hours 20, 21, 22 are within operating window (<= 22:00)
      const slotAt20 = findNextAvailableSlot(todayStr, existing, 19, 180);
      expect(slotAt20).toEqual({ hour: 20, minute: 0 });

      // After 20:00: only hours 21 and 22 remain before 22:00 boundary. 3 hours cannot fit.
      const slotAfter20 = findNextAvailableSlot(todayStr, existing, 20, 180);
      expect(slotAfter20).toBeNull();
    });

    it('handles existing multi-hour blocks that shrink the available window for 180-min candidate', () => {
      // b1 is a 2-hour block starting at 13 (occupies 13 and 14)
      // b2 is a 1-hour block starting at 18 (occupies 18)
      // Window between 15 and 17: hours 15, 16, 17 are 3 consecutive hours!
      const existing: TaskTimeBlock[] = [
        mockBlock({ id: 'b1', startHour: 13, durationMinutes: 120 }),
        mockBlock({ id: 'b2', startHour: 18, durationMinutes: 60 }),
      ];

      const slot = findNextAvailableSlot(todayStr, existing, 12, 180);
      expect(slot).toEqual({ hour: 15, minute: 0 });
    });
  });

  describe('Task 1.2: Interleaved schedule patterns', () => {
    it('proves a 120-min block can never fit in any 1-hour gap when hours 8, 10, 12, 14 are occupied', () => {
      // Existing blocks at 8, 10, 12, 14 (each 60 min)
      // Gaps at 9, 11, 13 (each exactly 1 hour wide)
      // Also occupy hours 15..22 with interleaved blocks
      const interleavedBlocks: TaskTimeBlock[] = [
        mockBlock({ id: 'b8', startHour: 8, durationMinutes: 60 }),
        mockBlock({ id: 'b10', startHour: 10, durationMinutes: 60 }),
        mockBlock({ id: 'b12', startHour: 12, durationMinutes: 60 }),
        mockBlock({ id: 'b14', startHour: 14, durationMinutes: 60 }),
      ];

      // A 120-min block evaluated after 7:00 MUST NOT take hours 9, 11, or 13.
      // Since hours 15+ are free, the earliest valid slot is 15:00!
      const slot120WithTailFree = findNextAvailableSlot(todayStr, interleavedBlocks, 7, 120);
      expect(slot120WithTailFree).toEqual({ hour: 15, minute: 0 });

      // Now interleave the ENTIRE day: 8, 10, 12, 14, 16, 18, 20, 22 all occupied!
      const fullyInterleaved: TaskTimeBlock[] = [
        mockBlock({ id: 'b8', startHour: 8, durationMinutes: 60 }),
        mockBlock({ id: 'b10', startHour: 10, durationMinutes: 60 }),
        mockBlock({ id: 'b12', startHour: 12, durationMinutes: 60 }),
        mockBlock({ id: 'b14', startHour: 14, durationMinutes: 60 }),
        mockBlock({ id: 'b16', startHour: 16, durationMinutes: 60 }),
        mockBlock({ id: 'b18', startHour: 18, durationMinutes: 60 }),
        mockBlock({ id: 'b20', startHour: 20, durationMinutes: 60 }),
        mockBlock({ id: 'b22', startHour: 22, durationMinutes: 60 }),
      ];

      // 60-min block fits in first gap (hour 9)
      const slot60 = findNextAvailableSlot(todayStr, fullyInterleaved, 7, 60);
      expect(slot60).toEqual({ hour: 9, minute: 0 });

      // 120-min block CAN NEVER FIT anywhere today!
      const slot120 = findNextAvailableSlot(todayStr, fullyInterleaved, 7, 120);
      expect(slot120).toBeNull();

      // 180-min block CAN NEVER FIT anywhere today!
      const slot180 = findNextAvailableSlot(todayStr, fullyInterleaved, 7, 180);
      expect(slot180).toBeNull();
    });

    it('tests inverted interleaved schedule: hours 9, 11, 13, 15, 17, 19, 21 occupied', () => {
      const invertedInterleaved: TaskTimeBlock[] = [
        mockBlock({ id: 'b9', startHour: 9, durationMinutes: 60 }),
        mockBlock({ id: 'b11', startHour: 11, durationMinutes: 60 }),
        mockBlock({ id: 'b13', startHour: 13, durationMinutes: 60 }),
        mockBlock({ id: 'b15', startHour: 15, durationMinutes: 60 }),
        mockBlock({ id: 'b17', startHour: 17, durationMinutes: 60 }),
        mockBlock({ id: 'b19', startHour: 19, durationMinutes: 60 }),
        mockBlock({ id: 'b21', startHour: 21, durationMinutes: 60 }),
      ];

      // 60m block fits at 8:00
      expect(findNextAvailableSlot(todayStr, invertedInterleaved, 7, 60)).toEqual({ hour: 8, minute: 0 });

      // 120m block starting at 8 needs 8 and 9. 9 is occupied!
      // Gap at 10: 11 is occupied!
      // Gap at 12: 13 is occupied!
      // ...
      // Gap at 22: only 22 is <= 22, 23 would be required -> cannot fit!
      expect(findNextAvailableSlot(todayStr, invertedInterleaved, 7, 120)).toBeNull();
    });
  });

  describe('Task 1.3: Verify getReplanSuggestions returns non-overlapping slots', () => {
    it('ensures all suggestions for 120m block never overlap any existing blocks', () => {
      const target = mockBlock({
        id: 'target-task',
        startHour: 10,
        durationMinutes: 120,
        status: 'partial'
      });

      const existing: TaskTimeBlock[] = [
        target,
        mockBlock({ id: 'other-1', startHour: 12, durationMinutes: 120 }), // occupies 12, 13
        mockBlock({ id: 'other-2', startHour: 15, durationMinutes: 60 }),  // occupies 15
      ];

      const suggestions = getReplanSuggestions(target, existing, 10);
      const span = 2; // 120m = 2 hours

      // Filter out target to get actual other occupied hours
      const occupiedToday = getOccupiedHours(existing, todayStr, target.id);
      const tomorrowStr = getTomorrowDateString(todayStr);
      const occupiedTomorrow = getOccupiedHours(existing, tomorrowStr, target.id);

      expect(suggestions.length).toBeGreaterThanOrEqual(1);

      for (const suggestion of suggestions) {
        const occ = suggestion.date === todayStr ? occupiedToday : occupiedTomorrow;
        // Verify every hour in span is completely free
        for (let offset = 0; offset < span; offset++) {
          const h = suggestion.startHour + offset;
          expect(h).toBeGreaterThanOrEqual(8);
          expect(h).toBeLessThanOrEqual(22);
          expect(occ.has(h)).toBe(false);
        }
      }
    });

    it('ensures all suggestions for 180m block never overlap any existing blocks', () => {
      const target = mockBlock({
        id: 'target-180',
        startHour: 9,
        durationMinutes: 180,
        status: 'missed'
      });

      const existing: TaskTimeBlock[] = [
        target,
        mockBlock({ id: 'ex-1', startHour: 12, durationMinutes: 60 }),  // occupies 12
        mockBlock({ id: 'ex-2', startHour: 14, durationMinutes: 120 }), // occupies 14, 15
      ];

      const suggestions = getReplanSuggestions(target, existing, 9);
      const span = 3;

      const occupiedToday = getOccupiedHours(existing, todayStr, target.id);
      const tomorrowStr = getTomorrowDateString(todayStr);
      const occupiedTomorrow = getOccupiedHours(existing, tomorrowStr, target.id);

      for (const suggestion of suggestions) {
        const occ = suggestion.date === todayStr ? occupiedToday : occupiedTomorrow;
        for (let offset = 0; offset < span; offset++) {
          const h = suggestion.startHour + offset;
          expect(h).toBeGreaterThanOrEqual(8);
          expect(h).toBeLessThanOrEqual(22);
          expect(occ.has(h)).toBe(false);
        }
      }
    });

    it('ensures tomorrow fallback suggestions do not duplicate existing suggestion slots', () => {
      const target = mockBlock({
        id: 'target-dup',
        startHour: 9,
        durationMinutes: 60,
        status: 'partial'
      });

      const suggestions = getReplanSuggestions(target, [target], 10);
      const tomorrowStr = getTomorrowDateString(todayStr);
      const tomorrowHours = suggestions
        .filter((s) => s.date === tomorrowStr)
        .map((s) => s.startHour);

      // Check uniqueness of suggested hours for tomorrow
      const uniqueHours = new Set(tomorrowHours);
      expect(uniqueHours.size).toBe(tomorrowHours.length);
    });
  });

  describe('Adversarial Stress Harness: Fuzz & Invariant Testing with Oracle', () => {
    it('passes 200 randomized schedule test cases against the independent oracle', () => {
      // Deterministic PRNG seed for reproducibility
      let seed = 42;
      const rnd = () => {
        seed = (seed * 9301 + 49297) % 233280;
        return seed / 233280;
      };

      for (let iteration = 0; iteration < 200; iteration++) {
        // Generate random existing blocks
        const numBlocks = Math.floor(rnd() * 8) + 1;
        const blocks: TaskTimeBlock[] = [];
        for (let i = 0; i < numBlocks; i++) {
          const startHour = Math.floor(rnd() * 16) + 8; // 8..23
          const durations = [30, 45, 60, 90, 120, 150, 180, 240];
          const durationMinutes = durations[Math.floor(rnd() * durations.length)];
          blocks.push(mockBlock({
            id: `rand-b-${iteration}-${i}`,
            startHour,
            durationMinutes,
            date: todayStr
          }));
        }

        const candidateDurations = [30, 60, 90, 120, 180, 240];
        const candidateDuration = candidateDurations[Math.floor(rnd() * candidateDurations.length)];
        const afterHour = Math.floor(rnd() * 16) + 6; // 6..21

        const actual = findNextAvailableSlot(todayStr, blocks, afterHour, candidateDuration);
        const expected = oracleFindSlot(todayStr, blocks, afterHour, candidateDuration);

        expect(actual).toEqual(expected);

        // Also test getReplanSuggestions invariant on this randomized scenario
        const targetBlock = mockBlock({
          id: `target-${iteration}`,
          startHour: 10,
          durationMinutes: candidateDuration,
          status: 'partial',
          date: todayStr
        });
        const allBlocks = [targetBlock, ...blocks];
        const suggestions = getReplanSuggestions(targetBlock, allBlocks, afterHour);

        const span = Math.max(1, Math.ceil((candidateDuration || 60) / 60));
        const occToday = getOccupiedHours(blocks, todayStr);
        const tomorrowStr = getTomorrowDateString(todayStr);
        const occTomorrow = getOccupiedHours(blocks, tomorrowStr);

        for (const s of suggestions) {
          const occ = s.date === todayStr ? occToday : occTomorrow;
          for (let offset = 0; offset < span; offset++) {
            const h = s.startHour + offset;
            expect(h).toBeGreaterThanOrEqual(8);
            expect(h).toBeLessThanOrEqual(22);
            expect(occ.has(h)).toBe(false);
          }
        }
      }
    });

    it('handles extreme edge cases: negative duration, 0 duration, NaN, huge span, pre-8 AM blocks', () => {
      // 1. Pre-8 AM block spanning into work hours: 7:00 AM for 120 min (occupies 7 and 8)
      const earlyBlock = mockBlock({ id: 'early', startHour: 7, durationMinutes: 120 });
      const occupiedEarly = getOccupiedHours([earlyBlock]);
      expect(occupiedEarly.has(7)).toBe(true);
      expect(occupiedEarly.has(8)).toBe(true);
      expect(occupiedEarly.has(9)).toBe(false);

      const slotAfterEarly = findNextAvailableSlot(todayStr, [earlyBlock], 6, 60);
      expect(slotAfterEarly).toEqual({ hour: 9, minute: 0 }); // 8 is taken, so 9

      // 2. Huge duration block (e.g. 1440 min = 24 hours) cannot fit in 8..22 window
      const hugeSlot = findNextAvailableSlot(todayStr, [], 7, 1440);
      expect(hugeSlot).toBeNull();

      // 3. Negative duration: Math.max(1, Math.ceil((-30 || 60)/60)) = 1
      const negBlock = mockBlock({ id: 'neg', startHour: 10, durationMinutes: -30 });
      const occupiedNeg = getOccupiedHours([negBlock]);
      expect(occupiedNeg.has(10)).toBe(true);
      expect(occupiedNeg.has(11)).toBe(false);

      // 4. Candidate with negative duration falls back safely to span 1
      const slotNeg = findNextAvailableSlot(todayStr, [], 7, -50);
      expect(slotNeg).toEqual({ hour: 8, minute: 0 });

      // 5. Zero duration: 0 || 60 -> 60 -> span 1
      const zeroBlock = mockBlock({ id: 'zero', startHour: 11, durationMinutes: 0 });
      const occupiedZero = getOccupiedHours([zeroBlock]);
      expect(occupiedZero.has(11)).toBe(true);

      // 6. Block at hour 23 with multi-hour duration clamps to 23 without going out of bounds
      const lateBlock = mockBlock({ id: 'late', startHour: 23, durationMinutes: 180 });
      const occupiedLate = getOccupiedHours([lateBlock]);
      expect(occupiedLate.has(23)).toBe(true);
      expect(occupiedLate.has(24)).toBe(false);
      expect(occupiedLate.size).toBe(1);

      // 7. Full day occupancy: when all OTHER blocks occupy every hour 8..22 today and tomorrow,
      // suggestions is completely empty []
      const completelyFullOtherBlocks: TaskTimeBlock[] = [];
      const tomorrowStr = getTomorrowDateString(todayStr);
      for (let h = 0; h < 24; h++) {
        completelyFullOtherBlocks.push(mockBlock({ id: `full-other-today-${h}`, date: todayStr, startHour: h }));
        completelyFullOtherBlocks.push(mockBlock({ id: `full-other-tmrw-${h}`, date: tomorrowStr, startHour: h }));
      }
      const targetInFullDay = mockBlock({ id: 'target-distinct-id', date: todayStr, startHour: 10 });
      // targetInFullDay is distinct from full-other-today-10, so hour 10 remains occupied by full-other-today-10!
      const suggestionsOnTrulyFullSchedule = getReplanSuggestions(
        targetInFullDay,
        [targetInFullDay, ...completelyFullOtherBlocks],
        8
      );
      expect(suggestionsOnTrulyFullSchedule).toEqual([]);
    });
  });
});


