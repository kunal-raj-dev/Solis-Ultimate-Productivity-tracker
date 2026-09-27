# Solis V2 Research & Blueprint

**Date:** 2026-09-27 · **Document:** `docs/Solis_V2_Research_and_Blueprint.md` · **Status:** consolidated V2 research, strategy, architecture and roadmap.

**How this document was produced (read this first).** This is an editorial consolidation of ten research inputs, all read in full for this consolidation: `01-v1-product-audit.md`, `02-v1-technical-audit.md` (nested repo `Solis-Ultimate-Productivity-tracker-main/Solis-Ultimate-Productivity-tracker-main/docs/v2-research/`), `03-competitor-research.md`, `04-adjacent-products.md`, `05-ai-landscape-2026.md`, `06-learning-science.md`, `07-gap-analysis.md`, `08-product-strategy.md`, `09-architecture-roadmap.md`, and `reader-critique.md` (workspace `docs/v2-research/`). **No code checks, builds, or web fetches were executed for this consolidation.** Where this document states a FACT, it is a fact that an input session verified — inputs 01/02 executed `npx tsc -b` (exit 0), `npx vitest run` (128 test files / 1,162 tests passing) and production builds (7.2 s / 15.19 s) against this repository, and inputs 03–06 executed direct web fetches and searches on 2026-09-27 — and the citation names the input and section. This document adds no new verification of its own; its contributions are structure, contradiction resolution, and the corrections listed below.

**Evidence labels used here:**
- **FACT (code)** — read in source or produced by a command in inputs 01/02, with a `path:line` citation.
- **FACT (web)** — read on a primary source fetched by inputs 03–06.
- **FACT (secondary)** — from a source inputs 03–06 reached only via search summaries (fetch blocked or not performed); noted where load-bearing.
- **OBSERVED PATTERN** — a recurring structure across sources or code, not individually confirmed at runtime.
- **EXPERT OPINION / RECOMMENDATION** — analyst judgment; disagreeable by design.

Corrections applied while consolidating (the independent critique in `reader-critique.md` found these; they are fixed here rather than copied forward): the flagship mapping is **Diff2 = C30** (retention-aware replanning) and **Diff5 = C31** (term feasibility) — one stray line in input 08 calling C29 the Diff2 flagship is corrected; **C11's dependency row** in input 08 named C22 and C25 in error — corrected here to C4 + C23-core (+ optional AI generation); **C23 is split** across phases (schema+views in Phase 2, document-typed records + suggestions in Phase 3); the **"no silent state writes" invariant is restated as a two-class rule** (§12) because input 08's absolute phrasing collided with its own C4/C7/C15 mechanics; the **mobile Core/Phase-3 tension** is resolved by defining Core as criticality, not build window (§15); and several overreaching claims are tempered inline with the honest caveat named.

**Glossary** (terms the critique flagged as undefined):
- **BYOK** — Bring Your Own Key: the student supplies their own AI-provider API key (Gemini); the operator holds no keys and has no vendor relationship.
- **WAL** — write-ahead log: failed cloud mutations are journaled to IndexedDB first and replayed FIFO on reconnect.
- **RLS** — row-level security: Postgres policies restricting every row to its owning user (`auth.uid() = user_id`).
- **FSRS / SM-2** — spaced-repetition scheduling algorithms. SM-2 is the classic SuperMemo algorithm; FSRS (Free Spaced Repetition Scheduler) is the modern optimizer-based successor, now at version 6.
- **JOL** — judgment of learning: a student's self-assessment of how well they know something; systematically overconfident after re-reading.
- **TTFT** — time to first token: LLM streaming latency metric; interactive UX budget ≈ 2 s (OBSERVED PATTERN, 05 §3.13).
- **Flash-class** — Google's low-cost Gemini model tier (Flash / Flash-Lite), as opposed to Pro-class; the cost envelope in §12 uses this tier's published pricing.
- **WOOP / MCII** — Mental Contrasting with Implementation Intentions: Wish → Outcome → Obstacle → Plan (if-then).
- **ICS** — iCalendar format; the interchange format for calendar feeds.
- **RAG** — retrieval-augmented generation: the model answers from retrieved chunks of the user's own material.
- **approve-diff** — a proposed change rendered as an explicit before/after the user approves or dismisses; never applied silently.
- **canonical schedule model** — the single typed schedule entity (fixed/flexible/defended entries) of which every planning surface is a projection (§13).
- **PWA** — progressive web app: installable web app with offline service worker.
- **VAPID** — the standard server-key scheme for Web Push delivery.

---

# 1. Executive Summary

**The thesis (RECOMMENDATION):** *Keep the deterministic brain. Wire it into action.* Solis V1 is real, deep, and tested — 18 routes, 14 feature pages, 128 test files / 1,162 tests passing, clean typecheck, 7.2 s build (FACT (code), 01 §0; 02 §0.3) — and it already spans four of the five study-productivity category stacks (03 §1). Its problem is not missing features. Its problem is that the thing it built **does not close its own loops, does not follow the student across devices, and does not accept the material students actually have** (07 closing note). V2 therefore spends its budget on **loop closure, continuity, and intake**, and treats every additive idea as a candidate to be rejected unless it serves a loop stage.

**The vision in three sentences (RECOMMENDATION):**

1. Solis V2 turns V1's proven deterministic study brain into a system that **closes its own loops** — one canonical schedule model, state that follows the student across devices, and every recommendation one tap from executed.
2. It is built for the **self-directed, exam-driven student on multiple devices**: real course material (syllabi, PDFs, slides) flows in and becomes scheduled, exam-anchored recall — and memory state pushes back on the calendar.
3. Its AI **never acts alone**: it proposes drafts grounded in the student's own data, deterministic engines verify, the user disposes — keeping BYOK privacy and a free core learning loop structural, not marketing.

An honesty note on sentence 2 (folded in from the critique): "memory pushes back on the calendar" is the **end-state** of V2, delivered by C30 (retention-aware replanning), which is deliberately scheduled in Phase 4 behind the riskiest migration (C3, the canonical schedule model). The vision describes where V2 lands; Phases 1–3 deliver the closed loop, continuity, and intake that make it land safely. §16 states this sequencing caveat inline.

**The five V2 Core moves** (each traced to a verified V1 failure):

