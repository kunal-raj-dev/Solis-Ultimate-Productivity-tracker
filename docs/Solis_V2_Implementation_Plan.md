# Solis V2 — Phase-Wise Implementation Plan

> **Status:** Planning document — no implementation has started.
> **Basis:** `docs/Solis_V2_Research_and_Blueprint.md` (final blueprint), synthesized from research inputs `01`–`09` in `docs/v2-research/` — in particular `09-architecture-roadmap.md` (strategic phases, priority map) and `08-product-strategy.md` (capability backlog C1–C35).
> **Plan date:** 2026-09-27. **Sizing caveat:** phases are ordered, not dated. C3 (canonical schedule model) is XL and C2 (state continuity) is L; at single-developer scale, Phase 1 is a quarter-scale effort — do not calendar-compress it. Phase 0 is deliberately small (days–weeks) so the gate is real.

---

## 0. How to read this plan

The strategic roadmap defines **five phases** in dependency order:

```
Phase 0  Guardrails & Integrity      — make the codebase safe to change and honest to users
Phase 1  Loop Closure                — the V2 identity: one schedule model, synced state, write-back
Phase 2  Evidence-Backed Depth       — load the loop with evidence-backed, deterministic mechanisms
Phase 3  Intake & Reach              — accept real material; be present on the phone
Phase 4  AI Differentiation          — the proposal layer compounds everything behind approval gates
```

Each phase below has: **entry criteria → workstreams → task table (ID, work, location, size) → schema changes → verification → definition of done → commit checkpoints → explicit non-goals**. Task IDs (`P0-01`, `P1-04`…) are planning units, not tickets; each is roughly one focused branch of work.

### 0.1 Engineering invariants (carried from the research; every phase is bound by them)

1. **AI proposes, user disposes.** Every AI- or engine-generated change to user data lands as a **proposal object** the user approves; there are no silent writes.
2. **AI-absent ⇒ functional.** No core flow requires AI. Generative AI is BYOK-first; deterministic engines compute every number the UI shows.
3. **No rewrites.** The 16-domain `IDataService` abstraction, Supabase/RLS posture, deterministic engines, and honest-failure UX patterns are protected and extended, never replaced.
4. **RLS on every new table.** User isolation is the security spine; new tables inherit the pattern plus acyclic-parent checks where hierarchy exists.
5. **Failure honesty.** Every new surface uses the established `Promise.allSettled` + partial-data-warning + undo-on-failure patterns. Simulated or fake data is prohibited (the Phase-0 presence rule).
6. **Incremental extraction.** The six 1,000–1,600-line pages are decomposed only as they are touched, following the proven `useStudyPage.ts` hook pattern — never as a big-bang refactor.
7. **Calm over engagement.** No gamification theater, no engagement-dark patterns, notification payloads stay minimal, quiet hours always win.
8. **Mobile and accessibility are gates, not afterthoughts** — enforced from Phase 0 onward by CI budgets.

### 0.2 Conventions for all phases

- **Verification command:** `npm run verify` (`tsc -b && vitest run && vite build`) before every commit; CI runs it on every push once P0-01 lands.
- **Test policy:** unit tests for every new/modified pure engine (existing discipline: `vitest`, engine layer); a seeded RTL component test is added **each time a monolith page is extracted** (closes the 0-`.test.tsx`-vs-149-`.tsx` gap incrementally); integration tests for service-domain additions against the mock backend (the 16×2 dual-backend pattern).
- **Migration policy:** every schema change ships as a Supabase migration + mock-backend parity; the canonical-model backfill is incremental and projections keep old surfaces rendering before any cutover.
- **Telemetry:** every new user-facing flow emits named events to the opt-in sink built in P0; event names use `area.action` kebab-case (`review.due_materialized`, `triage.dismissed`). Never log note/session content.
- **Feature flags:** risky switches (FSRS-6, push, canonical-model cutover per surface) ship behind flags with documented off-state.
- **Commit checkpoints:** suggested at each milestone; each checkpoint keeps `npm run verify` green.

