/**
 * Solis — Guided Morning Planning Ritual Logic (F-201)
 *
 * Implements Sunsama/Superhuman-style morning intentionality:
 *  1. Rollover triage (yesterday's unfinished work)
 *  2. "Big 3" high-impact priority commitment
 *  3. Cognitive Workload Ceiling Guard (>6h overcommitment warning)
 *  4. Intelligent slot allocation harmonized with external calendar busy events
 *
 * Pure, deterministic functions only (master.md §18).
 */

import { Task, TaskTimeBlock } from '../../types/task';
import { ExternalCalendarEvent } from '../../types/calendar';
import { TaskTriageAction } from '../../types/morningPlanning';

export type { TaskTriageAction };

export interface WorkloadCeilingAssessment {
  plannedMinutes: number;
  plannedHours: number;
  dailyCapacityMinutes: number;
  capacityHours: number;
  utilizationPercentage: number;
  isOvercommitted: boolean;
  maxRecommendedMinutes: number; // 360 mins / 6h
  status: 'optimal' | 'full' | 'overcommitted';
  warningMessage?: string;
}

export const MAX_COGNITIVE_DEEP_WORK_MINUTES = 360; // 6 hours

/**
 * Identifies tasks that rolled over from past days and remain uncompleted.
 */
export function identifyRolloverTasks(tasks: Task[], todayKey: string): Task[] {
  return tasks.filter((t) => {
    if (t.status === 'completed') return false;
    if (t.dueDate && t.dueDate < todayKey) return true;
    return false;
  });
}

/**
 * Evaluates total planned focus minutes against the student's capacity
 * and cognitive deep work ceiling (6 hours).
 */
export function calculateWorkloadCeiling(
  plannedMinutes: number,
  dailyCapacityMinutes: number = MAX_COGNITIVE_DEEP_WORK_MINUTES
): WorkloadCeilingAssessment {
  const plannedHours = Math.round((plannedMinutes / 60) * 10) / 10;
  const capacityHours = Math.round((dailyCapacityMinutes / 60) * 10) / 10;
  const utilizationPercentage = Math.round((plannedMinutes / Math.max(1, dailyCapacityMinutes)) * 100);

  const isOvercommitted =
    plannedMinutes > dailyCapacityMinutes || plannedMinutes > MAX_COGNITIVE_DEEP_WORK_MINUTES;

  let status: WorkloadCeilingAssessment['status'] = 'optimal';
  let warningMessage: string | undefined;

  if (isOvercommitted) {
    status = 'overcommitted';
    if (plannedMinutes > MAX_COGNITIVE_DEEP_WORK_MINUTES) {
      warningMessage = `High cognitive load: ${plannedHours}h of deep work planned. Academic retention degrades sharply beyond 6h. Consider deferring 1 task to tomorrow.`;
    } else {
      warningMessage = `Planned study (${plannedHours}h) exceeds your daily capacity limit of ${capacityHours}h. Consider trimming your focus list.`;
    }
  } else if (utilizationPercentage >= 80) {
    status = 'full';
  }

  return {
    plannedMinutes,
    plannedHours,
    dailyCapacityMinutes,
    capacityHours,
    utilizationPercentage,
    isOvercommitted,
    maxRecommendedMinutes: MAX_COGNITIVE_DEEP_WORK_MINUTES,
    status,
    warningMessage
  };
}

export interface SlotSuggestionParams {
  externalEvents: ExternalCalendarEvent[];
  existingBlocks: TaskTimeBlock[];
  dayStartHour?: number; // default 8 (8 AM)
  dayEndHour?: number;   // default 20 (8 PM)
  neededSlotsCount: number;
}

/**
 * Finds optimal open hourly slots for the committed Big 3 tasks,
 * ensuring no overlap with external busy events or existing timeblocks.
 */
export function findAvailableFocusSlots(params: SlotSuggestionParams): number[] {
  const {
    externalEvents,
    existingBlocks,
    dayStartHour = 8,
    dayEndHour = 20,
    neededSlotsCount
  } = params;

  // Track busy hours
  const busyHours = new Set<number>();

  // Mark external busy hours
  for (const ev of externalEvents) {
    if (!ev.isBusy) continue;
    let startH: number;
    let endH: number;

    if (ev.startTime.includes('T') && ev.endTime.includes('T')) {
      startH = parseInt(ev.startTime.slice(11, 13), 10);
      endH = parseInt(ev.endTime.slice(11, 13), 10);
    } else {
      startH = new Date(ev.startTime).getHours();
      endH = new Date(ev.endTime).getHours();
    }

    if (isNaN(startH)) startH = 8;
    if (isNaN(endH)) endH = startH + 1;

    for (let h = startH; h < endH; h++) {
      busyHours.add(h);
    }
  }

  // Mark existing Solis blocks
  for (const block of existingBlocks) {
    const startH = block.startHour;
    const durationH = Math.ceil((block.durationMinutes || 60) / 60);
    for (let h = startH; h < startH + durationH; h++) {
      busyHours.add(h);
    }
  }

  // Circadian preference: Morning peak (9-11), afternoon (14-16), early evening (17-19)
  const preferredHourOrder = [9, 10, 11, 14, 15, 16, 8, 13, 17, 18, 19];
  const candidates: number[] = [];

  for (const h of preferredHourOrder) {
    if (h >= dayStartHour && h <= dayEndHour && !busyHours.has(h)) {
      candidates.push(h);
      if (candidates.length >= neededSlotsCount) break;
    }
  }

  // If still need slots, search sequentially
  if (candidates.length < neededSlotsCount) {
    for (let h = dayStartHour; h <= dayEndHour; h++) {
      if (!busyHours.has(h) && !candidates.includes(h)) {
        candidates.push(h);
        if (candidates.length >= neededSlotsCount) break;
      }
    }
  }

  return candidates.sort((a, b) => a - b);
}
