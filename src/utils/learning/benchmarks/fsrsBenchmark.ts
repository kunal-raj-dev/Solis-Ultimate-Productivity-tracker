/**
 * FSRS-6 vs FSRS-5 benchmark harness — SKELETON (ADR-002, Phase 0 kickoff).
 *
 * Phase 3 (P3-06) fills in the two scheduler adapters and runs this against an
 * anonymized export of real review histories. The protocol, metrics and
 * verdict contract are fixed here so the evaluation cannot drift:
 *
 *   Input   : replay-log of per-card review events ( chronologically ordered),
 *             each with the observed recall outcome at the next review.
 *   Method  : replay every card through both schedulers; at each step compare
 *             predicted retrievability against the observed recall.
 *   Metrics : log-loss, RMSE of retrievability, projected reviews needed per
 *             retained point over a 30-day horizon.
 *   Verdict : FSRS-6 ships behind a flag ONLY if it beats FSRS-5 on log-loss
 *             without increasing review load; otherwise the decline is
 *             documented in docs/decisions/ADR-002-fsrs6-evaluation.md.
 *
 * NOTE: this file intentionally contains NO scheduling logic. The adapters are
 * implemented in Phase 3 against the existing engine interface; importing the
 * real engine here before that would hard-wire the comparison before the
 * migration design exists.
 */

export interface BenchmarkReviewEvent {
  /** ISO timestamp of the review. */
  at: string;
  /** Card identifier (anonymized; only grouping matters). */
  cardId: string;
  /** Observed outcome: the learner recalled the card or did not. */
  recalled: boolean;
  /** Anonymized workload hint, e.g. subject bucket — never user-identifying. */
  subjectBucket?: string;
}

export interface SchedulerVerdict {
  /** Which scheduler produced this verdict ('fsrs5' | 'fsrs6'). */
  scheduler: 'fsrs5' | 'fsrs6';
  /** Mean log-loss of predicted retrievability vs observed recall (lower is better). */
  logLoss: number;
  /** RMSE of retrievability predictions (lower is better). */
  rmse: number;
  /** Projected review count per retained point over a 30-day horizon (lower is better). */
  reviewsPerRetainedPoint: number;
  /** Count of cards that could be replayed (cards with insufficient history are skipped). */
  cardsEvaluated: number;
}

export interface BenchmarkResult {
  ran: boolean;
  verdicts: SchedulerVerdict[];
  /** The decision the protocol forces, given the verdicts. */
  decision: 'fsrs6_ships_behind_flag' | 'declined' | 'not_run';
  notes: string;
}

export function runBenchmarkNotYetRun(): BenchmarkResult {
  return {
    ran: false,
    verdicts: [],
    decision: 'not_run',
    notes:
      'Skeleton only (Phase 0). Phase 3 P3-06 implements the fsrs5/fsrs6 adapter ' +
      'replay over an anonymized review-log export and records the verdict in ' +
      'docs/decisions/ADR-002-fsrs6-evaluation.md.'
  };
}

/**
 * Protocol math shared by both adapters (implemented in Phase 3): log-loss of
 * predicted retrievability p against observed outcome y ∈ {0,1}.
 * Exported so the Phase-3 adapters cannot redefine the metric.
 */
export function logLoss(predicted: number, observed: boolean): number {
  const p = Math.min(1 - 1e-6, Math.max(1e-6, predicted));
  return observed ? -Math.log(p) : -Math.log(1 - p);
}