---

## Phase 0 — Guardrails & Integrity

**Objective:** make the codebase safe to change and honest to users. **Entry criteria:** none (this is the dependency).
**Debt closed:** D1, D2, D3, D4 (start), D5, D9, D11, D12, D17, D18. **Size:** days–weeks. **No product schema changes.**

### Workstreams & tasks

| ID | Milestone | Task | Where / notes | Size |
|---|---|---|---|---|
| P0-01 | M0.1 | CI workflow on push/PR: `tsc -b`, `vitest run`, `vite build`, plus Lighthouse + axe **budget gates** | `.github/workflows/` (new); budgets initially set at current measured values (index chunk 430.81 kB / gzip 119.82 kB is the baseline to beat) | M |
| P0-02 | M0.1 | Deploy-time schema check: assert expected columns exist; kill the PGRST204 silent column-strip retry | `src/services/supabase/modules/tasks.service.ts` retry logic; new deploy check script | S |
| P0-03 | M0.1 | Make task writes fail loudly on schema mismatch (remove swallow-and-retry-without-column) | `tasks.service.ts:117-125, 172-186` | S |
| P0-04 | M0.2 | Replace simulated ambient peer presence with real room Presence backing the widget — or remove/label the widget | `src/services/supabase/modules/presence.service.ts` (simulated data), `src/components/.../AppHeader.tsx` poll, `AmbientPeerPresenceWidget` | S–M |
| P0-05 | M0.3 | User-scoped cache keys (embed `userId` in every key) + per-channel prefix invalidation | `src/services/supabase/supabaseService.ts` (global invalidate), `tasks.service.ts`, `study.service.ts`, `rooms.service.ts` key sites | M |
| P0-06 | M0.3 | Mock backend cache invalidation parity with Supabase behavior | `src/services/mock/mockService.ts` notify path | S |
| P0-07 | M0.3 | Date-scoped hot reads, first tranche: `getTasks` and `getTodayPlan` stop fetch-all-then-JS-filter | `tasks.service.ts`, `study.service.ts` `getTodayPlan`; keep mock signatures identical | M |
| P0-08 | M0.4 | Opt-in product telemetry sink (event names + coarse counters only) + error sink + per-route error boundaries | New `src/services/telemetry/`; wrap route roots in `App.tsx`; **AI telemetry gets a consumer or is deleted** (sink-or-delete decision) | M |
| P0-09 | M0.5 | Generated DB types adopted; single schema source of truth (migrations → generated types + reference SQL; deprecate the duplicated `schema*.sql` copies) | Supabase CLI typegen; `src/services/supabase/` mappers become type-checked; remove the 38 `as any` casts this surfaces | M |
| P0-10 | M0.5 | Remove committed Supabase URL/key fallbacks from source; document env setup | `vite.config.ts` env fallbacks; `.env.example` | S |
| P0-11 | M0.6 | Mobile runtime audit on real devices + Lighthouse mobile run — findings logged with severity (no fixes yet) | Manual + scripted; findings doc in `docs/v2-research/p0-audit-findings.md` | S |
| P0-12 | M0.6 | Accessibility audit: axe over all routes; keyboard-operability check of custom click-targets | Findings doc; feeds per-phase fix lists | S |
| P0-13 | M0.6 | Decision records: build Web Push (deterministic triggers only — recommended); FSRS-6 evaluation kickoff with benchmark harness skeleton on V1's own review logs | `docs/decisions/` ADRs; benchmark harness under `src/utils/learning/__benchmarks__/` | S |
| P0-14 | — | Opportunistic: consolidate the four keepalive implementations to two | Dev middleware + Vercel cron + GH Action + client service | S |

### Phase 0 verification & DoD

CI green on every push (typecheck + full suite + build + budgets); ambient presence honest (real-backed, labeled, or removed); task writes fail loudly on schema mismatch; cache keys user-scoped with per-channel invalidation; hot reads date-scoped; telemetry sink receiving opt-in events; audits logged; push and FSRS-6 decisions recorded as ADRs.

