import { TaskTimeBlock } from '../../types/task';
import { getISODateString } from '../date';

export interface ReplanSlot {
  date: string;
  startHour: number;
  startMinute: number;
  label: string;
  reason: string;
}

export type ReplanSuggestion = ReplanSlot;

/**
 * Computes all occupied hours for a given day (or across provided blocks),
 * accounting for multi-hour spans and excluding a target block if requested.
 *
 * @param blocks - The list of task time blocks to evaluate.
 * @param targetDate - Optional ISO date string (YYYY-MM-DD). If provided, only blocks matching this date are considered.
 * @param excludeBlockId - Optional block ID to exclude from occupied calculation (prevents self-collision).
 * @returns Set of occupied hour numbers (0..23).
 */
export function getOccupiedHours(
  blocks: TaskTimeBlock[],
  targetDate?: string,
  excludeBlockId?: string
): Set<number> {
  const occupied = new Set<number>();

  for (const b of blocks) {
    if (excludeBlockId && b.id === excludeBlockId) {
      continue;
    }
    if (targetDate && b.date !== targetDate) {
      continue;
    }
    if (typeof b.startHour !== 'number' || isNaN(b.startHour)) {
      continue;
    }

    const span = Math.max(1, Math.ceil((b.durationMinutes || 60) / 60));
    for (let offset = 0; offset < span; offset++) {
      const h = b.startHour + offset;
      if (h >= 0 && h <= 23) {
        occupied.add(h);
      }
    }
  }

  return occupied;
}

/**
 * Finds the first free slot on a given date after a reference hour,
 * verifying that all contiguous hours for the requested duration are unoccupied
 * within the operating bounds (08:00 - 22:00).
 *
 * @param date - The target date string (YYYY-MM-DD).
 * @param existingBlocks - Existing time blocks to check against.
 * @param afterHour - Reference hour after which to search (defaults to current system hour).
 * @param durationMinutes - Duration in minutes of the candidate block (defaults to 60).
 * @param excludeBlockId - Optional block ID to exclude from occupancy (prevents self-collision).
 * @returns The next available { hour, minute } slot, or null if none available.
 */
export function findNextAvailableSlot(
  date: string,
  existingBlocks: TaskTimeBlock[],
  afterHour?: number,
  durationMinutes?: number,
  excludeBlockId?: string
): { hour: number; minute: number } | null {
  const refHour = afterHour !== undefined ? afterHour : new Date().getHours();
  const span = Math.max(1, Math.ceil((durationMinutes || 60) / 60));
  const occupiedHours = getOccupiedHours(existingBlocks, date, excludeBlockId);

  // Operating bounds: 08:00 to 22:00
  // Candidate block starting at h occupies [h, h + span - 1].
  // Must satisfy h + span - 1 <= 22 <=> h <= 23 - span.
  const startH = Math.max(8, refHour + 1);
  const endH = 23 - span;

  for (let h = startH; h <= endH; h++) {
    let slotAvailable = true;
    for (let offset = 0; offset < span; offset++) {
      if (occupiedHours.has(h + offset)) {
        slotAvailable = false;
        break;
      }
    }
    if (slotAvailable) {
      return { hour: h, minute: 0 };
    }
  }

  return null;
}

/**
 * Calculates tomorrow's YYYY-MM-DD string safely.
 */
export function getTomorrowDateString(currentDateStr?: string): string {
  const base = currentDateStr ? new Date(currentDateStr + 'T12:00:00') : new Date();
  const tomorrow = new Date(base);
  tomorrow.setDate(tomorrow.getDate() + 1);
  return getISODateString(tomorrow);
}

/**
 * Generates structured 1-click replan options for a missed, partial, or bumped time block.
 * Excludes the target block from collision detection and ensures all suggested slots
 * are free for the full duration span of the candidate block.
 *
 * @param block - The candidate time block being replanned.
 * @param existingBlocks - The list of existing time blocks.
 * @param currentHour - Optional reference hour (defaults to current system hour).
 * @returns Array of replan suggestions.
 */
