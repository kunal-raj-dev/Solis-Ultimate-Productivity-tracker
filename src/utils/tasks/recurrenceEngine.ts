import { Task, TaskRecurrence } from '../../types/task';
import { getISODateString } from '../date';

/**
 * Calculates the next occurrence date string (YYYY-MM-DD) based on the recurrence rule.
 */
export function calculateNextOccurrenceDate(
  currentDateStr: string,
  recurrence: TaskRecurrence
): string | null {
  if (!currentDateStr || !recurrence) return null;

  // Safe parse YYYY-MM-DD
  const parts = currentDateStr.split('-');
  if (parts.length !== 3) return null;
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);

  const baseDate = new Date(year, month, day, 12, 0, 0, 0); // Noon to prevent DST drift

  let nextDate = new Date(baseDate);

  switch (recurrence.frequency) {
    case 'daily': {
      const interval = recurrence.interval && recurrence.interval > 0 ? recurrence.interval : 1;
      nextDate.setDate(baseDate.getDate() + interval);
      break;
    }

    case 'weekdays': {
      // Advance to next Monday-Friday
      nextDate.setDate(baseDate.getDate() + 1);
      const dayOfWeek = nextDate.getDay(); // 0 = Sun, 6 = Sat
      if (dayOfWeek === 6) {
        // Saturday -> advance 2 days to Monday
        nextDate.setDate(nextDate.getDate() + 2);
      } else if (dayOfWeek === 0) {
        // Sunday -> advance 1 day to Monday
        nextDate.setDate(nextDate.getDate() + 1);
      }
      break;
    }

    case 'weekly': {
      if (recurrence.daysOfWeek && recurrence.daysOfWeek.length > 0) {
        const sortedDays = [...new Set(recurrence.daysOfWeek)].sort((a, b) => a - b);
        const currentDayOfWeek = baseDate.getDay();
        const nextDayInWeek = sortedDays.find((d) => d > currentDayOfWeek);
        if (nextDayInWeek !== undefined) {
          const diff = nextDayInWeek - currentDayOfWeek;
          nextDate.setDate(baseDate.getDate() + diff);
        } else {
          const interval = recurrence.interval && recurrence.interval > 0 ? recurrence.interval : 1;
          const firstDay = sortedDays[0];
          const daysUntilEndOfWeek = 7 - currentDayOfWeek;
          const daysToFirstDay = daysUntilEndOfWeek + firstDay + (interval - 1) * 7;
          nextDate.setDate(baseDate.getDate() + daysToFirstDay);
        }
      } else {
        const interval = recurrence.interval && recurrence.interval > 0 ? recurrence.interval : 1;
        nextDate.setDate(baseDate.getDate() + (7 * interval));
      }
      break;
    }

    case 'custom': {
      const interval = recurrence.interval && recurrence.interval > 0 ? recurrence.interval : 1;
      nextDate.setDate(baseDate.getDate() + interval);
      break;
    }

    default:
      nextDate.setDate(baseDate.getDate() + 1);
  }

  const nextDateStr = getISODateString(nextDate);

  // If recurrence has an end date, verify threshold
  if (recurrence.endDate && nextDateStr > recurrence.endDate) {
    return null; // Recurrence series has finished
  }

  return nextDateStr;
}

/**
 * Backward compatibility alias for calculateNextOccurrenceDate.
 */
export const calculateNextDueDate = calculateNextOccurrenceDate;

/**
 * Determines whether a recurring series should spawn another occurrence.
 */
export function shouldSpawnNextOccurrence(recurrence?: TaskRecurrence | null): boolean {
  if (!recurrence) return false;

  if (
    typeof recurrence.maxOccurrences === 'number' &&
    typeof recurrence.occurrenceCount === 'number' &&
    recurrence.occurrenceCount >= recurrence.maxOccurrences
  ) {
    return false;
  }

  return true;
}

/**
 * Creates the next occurrence payload when a recurring task is completed.
 */
export function spawnNextRecurringOccurrence(task: Task): Partial<Task> | null {
  if (!task.recurrence || !shouldSpawnNextOccurrence(task.recurrence)) return null;

  const currentDueDate = task.dueDate || getISODateString(new Date());
  const nextDueDate = calculateNextOccurrenceDate(currentDueDate, task.recurrence);

  if (!nextDueDate) return null;

  const currentCount = task.recurrence.occurrenceCount || 1;
  const nextCount = currentCount + 1;

  if (
    typeof task.recurrence.maxOccurrences === 'number' &&
    nextCount > task.recurrence.maxOccurrences
  ) {
    return null;
  }

  const resetSubtasks = (task.subTasks || []).map((st) => ({
    ...st,
    id: `st_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    completed: false,
    createdAt: new Date().toISOString()
  }));

  return {
    title: task.title,
    description: task.description,
    status: 'todo',
    priority: task.priority,
    category: task.category,
    dueDate: nextDueDate,
    dueTime: task.dueTime,
    estimatedMinutes: task.estimatedMinutes,
    completedMinutes: 0,
    subjectId: task.subjectId,
    goalId: task.goalId,
    planItemId: task.planItemId,
    tags: [...task.tags],
    subTasks: resetSubtasks,
    isRecurring: true,
    recurrence: {
      ...task.recurrence,
      occurrenceCount: nextCount,
      parentTaskId: task.recurrence.parentTaskId || task.id
    }
  };
}