**Commit checkpoints:** after P0-01–03 (CI + schema honesty), after P0-04–07 (integrity + reads/caches), after P0-08–10 (instrumentation + schema truth).

**Not in Phase 0:** any V2 feature surface; big-bang page extraction; presence features beyond the honesty fix.

---

## Phase 1 — Loop Closure (the V2 identity)

**Objective:** repair every verified loop break: one schedule model, synced invisible state, recall inside the day, analytics that writes back, unified reflections, frictionless day mechanics.
**Entry criteria:** Phase 0 complete (CI, schema truth, scoped cache live).
**New service domains:** `schedule`, `stateSync`, `proposals` (IDataService grows 16 → 17+ domains; mock implements all).
**Size:** XL — the quarter-scale phase.

### Workstreams & tasks

**WS1 — Canonical schedule model (C3, XL)**

| ID | Milestone | Task | Notes |
|---|---|---|---|
| P1-01 | M1.1 | Schema: `schedule_entries` table — `entry_type` (`fixed`/`flexible`/`defended`), `source_kind` (`task`, `study_plan_item`, `time_block`, `habit_window`, `review`, `rest`, `buffer`, `external_calendar`, `manual`), `source_id`, title, date, start/end, `duration_minutes`, `status` (`planned`/`in_progress`/`done`/`partial`/`missed`/`cancelled`), `actual_minutes`, `provenance` jsonb, `recurrence_rule` jsonb. RLS user-scoped. Migration + mock parity | Supabase migration; mapper + service domain `schedule` in `api.interface.ts`, both backends |
| P1-02 | M1.1 | Write-through adapters: task / study-plan-item / time-block mutations also upsert `schedule_entries` (provenance retained); dual-write during migration, no cutover yet | `tasks.service.ts`, `study.service.ts`, time-block service |
| P1-03 | M1.1 | Backfill job (idempotent, client-triggered on first load): project existing tasks/plan items/blocks into `schedule_entries` | New `src/utils/planning/scheduleBackfill.ts`; dry-run mode + count report |
| P1-04 | M1.1 | Projection layer: one pure function per surface — dashboard timeline, hourly/weekly planner, study agenda, calendar overlay — reads the model and emits the same shapes those surfaces render today | `src/utils/planning/scheduleProjections.ts` + per-surface render swap behind a flag; **surfaces render projections unchanged first** |
| P1-05 | M1.1 | Cutover per surface (flagged), deleting the three derived/persisted duplicates as each flips; date-scoped queries become the default read path (finishes D4) | `DashboardPage` timeline, `HourlyPlannerView`, `StudyPage` agenda, calendar overlay |

**WS2 — State continuity (C2, L)**

| ID | Milestone | Task | Notes |
|---|---|---|---|
| P1-06 | M1.2 | Schema: `state_sync_items` (user_id, key_class, key, payload jsonb, device_origin, updated_at), RLS user-scoped. Classify the ~40 `solis_*` keys: user-content (intention, ritual completion, pins, note history, notification inbox/prefs, welcome-back/gentle-start choices) vs device-preference vs ephemeral | Migration; audit list from `01-v1-product-audit.md` §1 |
| P1-07 | M1.2 | `stateSync` service domain (both backends): read-through with localStorage as offline cache; last-write-wins per key with `updated_at` arbitration | New `src/services/supabase/modules/stateSync.service.ts` + mock |
| P1-08 | M1.2 | Migrate the consumer sites (intention strip, morning ritual flag, pins/history in Notes, notification inbox, welcome-back) to the service; visible **sync-state indicator per data class** | Touch each site; `DashboardPage`, `NotesPage`, `notification.service.ts` storage |
| P1-09 | M1.2 | Honest guest→account migration: surface what migrates and what is dropped (goals/plan-items/time-blocks) instead of silently dropping | `src/utils/auth/guestMigration.ts` + migration dialog |

