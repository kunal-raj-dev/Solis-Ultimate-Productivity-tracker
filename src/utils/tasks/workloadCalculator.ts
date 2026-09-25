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
  } else if (totalPlannedMinutes <= dailyCapacityMinutes * 1.15) {
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