export function getReplanSuggestions(
  block: TaskTimeBlock,
  existingBlocks: TaskTimeBlock[],
  currentHour?: number
): ReplanSuggestion[] {
  const suggestions: ReplanSuggestion[] = [];
  const nowH = currentHour !== undefined ? currentHour : new Date().getHours();
  const todayStr = getISODateString(new Date());
  const tomorrowDate = getTomorrowDateString(block.date);
  const span = Math.max(1, Math.ceil((block.durationMinutes || 60) / 60));

  // Exclude candidate block itself to prevent self-collision
  const otherBlocks = existingBlocks.filter((b) => b.id !== block.id);
  const todayOccupiedHours = getOccupiedHours(otherBlocks, todayStr);
  const tomorrowOccupiedHours = getOccupiedHours(otherBlocks, tomorrowDate);

  const isSlotFree = (occupied: Set<number>, startHour: number, spanHours: number): boolean => {
    if (startHour < 8 || startHour + spanHours - 1 > 22) return false;
    for (let offset = 0; offset < spanHours; offset++) {
      if (occupied.has(startHour + offset)) {
        return false;
      }
    }
    return true;
  };

  const formatTime = (h: number): { dispH: number; ampm: string } => {
    const ampm = h >= 12 ? 'PM' : 'AM';
    const dispH = h % 12 === 0 ? 12 : h % 12;
    return { dispH, ampm };
  };

  // 1. Next available free slot today
  let nextFree: { hour: number; minute: number } | null = null;
  if (block.date === todayStr) {
    nextFree = findNextAvailableSlot(
      todayStr,
      otherBlocks,
      nowH,
      block.durationMinutes
    );
    if (nextFree) {
      const { dispH, ampm } = formatTime(nextFree.hour);
      suggestions.push({
        date: todayStr,
        startHour: nextFree.hour,
        startMinute: nextFree.minute,
        label: `Next Free Slot (${dispH}:00 ${ampm})`,
        reason: 'First unoccupied hour today'
      });
    }

    // 2. Later today (+2 hours from nowH if within bounds and unoccupied for full span)
    const targetLaterH = nowH + 2;
    if (targetLaterH > nowH && isSlotFree(todayOccupiedHours, targetLaterH, span)) {
      if (!nextFree || nextFree.hour !== targetLaterH) {
        const { dispH, ampm } = formatTime(targetLaterH);
        suggestions.push({
          date: todayStr,
          startHour: targetLaterH,
          startMinute: 0,
          label: `Later Today (${dispH}:00 ${ampm})`,
          reason: 'Pushes out by 2 hours'
        });
      }
    }
  }

  // 3. Tomorrow at same hour (if free for full span)
  const canKeepSameHour = isSlotFree(tomorrowOccupiedHours, block.startHour, span);
  if (canKeepSameHour) {
    const { dispH, ampm } = formatTime(block.startHour);
    suggestions.push({
      date: tomorrowDate,
      startHour: block.startHour,
      startMinute: block.startMinute || 0,
      label: `Tomorrow at ${dispH}:00 ${ampm}`,
      reason: 'Keeps identical time slot tomorrow'
    });
  }

  // 4. Tomorrow peak morning slot (9 AM) (if free for full span and not identical to same hour)
  const is9AmSame = canKeepSameHour && block.startHour === 9;
  if (!is9AmSame && isSlotFree(tomorrowOccupiedHours, 9, span)) {
    suggestions.push({
      date: tomorrowDate,
      startHour: 9,
      startMinute: 0,
      label: 'Tomorrow Morning (9:00 AM)',
      reason: 'Fresh start during peak circadian band'
    });
  }

  // 5. Fallback if tomorrow has fewer than 2 suggestions (e.g. default slots are occupied or out of bounds)
  if (suggestions.filter((s) => s.date === tomorrowDate).length < 2) {
    const tomorrowSlot = findNextAvailableSlot(tomorrowDate, otherBlocks, 7, block.durationMinutes);
    if (tomorrowSlot && !suggestions.some((s) => s.date === tomorrowDate && s.startHour === tomorrowSlot.hour)) {
      const { dispH, ampm } = formatTime(tomorrowSlot.hour);
      const isMorning = tomorrowSlot.hour < 12;
      suggestions.push({
        date: tomorrowDate,
        startHour: tomorrowSlot.hour,
        startMinute: tomorrowSlot.minute,
        label: isMorning ? `Tomorrow Morning (${dispH}:00 ${ampm})` : `Tomorrow Afternoon (${dispH}:00 ${ampm})`,
        reason: isMorning ? 'First unoccupied slot tomorrow morning' : 'Next available slot tomorrow afternoon'
      });
    }
  }

  // Additional fallback for afternoon option if still under 2 options tomorrow
  if (suggestions.filter((s) => s.date === tomorrowDate).length < 2) {
    const afternoonSlot = findNextAvailableSlot(tomorrowDate, otherBlocks, 12, block.durationMinutes);
    if (afternoonSlot && !suggestions.some((s) => s.date === tomorrowDate && s.startHour === afternoonSlot.hour)) {
      const { dispH, ampm } = formatTime(afternoonSlot.hour);
      suggestions.push({
        date: tomorrowDate,
        startHour: afternoonSlot.hour,
        startMinute: afternoonSlot.minute,
        label: `Tomorrow Afternoon (${dispH}:00 ${ampm})`,
        reason: 'Next available slot tomorrow afternoon'
      });
    }
  }

  return suggestions;
}