**WS3 — Recall in the day (C4)**

| ID | Milestone | Task | Notes |
|---|---|---|---|
| P1-10 | M1.3 | New `review` entry type in the model; day-start materialization creates capped review blocks from FSRS due counts (cap respects capacity; overflow pushes forward) | Extends `createLearningIntelligenceSnapshot` consumers; materializer in `src/utils/planning/` |
| P1-11 | M1.3 | Due-review block UI on the Today timeline: live counts + one-tap drill CTA launching the existing review flow | Dashboard projection render; drill CTA navigates to spaced-reviews sanctuary |

**WS4 — Proposals & triage write-back (C5, C6)**

| ID | Milestone | Task | Notes |
|---|---|---|---|
| P1-12 | M1.4 | Schema: `proposals` (user_id, kind, source (`engine`/`ai`), evidence jsonb receipt, diff jsonb, status `open`/`approved`/`dismissed`/`expired`, decided_at). RLS. New `proposals` service domain + `proposals` pub/sub channel | The backbone for every later "propose" feature (C9/C10/C15/C17/C28/C29/C30) |
| P1-13 | M1.4 | Triage inbox ("Needs a decision"): unified list of open proposals with acknowledge / schedule / dismiss; persisted dismissals; sidebar badge | New surface under Planning per the V2 IA tree; nav badge in the app shell |
| P1-14 | M1.4 | Analytics write-back: intelligence-report and recommendation cards become proposal producers (acknowledge / schedule / dismiss all persist) | Wire existing recommendation objects into the proposals sink |
| P1-15 | M1.4 | Unified reflections timeline (daily closures + weekly reviews + drift-pad thoughts readable in one place; drift-pad parked thoughts resurface with a reader) | Read-model over existing notes/reflections stores |

**WS5 — Frictionless day mechanics (C7)**

| ID | Milestone | Task | Notes |
|---|---|---|---|
| P1-16 | M1.5 | Auto-materialize routines at first day-load (manual "Sync today" override kept) | `materializeRoutinesForToday()` already in the contract; call site moves to day-start |
| P1-17 | M1.5 | Evening closure link-or-create: intentions link to existing backlog items instead of always creating duplicates | `DashboardPage` evening closure handler |
| P1-18 | M1.5 | Honest partial-work capture on abort: duration + optional reason; excluded from streaks, included in minutes/calibration; neutral copy | `FocusContext.cancelTimer` path + focus abort dialog |

**WS6 — Surfaced AI confidence (C26a)**

| ID | Milestone | Task | Notes |
|---|---|---|---|
| P1-19 | M1.6 | Show source tier + faithfulness score on every AI answer ("grounded from your note, line 42") — pure UI over the already-computed scores | `ai.service.ts` faithfulness data → `AskSolisDrawer` UI |

### Phase 1 verification & DoD

A commitment created on any surface exists once in the canonical model and renders on all four projections; a second device sees intention/ritual/pins/history/inbox; due-review block shows live counts with a working drill CTA; every insight can be acknowledged/scheduled/dismissed with persistence; parked thoughts resurface; partial sessions recorded; surfaced confidence visible on every AI answer. `npm run verify` green throughout; new domains carry integration tests; every extracted surface carries a seeded RTL test.

**Commit checkpoints:** after WS1 schema+adapters (P1-01–03), after each surface cutover (P1-05), after WS2 (P1-08–09), after WS3–WS4, after WS5–WS6.

**Not in Phase 1:** habit scheduling, calibration, WOOP, breaks, collisions (Phase 2); ingestion/calendar/mobile/push (Phase 3); AI drafting (Phase 4).

---

## Phase 2 — Evidence-Backed Depth

**Objective:** load the closed loop with the mechanisms the evidence demands — all deterministic, all citation-carrying.
**Entry criteria:** Phase 1 DoD (model + proposals sink + honest partial-work data exist).

### Workstreams & tasks

