/**
 * Solis - Deterministic Time Blocking & Schedule Engineering Engine
 * Manages chronological calendar blocks, conflict detection, and recurring study routines.
 */

import { TimeBlock, TimeBlockConflict, TimeAllocationStats, RecurringStudyRoutine, DayOfWeek } from '../../types/planning';
import { StudyPlanItem } from '../../types/study';
import { Task, TaskTimeBlock } from '../../types/task';
import { FocusSession } from '../../types/focus';
import { getISODateString } from '../date';

/**
 * Converts "HH:MM" (24h or 12h AM/PM) into minutes from midnight (0..1439).
 */
export function parseTimeToMinutes(timeStr: string): number {
  if (!timeStr) return 0;
  const clean = timeStr.trim().toLowerCase();

  // Check 12h format e.g. "02:00 pm", "9:30 am"
  const isPM = clean.includes('pm');
  const isAM = clean.includes('am');

  const digits = clean.replace(/[^\d:]/g, '');
  const parts = digits.split(':');
  let hours = parseInt(parts[0] || '0', 10);
  const minutes = parseInt(parts[1] || '0', 10);

  if (isPM && hours < 12) hours += 12;
  if (isAM && hours === 12) hours = 0;

  return Math.max(0, Math.min(1439, hours * 60 + minutes));
}

/**
 * Converts minutes from midnight (0..1439) to "HH:MM" 24h format.
 */
