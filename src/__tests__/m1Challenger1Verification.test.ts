import { describe, it, expect } from 'vitest';
import {
  findNextAvailableSlot,
  getOccupiedHours,
  getReplanSuggestions,
  getTomorrowDateString
} from '../utils/tasks/replanEngine';
import { TaskTimeBlock } from '../types/task';
import { getISODateString } from '../utils/date';

describe('Milestone 1 Challenger 1 Empirical Verification Suite', () => {
  const todayStr = getISODateString(new Date());

  const createBlock = (overrides: Partial<TaskTimeBlock> = {}): TaskTimeBlock => ({
    id: `blk-${Math.random().toString(36).slice(2, 9)}`,
    taskId: 'task-test',
    taskTitle: 'Adversarial Test Task',
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

  /* =========================================================================
     1. Extreme & Boundary Durations: [0, undefined, negative, 15, 60, 120, 240, 1440]
     ========================================================================= */

  describe('Extreme & Boundary Durations', () => {
    it('handles durationMinutes: 0 (defaults to span of 1 hour / 60 min)', () => {
      const block = createBlock({ id: 'zero-dur', startHour: 10, durationMinutes: 0 });
      const occupied = getOccupiedHours([block]);
      expect(occupied.has(10)).toBe(true);
      expect(occupied.has(11)).toBe(false);
      expect(occupied.size).toBe(1);

      // Candidate block with duration 0
      const slot = findNextAvailableSlot(todayStr, [block], 9, 0);
      // 10 is occupied, 11 is free
      expect(slot).toEqual({ hour: 11, minute: 0 });

      // Replan suggestions for block with duration 0
      const suggestions = getReplanSuggestions(block, [block], 9);
      expect(suggestions.length).toBeGreaterThan(0);
      const nextFree = suggestions.find((s) => s.reason.includes('unoccupied'));
      // Self-collision avoided: hour 10 is candidate's own hour, so next free is 10:00 AM!
      expect(nextFree).toEqual(expect.objectContaining({ startHour: 10, startMinute: 0 }));
    });

    it('handles durationMinutes: undefined (defaults to span of 1 hour / 60 min)', () => {
      const block = createBlock({ id: 'undef-dur', startHour: 14, durationMinutes: undefined });
      const occupied = getOccupiedHours([block]);
      expect(occupied.has(14)).toBe(true);
      expect(occupied.has(15)).toBe(false);
      expect(occupied.size).toBe(1);

      const slot = findNextAvailableSlot(todayStr, [block], 13, undefined);
      expect(slot).toEqual({ hour: 15, minute: 0 });

      const suggestions = getReplanSuggestions(block, [block], 13);
      expect(suggestions.length).toBeGreaterThan(0);
    });

    it('handles negative durationMinutes (-15, -60, -120) by clamping span to minimum 1', () => {
      const negBlocks = [
        createBlock({ id: 'neg-15', startHour: 9, durationMinutes: -15 }),
        createBlock({ id: 'neg-60', startHour: 12, durationMinutes: -60 }),
        createBlock({ id: 'neg-120', startHour: 15, durationMinutes: -120 }),
      ];

      const occupied = getOccupiedHours(negBlocks);
      expect(occupied.has(9)).toBe(true);
      expect(occupied.has(10)).toBe(false);
      expect(occupied.has(12)).toBe(true);
      expect(occupied.has(13)).toBe(false);
      expect(occupied.has(15)).toBe(true);
      expect(occupied.has(16)).toBe(false);
      expect(occupied.size).toBe(3);

      // findNextAvailableSlot with negative durations
      expect(findNextAvailableSlot(todayStr, [], 8, -60)).toEqual({ hour: 9, minute: 0 });
      expect(findNextAvailableSlot(todayStr, [], 8, -120)).toEqual({ hour: 9, minute: 0 });

      // getReplanSuggestions with negative duration
      const target = createBlock({ id: 'neg-target', startHour: 10, durationMinutes: -90 });
      const suggestions = getReplanSuggestions(target, [target], 8);
      expect(suggestions.length).toBeGreaterThan(0);
    });

    it('handles durationMinutes: 15 (rounds up to span 1)', () => {
      const block15 = createBlock({ id: 'dur-15', startHour: 9, durationMinutes: 15 });
      const occupied = getOccupiedHours([block15]);
      expect(occupied.has(9)).toBe(true);
      expect(occupied.has(10)).toBe(false);
      expect(occupied.size).toBe(1);

      const slot = findNextAvailableSlot(todayStr, [block15], 8, 15);
      expect(slot).toEqual({ hour: 10, minute: 0 });
    });

    it('handles durationMinutes: 60 (standard single-hour span)', () => {
      const block60 = createBlock({ id: 'dur-60', startHour: 11, durationMinutes: 60 });
      const occupied = getOccupiedHours([block60]);
      expect(occupied.has(11)).toBe(true);
      expect(occupied.has(12)).toBe(false);
      expect(occupied.size).toBe(1);

      const slot = findNextAvailableSlot(todayStr, [block60], 10, 60);
      expect(slot).toEqual({ hour: 12, minute: 0 });
    });

    it('handles durationMinutes: 120 (2-hour contiguous span)', () => {
      const block120 = createBlock({ id: 'dur-120', startHour: 10, durationMinutes: 120 });
      const occupied = getOccupiedHours([block120]);
      expect(occupied.has(10)).toBe(true);
      expect(occupied.has(11)).toBe(true);
      expect(occupied.has(12)).toBe(false);
      expect(occupied.size).toBe(2);

      // Block at 10 (120m): searching after 9 for 60m block yields 12 (skips 10 & 11)
      expect(findNextAvailableSlot(todayStr, [block120], 9, 60)).toEqual({ hour: 12, minute: 0 });

      // Searching for 120m candidate when 12 is occupied needs 13 & 14
      const extra = createBlock({ id: 'dur-60-at-12', startHour: 12, durationMinutes: 60 });
      expect(findNextAvailableSlot(todayStr, [block120, extra], 9, 120)).toEqual({ hour: 13, minute: 0 });
    });

    it('handles durationMinutes: 240 (4-hour contiguous span)', () => {
      const block240 = createBlock({ id: 'dur-240', startHour: 10, durationMinutes: 240 });
      const occupied = getOccupiedHours([block240]);
      expect(occupied.has(10)).toBe(true);
      expect(occupied.has(11)).toBe(true);
      expect(occupied.has(12)).toBe(true);
      expect(occupied.has(13)).toBe(true);
      expect(occupied.has(14)).toBe(false);
      expect(occupied.size).toBe(4);

      // Candidate 240m needs 4 contiguous hours (e.g. 14, 15, 16, 17)
      const slot = findNextAvailableSlot(todayStr, [block240], 9, 240);
      expect(slot).toEqual({ hour: 14, minute: 0 });

      // Candidate 240m late in day: after 19:00 cannot fit (19:00 + 4h = 23:00 > 22:00 max hour)
      const lateSlot = findNextAvailableSlot(todayStr, [], 19, 240);
      expect(lateSlot).toBeNull();
    });

    it('handles durationMinutes: 1440 (full 24-hour block)', () => {
      const block1440 = createBlock({ id: 'dur-1440', startHour: 0, durationMinutes: 1440 });
      const occupied = getOccupiedHours([block1440]);
      expect(occupied.size).toBe(24);
      for (let h = 0; h < 24; h++) {
        expect(occupied.has(h)).toBe(true);
      }

      // Candidate 1440m block exceeds operating bounds (8..22 is only 15 hours), so cannot fit
      const candidateSlot = findNextAvailableSlot(todayStr, [], 7, 1440);
      expect(candidateSlot).toBeNull();

      // getReplanSuggestions on 1440m block returns empty suggestions (no slot can accommodate 24 hours in 8..22 window)
      const suggestions = getReplanSuggestions(block1440, [block1440], 8);
      expect(suggestions).toEqual([]);
    });
  });

  /* =========================================================================
     2. Operating Hour Boundary: 21:00 and 22:00 with Multi-Hour Durations
     ========================================================================= */

  describe('Operating Hour Boundaries (21:00, 22:00) with Multi-Hour Spans', () => {
    it('allows 1-hour block at 21:00 and 22:00, but rejects at 23:00', () => {
      // After 20:00: can start at 21:00
      expect(findNextAvailableSlot(todayStr, [], 20, 60)).toEqual({ hour: 21, minute: 0 });

      // After 21:00: can start at 22:00
      expect(findNextAvailableSlot(todayStr, [], 21, 60)).toEqual({ hour: 22, minute: 0 });

      // After 22:00: no hours left in 8..22 operating bounds
      expect(findNextAvailableSlot(todayStr, [], 22, 60)).toBeNull();
      expect(findNextAvailableSlot(todayStr, [], 23, 60)).toBeNull();
    });

    it('allows 2-hour block (120m) starting at 21:00 (spans 21, 22) but rejects starting at 22:00', () => {
      // After 20:00: hours 21 and 22 are free -> can start at 21:00
      const slot21 = findNextAvailableSlot(todayStr, [], 20, 120);
      expect(slot21).toEqual({ hour: 21, minute: 0 });

      // After 21:00: only hour 22 is remaining. 2-hour block needs 22 and 23 (23 > 22) -> returns null!
      const slot22 = findNextAvailableSlot(todayStr, [], 21, 120);
      expect(slot22).toBeNull();
    });

    it('rejects 3-hour block (180m) starting at 21:00 or 22:00 (cannot fit <= 22:00)', () => {
      // 3-hour block at 21:00 needs 21, 22, 23 (23 > 22) -> must be null
      const slotAfter20 = findNextAvailableSlot(todayStr, [], 20, 180);
      expect(slotAfter20).toBeNull();

      // 3-hour block after 21:00 must also be null
      const slotAfter21 = findNextAvailableSlot(todayStr, [], 21, 180);
      expect(slotAfter21).toBeNull();

      // But 3-hour block after 19:00 can start at 20:00 (spans 20, 21, 22)
      const slotAfter19 = findNextAvailableSlot(todayStr, [], 19, 180);
      expect(slotAfter19).toEqual({ hour: 20, minute: 0 });
    });

    it('prevents getReplanSuggestions from suggesting out-of-bounds evening slots', () => {
      const target2h = createBlock({
        id: 'target-late-2h',
        startHour: 22,
        durationMinutes: 120,
        status: 'partial'
      });

      // Evaluated at 20:00:
      // Later today would be 20 + 2 = 22. But at 22, a 120m block needs 22 & 23 (exceeds 22 boundary).
      // So Later Today MUST NOT be suggested!
      const suggestions = getReplanSuggestions(target2h, [target2h], 20);
      const laterToday = suggestions.find((s) => s.label.includes('Later Today'));
      expect(laterToday).toBeUndefined();

      // Also "Tomorrow at same hour (22:00)" must NOT be suggested because 22:00 with 120m overflows!
      const tomorrowSame = suggestions.find((s) => s.reason.includes('identical'));
      expect(tomorrowSame).toBeUndefined();

      // Verify all returned suggestions strictly satisfy startHour + span - 1 <= 22
      for (const s of suggestions) {
        expect(s.startHour + 2 - 1).toBeLessThanOrEqual(22);
        expect(s.startHour).toBeGreaterThanOrEqual(8);
      }
    });
  });

  /* =========================================================================
     3. Completely Full Day vs Completely Empty Day
     ========================================================================= */

  describe('Completely Full Day vs Completely Empty Day', () => {
    it('handles completely empty day: correctly allocates slots without error', () => {
      const emptyBlocks: TaskTimeBlock[] = [];
      const occupied = getOccupiedHours(emptyBlocks, todayStr);
      expect(occupied.size).toBe(0);

      // Single-hour block
      expect(findNextAvailableSlot(todayStr, emptyBlocks, 7, 60)).toEqual({ hour: 8, minute: 0 });
      // 2-hour block
      expect(findNextAvailableSlot(todayStr, emptyBlocks, 7, 120)).toEqual({ hour: 8, minute: 0 });
      // 5-hour block
      expect(findNextAvailableSlot(todayStr, emptyBlocks, 7, 300)).toEqual({ hour: 8, minute: 0 });

      // getReplanSuggestions on empty day provides complete set of options
      const target = createBlock({ id: 'target-empty-day', startHour: 10, durationMinutes: 120 });
      const suggestions = getReplanSuggestions(target, [target], 8);
      expect(suggestions.length).toBeGreaterThanOrEqual(3);
    });

    it('handles completely full day: all hours 0..23 occupied', () => {
      const fullBlocks: TaskTimeBlock[] = [];
      for (let h = 0; h < 24; h++) {
        fullBlocks.push(createBlock({ id: `full-${h}`, startHour: h, durationMinutes: 60 }));
      }

      const occupied = getOccupiedHours(fullBlocks, todayStr);
      expect(occupied.size).toBe(24);

      // No slot can be found for any duration
      expect(findNextAvailableSlot(todayStr, fullBlocks, 7, 60)).toBeNull();
      expect(findNextAvailableSlot(todayStr, fullBlocks, 7, 120)).toBeNull();

      // Also fill tomorrow completely
      const tomorrowStr = getTomorrowDateString(todayStr);
      for (let h = 0; h < 24; h++) {
        fullBlocks.push(createBlock({ id: `full-tmrw-${h}`, date: tomorrowStr, startHour: h, durationMinutes: 60 }));
      }

      // Case A: Target is a separate block not in fullBlocks (all hours taken by OTHER blocks)
      const separateTarget = createBlock({ id: 'separate-target', startHour: 10, durationMinutes: 60 });
      const suggestionsSeparate = getReplanSuggestions(separateTarget, fullBlocks, 8);
      expect(suggestionsSeparate).toEqual([]);

      // Case B: Target is fullBlocks[10], but evaluated at or after hour 10 (all remaining hours occupied)
      const targetInFull = fullBlocks[10];
      const suggestionsAt10 = getReplanSuggestions(targetInFull, fullBlocks, 10);
      expect(suggestionsAt10).toEqual([]);
    });

    it('handles full working day (8..22 occupied) with non-work hours free', () => {
      const workBlocks: TaskTimeBlock[] = [];
      for (let h = 8; h <= 22; h++) {
        workBlocks.push(createBlock({ id: `work-${h}`, startHour: h, durationMinutes: 60 }));
      }

      // Even though hours 0..7 and 23 are free, working window 8..22 has no free slot
      expect(findNextAvailableSlot(todayStr, workBlocks, 7, 60)).toBeNull();
      expect(findNextAvailableSlot(todayStr, workBlocks, 7, 120)).toBeNull();
    });
  });

  /* =========================================================================
     4. Self-Collision Scenarios: Rescheduling Multi-Hour Blocks
     ========================================================================= */

  describe('Self-Collision Scenarios', () => {
    it('rescheduling a 2-hour block (120m) does not collide with its own existing slot', () => {
      // Block is at 10:00 (spans 10 and 11)
      const target = createBlock({
        id: 'target-self-2h',
        startHour: 10,
        durationMinutes: 120,
        status: 'partial'
      });

      // No other blocks today
      const existing = [target];

      // If we exclude target's ID, hours 10 and 11 are not in occupied set
      const occupied = getOccupiedHours(existing, todayStr, target.id);
      expect(occupied.has(10)).toBe(false);
      expect(occupied.has(11)).toBe(false);
      expect(occupied.size).toBe(0);

      // Searching after 8:00 for a 120m block:
      // If target wasn't excluded, 10:00 would be blocked, so candidate at 9:00 (needs 9, 10) would fail,
      // and candidate at 10:00 (needs 10, 11) would fail, pushing to 12:00.
      // With self-exclusion: 9:00 (needs 9, 10) is completely free!
      const slot = findNextAvailableSlot(todayStr, existing, 8, 120, target.id);
      expect(slot).toEqual({ hour: 9, minute: 0 });

      // In getReplanSuggestions: Next Free Slot evaluated at 8:00 AM should recommend 9:00 AM
      const suggestions = getReplanSuggestions(target, existing, 8);
      const nextFree = suggestions.find((s) => s.reason.includes('unoccupied'));
      expect(nextFree).toBeDefined();
      expect(nextFree?.startHour).toBe(9);
    });

    it('rescheduling a 3-hour block (180m) does not collide with itself when shifting within window', () => {
      // Target is 180m at 11:00 (occupies 11, 12, 13)
      const target = createBlock({
        id: 'target-3h',
        startHour: 11,
        durationMinutes: 180,
        status: 'partial'
      });

      // Another block at 15:00 (occupies 15)
      const other = createBlock({ id: 'other-15', startHour: 15, durationMinutes: 60 });
      const existing = [target, other];

      // After 9:00 AM, candidate needs 3 hours: 10, 11, 12.
      // Target spans 11, 12, 13.
      // If target was NOT excluded, hour 10 would be free, but 11 and 12 would be blocked by target!
      // So slot at 10:00 would be rejected.
      // With self-exclusion: hours 10, 11, 12 are all free! (15 is after 13).
      const slot = findNextAvailableSlot(todayStr, existing, 9, 180, target.id);
      expect(slot).toEqual({ hour: 10, minute: 0 });

      const suggestions = getReplanSuggestions(target, existing, 9);
      const nextFree = suggestions.find((s) => s.reason.includes('unoccupied'));
      expect(nextFree?.startHour).toBe(10);
    });

    it('ensures tomorrow suggestions are evaluated without self-collision if target has tomorrow date', () => {
      const tomorrowStr = getTomorrowDateString(todayStr);
      const targetTomorrow = createBlock({
        id: 'target-tmrw',
        date: tomorrowStr,
        startHour: 10,
        durationMinutes: 120,
        status: 'planned'
      });

      const existing = [targetTomorrow];

      // When getting replan suggestions, target should not collide with itself on tomorrowDate
      const suggestions = getReplanSuggestions(targetTomorrow, existing, 8);
      for (const s of suggestions) {
        if (s.date === tomorrowStr) {
          expect(s.startHour).toBeGreaterThanOrEqual(8);
          expect(s.startHour + 2 - 1).toBeLessThanOrEqual(22);
        }
      }
    });
  });

  /* =========================================================================
     5. Contiguity and Non-Overlapping Invariant Checks
     ========================================================================= */

  describe('Contiguity and Non-Overlapping Invariant Assertions', () => {
    it('guarantees that every suggested slot is contiguous and non-overlapping across arbitrary schedules', () => {
      // Deterministic pseudo-random scenario generation
      let seed = 12345;
      const rnd = () => {
        seed = (seed * 16807) % 2147483647;
        return (seed - 1) / 2147483646;
      };

      for (let run = 0; run < 50; run++) {
        const blocks: TaskTimeBlock[] = [];
        const count = Math.floor(rnd() * 6) + 1;
        for (let i = 0; i < count; i++) {
          const h = Math.floor(rnd() * 14) + 8; // 8..21
          const d = [30, 60, 90, 120, 180][Math.floor(rnd() * 5)];
          blocks.push(createBlock({ id: `b-${run}-${i}`, startHour: h, durationMinutes: d }));
        }

        const candidateDur = [60, 120, 180, 240][Math.floor(rnd() * 4)];
        const evalHour = Math.floor(rnd() * 12) + 8; // 8..19

        const target = createBlock({
          id: `target-${run}`,
          startHour: 10,
          durationMinutes: candidateDur,
          status: 'partial'
        });

        const allBlocks = [target, ...blocks];
        const suggestions = getReplanSuggestions(target, allBlocks, evalHour);
        const span = Math.max(1, Math.ceil((candidateDur || 60) / 60));

        const occToday = getOccupiedHours(blocks, todayStr);
        const tomorrowStr = getTomorrowDateString(todayStr);
        const occTomorrow = getOccupiedHours(blocks, tomorrowStr);

        for (const s of suggestions) {
          expect(s.startHour).toBeGreaterThanOrEqual(8);
          expect(s.startHour + span - 1).toBeLessThanOrEqual(22);

          const occ = s.date === todayStr ? occToday : occTomorrow;
          for (let offset = 0; offset < span; offset++) {
            const h = s.startHour + offset;
            expect(occ.has(h)).toBe(false);
          }
        }
      }
    });
  });
});