| ID | Milestone | Task | Where / notes | Size |
|---|---|---|---|---|
| P2-01 | M2.1 | Calibration ledger: pure computation over planned vs actual (incl. partial-work data) → "your estimates run X% optimistic"; per-item slippage forecasts; auto-segmentation of >90-minute captures; minimum-count "insufficient data" honesty | New engine `src/utils/intelligence/calibrationLedger.ts` + tests; UI in Analytics + goal cards | M |
| P2-02 | M2.2 | WOOP wizard (Wish→Outcome→Obstacle→If-Then) on goals; trigger-time if-then reminders defined (data now, push ships P3); **fallback branches** in generated study plans | Goal form + `goalPlanGenerator.ts` extension; proposal-layer fallbacks | M |
| P2-03 | M2.3 | Habit system: weekly-consistency scoring as the headline ("6/7 days"); month-scale framing copy; **scheduled habit windows** as `habit_window` entries placed into the model via approve-diff; context-stability prompt on life changes | `HabitsPage`, habit engine; placement proposals ride P1-12 | M |
| P2-04 | M2.4 | Retrieval tickets beyond flashcards (typed sources feed them); exam-anchored interval biasing (10–20% before exams, Cepeda rule); daily review-minute **caps** with overflow pushed forward | `src/utils/learning/` (FSRS/SM-2 layer), review surfaces | M |
| P2-05 | M2.5 | Confidence-before-reveal quizzing; per-subject calibration score (metacognitive ledger) | Flashcard review modal + Analytics | S–M |
| P2-06 | M2.6 | Focus-loop edges: "next step when I return" note pre-filling unfinished items; detachment gate ("day is done" state after evening closure; plan hidden); **adaptive break proposals** as buffer blocks via approve-diff (A/B honestly); anti-avoidance kit (two-minute starter + obstacle naming) on tasks that slip twice | `FocusContext`, FocusPage, evening closure; `rest`/`buffer` entry types from P1-01 | M |
| P2-07 | M2.7 | Collision radar (deadline bunching) + weekly load budget; interruption trend view; Scholar Report links from exams/goals | New deterministic math over the model; Analytics + ExamHorizonBar area | M |
| P2-08 | M2.8 | Rooms mechanics: goal declaration + closing check-in (analytics-recorded); recurring room sessions; rooms-vs-solo measurement | `useStudyRoom.ts`, rooms services, events stream | M |
| P2-09 | M2.8 | Rooms realtime debts: server-derived `is_host` (kill client-side email-prefix heuristic); poll backs off when `SUBSCRIBED`; N+1 profile fetch fixed with a cached profile map; `getMessages` newest-first windowing | `useStudyRoom.ts`, `rooms.service.ts` | M |
| P2-10 | M2.8 | Write-chain reconciler: periodic reconciliation of the cross-domain auto-cascade against partial-work records | `FocusContext` chain + reconciler util | S–M |
| P2-11 | M2.4 | Typed-record core (C23 core): record-type schema over notes (Lecture/Reading/ExamQuestion/Mistake) + **saved views** | Notes data model + views UI; feeds C11/C26 | M |

### Phase 2 verification & DoD

Visible "your estimates run X% optimistic" with per-item forecasts; every generated plan carries a fallback branch; habit headline is weekly consistency with scheduled windows; review caps enforced with overflow pushed; confidence calibration score live; next-action notes pre-fill; evening closure hides the plan; rooms record declarations/check-ins into analytics. Fatigue guards verified: proposal caps + persisted dismissals (C15/C17); small-sample honesty in the ledger.

**Commit checkpoints:** per milestone (M2.1 … M2.8); rooms debts (P2-09) as one standalone commit.

**Not in Phase 2:** AI drafting of plans/reviews; ingestion; mobile widgets; term/timetable surfaces.

---

## Phase 3 — Intake & Reach

**Objective:** accept the student's real material and be present on the phone: narrow ingestion, live calendar, PWA baseline + widgets, term projection, FSRS-6, push.
**Entry criteria:** C3 (output lands in the model), C2 (synced truth for widgets/push), Phase-0 decisions taken (push: build; FSRS-6: pending benchmark).

