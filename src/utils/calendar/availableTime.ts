/**
 * Solis - Available Time & Scheduling Mathematics
 * Part 3: Autonomous Connected OS & Conflict Resolution Engine
 */

import {
  ExternalCalendarEvent,
  AvailableTimeBlock,
  DailyAvailableTimeReport,
  CalendarConflictAlert
} from '../../types/calendar';
import { TaskTimeBlock } from '../../types/task';
import { TimeBlock } from '../../types/planning';
import { StudyPlanItem } from '../../types/study';

export type AnyTimeBlock = TaskTimeBlock | TimeBlock;

export interface CalculateAvailableTimeParams {
  date: string; // YYYY-MM-DD
  externalEvents: ExternalCalendarEvent[];
  solisBlocks?: AnyTimeBlock[];
  studyPlans?: StudyPlanItem[];
  dayStartHour?: number; // default 8 (08:00)
  dayEndHour?: number;   // default 22 (22:00)
}

export function timeStringToMinutes(timeStr: string): number {
  const [h, m] = timeStr.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
}

export function minutesToTimeString(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export function calculateAvailableTime({
  date,
  externalEvents,
  solisBlocks = [],
  studyPlans = [],
  dayStartHour = 8,
  dayEndHour = 22
}: CalculateAvailableTimeParams): DailyAvailableTimeReport {
  const dayStartMinutes = dayStartHour * 60;
  const dayEndMinutes = dayEndHour * 60;
  const totalWindowMinutes = Math.max(0, dayEndMinutes - dayStartMinutes);

  // Filter external events that occur on this date and are marked busy
  const dayEvents = externalEvents.filter((e) => {
    if (!e.isBusy) return false;
    const startIso = e.startTime.slice(0, 10);
    const endIso = e.endTime.slice(0, 10);
    return startIso === date || endIso === date;
  });

  // Normalize event time boundaries to minutes within day window
  const busyIntervals: Array<{ start: number; end: number; title: string }> = [];

  for (const ev of dayEvents) {
    const startDate = new Date(ev.startTime);
    const endDate = new Date(ev.endTime);

    let startMin = startDate.getHours() * 60 + startDate.getMinutes();
    let endMin = endDate.getHours() * 60 + endDate.getMinutes();

    if (ev.allDay) {
      startMin = dayStartMinutes;
      endMin = dayEndMinutes;
    }

    // Clamp to day window
    const clampedStart = Math.max(dayStartMinutes, Math.min(dayEndMinutes, startMin));
    const clampedEnd = Math.max(dayStartMinutes, Math.min(dayEndMinutes, endMin));

    if (clampedEnd > clampedStart) {
      busyIntervals.push({
        start: clampedStart,
        end: clampedEnd,
        title: ev.title
      });
    }
  }

  // Merge overlapping busy intervals
  busyIntervals.sort((a, b) => a.start - b.start);
  const mergedBusy: Array<{ start: number; end: number }> = [];

  for (const interval of busyIntervals) {
    if (mergedBusy.length === 0) {
      mergedBusy.push({ start: interval.start, end: interval.end });
    } else {
      const last = mergedBusy[mergedBusy.length - 1];
      if (interval.start <= last.end) {
        last.end = Math.max(last.end, interval.end);
      } else {
        mergedBusy.push({ start: interval.start, end: interval.end });
      }
    }
  }

  const externalCommitmentsMinutes = mergedBusy.reduce(
    (acc, curr) => acc + (curr.end - curr.start),
    0
  );

  // Compute Solis planned minutes
  let plannedSolisMinutes = 0;
  const solisIntervals: Array<{ start: number; end: number; id: string; title: string }> = [];

  for (const block of solisBlocks as AnyTimeBlock[]) {
    let s = -1;
    let e = -1;
    const title = ('taskTitle' in block ? block.taskTitle : (block as TimeBlock).title) || 'Planned Block';

    if ('startTime' in block && typeof (block as any).startTime === 'string') {
      s = timeStringToMinutes((block as any).startTime);
      if ('endTime' in block && typeof (block as any).endTime === 'string') {
        e = timeStringToMinutes((block as any).endTime);
      } else if (block.durationMinutes) {
        e = s + block.durationMinutes;
      }
    } else if ('startHour' in block && typeof (block as any).startHour === 'number') {
      s = (block as any).startHour * 60 + ((block as any).startMinute || 0);
      e = s + (block.durationMinutes || 60);
    }

    if (s >= 0 && e > s) {
      plannedSolisMinutes += (e - s);
      solisIntervals.push({ start: s, end: e, id: block.id, title });
    }
  }

  for (const plan of studyPlans) {
    if (plan.scheduledTime && plan.targetMinutes) {
      const s = timeStringToMinutes(plan.scheduledTime);
      const e = s + plan.targetMinutes;
      plannedSolisMinutes += plan.targetMinutes;
      solisIntervals.push({ start: s, end: e, id: plan.id, title: plan.title });
    }
  }

  // Detect Free Slots (gaps between merged external busy events)
  const availableSlots: AvailableTimeBlock[] = [];
  let currentPointer = dayStartMinutes;

  for (const busy of mergedBusy) {
    if (busy.start > currentPointer) {
      const freeDur = busy.start - currentPointer;
      availableSlots.push({
        startTime: minutesToTimeString(currentPointer),
        endTime: minutesToTimeString(busy.start),
        durationMinutes: freeDur,
        isOptimalForFocus: freeDur >= 45
      });
    }
    currentPointer = Math.max(currentPointer, busy.end);
  }

  if (currentPointer < dayEndMinutes) {
    const freeDur = dayEndMinutes - currentPointer;
    availableSlots.push({
      startTime: minutesToTimeString(currentPointer),
      endTime: minutesToTimeString(dayEndMinutes),
      durationMinutes: freeDur,
      isOptimalForFocus: freeDur >= 45
    });
  }

  // Detect Conflicts between planned Solis blocks and external busy events
  const conflicts: CalendarConflictAlert[] = [];

  for (const solis of solisIntervals) {
    for (const ext of busyIntervals) {
      // Overlap condition: start < ext.end && end > ext.start
      if (solis.start < ext.end && solis.end > ext.start) {
        const conflictId = `conflict_${solis.id}_${ext.start}`;
        
        // Find next open slot that can fit this solis block
        const requiredDuration = solis.end - solis.start;
        const proposedSlot = availableSlots.find((slot) => slot.durationMinutes >= requiredDuration);

        conflicts.push({
          id: conflictId,
          type: 'solis_vs_external',
          severity: 'high',
          title: `Conflict: "${solis.title}"`,
          description: `Planned study block overlaps with external commitment "${ext.title}".`,
          externalEventTitle: ext.title,
          externalStartTime: minutesToTimeString(ext.start),
          externalEndTime: minutesToTimeString(ext.end),
          solisPlanId: solis.id,
          solisPlanTitle: solis.title,
          suggestedAction: {
            type: proposedSlot ? 'move_slot' : 'replan_solis',
            label: proposedSlot
              ? `Shift to free window (${proposedSlot.startTime}–${proposedSlot.endTime})`
              : 'Replan study block for tomorrow',
            proposedStartTime: proposedSlot?.startTime,
            proposedEndTime: proposedSlot ? minutesToTimeString(timeStringToMinutes(proposedSlot.startTime) + requiredDuration) : undefined
          }
        });
      }
    }
  }

  const unallocatedFreeMinutes = Math.max(
    0,
    totalWindowMinutes - externalCommitmentsMinutes - plannedSolisMinutes
  );

  return {
    date,
    dayStartHour,
    dayEndHour,
    totalAvailableMinutes: totalWindowMinutes,
    externalCommitmentsMinutes,
    plannedSolisMinutes,
    unallocatedFreeMinutes,
    availableSlots,
    conflicts
  };
}
