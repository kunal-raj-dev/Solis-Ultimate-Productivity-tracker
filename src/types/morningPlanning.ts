/**
 * Solis — Guided Morning Planning Ritual Types (F-201)
 */

export type MorningPlanningStep =
  | 'triage'
  | 'commit_big_three'
  | 'timeblock'
  | 'complete';

export type TaskTriageAction = 'today' | 'tomorrow' | 'someday';

export interface MorningCalibrationRecord {
  id: string;
  date: string; // YYYY-MM-DD
  completedAt: string;
  triageDecisions: Record<string, TaskTriageAction>; // taskId -> action
  big3TaskIds: string[];
  plannedFocusMinutes: number;
  dailyCapacityMinutes: number;
  isOvercommitted: boolean;
  intentionText?: string;
  autoScheduledBlockCount: number;
}