### Workstreams & tasks

| ID | Milestone | Task | Where / notes | Size |
|---|---|---|---|---|
| P3-01 | M3.1 | Ingestion pipeline (C19, narrow: syllabus / PDF / plain text): deterministic extraction → schema-validated AI structuring (BYOK/edge path) → **per-field review-and-confirm screen** → writes through existing topic/date/card services with provenance; unparseable files fall back to manual entry | New `ingestion` service domain + `ingested_documents` store (RLS); review screen under Study & Knowledge; dedup the duplicated LLM JSON parser (client + edge) as part of this | XL |
| P3-02 | M3.2 | ICS URL subscriptions (read-only): encrypted-at-rest URL storage, polling with backoff, entries land as `fixed` external-calendar items feeding collision warnings; sync-state UI | New `subscriptions` domain; Settings calendar section | M |
| P3-03 | M3.3 | PWA baseline: installability, service-worker hardening, share-target capture; fix dense modals surfaced by the P0 audit | `vite-plugin-pwa` config, manifest, per-audit fixes | M |
| P3-04 | M3.3 | Widgets/shortcuts: home-screen due counts, focus quick-start, capture shortcut; lock-screen data limited to counts | PWA shortcuts first; OS widgets where reachable | M |
| P3-05 | M3.4 | Term/timetable projection (C22): rotating class slots grid + 15-week term view with feasibility summary — a projection of the model, never a fourth scheduler | Projection over `schedule_entries` + ICS fixtures; Planning section | L |
| P3-06 | M3.5 | FSRS-6 (C24): run the benchmark on V1's own review logs; if it wins, state-preserving migration behind a flag; otherwise document the decline with numbers | `src/utils/learning/` engine layer; benchmark harness from P0-13 | M |
| P3-07 | M3.6 | Web Push (C25): edge function evaluating deterministic schedule triggers from the model (block start, hour review, WOOP if-then at trigger time, due-review counts); per-device subscriptions table (RLS); server-side quiet hours; minimal payloads (counts/titles, never content); honest iOS browser-push copy | Supabase edge function; Settings notification prefs | L |
| P3-08 | M3.7 | Document-typed records + related-content suggestions (C23/C33): ingested documents become typed records; deterministic one-tap related-content suggestions | Extends P2-11 typing; suggestions engine over the local index | M |
| P3-09 | — | Keepalive consolidation completed; remaining env hygiene | From P0-14 | S |

### Phase 3 verification & DoD

A dropped syllabus produces a user-confirmed topic tree + exam dates + draft cards entering the canonical model with citations; a subscribed ICS overlays fixed entries and feeds collision warnings; the app installs and shows truthful due-count widgets; timetable rotation renders; FSRS-6 shipped behind a flag or declined with benchmark numbers; deterministic triggers push cross-device with server-enforced quiet hours.

**Commit checkpoints:** ingestion is its own milestone branch (P3-01 alone); then P3-02; then mobile (P3-03/04); then P3-05; FSRS-6 (P3-06) isolated; push (P3-07) isolated.

**Not in Phase 3:** lecture-audio transcription, photo schedule scan (V3); two-way Google/Outlook OAuth (V3); native store apps.

---

## Phase 4 — AI Differentiation & Compounding

**Objective:** ship the differentiators that compound everything before them — strictly as a proposal layer: grounded ask deepening, tutor, validated drafting, review agent, retention-aware replanning (flagship), term feasibility, measured experiments.
**Entry criteria:** C3, C5, C8, C11, C12, C17, C22, C26 all live; BYOK path unchanged.

### Workstreams & tasks

