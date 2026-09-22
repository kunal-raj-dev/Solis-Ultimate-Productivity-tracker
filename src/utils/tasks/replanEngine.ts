import { TaskTimeBlock } from '../../types/task';
import { getISODateString } from '../date';

export interface ReplanSlot {
  date: string;
  startHour: number;
  startMinute: number;
  label: string;
  reason: string;
}

/**
 * Finds the first free hour slot today after a given reference hour.
 */
export function findNextAvailableSlot(
  date: string,
  existingBlocks: TaskTimeBlock[],
  afterHour?: number
): { hour: number; minute: number } | null {
  const refHour = afterHour !== undefined ? afterHour : new Date().getHours();
  const dayBlocks = existingBlocks.filter((b) => b.date === date);
  const occupiedHours = new Set(dayBlocks.map((b) => b.startHour));

  // Check slots from afterHour + 1 up to 22:00
  for (let h = Math.max(8, refHour + 1); h <= 22; h++) {
    if (!occupiedHours.has(h)) {
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
 */
export function getReplanSuggestions(
  block: TaskTimeBlock,
  existingBlocks: TaskTimeBlock[],
  currentHour?: number
): ReplanSlot[] {
  const suggestions: ReplanSlot[] = [];
  const nowH = currentHour !== undefined ? currentHour : new Date().getHours();
  const todayStr = getISODateString(new Date());

  // 1. Next available free slot today
  if (block.date === todayStr) {
    const nextFree = findNextAvailableSlot(todayStr, existingBlocks, nowH);
    if (nextFree) {
      const ampm = nextFree.hour >= 12 ? 'PM' : 'AM';
      const dispH = nextFree.hour % 12 === 0 ? 12 : nextFree.hour % 12;
      suggestions.push({
        date: todayStr,
        startHour: nextFree.hour,
        startMinute: nextFree.minute,
        label: `Next Free Slot (${dispH}:00 ${ampm})`,
        reason: 'First unoccupied hour today'
      });
    }

    // 2. Later today (+2 hours if <= 22:00)
    const laterH = Math.min(22, nowH + 2);
    if (laterH > nowH && (!nextFree || nextFree.hour !== laterH)) {
      const ampm = laterH >= 12 ? 'PM' : 'AM';
      const dispH = laterH % 12 === 0 ? 12 : laterH % 12;
      suggestions.push({
        date: todayStr,
        startHour: laterH,
        startMinute: 0,
        label: `Later Today (${dispH}:00 ${ampm})`,
        reason: 'Pushes out by 2 hours'
      });
    }
  }

  // 3. Tomorrow at same hour
  const tomorrowDate = getTomorrowDateString(block.date);
  const sameHourAmPm = block.startHour >= 12 ? 'PM' : 'AM';
  const sameHourDispH = block.startHour % 12 === 0 ? 12 : block.startHour % 12;
  suggestions.push({
    date: tomorrowDate,
    startHour: block.startHour,
    startMinute: block.startMinute || 0,
    label: `Tomorrow at ${sameHourDispH}:00 ${sameHourAmPm}`,
    reason: 'Keeps identical time slot tomorrow'
  });

  // 4. Tomorrow peak morning slot (9 AM)
  if (block.startHour !== 9) {
    suggestions.push({
      date: tomorrowDate,
      startHour: 9,
      startMinute: 0,
      label: 'Tomorrow Morning (9:00 AM)',
      reason: 'Fresh start during peak circadian band'
    });
  }

  return suggestions;
}
