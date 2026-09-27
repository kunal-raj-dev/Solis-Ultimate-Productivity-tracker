# Phase 0 — Mobile & Accessibility Audit Findings

**Date:** 2026-09-27 · **Task IDs:** P0-11 (mobile runtime audit), P0-12 (a11y audit) of `docs/Solis_V2_Implementation_Plan.md`
**Method, stated honestly:** this document records the **static analysis pass** — grep-level inspection of all source plus the `index.html` shell. **The on-device runtime audit (real phones, Lighthouse mobile runs, screen-reader passes) is still open** and remains a tracked Phase-0/Phase-1 exit item; it requires devices and a deployed preview. Per ADR-003, the CI Lighthouse/axe job now runs on every push (warn severity) so regressions become visible from day one.

---

## A. Accessibility — static findings

**Baseline counts (all `src/features/**/*.tsx`, 51 files):** `aria-label` present in 28/51 files (55%) · 398 `onClick` handlers · 2 raw `<div onClick>` without `role`/`tabIndex` nearby at the div level · 5 `<img>` elements, **4 without `alt`** (dynamic-image components; see F1).

| # | Severity | Finding | Evidence | Action owner |
|---|---|---|---|---|
| A1 | **High** | `index.html` viewport sets `maximum-scale=5.0`, which **caps pinch-zoom** — a WCAG 1.4.4 (Resize Text) failure pattern on mobile | `index.html:6` | P1 UI work: drop `maximum-scale` (keep `viewport-fit=cover`) |
| A2 | **High** | 4 `<img>` elements without `alt` (some render user flashcard images — meaningful content, not decorative) | `ScholarReportModal.tsx:174`, `ImageOcclusionDrawer.tsx:205`, `FlashcardReviewModal.tsx:409,466` | Fix with card-front alt text in Phase-2 review-surface work |
| A3 | Medium | `aria-label` coverage is 55% of feature files; the ~23 files with interactive custom controls need a keyboard-operability check — static grep cannot verify focus order or Enter/Space handling | This audit; full list reproducible via the greps in the run log | Per-page when extracted (RTL tests assert keyboard operability) |
| A4 | Medium | No axe/Lighthouse numbers existed at all before Phase 0 — now running in CI at warn severity; first real scores pending the first CI run on a deployed-style build | `.lighthouserc.json`, `.github/workflows/ci.yml` | Flip to error budgets after baseline quarter (ADR-003) |
| A5 | Low | `<html lang="en">` correct; skip-to-content link not present (SPA with long sidebar) | `index.html:2` | Add with Phase-1 shell touch |

**Mitigation already in place this phase:** every route is now wrapped in an error boundary (`RouteErrorBoundary`), and CI runs axe-adjacent Lighthouse assertions on every push.

## B. Mobile — static findings

| # | Severity | Finding | Evidence | Action owner |
|---|---|---|---|---|
| M1 | **High** | **The mobile runtime was never verified anywhere** — no device emulator run, no mobile Lighthouse, no touch-target measurement exists in any session log. Everything below is static; the runtime audit is the deliverable still owed | The plan's G7 rationale | Scheduled: on-device audit before Phase-3 mobile work (P3-03/04) |
| M2 | Medium | Responsive coverage exists (47 of 100 CSS files carry `@media` rules) but is uneven — 53 files have no responsive rules; the dense modals flagged by the product audit (rooms, exam workspace) are the likely offenders | CSS grep | Fix list drawn up during P3-03 against the on-device audit |
| M3 | Low | `viewport-fit=cover` present (notch handling correct); `maximum-scale` cap shared with A1 | `index.html:6` | Same fix as A1 |
| M4 | Info | PWA installability not yet audited (manifest/service-worker review is part of P3-03) | — | P3-03 |

## C. Keepalive consolidation (P0-14, recorded here for completeness)

Four independent keepalive implementations existed: Vercel edge cron (`vercel.json` → `/api/keepalive`), a dev-server middleware emulation (`vite.config.ts`), a client health monitor (`keepaliveService.ts` feeding the OfflineBanner), and a redundant GitHub Actions cron (`.github/workflows/supabase-keepalive.yml`) that also carried **hardcoded Supabase URL/key fallbacks**.

**Action taken:** the GitHub Actions cron was **deleted** (it duplicated the Vercel cron at lower frequency, cost CI minutes, and leaked the project URL+key into the repo). Remaining: the server cron and its dev middleware emulation (one logical server implementation) plus the client health monitor — the two-implementation target from the plan.

## D. Open items leaving Phase 0

1. **On-device mobile audit** (Android + iOS, real browsers): touch-target sizes, viewport rendering of the six monolith pages, room timer legibility — before P3-03 begins.
2. **Screen-reader pass** on one core loop (dashboard → focus → reflection) — NVDA/VoiceOver.
3. **First Lighthouse CI numbers** — recorded as the baseline in ADR-003 when the first CI run completes on GitHub.
