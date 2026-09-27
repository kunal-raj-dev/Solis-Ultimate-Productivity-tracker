/**
 * Solis V2 Phase 1 — Canonical Schedule Model (C3).
 *
 * One typed schedule entity that every planning surface projects from.
 * `entryType` expresses the commitment contract:
 *   - `fixed`    : pinned to an external reality (exam, class, deadline) — the
 *                  planner may not move it without user approval
 *   - `flexible` : engine/user may propose re-placement (approve-diff applies)
 *   - `defended` : protected focus/rest time — collisions ask before overwriting
 *
 * `sourceKind`/`sourceId` provenance is the model's spine: entries are
 * write-through projections of real domain objects (tasks, plan items, review
 * blocks…), never independent copies that can silently diverge.
 */

export type ScheduleEntryType = 'fixed' | 'flexible' | 'defended';

export type ScheduleEntrySourceKind =
  | 'task'
  | 'study_plan_item'
  | 'time_block'
  | 'habit_window'
  | 'review'
  | 'rest'
  | 'buffer'
  | 'external_calendar'
  | 'manual';

export type ScheduleEntryStatus =
  | 'planned'
  | 'in_progress'
  | 'done'
  | 'partial'
  | 'missed'
  | 'cancelled';

export interface ScheduleEntry {
  id: string;
  entryType: ScheduleEntryType;
  sourceKind: ScheduleEntrySourceKind;
  /** Id of the owning domain object (task id, plan item id, …). */
  sourceId?: string;
  title: string;
  /** Local calendar date, YYYY-MM-DD. */
  date: string;
  /** Optional anchor time in hours (0–23, fractional minutes allowed). */
  startHour?: number;
  durationMinutes: number;
  status: ScheduleEntryStatus;
  actualMinutes: number;
  /** Source-specific receipt: task priority, plan subject, exam id, ICS uid… */
  provenance?: Record<string, unknown>;
  recurrenceRule?: Record<string, unknown> | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface ScheduleEntryRangeFilter {
  /** Inclusive YYYY-MM-DD. */
  from?: string;
  /** Inclusive YYYY-MM-DD. */
  to?: string;
}

/** Payload for the write-through adapter — the only way surfaces create entries. */
export interface ScheduleUpsertFromSource {
  sourceKind: ScheduleEntrySourceKind;
  sourceId: string;
  title: string;
  date: string;
  startHour?: number;
  durationMinutes: number;
  entryType: ScheduleEntryType;
  status?: ScheduleEntryStatus;
  actualMinutes?: number;
  provenance?: Record<string, unknown>;
  recurrenceRule?: Record<string, unknown> | null;
}