1. **One canonical schedule model** — collapses the three coexisting scheduling vocabularies (derived dashboard blocks, persisted task blocks, study-plan items), the single largest IA debt (FACT (code), `DashboardPage.tsx:184-196`; 01 §4 break #1), and enables every differentiator downstream.
2. **Cross-device state continuity** — migrates the ~40 device-local `localStorage` keys (37 source files) that strand intention, rituals, pins, note history, and the notification inbox (FACT (code), 01 §1 debt 1).
3. **Due review in the daily surface** — recall moves from one hop away into the timeline with live counts and a drill CTA (FACT (code), 01 §4 break #2).
4. **Triage queue with analytics write-back** — recommendations become acknowledge/schedule/dismiss objects in one decision inbox, repairing the verified report-only analytics break (FACT (code), 01 §4 break #3).
5. **Engineering foundations** — CI, user-scoped cache, fail-loud schema checks, and the simulated-presence integrity fix (FACT (code), 02 §3.1 D1–D6).

**The most notable rejection:** autonomous agentic replanning — "AI that reschedules your life." It is the category's loudest 2026 trend (Notion 3.0 agents, Motion, Reclaim) and its worst documented trust failure: LLMs cannot plan reliably at long horizons (PlanBench — FACT (secondary), 05 §3.2), agent loops compound errors (Anthropic, fetched — 05 §3.2), and Motion's most-cited complaint is exactly this opacity (OBSERVED PATTERN, 05 §3.3). Solis's deterministic replanner delivering approve-diff proposals (C30) provides the value without the failure mode. Fourteen declines total, each with its evidence, in §23.

**Build order (dependency-ordered, not dated):** Phase 0 Guardrails (CI, integrity, schema truth, scoped cache/reads, instrumentation, audits, early decisions) → Phase 1 Loop Closure (one model, synced state, recall in the day, triage write-back) → Phase 2 Evidence Depth (calibration, WOOP, habits, retrieval, confidence, rooms) → Phase 3 Intake & Reach (ingestion, ICS, mobile PWA, timetable, FSRS-6, push) → Phase 4 AI Differentiation (tutor, validator-gated drafts, review agent, retention-aware replanning flagship, term feasibility, measured experiments). §18–§20.

**Honest boundaries of this plan** (folded in from the critique; stated once here, honored throughout):
- **No business model is decided.** The research fixes the posture (free learning loop, meter only generative AI, BYOK keeps operator AI cost ≈ $0) and names pricing as an open decision (§17).
- **No timeline, team, or budget.** Phases are ordered, not dated; Phase 1 is quarter-scale for a single-developer team (09 §5.1 sizing caveat). Resourcing is out of scope of this research.
- **No user evidence yet.** The target persona is asserted from product logic and competitor triangulation, not derived from Solis users; telemetry (Phase 0) and interviews are named prerequisites before Phase-3+ scope locks (§21).
- **The migrations' hardest design questions are named, not settled.** The C3 write path, the C2 key classification, multi-device conflict resolution, and migration rollback are flagged open design deliverables of Phase 1 (§13.4, §20).

---

# 2. Solis V1 Current-State Analysis

## 2.1 The verification trail

Inputs 01 and 02 audited the repository directly on 2026-09-27 (nested root `Solis-Ultimate-Productivity-tracker-main/`) and ran:

| Check | Command | Result |
|---|---|---|
| Typecheck | `npx tsc -b` | Pass, 0 errors |
| Tests | `npx vitest run` | **128 files / 1,162 tests, all passing** |
| Production build | `vite build` | Pass, 7.2 s (01) / 15.19 s (02); largest chunk `index` 430.81 kB (gzip 119.82 kB) |
| Git hygiene | `git ls-files \| grep .env` | `.env` untracked; only `.env.example` committed |

Not verified by any session (stated honestly, not assumed): a live-browser pass (Lighthouse/axe, mobile viewport interaction), a connected Supabase runtime, the Vercel deployment, component-level tests (0 `.test.tsx` vs 149 `.tsx` — FACT (code), 02 §0.3), and the live cloud database. Older repo docs claiming "34/34 suites / 174 tests" and "42-second activation" are stale or simulation, not measurement (FACT (code), 01 §6).

## 2.2 What V1 is

A React 19.2.8 + TypeScript (strict) + Vite 6 SPA with Supabase (Postgres + auth + realtime) behind a 16-domain `IDataService` abstraction (`api.interface.ts:256-275`) with two interchangeable backends (Supabase and an in-memory mock), a delegating proxy container (`dataService.ts:142-165`), race-guarded auth with first-class guest mode and snapshot migration (`AuthContext.tsx:47-52, 64-115`), an offline IndexedDB WAL with per-user mutation ownership (`pwaSync.ts:42-52`), and pure deterministic engines under `utils/` (FSRS/SM-2, retention, mastery ×3, circadian synthesis, subject health, exam feasibility, time cushion, recurrence, NLP parser) covered by the green suite. 26 tables, all RLS-enabled, 50 policies (FACT (code), 02 §1.4). Three-tier AI: authenticated edge-function proxy → user-supplied session-scoped key (BYOK) → deterministic extraction, with a grounding gate, injection guardrails, and local BM25+trigram+RRF RAG (FACT (code), 02 §1.9).

## 2.3 The core loop as implemented

The strongest implemented loop is narrower and tighter than the marketing loop (FACT (code), 01 §4): **exam-anchored** Goal/exam (feasibility + cushion) → morning intention/plan → time block or study-plan item → focus session with full context carried → **post-session reflection auto-cascade** — one user action updates seven downstream entities (study session, topic promotion, habit, task, time block, note, plan item; `FocusContext.tsx:715-895`) → SM-2/FSRS flashcard drilling → deterministic intelligence (retention/mastery/health) → explainable recommendation → back to focus. The weekly review seeds next week's plan. This loop is verified end-to-end in code with no manual re-entry.

Where it is strong (FACT (code), 01 §4): context preservation into every focus entry point; determinism with receipts (Signal → Evidence → Action); failure honesty everywhere (partial-data banners, sync-error retry, offline WAL, honest migration overlay); undo-optimism on destructive actions.

## 2.4 Where the loop breaks (VERIFIED breaks, ranked — 01 §4)

1. **Plan is not one thing.** Three schedulers meet the student on day one (derived dashboard timeline, persisted task blocks, study-plan agenda), bridged both directions but with no single surface owning a commitment.
2. **Recall is a separate destination.** Due flashcards surface on Study and via dashboard alerts; no due-review block in the daily timeline; the dashboard's "Active Knowledge" card resurfaces notes, not cards.
3. **Analytics is a report, not a control surface.** Recommendations navigate away; nothing writes back (no acknowledge/schedule/snooze).
4. **Device-local state breaks continuity.** ~40 `solis_*` keys across 37 files keep intention, ritual flags, welcome-back choices, gentle-start capacity, pins, note history, and the notification inbox per-device even in cloud mode.
5. **The stopwatch half is under-modeled.** Aborted/aborted-early work is honestly excluded ("Elapsed progress … will not be recorded", `FocusPage.tsx:1348-1361`) — so real partial work is invisible to analytics and to the calibration the system needs.

One integrity defect sits in production plumbing: the ambient peer-presence service serves hardcoded fictional peers ("Elena Rostova", …) even in Supabase mode (`presence.service.ts:8-49`, registered at `supabaseService.ts:93`), contradicting the repo's own no-fake-integration rule (FACT (code), 02 §1.6). It is the first thing Phase 0 fixes (§14).

---

# 3. Complete V1 Capability Map

Status legend from input 01: **Implemented** (wired end-to-end) / **Working** (implemented + tested or internally consistent with fallbacks) / **Partial** / **Debt** / unverified noted inline. All paths relative to the nested repo root.

| Area | Capabilities | Status | Key evidence |
|---|---|---|---|
| **Planning & daily structure** | Daily cockpit (cache-first, 13-slice `Promise.allSettled` load, partial-data banner); daily intention anchor; morning ritual (90 s, tested engine); evening closure (auto-creates tomorrow tasks + reflection note); recurring routines; unified 24 h timeline (derived); hourly planner (persisted blocks, hour review, 30 s block-alert monitor); weekly planner; calendar conflicts + `?action=replan`; ICS overlay (paste-only); gentle start / welcome-back (3+ day detection, streak amnesty); one-tap deferral with undo; past-block calm roll-over; exam time cushion + persistent D-Day pill + Exam Command Workspace; goal→study-plan generation | Implemented, mostly Working; intention/ritual state device-local (Debt) | `DashboardPage.tsx` (1,368 ln), `HourlyPlannerView.tsx` (724), `WeeklyPlannerView.tsx` (540), `AppLayout.tsx:53-207`, `timeCushion.ts` |
| **Tasks** | CRUD + subtasks (optimistic + rollback); 4 views (List/Day/Week/Eisenhower, URL-driven, keyboard switching); NLP capture (`nlpParser.ts`, tested); recurrence engine (persisted, no browsing UI — OPINION: shallow); 5 s undo stack; filters/search/sort; workload capacity bar; task↔focus bridging; error/empty states | Implemented, Debt-leaning at the data layer (fetch-all-then-filter, silent PGRST204 column strip) | `TasksPage.tsx` (1,584 ln), `tasks.service.ts:14-67, 117-125, 172-186` |
| **Study management** | Subjects (archive/restore, colors, target hours); syllabus topic trees + mastery; study-plan agenda; manual session logging; flashcards create/review (SM-2+FSRS, leech detector, exam cram); Anki `.apkg` import/export + LMS/deck import (round-trip tested); adaptive suggester (AI-first, deterministic fallback); topic intelligence drawer; resource library + citation; split-screen PDF reader (render quality unverified); inline `::` flashcards; subject health / weekly focus strip | Implemented, Working | `StudyPage.tsx`, `fsrsEngine.ts`, `spacedRepetition.ts`, `deckImporter.ts` |
| **Focus Room** | Countdown + stopwatch, presets + custom; 3-tap energy calibration; Web-Audio soundscapes + affinity; tab defense + drift tracking; internal/external interruption counters; cognitive drift pad (Alt+D); mid-session checkpoint, zen mode, analog pie; centering breathwork; **post-session reflection auto-cascade** (the strongest automation in the app); abort guard with honest copy; aria-live timer | Implemented, Working | `FocusContext.tsx` (962 ln; cascade at 715-895), `FocusPage.tsx` (1,373 ln) |
| **Collaboration** | Study rooms (create/join-by-code); synced epoch timer + host failover (deterministic, idempotent); presence/chat/timeline; room reflections → personal history; ambient peer presence widget (**simulated — integrity defect**); study pacts (weekly minutes, invite codes); cheering (thin — OPINION) | Implemented; realtime robustness Partial (client-side host heuristics incl. email-prefix match, N+1 profile fetch, unconditional 5 s poll) | `useStudyRoom.ts` (889 ln), `ActiveRoomView.tsx` (1,322), `presence.service.ts:8-49` |
| **Notes & knowledge** | Markdown editor + toolbar; 2-tier lossless autosave (1 s local / 4 s cloud) with honest cloud-error state; wiki-links + autocomplete + graph; pinning (device-local — Debt); version history (device-local, capped — Debt); grounded AI flashcards (3-tier, grounding gate); AI quiz; Ask Solis (global RAG drawer with injection guard + faithfulness warn); note→task; note→focus; `.md` export; mobile index/editor split | Implemented, Working | `NotesPage.tsx` (1,497 ln), `ai.service.ts`, `utils/notes/*` |
| **Habits** | Boolean/quantitative/tiered; streaks + per-day toggling + 90-day heatmap; haptics after confirmed success; streak amnesty; review-habit auto-toggle from focus; "rhythm story" non-punitive framing; goal-linked habits | Implemented, Working | `HabitsPage.tsx` (1,020), `tieredHabits.ts`, `habitAutoToggle.ts` |
| **Goals** | Goals w/ milestones, horizons, statuses; exam vs project workspaces; exam feasibility + dynamic pacing; feasibility drift warnings (pill); goal→study-plan generation; completion→retrospective note | Implemented, Working | `GoalsPage.tsx`, `examFeasibility.ts`, `syllabusPacing.ts` |
| **Analytics & intelligence** | Metric tiles with honest "—"; time scopes; WoW trends, bars, subject breakdown, task velocity; "Solis Noticed" deterministic insights; explainable Signal/Evidence/Action cards; retention forecast + exam readiness + cognitive load; activity heatmap; 15 deterministic engine modules + snapshot assembler shared by Dashboard & Analytics; Scholar Report (SVG/Markdown proof-of-study, content-hashed); circadian synthesis feeding focus | Implemented, Working | `AnalyticsPage.tsx` (996), `utils/intelligence/*`, `scholarReportGenerator.ts` |
| **Weekly review** | 5-step wizard; data-grounded placeholders; AI synthesis w/ deterministic fallback; four follow-through actions incl. next-week seeding; history + streak | Implemented, Working | `WeeklyReviewPage.tsx` (909) |
| **Settings & account** | Theme/density/font; profile + capacities; Gemini key management (session-scoped, test connection, model migration); notification prefs + quiet hours (overnight-aware); JSON workspace backup (+ tested import engine); per-entity CSV export ×6; one-way iCal export; RLS data-ownership copy | Implemented, Working | `SettingsPage.tsx` (1,459), `notification.service.ts` |
| **Onboarding & activation** | Landing page; guest "Explore Demo Sanctuary" (seeded workspace, migration on signup); 3-stage activation modal (welcome → mental model → counts-driven checklist); Next Best Action card; guided tours (~18 guides, 6 categories) opened from every page header; welcome-back | Implemented; time-to-first-action never measured ("42 s" is simulation) | `ActivationWelcomeModal.tsx`, `utils/activation.ts`, `data/guides.ts` |
| **AI (cross-cutting)** | Tiered availability (edge proxy / BYOK key / deterministic); guardrails (injection detection, sanitization, hardened prompts); local RAG (no embeddings dependency); grounding gate + faithfulness scoring (warn-in-console only); device-local telemetry with no consumer; quiz + flashcards + weekly narrative + Ask Solis | Implemented, Working; confidence invisible to the user | `ai.service.ts` (646 ln), `guardrails.ts` |
| **Notifications** | Notification center drawer + unread badge; block-start/hour-review reminders (30 s monitor, dedup); browser notifications + quiet hours + chime fallback; proactive retention alert strip | Partial: inbox/prefs device-local; **no server push** (`webPushEnabled: false`) | `AppHeader.tsx:220-236`, `notification.service.ts` |
| **Integrations & data** | Supabase (Postgres+RLS, auth, realtime, one edge function); guest→cloud migration (snapshot, honest failure overlay, local archive); offline WAL + service worker; keepalive (4 overlapping implementations); CSV/JSON/ICS/Anki/Markdown/LMS export-import; calendar ICS import (paste-only, no URL polling) | Implemented/Working; ICS import Partial as an integration | `services/supabase/*`, `pwaSync.ts`, `vercel.json` |

---

# 4. Competitive and Market Research

Consolidated from inputs 03 (competitor profiles, direct fetches) and 04 (adjacent-product mechanisms). All URLs are carried in §24. Fetch-failure honesty inherited from input 03: Quizlet pricing rests on one dated secondary source (quizlet.com 403'd), Knowt's pricing page 404'd, and Todoist's live page stripped prices — those items are labeled FACT (secondary).

## 4.1 Category map

The "study productivity" category has fragmented into five stacks; few products span more than two (03 §1):

| Stack | Representatives | Core job |
|---|---|---|
| Student scheduling/planning | MyStudyLife, Motion, Reclaim.ai, Todoist, Notion | "What do I do, when?" |
| Learning & spaced repetition | Anki, RemNote, Quizlet, Brainscape, Knowt, Gizmo, Vaia | "Do I actually know this?" |
| AI content machines (2024–26 wave) | Turbo AI (ex-TurboLearn), StudyFetch, Knowt, Gizmo, Flashka, Alice.tech | "Turn my lecture/PDF into notes, cards, quizzes" |
| Focus & accountability | Forest, Focusmate, Flow Club, LifeAt, Saner.ai | "Make me start and keep going" |
| All-in-one student OS (thin/absent) | MyStudyLife (closest), Vaia, Knowt (aspiring) | Whole-semester cockpit |

**Solis V1 already spans four of the five stacks** (FACT (code) about Solis; OBSERVED PATTERN across the profiles) — a footprint none of the profiled competitors matches. Input 04 extends this with adjacent mechanisms: Reclaim's defended/flexible scheduling and approval gates, Linear's triage inbox and cycles, Focusmate's declaration + check-in, Reclaim/Rize's adaptive breaks, Obsidian Bases / Tana supertags / Capacities objects (typed structure over notes), Toggl's planned-vs-actual loop, Forest's loss-aversion stakes, Habitify's mood correlation, Clockwise's typed "hold" objects — and its **sunset** (product unavailable March 27, 2026; 8M focus-hours created — FACT (web), fetched), the standing warning that network-dependent features can die with the network.

## 4.2 Key profiles (condensed; pricing as verified 2026-09-27)

- **MyStudyLife** — "free student planner, forever"; rotating/A-B timetables, Schedule Scan (photo→timetable), Family Connect + Schools editions; syncs Google/Apple/Outlook/iCal/Blackboard/Canvas; **Scout** AI turns one sentence into a planned week. MSL+ $6.99/mo / $39.99/yr (App Store). Weak on learning science — no SRS (REVIEWER OPINION). Sets the interop and term-structure bar.
- **Todoist** — best-in-class NLP capture (deterministic-grammar behavior — inferred, 05 §3.7); Pro rose $5→$7/mo and $48→$60/yr effective Dec 10, 2025 (FACT (secondary)); AI assists (Task/Filter/Email/Ramble) on paid tiers; Karma shows both the power and the trap of box-checking economies.
- **Motion** — AI-first auto-scheduling; "dynamically optimizes your schedule dozens of times a day, all done automatically" (FACT (web)); Pro AI $19 / Business AI $29 per seat/mo with **credit metering** (7,500/15,000 credits + $0.25/100 overtime). Its autonomy is the category's most-cited trust complaint (OBSERVED PATTERN, 05 §3.3).
- **Reclaim.ai** — defensive scheduling layer: AI Tasks/Habits/Focus Time/Buffer Time/Planner, tiered agent counts per plan, and — critically — **"preview and approval controls before changes are applied"** (FACT (web)). The approval-gate pattern is the transferable mechanism for anything Solis's planner proposes.
- **Notion (+ 3.0 agents)** — Plus free for verified students; Notion 3.0 (Sept 18, 2025) rebuilt AI as agents doing "up to 20 minutes of autonomous work" across the workspace; scheduled Custom Agents followed in Feb 2026. The workspace-as-agent's-body architecture is the template; the blank-canvas configuration surface is what a student OS should not copy.
- **Anki** — free (except ~$24.99 iOS); monthly releases shipping **fsrs-rs 6.6.x** (current 26.09.3 — FACT (web), GitHub releases); FSRS is the benchmark scheduler; UI and onboarding remain its weakness.
- **RemNote** — notes+SRS unified; Pro $8/mo, Pro-with-AI $18/mo with credit tiers (250/20,000 AI credits by tier).
- **Quizlet** — the cautionary tale: once-free Learn/Test modes paywalled, Q-Chat tutor retired; Plus ~$7.99/mo / $35.99/yr (FACT (secondary)); competitors now lead with "what Quizlet used to give free."
- **Brainscape** — confidence-based repetition; Pro $7.99/mo official (a Sept 2026 review citing $19.99/mo conflicts; official page preferred).
- **Knowt** — the free-tier attacker: "unlimited free learn mode," Quizlet import, Kai voice assistant; "5M students switched" (OFFICIAL CLAIM, UNVERIFIED); monetizes schools/exam verticals, not study modes.
- **Vaia (ex-StudySmarter)** — "40M+ students" (OFFICIAL CLAIM, UNVERIFIED); Exam AI graded mock exams; ad/funnel-heavy free tier.
- **Turbo AI (ex-TurboLearn)** — "10M+ learners" (OFFICIAL CLAIM); lecture/PDF/YouTube → notes/cards/quizzes with live collaborative docs; free tier confirmed, paid prices not published.
- **StudyFetch** — Sparky tutor, cram mode, Live Lecture; "92% report grade improvements" (OFFICIAL CLAIM, UNVERIFIED — no methodology).
- **Alice.tech / Flashka** — YC/seed-stage second wave; differentiation drifting from generation toward **assessment** (AI-graded mock exams).
- **Forest** — 60M users claimed; loss-aversion gamification; Forest Plus $5.99/mo / $35.99/yr.
- **Focusmate** — 1:1 body doubling; free 3 sessions/week, Plus $8/mo annual. Its *effective* mechanics are the goal declaration and the closing check-in (OBSERVED PATTERN, 04 §10.3), not the partner.
- **Flow Club** — hosted small-group focus; **$40/mo or $400/yr, 50% student discount**; 62% ADHD identification among surveyed members (official survey claim). Evidence that co-presence sustains a paid category — not, by itself, proof of demand for Solis's free rooms (critique fix; see §16).
- **LifeAt / virtual study rooms** — the "study with me" economy (Study Together, StudyStream, Academync, Discord rooms) is a real student acquisition channel.
- **Saner.ai** — ADHD-framed assistant; free plan.
- **Linear** — triage as a single queue of decisions; cycles as enforced weekly rhythm; scheduled agent runs (Loops). (Input 04 corrected the brief: **no "Rituals" feature exists in Linear** — the conflation is Height's feature; FACT via exhaustive site search.)
- **TickTick** — the commercial structural cousin: tasks + time-blocking calendar + habits + Pomodoro in one data model; "module integration beats module quality." Validates the all-in-one category.
- **Things 3** — Today as commitment surface vs Upcoming as planning surface; "fewer views, better default views" wins multi-year loyalty.
- **Superlist** — sensory completion; task-holds-its-process; its $25/mo AI tier drew backlash — the caution against premium AI moats.
- **Habitify / Streaks** — habits-as-schedule with mood correlation; the chain executed perfectly — and the chain's cruelty (a missed day destroys months) is exactly what Singh 2024's variability data warns against (§6).
- **RescueTime / Rize** — passive ground truth + measurement wired to action + **breaks learned from the individual** + consent-first analytics. A desktop monitor is out of scope for a web SPA; mining Solis's own session data is the transferable pattern.
- **Toggl Track 2.0** — merged tracking with planning; planned-vs-actual is the highest-value analytics loop; rollout friction argues for opt-in sequencing.
- **Obsidian (Bases) / Logseq / Tana / Capacities / Reflect / Mem** — structure-as-view (Bases), the platform-rewrite warning (Logseq DB rewrite, 2024–26), supertags + student hub (Tana — direct validation of Solis's domain), typed objects + daily-note inbox + related-content suggestions (Capacities — the cleanest synthesis for Solis Notes), capture-speed daily inbox (Reflect), and "AI organizes everything" losing to weak base UX (Mem — suggest, never auto-file).
- **ChatGPT Study Mode / Claude Learning Mode** — the Socratic constraint: the same model *refused permission to answer* becomes a tutor (system-prompt-level governance, not new capability). The highest-leverage AI transfer for Solis (04 §8.1).
- **Perplexity Comet** — cited research in context; browser-agent autonomy carries documented prompt-injection risk (arXiv via 04 §8.5) — keep V2 AI inside Solis's own data surface.
- **Institutional signals** — higher-ed AI-agent deployments with explicit expert framing that current tools are assistants, "not yet fully autonomous agents," and "accuracy is always a problem if you're going to fully automate things" (EdTech Magazine, Dec 2025 — FACT (web)); Duolingo's AI-first monetization backlash is the brand-risk precedent.

## 4.3 Where the category is heading (2025–26 evidence, 03 §4)

1. **From assistants to agents that plan** — Notion 3.0, Reclaim agent counts, Motion autonomy, MSL Scout; expert consensus says still assistant-grade with accuracy caveats, leaving a 12–24-month window where an *explaining* planning agent differentiates.
2. **AI cost is metered in credits** — Motion, RemNote, Reclaim, Notion all meter; Todoist raised prices 40% monthly. Subscription inflation on top of AI metering.
3. **Free-tier warfare and paywall blowback** — the Quizlet lesson; keep the learning loop free, meter the content/agent layer, never strand a free core mode.
4. **Material→recall generation commoditizing; value moving to assessment and scheduling.**
5. **FSRS is the benchmark scheduler** — claims without a modern algorithm are increasingly disqualifying for the med/law/language cohort.
6. **Accountability is a paid category** — Flow Club $40/mo, Focusmate freemium; an explicit ADHD lens.
7. **Family/school/institution surfaces growing** — B2B2C acquisition.
8. **Interaction shifts** — NL capture baseline; "study with me" media; template economies prove students buy opinionated defaults, not blank canvases.

## 4.4 Table stakes for 2026 (03 §5) and Solis's current posture

1. AI planning agent — **partial** (deterministic drafts exist; Scout-class convenience absent). 2. Material→recall pipeline — **missed outright**. 3. Modern SRS with sane defaults — **at parity or ahead** (FSRS + planner). 4. Mobile + cross-device sync with offline — **missed outright** (web-only; mobile runtime unverified). 5. Two-way calendar + LMS interop — **partial** (one-way ICS export; paste-only import). 6. Focus environment with a loop — **exceeds it**. 7. Social accountability option — **ahead** (free productized rooms + pacts). 8. Explainable progress — **nearly unique**. 9. Honest freemium — **satisfied structurally** (BYOK, deterministic core). 10. Privacy and export — **satisfied** (JSON/CSV/ICS/Anki export, RLS posture).

## 4.5 White space nobody serves well (among the 25+ products profiled in inputs 03–04 — absence claims are scoped to that set)

1. **Retention-aware replanning** — every planner reschedules tasks; every SRS reschedules cards; no profiled product lets memory state push back on the calendar. Solis's engines are the closest building blocks. 2. **Agentic planning under a privacy/BYOK contract** — the agent wave ships as cloud meters; a BYOK agent that plans and ingests without shipping notes to a vendor cloud is unserved. 3. **Committed small-group study (pacts with behavioral stakes)** — rooms and body doubling exist; commitment devices among friends are productized nowhere profiled. 4. **Term-scale intelligence** — products optimize the day or week; nobody models the 15-week term ("you cannot pass this unit at current pace") — exactly where a deterministic engine beats an LLM. 5. **Evidence-grounded personal tutor tied to the student's own system** — AI tutors answer in a vacuum; the grounded-in-your-own-material version is unserved.

---

# 5. 2026 Technology and AI Landscape

Consolidated from input 05 (AI landscape; ~15 searches + direct fetches of Anthropic's *Building Effective Agents* and Google's Gemini pricing page). URLs in §24.

## 5.1 What the evidence says

- **Adoption is near-universal; effectiveness evidence is scarce.** 92% of UK full-time undergraduates used generative AI in 2025 (88% for assessments), ~95% by December 2025 (HEPI/Kortext — FACT (secondary)); Digital Education Council: 92% across 29 institutions. The strongest independent effectiveness evidence is the **Harvard "PS2 Pal" RCT** (n=194, crossover): a *pedagogically constrained* tutor roughly doubled learning gains vs in-class active learning. Commercial effectiveness claims (StudyFetch's "92%") are vendor marketing. Implication: constrained, pedagogy-shaped AI beats unconstrained chat; product AI value must come from data advantage, not being another chat box (EXPERT OPINION implied by study design).
- **LLMs cannot plan reliably at long horizons.** PlanBench (Valmeekam et al.) shows pattern-matching, not planning; o1 saturates familiar Blocksworld but degrades on ≥20-step and out-of-distribution plans (FACT (secondary)). Anthropic's fetched guidance: agents are "LLMs using tools … in a loop" with "higher costs and the potential for compounding errors"; most applications should optimize single LLM calls; use workflows over agents; pause for human feedback; make mistakes structurally hard.
- **Agent-washing is a named risk.** Gartner: 40% of enterprise apps will feature task-specific agents by end-2026 (from <5%); and **over 40% of agentic AI projects will be canceled by end-2027** (FACT (secondary)).
- **FSRS-6 is the modern scheduler** (2025; 21st trainable parameter personalizing per-user decay; outpredicts SM-2 on the ~10k-user open benchmark; native in Anki 23.10+) — V1 ships FSRS-5 (FACT (code), 02 §2), so this is an evaluation, not a fashion upgrade.
- **Memory layers are redundant here.** A 2026 arXiv benchmarking line finds plain RAG matches top memory systems at ~8× lower TCO; "Trojan Hippo" (arXiv 2026) demonstrates memory-poisoning attacks. For a single-user app whose Postgres already stores everything, retrieval over structured data IS the memory.
- **MCP became the tool-use standard** (OpenAI, DeepMind, Microsoft; NSA/CISA guidance June 2026) — and is irrelevant to Solis's user problems; expose data outward (exports) rather than build agent infrastructure.
- **Proactive AI is a trade-off, not a win** — "Assistance or Disruption?" (arXiv 2025); a focus app whose AI interrupts is self-defeating. Deterministic, explainable triggers remain correct.
- **Voice**: STT is near-free (Whisper $0.006/min; Gemini Live audio ≈ $0.005/min in) but public-use discomfort is a documented adoption barrier (PYMNTS 2025); Gen Z leads engagement (eMarketer). Dictation yes; conversational voice no.
- **Latency**: fast non-reasoning Flash-class models run sub-second to ~2 s TTFT; high-reasoning modes can exceed 10 s (OBSERVED PATTERN; leaderboards conflict). Best-in-class grounded summarization hallucination ≈ 1.8% (Vectara leaderboard, Dec 2025 update — FACT (secondary)) — for grounded summarization only.
- **Privacy**: Google's free tier may train on submitted data; paid tier does not (verbatim on the fetched pricing page). BYOK keeps the data relationship user→provider and sidesteps most FERPA/COPPA exposure for a consumer app.

## 5.2 Cost envelope (computed in input 05 from the fetched Gemini price page — arithmetic, not a source claim)

| Tier | Heavy user (≈3.5M in / 175k out tok/mo) | Typical (1–2 AI touches/day) |
|---|---|---|
| Flash-class | ≈ $1.20–1.50/mo | ≈ $0.30–0.60/mo |
| Flash-Lite | ≈ 4× cheaper | proportionally |
| Pro-class | ≈ $5–6/mo — viable only with BYOK/caching/batching | — |

Voice dictation ≈ $0.12/mo (20 min); live voice conversation ≈ $2–4/mo — real money for a student app. Google Search grounding $35/1,000 queries after 1,500/day free. Agentic usage multiplies tokens: per-task cost is governed by architecture, not model choice.

## 5.3 Candidate-by-candidate verdict for Solis (from 05 §4, condensed)

**Build/keep:** grounded note Q&A (deepen — core anchor); AI flashcard/quiz generation (user-triggered, preview-edit); **syllabus/document → structured topics + exam dates** (new — nothing deterministic can parse free-text syllabi; every field user-confirmed); **AI-drafted study plans** (LLM drafts, deterministic feasibility checker disposes); weekly narrative narrating computed numbers only; voice dictation (optional, on-device first).

**Avoid (each with a verified reason):** autonomous agentic replanning (PlanBench + Motion's opacity); proactive AI nudges (an interrupting AI defeats a focus app); LLM memory layer (~8× TCO; poisoning risk); live voice tutor/companion (~$2–4/mo audio; off-mission; evidence applies only to constrained tutors); autonomous calendar/OAuth agents and MCP loops (control failure mode; OAuth scope risk); LLM replacing the intelligence engine (FSRS/mastery/feasibility math are validated, explainable, free, offline); LLM-per-capture parsing (deterministic parsing is instant, offline, free).

**Design invariants:** AI proposes → user disposes (with the two-class refinement of §12); the moat is the data ("what does ChatGPT not know that Solis does?"); BYOK keeps operator cost ≈ $0; AI failure = feature gracefully absent (hard invariant); ~2 s TTFT streaming budget for interactive features, async for heavy jobs.

---

# 6. Student / Productivity Research Insights

Consolidated from input 06 (learning-science evidence base, 2024–2026-priority sources). URLs in §24. Every mechanism below is deterministic to implement; this is the evidence spine of Phases 1–2.

## 6.1 The ten strongest evidence-backed mechanisms

1. **Calibration ledger** — show predicted-vs-actual time for every task and inflate future estimates from the student's own history. Buehler et al. 1994: only 30% of students finished their thesis in predicted time; actuals exceeded worst-case estimates (FACT); awareness alone doesn't fix estimates (FACT); reference-class forecasting cut overruns 38%→5% (FACT, project-level data — the per-student transfer is plausible but *unproven* until Solis measures it; tempered accordingly, §21). Segmentation effect: estimates for small subtasks are accurate — auto-split anything >90 minutes (FACT).
2. **Spaced retrieval as the default scheduler** — spacing beats massing (d ≈ 0.42, Cepeda 2008, 317 experiments); the optimal gap is roughly **10–20% of the retention interval**; FSRS-6 personalizes per-user decay (FACT). Exam-anchored intervals, retrieval tickets for notes, and workload caps follow directly.
3. **Obstacle-first goals (WOOP/MCII)** — implementation intentions d = 0.61 (Gollwitzer & Sheeran 2006); MCII meta g = 0.336 overall, g = 0.255 academic (Wang 2021, n=15,907); unreinforced if-thens fail — reminders must fire at trigger time; plans need pre-written fallback branches (both are Wang's own recommendations).
4. **Habits take months, not 21 days** — Singh 2024 PNAS meta (20 studies, 2,601 participants): median 59–66 days, range 4–335, only ~23% reached automaticity; determinants include morning practice, self-selected habits, context stability, implementation plans. Binary streak chains punish exactly the users who need the most time; weekly-consistency framing replaces them.
5. **Confidence-calibrated quizzing** — JOLs are systematically overconfident after re-reading; calibration discrepancy predicts ineffective strategy choice (Wei 2025; Lee 2025). Ask "how sure are you?" before revealing answers; show per-subject calibration history.
6. **Interleaving, honestly labeled** — worse practice performance, better delayed-test performance (Brunmair & Richter 2019); benefits absent/reversed for dissimilar content; learners' judgments don't track the advantage (Németh 2025) — a metacognitive trap the UI must name ("feels worse, works better"), measured at 1–2-week delay before any claim.
7. **Physically recorded, optionally reported progress** — monitoring goal progress promotes attainment; effects larger when recorded and reported (Harkin 2016). Reflections, habit ticks, and share-cards satisfy the moderator — share *behaviors*, never identities (Gollwitzer 2009: public identity goals reduced subsequent effort).
8. **Detachment ritual** — psychological detachment is the central recovery experience (effort–recovery model; incomplete detachment predicts exhaustion); burnout interventions show small real effects (Madigan 2024); social support mitigates burnout (Chong 2025). Evening ritual should close the day; rest is scheduled, not stolen.
9. **One-tap schedule recovery** — academic buoyancy predicts lower later adversity (Putwain 2023); Wang 2021 demands flexibility; the "what-the-hell effect" (one miss → abandonment) is practitioner consensus (design guidance, not a verified experiment). Recovery is the promoted morning action, framed without guilt.
10. **Procrastination counter: reduce aversiveness at the entry point** — task aversiveness (r ≈ .40) and impulsiveness (r ≈ .41) are the strongest tractable correlates (Steel 2007); treatment meta is small (g = 0.34; CBT g = 0.55 after outlier removal; no long-term data — Rozental 2018). Two-minute starters and obstacle naming are scaffolds, **never a treatment claim**.

Plus: time management's strongest measured benefit is **distress reduction** (r = −0.358, Aeon 2021, 158 studies) — a study OS should market and measure calm, not just throughput; deadline bunching overwhelms students (practitioner-level evidence) → collision radar; attention residue from unfinished switches (Leroy 2009) → one-line next-action notes; body doubling's formal evidence is **thin** (best found: a 2025 VR study, n=12) → rooms ship as a measured experiment, not a bet; deposit contracts fail on uptake (people decline to deposit — Giné et al. NEJM) → behavioral stakes only, if any.

## 6.2 Cross-cutting anti-patterns the evidence bars

Unbroken streaks as the primary mechanic; public identity-goal celebration; trusting felt fluency; money-stakes as a headline mechanic; awareness-only bias education; rigid generated plans without fallback branches; presenting AI predictions as facts.

## 6.3 V1 → V2 mechanism map (06 closing table, condensed)

| V1 surface | Evidence-backed V2 delta |
|---|---|
| Tasks + NLP capture + replan | Auto-segmentation; calibration ledger feeding estimates; promoted one-tap recovery |
| FSRS/SM-2 flashcards, Anki IO, adaptive suggester | Exam-anchored 10–20% gap rule; retrieval tickets for notes; workload caps |
| Focus Room + tab defense + reflection | Close-the-loop next-action notes; single-task session header |
| Intelligence engine, subject health, momentum | Calibration scores (planning + metacognitive); interleaving-vs-blocked delayed comparison; load/rest early warning |
| Morning/evening rituals | Detachment gate (plan hidden after evening closure); recovery-first morning framing |
| Weekly review + next-week seeding | Prediction-vs-actual as the review's spine |
| Habits + streaks + heatmap | Month-scale expectations; miss-tolerant consistency scoring; context-stability prompts |
| Goals + exam feasibility + generated plans | WOOP wizard with if-then reminders and fallback branches; outside-view feasibility |
| Realtime Study Rooms + pacts | Behavioral sharing only; in-app experiment design for body-doubling claims |

---

# 7. Solis V1 to V2 Gap Analysis

The gap map from input 07 (Part 1), which is itself the synthesis of inputs 01–06. Each entry carries its V2 call. Cross-references: candidates C1–C35 (§9, §15); declines D1–D14 (§23).

## 7.1 Missing capabilities

| ID | Gap | Evidence | V2 call |
|---|---|---|---|
| G1 | Material→recall ingestion pipeline (syllabus/PDF/slides → topics, dates, cards, source-cited) | 03 §5 table stake #2 missed outright; 05 §4 C ("kills hours of setup") | **Build (narrow first)**; lecture audio **Defer** |
| G2 | True mobile surface (installable PWA, widgets, verified runtime) | 03 §5 table stake #4 missed ("web-only is a churn filter"); 01 §5.2 runtime unverified | **Build** — audit first |
| G3 | Live calendar subscriptions / two-way sync | 01 §3.15 paste-only import; 03 interop bar | **Build** — read-only ICS URLs first; Google OAuth V3 |
| G4 | Cross-device continuity of invisible state | 01 §1 debt 1 (~40 keys); 02 D13 | **Fix** |
| G5 | Rotating/A-B timetable & semester structure | 03 timetable row (LMS importer covers content, not the term grid) | **Build-lite** — a projection, not a fourth scheduler; photo scan **Decline** |
| G6 | Due-recall in the daily surface | 01 §4 break #2 | **Build** (small, high-leverage) |
| G7 | Server push notifications | 02 §1.7/D13 | **Decision required** — recommend build, deterministic triggers only |
| G8 | Recurrence schedule browsing UI | 01 §3.2 OPINION | **Build-lite** |

## 7.2 Underdeveloped capabilities

| ID | Gap | Evidence | V2 call |
|---|---|---|---|
| U1 | Analytics is a report, not a control surface | 01 §4 break #3 | **Fix** — triage queue with write-back |
| U2 | No estimation calibration | 06 §1 (Buehler; reference class) | **Build (deterministic)** — ledger + inflation + auto-segmentation |
| U3 | Goals are not obstacle-first | 06 §4 (WOOP meta) | **Build** — WOOP wizard + fallback branches |
| U4 | Habit model vs the evidence | 06 §2 (Singh 2024) | **Consolidate + Build** — consistency scoring + scheduled windows |
| U5 | SRS scheduling stops at flashcards | 06 §7 | **Build** — retrieval tickets, exam anchoring, caps |
| U6 | AI confidence invisible | 01 §3.13 (warn-in-console) | **Fix** — surface tier + faithfulness |
| U7 | Rooms lack accountability micro-mechanics | 04 §10.3 | **Build-lite** — declaration + check-in; measure |
| U8 | Focus loop edges (aborted work invisible; no adaptive breaks) | 01 §4 break #5; 04 §5.1 | **Fix + Build** |
| U9 | Quizzing lacks confidence calibration | 06 §9 (JOL) | **Build (deterministic)** |
| U10 | Interleaving not offered or labeled | 06 §8 | **Defer/Experiment** — same-type only, measured at delay |
| U11 | Weekly review is a report, not a cycle-closing proposal | 01 §3.10 | **Consolidate** — approve-diff + prediction-vs-actual spine |
| U12 | Notes lack typed study records / saved views | 04 §7.1/§7.3 | **Build (medium)** — rides ingestion |

## 7.3 Outdated, inefficient, disconnected

| ID | Gap | Evidence | V2 call |
|---|---|---|---|
| O1 | FSRS-5 core vs FSRS-6 | 02 §2; 06 §7 | **Evaluate/upgrade** |
| O2 | Device-local state model | = G4 | **Fix** |
| O3 | Paste-only ICS | 01 §3.15 | = G3 |
| O4 | AI latency posture unverified (streaming behavior never tested) | 05 §3.13 | **Design requirement** — verify first |
| O5 | Stale docs; duplicated schema SQL | 01 §6; 02 D17 | Housekeeping (escalated, §14) |
| O6 | Non-user-scoped cache keys + global invalidation | 02 D5/D9 | **Fix (foundations)** |
| I1 | Three scheduling vocabularies | 01 §4 break #1 — "single largest IA debt" | **Consolidate** — one canonical model (highest-leverage fix) |
| I2 | Routines need manual "Sync today" on two pages | 01 §4 | **Fix** — auto-materialize at day load |
| I3 | Manual session logging duplicates the cascade (reading/PDF not focus-anchored) | 01 §4 | **Fix** — study surfaces focus-eligible |
| I4 | Evening closure creates duplicate tasks instead of linking backlog | 01 §4 (`DashboardPage.tsx:728-744`) | **Fix** — link-or-create |
| I5 | Alerts scatter across surfaces | 04 §10.1 | **Build** — one triage inbox |
| I6 | Aborted stopwatch work invisible | 01 §4 break #5 | **Fix** — honest partial-work capture |
| I7 | Recommendations demand manual follow-through | 01 §4 break #3 | = U1 |
| X1 | Three reflection stores, no unified timeline | 01 §4 | **Consolidate** |
| X2 | Drift pad has no reader | 01 §4 (`FocusContext.tsx:851-862` writes; no reader) | **Fix** — triage surfacing |
| X3 | Interruption data has no trend view | 01 §4 | **Build-lite** |
| X4 | Scholar Report orphaned from goals/exams | 01 §4 | **Fix** — link from exam surfaces |
| X5 | AI telemetry with no consumer | 01 §3.13; 02 | **Sink or delete** (rule 10) |
| X6 | Simulated ambient presence in production | 02 D1 | **Fix before any V2 social work** |
| X7 | Memory state never pushes on the calendar | 03 §6.1 "the closed loop nobody closes" | **Build** — retention-aware replanning (the flagship) |
| X8 | Habits tracked but never scheduled | 04 §2.2 | = U4 |

## 7.4 Intelligent opportunities

**Deterministic automation (no AI):** A1 calibration ledger + per-item slippage forecasting ("at current pace, Topic X lands 3 days short by Oct 14") · A2 deadline collision radar + weekly load budget · A3 auto-segmentation of >90-min captures · A4 automatic routine materialization at day start · A5 habit placement in time windows with approval · A6 adaptive breaks from circadian synthesis · A7 confidence-calibrated quiz reveal + calibration scores · A8 retrieval tickets, exam-anchored 10–20% intervals, workload caps · A9 two-minute starter on avoided tasks · A10 related-content link suggestions (one-tap accept) · A11 close-the-loop next-action notes · A12 detachment gate + rest as first-class items.

**AI layer (proposes; user disposes):** A13 syllabus/document parsing (schema-validated, user confirms every field) · A14 AI-drafted study plans validated by deterministic feasibility math · A15 deepened grounded Ask Solis (forced citations, surfaced faithfulness, grounding extended to plans/sessions/history) · A16 Socratic Tutor Mode (hint ladders, never direct coursework answers) · A17 Weekly Review Agent (approve-diff proposal, numbers-in-prompt) · A18 AI flashcard/quiz generation retained · A19 voice dictation (optional).

**Explicit declines with verified reasons (05 §5):** autonomous replanning; proactive AI nudges; LLM memory layers; live voice tutors; OAuth/MCP agents; LLM-per-capture parsing; LLM as the intelligence engine.

## 7.5 Differentiation opportunities and strategic risks

**Differentiators:** Diff1 explainable receipts (nearly unique among profiled products) · Diff2 retention-aware replanning (flagship) · Diff3 BYOK planning under a privacy contract · Diff4 committed study pacts (behavioral stakes, measured) · Diff5 term-scale feasibility · Diff6 tutor grounded in the student's own system · Diff7 honest freemium (loop free forever) · Diff8 the cross-domain wiring itself.

**Risks (R1–R13):** bloat (R1) → sequencing + loop-stage test; migration risk on consolidation (R2, Logseq warning) → incremental evolution; read-path ceiling (R3, D4/D9); integrity (R4, D1); regression (R5, D10/D2) → CI first; schema-drift masking (R6, D3); trust from silent automation (R7) → approval gates everywhere; agent-washing/cost (R8) → no AI in loops; mobile parity (R9) → audit first; a11y (R10) → Lighthouse/axe before UI work; monetization positioning (R11); overclaiming on thin evidence (R12) → labeled experiments; monolithic pages as merge hazards (R13, D6) → incremental extraction.

---

# 8. Existing Capability Evolution Opportunities

These upgrades evolve features V1 already has — no new subsystems required beyond the foundations of §13.

**Planning surfaces → one model with projections.** The three scheduling vocabularies collapse into the canonical schedule entity (C3); the Today timeline, hourly/weekly planner, study agenda, and calendar overlay become projections over it. Routines materialize automatically at first day load with manual override kept (C7a, `materializeRoutinesForToday()` already in the contract — FACT (code), `api.interface.ts:158-164`). Evening closure matches the backlog first (link-or-create; C7b). Recurrence gains a browsable schedule view (G8). A term/timetable projection adds rotating class slots (C22).

**Focus Room → honest, evidence-aligned edges.** Aborted/partial stopwatch work is logged with neutral framing (duration + optional reason; excluded from streaks, included in minutes and calibration — C7c), which is also the honest ground truth the calibration ledger (C8) needs. An optional one-line "next step when I return" note discharges attention residue on early exits (C13, Leroy 2009). Circadian-timed break suggestions arrive as buffer artifacts with dismiss (C15 — the resolved two-class rule, §12). Tasks that slip twice get the anti-avoidance kit: two-minute starter + obstacle naming (C16).

**Flashcards → a recall system that fills the day.** A due-review block materializes daily from FSRS counts, capped by the review-minute budget (C4+C11). Retrieval tickets extend scheduling to notes (C11). Confidence-before-reveal adds a calibration score per subject (C12). FSRS-6 replaces FSRS-5 behind the same interface if the benchmark on V1's own logs wins (C24). Interleaved sets appear only for same-type topics, labeled and measured at delay (C35).

**Habits → survive real weeks.** Weekly-consistency scoring ("6/7 days") becomes the headline; month-scale expectation copy replaces "21-day" folklore; a context-stability prompt follows a miss; habits become flexible calendar entries placed in time windows by the planner and re-placed only via approve-diff (C10).

**Goals → obstacle-first with fallbacks.** The WOOP wizard (Wish → Outcome → Obstacle → If-Then) stores structured if/then fields that fire at trigger time; every generated plan embeds a pre-written fallback branch (C9).

**Analytics → a control surface.** The explainable recommendation cards gain state (open/acknowledged/actioned/dismissed) and land in the triage queue with their receipts; the calibration ledger and per-item slippage forecasts join the intelligence snapshot; the collision radar and weekly load budget force explicit trade-offs (C5, C8, C17). Scholar Report links from exam surfaces (X4); interruption trends join cognitive-load analytics (X3).

**Notes → typed structure without filing.** Optional typed study records (Lecture/Reading/ExamQuestion/Mistake), 2–3 saved views, and deterministic related-content suggestions with one-tap accept (C23/C33) — the Capacities/Obsidian-Bases mechanism over V1's existing wiki-graph, never auto-filing (Mem lesson).

**Weekly review → closes the cycle.** Prediction-vs-actual becomes the spine (planning calibration C8 + metacognitive calibration C12); next week arrives as one approve-diff proposal (C29) — the narrative upgrades from report to proposal while the deterministic fallback keeps working without AI.

**Rooms → witnessed commitment.** Goal declaration on session join, closing check-in ("did you do what you declared?") feeding analytics, scheduled recurring sessions, and rooms-vs-solo measurement (C18). Realtime debts fixed at the same touchpoint (D7/D8/D22). Pacts productized as a labeled experiment with behavioral stakes only (C32).

**Notifications → synced and (optionally) push.** Inbox/prefs become synced user data (C2); deterministic schedule triggers gain optional Web Push with server-side quiet hours and minimal payloads (C25); AI-generated nudges remain banned.

**Mobile & accessibility.** Runtime audit first (Lighthouse/axe + real devices), then PWA installability, widget surface (due counts, quick-start, capture), and fixes for the dense rooms/exam modals (C21).

---

# 9. New Capability Opportunities

The 35 build candidates of input 08 (C1–C35, plus the C33 merge), corrected per the critique: C11's dependencies fixed, the Diff2 flagship is C30, C23 split across Phases 2–3. The 14 declines (D1–D14) are in §23. Full tier definitions are in §15; phase assignments in §19–§20.

## 9.1 The full capability-candidate table (tier classification, from 08 §3.3)

| ID | Candidate | Tier | Dominant criteria | Reasoning |
|---|---|---|---|---|
| C1 | Engineering Foundations & Integrity Repairs | **V2 Core** | Strategic importance, risk, maintenance | Every later phase multiplies these codepaths; CI is "the single cheapest high-value fix" (02 §5); simulated presence is an integrity defect blocking all social V2 work (07 R4/X6) |
| C2 | Cross-Device State Continuity | **V2 Core** | User value, core-loop impact, strategic importance | ~40 device-local keys are a verified continuity failure (01 §1); nothing else is trustworthy until state follows the student |
| C3 | One Canonical Schedule Model (incl. recurrence browsing) | **V2 Core** | Core-loop impact, strategic importance, user value | The "single largest IA debt" (01 OPINION) and the enabler of C4/C10/C17/C30/C31; highest-leverage fix in input 07 |
| C4 | Due Review in the Daily Surface | **V2 Core** | Core-loop impact, frequency, effort | Smallest closure of the strongest engine; verified break #2; S-effort, daily use |
| C5 | Triage Queue & Analytics Write-Back | **V2 Core** | Core-loop impact, user value | Repairs verified break #3; converts analytics to a control surface; sink for all proposals |
| C6 | Unified Reflections & Drift-Pad Reader | **V2 Core** | User value, effort | Verified disconnection with a readerless capture (X1/X2); cheap read-side consolidation |
| C7 | Frictionless Day Mechanics | **V2 Core** | Frequency, effort, rule 6 | Three verified daily frictions with deterministic fixes |
| C21 | Mobile: PWA, Widgets, Runtime Hardening | **V2 Core** (audit + PWA baseline) / High Value (widgets) | User value, retention, rule 11 | "Web-only is a churn filter" (03 §5); runtime never verified; audit gates design. **Core = criticality, not build window** — scheduled Phase 3 because truthful widgets need C2's synced state (resolved, §15) |
| C26(a) | Surfaced AI Confidence (source tier + faithfulness in the answer UI) | **V2 Core** (Core-scoped slice of C26) | User value, effort, trust | S-effort repair of U6; the safety machinery exists but is invisible |
| C8 | Calibration Ledger & Per-Item Slippage Forecasting | **V2 High Value** | User value (strongest evidence), differentiation | Buehler 1994 + reference-class evidence (06 §1); the building block of the flagship (C30) and term feasibility (C31) |
| C9 | WOOP Goal Wizard | **V2 High Value** | User value, differentiation | g = 0.336 / 0.255 academic (Wang 2021); unserved by every competitor surveyed |
| C10 | Evidence-Aligned Habit System | **V2 High Value** | User value, retention, frequency | Singh 2024 rewrites the habit contract; scheduling rides C3 |
| C11 | Retrieval Tickets, Exam-Anchored Intervals & Workload Caps | **V2 High Value** | User value, differentiation | Extends the strongest verified engine; Cepeda 10–20% rule unserved; feeds Diff2 |
| C12 | Confidence-Calibrated Quizzing | **V2 High Value** | User value, effort | S-effort, strong JOL evidence (06 §9), daily frequency |
| C13 | Close-the-Loop Next-Action Notes | **V2 High Value** | User value, effort | Leroy 2009; S-effort; rides the auto-cascade |
| C14 | Detachment Gate & Scheduled Rest | **V2 High Value** | User value, positioning | Effort–recovery model; embodies calm-over-engagement |
| C15 | Adaptive Breaks from Circadian Data | **V2 High Value** | User value, effort | Circadian engine exists and only reports (07 U8); buffers are derived artifacts with dismiss (§12) |
| C16 | Anti-Avoidance Kit | **V2 High Value** | User value, effort | Strongest tractable correlate (r ≈ .40); tiny; honest scoping |
| C17 | Deadline Collision Radar & Weekly Load Budget | **V2 High Value** | User value, differentiation | Deadline-bunching evidence (06 §10); rides C3/C8; feeds C31 |
| C18 | Rooms Accountability Micro-Mechanics | **V2 High Value** | Differentiation, user value | Focusmate's verified-effective mechanics (04 §10.3) on a working realtime base; shipped with measurement |
| C19 | Material→Recall Ingestion Pipeline (narrow first) | **V2 Differentiator** | Differentiation, user value, strategic importance | The largest expectation gap (table stake #2 missed); output enters a real schedule — the step content machines can't take; Phase 3 so material lands in a *working* loop |
| C20 | Live Calendar Subscriptions (read-only ICS) | **V2 High Value** | User value, effort | Table stake #5 partial; avoids the OAuth control problem; two-way Google is V3 |
| C22 | Term/Timetable Projection Layer | **V2 High Value** | User value, differentiation (with C31) | Parity with MSL's bar; explicitly a projection, not a fourth scheduler |
| C23(core) | Typed Study Records schema + Saved Views | **V2 High Value** (Phase 2) | User value, strategic importance | Types the engine's inputs; feeds C11/C26. **Split resolution:** schema+views early Phase 2 |
| C23(doc)/C33 | Document-typed Records + Related-Content Suggestions | **V2 High Value** (Phase 3) | Effort, user value | Rides C19's ingestion; deterministic one-tap suggestions (the safe version of AI-organization) |
| C24 | FSRS-6 Upgrade (evaluate, then upgrade) | **V2 High Value** | User value, effort | Benchmark scheduler moved; self-contained; ships only if the benchmark on V1's logs confirms |
| C25 | Server Push Decision (decision Phase 0, build Phase 3) | **V2 High Value** | User value, strategic importance | Wang 2021: unreinforced intentions fail; recommend real push, deterministic triggers only |
| C26(b) | Grounded Ask Solis Deepening | **V2 High Value** (Phase 4) | User value, differentiation, effort | Keep & deepen the core AI anchor; provenance over the student's own material sidesteps open-web accuracy wars |
| C27 | Socratic Tutor Mode | **V2 Differentiator** | Differentiation, user value, effort | Harvard RCT constrains the design; course-specific grounding is the edge; **with the n=194 caveat (§16.5), shipped with learning-outcome measurement, not just usage metrics** |
| C28 | AI-Drafted Study Plans (validator disposes) | **V2 Differentiator** | Differentiation, user value, risk | Scout-class convenience; validator + approve-diff neutralize the PlanBench failure mode |
| C29 | Weekly Review Agent (approve-diff) | **V2 Differentiator** | Core-loop impact (Improve), differentiation | Closes the cycle as one diff; numbers-in-prompt + the tempered interpretation rule (§12.4) |
| C30 | Retention-Aware Replanning | **V2 Differentiator — the flagship (Diff2)** | Differentiation (flagship), user value, strategic importance | 03 §6.1 white space; "memory pushed back on my calendar" is the moat; gated on C3 |
| C31 | Term-Scale Feasibility Intelligence | **V2 Differentiator (Diff5)** | Differentiation, user value | 03 §6.4 white space; deterministic engine beats an LLM exactly here; false-positive warnings spend trust — accuracy measured (§21) |
| C32 | Study Pacts as a Measured Experiment | **V2 Experimental** | Differentiation, risk | Deposit uptake verified-weak; body-doubling evidence thin — behavioral stakes only, pre-declared metrics |
| C34 | Voice Dictation into Capture Fields | **V2 Experimental** | Effort, risk | On-device first; visible-before-save transcription |
| C35 | Interleaved Practice Sets (labeled, measured) | **V2 Experimental** | User value, risk | Verified effect + verified metacognitive trap; same-type gating mandatory; measure at delay |
| D1–D14 | Deliberate declines | **Reject/Avoid** | All | Each carries its evidence and rule violation — §23 |

**Tier counts:** Core 9 (C1–C7, C21 baseline, C26a) · High Value 18 (C8–C18, C20, C22–C26, C33) · Differentiators 6 (C19, C27–C31) · Experimental 3 (C32, C34, C35) · Reject/Avoid 14. *(Corrected from input 08, which double-counted C19 in both the High Value and Differentiator ranges; C19's tier row — Differentiator — governs.)*

## 9.2 Candidate notes (condensed; complexity S ≤ focused change, M ≤ feature module, L ≤ multi-week subsystem, XL ≥ quarter-scale)

**Core tier.** **C1** (L): CI running typecheck + suite + build + Lighthouse/axe budgets on every push; user-scoped cache keys with per-channel invalidation; fail-loud deploy-time schema check (kills the PGRST204 silent column-strip, `tasks.service.ts:117-125, 172-186`); simulated presence replaced by real room Presence or removed/labeled; incremental extraction of the six monolithic pages as touched. **C2** (L): inventory the ~40 `solis_*` keys, classify (user content / device preference / ephemeral — **the classification is a named Phase-1 design deliverable**, not yet specified), migrate user-content classes to new RLS-covered Supabase tables behind `IDataService`, WAL stays the write path, localStorage demoted to offline cache, per-class shipping with visible sync state. **C3** (XL): one typed schedule entity (fixed/flexible/defended + provenance: task, plan item, block, habit window, review, rest, buffer, external) with the four existing surfaces as projections; incremental backfill; recurrence browser. **The write path during migration is the named top open design question** (§13.4). **C4** (S given C3): `review` entry type materialized at day start from FSRS due counts, capped by C11's budget; drill CTA carries subject context. **C5** (M): insight objects gain `state` + action payloads; acknowledge/schedule/dismiss persists; dashboard badge; queue caps against bloat. **C6** (S–M): read-side unification of the three reflection stores (no migration needed); drift-pad writes gain a `resurfaced` flag consumed by triage. **C7** (S–M): auto-materialized routines; link-or-create evening intentions; honest partial-work records (`aborted: true` flag, neutral copy). **C21** (L): audit → PWA installability + hardened service worker → widgets (due counts / quick-start / capture; lock-screen data = counts only); dense-modals fix; stores deferred. **C26(a)** (S): pure UI over existing faithfulness scores (`ai.service.ts:621`).

**High Value.** **C8** (M): join existing estimates/actuals; per-subject overrun ratio with sample-size guardrails; "your estimates run X% optimistic" visible at morning ritual and weekly review; slippage forecasts per item; auto-inflation opt-out-able. **C9** (M): 4-step wizard; structured if/then fields; trigger-time reminders; fallback branches as C3 flexible blocks. **C10** (M): consistency scoring as a pure computation over toggle history; habit window/duration fields; approve-diff re-placement; chain kept as a secondary stat. **C11** (M–L): ticket schema with source links; exam-anchored interval biasing as a modifier on FSRS output; caps via subject-health data. **C12** (S): one tap before reveal; calibration ratio with sample-size guard; toggleable mode. **C13** (S): prompt in the existing abort/switch flow; note rides the auto-cascade. **C14** (S–M): post-closure UI state (plan hidden, notifications muted); `rest` type excluded from productivity pressure; opt-out-able. **C15** (M): `buffer` artifacts from circadian peaks/valleys; Focus Room suggests breaks at computed midpoints; A/B'd against fixed cadences. **C16** (S): deferral-count threshold triggers the kit; answers stored on the task. **C17** (M): cluster detection weeks ahead; explicit trade-off prompts via C5; budget from C8-inflated durations. **C18** (M): declaration + check-in ride the existing room event stream; recurring sessions as C3 entries; rooms-vs-solo comparison. **C20** (M): ICS URL subscriptions with polling + backoff; overlay entries as fixed C3 entries; URLs encrypted at rest. **C22** (M–L): recurring timetable entries with rotation rules; term view aggregating the arc. **C23** (M): note schema gains `type` + fields; saved views are saved filters; suggestions via deterministic keyword/trigram matching over the existing local index. **C24** (M): offline benchmark harness; state-preserving migration; feature-flagged. **C25** (M–L): edge function evaluates due triggers from C3 → Web Push (VAPID); server-side quiet hours; minimal payloads. **C26(b)** (M): retrieval index extension to canonical-model entities; chunk-scoped, never whole-notebook.

**Differentiators.** **C19** (L): deterministic PDF text extraction → AI structuring pass (BYOK or the existing clamped edge path — the free-tier boundary is resolved in §12.5) → schema validation → confirm-everything review screen → writes through existing services with provenance retained; unparseable files fall back to manual entry. **C27** (S–M): system-prompt constraint; hint-ladder depth is a user setting; non-moralizing usage logging; **learning-outcome measurement added** (calibration-score delta for tutor users vs non — added by this consolidation to answer the critique). **C28** (M–L): schema-constrained JSON drafts from real subjects/dates/mastery; validator = exam feasibility + C8 capacity + C17 collisions; failing drafts return with the constraint named. **C29** (M): prediction-vs-actual spine; one approve-diff for next week; numbers-in-prompt with the §12.4 interpretation caveat. **C30** (L): thresholds on deterministic signals (due-count vs cap, subject health, cushion drift) → reflow proposals as C3 diff objects in C5; evidence receipts; conservative thresholds; persisted dismissals. **C31** (M–L): per-subject feasibility over the term arc consuming C22 + C8 + retention state; warnings always carry recovery actions.

**Experimental (pre-declared metrics required — thresholds are a Phase-2 deliverable).** **C32** (M): pact board = read-only aggregation of recorded weekly summaries; no money ever. **C34** (S): Web Speech API first; feature-detect. **C35** (M): deterministic same-type set mixing; static label; delayed outcome join.

---

# 10. Cross-Feature / System-Level Opportunities

The system view from input 07 (Part 2): the brief's chain — Goals → Planning Engine → Schedule → Study Sessions → Performance → Analytics → Insights → Schedule Adaptation → Future Planning — becomes **one system with one state model and closed loops**.

**The canonical schedule model is the glue.** Tasks, study plan items, time blocks, habit windows, review blocks, rest, and buffers become typed entries in one entity (fixed/flexible/defended — the Clockwise data-model lesson); every surface is a projection. This single decision deletes the "which surface owns my time" question (I1), makes retention-aware replanning possible (you cannot reflow what isn't one model), and gives habit scheduling and due-review blocks a home.

**The proposal layer is the trust glue.** Every engine- or AI-proposed *change to a user-authored commitment* lands as one proposal object: `{evidence receipt, diff payload, state: open|approved|dismissed}` — modeled as a 17th `IDataService` domain (`proposals`), because the triage "schedule" actions (C5), WOOP fallbacks (C9), habit re-placement (C10), collision trade-offs (C17), AI plan drafts (C28), weekly review diff (C29), and retention reflows (C30) share exactly this mechanism. §12 restates the write-rule in its resolved two-class form.

**Where each cross-cutting concern fits:**

| Concern | Role |
|---|---|
| AI | A proposal layer over the spine: drafts plans, parses syllabi, answers grounded questions, tutors Socratically, narrates computed numbers. Never writes user commitments silently; never computes feasibility/retention/mastery; fully absent ⇒ app still works |
| Reminders | Deterministic timed triggers bound to the canonical schedule (block start, hour review, WOOP if-then at trigger time, quiet hours); cross-device delivery per the C25 decision |
| Collaboration | *Witnessed commitment* attached to the spine: declaration + check-in feed personal analytics; every social feature must deliver value at zero participants; a measured experiment, not a bet |
| Analytics | The shared brain; its only output surfaces are the triage queue and timeline markers; insight objects write back |
| Integrations | Symmetric adapters: inputs (ingestion, ICS subscriptions, LMS import) land in the canonical model; outputs (ICS, Anki, JSON/CSV, Markdown) leave it; no lock-in |
| Timetable | A projection layer, not a fourth scheduler |
| State continuity | Everything user-authored or user-visible syncs to the account; nothing lives only in `localStorage` |

**Design invariants carried from V1 (protect these):** offline-first with honest failure states; AI-absent ⇒ fully functional (to be *enforced* by a CI test once CI exists — Phase 0 G1 — an unbuilt invariant claimed as CI-tested would be overreach); approval gates on proposals; explainability receipts; BYOK privacy posture; undo on destructive actions.

**What gets demoted or deprecated** (answering the critique's "nothing gets cut"): the derived-block scheduling vocabulary (absorbed as a projection); the manual "Sync today" buttons on Dashboard and Study (replaced by auto-materialization with manual override); the device-local notification store (migrated to the synced inbox); the `src/services/supabase/schema*.sql` "reference copies" (deleted for generated single-source schema); three of four keepalive implementations (consolidated to two); the AI telemetry store (sink **or** delete — no dead telemetry); the cheering affordance (demoted pending usage evidence); the dashboard "Active Knowledge" card re-scoped to surface cards, not just notes.

---

# 11. UX and Information Architecture Evolution

Every change is stated as user problem (evidence) → improvement → expected benefit, from input 09 Part 3.

**Navigation.** IA is clean and role-named but pages are heavy (Dashboard renders 6+ panels and 5 modals; Settings is 1,459 lines), and nav copy carries two competing "plan" vocabularies, reinforcing the three-scheduler confusion (01 §5.1 OPINION). → Keep the 4-section/11-item shell and ⌘K/⌘J chrome; rename plan entries to one canonical vocabulary ("Today", "Planner", "Study"); add **Triage** ("Needs a decision") as a first-class surface with a badge; add **Term** as a view under Planning. → One mental model of "where is my time"; decisions have one address.

**Dashboard / Today.** Due recall one hop away; recommendations never write back; "Active Knowledge" resurfaces notes not cards; the plan stays visible after evening closure; aborted work vanishes. → The Today timeline becomes the projection of the canonical model and gains: a due-review block with live counts + drill CTA; triage badge and inline acknowledge/schedule/dismiss; rest and buffer types; the post-closure "day is done" detachment state; honest partial-work logging on abort. → Recall is part of the day; insights are one tap from executed; the app visibly protects recovery.

**Onboarding.** Activation is checklist-driven (good) but the mental-model stage is copy-heavy, time-to-first-action is unmeasured ("42 s" is simulation), and the hardest setup step — turning syllabi into a system — is entirely manual. → Keep the 3-stage modal and Next-Best-Action card; measure activation with real telemetry (G6); add an optional "import your syllabus" first-action once C19 ships; synced state makes a second device "just work". → Measured activation; setup becomes a review instead of data entry.

**Planning interactions.** Three schedulers, no owner; manual routine sync on two pages; evening closure duplicates tasks; recurrence unbrowsable; terms are rotating grids. → One canonical model with projections; auto-materialized routines; link-or-create; recurrence browser; timetable/term projection; **every proposed plan change arrives as an approve-diff, never a silent edit**. → The "which surface owns my time" question disappears; trust is preserved.

**Session (Focus) interactions.** Aborted work discarded; attention residue unmanaged; circadian data never acts on break timing; nothing targets avoided tasks. → Honest partial-work capture (neutral copy); optional next-action note on early exit; circadian-timed break *suggestions* (derived artifacts with dismiss, §12); two-minute starter + obstacle naming on twice-slipped tasks. → Analytics sees real work; calmer re-entry; breaks land on this student's dips.

**AI interaction patterns.** Faithfulness warn-in-console; Ask Solis answers but doesn't teach; weekly synthesis narrates but doesn't propose. → Surfaced source tier + faithfulness; grounding extended to plans/sessions/history; Socratic Tutor Mode; validator-gated drafts; weekly review agent; ingestion structuring with per-field confirmation — all behind the same invariants. → Trustworthy, checkable AI; Scout-class convenience without Motion-class autonomy.

**Notifications.** Device-local inbox; no server push — reminders don't reach a closed laptop, which weakens WOOP if-then reminders. → Synced inbox/prefs; Web Push scoped to deterministic schedule triggers; server-side quiet hours; minimal payloads; no AI nudges ever. → Triggers fire on the device in hand. *(iOS compromise, resolved: browser push on iOS PWAs is limited, so Phase-2 WOOP reminders fire in-app while the app is open and via push on supporting platforms from Phase 3, with honest capability copy; the §21 metrics watch WOOP completion to decide whether to pull the minimal push evaluator forward.)*

**Mobile.** Web-only is a churn filter; runtime never verified; rooms/exam modals dense. → Audit first (Phase 0); PWA installability + hardened service worker; modal fixes; widgets (counts only on lock screen). → Present at the moment of capture and recall.

**Accessibility.** aria coverage uneven (28 of the feature files); custom divs with unverified keyboard operability; Lighthouse/axe never run. → Lighthouse + axe budgets gate CI; keyboard-operability audit for custom click-targets; every new surface ships with the gate. → Accessibility becomes an invariant.

**Command palette & NL.** Palette + Ask Solis work but search covers only existing entities. → Index extends to canonical entities, typed records, saved views, triage items; NL capture stays deterministic-first. → The keyboard path reaches everything V2 adds.

## 11.1 Proposed V2 information architecture (V1/V2-marked tree, from 09 §3.11)

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
    │   ├── Tasks: list / day / 7-day / Eisenhower, NLP capture, undo [V1]
    │   │   └── Recurrence browser [V2]
    │   ├── Planner (hourly + weekly, calendar overlay) [V1→V2 projection]
    │   ├── Study agenda (today queue) [V1→V2 projection]
    │   ├── Term view (15-week arc; feasibility summary) [V2]
    │   └── Timetable grid (rotating class slots) [V2]
    ├── FOCUS [V1]
    │   └── [V2] partial-work capture · next-action note · adaptive break suggestions ·
    │        anti-avoidance kit (two-minute starter / obstacle naming)
    ├── STUDY & KNOWLEDGE
    │   ├── Subjects & syllabus topic trees [V1]
    │   ├── Flashcards & spaced review (FSRS/SM-2, Anki IO, exam cram) [V1]
    │   │   └── [V2] retrieval tickets · exam-anchored intervals · workload caps ·
    │   │        confidence-before-reveal + calibration score
    │   ├── Notes (wiki-links, graph, autosave, pins, history) [V1]
    │   │   └── [V2] typed records · saved views · related-content suggestions
    │   ├── Ingestion (syllabus / PDF / document import → review-and-confirm) [V2]
    │   └── Ask Solis [V1] → [V2] surfaced faithfulness & source tier · grounded plans/
    │        sessions/history · Socratic Tutor Mode
    ├── PROGRESS
    │   ├── Analytics (tiles, trends, insights, heatmap) [V1]
    │   │   └── [V2] calibration ledger · slippage forecasts · collision radar ·
    │   │        weekly load budget · rooms-vs-solo measurement
    │   ├── Goals & exams (milestones, feasibility, plan generation) [V1]
    │   │   └── [V2] WOOP wizard + fallback branches
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

## 11.2 The aggregate interaction tax (an honest confrontation the inputs avoided)

The critique is right that "calm over engagement" can be honored per-feature and violated in aggregate — 35 build candidates each add a prompt, a tap, or a surface. The budget adopted here: **the daily standing surface gains exactly three new elements** (the due-review block, the triage badge, the detachment state). Everything else is weekly (collision radar, review proposal, pact board), threshold-driven (slippage, reflow), optional-with-default-off (voice, interleaving, confidence-mode trial), or surfaces only on the relevant event (partial-work capture, next-action note, anti-avoidance kit). The triage queue is itself a *consolidation* — it replaces V1's scattered alert surfaces with one place, a net reduction in nagging. And §21 measures the tax directly: **prompts/pauses surfaced per active day**, with a standing cap principle that any feature raising the daily median without raising completion gets retuned or demoted.

---

# 12. AI and Automation Strategy

## 12.1 The division of labor

Deterministic engines compute everything that must be right (FSRS scheduling, retention, mastery, feasibility, capacity, collisions, calibration); AI does what deterministic software cannot (parse free-text syllabi, draft sequences, answer synthesis questions, tutor Socratically, narrate computed numbers). Twelve automation opportunities (A1–A12, §7.4) need no AI at all. The AI layer (A13–A19) is strictly a proposal layer over the student's own data.

## 12.2 The write rule, resolved (this consolidation's fix of input 08's invariant)

Input 08 stated "No silent state writes ever — AI or deterministic" and then violated it with C4's day-start materialization, C7's auto-materialized routines, and C15's self-contradiction ("inserts buffers" vs "proposals, never silent edits"). The resolved, workable invariant is **two-class**:

1. **Class 1 — user-authored commitments** (tasks, blocks, plan items the student created or approved, habit definitions, goals): **no write without an explicit approve-diff — AI or deterministic.** This is absolute.
2. **Class 2 — derived materializations** (routine blocks, the due-review block, circadian buffers, calendar overlays, all projections): written automatically at day start **because they are derived, not authored** — always rendered as derived (visually distinct, provenance-labeled), always removable or dismissible, never overriding a user block, never counted as user commitments, and excluded from adherence metrics when dismissed. Any *edit to a Class-1 commitment* triggered by the same signals (e.g., re-placing a habit window, shifting a flexible block) is Class 1 and requires the diff.

C15's buffer insertion is therefore Class 2 (a derived suggestion with one-tap dismiss), not a silent edit and not a proposal-queue item; C4's review block and C7's routines are likewise derived with dismiss/override. The invariant sentence for engineering: *"Nothing the user authored moves without a diff; nothing derived masquerades as authored."*

## 12.3 The build list and the avoid list

Build (from 05 §4, unchanged): grounded Ask Solis (deepen); AI flashcard/quiz generation; **syllabus/document → structured topics + exam dates** (schema-validated, every field user-confirmed); AI-drafted plans validated before display; numbers-only weekly narrative; optional on-device dictation. Avoid (each with verified evidence): autonomous replanning; proactive AI nudges; LLM memory layers; live voice tutors; OAuth/MCP agents; LLM-per-capture parsing; LLM as the intelligence engine (full reasoning in §5.3 and §23).

## 12.4 Grounded narration, stated honestly

The numbers-in-prompt pattern prevents the model from fabricating *digits*; it does not prevent misinterpretation — wrong trend readings, invented causal attributions ("your retention fell because…"), confident overgeneralization from noisy data. The controls: the narrative always renders the computed numbers alongside the prose so the student can check every claim against Analytics; the weekly narrative is optional and dismissible; causal attributions are barred from the prompt contract; and the AI-telemetry consumer (surfaced faithfulness, §21) makes answer quality measurable.

## 12.5 BYOK, cost, and the ingestion boundary (resolved)

BYOK (user-supplied session-scoped Gemini key, `sessionStorage` default) keeps operator AI cost at ≈ $0 and the data relationship user→provider. The Flash-class envelope (heavy ≈ $1.20–1.50/mo; typical ≈ $0.30–0.60/mo, computed from fetched Gemini pricing) bounds any future subsidized tier. **The ingestion free-tier boundary is resolved as follows:** ingestion is BYOK-first; a student with no key uses the existing authenticated edge-function proxy, which already clamps payloads (MAX_CHUNKS=40, MAX_CHUNK_CHARS=4000, MAX_COUNT=10 — FACT (code), `supabase/functions/generate-cards/index.ts`) and returns an honest 503 when no server key is set; because ingestion is a few-times-per-semester, low-frequency surface, the clamped edge path bounds operator exposure; a keyless student with the edge path unavailable falls back to manual entry, and the Settings copy states the boundary explicitly. What is *not* decided here: whether the operator ever funds a hosted AI tier (§17 open decision).

## 12.6 AI-absent ⇒ fully functional

The hard invariant, inherited from V1's verified three-tier fallback: key absent or network down ⇒ nothing breaks. It will be **enforced by a CI test once CI exists (Phase 0 G1)** — asserting CI coverage before CI exists would repeat the overreach the critique caught; it is a build requirement, not a current fact.

---

# 13. Architecture and Technical Evolution

## 13.1 What stays (protect)

The 16-domain `IDataService` abstraction + delegating proxy; the Supabase data model + RLS posture (26 tables, 50 policies); the deterministic engine layer; the cross-domain auto-cascade; race-guarded auth + guest snapshot migration; the offline WAL; rooms realtime (minus the simulated widget); the three-tier AI pipeline + grounding gate + local RAG; the stack itself (React 19.2.8 / TS strict / Vite 6 / Supabase JS / Vitest); the partial-failure UX pattern (all FACT (code), 02 §1–§2).

## 13.2 What is refactored in place

Hot read paths (fetch-all → date-scoped, server-filtered, paginated; memoization boundaries on the intelligence snapshot); cache (user-scoped keys, per-channel invalidation, honest mock behavior); pub/sub (9 → all domains + `proposals`); monolithic pages (incremental extraction on the `useStudyPage` pattern); notification service (synced inbox/prefs + optional push behind the same interface); realtime details (server-derived `is_host`, cached profile map, poll back-off); AI plumbing duplication (shared JSON parser; faithfulness surfaced); schema sources (migrations → generated types + single reference SQL **before** the C3 migration); keepalive (4 → 2); room message reads (newest-first window).

## 13.3 What is built new (additions, not rewrites)

1. **Canonical schedule model** — typed entries with provenance; new Supabase tables; projections for the four surfaces; incremental backfill. 2. **Proposal / approve-diff layer** — the 17th service domain (`proposals`). 3. **State-continuity service** — cloud tables for the ~40 key classes; localStorage demoted to cache. 4. **Ingestion pipeline** — extraction → structuring → validation → confirmation with provenance store. 5. **Push infrastructure** — edge function evaluating deterministic triggers → Web Push. 6. **Observability** — opt-in product telemetry (event names + coarse counters, never content), error sink, per-route error boundaries. 7. **CI + deploy-time schema check.** 8. **Term/timetable projection + calendar subscription adapters.**

Background jobs stay deliberately minimal: the existing monitors (30 s block alerts, 60 s presence poll, 5 s room poll, keepalives) plus day-start materialization, ICS polling with backoff, the push evaluator, and the FSRS-6 offline benchmark harness. A client-side product does not need a job platform.

## 13.4 Named open design questions (the critique's "hand-waved hard parts," surfaced rather than hidden)

These are Phase-1 deliverables with owners-before-code status; the inputs did not settle them and this document does not pretend to:

1. **C3 write path during migration** (top open question). Recommended mechanism (RECOMMENDATION, to be designed): feature-flagged dual-write (read-old/write-new → write-new/read-new) with per-surface cutover; projection reads render from whichever store is live for that surface; backfill runs behind CI with a snapshot-before-migration and a documented restore path (the snapshot pattern already exists in guest migration, `AuthContext.tsx:57-133`). Editing a projection writes through to the canonical entity from cutover onward.
2. **C2 key classification.** The audit verified the inventory (~40 keys) but no input classified them. Indicative classes: *user content* (daily intention, ritual done-flags, welcome-back choices, note pins, note version history, notification inbox, gentle-start capacity) → migrate; *device preference* (sidebar state, density, theme beyond account default) → stay local; *ephemeral/cache* → drop. The actual per-key classification table is the first Phase-1 artifact.
3. **Multi-device conflict resolution.** Default recommendation: last-write-wins per key for Class-2-adjacent state and per-record for structured user content, with WAL replay preserved and conflict events surfaced honestly; final design is a Phase-1 deliverable.
4. **Migration rollback.** Snapshot-before-migrate per class, visible sync state, and a tested restore path — required before either migration ships (extends the verified guest-snapshot pattern).

---

# 14. Technical Debt and Prerequisite Work

The 23-item register from input 02, triaged as in input 09 (with the D17/D18 escalation kept).

## 14.1 Must fix before V2 features (Phase 0)

| # | Debt | Evidence | Gate |
|---|---|---|---|
| D1 | Simulated peer presence in the production service | `presence.service.ts:8-49`; registered `supabaseService.ts:93`; violates `master.md §1.2 rule 5` | G2 |
| D2 | No CI on push/PR — only a keepalive cron | `.github/workflows/` has one file | G1 |
| D3 | PGRST204 retry silently strips new columns from task writes | `tasks.service.ts:117-125, 172-186` | G3 |
| D4 | Fetch-all-then-JS-filter hot paths | `tasks.service.ts:14-67`; `study.service.ts:293-321` | G4 (start Phase 0, finish with C3 projections) |
| D5 | Cache keys not user-scoped; mock never invalidates | `tasks.service.ts:15`; `study.service.ts:294`; `rooms.service.ts:15`; `mockService.ts:356-365` | G4 |
| D6 | Six monolithic pages (1,000–1,600 ln) + 2,987-ln mock service | 02 D6 | Extract incrementally as touched, through Phases 1–2 |

**Escalation (divergence noted, kept):** D17 (duplicated schema SQL) and D18 (`as any` casts / generated DB types) move from the audit's "improve during V2" tier into Phase 0 as G5 — the canonical-model migration is the riskiest schema work in the product's history and should not run with two schema truths and unchecked mappers. Cost is days, not weeks.

## 14.2 Scheduled during V2

D7 host-identity heuristics → Phase 2 (rooms touchpoint) · D8 poll/N+1 → Phase 2 · D9 whole-cache invalidation → Phase 0 (G4) · D10 zero component tests → Phase 0 tooling, seeded per extraction · D11 no telemetry sink → Phase 0 (G6) · D12 committed URL/key fallbacks → Phase 0–1 · D13 device-local notifications → Phase 1 (sync) + Phase 3 (push) · D14 duplicated LLM JSON parser → Phase 3 (with C19) · D15 write chains without reconciliation → Phase 2 (reconciler once partial-work records exist) · D16 guest migration drops goals/plan-items/time-blocks → Phase 1 (honest migration UX) · D22 oldest-100 room messages → Phase 2.

## 14.3 Tracked, not scheduled

D19 (`tsconfig` excludes `vite.config.ts`) · D20 legacy `NEXT_PUBLIC_` envPrefix · D21 keepalive sprawl (consolidate opportunistically when CI lands) · D23 only 2 TODO markers (keep the hygiene).

## 14.4 The Phase-0 gate (must precede features)

G1 CI running the green suite + build + Lighthouse/axe budgets on every push · G2 presence honesty fix · G3 fail-loud schema contract · G4 user-scoped cache + date-scoped reads · G5 generated DB types + single schema truth · G6 opt-in metrics/error sink + per-route boundaries · G7 mobile runtime audit + a11y audit (the audit, not the fixes) · G8 decisions taken early (server push build/reposition; FSRS-6 evaluation kickoff). Nothing in Phases 1–4 begins before the gate clears; §19 gives each phase's definition of done.

---

# 15. Prioritized V2 Capability Backlog

Tier definitions (§9.1 carries the full candidate table): **V2 Core** defines the release — the loop is broken without it. **V2 High Value** is evidence-backed depth riding the core. **V2 Differentiators** are the moat, sequenced late because they compound everything before them. **V2 Experimental** ship as measured, labeled experiments. **Later (V3)** is real and evidenced but not now. **Reject/Avoid** is declined with reasons.

**Resolved definition (the critique's contradiction, settled):** *Core names criticality, not build window.* A Core item that V2 cannot ship without may still land in Phase 3 if its dependencies demand it — the mobile audit + PWA baseline is Core-critical but builds in Phase 3 because truthful widgets and push require C2's synced state, and the audit (Phase 0) gates its design. The V2 definition of done (§18.3) is what Core means operationally: **all Core-tier items must be complete for V2 to be called done, whenever in the sequence each lands.**

## 15.1 Priority map (P0 Must → P4 Experimental → Do Not Build)

| Priority | Capability | Reason | Dependency | Phase |
|---|---|---|---|---|
| P0 Must | C1 Engineering foundations & integrity repairs (incl. D17/D18 escalation) | Every later phase multiplies these codepaths; CI is the cheapest high-value fix (02 §5); presence is an integrity defect (R4) | None | 0 |
| P0 Must | Mobile + a11y runtime audits; push decision; FSRS-6 evaluation kickoff | Gates all UI work (R9/R10); scope decisions for Phase 3 | C1 (CI for gates) | 0 |
| P1 Must | C2 Cross-device state continuity | ~40 device-local keys strand intention/rituals/pins/inbox; enables truthful widgets/push | C1 | 1 |
| P1 Must | C3 One canonical schedule model | Single largest IA debt; gates C4/C5/C10/C15/C17/C28/C29/C30/C31 | C1, C2 | 1 |
| P1 Must | C4 Due review in the daily surface | Verified break #2; smallest closure of the strongest engine | C3 | 1 |
| P1 Must | C5 Triage queue & analytics write-back | Verified break #3; sink for all proposals | C3 | 1 |
| P1 Must | C6 Unified reflections + drift-pad reader | Verified X1/X2; cheap read-side consolidation | C5 | 1 |
| P1 Must | C7 Frictionless day mechanics | Three verified daily frictions; feeds C8's data | — (C8 benefits) | 1 |
| P1 Must | C26(a) Surfaced AI confidence | S-effort trust repair; safety machinery exists but invisible | Existing AI service | 1 |
| P2 High | C8 Calibration ledger & slippage | Strongest evidence base; building block of C30/C31 | C7 (honest partials), C5 | 2 |
| P2 High | C9 WOOP goal wizard | g = 0.336/0.255 academic; unserved by surveyed competitors | Notifications; C3 (fallbacks) | 2 |
| P2 High | C10 Evidence-aligned habits | Singh 2024 rewrites the habit contract; tracked-but-never-scheduled (X8) | C3, C8 | 2 |
| P2 High | C11 Retrieval tickets, exam-anchored intervals, caps | Extends the strongest verified engine; Cepeda rule unserved | C4, **C23(core)** *(corrected: input 08's C22/C25 row was erroneous)* | 2 |
| P2 High | C12 Confidence-calibrated quizzing | S-effort; strong JOL evidence; daily frequency | Review surfaces | 2 |
| P2 High | C13 Close-the-loop next-action notes | Leroy 2009; S-effort; rides the auto-cascade | None | 2 |
| P2 High | C14 Detachment gate & scheduled rest | Effort–recovery model; embodies calm-over-engagement | C3 (rest type), C2 | 2 |
| P2 High | C15 Adaptive breaks | Circadian engine exists and only reports | C3 (buffers) | 2 |
| P2 High | C16 Anti-avoidance kit | Strongest tractable correlate (r ≈ .40); tiny | C5 (sink), focus flow | 2 |
| P2 High | C17 Collision radar & load budget | Deadline-bunching evidence; feeds C31 | C3, C8, C5 | 2 |
| P2 High | C18 Rooms accountability mechanics | Focusmate's verified-effective mechanics on a working realtime base | Rooms infra; C5; C2 | 2 |
| P2 High | C23(core) Typed-record schema + saved views | Types the engine's inputs; feeds C11/C26 | C3 (course context) | 2 |
| P3 Diff/Reach | C19 Material→recall ingestion (narrow) | Largest expectation gap; output enters a real schedule | C3; C23 typing | 3 |
| P3 High | C20 ICS URL subscriptions | Completes a verified partial integration; feeds C17/C29 realism | C3 | 3 |
| P3 High | C21 PWA baseline + widgets (Core-critical) | "Web-only is a churn filter"; audit already run in P0 | C1 (audit), C2 (truth), C4 (content) | 3 |
| P3 High | C22 Term/timetable projection | MSL-parity bar; explicitly a projection | C3; C20 (source) | 3 |
| P3 High | C24 FSRS-6 upgrade | Benchmark scheduler moved; ships only if benchmark wins | None | 3 |
| P3 High | C25 Server push (implementation) | Decision in P0; unreinforced intentions fail | C2, C3, C1 | 3 |
| P3 High | C23(doc)/C33 Document-typed records + suggestions | Deterministic one-tap organization (the safe version) | C19 | 3 |
| P4 Diff | C26(b) Ask Solis deepening | Keep & deepen the anchor; provenance over own material | C3/C23 entities | 4 |
| P4 Diff | C27 Socratic Tutor Mode | Harvard RCT constrains design; course-grounded constraint is the edge | C26 | 4 |
| P4 Diff | C28 AI-drafted study plans | Validator + approve-diff neutralize the PlanBench failure mode | C3, C8, C17 | 4 |
| P4 Diff | C29 Weekly review agent | Closes the Improve stage as one diff | C8, C12, C5, C3 | 4 |
| P4 Diff | C30 Retention-aware replanning (**flagship, Diff2**) | The closed loop nobody closes; most defensible differentiator | C3 (mandatory), C4, C11, C5, C8 | 4 |
| P4 Diff | C31 Term-scale feasibility (Diff5) | "Exactly where a deterministic engine beats an LLM" | C3, C8, C22 | 4 |
| P4 Exp | C32 Study pacts (measured experiment) | Diff4; deposit uptake verified-weak, body-doubling thin — behavioral stakes only | C18, C2 | 4 |
| P4 Exp | C34 Voice dictation | Optional; on-device first | None | 4 |
| P4 Exp | C35 Interleaved sets | Verified effect + verified metacognitive trap; same-type gating; measure at delay | C23 typing | 4 |
| Do Not Build | D1–D14 | Each carries verified evidence + violated rules — §23 | — | — |

## 15.2 Borderline calls, argued (updated)

- **Mobile: Core or High Value?** Core (baseline) — rule 11 plus the verified churn-filter finding make audit + installable baseline release-defining; widgets stay High Value because platform surface is unbounded. The build-window question is settled by the criticality/dependency distinction above.
- **Ingestion: Core or Differentiator?** Differentiator, deliberately — building it before the loop closes would pour material into three vocabularies and a non-writing analytics surface. Differentiation tier + Phase 3 captures both facts.
- **Server push: build or reposition?** Decide early, lean build — C9's if-then reminders need to fire when the app isn't open; scope is deterministic triggers only; the iOS compromise is §11.
- **Rooms/pacts: High Value or Experimental?** Split by mechanics — C18 is High Value (verified-effective mechanics on a working system); C32 is Experimental (verified-weak stakes uptake; honesty demands measurement-first).
- **FSRS-6: now or later?** High Value, evaluated early — self-contained, tested state round-trips exist; ships when the benchmark on V1's own logs confirms, not on fashion.
- **Adaptive breaks: High Value or Experimental?** High Value — the engine exists; the delta is deterministic actuation with dismiss, and the A/B comparison is part of the feature.

---

# 16. V2 Product Vision

## 16.1 What Solis fundamentally becomes

V1's identity, verified in code, is *the wiring*: one deterministic intelligence engine wired across planner, learning, focus, habits, and review, with the focus→reflection auto-cascade as its spine. No profiled competitor ships anything like it end-to-end (03 §3 head-to-head, absence scoped to the profiled set). V2 keeps that identity and fixes the three structural failures that stop it from being felt:

| V1 failure | What V2 makes of it |
|---|---|
| Loops that don't close (three vocabularies; report-only analytics; recall one hop away; aborted work invisible) | **One system with one state model** — canonical schedule with projections; every insight lands in a triage queue where acknowledge/schedule/dismiss writes back; due review is a block in the day; partial work is captured honestly |
| Continuity that doesn't exist (~40 device-local keys) | **Everything user-authored syncs.** Nothing user-visible lives only on one device |
| Intake that never happens (no ingestion; paste-only ICS; web-only) | **The student's real material flows in.** Narrow ingestion (syllabus/PDF/docs → topics, dates, cards, source-cited), live calendar subscriptions, an installable mobile surface |

The product slogan that is honest about all of this: **"the study OS that plans your term, times your recall, guards your focus, and tells you the truth about your pace."**

## 16.2 Target user

Primary: **the self-directed, exam-driven student** — undergraduate or master's (or serious self-learner), 2–6 courses per term, 2–5 h/day across a 15-week term, at least two devices (laptop + phone), currently gluing Google Calendar + Anki/Quizlet + a notes app + a focus timer and losing the connections. The accountability cohort with an ADHD lens is in scope: Flow Club sustains $40/mo (50% student discount) and reports 62% ADHD identification among surveyed members (FACT (web)) — **evidence that co-presence sustains a paid category, not proof of demand for Solis's own rooms** (critique fix). Who it is not for: the casual quiz-crammer (Turbo/Knowt serve that), enterprise workflow teams (Motion/Reclaim), blank-canvas builders (Notion's user).

**Honest caveat (critique 2.3):** this persona is asserted from product logic and competitor triangulation. **Not one data point about V1's existing users exists in any input** — no counts, retention, churn, or interviews. Validation is therefore a named prerequisite: Phase-0 telemetry (G6) plus user interviews before Phase-3+ scope locks (§21). The plan's bet should be treated as a hypothesis with a measurement plan, not a market fact.

## 16.3 The core problem solved better than V1

> **The tools that track your learning never act on it, and the tools that act never know your learning.**

1. **"My plan doesn't know what I remember."** No profiled product lets memory state push back on the calendar; Solis's retention engine computes, the V2 planner finally reflows (C30).
2. **"The app tells me things but makes me do the work."** V1's recommendations navigate away; V2's triage queue writes back (C5).
3. **"My tools don't accept my actual material."** The 2024–26 wave set the expectation; V2 ingests narrowly and its output enters a real schedule — what the content machines cannot do (C19).
4. **"My second device doesn't know me."** The ~40 device-local keys (C2).

## 16.4 Value proposition

| Pillar | Claim | Grounded in |
|---|---|---|
| The deterministic study brain | Retention, mastery, feasibility, and circadian intelligence that is explainable, offline, and free — never an LLM's guess | 01 §3.9 (15 engine modules, working); 05 §5.6 decline |
| The closed loop | What you do updates everything; every recommendation one tap from executed; memory renegotiates the calendar with approval diffs | 01 §3.4; 04 §2.2; 03 §6.1 |
| Trust by construction | Your keys (BYOK), your data (JSON/CSV/ICS/Anki export), free learning loop forever, AI proposes / user disposes | 05 §3.14; 03 §4.3; 05 §3.11 |

## 16.5 Product philosophy (the ten working principles)

1. **Deterministic brain, AI hands.** Engines compute; AI drafts language. LLMs never compute feasibility, retention, or mastery.
2. **AI proposes, user disposes — with the two-class write rule.** Nothing authored moves without a diff; nothing derived masquerades as authored (§12.2).
3. **Receipts on everything.** Signal → Evidence → Action on every recommendation.
4. **AI-absent ⇒ fully functional.** Enforced by CI once CI exists (G1).
5. **Free learning loop; meter only generative AI; BYOK structural.** The Quizlet and Superlist lessons; Flash-class envelope ≈ $1.20–1.50/heavy-user/mo, ≈ $0 operator under BYOK.
6. **Evidence over folklore.** Every behavioral mechanism ships with its citation and honest scoping; no "21-day" claims anywhere.
7. **Calm over engagement — with an aggregate budget.** Distress reduction is time management's strongest measured benefit (r = −0.358); the daily surface gains exactly three standing elements, and the daily interaction tax is measured (§11.2).
8. **Mobile-equal, accessible from the start.** Runtime audits gate UI work.
9. **Honest experiments, labeled.** Thin-evidence mechanisms (body doubling, pacts, interleaving) ship as measured experiments with pre-declared thresholds.
10. **Incremental evolution, no rewrites.** Schema evolution inside the existing spine; the Logseq caution stands.

## 16.6 What Solis must NOT become

Not a generic todo app (Todoist owns lists at $7/mo and isn't study-science aware); not a generic AI chatbot (value must come from data ChatGPT lacks); not a social network (no feeds, no stranger pairing; rooms are witnessed commitment that works at zero participants); not gamification theater (no Karma-style box economies; momentum keys off study minutes and retention); not over-automated (no silent rescheduling; no proactive AI nudges); not a content-machine commodity chase (depth over breadth; win on where the output *goes*); not a paywalled study experience (no previously-free mode ever stranded); not a blank canvas or a rewrite.

---

# 17. V2 Product Blueprint

- **Vision** — §16, adopted unchanged from input 08 with the sequencing caveat (the flagship C30 lands in Phase 4 behind the C3 migration; Phases 1–3 deliver the closed loop, continuity, and intake that make it land).
- **Target users** — §16.2, with the no-user-evidence caveat and the validation prerequisite.
- **Core problems** — §16.3's four.
- **Value proposition** — §16.4's three pillars.
- **Core product loop** — seven stages (defined in input 07 Part 3; the per-phase field tables in §19 carry them): **Trigger** (deterministic, explainable) → **Plan** (pre-composed day; optional AI draft validated before shown; fallback branches) → **Act** (context-carried focus; next-action notes; witnessed commitment) → **Track** (auto-cascade + confidence ratings + honest partial work) → **Understand** (deterministic intelligence with receipts; triage queue; grounded/tutor AI) → **Adapt** (slippage, collisions, review reflow — all approve-diffs; one-tap recovery) → **Improve** (estimates converge on the student's real pace; the weekly review closes the cycle). Excluded by design: AI interruption, silent rescheduling, gamified churn, identity-goal celebration, paywalled study modes, monetary stakes.
- **Major systems** — canonical schedule model + projections; state-continuity service; proposal/triage layer; deterministic intelligence engines + calibration ledger; study engine (FSRS backbone + retrieval tickets); ingestion pipeline; integration adapters; rooms/pacts collaboration; notification/push; AI proposal layer; observability.
- **AI/automation strategy** — §12: deterministic-first; AI strictly a proposal layer; two-class write rule; BYOK; the resolved ingestion boundary.
- **Collaboration strategy** — witnessed commitment, not a network: declaration + check-in, recurring sessions, pacts as a labeled measured experiment with behavioral stakes; value at zero participants mandatory; share behaviors, never identities.
- **Analytics strategy** — the deterministic engine stays the shared brain; triage queue + timeline markers are its only output surfaces and they write back; calibration ledger, slippage, collision radar, load budget, term feasibility — all deterministic with receipts; opt-in product telemetry strictly separated from learning data.
- **Integration strategy** — symmetric adapters (inputs land in the canonical model; outputs leave it); no OAuth agents, no lock-in; Google two-way sync deferred to V3.
- **Security/privacy direction** — RLS on every new table; BYOK unchanged (sessionStorage default); ICS URLs encrypted at rest; push payloads minimal (counts/titles); on-device STT default; documents go to AI only via the user's key or the clamped edge path with documented flows; committed URL/key fallbacks removed from source; the free learning loop is itself a privacy posture.
- **Scalability direction** — fix the read path before layering (date-scoped queries, pagination, memoization seams); per-room-scoped realtime stays the right shape; large-artifact storage (PDFs) stays client-side unless ingestion proves a server need — an explicit decision, not an accident.
- **Differentiation strategy** — lead with **Diff2 + ingestion**: "material in, memory-aware schedule out." Diff1/Diff3/Diff6/Diff7/Diff8 support; Diff4/Diff5 follow the flagship.
- **Business model (the open decision, stated honestly).** The research fixes constraints, not the answer: the learning loop stays free forever (the Quizlet/Knowt lesson); generative AI is BYOK-first (≈ $0 operator cost) with a bounded Flash-class envelope if ever subsidized; metering, if adopted, applies only to the content/agent layer, never to a previously-free study mode; competitor anchors span $6.99–$40/mo. **Pricing, paid tier, and distribution are undecided open questions this document deliberately does not answer** — they require the user evidence named in §16.2 and the cost baselines from §21 before they can be decided responsibly.
- **Explicit non-goals** — §23.

---

# 18. Strategic Development Roadmap

## 18.1 The dependency logic (five forcing chains, each traceable to the inputs)

1. **Risk chain:** CI + fail-loud schema + scoped cache (Phase 0) must precede the two biggest migrations V2 will ever run — state continuity (C2) and the canonical model (C3) — because regression and schema drift are the dominant risks (07 R2/R5/R6).
2. **Model chain:** the canonical schedule model (C3) is the prerequisite for due-review blocks (C4), triage "schedule" actions (C5), habit placement (C10), buffers (C15), collision math (C17), AI plan writes (C28), review-agent diffs (C29), retention reflows (C30), and term feasibility (C31) — you cannot reflow what isn't one model.
3. **Truth chain:** synced state (C2) must precede widgets and push (a widget showing device-local state would lie about it) and precede honest multi-device metrics.
4. **Value chain:** loop closure (Phase 1) precedes intake (Phase 3) — material poured into three vocabularies and a non-writing analytics surface would deepen the debt; depth (Phase 2) precedes reach for the same reason.
5. **Trust chain:** the proposal/approve-diff layer and surfaced confidence (Phase 1) must exist before AI drafting and replanning (Phase 4) arrive, or the trust invariant is retrofitted under pressure.

Named sequence: **0 Guardrails → 1 Loop Closure → 2 Evidence Depth → 3 Intake & Reach → 4 AI Differentiation.** This matches inputs 07/08 with the C23 split and C11 dependency corrections noted inline.

**Sizing caveat (kept honestly):** phases are ordered, not dated. C3 is XL and C2 is L; a single-developer-scale team should treat Phase 1 as quarter-scale and resist calendar-compressing it. Phase 0 is deliberately small (days–weeks) so the gate is real. No team, budget, or calendar is specified anywhere in the research — that is a stated out-of-scope, not an omission to backfill silently.

## 18.2 The five phases at a glance

| Phase | Theme | Candidates | Exit criterion |
|---|---|---|---|
| 0 | Foundations | C1 (+ C25 decision, mobile/a11y audits, FSRS-6 kickoff) | CI green on every push; presence honest; cache user-scoped; audits run; schema truth generated |
| 1 | Loop closure — the identity | C2, C3, C4, C5, C6, C7, C26(a) | Every verified loop break repaired; a new device sees the same day |
| 2 | Evidence depth | C8–C18, C23(core) | The loop stages carry their citations; determinism everywhere |
| 3 | Intake & reach | C19, C20, C21, C22, C24, C25-impl, C23(doc)/C33 | Table stakes #2/#4 closed; material enters a working schedule |
| 4 | AI differentiation | C26(b), C27, C28, C29, C30, C31, C32, C34, C35 | AI strictly a proposal layer; the flagship lives behind approve-diffs |

## 18.3 V2 definition of done

V2 ships when: (1) **all Core-tier items are complete** (per the resolved criticality definition, §15) — one schedule model, synced state, recall in the day, triage write-back, unified reflections, frictionless day, honest foundations, installable mobile baseline, surfaced AI confidence; (2) **High Value depth is fully shipped across the loop stages** (the critique's "substantially shipped" is tightened here: each Phase-2 and Phase-3 High-Value candidate is either shipped or explicitly re-scoped with a written rationale — "substantially" is not an acceptance criterion); (3) at least the **ingestion pipeline and retention-aware replanning** are live as differentiators (the latter behind approve-diffs); (4) the experiments (pacts, voice, interleaving) are instrumented with **pre-declared thresholds written before launch** (a Phase-2 deliverable, §21); and (5) the declines remain declined. The V3 list (two-way Google OAuth, Canvas/LMS import, lecture-audio transcription, photo Schedule Scan, behavioral share cards, family/school surfaces) is explicitly out of V2.

---

# 19. Phase-by-Phase Plan

Each phase carries its full field set; milestones are in §20.

## Phase 0 — Guardrails & Integrity (the gate)

| Field | Content |
|---|---|
| **Objective** | Make the codebase safe to change and honest to users: CI, integrity repairs, schema truth, scoped cache/reads, instrumentation, platform audits, early decisions. |
| **Why now** | Every later phase multiplies on these codepaths; CI is the cheapest high-value fix (02 §5); simulated presence is an integrity defect blocking social work (07 R4/X6); the PGRST204 strip would corrupt the C2/C3 migrations (07 R6); no runtime/a11y audit has ever been run (01 §0). |
| **Problems solved** | D1, D2, D3, D4 (start), D5, D9, D11, D12, D17, D18; R3–R6, R9, R10 gates. |
| **Systems affected** | CI/deployment, cache, read paths, presence service, schema tooling, telemetry, tests. |
| **Improvements included** | User-scoped cache keys; per-channel invalidation; date-scoped task/today-plan reads; mock cache invalidation; server-side host-identity groundwork; keepalive consolidation (opportunistic). |
| **New capabilities included** | CI pipeline + Lighthouse/axe budget gate; deploy-time schema check; generated DB types; single schema source; opt-in metrics/error sink + per-route error boundaries; mobile runtime audit; a11y audit; C25 push decision taken; FSRS-6 evaluation harness started. |
| **Architectural changes** | G1–G8 (§14.4). No product-schema changes yet. |
| **UX changes** | None user-facing except honesty: simulated ambient peers removed or clearly labeled; truthful sync/error states preserved. |
| **AI/automation changes** | None. (AI-telemetry sink-or-delete decision executed — X5.) |
| **Dependencies** | None — this is the dependency. |
| **Risks** | Audit findings could surface rework (07 R9) — that is the audit's purpose; regression risk in cache/read changes mitigated by running the green suite locally per change until CI exists. |
| **Expected user impact** | Indirect: honest presence data; no visible change otherwise. |
| **Expected product impact** | The enablement layer: every subsequent PR guarded, every migration checked, every claim in §21 measurable. |
| **Definition of done** | CI green on every push (typecheck + 1,162-test suite + build + Lighthouse/axe budgets); ambient presence backed by real Presence or removed/labeled; task writes fail loudly on schema mismatch; cache keys user-scoped with per-channel invalidation; hot reads date-scoped; metrics sink receiving opt-in events; audit findings logged with severity; push and FSRS-6 decisions recorded. |
| **Explicitly NOT included** | Any V2 feature surface; big-bang page extraction (incremental only); presence *features* beyond the honesty fix. |

## Phase 1 — Loop Closure (the identity)

| Field | Content |
|---|---|
| **Objective** | Repair every verified loop break of 01 §4: one schedule model, synced invisible state, recall in the day, analytics that writes back, unified reflections, frictionless day mechanics. |
| **Why now** | The model chain (§18.1 #2): C3 gates C4/C5/C10/C15/C17/C28/C29/C30/C31. Consolidations precede additions; "a new device sees the same day" is the exit test. |
| **Problems solved** | Breaks #1–#5 (01 §4); G4/G6/G8/I1–I6/O2/O6; X1/X2; U6. |
| **Systems affected** | Canonical schedule tables + projections; state-sync service; proposals service; pub/sub channels; notification inbox storage; reflections read model. |
| **Improvements included** | Routine auto-materialization at day load; evening link-or-create; honest partial-work capture; drift-pad reader; per-channel invalidation completed. |
| **New capabilities included** | C2, C3, C4, C5, C6, C7, C26(a). |
| **Architectural changes** | New `schedule`, `state_sync`, `proposals` domains (17 total); localStorage demoted to offline cache; projection layer over the four existing surfaces; backfill migration of the three vocabularies. |
| **UX changes** | Today timeline becomes the single projection with review/rest/buffer blocks; triage inbox with badge; unified reflections timeline; sync-state indicators per data class; honest migration messaging (D16). |
| **AI/automation changes** | Deterministic only (auto-materialization, review-block materialization, insight-state machine); surfaced faithfulness is pure UI over existing scores. All materializations follow the two-class write rule (§12.2). |
| **Dependencies** | Phase 0 gate (all of G1–G8). |
| **Risks** | Largest migration risk in V2 (07 R2) — mitigated by projections-first sequencing, incremental backfill, snapshot-before-migrate with restore path (§13.4), and CI; partial-migration inconsistency — per-class shipping with visible sync state. |
| **Expected user impact** | The daily surface finally answers "what's due, what needs deciding, what's left"; rituals/pins/history follow the student across devices; three daily frictions vanish. |
| **Expected product impact** | The identity ships: the loop closes. This is the release-defining phase. |
| **Definition of done** | A commitment created on any surface exists once in the canonical model and renders on all four projections; a second device sees intention/ritual/pins/history/inbox; due-review block shows live counts with a working drill CTA; every insight can be acknowledged/scheduled/dismissed with persistence; parked thoughts resurface; partial sessions recorded; surfaced confidence visible on every AI answer; the C3 write-path and C2 classification design documents exist and were executed against. |
| **Explicitly NOT included** | Habit scheduling, calibration, WOOP, breaks, collisions (Phase 2); ingestion/calendar/mobile/push (Phase 3); AI drafting (Phase 4). |

## Phase 2 — Evidence-Backed Depth

| Field | Content |
|---|---|
| **Objective** | Load the closed loop with the mechanisms the evidence demands — all deterministic, all citation-carrying. |
| **Why now** | Every item rides the Phase-1 model (C8 consumes partial-work data; C10/C15 consume C3 placement; C17 consumes C3+C8+C5). Evidence strength is highest here (06 §1/§2/§4/§7/§9); rule 14 satisfied by sequencing after foundations. |
| **Problems solved** | U2–U5, U7–U9; A1–A9, A11, A12; rooms debts (D7, D8, D15, D22); X3, X4. |
| **Systems affected** | Intelligence engines (calibration, collisions, budget), goals, habits, review surfaces, rooms realtime, focus flow. |
| **Improvements included** | Server-derived host identity; poll back-off; N+1 profile fix; write-chain reconciler; newest-first room messages; interruption trend view; Scholar Report links from exams. |
| **New capabilities included** | C8, C9, C10, C11, C12, C13, C14, C15, C16, C17, C18, C23(core: typed-record schema + saved views) *(the split resolution)*. |
| **Architectural changes** | Calibration ledger as a pure computation over existing estimates/actuals; habit-window and buffer/rest/break entry types exercised in C3; goal fields (obstacle/if-then/fallback); push triggers defined as data though push ships in Phase 3; **experiment success thresholds pre-declared** (§21). |
| **UX changes** | WOOP wizard; consistency-first habit framing ("6/7 days", month-scale copy); confidence tap before reveal (toggleable); detachment gate; two-minute starter; collision radar trade-off prompts; room declaration/check-in. |
| **AI/automation changes** | None required (all deterministic); WOOP AI drafting explicitly optional and speculative. |
| **Dependencies** | Phase 1 (C3 mandatory; C5 as the proposals sink; C2 for synced check-ins). |
| **Risks** | Alert/proposal fatigue — caps + persisted dismissals; small-sample overcorrection in the ledger — minimum-count thresholds and "insufficient data" honesty; habit placement autonomy creep — approval gates mandatory; overclaiming barred (R12). |
| **Expected user impact** | The app's estimates converge on this student's pace weekly; habits survive real weeks; review load respects capacity; recovery is protected. |
| **Expected product impact** | Depth the evidence demands — the differentiator building blocks (C8 feeds C29/C30/C31) are in place. |
| **Definition of done** | Visible "your estimates run X% optimistic" with per-item slippage forecasts; every generated plan carries a fallback branch; habit headline is weekly consistency with scheduled windows; review caps enforced with overflow pushed forward; confidence calibration score live; next-action notes pre-fill unfinished items; evening closure hides the plan; rooms record declarations and check-ins into analytics. |
| **Explicitly NOT included** | AI drafting of plans/reviews (Phase 4); ingestion; mobile widgets; term/timetable surfaces (Phase 3–4). |

## Phase 3 — Intake & Reach

| Field | Content |
|---|---|
| **Objective** | Accept the student's real material and be present on the phone: narrow ingestion, live calendar, PWA baseline + widgets, term projection, FSRS-6, push. |
| **Why now** | The value chain: material must enter a *working* schedule. The truth chain: widgets and push are honest only after C2 syncs state. Table stakes #2/#4 were missed outright. |
| **Problems solved** | G1, G2, G3, G5, G7, O1, O3; U12 (document-typed records); D14; A10. |
| **Systems affected** | Ingestion pipeline; subscriptions; PWA/service worker; timetable projection; FSRS engine; push edge function. |
| **Improvements included** | Keepalive consolidation completed; LLM JSON parser dedup (D14). |
| **New capabilities included** | C19, C20, C21 (PWA baseline + widgets), C22, C24, C25 (implementation), C23(doc)/C33. |
| **Architectural changes** | Extraction→structuring→validation→confirmation pipeline with provenance store; ICS polling with backoff and encrypted URL storage; push evaluator edge function; FSRS-6 behind the same interface with state-preserving migration, feature-flagged. |
| **UX changes** | Import review screen (per-field confirmation, source citations); subscription sync-state UI; installable home-screen app + widgets (counts only on lock screen); timetable grid + term view; honest browser-push capability copy (iOS limitations, §11). |
| **AI/automation changes** | First Core-AI feature (ingestion structuring, schema-validated, BYOK or the clamped edge path per §12.5; every field user-confirmed; unparseable files fall back to manual entry). |
| **Dependencies** | C3 (output lands in the model); C2 (synced state for widgets/push); C1 (CI for the new pipeline); C4 (widget content = due counts); the Phase-0 push decision. |
| **Risks** | PDF-extraction quality is the hard part even for incumbents — narrow first, manual fallback; hallucinated dates are "the dangerous one" — schema validation + mandatory confirmation; provider throttling on ICS polling — backoff + honest sync state; mobile audit may surface rework (accepted, R9); FSRS-6 ships only if the benchmark on V1's own logs wins. |
| **Expected user impact** | Hours of setup become a review; the plan reflects real life via the calendar; the phone is a first-class surface; reminders reach the device in hand. |
| **Expected product impact** | The two missed table stakes close; the expectation-setter converts into Solis's home advantage because output enters a real schedule. |
| **Definition of done** | A dropped syllabus produces a user-confirmed topic tree + exam dates + draft cards entering the canonical model with citations; a subscribed ICS overlays fixed entries and feeds collision warnings; the app installs and shows truthful due-count widgets; timetable rotation renders; FSRS-6 decision shipped or documented with benchmark results; deterministic triggers push cross-device with quiet hours. |
| **Explicitly NOT included** | Lecture-audio transcription, photo Schedule Scan (V3 — D12); two-way Google/Outlook OAuth (V3); native store apps. |

## Phase 4 — AI Differentiation & Compounding

| Field | Content |
|---|---|
| **Objective** | Ship the differentiators that compound everything before them — strictly as a proposal layer: grounded ask, tutor, validated drafting, review agent, retention-aware replanning, term feasibility, measured experiments. |
| **Why now** | The trust chain: the proposal layer, receipts, calibration numbers, and collision math exist; AI features now compose with them instead of being retrofitted. Differentiators compound prior phases. |
| **Problems solved** | X7/Diff2 (the loop nobody closes); Diff3–Diff6; A14–A19; U6(b); U10/U11; the flagship C30. |
| **Systems affected** | AI service (grounding index, tutor contract), proposals layer (consumer #1), weekly review, term view, pacts. |
| **Improvements included** | Grounding extended to plans/sessions/review history; retrieval index covers canonical entities. |
| **New capabilities included** | C26(b), C27, C28, C29, C30, C31, C32, C34, C35. |
| **Architectural changes** | No new infrastructure. Validator = existing feasibility + C8 capacity + C17 collision math gating drafts before display; numbers-in-prompt narration with the §12.4 interpretation controls; experiments instrumented with pre-declared metrics. |
| **UX changes** | Tutor Mode toggle with hint-depth settings; plan drafts as approve-diffs with named failing constraints on rejection; weekly review's prediction-vs-actual spine; reflow proposals with evidence receipts; pact board (behavioral stakes, read-only aggregation); dictation button; "feels worse, works better" interleaving labels. |
| **AI/automation changes** | The phase *is* the AI layer — all behind the invariants (AI proposes/user disposes; AI-absent ⇒ functional; deterministic engines compute every number; no silent writes to authored commitments). |
| **Dependencies** | C3, C5, C8, C11, C12, C17, C22, C26; BYOK path. |
| **Risks** | Trust risk if reflows feel automatic — the approve-diff is the whole design (07 R7); over-proposal — conservative thresholds, persisted dismissals; agent-washing pressure resisted (R8; Gartner >40% cancellation); experiments may show null results — pre-declared metrics and honest reporting are the point (R12). |
| **Expected user impact** | The schedule finally answers to memory; the week closes as a proposal; tutoring is integrity-safe and course-grounded; early honest warnings at term scale. |
| **Expected product impact** | The moat: Diff2 (flagship), Diff5, Diff6 live; everything respects the declined list; the §18.3 definition of done is satisfied. |
| **Definition of done** | Retention-aware replanning proposes reflows as approve-diffs in production; AI plan drafts are validator-gated with named constraints; weekly review closes with a one-diff proposal; Tutor Mode enforces its contract **and reports its learning-outcome measurement**; term feasibility computes across the arc; pacts/voice/interleaving run with pre-declared success thresholds. |
| **Explicitly NOT included** | Any decline D1–D14 (unchanged); autonomous execution of AI drafts; new infrastructure. |

---

# 20. Milestones and Dependencies

## 20.1 Milestone map

| Phase | Milestone | Capability group | Features |
|---|---|---|---|
| 0 | M0.1 Guardrails live | CI & integrity | CI workflow; Lighthouse/axe budget gate; deploy-time schema check; PGRST204 fail-loud |
| 0 | M0.2 Honest data | Presence integrity | Real-Presence-backed ambient widget (or labeled/removal); honest empty states |
| 0 | M0.3 Safe reads & caches | Performance & correctness | User-scoped cache keys; per-channel invalidation; date-scoped reads; mock invalidation parity |
| 0 | M0.4 Instrumentation | Observability | Opt-in product telemetry; error sink; per-route error boundaries; AI-telemetry sink-or-delete |
| 0 | M0.5 Schema truth | Data foundations | Generated DB types; single schema source; committed key/URL fallbacks removed |
| 0 | M0.6 Decisions & audits | Platform | Mobile runtime audit; a11y audit; push build/reposition decision; FSRS-6 benchmark harness |
| 1 | M1.1 One schedule model | Canonical model & projections | Schedule entity (fixed/flexible/defended, provenance); backfill; projections for timeline/planner/agenda/overlay |
| 1 | M1.2 State follows the student | State continuity | Intention, ritual flags, welcome-back, gentle-start, pins, note history, inbox/prefs → cloud; sync-state UI; honest migration messaging |
| 1 | M1.3 Recall in the day | Due review | Review block type; day-start materialization from FSRS due counts (capped); drill CTA |
| 1 | M1.4 Decisions close their loops | Triage & write-back | Proposal objects + triage inbox (acknowledge/schedule/dismiss, persisted dismissals, badge); unified reflections timeline; drift-pad reader |
| 1 | M1.5 Frictionless day | Day mechanics | Auto-materialized routines; link-or-create evening closure; honest partial-work capture |
| 1 | M1.6 Trustable answers | AI confidence | Source tier + faithfulness shown in the answer UI |
| 2 | M2.1 Honest pace | Calibration | Ledger; slippage forecasts; auto-segmentation >90 min; capacity inflation |
| 2 | M2.2 Obstacle-first goals | WOOP | 4-step wizard; trigger-time if-then reminders; fallback branches |
| 2 | M2.3 Habits that survive | Habit system | Weekly-consistency scoring; month-scale framing; scheduled windows with approve-diff re-placement; context-stability prompt |
| 2 | M2.4 Recall beyond flashcards | Retrieval depth | Retrieval tickets (typed sources); exam-anchored 10–20% biasing; daily review-minute caps with overflow |
| 2 | M2.5 Metacognitive honesty | Confidence | Confidence-before-reveal; per-subject calibration score |
| 2 | M2.6 Focus-loop edges | Attention & recovery | Next-action notes; detachment gate + rest blocks; adaptive break suggestions (A/B'd); anti-avoidance kit |
| 2 | M2.7 Workload foresight | Collision intelligence | Collision radar; weekly load budget; interruption trends; Scholar Report links |
| 2 | M2.8 Witnessed commitment | Rooms mechanics | Declaration; closing check-in; recurring sessions; rooms-vs-solo measurement; D7/D8/D22 closed; D15 reconciler |
| 3 | M3.1 Material flows in | Ingestion | Syllabus/PDF/text import → review-and-confirm → schedule + cards; provenance |
| 3 | M3.2 The calendar is real | Subscriptions | Read-only ICS URL subscriptions; overlay entries; collision inputs |
| 3 | M3.3 The phone catches up | Mobile | PWA installability; modal fixes; widgets (due counts / quick-start / capture); share-target |
| 3 | M3.4 The term has a shape | Term layer | Timetable projection with rotation; term view feeding feasibility |
| 3 | M3.5 The engine modernizes | FSRS-6 | Benchmark verdict; state-preserving upgrade behind flag (or documented decline) |
| 3 | M3.6 Triggers reach the device | Push | Web Push for deterministic schedule triggers; server-side quiet hours; minimal payloads |
| 3 | M3.7 Structure compounds | Typed records | Document-typed records; related-content one-tap suggestions |
| 4 | M4.1 Trustworthy grounding | Ask Solis deepening | Extended grounding; richer citations over canonical entities |
| 4 | M4.2 Learning, not answers | Tutor | Socratic Tutor Mode; hint ladders; non-moralizing usage logging; **learning-outcome measurement** |
| 4 | M4.3 Drafting under verification | Plan drafts | Validator-gated drafts; approve-diff; named rejections |
| 4 | M4.4 The week closes | Review agent | Prediction-vs-actual spine; next-week approve-diff; numbers-with-narrative |
| 4 | M4.5 Memory pushes back | Retention-aware replanning (**flagship**) | Threshold-driven reflow proposals; evidence receipts; approve-diff only |
| 4 | M4.6 The honest term | Term feasibility | Per-subject feasibility across the 15-week arc; early warnings with recovery actions |
| 4 | M4.7 Measured experiments | Experiments | Pacts board (behavioral stakes); voice dictation (on-device first); interleaved sets (same-type gated, delayed measurement) |

## 20.2 Hard dependencies and the design gates that gate them

- **Phase 0 → everything.** No Phase 1–4 work begins before M0.1–M0.6 clear.
- **C2 → widgets/push.** M3.3/M3.6 require M1.2 (truth chain).
- **C3 → C4/C5/C10/C15/C17/C28/C29/C30/C31.** M1.1 is the single hardest prerequisite in the plan.
- **C5 → all proposals.** The triage inbox (M1.4) is the sink for every later proposal object.
- **C8 → C29/C30/C31.** No flagship number exists without the calibration ledger (M2.1).
- **Design gates before code:** the C3 write-path plan (§13.4 #1) and the C2 key classification (§13.4 #2) must be written and reviewed before M1.1/M1.2 begin; the migration snapshot/restore design (§13.4 #4) before either migration ships; the conflict-resolution design (§13.4 #3) before M1.2 completes; experiment thresholds before any Phase-4 experiment launches.

---

# 21. V2 Success Metrics

**Measurement prerequisite (FACT (code)):** V1 has no product-telemetry sink (114 console sites, no external sink, AI telemetry with no consumer — 02 §1.10; 01 §3.13) and no runtime performance measurement has ever been run (01 §0). The Phase-0 instrumentation gate (G6) is therefore not optional bookkeeping — **every metric below is unmeasurable until it ships.** All metrics are opt-in and privacy-respecting (event names + coarse counters; never note/session content).

**No numeric targets are invented.** Targets are set after one baseline quarter of Phase-1 telemetry. Where research gives a directional basis it is cited; where it doesn't, the metric ships with "baseline first." Two honest fixes from the critique are built in: the three experiments' **success thresholds are a pre-declared Phase-2 deliverable** (written before any Phase-4 experiment launches — the promise in the inputs is kept by naming when the numbers get written), and "the app gets measurably smarter about your pace" is treated as a **hypothesis to be measured via the calibration ledger**, not a claim (the 38%→5% reference-class result is project-level data; the per-student transfer is exactly what the ledger will test or fail to show).

| Family | What to measure | Why (basis) | Instrument |
|---|---|---|---|
| **Activation** | Signup → first subject/task → first focus session → first review (funnel + time-to-step); % completing the activation checklist | The checklist exists but time-to-first-action has never been measured ("42 s" is simulation) | Product telemetry funnel; activation modal events |
| **Daily usage** | DAU/WAU; sessions/day; entry-point mix (morning ritual vs review CTA vs triage badge); **interaction tax: prompts/pauses surfaced per active day** (the §11.2 budget, measured) | Loop-closure claims are only credible if the daily surface actually pulls users in — and stays calm | Telemetry; triage/CTA event counters |
| **Weekly usage** | WAU; weekly-return rate; morning-ritual and evening-closure completion rates | Rituals are the loop's Trigger stage; completion is the loop's heartbeat | Ritual completion events (synced via C2) |
| **Planning completion** | % planned blocks executed vs deferred vs aborted (with partial minutes); adherence trend; estimate-vs-actual drift | V1 adherence keys off completed sessions only (break #5); C7/C8 make it honest | Block/plan-item state events; calibration ledger aggregates |
| **Session completion** | Focus sessions started/completed/aborted; partial-work capture rate; next-action-note usage | C7/C13 acceptance tests the honest-actuals hypothesis | Focus flow events |
| **Consistency** | Habit weekly-consistency distribution (not chain lengths); review-block execution rate; amnesty usage | Chain streaks punish the users who need the most time (Singh 2024); consistency scoring is the replacement headline — itself a measured hypothesis (the critique's "design change stated as outcome," answered by measuring) | Habit records; review-block events |
| **Retention (user)** | D7/D30/D90 return; cohort curves before/after flagship phases | Directional basis only: time management's strongest measured benefit is distress reduction (r = −0.358) — retention-via-calm is the thesis to test, not assert | Cohort telemetry |
| **Retention (memory)** | Review-block completion; due-backlog age; per-subject retention health trend | C4's whole purpose; the engine already computes health | FSRS due counts + block events |
| **Adoption (features)** | Per-capability activation within phases (WOOP completion, retrieval-ticket creation, timetable usage, ingestion runs + per-field edit distance) | Tier validation: High-Value items nobody adopts were misprized | Per-feature events |
| **Collaboration** | Room sessions with declaration + check-in; rooms-vs-solo completion comparison; pact experiment uptake, weekly-show-up, return | Mechanisms verified effective in the paid category; body-doubling evidence thin — measurement is the honest posture (R12) | Room events; pact board aggregates |
| **AI usage** | Ask Solis / Tutor sessions; surfaced-faithfulness distribution; % drafts validated vs rejected (with named constraints); ingestion confirmation rate; BYOK share; **Tutor Mode learning outcome: calibration-score delta for tutor users vs matched non-users** (added — the n=194 RCT is one course, and the moat claim demanded an outcome metric, not usage metrics alone) | Validates the proposal-layer thesis and the validator's value | AI telemetry (now with a consumer) + proposal-layer events |
| **Trust** | Reflow/draft approve-vs-dismiss rates; dismissal persistence by insight type; **term-feasibility warning accuracy** (did a "you will miss this" warning precede an actual miss?) | High dismissal could mean bad thresholds rather than low trust — the metric is tracked both ways rather than invented into meaning; false warnings spend the product's trust (critique fix) | Proposal-layer events; outcome joins |
| **Satisfaction** | In-app 1-tap micro-surveys after key loops (import confirm, reflow approve/deny, detachment evening); exit survey on churn | No external rating base exists; directional signal only | Micro-survey component (new, Phase 2+) |
| **Performance** | LCP/INP/CLS per route (mobile-weighted); largest-chunk budgets (current `index` chunk 430.81 kB / gzip 119.82 kB is the baseline to beat); hot-read latency; intelligence-snapshot compute time on aged accounts | Read-path growth is linear and client-side — the dominant scaling ceiling; the Lighthouse gate makes budgets enforceable | CI Lighthouse budgets; opt-in RUM |
| **Reliability** | Error rate per route; WAL replay success; sync-state honesty incidents (state that silently diverged); schema-check failures caught at deploy; **AI-absent ⇒ functional invariant CI-test result** | "Failure honesty" is V1's most consistent quality — measured, not just exhibited | Error sink; WAL instrumentation; deploy gate logs; CI invariant test (built in Phase 0) |

---

# 22. Long-Term V3 Opportunities

The question: should Solis eventually become a personal academic operating system, an adaptive planning system, an intelligent study companion, a collaborative academic workspace — or something else? Evaluated against identity fit, evidence, differentiation, long-term cost, and honesty.

| Candidate identity | Case for | Case against | Verdict |
|---|---|---|---|
| **Personal academic operating system** (term-scale system of record: two-way calendar, Canvas/LMS import, audio ingestion, full-term arc, share cards) | Direct continuation of the canonical model: C3/C22/C31 build the term spine; C19 proves material-in; the declines (audio, photo scan, OAuth) were deferred, not killed | Broadest surface; ingestion breadth invites the content-machine chase Solis refuses | **Primary direction** — bounded to *the student's term*, not a "life OS" |
| **Adaptive planning system** (scheduling intelligence for anyone) | C30 + C31 are adaptive planning done deterministically; Motion/Reclaim validate demand | Genericizing abandons the study-science identity; competing with Motion on autonomy is the documented failure mode | **Not a separate identity** — it already exists inside the OS as the deterministic replanner |
| **Intelligent study companion** (always-on AI) | Tutor Mode is companion-adjacent and evidence-constrained | The companion *pattern* is declined on verified evidence: interrupting AI defeats a focus app; voice companions cost ~$2–4/mo; Harvard evidence applies only to constrained tutors | **Declined as identity; retained as one grounded feature** (Tutor Mode) |
| **Collaborative academic workspace** (multi-user shared planning) | Rooms/pacts are ahead of the profiled competitors; witnessed commitment is a real white space | Multi-user planning is a security/product-model leap (RLS is strictly single-user outside social islands); deposit/social evidence thin; Clockwise's network-dependence lesson | **Secondary, experimental only** — deepen witnessed commitment; never a workspace pivot without evidence |
| **The honest data layer** (ownership/export/interoperability excellence) | Reinforces the trust posture; cheap relative to new subsystems | Not a standalone product — users don't switch for export | **Folded into the OS identity as a standing trust commitment** |

**Recommendation:** V3 is **the term-scale academic operating system** — the same brain, one octave up: two-way calendar (narrow OAuth, the deferred C20 slice), Canvas/LMS import, lecture-audio ingestion, photo schedule scan, behavioral share cards, native mobile only if PWA hits platform limits, and a public export/API story. The V2 architecture pays forward directly: the canonical model makes two-way sync and the term arc cheap; the proposal layer makes new automation safe; the calibration ledger makes pacing claims honest. One caveat kept from the critique: "nothing in V2 need be undone for V3" is asserted, not argued — widget, push, and provenance assumptions should be re-checked at the V3 gate, especially if native apps or two-way sync arrive.

---

# 23. Explicit Non-Goals / Things We Should Avoid

## 23.1 The fourteen declines (strategy, not omissions)

| # | Candidate | AI req. | Privacy | Evidence against | Rules violated | Instead |
|---|---|---|---|---|---|---|
| D1 | **Autonomous agentic replanning** — "AI reschedules your life" | Core | Broad context to vendor | LLMs can't plan reliably (PlanBench); agent loops compound errors (Anthropic); Motion's most-cited complaint is exactly this opacity; Gartner: >40% of agentic projects canceled | 2, 4, 7, 8 | C30: deterministic replanning as approve-diffs |
| D2 | **Proactive AI nudges / AI coach** interrupting the student | Core | Context to vendor | An interrupting AI defeats a focus app ("Assistance or Disruption?", 2025); V1's deterministic explainable alerts already cover the need | 4, 7 | Deterministic triggers (C5, C9) offering optional AI actions |
| D3 | **LLM memory layer** (Mem0/Zep-style) | Core | Second vendor sees user data | Postgres + RAG matches memory systems at ~8× lower TCO; memory-poisoning attack surface; the DB *is* the memory | 7, 9, 10 | Grounded retrieval over structured data (C26) |
| D4 | **Live voice tutor / AI companion** | Core | Continuous audio to vendor | ~$2–4/mo audio tokens; off-mission; Harvard evidence applies to constrained tutors, not companions | 4, 7 | C27 Socratic text Tutor Mode |
| D5 | **Autonomous tool agents** — calendar OAuth agent, MCP loops, browser automation | Core | Broad OAuth scope risk | No Solis user problem blocked on tool autonomy; auto-decline/reschedule is the documented control failure; prompt-injection risk documented for browser agents | 9, 10 | Read-only ICS subs (C20); data out via export |
| D6 | **LLM-per-capture task parsing** | Core | Every capture to vendor | Deterministic parsing is instant, offline, free — the industry norm; a network round-trip per task adds latency/cost/misparse risk | 6, 7, 8 | Existing deterministic NLP parser; LLM fallback only on explicit invocation |
| D7 | **LLM as the intelligence engine** | Core | Metrics vendor-dependent | Those engines are validated, explainable, free, offline; an opaque single source of truth is unexplainable drift | 2, 4, 8 | Engines stay; AI narrates computed numbers only (C29) |
| D8 | **Gamification theater** — Karma-style economies | None | None | Rewards checking boxes, incentivizing trivial task churn over real study | 3, 4 | Honest competence signals: mastery, consistency, calibration |
| D9 | **Identity-goal social sharing** | None | Social pressure | Public identity goals backfire (Gollwitzer 2009: announcing reduced relevant effort) | 4, 15 | Behavioral share cards — V3 |
| D10 | **Monetary deposit stakes** | None | Payment data | Deposits fail on uptake — people decline to deposit (Giné et al.; JMIR 2022) | 15 | Behavioral stakes (C32) |
| D11 | **Unnecessary social network** — stranger pairing, feeds, follower graphs | None | Public-by-design surfaces | Pairing-with-strangers is an operations-intensive trust surface; network-dependent value killed Clockwise (verified sunset); every feature must deliver at zero participants | 3, 4 | Rooms + pacts among existing members (C18, C32) |
| D12 | **Infrastructure-heavy ingestion in V2** — lecture-audio transcription, photo Schedule Scan | Core | Audio to vendor | Audio infrastructure absent; crowded meeting-notetaker space; photo parsing is an ML project, not a feature | 5, 10, 14 | Narrow document ingestion (C19); V3: audio, photo scan |
| D13 | **AI auto-filing / auto-organizing notes** | Core | Content to vendor | When base UX is weak, AI organization can't compensate; trust in auto-structure is hard to win back (Mem) | 4, 9 | Typed records + deterministic one-tap suggestions (C23) |
| D14 | **Platform/storage rewrite** | None | None | Logseq spent 2024–2026 on a DB rewrite amid mixed-to-critical reaction; V1's architecture is the asset | 13, 14 | Incremental schema evolution inside Supabase/IDataService |

## 23.2 Additional standing non-goals

No paywalled study modes, ever (no previously-free mode stranded behind credits); no native-app rebuild before PWA parity; no two-way Google/Outlook OAuth in V2; no big-bang page rewrite (extraction is incremental); no AI-generated nudges on any surface; no money in pacts; no "21-day" folklore in any copy; no treatment claims for procrastination support; no browser automation inside the AI scope; no feature without a loop stage it serves.

## 23.3 What gets demoted or deprecated in V2

(The "nothing gets cut" answer, cross-referenced from §10.) The derived-block scheduling vocabulary (absorbed as a projection); manual "Sync today" buttons (replaced by auto-materialization + override); the device-local notification store (migrated to the synced inbox); `src/services/supabase/schema*.sql` reference copies (replaced by generated schema truth); three of four keepalive implementations (consolidated to two); the AI telemetry store (sink or delete); the cheering affordance (demoted pending usage evidence); the dashboard "Active Knowledge" card as a notes-only surface (re-scoped to cards + notes); "Today/Tasks/Study" triple plan vocabulary in nav copy (one canonical vocabulary).

---

# 24. Research Sources

Consolidated from inputs 01–06 and the critique. **Repository evidence** (inputs 01/02) cites source paths directly in the text; no external URLs were involved. **Web sources** below are exactly those the inputs used; each input's fetched-vs-search labeling is preserved. Fetch failures disclosed by input 03: quizlet.com/upgrade and /subscribe (HTTP 403), knowt.com/pricing (404), turbolearn.ai (301 → turbo.ai, followed); input 04: openai.com, chatgpt.com, and the Jisc article (403); input 05: no primary source for Todoist's parser implementation (inferred, labeled).

## 24.1 From input 03 — competitor research (fetched directly)

- https://mystudylife.com · https://apps.apple.com/us/app/my-study-life-school-planner/id910639339 (MSL pricing/features/Scout)
- https://www.usemotion.com/pricing (Motion $19/$29, credit metering) · https://www.usemotion.com
- https://reclaim.ai/pricing (tiers, agent counts, approval controls) · https://reclaim.ai
- https://todoist.com/pricing (plan shapes; prices stripped in scrape)
- https://www.remnote.com/pricing · https://www.brainscape.com/pricing
- https://knowt.com · https://www.turbo.ai/ · https://studyfetch.com · https://gizmo.ai · https://www.vaia.com/en-us
- https://www.notion.com/students · https://www.notion.com/blog/introducing-notion-3-0 (Notion 3.0 agents, fetched)
- https://github.com/ankitects/anki/releases (26.09.3, fsrs-rs 6.6.x)
- https://www.flow.club/ · https://www.focusmate.com/pricing · https://lifeat.io · https://www.saner.ai
- https://apps.apple.com/us/app/forest-focus-for-productivity/id866450515
- https://edtechmagazine.com/higher/article/2025/12/ai-agents-higher-education-transforming-student-services-and-support-perfcon
- https://www.digitallearninginstitute.com/blog/education-technology-trends-to-watch-in-2026

Secondary via search (input 03): https://useaicademy.com/blog/anki-vs-quizlet (Quizlet pricing/Q-Chat; disclosed vendor conflict) · notion.com/releases (3.3 custom agents) · todoist.com pricing-update pages · eu-startups.com (StudySmarter Series A) · studysmarter.co.uk newsroom (Vaia rebrand) · hokai.io (Alice.tech) · localproblems.org (Flashka) · studytogether.com / studystream.live / academync / flown / focustown (study-room landscape) · studentbeans.com, studentappcentre.com (Todoist student discounts) · compoundingalpha.substack.com (Duolingo) · languavibe.com (Brainscape conflicting figures) · flashcard-maker.cc (Anki FSRS-default claim, unconfirmed).

## 24.2 From input 04 — adjacent products (fetched directly)

- https://www.usemotion.com · https://reclaim.ai · https://www.getclockwise.com (sunset notice) · https://linear.app
- https://habitify.me · https://rize.io · https://superlist.com · https://ticktick.com · https://todoist.com
- https://www.focusmate.com · https://capacities.io · https://reflect.app · https://www.rescuetime.com
- https://outliner.tana.inc · https://www.notion.com/blog/introducing-notion-3-0
- https://obsidian.md/changelog/2025-05-21-desktop-v1.9.0 · https://obsidian.md/help/bases (title only rendered)

Secondary via search (input 04): https://openai.com/index/chatgpt-study-mode · https://chatgpt.com/features/study-mode · https://www.moderndescartes.com/essays/study_mode · https://nationalcentreforai.jiscinvolve.org/wp/2025/11/14/chatgpts-study-mode-what-i-wish-id-had-as-a-student (all 403) · kingy.ai + tinaaustin.substack.com (Claude for Education / MIT critique) · notion.com/releases · medium.com/@danielasgharian + fahimai.com (Mem 2.0) · aitoolsofficial.com, ai.plainenglish.io, suprmind.ai + arXiv BrowseSafe-Bench (Comet/injection) · discuss.logseq.com, github.com/logseq/logseq (DB rewrite) · techradar.com, focuzed.io, imore.com, igeeksblog.com, jotform.com (Things 3) · apps.apple.com, productivity.directory, humanpicks.com (Streaks) · saasgenius.com, community.toggl.com, apps.apple.com (Toggl 2.0) · memtime.com, theprocesshacker.com, efficient.app (Rize) · pipeline.zoominfo.com, saner.ai (Reclaim) · max-productive.ai, akiflow.com, techpoint.africa (Motion) · klika.us, resolutely.app, declutterthemind.com, ones.com (Todoist) · play.google.com, tool-atlas.com, hypertools.so (Superlist) · trustpilot.com, abbyvolk.com, focusmo.app, flown.com (Focusmate) · atlasworkspace.ai, skywork.ai (Capacities) · xda-developers.com + Reddit r/ObsidianMD (Bases) · dexi.net (Tana) · help.figma.com (comments) · The Register (Clockwise/Salesforce) · producthunt.com (Reflect) · capterra.co.za, tooltivity.com (TickTick).

## 24.3 From input 05 — AI landscape (fetched directly)

- https://www.anthropic.com/engineering/building-effective-agents
- https://ai.google.dev/gemini-api/docs/pricing (page updated 2026-09-24; free-tier data-use policy verbatim)

Search-consulted (input 05): https://developers.openai.com/api/docs/pricing · https://techcrunch.com/2025/08/08/openai-priced-gpt-5-so-low-it-may-spark-a-price-war · https://simonwillison.net/2025/Aug/7/gpt-5 · anthropic.com / platform.claude.com pricing pages · https://kenodo.com (STT costs) · https://www.gartner.com/en/newsroom/press-releases/2025-08-26-gartner-predicts-40-percent-of-enterprise-apps-will-feature-task-specific-ai-agents-by-2026-up-from-less-than-5-percent-in-2025 · https://www.gartner.com/en/articles/hype-cycle-for-agentic-ai · neurips.cc / arxiv.org (PlanBench; Valmeekam et al. 2024) · Scientific American + mindomax.com (Harvard PS2 Pal RCT, n=194) · https://www.studyfetch.com (vendor claims) · efficient.app, runable.com, saner.ai/ellieplanner/unite.ai (Motion/Reclaim reviews) · ioaglobal.org + HEPI coverage (92%/88%/95% adoption) · nemo.asee.org (Digital Education Council) · Mem0/Zep/Graphiti/Letta; arXiv "Total Recall at What Cost?" (Aug 2026) and "Trojan Hippo" (May 2026) via search summaries · https://clarion.ai, brinsa.com (Vectara ~1.8%) · https://media.defense.gov/2026/Jun/02/2003943289/-1/-1/0/CSI_MCP_SECURITY.PDF · https://blog.modelcontextprotocol.io/posts/2026-07-28 · https://zuplo.com/mcp-report · https://faqs.ankiweb.net/what-spaced-repetition-algorithm · https://github.com/open-spaced-repetition/awesome-fsrs/wiki/The-Algorithm · https://www.mintdeck.app/blog/fsrs-spaced-repetition-algorithm (vendor claim) · alphaxiv (Assistance or Disruption?) · SSRN (IPPO) · https://menlovc.com/perspective/2025-the-state-of-consumer-ai · https://www.pymnts.com/news/artificial-intelligence/2025/nobodys-talking-voice-interfaces-face-hurdles-for-wide-adoption · eMarketer voice-AI FAQ · todoist.com help + leightonprice.com (Todoist grammar) · SAGE Journals / NIH-PMC / evidentlyai.com (AI plan limitations) · https://studentprivacy.ed.gov · https://www.eff.org/issues/student-privacy/legalanalysis · https://artificialanalysis.ai · https://benchlm.ai.

## 24.4 From input 06 — learning science

Fetched directly: Singh et al. 2024 PNAS — https://pmc.ncbi.nlm.nih.gov/articles/PMC11641623 · Rozental et al. 2018 — https://pmc.ncbi.nlm.nih.gov/articles/PMC6125391 · Wang et al. 2021 (MCII/WOOP) — https://www.frontiersin.org/journals/psychology/articles/10.3389/fpsyg.2021.565202/full · Aeon, Faber & Panaccio 2021 — https://journals.plos.org/plosone/article?id=10.1371/journal.pone.0245066 · The Decision Lab (planning fallacy / Buehler) — https://thedecisionlab.com/biases/planning-fallacy

Via search records: Steel 2007 — https://pubmed.ncbi.nlm.nih.gov/17201571 · Brunmair & Richter 2019 — https://pubmed.ncbi.nlm.nih.gov/31556629 · Harkin et al. 2016 — https://pubmed.ncbi.nlm.nih.gov/26479070 (effect size unverified) · Cepeda et al. 2008 (via summaries incl. Uner 2021 WashU) · Gollwitzer & Sheeran 2006 (d = 0.61, via Wang 2021) · Gollwitzer et al. 2009 — https://www.academia.edu/13463072 · Vasconcellos et al. 2020 — https://psycnet.apa.org/record/2019-61785-001 · Bego et al. 2024 — https://link.springer.com/article/10.1186/s40594-024-00468-5 · Maye et al. 2026 — https://pubmed.ncbi.nlm.nih.gov/41601436 · Storck et al. 2025 — https://pmc.ncbi.nlm.nih.gov/articles/PMC13129625 · Németh et al. 2025 — https://www.sciencedirect.com/science/article/pii/S1041608025001803 · Firth 2021 — https://bera-journals.onlinelibrary.wiley.com/doi/10.1002/rev3.3266 · Wei 2025 — https://pmc.ncbi.nlm.nih.gov/articles/PMC12705826; Lee 2025 — https://link.springer.com/article/10.1007/s40593-025-00514-5 · Madigan et al. 2024 — https://link.springer.com/article/10.1007/s10212-023-00731-3 · Chong et al. 2025 — https://pmc.ncbi.nlm.nih.gov/articles/PMC11852093 · Sonnentag & Fritz 2007 / effort–recovery — https://pmc.ncbi.nlm.nih.gov/articles/PMC3862850 · Martin / Putwain 2023 — https://www.mdpi.com/2079-3200/11/3/42; Liu et al. 2025 — https://pmc.ncbi.nlm.nih.gov/articles/PMC12176830 · Giné et al. NEJM; JMIR 2022 — https://dataverse.nl/citation?persistentId=doi:10.34894/G3KOYT · Flyvbjerg (reference-class 38%→5%) — academia.edu · FSRS-6 + open SRS benchmark — github.com (fsrs4anki) · ADD.org, CHADD, 2025 VR body-doubling study (researchgate.net) — evidence-thin note · Advance HE toolkit + Inan et al. 2025 (PMC) · Özmen et al. 2023 (PMC); mindfulness meta (blog.une.edu.au).

## 24.5 Repository evidence trail (inputs 01/02)

Nested repo `Solis-Ultimate-Productivity-tracker-main/` on 2026-09-27: `npx tsc -b` (exit 0) · `npx vitest run` (128 files / 1,162 tests pass) · `npx vite build` (7.2 s) / `npm run build` (15.19 s) · `git ls-files | grep .env` (untracked) · `node -e require('react/package.json').version` → 19.2.8 · line-cited reads of `src/services/*`, `src/context/*`, `src/hooks/useStudyRoom.ts`, `src/App.tsx`, `package.json`, `tsconfig.json`, `vite.config.ts`, `vercel.json`, `supabase/migrations/*`, `supabase/functions/generate-cards/index.ts`, `src/utils/*`, `master.md`, `TEST_INFRA.md` — all citations appear inline throughout this document as `path:line` with their input section.

## 24.6 Internal inputs

`docs/v2-research/reader-critique.md` (independent cold read of 08/09; every finding is either fixed or caveated inline in this document).

---

# WHAT SOLIS V2 SHOULD ACTUALLY BECOME

**What it is.** Solis V2 is a **closed-loop study operating system for the term**: one deterministic brain that plans the day, times the recall, guards the focus, and tells the truth about the pace — now wired so that it closes its own loops. The one-sentence version: *the study OS that plans your term, times your recall, guards your focus, and tells you the truth about your pace.*

**Who it serves.** The self-directed, exam-driven student carrying 2–6 courses across a 15-week term on at least two devices, who today glues a calendar, Anki/Quizlet, a notes app, and a focus timer and loses the connections between them — with the ADHD-lens accountability cohort squarely in scope. Not the quiz-crammer, not the workflow team, not the blank-canvas builder. (An asserted persona with a named validation plan: Phase-0 telemetry plus interviews before later-phase scope locks — the research contains zero first-party user evidence, and this document refuses to pretend otherwise.)

**The problem it solves.** The gap no profiled product serves: *the tools that track your learning never act on it, and the tools that act never know your learning.* Concretely: a plan that doesn't know what you remember; an app that tells you things but makes you do the work; tools that don't accept your actual material; a second device that doesn't know you.

**The core loop.** Seven stages, each closed: **Trigger** (deterministic, explainable — morning ritual, due counts, triage badge, WOOP if-then at trigger time) → **Plan** (a pre-composed day from one canonical schedule model; optional AI draft validated by deterministic math before it is shown; fallback branches built in) → **Act** (context-carried focus; next-action notes; witnessed commitment) → **Track** (the verified auto-cascade plus confidence ratings and honest partial work) → **Understand** (deterministic intelligence with receipts, delivered to one triage queue) → **Adapt** (slippage forecasts, collision trade-offs, review reflow — every proposed change an approve-diff; one-tap recovery without guilt) → **Improve** (estimates converge on the student's real pace; the weekly review closes the cycle as one proposal). The loop's crown jewel, deferred until the substrate is real: **memory state pushing back on the calendar** (C30) — when a deck balloons or a subject decays, the planner proposes the reflow, with its evidence, for one-tap approval.

**Why it is meaningfully better than V1.** V1 built the brain and left the loops open: three scheduling vocabularies instead of one model; report-only analytics; recall one hop away; ~40 state strands per device; no intake; aborted work invisible; a simulated-presence integrity defect. V2 makes the brain *act* — one model, synced state, recall in the day, write-back, honest capture, material flowing in — while keeping everything that was already excellent (determinism, receipts, failure honesty, undo, offline).

**Why it is different from existing products.** It is the only profiled product that combines a real FSRS scheduler with a planner and lets memory renegotiate the calendar; the only one whose AI is a BYOK proposal layer that validates every draft with deterministic math before the user ever sees it; the only one whose insights arrive as acknowledge/schedule/dismiss objects rather than nagging; the only one with evidence citations on its behavioral mechanisms; and the only one with a free core loop that is structurally free (deterministic, offline, BYOK) rather than marketing-free. The fourteen declines are the differentiation: no autonomous replanning, no AI nudges, no memory layer, no voice companion, no gamification theater, no paywalled study modes.

**The systems that power it.** The 16-domain `IDataService` spine and 26 RLS-protected tables (kept); the deterministic engine layer (kept); three new cross-cutting subsystems (the canonical schedule model with projections, the proposal/approve-diff layer as a 17th domain, and user-scoped state continuity); the ingestion pipeline; the push evaluator; honest observability; and a Phase-0 guardrail gate — CI, schema truth, scoped cache and reads, integrity fixes, instrumentation — without which nothing else should start.

**What to build first.** The Phase-0 gate, then Phase 1 in this order: the canonical schedule model (everything gates on it), state continuity (everything truthful gates on it), the due-review block, the triage queue with write-back, unified reflections, the frictionless-day fixes, and surfaced AI confidence. Exit test: a new device sees the same day, and every insight is one tap from executed.

**What to deliberately postpone.** Everything that pours into a loop that doesn't exist yet: ingestion and the mobile surface wait for the model and synced state (Phase 3); the AI layer — tutor, validator-gated drafts, review agent, retention-aware replanning, term feasibility — waits for the trust substrate (Phase 4); pacts, voice, and interleaving wait as labeled experiments with pre-declared thresholds; lecture audio, photo schedule scan, two-way OAuth, share cards, and any native app wait for V3. And the fourteen declines wait forever, unless the evidence changes.

That is the whole direction: **the same deterministic brain V1 proved it could build — finally closing its own loops, following the student across devices, accepting their real material, and never acting without their approval.**
