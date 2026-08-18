/**
 * Solis - Deterministic Time Blocking & Schedule Engineering Engine
 * Manages chronological calendar blocks, conflict detection, and recurring study routines.
 */

import { TimeBlock, TimeBlockConflict, TimeAllocationStats, RecurringStudyRoutine, DayOfWeek } from '../../types/planning';
import { StudyPlanItem } from '../../types/study';
import { Task } from '../../types/task';
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

/**
 * Builds chronological time blocks for a given calendar date.
 */
export function buildTimeBlocks(params: {
  studyPlan: StudyPlanItem[];
  tasks: Task[];
  focusSessions: FocusSession[];
  routines?: RecurringStudyRoutine[];
  targetDate?: string;
}): TimeBlock[] {
  const dateStr = params.targetDate || getISODateString(new Date());
  const blocks: TimeBlock[] = [];

  // 1. Study Plan Items with scheduledTime
  params.studyPlan.forEach((plan) => {
    const itemDate = plan.scheduledDate || dateStr;
    if (itemDate === dateStr && plan.scheduledTime) {
      const startMins = parseTimeToMinutes(plan.scheduledTime);
      const endMins = startMins + (plan.targetMinutes || 45);

      blocks.push({
        id: `tb_plan_${plan.id}`,
        entityId: plan.id,
        type: 'study_plan',
        title: plan.title,
        startTime: minutesToTimeString(startMins),
        endTime: minutesToTimeString(endMins),
        durationMinutes: plan.targetMinutes || 45,
        date: dateStr,
        subjectId: plan.subjectId,
        subjectName: plan.subjectName,
        completed: plan.completed,
        priority: plan.priority
      });
    }
  });

  // 2. Focus Sessions recorded or active on this date
  params.focusSessions.forEach((session) => {
    if (session.createdAt && session.createdAt.startsWith(dateStr)) {
      const startDate = new Date(session.createdAt);
      const startMins = startDate.getHours() * 60 + startDate.getMinutes();
      const duration = session.durationMinutes || 25;

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

  // 3. Task deadlines due on this date with scheduled times
  params.tasks.forEach((task) => {
    if (task.dueDate === dateStr && task.dueTime) {
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

  // Sort blocks chronologically by start time
  return blocks.sort((a, b) => parseTimeToMinutes(a.startTime) - parseTimeToMinutes(b.startTime));
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
    if (block.type === 'study_plan') deepStudyMinutes += block.durationMinutes;
    else if (block.type === 'task_deadline') taskMinutes += block.durationMinutes;
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
  return routines.filter((r) => r.isActive && r.daysOfWeek.includes(dayOfWeek));
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
