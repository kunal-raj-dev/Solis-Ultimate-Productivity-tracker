# ADR-002: FSRS-6 upgrade — evaluate on our own logs, ship only if it wins

**Status:** Accepted (Phase 0 decision — evaluation kickoff; implementation decision deferred to the benchmark)
**Date:** 2026-09-27
**Scope:** V2 Phase 3, capability C24

## Context

V1's spaced-repetition backbone is FSRS-5 + SM-2 (`src/utils/learning/spacedRepetition.ts`)
under a stable interface, with 1,100+ tests around the engine layer. FSRS-6 is a published
scheduler improvement, but adopting it because it is newer violates the evidence-first rule
(rule 14: fix foundations; and the research's own bar: no upgrade without measurement).

## Decision

1. **Evaluate, do not assume.** Phase 0 ships a benchmark harness skeleton; Phase 3 (P3-06)
   runs the benchmark **on V1's own review logs** (exported, anonymized) comparing:
   - logged recall predictions vs actual outcomes (log-loss / RMSE of retrievability),
   - resulting review-load per unit of retention (workload cost),
   - migration fidelity (same input states → sane new states; no scheduling explosion).
2. **Ship only if it wins.** If FSRS-6 beats FSRS-5 on the above for this workload, upgrade
   **behind a feature flag** with a state-preserving migration (card states transform, they
   do not reset). If it does not, record the numbers here and stay on FSRS-5. Both outcomes
   are acceptable; the decline must be documented with data.
3. **The interface does not change.** Consumers (review surfaces, exam cram, retention
   engines) keep calling the same functions; the swap is engine-internal.

## Benchmark protocol (skeleton at `src/utils/learning/benchmarks/fsrsBenchmark.ts`)

- Input: anonymized export of `review_logs` / card review histories from a real account
  (user-initiated, manual, never automatic).
- Method: replay each card's review history through both schedulers; at each step compare
  predicted retrievability with the observed recall at the next review.
- Metrics: log-loss, RMSE, projected reviews-per-retention-point over a 30-day horizon.
- Verdict recorded in this file as an addendum when run.

## Consequences

- P0-13 creates the harness skeleton now so Phase 3 needs only data + run.
- No scheduling behavior changes in Phase 0.