| ID | Milestone | Task | Where / notes | Size |
|---|---|---|---|---|
| P4-01 | M4.1 | Ask Solis deepening: grounding extended to plans/sessions/review history; retrieval index covers canonical-model entities; richer citations | `ai.service.ts` grounding pipeline + local BM25/RRF index | M |
| P4-02 | M4.2 | Socratic Tutor Mode: hard no-final-answers contract, hint ladders, non-moralizing usage logging; toggle with hint-depth settings | Constrained prompt contract + UI mode in Ask Solis; Harvard RCT applies only to constrained tutors — design accordingly | M |
| P4-03 | M4.3 | AI-drafted study plans (C28): drafts validated by deterministic feasibility math **before display** (validator = exam feasibility + C8 capacity + C17 collision); rejected drafts name the failing constraint; approval via the proposals layer | `goalPlanGenerator` + AI draft path + proposals sink | L |
| P4-04 | M4.4 | Weekly review agent (C29): prediction-vs-actual spine; next-week plan as ONE approve-diff; numbers-in-prompt narration only (the model narrates computed numbers, never invents them) | WeeklyReviewPage + proposals | M |
| P4-05 | M4.5 | **Retention-aware replanning (C30 — flagship):** threshold-driven reflow proposals when memory state endangers the plan; evidence receipts; approve-diff only; conservative thresholds + persisted dismissal as trust metrics | New deterministic trigger layer over FSRS states + model; proposals UI | L |
| P4-06 | M4.6 | Term-scale feasibility (C31): per-subject feasibility across the 15-week arc; early honest warnings with recovery actions | Deterministic engine over C3+C8+C22 | M |
| P4-07 | M4.7 | Measured experiments (C32/C34/C35): pacts board with behavioral stakes only (read-only aggregation, no deposits); voice dictation (on-device STT first); interleaved practice sets (same-type gating, delayed measurement) — each with **pre-declared success metrics** | Pact board UI, dictation in capture inputs, set-builder flag | M |
| P4-08 | — | Instrumentation completeness: every metric in the blueprint's Part 7 wired to the sink (adoption per capability, AI validation-vs-rejection rates, ingestion edit-distance, reflow dismissal rate as trust metric) | Telemetry events audit against Part 7 | S |

### Phase 4 verification & DoD

Retention-aware replanning proposes reflows as approve-diffs in production; AI plan drafts are validator-gated with named constraints; weekly review closes with a one-diff proposal; Tutor Mode enforces its contract; term feasibility computes across the arc; pacts/voice/interleaving run with pre-declared metrics. All AI features demonstrably functional with AI absent.

**Commit checkpoints:** each milestone is a standalone branch; P4-05 (flagship) gets the full verify + a staged rollout behind a flag.

**Not in Phase 4:** any of the standing declines (D1–D14): autonomous agentic replanning, proactive AI nudges, LLM memory layers, live voice companion, OAuth/tool/MCP agents, LLM-per-capture, LLM as the intelligence engine, gamification, identity-goal sharing, monetary stakes, social network, heavy ingestion, AI auto-filing, platform rewrite.

---

## Cross-phase dependency map (critical path)

```
P0 CI/schema/cache/instrumentation
 └─> P1-01..05 canonical model + projections  ──> P1-10/11 due review ─┐
 └─> P1-06..09 state sync ────────────────────────────────────────────┤
 └─> P1-12..15 proposals + triage  <──────────────────────────────────┤
      └─> P2-01 calibration (needs P1-18 partials)                    │
           └─> P2-07 collisions ──┐                                   │
      └─> P2-03 habit windows ────┤                                   │
      └─> P2-04/11 retrieval + typing ──┐                               │
                                        │                               │
P2 all ─> P3-01 ingestion (model) ─> P3-08 typed docs                   │
P1 sync ─> P3-03/04 PWA/widgets ─> P3-07 push                           │
P3-02 ICS ─> P3-05 term ────────────────────────────────────────────────┤
                                                                        v
P3 + P2 ─> P4-03 drafts ─ P4-04 review agent ─ P4-05 RETENTION REPLANNING (flagship)
                              └────────────── P4-06 term feasibility
```

**Critical path:** P0 → C3 (P1-01..05) → C5 proposals → C8 calibration → C30 flagship. Every other branch feeds it; nothing on the critical path may slip without moving the V2 identity.

