# 09 — Solis V2 Architecture Direction & Strategic Roadmap

**Document ID:** `docs/v2-research/09-architecture-roadmap.md`
**Stage:** Solis V2 Research & Product Planning — architecture direction & strategic roadmap (input 09)
**Date:** 2026-09-27
**Inputs read in full in this session:** `08-product-strategy.md` and `07-gap-analysis.md` (workspace `docs/v2-research/`), `02-v1-technical-audit.md` and `01-v1-product-audit.md` (nested repo `Solis-Ultimate-Productivity-tracker-main/Solis-Ultimate-Productivity-tracker-main/docs/v2-research/`). All four located on disk; none missing.

**Method & verification posture (read this first):** **No code checks, builds, or web fetches were executed in this session.** This is an architecture and planning synthesis over the four inputs above. Every **VERIFIED FACT** below inherits its verification from the inputs' own evidence trails — inputs 01/02 executed `npx tsc -b` (exit 0), `npx vitest run` (128 files / 1,162 tests passing), and production builds (7.2 s / 15.19 s) in their sessions — and carries a citation to the input, section, and code path. Facts resting on inputs 03 (competitors), 04 (adjacent products), 05 (AI landscape), 06 (learning science) are cited **"via 07/08"** because those inputs were not read in this session. Judgments made here are labeled **EXPERT OPINION** or **RECOMMENDATION**. Two internal inconsistencies in input 08 are flagged and resolved explicitly (§5.2 note on C23 phasing; §6 note on C11's dependency row).

**Labels:** **VERIFIED FACT** (source-checked in an input) · **OBSERVED PATTERN** · **EXPERT OPINION** · **RECOMMENDATION**.
**Product thinking rules 1–15 from the brief apply throughout** (no blind copying, no feature supermarket, protect identity, depth over quantity, deterministic beats AI when it wins, privacy first-class, mobile not desktop-only, accessibility from the start, respect V1 architecture, foundations before sophistication, every capability tied to a user problem).

---

## 0. The one-paragraph verdict