export function minutesToTimeString(totalMinutes: number): string {
  const clamped = Math.max(0, Math.min(1439, totalMinutes));
  const hours = Math.floor(clamped / 60);
  const minutes = clamped % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

export interface SynthesizeTimelineParams {
  studyPlan?: StudyPlanItem[];
  tasks?: Task[];
  focusSessions?: FocusSession[];
  routines?: RecurringStudyRoutine[];
  taskTimeBlocks?: TaskTimeBlock[];
  targetDate?: string;
}

/**
 * Synthesizes a unified daily schedule by combining TaskTimeBlocks, StudyPlanItems,
 * RecurringStudyRoutines, completed FocusSessions, and scheduled Tasks into one
 * chronological timeline without duplicate silos.
 */
export function synthesizeDailyTimeline(params: SynthesizeTimelineParams): TimeBlock[] {
  const dateStr = params.targetDate || getISODateString(new Date());
  const blocks: TimeBlock[] = [];
  const scheduledTaskIds = new Set<string>();

  // 1. TaskTimeBlocks (Hourly planned blocks from Tasks & Schedule)
  if (params.taskTimeBlocks && params.taskTimeBlocks.length > 0) {
    params.taskTimeBlocks.forEach((tb) => {
      if (tb.date === dateStr) {
        if (tb.taskId) scheduledTaskIds.add(tb.taskId);
        const startMins = tb.startHour * 60 + (tb.startMinute || 0);
        const duration = tb.durationMinutes || 60;
        const endMins = startMins + duration;

        blocks.push({
          id: `tb_taskblock_${tb.id}`,
          entityId: tb.id,
          type: 'task_block',
          title: tb.taskTitle,
          startTime: minutesToTimeString(startMins),
          endTime: minutesToTimeString(endMins),
          durationMinutes: duration,
          date: dateStr,
          subjectId: tb.subjectId,
          completed: tb.status === 'completed',
          priority: tb.priority
        });
      }
    });
  }

  // 2. Study Plan Items with scheduledTime for this date
  if (params.studyPlan && params.studyPlan.length > 0) {
    params.studyPlan.forEach((plan) => {
      const itemDate = plan.scheduledDate || dateStr;
      const timeStr = plan.scheduledTime || (plan as any).startTime;
      if (itemDate === dateStr && timeStr) {
        const startMins = parseTimeToMinutes(timeStr);
        const duration = plan.targetMinutes || (plan as any).plannedMinutes || 45;
        const endMins = startMins + duration;

        blocks.push({
          id: `tb_plan_${plan.id}`,
          entityId: plan.id,
          type: 'study_plan',
          title: plan.title,
          startTime: minutesToTimeString(startMins),
          endTime: minutesToTimeString(endMins),
          durationMinutes: duration,
          date: dateStr,
          subjectId: plan.subjectId,
          subjectName: plan.subjectName,
          completed: plan.completed,
          priority: plan.priority
        });
      }
    });
  }

  // 3. Recurring Study Routines active for this date
  if (params.routines && params.routines.length > 0) {
    const targetDateObj = new Date(`${dateStr}T12:00:00`);
    const activeRoutines = evaluateRoutinesForDate(
      params.routines,
      isNaN(targetDateObj.getTime()) ? new Date() : targetDateObj
    );

    activeRoutines.forEach((routine) => {
      const routineTime = routine.scheduledTime || (routine as any).startTime;
      if (routineTime) {
        const startMins = parseTimeToMinutes(routineTime);
        const duration = routine.targetMinutes || (routine as any).durationMinutes || 45;
        const endMins = startMins + duration;
        const startStr = minutesToTimeString(startMins);

        // Deduplicate if study plan item for this subject and start time already exists
        const alreadyPresent = blocks.some(
          (b) => b.type === 'study_plan' && b.subjectId === routine.subjectId && b.startTime === startStr
        );

        if (!alreadyPresent) {
          blocks.push({
            id: `tb_routine_${routine.id}`,
            entityId: routine.id,
            type: 'routine',
            title: routine.title,
            startTime: startStr,
            endTime: minutesToTimeString(endMins),
            durationMinutes: duration,
            date: dateStr,
            subjectId: routine.subjectId,
            subjectName: routine.subjectName,
            completed: false,
            priority: routine.priority
          });
        }
      }
    });
  }

  // 4. Focus Sessions recorded or active on this date
  if (params.focusSessions && params.focusSessions.length > 0) {
    params.focusSessions.forEach((session) => {
      const matchDate = (session as any).date === dateStr || (session.createdAt && session.createdAt.startsWith(dateStr));
      if (matchDate) {
        const duration = session.durationMinutes || 25;
        let startMins: number;
        if ((session as any).startTime) {
          startMins = parseTimeToMinutes((session as any).startTime);
        } else if (session.createdAt) {
          const startDate = new Date(session.createdAt);
          startMins = startDate.getHours() * 60 + startDate.getMinutes();
        } else {
          startMins = 9 * 60; // 09:00 fallback
        }

        blocks.push({
          id: `tb_focus_${session.id}`,
          entityId: session.id,
          type: 'focus_session',
          title: session.title || 'Deep Focus Session',
          startTime: minutesToTimeString(startMins),
          endTime: minutesToTimeString(startMins + duration),
          durationMinutes: duration,
          date: dateStr,
          subjectId: session.subjectId,
          subjectName: session.subjectName,
          completed: session.completed
        });
      }
    });
  }

  // 5. Tasks due on this date with scheduled dueTime (skipping tasks already in TaskTimeBlocks)
  if (params.tasks && params.tasks.length > 0) {
    params.tasks.forEach((task) => {
      if (task.dueDate === dateStr && task.dueTime && !scheduledTaskIds.has(task.id)) {
        const dueMins = parseTimeToMinutes(task.dueTime);
        const estimatedMins = task.estimatedMinutes || 30;
        const startMins = Math.max(0, dueMins - estimatedMins);

        blocks.push({
          id: `tb_task_${task.id}`,
          entityId: task.id,
          type: 'task_deadline',
          title: task.title,
          startTime: minutesToTimeString(startMins),
          endTime: minutesToTimeString(dueMins),
          durationMinutes: estimatedMins,
          date: dateStr,
          subjectId: task.subjectId,
          completed: task.status === 'completed',
          priority: task.priority
        });
      }
    });
  }

  // Sort blocks chronologically by start time
  return blocks.sort((a, b) => parseTimeToMinutes(a.startTime) - parseTimeToMinutes(b.startTime));
}

/**
 * Builds chronological time blocks for a given calendar date (alias for synthesizeDailyTimeline).
 */
export function buildTimeBlocks(params: SynthesizeTimelineParams): TimeBlock[] {
  return synthesizeDailyTimeline(params);
}

/**
 * Detects overlapping time block conflicts.
 */
export function findTimeBlockConflicts(blocks: TimeBlock[]): TimeBlockConflict[] {
  const conflicts: TimeBlockConflict[] = [];

  for (let i = 0; i < blocks.length; i++) {
    for (let j = i + 1; j < blocks.length; j++) {
      const a = blocks[i];
      const b = blocks[j];

      const aStart = parseTimeToMinutes(a.startTime);
      const aEnd = parseTimeToMinutes(a.endTime);
      const bStart = parseTimeToMinutes(b.startTime);
      const bEnd = parseTimeToMinutes(b.endTime);

      // Check overlap condition: (StartA < EndB) and (EndA > StartB)
      if (aStart < bEnd && aEnd > bStart) {
        const overlapStart = Math.max(aStart, bStart);
        const overlapEnd = Math.min(aEnd, bEnd);
        const overlapMinutes = Math.max(0, overlapEnd - overlapStart);

        if (overlapMinutes > 0) {
          conflicts.push({
            blockA: a,
            blockB: b,
            overlapMinutes
          });
        }
      }
    }
  }

  return conflicts;
}

/**
 * Calculates aggregate time allocation statistics across time blocks.
 */
export function calculateTimeAllocation(blocks: TimeBlock[]): TimeAllocationStats {
  let deepStudyMinutes = 0;
  let taskMinutes = 0;
  let focusMinutes = 0;

  blocks.forEach((block) => {
    if (block.type === 'study_plan' || block.type === 'routine') deepStudyMinutes += block.durationMinutes;
    else if (block.type === 'task_deadline' || block.type === 'task_block') taskMinutes += block.durationMinutes;
    else if (block.type === 'focus_session') focusMinutes += block.durationMinutes;
  });

  const conflicts = findTimeBlockConflicts(blocks);

  return {
    totalPlannedMinutes: deepStudyMinutes + taskMinutes,
    deepStudyMinutes,
    taskMinutes,
    focusMinutes,
    conflictCount: conflicts.length
  };
}

/**
 * Evaluates which recurring routines apply to a specific date.
 */
export function evaluateRoutinesForDate(
  routines: RecurringStudyRoutine[],
  date: Date = new Date()
): RecurringStudyRoutine[] {
  const dayOfWeek = date.getDay() as DayOfWeek;
  return routines.filter((r) => {
    if (r.isActive === false) return false;
    if (Array.isArray(r.daysOfWeek)) {
      return r.daysOfWeek.includes(dayOfWeek);
    }
    if ((r as any).dayOfWeek !== undefined) {
      return (r as any).dayOfWeek === dayOfWeek;
    }
    return true;
  });
}

/**
 * Formats minutes into human-readable hours & minutes string (e.g. "1h 45m").
 */
export function formatTimeBlockDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hrs}h ${mins}m` : `${hrs}h`;
}