**Sequencing rules of thumb:** projections before cutovers; sync before widgets/push; loop closure before intake; depth before reach; the proposal layer before any AI that writes.

---

## Metrics instrumentation map (what wires when)

| Metric family | Wired in | Note |
|---|---|---|
| Error rate / reliability | P0 (P0-08) | Error sink + per-route boundaries |
| Performance (LCP/INP/CLS, chunk budgets) | P0 CI budgets; P1 RUM | Baseline = current chunk sizes |
| Activation funnel (time-to-first-action) | P1 (telemetry on existing activation flow) | Replaces the simulated "42 s" claim |
| Daily/weekly usage, ritual completion | P1–P2 | Ritual events synced via C2 |
| Planning completion / adherence (honest) | P2 (needs partial-work + calibration) | First honest adherence numbers ever |
| Session completion / partial-capture rate | P1–P2 | C7 events |
| Consistency (habit weekly distribution) | P2 | Replaces chain-length framing |
| Memory retention (review execution, backlog age) | P1 (C4 events) | C4's purpose made measurable |
| Feature adoption per capability | P2–P4, per ship | Tier validation |
| Collaboration (declarations, check-ins, rooms-vs-solo) | P2 | Existing room event stream |
| AI usage / faithfulness distribution / draft validation rate | P1 (surface) → P4 (full) | Telemetry gains its consumer |
| Satisfaction micro-surveys | P2+ | 1-tap after import/confirm/reflow/detachment |

Targets are set **after one baseline quarter** of Phase-1 telemetry — no invented numbers.

---

## Risk register (implementation view)

| Risk | Phase | Mitigation |
|---|---|---|
| Canonical-model migration regressions (largest schema change ever) | P1 | Projections-first (surfaces unchanged), incremental backfill with dry-run, CI gate, per-surface flags |
| Partial state-sync divergence across devices | P1 | Per-class shipping with visible sync state; last-write-wins with `updated_at`; WAL replay stays the offline path |
| Cache/read-path regressions during migrations | P0→P1 | User-scoped keys + per-channel invalidation land **before** the migrations; mock parity keeps dual-backend tests honest |
| Proposal fatigue (too many nudges) | P2+ | Caps, persisted dismissals, conservative thresholds; dismissal rate tracked as a trust metric |
| PDF extraction quality / hallucinated fields | P3 | Narrow scope (syllabus/PDF/text), schema validation, mandatory per-field confirmation, manual fallback |
| FSRS-6 upgrade corrupts scheduling state | P3 | Benchmark-gated; state-preserving migration; feature flag; decline is an acceptable outcome |
| AI drafts feel autonomous / erode trust | P4 | The approve-diff IS the design; validator gates before display; named failing constraints on rejection |
| Audit findings forcing rework | P0 | Accepted — that is the audit's purpose; findings logged with severity before feature work |
| Monolith extraction regressions | P1–P2 | Incremental-as-touched only; seeded RTL test accompanies every extraction |

---

## What this plan deliberately does not contain

The 14 standing declines from the research (autonomous agentic replanning, proactive AI nudges, LLM memory, voice companion, OAuth/MCP agents, LLM-per-capture, LLM engine replacement, gamification theater, identity-goal sharing, monetary stakes, social network, heavy ingestion, AI auto-filing, platform rewrite) — plus V3 items: two-way Google/Outlook OAuth, lecture-audio ingestion, photo schedule scan, native store apps, multi-user planning. Each was evaluated and rejected with evidence; they stay rejected unless new evidence arrives.

**V3 pays forward from this plan unchanged:** the canonical model makes two-way calendar and term-arc work cheap; the proposal layer makes any new automation safe; the calibration ledger makes any pacing claim honest.

---

*Prepared from `docs/Solis_V2_Research_and_Blueprint.md` and research inputs 01–09. File paths reference the current V1 tree and may shift as extraction proceeds; task IDs are planning units, not tickets.*