**RECOMMENDATION.** V1's architecture is the asset, not the obstacle: a 16-domain `IDataService` abstraction with two interchangeable backends, 26 RLS-protected tables, pure deterministic engines under 1,162 green tests, a race-guarded auth context, an offline write-ahead log, and a three-tier grounded AI pipeline are all **VERIFIED FACT** (02 §1–§2). V2 therefore performs **no rewrites**. It does four structural things: (1) repairs six integrity/performance debts that would otherwise multiply under V2's change load (02 §3.1 D1–D6); (2) collapses three scheduling vocabularies into **one canonical schedule model with projections** — the highest-leverage structural fix in the research (07 I1; 01 §4 break #1); (3) adds exactly three new cross-cutting subsystems V1 lacks — **user-scoped state continuity, a proposal/approve-diff object layer, and honest observability**; (4) sequences five dependency-ordered phases so that intake (Phase 3) pours material into a *working* loop (Phase 1) and AI differentiation (Phase 4) compounds everything beneath it. The headline architecture prerequisite is the **Phase-0 guardrail gate: CI running the existing green suite, the simulated-presence integrity fix, fail-loud schema checks, user-scoped caching, and instrumentation — because every V2 feature multiplies on those codepaths** (02 §5: CI is "the single cheapest high-value fix").

---

# Part 1 — Architecture Impact

## 1.1 What can remain unchanged (protect — rule 13)

**VERIFIED FACT** for each item's existence; **EXPERT OPINION** for the "protect" call.

| Asset | Evidence | Why it survives V2 |
|---|---|---|
| `IDataService` 16-domain service abstraction + delegating runtime-switchable container | 02 §1.2–1.3 (`dataService.ts:12-139`, proxy `:142-165`) | New domains (state sync, proposals) bolt on as sub-services; both mock and Supabase backends keep implementing one contract |
| Supabase data model + RLS posture (26 tables, 50 policies, user isolation + acyclic parent checks) | 02 §1.4 | C2/C3/proposals are **additive** schema evolution inside the same pattern; RLS is already the security spine |
| Deterministic engine layer under `utils/` (FSRS-5/SM-2, retention, mastery ×3, circadian synthesis, subject health, exam feasibility, time cushion, recurrence, NLP parser) | 02 §2; 01 §3.3/§3.8/§3.9 | V2 *consumes* these engines (C4, C8, C17, C30, C31); none is replaced. FSRS-6 (C24) is an evaluated upgrade behind the same interface, not a rewrite |
| Cross-domain auto-cascade (`FocusContext.saveReflection`, `FocusContext.tsx:715-895`) | 01 §3.4/§4 — "one user action updates seven downstream entities" | V2's Track stage is built on it (07 Part 3 §4); C13's next-action note rides it |
| Race-guarded `AuthContext` + guest snapshot migration | 02 §1.5 (`AuthContext.tsx:47-52, 64-115, 216-227`) | C2's state migration extends the same honest-failure pattern |
| Offline IndexedDB WAL with per-user mutation ownership | 02 §1.8 (`pwaSync.ts:42-52`) | Becomes the **write path** for C2's synced state (08 C2) |
| Study-rooms realtime system (presence, Postgres-change listeners, epoch timer, deterministic host failover, polling fallback) | 02 §1.6 (`useStudyRoom.ts`) | C18/C32 add mechanics to a working stream; the simulated ambient widget (D1) is the only part replaced |
| Three-tier AI pipeline (edge proxy → BYOK key → deterministic extraction) + grounding gate + guardrails + BM25/RRF local RAG | 02 §1.9 (`ai.service.ts`) | Every V2 AI feature (C19, C26–C29) composes with it; the AI-absent ⇒ functional invariant is preserved |
| Stack: React 19.2.8 / TS strict / Vite 6 / react-router 7 / Supabase JS / Vitest; plain CSS tokens | 02 §1.1 (brief's "React 18" corrected to 19.2.8) | No platform change; route-level lazy splitting and vendor chunking stay |
| Partial-failure UX pattern (10 entry points with `Promise.allSettled` + `PartialDataWarningBanner`), undo-on-failure optimism, destructive-action confirmations | 02 §1.10; 01 §4/§5.5 | The "failure honesty" quality 01 calls the app's most consistent — carried into every new surface |

## 1.2 What should be refactored in place (existing code, new shape)

| Subsystem | Today (VERIFIED) | V2 target shape |
|---|---|---|
| **Hot read paths** | `getTasks` fetches all tasks then JS-filters (`tasks.service.ts:14-67`); `getTodayPlan` fetches all plan items + all sessions (`study.service.ts:294-321`); Dashboard/Analytics issue ~13 parallel collection fetches (`DashboardPage.tsx:279-309`, 01 §1) | Date-scoped, server-filtered, paginated queries; the intelligence snapshot gains memoization boundaries (02 §4.5) |
| **Cache** | 30 s Map; global `invalidate()` on every mutation (`supabaseService.ts:121-124`); keys without userId (`tasks.service.ts:15`, `study.service.ts:294`, `rooms.service.ts:15`); mock never invalidates (`mockService.ts:356-365`) | User-scoped keys + per-channel prefix invalidation; mock provider invalidated identically — correctness by invariant, not TTL luck |
| **Pub/sub channels** | Only 9 of 16 domains scoped; flashcards/reviews/routines/resources/reflections/rooms broadcast `'all'` (`api.interface.ts:239`) | Full 16-domain channel coverage + a new `proposals` channel (§1.4); `matchesChannelFilter` defaults unchanged |
| **Monolithic pages** | Six 1,000–1,600-line components + 2,987-line `mockService.ts` (02 D6) | Incremental extraction following the proven `useStudyPage.ts` pattern as each file is touched (02 D6 mitigation) |
| **Notification service** | Device-local only; `webPushEnabled: false`; inbox/prefs in `localStorage` (`notification.service.ts`; 02 §1.7/D13) | Inbox + prefs become C2-synced user data; optional Web Push layer behind the same service interface (C25) |
| **Realtime details** | Host identity guessed client-side incl. email-prefix match (`useStudyRoom.ts:173-182`); N+1 profile fetch per chat INSERT (`:550-573`); unconditional 5 s poll (`:662-681`) | Server-derived `is_host`; cached profile map; poll backs off when `SUBSCRIBED` (02 D7/D8) |
| **AI plumbing duplication** | LLM JSON parsing duplicated client + edge function (`ai.service.ts:353-399`; `generate-cards/index.ts:180-196`) | Shared module or documented single duplicate (02 D14); faithfulness gate upgraded from warn-in-console to **surfaced in UI** (C26a; 01 §3.13) |
| **Schema sources** | `schema.sql`/`schema_phase4.sql` in `src/` lag `supabase/migrations/` — two sources of truth (02 D17) | Single generated source of truth (migrations → generated types + reference SQL) **before** the C3 migration, which is the highest-risk schema change of V2 |
| **Keepalive sprawl** | Four independent implementations (dev middleware, Vercel edge cron, GH Action, client service) (02 §1.8/D21) | Consolidate to two (one server cron + client health service feeding the OfflineBanner) |
| **Room message reads** | `getMessages(limit=100)` ascending → oldest 100 (`rooms.service.ts:287-296`, D22) | Descending/newest-first windowed reads (scheduled in Phase 2 alongside rooms mechanics) |

## 1.3 What must be redesigned / built new (subsystems V1 does not have)

These are **additions**, not rewrites; each rides the existing `IDataService` + Supabase + RLS patterns.

1. **Canonical schedule model (C3).** One typed schedule entity — `fixed / flexible / defended` entry types with per-source provenance (task, study-plan item, block, habit window, review, rest, buffer, external calendar) — stored in new Supabase tables; the four existing surfaces (dashboard timeline, hourly/weekly planner, study agenda, calendar overlay) become **projections**. VERIFIED basis: three coexisting vocabularies (`DashboardPage.tsx:184-196` derived blocks; `HourlyPlannerView.tsx` persisted blocks; `StudyPage` agenda; 01 §4 break #1, "single largest IA debt" per 01 OPINION; 07 I1). Migration is incremental backfill — surfaces render projections unchanged first (08 C3; Logseq rewrite warning via 07 R2).
2. **Proposal / approve-diff object layer (new `proposals` domain in `IDataService`).** Every generated or engine-proposed change (triage "schedule" actions C5, WOOP fallbacks C9, habit re-placement C10, break insertion C15, collision trade-offs C17, AI plan drafts C28, weekly review diff C29, retention reflows C30) lands as one `proposal` object: `{evidence receipt, diff payload, state: open|approved|dismissed}`. This is the architectural expression of the strategy's core invariant "AI proposes, user disposes" (05 §3.11 via 08 principle 2; 07 §2.2). **RECOMMENDATION:** model it as a 17th service domain rather than four ad-hoc queues, because C5/C28/C29/C30 share exactly this mechanism (EXPERT OPINION grounded in the candidate dependency tables of 08 §2).
3. **User-scoped state continuity service (C2).** Cloud tables for the ~40 device-local `solis_*` key classes — daily intention, morning-ritual completion, welcome-back choices, gentle-start capacity, note pins, note version history, notification inbox/prefs — classified user-content vs device-preference vs ephemeral; localStorage demoted to offline cache (VERIFIED: 37 files / ~40 keys, 01 §1 debt 1; 02 §1.7/D13).
4. **Ingestion pipeline (C19).** Deterministic PDF/text extraction → schema-validated AI structuring pass (BYOK/edge path) → per-field user confirmation → writes through existing topic/date/card services with provenance retained for citations (08 C19; 05 §4 C via 08). New stores: extracted documents + provenance.
5. **Push infrastructure (C25).** Edge function evaluating deterministic schedule triggers from the canonical model → Web Push (VAPID); per-device subscription records; quiet hours enforced server-side; minimal payloads (counts/titles, never content). Decision taken in Phase 0, built in Phase 3 (08 C25).
6. **Product observability & metrics pipeline (new; prerequisite for §7).** VERIFIED: observability is console-only — 114 `console.error/warn` sites, no Sentry/PostHog/external sink, AI telemetry recorded with no consumer, ErrorBoundary only at root (02 §1.10, D11; 01 §3.13 X5). V2 adds: opt-in, privacy-respecting product telemetry (event names + coarse counters, never note/session content) plus a lightweight error sink and per-route error boundaries. Without this, every success metric in §7 is unmeasurable (01 §3.12 explicitly flags V1's "42-second activation" as simulation, not measurement).
7. **CI + deploy-time schema check (C1).** GitHub Actions running `tsc -b && vitest run && vite build` plus a Lighthouse/axe budget gate on every push/PR; deploy-time assertion that migrations match expected columns — killing the PGRST204 silent column-strip retry (`tasks.service.ts:117-125, 172-186`; 02 D3).
8. **Term/timetable projection (C22) and calendar subscription sync (C20)** as adapters over the canonical model — imports land as fixed entries; nothing becomes a fourth scheduler (07 §2.2).

## 1.4 Must exist BEFORE V2 features begin — the Phase-0 gate

**RECOMMENDATION (gate list; each item carries its debt citation):**

| # | Gate item | Debt/risk ID | Why before features |
|---|---|---|---|
| G1 | CI running the green suite + build on every push/PR | D2/R5 | 1,162 tests exist but never run on push; V2 is a heavy build phase (02 §5) |
| G2 | Simulated presence honesty fix (real room Presence backs the widget, or label/remove) | D1/R4/X6 | V2 social work must not build on fictional peers; violates the repo's own no-fake-integration rule (`master.md §1.2 rule 5` via 02 §1.6) |
| G3 | Fail-loud schema contract: kill PGRST204 silent strip; deploy-time schema check | D3/R6 | C2/C3 are the biggest schema evolutions in the product's history |
| G4 | User-scoped cache keys + per-channel invalidation + date-scoped hot reads (start) | D4/D5/D9, R3 | Prevents cross-account cache leakage on shared browsers and the linear read-path ceiling while migrations run |
| G5 | Generated DB types; single schema source of truth | D18/D17 | Mappers become checked before the canonical-model migration |
| G6 | Opt-in metrics/error sink + per-route error boundaries | D11 | §7's metrics and Phase-1 debugging both depend on it |
| G7 | Mobile runtime audit + Lighthouse/axe audit (not fixes — the audit) | R9/R10 | Gates all V2 UI work; never run in any input (01 §0/§5.2/§5.3) |
| G8 | Decisions taken early: server push (recommend build, deterministic triggers only — 08 C25); FSRS-6 evaluation kickoff | D13/O1 | Both change Phase-3 scope; deciding late wastes work |

**Background jobs / scheduled work inventory (current VERIFIED state → V2):** 30 s block-alert monitor app-wide (`AppLayout.tsx:53-100`), 60 s ambient-presence poll (`AppHeader.tsx:43-71`), 5 s room poll + 500 ms tick (`useStudyRoom.ts`), 4 keepalive implementations, Vercel cron `0 12 * * *` + GH 2-day cron. V2 adds only: day-start routine materialization on first load (C7 — `materializeRoutinesForToday()` already in the contract, `api.interface.ts:158-164`), ICS subscription polling with backoff (C20), push-trigger evaluation edge function (C25), FSRS-6 offline benchmark harness (C24). Nothing else — deliberately; a client-side product does not need a job platform (rule 10).

## 1.5 Domain-by-domain disposition

| Area | Disposition | Notes |
|---|---|---|
| **Services** | Extend | 16 domains stay; add `stateSync` (C2), `proposals` (new), `ingestion` (C19), `subscriptions` (C20). Mock backend implements all of them (the 16×2 pattern, 02 §1.3) |
| **Events** | Extend | Channel coverage 9→all domains + `proposals`; per-channel invalidation (D9); no event-sourcing, no message bus — the existing `subscribe/notify` contract suffices (EXPERT OPINION, rule 10) |
| **Background jobs** | Minimal | See §1.4 inventory; all client-side except the push evaluator |
| **Notification & realtime infra** | Extend + repair | Rooms realtime untouched; ambient presence re-backed by real Presence (D1); notifications gain synced inbox/prefs + optional Web Push (C25); quiet hours preserved incl. server-side enforcement |
| **AI / agent architecture** | Extend, constrain | No agent loops, no tool-calling runtime, no autonomous planner (declines D1/D5, 08 §2.6). AI stays: grounded Q&A (C26), constrained tutor (C27), validator-gated drafting (C28), numbers-in-prompt narration (C29), ingestion structuring (C19). All state writes flow through the proposal layer |
| **Data pipelines** | New ingestion + migrations | Document→structured-study-data pipeline with provenance and per-field confirmation; localStorage→cloud state migration with visible sync state; canonical-model backfill from three existing stores |
| **Analytics (learning intelligence)** | Keep + extend | 13-module deterministic snapshot stays the single pure computation boundary (`intelligence/index.ts:38-71`, 02 §2); V2 adds insight-state persistence (C5), calibration ledger (C8), collision/budget math (C17), term horizon (C31) — all deterministic |
| **Product analytics** | New | Opt-in telemetry sink (§1.3 #6); strictly separated from the student's learning data |
| **Search** | Extend | Local BM25 + hashed trigram + RRF index extends to canonical-model entities and typed records (C23/C26); no embeddings service (preserves V1's no-embedding RAG design, 02 §1.9; 08 C23 privacy note) |
| **Caching** | Refactor | User-scoped keys, per-channel invalidation, honest mock behavior (G4); TTL stays 30 s as a safety net, not the correctness mechanism |
| **Security / permissions** | Preserve + extend | RLS on **every** new table (state-sync, proposals, ingestion, push subs, ICS subs); ICS subscription URLs encrypted at rest (08 C20); push payloads minimal; BYOK key path unchanged (sessionStorage default, 01 §3.11); hardcoded URL/key fallbacks removed from source (D12 — publishable key is not a secret leak, VERIFIED, but couples source to one project) |
| **Audit logs** | Minimal by design | **RECOMMENDATION (EXPERT OPINION):** no dedicated audit-log subsystem for a single-user product (rule 10). The proposal ledger *is* the change audit trail (every approve-diff records evidence + action); `study_room_events` already audits social surfaces; DB `updated_at` columns cover the rest. Revisit only if multi-user V3 work lands |
| **Observability** | Build | G6: error sink, per-route boundaries, perf marks, opt-in product telemetry; AI telemetry gains a consumer (surfaced faithfulness C26a) or is deleted (X5 rule-10 call: sink-or-delete) |
| **Testing** | Extend | CI gate (G1); introduce jsdom + RTL and seed component tests as each monolith page is extracted (D10 — 0 `.test.tsx` vs 149 `.tsx`, VERIFIED 02 §0.3); FSRS-6 benchmark harness on V1's own review logs (C24); keep the engine-layer discipline |
| **Deployment** | Keep + harden | Vercel SPA + edge functions stay; add CI, deploy-time schema check, env hygiene (D12); push edge function added in Phase 3 |
| **Cost implications** | Bounded | Learning loop stays free and deterministic ⇒ no marginal AI cost for core flows. Generative AI is BYOK-first ⇒ ~$0 operator cost; operator-paid flash-class envelope ≈ $1.20–1.50/heavy-user/mo if ever subsidized (05 §3.12 via 08 principle 5). Push + ICS polling add trivial edge/DB load. Read-path/cache fixes *reduce* DB cost (fetch-all today, D4). Declined items avoid the documented cost traps: audio tutor ~$2–4/mo (D4), agentic loops' token multiplication (R8), LLM memory layer ~8× TCO (D3) — all VERIFIED via 08 §2.6 |

---

# Part 2 — Technical Debt Triage (from input 02's 23-item register)

## 2.1 Must fix BEFORE V2 features (Phase 0)

| # | Debt | Evidence (02 unless noted) | Gate |
|---|---|---|---|
| D1 | Simulated peer presence in production service (`presence.service.ts:8-49`, registered `supabaseService.ts:93`) | §3.1 | G2 |
| D2 | No CI on push/PR — only keepalive cron | §3.1 | G1 |
| D3 | PGRST204 retry silently strips new columns from task writes (`tasks.service.ts:117-125, 172-186`) | §3.1 | G3 |
| D4 | Fetch-all-then-JS-filter hot paths (tasks, today-plan, notes/analytics) | §3.1 | G4 (start in Phase 0, finish with C3 projections in Phase 1) |
| D5 | Cache keys not user-scoped + mock never invalidates | §3.1 | G4 |
| D6 | Six monolithic 1,000–1,600-line pages + 2,987-line mock service | §3.1 | Extract **incrementally as touched** (not a big-bang Phase-0 item) — the audit's own mitigation; extraction continues through Phases 1–2 |

**RECOMMENDATION (EXPERT OPINION, divergence noted):** move **D17** (duplicated schema SQL) and **D18** (generated DB types) from the audit's "improve during V2" tier into Phase 0 as G5. The canonical-model migration (C3) is the riskiest schema work in V2 (07 R2); doing it with two schema truths and unchecked row mappers is avoidable risk. Cost is days, not weeks.

## 2.2 Improve DURING V2 (scheduled into phases)

| # | Debt | Scheduled | Why there |
|---|---|---|---|
| D7 | Client-side host identity heuristics (`useStudyRoom.ts:173-182`) | Phase 2 (M2.8 rooms mechanics) | Touching rooms anyway; server-derived `is_host` |
| D8 | 5 s poll always-on, N+1 profile fetch per chat message | Phase 2 | Same touchpoint |
| D9 | Whole-cache invalidation | Phase 0 (G4) | Cheap, unblocks everything |
| D10 | Zero component tests | Phase 0 (tooling) → seeded per extraction Phases 1–2 | Regression guard where regressions are most user-visible |
| D11 | No telemetry sink; root-only ErrorBoundary | Phase 0 (G6) | Metrics prerequisite |
| D12 | Committed Supabase URL/key fallbacks (`vite.config.ts:19-20`) | Phase 0–1 | Env hygiene before infra changes |
| D13 | Device-local notifications | Phase 1 (inbox/prefs sync via C2); Phase 3 (push impl C25) | Split by dependency |
| D14 | Duplicated LLM JSON parser client+edge | Phase 3 (with C19, which adds parsing code) | Natural touchpoint |
| D15 | Cross-domain write chains without reconciliation (`FocusContext.tsx:715-829`) | Phase 2 | Add periodic reconciler once C7's partial-work records exist to reconcile against |
| D16 | Guest migration silently drops goals/plan-items/time-blocks (`guestMigration.ts:60-66`) | Phase 1 (with C2's migration UX) | Same "honest migration" surface |
| D17 | Schema SQL duplicated | Phase 0 (G5, escalated — see §2.1 note) | Migration risk |
| D18 | 38 `as any` casts; generated types | Phase 0 (G5, escalated — see §2.1 note) | Migration risk |
| D22 | `getMessages` returns oldest 100 (`rooms.service.ts:287-296`) | Phase 2 | Rooms touchpoint |

## 2.3 Can wait (tracked, not scheduled)

D19 (`tsconfig` excludes `vite.config.ts`) · D20 (legacy `NEXT_PUBLIC_` envPrefix) · D21 (keepalive sprawl — **RECOMMENDATION:** opportunistically consolidate to two implementations when CI lands; low urgency) · D23 (only 2 TODO markers — keep the hygiene).

---

# Part 3 — UX Evolution

Every change is stated as **User problem (evidence) → Improvement → Expected benefit**. All problems are VERIFIED in inputs 01/02 unless marked otherwise.

## 3.1 Navigation

- **Problem:** IA is clean and role-named but pages are heavy (Dashboard renders 6+ panels and 5 modals; Settings 1,459 lines), and nav copy carries two competing "plan" vocabularies ("Today" vs "Tasks & Daily Schedule" vs "Study" planner), reinforcing the three-scheduler confusion (01 §5.1 OPINION; 01 §4 break #1).
- **Improvement:** keep the 4-section/11-item shell and ⌘K/⌘J chrome (they work — VERIFIED 01 §5.1); rename plan-related entries to the single canonical vocabulary ("Today", "Planner", "Study"); add **Triages** ("Needs a decision") as a first-class surface with a badge; add **Term** as a view under Planning.
- **Expected benefit:** one mental model of "where is my time"; decisions have one address; navigation stops teaching three schedulers.

## 3.2 Dashboard / Today surface

- **Problem:** due recall is one hop away (break #2); recommendations navigate away and never write back (break #3); dashboard "Active Knowledge" resurfaces notes, not cards (`DashboardPage.tsx:1223-1236`); the plan stays visible after evening closure; aborted work vanishes (break #5).
- **Improvement:** the Today timeline becomes the projection of the canonical model and gains: a **due-review block with live counts + one-tap drill CTA**; triage-queue badge and inline acknowledge/schedule/dismiss; **rest and buffer block types**; post-evening-closure "day is done" detachment state; honest partial-work logging on abort.
- **Expected benefit:** recall becomes part of the day instead of a destination; insights become one tap from executed; the app visibly protects recovery — the calm-over-engagement positioning (08 principle 7) made concrete.

## 3.3 Onboarding & activation

- **Problem:** activation is checklist-driven (good, VERIFIED 01 §5.4) but the mental-model stage carries heavy copy, time-to-first-action is unmeasured (the "42 s" claim is simulation — VERIFIED 01 §3.12), and the hardest real setup step — turning syllabi/PDFs into a structured system — is entirely manual.
- **Improvement:** keep the 3-stage activation modal and Next-Best-Action card; measure activation with real telemetry (G6); add an optional **"import your syllabus"** first-action once C19 ships; sync state makes a second device "just work" (welcome-back/ritual state follows the student).
- **Expected benefit:** measured (not assumed) activation; the most tedious setup step becomes a review instead of data entry; multi-device onboarding is trustworthy.

## 3.4 Planning interactions

- **Problem:** three schedulers with bridges but no owner (break #1); routines need manual "Sync today" on two pages (`DashboardPage.tsx:667-679`, `StudyPage.tsx:394-406`); evening closure creates duplicate tasks instead of linking backlog (`DashboardPage.tsx:728-744`); recurrence is persisted but unbrowsable (01 §3.2 OPINION); terms are rotating grids, not undifferentiated weeks.
- **Improvement:** one canonical model with projections; **auto-materialized routines** at first day load (manual override kept); **link-or-create** evening intentions; a **recurrence browser**; a **term/timetable projection** with rotating class slots; every proposed plan change (habit placement, reflow, collision trade-off) arrives as an **approve-diff**, never a silent edit.
- **Expected benefit:** the "which surface owns my time" question disappears permanently; daily ceremony drops; plans match the institution's shape of the semester; trust is preserved because nothing moves without approval (Motion's opacity lesson via 08 boundary 5).

## 3.5 Session (Focus) interactions

- **Problem:** aborted stopwatch work is discarded ("Elapsed progress … will not be recorded", `FocusPage.tsx:1348-1361` — break #5); switching away from unfinished items leaves attention residue unmanaged; circadian data computes but never acts on break timing; nothing targets avoided tasks.
- **Improvement:** honest **partial-work capture** (duration + optional reason, excluded from streaks, included in minutes/calibration — neutral copy, never shaming, 06 §11 via 08 C7); optional one-line **"next step when I return"** note on early exit/switch (Leroy 2009 via 08 C13); **circadian-timed break proposals** as buffer blocks (approve-diff, A/B'd honestly); **two-minute starter + obstacle-naming kit** on tasks that slip twice (r ≈ .40 via 08 C16).
- **Expected benefit:** analytics sees real-world work; faster calmer re-entry; breaks land on *this* student's dips, not a 25-minute clock; the strongest tractable procrastination lever is pulled at the entry point.

## 3.6 AI interaction patterns

- **Problem:** faithfulness scoring exists but only warns in console — the user can't tell how much to trust an answer ("detect-and-warn, not detect-and-block", VERIFIED 01 §3.13; 02 §1.9); Ask Solis answers but doesn't teach; weekly synthesis narrates but doesn't propose.
- **Improvement (all behind the same invariants — AI proposes, user disposes; AI-absent ⇒ functional):** (a) **surfaced source tier + faithfulness** in every answer ("grounded from your note, line 42"); (b) grounding extended to plans/sessions/review history; (c) **Socratic Tutor Mode** with a hard no-final-answers contract and hint ladders (Harvard RCT applies only to constrained tutors — VERIFIED via 08 C27); (d) **AI-drafted plans validated by deterministic feasibility math before shown**, rejected drafts carry the failing constraint; (e) **weekly review agent** drafting next week as one approve-diff with numbers-in-prompt only; (f) ingestion structuring with schema validation and per-field confirmation.
- **Expected benefit:** trustworthy, checkable AI that leverages data ChatGPT doesn't have (05 §4 via 08 boundary 2); Scout-class convenience without Motion-class autonomy; the weekly review actually closes the cycle.

## 3.7 Notifications

- **Problem:** inbox/prefs are device-local (`solis_notifications_inbox_v1`); no server push (`webPushEnabled: false`) — reminders don't reach a closed laptop, which guts WOOP if-then reminders (unreinforced intentions fail — Wang 2021 via 08 C25).
- **Improvement:** synced inbox/prefs (C2); **decision taken early** to build real Web Push scoped to **deterministic schedule triggers only** (block start, hour review, WOOP if-then at trigger time, due-review counts); quiet hours enforced server-side; payloads minimal (counts/titles); **no AI-generated nudges ever** (decline D2).
- **Expected benefit:** triggers fire on the device in hand when they matter; the notification surface stays calm and explainable.

## 3.8 Mobile

- **Problem:** web-only is a churn filter at student prices (VERIFIED via 07 G2); small-viewport runtime was **never verified** in any input; rooms/exam modals are dense on phones (01 §5.2 OPINION); no installable surface or widgets.
- **Improvement:** **audit first** (real devices + Lighthouse + axe — Phase 0, G7); PWA installability with the existing service worker hardened; fix dense modals; home-screen widgets for due counts / focus quick-start / capture (PWA shortcuts + share-target first, OS widgets where reachable); lock-screen widget data limited to counts.
- **Expected benefit:** present at the moment of capture and the moment of recall — the phone; parity with every serious competitor (03 §2 via 08 C21) without native-store scope creep in V2.

## 3.9 Accessibility

- **Problem:** aria coverage uneven (aria-label in 28 of the feature files); many custom divs are click-targets with unverified keyboard operability; Lighthouse/axe **never run** (VERIFIED 01 §5.3; R10).
- **Improvement:** Lighthouse + axe gate in CI (Phase 0, G1/G7) with budgets; keyboard operability audit for custom click-targets; every new V2 surface ships with the gate.
- **Expected benefit:** accessibility becomes an invariant, not an afterthought; V2's large UI program cannot silently regress it.

## 3.10 Command palette, search & natural-language workflows

- **Problem:** ⌘K palette + ⌘J Ask Solis work (VERIFIED 01 §5.1) but search covers only existing entities; the deterministic NLP capture parser is the only NL entry point.
- **Improvement:** palette/search index extends to canonical-model entities, typed records, saved views, and triage items ("schedule the retention warning", "open unresolved exam questions for CS210"); NL capture stays deterministic-first (LLM fallback only on explicit user invocation — decline D6); grounded Ask Solis answers now cite the richer entity graph.
- **Expected benefit:** the keyboard path reaches everything V2 adds without new chrome; capture stays instant, offline, free.

## 3.11 Proposed V2 Information Architecture (tree)

Legend: **[V1]** exists today (verified in 01 §2/§3) · **[V1→V2]** exists, materially changed · **[V2]** new.

```
Solis
├── Public
│   ├── Landing [V1]
│   └── Auth (login / signup / reset) [V1]
└── App (shell: sidebar, header, ⌘K palette, ⌘J Ask Solis, MiniFocusPlayer) [V1]
    ├── TODAY (dashboard) [V1]
    │   ├── Morning ritual → pre-composed day [V1→V2: auto-materialized routines,
    │   │    capacity from calibration ledger, habit windows placed, review block,
    │   │    WOOP if-then reminders, collision warnings]
    │   ├── Daily timeline [V1 derived → V2 projection of canonical schedule]
    │   │   ├── Due-review block + drill CTA with counts [V2]
    │   │   ├── Rest / buffer / external-calendar entries [V2]
    │   │   └── Detachment state after evening closure [V2]
    │   ├── Evening closure → link-or-create intentions [V1→V2]
    │   ├── Triage badge → Needs-a-decision inbox [V2]
    │   ├── Reflections strip [V1] → unified reflections timeline [V1→V2]
    │   └── Welcome-back / gentle start [V1→V2: state synced]
    ├── PLANNING
    │   ├── Tasks: list / day / 7-day / Eisenhower views, NLP capture, undo [V1]
    │   │   └── Recurrence browser [V2]
    │   ├── Planner (hourly + weekly, calendar overlay) [V1→V2 projection]
    │   ├── Study agenda (today queue) [V1→V2 projection]
    │   ├── Term view (15-week arc; feasibility summary) [V2]
    │   └── Timetable grid (rotating class slots) [V2]
    ├── FOCUS [V1]
    │   └── [V2] partial-work capture · next-action note · adaptive break proposals ·
    │        anti-avoidance kit (two-minute starter / obstacle naming)
    ├── STUDY & KNOWLEDGE
    │   ├── Subjects & syllabus topic trees [V1]
    │   ├── Flashcards & spaced review (FSRS/SM-2, Anki IO, exam cram) [V1]
    │   │   └── [V2] retrieval tickets · exam-anchored intervals · workload caps ·
    │   │        confidence-before-reveal + calibration score
    │   ├── Notes (wiki-links, graph, autosave, pins, history) [V1]
    │   │   └── [V2] typed records (Lecture/Reading/ExamQuestion/Mistake) · saved views ·
    │   │        related-content suggestions (one-tap accept)
    │   ├── Ingestion (syllabus / PDF / document import → review-and-confirm) [V2]
    │   └── Ask Solis [V1] → [V2] surfaced faithfulness & source tier · grounded plans/
    │        sessions/history · Socratic Tutor Mode
    ├── PROGRESS
    │   ├── Analytics (tiles, trends, insights, heatmap) [V1]
    │   │   └── [V2] calibration ledger · slippage forecasts · collision radar ·
    │   │        weekly load budget · rooms-vs-solo measurement
    │   ├── Goals & exams (milestones, feasibility, plan generation) [V1]
    │   │   └── [V2] WOOP wizard (Wish→Outcome→Obstacle→If-Then) + fallback branches
    │   ├── Habits (streaks, heatmap, tiers) [V1]
    │   │   └── [V2] weekly-consistency scoring · scheduled habit windows
    │   ├── Weekly review [V1] → [V2] prediction-vs-actual spine · next-week approve-diff
    │   └── Scholar Report [V1→V2: linked from exams/goals]
    ├── TOGETHER
    │   ├── Study rooms (join-by-code, synced timer, host failover, chat) [V1]
    │   │   └── [V2] goal declaration · closing check-in · recurring sessions
    │   └── Pacts [V1] → [V2] measured-experiment pact board (behavioral stakes only)
    ├── SETTINGS [V1]
    │   └── [V2] sync-state per data class · notification/push prefs · calendar
    │        subscriptions · BYOK key management [V1]
    └── GUIDES [V1]
```

---

# Part 4 — The Complete V2 Blueprint

**Vision** (from input 08 §0, adopted): Solis V2 turns V1's proven deterministic study brain into a system that closes its own loops — one canonical schedule model, state that follows the student across devices, and every recommendation one tap from executed. It is built for the self-directed, exam-driven student on multiple devices: real course material flows in and becomes scheduled, exam-anchored recall, and memory state pushes back on the calendar. Its AI never acts alone — it proposes drafts grounded in the student's own data, deterministic engines verify, the user disposes.

- **Target users** — Primary: the self-directed, exam-driven student (undergrad/master's or serious self-learner), 2–6 courses/term, 2–5 h/day, laptop + phone, currently gluing Calendar + Anki/Quizlet + notes + a focus timer (08 §1.2). The accountability cohort with an ADHD lens is in scope (Flow Club pricing/62% ADHD finding, VERIFIED via 08 §1.2). Not for: quiz-crammers, workflow teams, blank-canvas builders (08 §1.2 EXPERT OPINION).
- **Core problems solved** — (1) "My plan doesn't know what I remember" (memory never pushes on the calendar — 03 §6.1 via 07 X7); (2) "The app tells me things but makes me do the work" (analytics without write-back — 01 §4 break #3); (3) "My tools don't accept my actual material" (no ingestion — 03 §5 via 07 G1); (4) "My second device doesn't know me" (~40 device-local keys — 01 §1).
- **Value proposition** — Three pillars (08 §1.4): the **deterministic study brain** (explainable, offline, free — never an LLM's guess); **the closed loop** (everything updates everything; every recommendation one tap from executed; memory renegotiates the calendar with approval diffs); **trust by construction** (BYOK, export everything, free learning loop forever, AI proposes/user disposes).
- **Core product loop** — Seven stages (07 Part 3): **Trigger** (deterministic, explainable — morning ritual, due counts, triage badge, WOOP if-then) → **Plan** (pre-composed day; optional AI draft validated by deterministic math; fallback branches) → **Act** (context-carried focus; next-action notes; witnessed commitment) → **Track** (auto-cascade backbone + confidence ratings + honest partial work) → **Understand** (deterministic intelligence with receipts; triage queue; grounded/tutor AI narrating computed numbers) → **Adapt** (slippage, collisions, review reflow — all approve-diffs; one-tap recovery framing) → **Improve** (estimates converge on the student's real pace; weekly review closes the cycle). Excluded from the loop by design: AI interruption, silent rescheduling, gamified churn, identity-goal celebration, paywalled study modes, monetary stakes (07 §3.2).
- **Major systems** — Canonical schedule model + projections; state-continuity service; proposal/triage layer; deterministic intelligence engines (existing) + calibration ledger; study engine (FSRS backbone + retrieval tickets); ingestion pipeline; integration adapters (ICS in, ICS/Anki/JSON/CSV out); rooms/pacts collaboration; notification/push; AI proposal layer (Ask/Tutor/drafting/narration); observability.
- **Major capabilities** — C1–C35 of input 08 (Part 5 maps them to phases); headline: one schedule model, synced state, due review in the day, triage write-back, unified reflections, frictionless day, calibration ledger, WOOP, evidence-aligned habits, retrieval tickets, confidence quizzing, detachment gate, collision radar, rooms mechanics, ingestion, ICS subscriptions, mobile PWA + widgets, term projection, FSRS-6, push, grounded AI, tutor, plan drafts, review agent, retention-aware replanning, term feasibility, experiments.
- **UX direction** — Calm over engagement; one planning vocabulary; projections over surfaces; every insight a decision object; approval diffs on every proposed change; mobile-equal; a11y gated in CI; honest failure states everywhere (preserving V1's most consistent quality, 01 §4). Details in Part 3.
- **AI/automation strategy** — Deterministic-first: 12 automation opportunities (A1–A12) need no AI; AI strictly a proposal layer (A13–A19): ingestion structuring, plan drafting behind validation, grounded Q&A, constrained tutoring, numbers-in-prompt narration, optional voice. No agents, no tool loops, no memory layer, no LLM engine replacement (declines D1–D7). BYOK structural; meter only generative AI.
- **Collaboration strategy** — Witnessed commitment, not a network: goal declaration + closing check-in in rooms (Focusmate's verified-effective mechanics via 08 C18), recurring sessions, pacts with behavioral stakes shipped as a labeled measured experiment (C32; evidence-weak, honest copy per R12); value at zero participants mandatory (Clockwise lesson via 07 §2.2); share behaviors, never identities (Gollwitzer via 06 §4).
- **Analytics strategy** — The deterministic engine stays the shared brain; its only output surfaces are the triage queue and timeline markers, and insight objects write back (acknowledge/schedule/dismiss). V2 adds the calibration ledger (planning + metacognitive), slippage forecasts, collision radar, load budget, and term feasibility — all deterministic, all with evidence receipts. Product analytics (opt-in telemetry) is strictly separated from the student's learning data.
- **Integration strategy** — Symmetric adapters: inputs (narrow document ingestion, read-only ICS URL subscriptions, existing LMS/deck import) land in the canonical model; outputs (ICS export, Anki, JSON/CSV, Markdown) leave it. No OAuth agents, no proprietary lock-in; Google two-way sync deferred to V3 (OAuth control risk via 08 C20/D5).
- **Architecture direction** — Summarized in Part 1: protect the abstraction and engines; refactor reads/cache/pages; add canonical model, proposals, state continuity, ingestion, push, observability; no rewrites (decline D14).
- **Security/privacy direction** — RLS on every new table; BYOK unchanged (sessionStorage default); ICS URLs encrypted at rest; push payloads minimal; on-device STT default for dictation; documents go to AI only via the user's key or the existing edge path with documented flows; no third-party data sharing; remove committed URL/key fallbacks (D12); the free learning loop is itself a privacy posture (core flows never require a vendor).
- **Scalability direction** — Fix the read path before layering (date-scoped queries, pagination, memoization boundaries); per-room-scoped realtime stays the right shape; the intelligence snapshot gains memoization seams; storage of large artifacts (PDFs) remains client-side unless ingestion proves a server need — an explicit V2 product decision, not an accident (02 §4.7).
- **Differentiation strategy** — Diff1 explainable receipts (already nearly unique, 03 via 07 §1.7); Diff2 retention-aware replanning (flagship — the loop nobody closes); Diff3 BYOK validated planning; Diff4 pacts (measured); Diff5 term feasibility; Diff6 grounded tutor; Diff7 honest freemium; Diff8 the cross-domain wiring itself. Lead with Diff2 + ingestion: "material in, memory-aware schedule out."
- **Explicit non-goals** — The 14 declines (08 §2.6): autonomous agentic replanning; proactive AI nudges; LLM memory layers; live voice tutor/companion; autonomous OAuth/tool/MCP agents; LLM-per-capture parsing; LLM as the intelligence engine; gamification theater; identity-goal sharing; monetary stakes; a social network (strangers/feeds); infrastructure-heavy ingestion (audio transcription, photo scan — V3); AI auto-filing of notes; platform/storage rewrite. Plus: no paywalled study modes, no native-app rebuild before PWA parity, no two-way Google OAuth in V2.

---

# Part 5 — Strategic Roadmap (dependency-ordered)

## 5.1 Why this order (the dependency logic, not habit)

The sequence below is forced by five dependency chains, each traceable to the inputs:

1. **Risk chain:** CI + fail-loud schema + scoped cache (Phase 0) must precede the two biggest migrations V2 will ever run — state continuity (C2) and the canonical model (C3) — because 07 R2/R5/R6 make regression and drift the dominant risks (Logseq rewrite warning via 07 R2).
2. **Model chain:** the canonical schedule model (C3) is the prerequisite for due-review blocks (C4), "schedule" actions in triage (C5), habit placement (C10), breaks/buffers (C15), collision math (C17), AI plan writes (C28), review-agent diffs (C29), retention-aware reflow (C30), and term feasibility (C31) — "you cannot reflow what isn't one model" (07 §2.1). It must precede all of them.
3. **Truth chain:** synced state (C2) must precede widgets and push (widgets/push that show device-local state would lie about it — 08 §3.4 borderline note) and precedes honest multi-device metrics.
4. **Value chain:** loop closure (Phase 1) precedes intake (Phase 3) because ingested material poured into three scheduling vocabularies and a non-writing analytics surface would deepen the debt, not close it (07 Part 4's stated reason). Depth (Phase 2) precedes reach for the same reason.
5. **Trust chain:** the proposal/approve-diff layer and surfaced confidence (Phase 1) must exist before AI drafting and replanning (Phase 4) arrive — otherwise the product's trust invariant is retrofitted under pressure (07 R7; 08 principle 2).

Named deliberately: **0 Guardrails → 1 Loop Closure → 2 Evidence Depth → 3 Intake & Reach → 4 AI Differentiation.** This matches input 07 Part 4 and 08 §3.5; where this document resolves an inconsistency in those inputs it says so inline (§5.3 note; §6 note).

> **Sizing caveat (EXPERT OPINION):** phases are ordered, not dated. C3 is XL and C2 is L (08 §2.1); a single-developer-scale team should treat Phase 1 as the quarter-scale effort and resist calendar-compressing it. Phase 0 is deliberately small (days–weeks) so the gate is real.

## 5.2 Phase 0 — Guardrails & Integrity (the gate)

| Field | Content |
|---|---|
| **Objective** | Make the codebase safe to change and honest to users: CI, integrity repairs, schema truth, scoped cache/reads, instrumentation, platform audits, early decisions. |
| **Why now** | Every later phase multiplies on these codepaths; CI is "the single cheapest high-value fix" (02 §5); simulated presence in production is an integrity defect blocking all social work (07 R4/X6); the PGRST204 strip would corrupt the C2/C3 migrations (07 R6); no runtime/a11y audit has ever been run (01 §0/§5.2/§5.3). |
| **Problems solved** | D1, D2, D3, D4 (start), D5, D9, D11, D12, D17, D18; R3–R6, R9, R10 gates. |
| **Systems affected** | CI/deployment, cache, read paths, presence service, schema tooling, telemetry, tests. |
| **Improvements included** | User-scoped cache keys; per-channel invalidation; date-scoped task/today-plan reads; mock cache invalidation; server-side host-identity groundwork; keepalive consolidation (opportunistic). |
| **New capabilities included** | CI pipeline + Lighthouse/axe budget gate; deploy-time schema check; generated DB types; single schema source; opt-in metrics/error sink + per-route error boundaries; mobile runtime audit; a11y audit; **C25 push decision taken**; FSRS-6 evaluation harness started. |
| **Architectural changes** | G1–G8 (§1.4). No product-schema changes yet. |
| **UX changes** | None user-facing except honesty: simulated ambient peers removed or clearly labeled; truthful sync/error states preserved. |
| **AI/automation changes** | None. (AI telemetry sink-or-delete decision executed — X5.) |
| **Dependencies** | None — this is the dependency. |
| **Risks** | Audit findings could surface rework (07 R9) — that is the audit's purpose; regression risk in cache/read changes mitigated by running the green suite locally per change until CI exists. |
| **Expected user impact** | Indirect: honest presence data, no visible change otherwise. |
| **Expected product impact** | The enablement layer: every subsequent PR guarded, every migration checked, every claim in §7 measurable. |
| **Definition of done** | CI green on every push (typecheck + 1,162-test suite + build + Lighthouse/axe budgets); ambient presence backed by real Presence or removed/labeled; task writes fail loudly on schema mismatch; cache keys user-scoped and invalidation per-channel; hot reads date-scoped; metrics sink receiving events (opt-in); audits' findings logged with severity; push and FSRS-6 decisions recorded. |
| **Explicitly NOT included** | Any V2 feature surface; big-bang page extraction (incremental only, as touched); presence *features* beyond the honesty fix. |

**Milestones (Phase → Milestone → Capability group → Feature; no coding tickets):**

| Milestone | Capability group | Features |
|---|---|---|
| M0.1 Guardrails live | CI & integrity | CI workflow; Lighthouse/axe budget gate; deploy-time schema check; PGRST204 fail-loud |
| M0.2 Honest data | Presence integrity | Real-Presence-backed ambient widget (or labeled/removal); honest empty states |
| M0.3 Safe reads & caches | Performance & correctness | User-scoped cache keys; per-channel invalidation; date-scoped task/today-plan reads; mock invalidation parity |
| M0.4 Instrumentation | Observability | Opt-in product telemetry; error sink; per-route error boundaries; AI-telemetry sink-or-delete |
| M0.5 Schema truth | Data foundations | Generated DB types; single schema source; committed key/URL fallbacks removed |
| M0.6 Decisions & audits | Platform | Mobile runtime audit; a11y audit; push build/reposition decision; FSRS-6 benchmark harness |

## 5.3 Phase 1 — Loop Closure (the identity)

| Field | Content |
|---|---|
| **Objective** | Repair every VERIFIED loop break of 01 §4: one schedule model, synced invisible state, recall in the day, analytics that writes back, unified reflections, frictionless day mechanics. |
| **Why now** | The model chain (§5.1 #2): C3 gates C4/C5/C10/C15/C17/C28/C29/C30/C31. Consolidations precede additions (rule 5); "a new device sees the same day" is the exit test (08 §3.5). |
| **Problems solved** | Breaks #1–#5 (01 §4); G4/G6/G8/I1–I6/O2/O6; X1/X2; U6 (surfaced confidence). |
| **Systems affected** | Canonical schedule tables + projections; state-sync service; proposals service; pub/sub channels; notification inbox storage; reflections read model. |
| **Improvements included** | Routine auto-materialization at day load; evening link-or-create; honest partial-work capture; drift-pad reader; per-channel invalidation completed. |
| **New capabilities included** | C2, C3, C4, C5, C6, C7, C26(a) surfaced faithfulness. |
| **Architectural changes** | New `schedule`, `state_sync`, `proposals` domains in `IDataService` (17 domains); localStorage demoted to offline cache; projection layer over the four existing surfaces; backfill migration of three vocabularies. |
| **UX changes** | Today timeline becomes the single projection with review/rest/buffer blocks; triage inbox with badge; unified reflections timeline; sync-state indicators per data class; honest migration messaging (D16). |
| **AI/automation changes** | Deterministic only (auto-materialization, review-block materialization, insight-state machine); surfaced faithfulness is pure UI over existing scores (`ai.service.ts:621`). |
| **Dependencies** | Phase 0 gate (all of G1–G8). |
| **Risks** | Largest migration risk in V2 (07 R2) — mitigated by projections-first sequencing (surfaces rewrite later, not at once), incremental backfill, CI; partial-migration inconsistency — per-class shipping with visible sync state (08 C2). |
| **Expected user impact** | The daily surface finally answers "what's due, what needs deciding, what's left"; rituals/pins/history follow the student across devices; three daily frictions vanish. |
| **Expected product impact** | The identity ships: the loop closes. This is the release-defining phase (Core tier, 08 §3.2/§3.3). |
| **Definition of done** | A commitment created on any surface exists once in the canonical model and renders on all four projections; a second device sees intention/ritual/pins/history/inbox; due-review block shows live counts with a working drill CTA; every insight can be acknowledged/scheduled/dismissed with persistence; parked thoughts resurface; partial sessions recorded; surfaced confidence visible on every AI answer. |
| **Explicitly NOT included** | Habit scheduling, calibration, WOOP, breaks, collisions (Phase 2); ingestion/calendar/mobile/push (Phase 3); AI drafting (Phase 4). |

> **Input-inconsistency resolution (stated per the standard):** input 08 §3.5 lists C23 (typed records) in Phase 2, while C23's own priority row says Phase 3 and 07 Part 4 places typed records (U12) in Phase 3. **RECOMMENDATION:** split it — the typed-record *schema* and saved views over existing notes land early in Phase 2 (they feed C11's retrieval tickets, whose dependency row in 08 lists "C22" where the surrounding text makes clear C23/typed records is meant); document-typed records and related-content suggestions (C33) ride C19 in Phase 3. This resolves both inconsistencies once, here.

**Milestones:**

| Milestone | Capability group | Features |
|---|---|---|
| M1.1 One schedule model | Canonical model & projections | Schedule entity (fixed/flexible/defended, provenance); backfill of tasks/plan-items/blocks; projections for timeline/planner/agenda/overlay |
| M1.2 State follows the student | State continuity | Intention, ritual flags, welcome-back, gentle-start, pins, note history, notification inbox/prefs → cloud; sync-state UI; honest migration messaging |
| M1.3 Recall in the day | Due review | Review block type; day-start materialization from FSRS due counts (capped); drill CTA |
| M1.4 Decisions close their loops | Triage & write-back | Proposal objects + triage inbox (acknowledge/schedule/dismiss, persisted dismissals, badge); unified reflections timeline; drift-pad reader |
| M1.5 Frictionless day | Day mechanics | Auto-materialized routines; link-or-create evening closure; honest partial-work capture |
| M1.6 Trustable answers | AI confidence (surfacing) | Source tier + faithfulness shown in the answer UI |

## 5.4 Phase 2 — Evidence-Backed Depth

| Field | Content |
|---|---|
| **Objective** | Load the closed loop with the mechanisms the evidence demands — all deterministic, all citation-carrying. |
| **Why now** | Every item rides the Phase-1 model (C8 consumes partial-work data; C10/C15 consume C3 placement; C17 consumes C3+C8+C5). Evidence strength is highest here (06 §1/§2/§4/§7/§9 via 08); rule 14 satisfied by sequencing after foundations. |
| **Problems solved** | U2–U5, U7–U9; A1–A9, A11, A12; O5-adjacent rooms debts (D7, D8, D15, D22); X3 (interruption trends), X4 (Scholar Report links). |
| **Systems affected** | Intelligence engines (calibration, collisions, budget), goals, habits, review surfaces, rooms realtime, focus flow. |
| **Improvements included** | Server-derived host identity; poll back-off; N+1 profile fix; write-chain reconciler; newest-first room messages; interruption trend view; Scholar Report links from exams. |
| **New capabilities included** | C8, C9, C10, C11, C12, C13, C14, C15, C16, C17, C18, C23(core: typed-record schema + saved views). |
| **Architectural changes** | Calibration ledger as a pure computation over existing estimates/actuals; habit-window and buffer/rest/break entry types exercised in C3; goal fields (obstacle/if-then/fallback); push triggers defined (data) though push ships in Phase 3. |
| **UX changes** | WOOP wizard; consistency-first habit framing ("6/7 days", month-scale copy); confidence tap before reveal; detachment gate ("day is done"); two-minute starter; collision radar trade-off prompts; room declaration/check-in. |
| **AI/automation changes** | None required (all deterministic); WOOP AI drafting explicitly optional and speculative (06 §4 via 08 C9). |
| **Dependencies** | Phase 1 (C3 mandatory; C5 as the sink for proposals; C2 for synced check-ins). |
| **Risks** | Alert/proposal fatigue (C15/C17) — caps + persisted dismissals; small-sample overcorrection in the ledger — minimum-count thresholds and "insufficient data" honesty (08 C8); habit placement autonomy creep — approval gates mandatory; overclaiming barred (R12): procrastination and rooms copy stays scaffold-framed. |
| **Expected user impact** | The app gets measurably smarter about *this student's* pace weekly; habits survive real weeks; review load respects capacity; recovery is protected. |
| **Expected product impact** | Depth the evidence demands — the differentiator building blocks (C8 feeds C29/C30/C31) are in place. |
| **Definition of done** | Visible "your estimates run X% optimistic" with per-item slippage forecasts; every generated plan carries a fallback branch; habit headline is weekly consistency with scheduled windows; review caps enforced with overflow pushed forward; confidence calibration score live; next-action notes pre-fill unfinished items; evening closure hides the plan; rooms record declarations and check-ins into analytics. |
| **Explicitly NOT included** | AI drafting of plans/reviews (Phase 4); ingestion; mobile widgets; term/timetable surfaces (Phase 3–4). |

**Milestones:**

| Milestone | Capability group | Features |
|---|---|---|
| M2.1 Honest pace | Calibration | Ledger; slippage forecasts; auto-segmentation of >90-min captures; capacity inflation |
| M2.2 Obstacle-first goals | WOOP | 4-step wizard; trigger-time if-then reminders; fallback branches in generated plans |
| M2.3 Habits that survive | Habit system | Weekly-consistency scoring; month-scale framing; scheduled habit windows with approve-diff re-placement; context-stability prompt |
| M2.4 Recall beyond flashcards | Retrieval depth | Retrieval tickets (typed sources); exam-anchored 10–20% interval biasing; daily review-minute caps with overflow |
| M2.5 Metacognitive honesty | Confidence | Confidence-before-reveal; per-subject calibration score |
| M2.6 Focus-loop edges | Attention & recovery | Next-action notes; detachment gate + rest blocks; adaptive break proposals (A/B'd); anti-avoidance kit |
| M2.7 Workload foresight | Collision intelligence | Deadline collision radar; weekly load budget; interruption trends; Scholar Report links |
| M2.8 Witnessed commitment | Rooms mechanics | Goal declaration; closing check-in; recurring sessions; rooms-vs-solo measurement; rooms realtime debts (D7/D8/D22) closed; write-chain reconciler (D15) |

## 5.5 Phase 3 — Intake & Reach

| Field | Content |
|---|---|
| **Objective** | Accept the student's real material and be present on the phone: narrow ingestion, live calendar, PWA baseline + widgets, term projection, FSRS-6, push. |
| **Why now** | The value chain (§5.1 #4): material must enter a *working* schedule. The truth chain (§5.1 #3): widgets and push are honest only after C2 syncs state. Table stakes #2/#4 were missed outright (03 §5 via 07 G1/G2). |
| **Problems solved** | G1, G2, G3, G5, G7, O1, O3; U12 (document-typed records); D14 (parser dedup with C19); A10. |
| **Systems affected** | Ingestion pipeline; subscriptions; PWA/service worker; timetable projection; FSRS engine; push edge function. |
| **Improvements included** | Keepalive consolidation completed; LLM JSON parser dedup (D14). |
| **New capabilities included** | C19, C20, C21 (PWA baseline + widgets), C22, C24, C25 (implementation), C23/C33 (document-typed records + related-content suggestions). |
| **Architectural changes** | Extraction→structur→validation→confirm pipeline with provenance store; ICS polling with backoff and encrypted URL storage; push evaluator edge function; FSRS-6 behind the same interface with state-preserving migration, feature-flagged. |
| **UX changes** | Import review screen (per-field confirmation, source citations); subscription sync-state UI; installable home-screen app + widgets (counts only on lock screen); timetable grid + term view; honest browser-push capability copy (iOS limitations). |
| **AI/automation changes** | First Core-AI feature (ingestion structuring, schema-validated, BYOK/edge path, every field user-confirmed; unparseable files fall back to manual entry — rule 4). |
| **Dependencies** | C3 (output lands in the model); C2 (synced state for widgets/push); C1 (CI for the new pipeline); C4 (widget content = due counts); Phase-0 push decision. |
| **Risks** | PDF-extraction quality is the hard part even for incumbents (StudyFetch reviews via 08 C19) — narrow first (syllabus/PDF/text), manual fallback; hallucinated dates are "the dangerous one" — schema validation + mandatory confirmation; provider throttling on ICS polling — backoff + honest sync state; mobile audit may surface rework (accepted, R9); FSRS-6 ships only if the benchmark on V1's own logs wins (08 §3.4). |
| **Expected user impact** | Hours of setup become a review; the plan reflects real life via the calendar; the phone is a first-class surface; reminders reach the device in hand. |
| **Expected product impact** | The two missed table stakes close; the expectation-setter (ingestion) converts into Solis's home advantage because output enters a real schedule (03 §7.1 via 08). |
| **Definition of done** | A dropped syllabus produces a user-confirmed topic tree + exam dates + draft cards entering the canonical model with citations; a subscribed ICS overlays fixed entries and feeds collision warnings; the app installs and shows truthful due-count widgets; timetable rotation renders; FSRS-6 decision shipped or documented with benchmark results; deterministic triggers push cross-device with quiet hours. |
| **Explicitly NOT included** | Lecture-audio transcription, photo Schedule Scan (V3 — D12); two-way Google/Outlook OAuth (V3); native store apps. |

**Milestones:**

| Milestone | Capability group | Features |
|---|---|---|
| M3.1 Material flows in | Ingestion | Syllabus/PDF/text import → review-and-confirm → schedule + cards; provenance |
| M3.2 The calendar is real | Subscriptions | Read-only ICS URL subscriptions; overlay entries; collision inputs |
| M3.3 The phone catches up | Mobile | PWA installability; modal fixes; widgets (due counts / quick-start / capture); share-target |
| M3.4 The term has a shape | Term layer | Timetable projection with rotation; term view feeding feasibility |
| M3.5 The engine modernizes | FSRS-6 | Benchmark verdict; state-preserving upgrade behind flag (or documented decline) |
| M3.6 Triggers reach the device | Push | Web Push for deterministic schedule triggers; server-side quiet hours; minimal payloads |
| M3.7 Structure compounds | Typed records | Document-typed records; related-content one-tap suggestions |

## 5.6 Phase 4 — AI Differentiation & Compounding

| Field | Content |
|---|---|
| **Objective** | Ship the differentiators that compound everything before them — strictly as a proposal layer: grounded ask, tutor, validated drafting, review agent, retention-aware replanning, term feasibility, measured experiments. |
| **Why now** | Trust chain (§5.1 #5): the proposal layer, receipts, calibration numbers, and collision math exist; AI features now compose with them instead of being retrofitted. Differentiators compound prior phases (08 §3.5). |
| **Problems solved** | X7/Diff2 (the loop nobody closes); Diff3–Diff6; A14–A19; U6(b); U10/U11; the retention-aware replanning flagship (C30). |
| **Systems affected** | AI service (grounding index, tutor contract), proposals layer (consumer #1), weekly review, term view, pacts. |
| **Improvements included** | Grounding extended to plans/sessions/review history; retrieval index covers canonical entities. |
| **New capabilities included** | C26(b), C27, C28, C29, C30, C31, C32, C34, C35. |
| **Architectural changes** | No new infrastructure. Validator = existing feasibility + C8 capacity + C17 collision math gating drafts before display; numbers-in-prompt for narration; experiments instrumented with pre-declared metrics. |
| **UX changes** | Tutor Mode toggle with hint-depth settings; plan drafts as approve-diffs with named failing constraints on rejection; weekly review's prediction-vs-actual spine; reflow proposals with evidence receipts; pact board (behavioral stakes, read-only aggregation); dictation button; "feels worse, works better" interleaving labels. |
| **AI/automation changes** | The phase *is* the AI layer — all behind the invariants (AI proposes/user disposes; AI-absent ⇒ functional; deterministic engines compute every number; no silent writes). |
| **Dependencies** | C3, C5, C8, C11, C12, C17, C22, C26; BYOK path. |
| **Risks** | Trust risk if reflows feel automatic — the approve-diff is the whole design (07 R7); over-proposal — conservative thresholds, persisted dismissals; agent-washing pressure resisted (R8; Gartner >40% cancellation VERIFIED via 08 §3.2); experiments may show null results — pre-declared metrics and honest reporting are the point (R12). |
| **Expected user impact** | The schedule finally answers to memory; the week closes as a proposal; tutoring is integrity-safe and course-grounded; early honest warnings at term scale. |
| **Expected product impact** | The moat: Diff2 (flagship), Diff5, Diff6 live; everything respects the declined list. V2 definition of done (08 §3.6) satisfied: Core complete, High Value substantially shipped, ingestion **and** retention-aware replanning live, experiments instrumented. |
| **Definition of done** | Retention-aware replanning proposes reflows as approve-diffs in production; AI plan drafts are validator-gated with named constraints; weekly review closes with a one-diff proposal; Tutor Mode enforces its contract; term feasibility computes across the arc; pacts/voice/interleaving run with pre-declared success metrics. |
| **Explicitly NOT included** | Any decline D1–D14 (unchanged); autonomous execution of AI drafts; new infrastructure. |

**Milestones:**

| Milestone | Capability group | Features |
|---|---|---|
| M4.1 Trustworthy grounding | Ask Solis deepening | Extended grounding; richer citations over canonical entities |
| M4.2 Learning, not answers | Tutor | Socratic Tutor Mode; hint ladders; non-moralizing usage logging |
| M4.3 Drafting under verification | Plan drafts | Validator-gated week/plan drafts; approve-diff; named rejections |
| M4.4 The week closes | Review agent | Prediction-vs-actual spine; next-week approve-diff; numbers-in-prompt narrative |
| M4.5 Memory pushes back | Retention-aware replanning (flagship) | Threshold-driven reflow proposals; evidence receipts; approve-diff only |
| M4.6 The honest term | Term feasibility | Per-subject feasibility across the 15-week arc; early warnings with recovery actions |
| M4.7 Measured experiments | Experiments | Pacts board (behavioral stakes); voice dictation (on-device first); interleaved sets (same-type gated, delayed measurement) |

---

# Part 6 — Priority Map

Tier names per 08 §3.2. **P0 Must** (release gate) · **P1 Must** (Core) · **P2 High** · **P3 Differentiator/Reach** · **P4 Experimental** · **Do Not Build**. Dependency column names the hard prerequisites.

| Priority | Capability | Reason | Dependency | Phase |
|---|---|---|---|---|
| P0 Must | C1 Engineering foundations & integrity repairs (incl. D17/D18 escalation) | Every later phase multiplies these codepaths; CI cheapest high-value fix (02 §5); presence is an integrity defect (R4) | None | 0 |
| P0 Must | Mobile + a11y runtime audits; push decision; FSRS-6 evaluation kickoff | Gates all UI work (R9/R10); scope decisions for Phase 3 | C1 (CI for gates) | 0 |
| P1 Must | C2 Cross-device state continuity | ~40 device-local keys strand intention/rituals/pins/inbox (01 §1; break #4); enables truthful widgets/push | C1 | 1 |
| P1 Must | C3 One canonical schedule model | Single largest IA debt (01 OPINION); gates C4/C5/C10/C15/C17/C28/C29/C30/C31 ("cannot reflow what isn't one model", 07 §2.1) | C1, C2 | 1 |
| P1 Must | C4 Due review in the daily surface | VERIFIED break #2; smallest closure of the strongest engine; daily frequency | C3 | 1 |
| P1 Must | C5 Triage queue & analytics write-back | VERIFIED break #3; converts analytics to a control surface; sink for all proposals | C3 | 1 |
| P1 Must | C6 Unified reflections + drift-pad reader | VERIFIED X1/X2; cheap read-side consolidation | C5 | 1 |
| P1 Must | C7 Frictionless day mechanics | Three VERIFIED daily frictions (I2/I4/I6); feeds C8's data | — (C8 benefits) | 1 |
| P1 Must | C26(a) Surfaced AI confidence | S-effort trust repair of U6; AI safety machinery already exists but invisible | Existing AI service | 1 |
| P2 High | C8 Calibration ledger & slippage | Strongest evidence base (06 §1 via 08); building block of flagship C30/C31 | C7 (honest partials), C5 | 2 |
| P2 High | C9 WOOP goal wizard | g=0.336/0.255 academic (Wang 2021 via 08); unserved by all surveyed competitors | Notifications; C3 (fallbacks) | 2 |
| P2 High | C10 Evidence-aligned habits | Singh 2024 rewrites the habit contract (via 08); tracked-but-never-scheduled (X8) | C3, C8 | 2 |
| P2 High | C11 Retrieval tickets, exam-anchored intervals, caps | Extends the strongest verified engine; Cepeda 10–20% rule unserved (via 08) | C4, C23(core) | 2 |
| P2 High | C12 Confidence-calibrated quizzing | S-effort; strong JOL evidence (06 §9 via 08); daily frequency | Review surfaces | 2 |
| P2 High | C13 Close-the-loop next-action notes | Leroy 2009 (via 08); S-effort; rides the auto-cascade | None | 2 |
| P2 High | C14 Detachment gate & scheduled rest | Effort–recovery model (06 §12 via 08); embodies calm-over-engagement positioning | C3 (rest type), C2 | 2 |
| P2 High | C15 Adaptive breaks | Circadian engine exists and only reports (U8/A6 via 07) | C3 (buffers) | 2 |
| P2 High | C16 Anti-avoidance kit | Strongest tractable correlate r≈.40 (06 §3 via 08); tiny | C5 (sink), focus flow | 2 |
| P2 High | C17 Collision radar & load budget | Deadline bunching evidence (06 §10 via 08); feeds C31 | C3, C8, C5 | 2 |
| P2 High | C18 Rooms accountability mechanics | Focusmate's verified-effective mechanics (04 §10.3 via 08) on a working realtime base | Rooms infra; C5; C2 | 2 |
| P2 High | C23(core) Typed-record schema + saved views | Types the engine's inputs; feeds C11/C26 | C3 (course context) | 2 |
| P3 Diff/Reach | C19 Material→recall ingestion (narrow) | Largest expectation gap (table stake #2 missed); output enters a real schedule — incumbents can't (03 §7.1 via 08) | C3; C23 (typing) | 3 |
| P3 High | C20 ICS URL subscriptions | Completes a VERIFIED partial integration; enables C17/C29 realism; OAuth deferred | C3 | 3 |
| P3 High | C21 PWA baseline + widgets | "Web-only is a churn filter" (VERIFIED via 07 G2); audit already run in P0 | C1 (audit), C2 (truth), C4 (content) | 3 |
| P3 High | C22 Term/timetable projection | MSL-parity bar (03 via 08); explicitly a projection, not a 4th scheduler | C3; C20 (source) | 3 |
| P3 High | C24 FSRS-6 upgrade | Benchmark scheduler moved (06 §7; 03 §2.B via 08); self-contained M; ships only if benchmark wins | None | 3 |
| P3 High | C25 Server push (implementation) | Decision P0; unreinforced intentions fail (Wang via 08 C25) | C2, C3, C1 | 3 |
| P3 High | C23/C33 Document-typed records + related-content suggestions | Deterministic one-tap organization (the safe version, 04 §9.2 via 08) | C19 | 3 |
| P4 Diff | C26(b) Ask Solis deepening | 05 §4 A: keep & deepen; provenance over the student's own material sidesteps open-web accuracy wars (via 08) | C3/C23 entities | 4 |
| P4 Diff | C27 Socratic Tutor Mode | Harvard RCT constrains design (VERIFIED via 08); course-grounded constraint is the moat; S–M effort | C26 | 4 |
| P4 Diff | C28 AI-drafted study plans | Scout-class convenience; validator + approve-diff neutralize the PlanBench failure mode (via 08) | C3, C8, C17 | 4 |
| P4 Diff | C29 Weekly review agent | Closes the Improve stage as a proposal; numbers-in-prompt makes it factually safe (via 08) | C8, C12, C5, C3 | 4 |
| P4 Diff | C30 Retention-aware replanning (**flagship**) | 03 §6.1 white space — the closed loop nobody closes (via 07 X7); Solis's most defensible differentiator | C3 (mandatory), C4, C11, C5, C8 | 4 |
| P4 Diff | C31 Term-scale feasibility | 03 §6.4 white space; "exactly where a deterministic engine beats an LLM" (via 08) | C3, C8, C22 | 4 |
| P4 Exp | C32 Study pacts (measured experiment) | Diff4, but deposit uptake verified-weak and body-doubling thin (06 §13/§14 via 08) — behavioral stakes only | C18, C2 | 4 |
| P4 Exp | C34 Voice dictation | Optional experiment (05 §4 G via 08); on-device first | None | 4 |
| P4 Exp | C35 Interleaved sets | VERIFIED effect + VERIFIED metacognitive trap (06 §8 via 08); same-type gating mandatory; measure at delay | C23 typing | 4 |
| Do Not Build | D1–D14 (autonomous replanning, AI nudges, LLM memory, voice companion, OAuth/MCP agents, LLM-per-capture, LLM engine, gamification, identity sharing, money stakes, social network, heavy ingestion, AI auto-filing, platform rewrite) | Each carries verified evidence + violated rules (08 §2.6) | — | — |

**Build first (Phase 0–1):** CI + fail-loud schema + scoped cache (G1–G5); presence honesty (G2); instrumentation (G6); audits + early decisions (G7–G8); canonical schedule model (C3); state continuity (C2); due review in the day (C4); triage write-back (C5); unified reflections (C6); frictionless day (C7); surfaced AI confidence (C26a).
**Build next (Phase 2):** calibration ledger (C8); WOOP (C9); habit system (C10); retrieval tickets/caps (C11); confidence quizzing (C12); next-action notes (C13); detachment gate (C14); adaptive breaks (C15); anti-avoidance kit (C16); collision radar/budget (C17); rooms mechanics (C18); typed-record core (C23).
**Build later (Phase 3–4):** ingestion (C19); ICS subscriptions (C20); PWA/widgets (C21); timetable/term (C22); FSRS-6 (C24); push (C25); document-typed records + suggestions (C23/C33); Ask deepening (C26b); Tutor Mode (C27); plan drafts (C28); review agent (C29); retention-aware replanning (C30); term feasibility (C31).
**Experiment (pre-declared metrics):** pacts (C32); voice dictation (C34); interleaved sets (C35).
**Do Not Build:** D1–D14 (08 §2.6), restated in the blueprint's non-goals.

---

# Part 7 — Success Metrics

**Measurement prerequisite (VERIFIED FACT):** V1 has no product-telemetry sink (114 console sites, no external sink, AI telemetry with no consumer — 02 §1.10; 01 §3.13) and no runtime performance measurement has ever been run (01 §0). The Phase-0 instrumentation gate (G6) is therefore not optional bookkeeping — **every metric below is unmeasurable until it ships.** All metrics are opt-in, privacy-respecting (event names + coarse counters; never note/session content).

No numeric targets are invented below. **RECOMMENDATION:** set targets after one baseline quarter of Phase-1 telemetry; where research gives a directional basis, it is cited; where it doesn't, the metric ships with "baseline first."

| Family | What to measure | Why (basis) | Instrument |
|---|---|---|---|
| **Activation** | Signup → first subject/task created → first focus session → first review completed (funnel + time-to-step); % completing the activation checklist | The checklist exists (01 §3.12) but time-to-first-action has never been measured ("42 s" is simulation — VERIFIED 01 §3.12) | Product telemetry funnel; activation modal events |
| **Daily usage** | DAU/WAU ratio; sessions/day; entry-point mix (morning ritual vs review CTA vs triage badge) | Loop-closure claims (Phase 1 DoD) are only credible if the daily surface actually pulls users in | Telemetry + triage/CTA event counters |
| **Weekly usage** | WAU; weekly-return rate; morning-ritual and evening-closure completion rates | Rituals are the loop's Trigger stage (07 Part 3); completion is the loop's heartbeat | Ritual completion events (synced via C2) |
| **Planning completion** | % of planned blocks executed vs deferred vs aborted (with partial minutes); plan-adherence trend; estimate-vs-actual drift | V1 logs estimates and actuals but adherence keys off completed sessions only (break #5); C7/C8 make this honest | Block/plan-item state events; calibration ledger aggregates |
| **Session completion** | Focus sessions started/completed/aborted; partial-work capture rate; next-action-note usage on early exits | C7/C13 acceptance is the honest-actuals hypothesis made testable | Focus flow events |
| **Consistency** | Habit weekly-consistency distribution (not chain lengths); review-block execution rate; streak amnesty usage | Chain-based streaks punish the users who need the most time (Singh 2024 via 08 C10); consistency scoring is the replacement headline | Habit records; review-block events |
| **Retention (user)** | D7/D30/D90 return; cohort curves before/after flagship phases | Directional basis only: time management's strongest measured benefit is distress reduction (r = −0.358, Aeon 2021 via 08 principle 7) — retention via calm is the thesis to test, not assert | Cohort telemetry |
| **Retention (memory)** | Review-block completion; due-backlog age; per-subject retention health trend | C4's whole purpose; the engine already computes health (01 §3.9) | FSRS due counts + block events |
| **Adoption (features)** | Per-capability activation within phases (WOOP completion rate, retrieval-ticket creation, timetable usage, ingestion runs with confirmation rate) | Tier validation: High-Value/Differentiator items that nobody adopts were misprized | Per-feature events |
| **Collaboration** | Room sessions with declaration + check-in; rooms-vs-solo completion comparison; pact experiment: uptake, weekly-show-up rate, return | Mechanisms verified effective in the paid category (04 §10.3 via 08) but body-doubling evidence thin (06 §14) — measurement is the honest posture (R12) | Room events (existing stream); pact board aggregates |
| **AI usage** | Ask Solis / Tutor sessions; surfaced-faithfulness distribution; % drafts validated vs rejected (with named constraints); ingestion confirmation-rate and edit-distance per field; BYOK share | Validates the proposal-layer thesis and the validator's value; faithfulness is already scored, just unshown (01 §3.13) | AI telemetry (now with a consumer) + proposal-layer events |
| **Satisfaction** | In-app micro-surveys (1-tap) after key loops (import confirm, reflow approve/deny, detachment evening); exit-survey on churn | No external rating base exists; directional signal only, and reflow *dismissal rate* doubles as a trust metric (R7) | Micro-survey component (new, Phase 2+) |
| **Performance** | LCP/INP/CLS per route (mobile-weighted); largest-chunk budgets (current index chunk 430.81 kB / gzip 119.82 kB — VERIFIED 02 §0.3 — is the baseline to beat); hot-read latency with date-scoped queries; intelligence-snapshot compute time on aged accounts | Read-path growth is linear and client-side (02 §4.1) — the dominant scaling ceiling; Lighthouse gate (G1) makes budgets enforceable | CI Lighthouse budgets; RUM via telemetry (opt-in) |
| **Reliability** | Error rate per route (per-route boundaries, G6); WAL replay success rate; sync-state honesty incidents (state that silently diverged); schema-check failures caught at deploy | "Failure honesty" is V1's most consistent quality (01 §4) — V2 must measure it, not just exhibit it | Error sink; WAL instrumentation; deploy gate logs |

---

# Part 8 — Long-Term V3 Opportunities (evaluated, not forced)

**The question:** should Solis eventually become a personal academic operating system, an adaptive planning system, an intelligent study companion, a collaborative academic workspace — or something else? Each is evaluated against identity fit (the deterministic brain + proposal AI), evidence, differentiation, long-term cost (rule 10), and honesty.

| Candidate identity | Case for | Case against | Verdict |
|---|---|---|---|
| **Personal academic operating system** (term-scale system of record: two-way calendar, Canvas/LMS import, audio ingestion, full-term arc, share cards) | Direct continuation of the canonical model: C3/C22/C31 built the term spine in V2; ingestion (C19) proved material-in; white spaces 03 §6.4/§7.1 are term-scale; V2's declines (audio, photo scan, OAuth) were explicitly deferred, not killed (08 §2.6 D12, C20) | Broadest surface; ingestion breadth invites the content-machine chase Solis refuses (boundary 6) | **Primary direction** — bounded to *the student's term*, not "life OS" |
| **Adaptive planning system** (scheduling intelligence for anyone) | C30 (retention-aware replanning) + C31 (term feasibility) are exactly adaptive planning done deterministically; Motion/Reclaim validate demand | Genericizing abandons the study-science identity (rule 4); competing with Motion on autonomy is the documented failure mode (decline D1) | **Not a separate identity** — it already exists inside the OS as the deterministic replanner; stay student-scoped |
| **Intelligent study companion** (always-on AI) | Tutor Mode (C27) is genuinely companion-adjacent and evidence-backed | The companion *pattern* is declined on verified evidence: interrupting AI defeats a focus app (D2), voice companions cost ~$2–4/mo and are off-mission (D4), Harvard evidence applies only to constrained tutors | **Declined as identity; retained as one grounded feature** (Tutor Mode) |
| **Collaborative academic workspace** (multi-user shared planning) | Rooms/pacts are ahead of competitors (03 §3 via 08 C18); witnessed commitment is a real white space (03 §6.3) | Multi-user planning is a security/product-model leap (current RLS is strictly single-user outside social islands — 02 §4.6); deposit/social evidence is thin (06 §13/§14); Clockwise's network-dependence lesson (04 §2.3) | **Secondary, experimental only** — deepen witnessed commitment (C18/C32 pattern), never a workspace pivot without evidence |
| **Something else — the honest data layer** (ownership/export/interoperability excellence; open egress, local-first guarantees) | Reinforces Diff7/trust posture; cheap relative to new subsystems; aligns with BYOK identity | Not a standalone product — users don't switch for export | **Folded into the OS identity as a standing trust commitment**, not a pivot |

**RECOMMENDATION (EXPERT OPINION):** V3 is **the term-scale academic operating system** — the same brain, one octave up: two-way calendar (narrow OAuth, the deferred C20 slice), Canvas/LMS import, lecture-audio ingestion, photo schedule scan, behavioral share cards (V3 list per 08 §3.6), native mobile apps only if PWA hits platform limits, and a public export/API story. The V2 architecture pays forward directly: the canonical model makes two-way sync and term arc cheap; the proposal layer makes any new automation safe; the calibration ledger makes any pacing claim honest. The identity sentence stays: *the study OS that plans your term, times your recall, guards your focus, and tells you the truth about your pace* (08 §1.1). "Adaptive planning" and "companion" are capabilities within it; "collaborative workspace" remains a measured side experiment. **Nothing in V2 should be chosen to pre-empt this — but nothing in V2 need be undone for it either.**

---

## Closing note

The four inputs converge on an unusual architectural position: the foundation is good enough to keep (16-domain abstraction, RLS-protected schema, pure engines, honest failure UX — all VERIFIED), and almost every V2 problem is *structural wiring* rather than missing machinery. The roadmap therefore spends Phase 0 making change safe, Phase 1 making the loop real, Phase 2 making it evidence-deep, Phase 3 making it accept the student's material and their phone, and Phase 4 letting AI compound all of it behind approval gates. The declines stay declined. Everything above that doesn't serve a loop stage was not included.

*Prepared as the architecture-and-roadmap output of the Solis V2 planning phase (input 09). No code checks were executed in this session; all verification inherits from inputs 01–08 and, through them, from the repository state and web sources they inspected on 2026-09-27.*
