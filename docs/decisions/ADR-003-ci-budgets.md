# ADR-003: CI quality budgets start at WARN for one baseline quarter

**Status:** Accepted (Phase 0)
**Date:** 2026-09-27
**Scope:** CI Lighthouse/axe gate (`.lighthouserc.json`, `ci.yml` lighthouse job)

## Context

The Phase-0 audit found that **no Lighthouse or axe run has ever been executed** for this
app, on desktop or mobile. Setting hard error-severity budgets before a single measurement
exists would either block CI on the first run or encode arbitrary numbers — both wrong.

## Decision

1. The Lighthouse CI job runs on every push with budgets set at **WARN severity**
   (script size ≤ 1,400 KB, total ≤ 2,400 KB, a11y ≥ 0.8, best-practices ≥ 0.8,
   CLS ≤ 0.25, LCP ≤ 6,000 ms) and `continue-on-error: true`.
2. The hard gate (`verify` job: typecheck + full test suite + production build) is
   **error-severity from day one** — tests already exist and are green.
3. After one baseline quarter (or after Phase-1 UI work stabilizes), the measured values
   become error-severity budgets and `continue-on-error` is removed. The known baseline to
   beat: `index` chunk 430.81 kB (gzip 119.82 kB).
4. Runtime mobile and accessibility audits (real devices) are Phase-0 audit deliverables —
   findings are logged in `docs/v2-research/p0-audit-findings.md`; the static portion is
   done, the on-device portion remains an open Phase-0/Phase-1 item tracked there.

## Consequences

- Every V2 phase inherits an enforceable budget once flipped to error severity.
- Budget regressions are visible in CI from day one (warn), not discovered at launch.
