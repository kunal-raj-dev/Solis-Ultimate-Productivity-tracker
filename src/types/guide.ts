/**
 * Solis Guide Center V2 — Type Definitions
 *
 * Supports step-by-step learning, typed product actions,
 * auto-completion verification, Quick/Deep mode, and resume state.
 */

export type GuideCategory = 'start' | 'plan' | 'focus' | 'learn' | 'grow' | 'customize';

/**
 * Typed, declarative guide actions.
 * Guide content should remain declarative — no arbitrary JS in guide data.
 */
export type GuideActionType =
  | 'navigate'
  | 'open-modal'
  | 'open-focus'
  | 'open-study'
  | 'open-task-creator'
  | 'open-note-creator';

/**
 * Per-step call-to-action.
 * Each step may optionally link to a real product action.
 */
export interface GuideStepAction {
  label: string;
  type: GuideActionType;
  targetPath?: string;
  iconName?: string;
}

/**
 * A single instructional step within a guide.
 *
 * Steps with `completionCheck` are auto-verified from real application state.
 * Steps without it use manual "Mark as understood" acknowledgment.
 */
export interface GuideStep {
  stepNumber: number;
  title: string;
  description: string;
  why?: string;
  tip?: string;
  action?: GuideStepAction;
  /**
   * Key used to check completion against real app state.
   * e.g., 'has-subject', 'has-task', 'has-focus-session'.
   * When present, the step shows "✓ Completed automatically".
   * When absent, the step shows "○ Mark as understood".
   */
  completionCheck?: string;
}

/**
 * Guide-level call-to-action (shown at footer of guide).
 */
export interface GuideAction {
  label: string;
  targetPath: string;
  type?: GuideActionType;
  iconName?: string;
}

/**
 * Describes where this guide's feature fits in the Solis system architecture.
 */
export interface GuideConnection {
  upstream?: string;
  current: string;
  downstream?: string;
  explanation: string;
}

/**
 * Optional deep-mode content for advanced users.
 */
export interface GuideDeepContent {
  advancedTips?: string[];
  advancedSteps?: GuideStep[];
  relatedConcepts?: string[];
}

/**
 * Top-level Guide entity.
 * Each guide represents a single learning unit in the Guide Center.
 */
export interface Guide {
  id: string;
  title: string;
  category: GuideCategory;
  summary: string;
  estimatedMinutes?: number;
  whenToUse: string;
  steps: GuideStep[];
  connection: GuideConnection;
  commonMistakes?: string[];
  tips?: string[];
  action?: GuideAction;
  keywords?: string[];
  relatedGuides?: string[];
  deepContent?: GuideDeepContent;
}

/**
 * Session-scoped guide progress state.
 * Serializable (no Set/Map) for sessionStorage persistence.
 */
export interface GuideSessionState {
  guideId: string;
  currentStep: number;
  completedSteps: number[];
  isDeepMode: boolean;
}

/**
 * All guide session states keyed by guide ID.
 */
export type GuideSessionMap = Record<string, GuideSessionState>;
