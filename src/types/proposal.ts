/**
 * Solis V2 Phase 1 — Proposal / approve-diff object layer (C5 backbone).
 *
 * Every engine- or AI-proposed change to the user's plan lands here as one
 * decision object with an evidence receipt. The invariant is "AI proposes,
 * user disposes": nothing in Solis silently edits the plan. Proposals are the
 * only sanctioned write path for generated changes, and the triage inbox is
 * their single surface.
 *
 * `dedupeKey` prevents insight spam: creating a proposal whose dedupeKey
 * matches an existing OPEN proposal returns that proposal instead of a
 * duplicate (analytics write-back can fire on every load without flooding
 * the inbox).
 */

export type ProposalKind =
  | 'insight_action'
  | 'reflow'
  | 'placement'
  | 'break'
  | 'plan_draft'
  | 'review_diff'
  | 'collision_tradeoff'
  | 'woop_fallback';

export type ProposalSource = 'engine' | 'ai';

export type ProposalStatus = 'open' | 'approved' | 'dismissed' | 'expired';

export interface Proposal {
  id: string;
  kind: ProposalKind;
  source: ProposalSource;
  title: string;
  /** Evidence receipt: the computed numbers or data that produced this proposal. */
  evidence?: string;
  /** Typed payload the approver acts on (action route, placement, reflow plan…). */
  diff?: Record<string, unknown>;
  status: ProposalStatus;
  /** Stable identity for open-proposal deduplication (e.g. "insight:rec-retention-42"). */
  dedupeKey?: string;
  createdAt: string;
  decidedAt: string | null;
}

export interface ProposalInsightActionDiff {
  /** Route the approve action navigates to, e.g. '/app/focus?subjectId=…'. */
  actionUrl?: string;
  /** Label shown on the approve button. */
  actionLabel?: string;
}
