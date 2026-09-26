/**
 * Task Micro-Stepping Assistant (plan §5.4, audit item #54)
 *
 * Deterministically decomposes a large task (estimated ≥ 60 minutes) into
 * exactly 3 low-activation micro-steps, each suggesting fewer than 20 minutes
 * of effort. Pure functions only — no React state, no DOM/network side effects
 * (master.md §18 Architectural Boundaries).
 */

export const MICRO_STEP_MIN_MINUTES = 5;

/** Hard ceiling so every suggested micro-step stays under 20 minutes. */
export const MICRO_STEP_MAX_MINUTES = 18;

/** The plan fixes the decomposition at exactly 3 micro-steps. */
export const MICRO_STEP_COUNT = 3;

/** Tasks estimated at 60+ minutes are eligible for micro-stepping. */
export const MICRO_STEP_ELIGIBILITY_MINUTES = 60;

export interface MicroStep {
  title: string;
  /** Suggested effort budget in minutes — always < 20. */
  suggestedMinutes: number;
}

export function isMicroStepEligible(estimatedMinutes?: number): boolean {
  return (
    typeof estimatedMinutes === 'number' &&
    Number.isFinite(estimatedMinutes) &&
    estimatedMinutes >= MICRO_STEP_ELIGIBILITY_MINUTES
  );
}

function truncateTitle(title: string, maxLength = 40): string {
  const trimmed = title.trim();
  if (trimmed.length <= maxLength) return trimmed;
  return `${trimmed.slice(0, maxLength - 1).trimEnd()}…`;
}

/**
 * Builds the 3 deterministic micro-steps for an eligible task.
 * Returns an empty array for tasks below the 60-minute eligibility bar.
 */
export function buildMicroSteps(taskTitle: string, estimatedMinutes?: number): MicroStep[] {
  if (!isMicroStepEligible(estimatedMinutes)) return [];

  // Even three-way split, clamped so every suggested step stays under 20m
  // (e.g. 60m → 18m, 90m → 18m, 240m → 18m per step; the steps are gentle
  // entry points, not a full schedule for the task).
  const evenSplit = Math.floor(estimatedMinutes! / MICRO_STEP_COUNT);
  const budget = Math.max(
    MICRO_STEP_MIN_MINUTES,
    Math.min(MICRO_STEP_MAX_MINUTES, evenSplit)
  );

  const label = truncateTitle(taskTitle);

  return [
    {
      title: `Warm-up: open "${label}" and take the first small step`,
      suggestedMinutes: Math.max(MICRO_STEP_MIN_MINUTES, Math.min(10, budget))
    },
    {
      title: `Core push: continue "${label}" in one focused sprint`,
      suggestedMinutes: budget
    },
    {
      title: `Wrap-up: review "${label}" and note the next action`,
      suggestedMinutes: Math.max(MICRO_STEP_MIN_MINUTES, Math.min(15, budget))
    }
  ];
}
