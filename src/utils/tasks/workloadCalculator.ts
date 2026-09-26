import { Task, TaskTimeBlock, WorkloadSummary, WorkloadState } from '../../types/task';
import { getISODateString } from '../date';

export interface WorkloadCalculatorOptions {
  date?: string;
  tasks: Task[];
  timeBlocks: TaskTimeBlock[];
  dailyCapacityMinutes?: number; // e.g. 360m (6 hours)
}

export const DEFAULT_DAILY_CAPACITY_MINUTES = 360; // Standard 6.0-hour deep work capacity ceiling

export function getDefaultDailyCapacityMinutes(): number {
  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem('solis_user_preferences');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (typeof parsed.dailyGoalMinutes === 'number' && parsed.dailyGoalMinutes > 0) {
          return parsed.dailyGoalMinutes;
        }
        if (typeof parsed.dailyStudyGoalMinutes === 'number' && parsed.dailyStudyGoalMinutes > 0) {
          return parsed.dailyStudyGoalMinutes;
        }
      }
    } catch {
      // Ignore storage errors
    }
  }
  return DEFAULT_DAILY_CAPACITY_MINUTES;
}

/**
 * Plan §3.4 "Gentle Start": when the user re-enters after an absence and
 * chooses the gentle option, that DAY's capacity is 50% of the daily goal
 * (still derived from the single capacity constant). Resolved from the
 * day-scoped welcome-back choice key so every page's capacity bar
 * (Today, Tasks > Schedule) shows the same number.
 *
 * Returns undefined when the gentle override is not active for the date.
 */
export function getGentleStartDailyCapacityMinutes(date: string): number | undefined {
  if (typeof window === 'undefined') return undefined;
  try {
    if (localStorage.getItem(`solis_welcome_back_choice_${date}`) === 'gentle_start') {
      return Math.round(getDefaultDailyCapacityMinutes() * 0.5);
    }
  } catch {
    // storage unavailable — full capacity applies
  }
  return undefined;
}

/**
 * Evaluates daily workload vs available focused capacity.
 * Detects overcommitment calmly with actionable adjustment suggestions.
 */
export function calculateWorkload({
  date = getISODateString(new Date()),
  tasks,
  timeBlocks,
  dailyCapacityMinutes = getDefaultDailyCapacityMinutes()
}: WorkloadCalculatorOptions): WorkloadSummary {
  // 1. Time blocks scheduled for this date
  const dayBlocks = timeBlocks.filter(
    (b) => b.date === date && b.status !== 'completed'
  );
  const plannedBlocksMinutes = dayBlocks.reduce(
    (sum, b) => sum + (b.durationMinutes || 60),
    0
  );

  // Set of task IDs already scheduled in time blocks
  const scheduledTaskIds = new Set(
    dayBlocks.map((b) => b.taskId).filter(Boolean) as string[]
  );

  // 2. Active tasks due on this date that are NOT already in a time block
  const dayTasks = tasks.filter((t) => {
    if (t.status === 'completed' || t.status === 'archived') return false;
    return t.dueDate === date;
  });

  const unblockedTasks = dayTasks.filter((t) => !scheduledTaskIds.has(t.id));
  const plannedTasksMinutes = unblockedTasks.reduce(
    (sum, t) => sum + (t.estimatedMinutes || 30),
    0
  );

  // Total planned work for this day without double-counting
  const totalPlannedMinutes = plannedBlocksMinutes + plannedTasksMinutes;
  const remainingCapacityMinutes = Math.max(0, dailyCapacityMinutes - totalPlannedMinutes);
  const overcommittedMinutes = Math.max(0, totalPlannedMinutes - dailyCapacityMinutes);

  let state: WorkloadState = 'optimal';
  if (totalPlannedMinutes <= dailyCapacityMinutes * 0.5) {
    state = 'light';
  } else if (totalPlannedMinutes <= dailyCapacityMinutes) {
    state = 'optimal';
  } else if (totalPlannedMinutes * 100 <= dailyCapacityMinutes * 115) {
    // Integer-scaled comparison: 1.15 is not exact in binary floating point
    // (360 * 1.15 === 413.99999999999994), which mislabelled a day planned at
    // exactly the 115% buffer boundary as 'overcommitted' instead of 'heavy'.
    state = 'heavy';
  } else {
    state = 'overcommitted';
  }

  // 3. Reschedule candidates: lowest priority unblocked tasks first
  const priorityRank: Record<string, number> = {
    low: 1,
    medium: 2,
    high: 3,
    urgent: 4
  };

  const rescheduleCandidates = [...unblockedTasks].sort((a, b) => {
    return (priorityRank[a.priority] || 2) - (priorityRank[b.priority] || 2);
  });

  return {
    plannedTasksMinutes,
    plannedBlocksMinutes,
    totalPlannedMinutes,
    dailyCapacityMinutes,
    remainingCapacityMinutes,
    overcommittedMinutes,
    state,
    rescheduleCandidates
  };
}

/**
 * Human-readable friendly duration formatter (e.g. 7h 20m or 45m).
 */
export function formatMinutesFriendly(minutes: number): string {
  if (minutes <= 0) return '0m';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}
