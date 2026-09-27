# 08 — Solis V2 Product Strategy

**Document ID:** `docs/v2-research/08-product-strategy.md`
**Stage:** Solis V2 Research & Product Planning — strategy (input 08)
**Date:** 2026-09-27
**Method:** Strategy synthesis over inputs 01–07 (01 V1 product audit; 02 V1 technical audit; 03 competitor research; 04 adjacent products; 05 AI landscape 2026; 06 learning science; 07 gap analysis). **No code checks, builds, or web fetches were executed in this strategy session.** Every VERIFIED FACT below inherits its verification from the input documents' own evidence trails (01/02 ran `tsc -b`, `npx vitest run` — 128 files / 1,162 tests green — and production builds; 03–06 ran direct web fetches and searches in their sessions) and carries an inline citation to the input and section it came from. Facts known only through input 07's synthesis of input 02 are cited "02 §X via 07". Judgments made here are labeled **EXPERT OPINION** or **RECOMMENDATION**.

**Product thinking rules applied (from the brief):** 1 no blind copying · 2 no competitor-envy features · 3 no feature supermarket · 4 protect core identity · 5 depth over quantity · 6 reduce manual work where automation genuinely helps · 7 AI only where it earns its place · 8 deterministic beats AI when it wins · 9 privacy and trust first-class · 10 weigh long-term subsystem cost · 11 think mobile · 12 accessibility from the start · 13 respect V1 architecture — no rewrites · 14 foundations before sophistication · 15 every major capability connects to a real user problem.

---

## 0. Executive verdict (the decision this document makes)

**RECOMMENDATION — the V2 thesis:** *Keep the deterministic brain. Wire it into action.* Solis V1 is real, deep, and tested (VERIFIED FACT per 01 §0: 18 routes, 14 feature pages, 128 test files / 1,162 tests passing, clean typecheck, 7.2 s build), and it already spans four of the five category stacks (03 §1). Its problem is not missing features. Its problem is that the thing it built **does not close its own loops, does not follow the student across devices, and does not accept the material students actually have** (07 closing note). V2 therefore spends its budget on **loop closure, continuity, and intake** — and treats every additive idea as a candidate to be rejected unless it serves a loop stage.

**The vision in three sentences (RECOMMENDATION):**

1. Solis V2 turns V1's proven deterministic study brain into a system that **closes its own loops** — one canonical schedule model, state that follows the student across devices, and every recommendation one tap from executed.
2. It is built for the **self-directed, exam-driven student on multiple devices**: real course material (syllabi, PDFs, slides) flows in and becomes scheduled, exam-anchored recall — and memory state pushes back on the calendar.
3. Its AI **never acts alone**: it proposes drafts grounded in the student's own data, deterministic engines verify, the user disposes — keeping BYOK privacy and a free core learning loop structural, not marketing.

**What V2 ships first (the Core tier):** engineering foundations, cross-device state continuity, one canonical schedule model, due review in the daily surface, the triage queue with analytics write-back, unified reflections, frictionless day mechanics, and the mobile baseline.

**What V2 deliberately does not build:** 14 named declines (Section 2.6), led by autonomous agentic replanning — the category's loudest trend and its worst documented trust failure.

---

# Part 1 — V2 Vision

## 1.1 What Solis fundamentally becomes

**RECOMMENDATION.** V1's identity, verified in code, is *the wiring*: one deterministic intelligence engine (FSRS/SM-2 scheduling, retention decay, mastery, subject health, circadian synthesis, exam feasibility — 01 §3.9) wired across planner, learning, focus, habits, and review, with the focus→reflection auto-cascade as its spine (one user action updates seven downstream entities, `FocusContext.tsx:715-895` — VERIFIED FACT, 01 §3.4/§4). No profiled competitor ships anything like it end-to-end (03 §3 head-to-head: "clear edge").

V2 keeps that identity and fixes the three structural failures that stop it from being felt:

| V1 failure (VERIFIED in inputs) | What V2 makes of it |
|---|---|
| **Loops that don't close** — three scheduling vocabularies (01 §4 break #1); analytics is a report with no write-back (break #3); recall lives one hop from the daily surface (break #2); aborted work invisible (break #5) | **One system with one state model.** One canonical schedule entity with projections; every insight lands in a triage queue where acknowledge/schedule/dismiss actually writes back; due review is a block in the day; partial work is captured honestly |
| **Continuity that doesn't exist** — 37 files / ~40 `solis_*` localStorage keys keep intention, rituals, pins, note history, inbox device-local even in cloud mode (01 §1 debt 1; 02 §1.7/D13 via 07) | **Everything user-authored syncs.** Nothing user-visible lives only on one device |
| **Intake that never happens** — no material→recall pipeline (03 §5 table stake #2 missed outright); paste-only ICS (01 §3.15); web-only without verified mobile runtime (03 §5 table stake #4) | **The student's real material flows in.** Narrow ingestion (syllabus/PDF/docs → topics, dates, cards, source-cited), live calendar subscriptions, an installable mobile surface |

The result is a product whose slogan is honest: **"the study OS that plans your term, times your recall, guards your focus, and tells you the truth about your pace."**

## 1.2 Target user

**RECOMMENDATION.** Primary: **the self-directed, exam-driven student** — an undergraduate or master's student (or serious self-learner) carrying 2–6 courses per term, studying 2–5 h/day across a 15-week term, on at least two devices (laptop + phone), who today runs Google Calendar + Anki/Quizlet + a notes app + a focus timer and loses the connections between them. The accountability cohort with an ADHD lens is squarely in-scope: Flow Club charges $40/mo (50% student discount) and reports 62% ADHD identification among surveyed members (VERIFIED FACT, 03 §2.D) — willingness to pay for co-presence at student prices is proven, and Solis already has the rooms to serve it.

**Who it is not for (EXPERT OPINION):** the casual quiz-crammer who wants PDF→flashcards in 30 seconds (Turbo/Knowt serve that, and Solis's FSRS+planner wiring would be wasted on them); enterprise/workflow teams (Motion/Reclaim's market); students who want a blank canvas to assemble (Notion's user — 04 §9.1: students abandon Notion for lack of opinionated defaults; Solis is the opposite bet).

## 1.3 The core problem solved better than V1

**RECOMMENDATION.** V1's problem statement was "students juggle tools that don't talk." V2 sharpens it to the gap nobody serves (03 §6 white spaces; 04 §11.3):

> **The tools that track your learning never act on it, and the tools that act never know your learning.**

Concretely, V2 solves three user problems better than anything profiled:

1. **"My plan doesn't know what I remember."** Every planner reschedules tasks; every SRS reschedules cards; no product lets memory state push back on the calendar (03 §6.1 — the closed loop nobody closes). Solis's retention engine computes; the V2 planner finally reflows.
2. **"The app tells me things but makes me do the work."** V1's recommendations navigate away and nothing writes back (01 §4 break #3, VERIFIED). V2 turns analytics from a report into a control surface via one triage queue (Linear pattern, 04 §10.1).
3. **"My tools don't accept my actual material."** The 2024–26 AI wave set the expectation that syllabi, PDFs, and slides become study material (03 §5 table stake #2). V1 can't ingest; V2 can, narrowly — and its output enters a real schedule, which is exactly what the content machines cannot do (03 §7.1).

Plus the quiet fourth: **"my second device doesn't know me"** — the ~40 device-local state keys (01 §1 debt 1).

## 1.4 Value proposition

**RECOMMENDATION.** Three pillars, each traceable to verified V1 assets:

| Pillar | Claim | Grounded in |
|---|---|---|
| **The deterministic study brain** | Retention, mastery, feasibility, and circadian intelligence that is explainable, offline, and free — never an LLM's guess | 01 §3.9 (15 deterministic engine modules, working correctly); 05 §5.6 (decline: LLM never replaces the math) |
| **The closed loop** | What you do updates everything; every recommendation is one tap from executed; your memory state renegotiates your calendar — with an approval diff on every change | 01 §3.4 (auto-cascade); 04 §2.2 (Reclaim approval gates); 03 §6.1 (white space) |
| **Trust by construction** | Your keys (BYOK), your data (JSON/CSV/ICS/Anki export, VERIFIED 01 §3.11/§3.15), free learning loop forever, AI proposes / user disposes | 05 §3.14; 03 §4.3 (Quizlet paywall lesson); 05 §3.11 (human-in-the-loop invariant) |

## 1.5 Product philosophy (the ten working principles of V2)

Each principle is a commitment, with its source:

1. **Deterministic brain, AI hands.** Engines compute; AI drafts language. LLMs never compute schedule feasibility, retention, or mastery (05 §4 candidate M: AVOID; PlanBench evidence, 05 §3.2).
2. **AI proposes, user disposes.** No silent state writes ever — AI or deterministic. Approval diffs on every proposed change (05 §3.11, Anthropic's validated pattern; R7 trust risk, 07 §1.8).
3. **Receipts on everything.** Every recommendation carries Signal → Evidence → Action (V1 pattern, VERIFIED 01 §3.9 — "nearly unique in the consumer space," 03 §3).
4. **AI-absent ⇒ fully functional.** Key absent or network down ⇒ nothing breaks; this is an architectural invariant tested in CI, not a hope (05 §4 conclusion 4; 01 §2 three-tier fallback VERIFIED).
5. **Free learning loop; meter only generative AI; BYOK structural.** The Quizlet lesson (paywalled study modes created the opening Knowt attacks, 03 §4.3) and the Superlist lesson ($25/mo AI-tier backlash, 04 §3.4). Flash-class cost envelope ≈ $1.20–1.50/heavy-user/mo, $0 operator under BYOK (05 §3.12 — computed from fetched Gemini pricing).
6. **Evidence over folklore.** Every behavioral mechanism ships with its citation and honest scoping (06 passim: e.g., habits take 2–5 months — Singh 2024; procrastination-treatment evidence is small — Rozental 2018). No "21-day" claims anywhere in the UI (06 §2).
7. **Calm over engagement.** Time management's strongest measured benefit is distress reduction (r = −0.358, Aeon et al. 2021 — VERIFIED, 06 §5), not throughput. The plan is presented as "today is handled," never as an exhaustive backlog.
8. **Mobile-equal, accessible from the start.** Web-only is a churn filter at student prices (03 §5 item 4, VERIFIED competitor gap); runtime a11y/mobile audits gate V2 UI work (01 §5.2/§5.3: Lighthouse/axe never run — reported as not run there and here).
9. **Honest experiments, labeled.** Anything resting on thin evidence (body doubling, pacts, interleaving at scale) ships as an in-app experiment with measured outcomes, not a bet (06 §13/§14; 07 R12).
10. **Incremental evolution, no rewrites.** Schema evolution inside the existing Supabase/IDataService spine (Logseq DB-rewrite caution — 04 §7.2; 07 R2; rule 13).

## 1.6 What Solis must NOT become (boundaries)

These are rejections, not aspirations. Each cites the evidence that kills it.

1. **Not a generic todo app.** Todoist owns capture-and-lists at $7/mo (03 §2.A) and is not study-science aware (REVIEWER OPINION, 03 §2.A). Solis's identity is the study system: syllabi, exams, retention, term feasibility. Tasks exist to serve the loop, never as the product.
2. **Not a generic AI chatbot.** Unconstrained ChatGPT is free and ubiquitous; a product's AI value must come from data the model doesn't have (05 §3.1 EXPERT OPINION). Every AI feature must answer "what does ChatGPT not know that Solis does?" (05 §4 conclusion 2).
3. **Not a social network.** No feeds, no follower graphs, no stranger pairing (04 §10.3 EXPERT OPINION — pairing-with-strangers is an operations-intensive trust surface). Rooms are *witnessed commitment* and must deliver value at zero participants (04 §2.3 Clockwise sunset lesson; 07 §2.2). Share behaviors, never identities (Gollwitzer 2009, VERIFIED, 06 §4/§13).
4. **Not gamification theater.** No Karma-style points/levels/box economies — they reward task churn over real study (04 §3.1; 07 §3.2). Momentum keys off study minutes and retention — data Solis already computes deterministically.
5. **Not over-automated.** No silent rescheduling of any kind, autonomous or deterministic (05 §5.1; Motion's most-cited complaint is exactly opaque autonomy — 05 §3.3 OBSERVED PATTERN). No proactive AI nudges (an interrupting AI defeats a focus app — 05 §5.2).
6. **Not a content-machine commodity chase.** PDF→flashcards is table stakes, but Solis does not chase Turbo/StudyFetch's breadth (lecture audio, video, podcasts) at the cost of depth; it wins on where the output *goes* — a real schedule (03 §7.1; 05 §4 C scope).
7. **Not a paywalled study experience.** The learning loop stays free forever; no previously-free mode is ever stranded behind credits (03 §5 item 9; 03 §4.3).
8. **Not a blank canvas or a rewrite.** Opinionated defaults over configuration surface (04 §9.1); incremental schema evolution, never a ground-up platform rebuild (04 §7.2 Logseq).

---

# Part 2 — Capability Candidates

**Method note.** Candidates inherit the gap map of input 07 (Part 1 IDs shown as `[G#/U#/I#/X#/A#/Diff#/O#/R#]`). 34 build candidates + 14 deliberate declines. Every build candidate carries all fields required by the brief; declines carry a condensed field set (their "how it works" is deliberately none). Complexity: **S** ≤ a focused change with tests · **M** ≤ a feature module · **L** ≤ a multi-week subsystem · **XL** ≥ a quarter-scale effort. AI requirement: None / Optional / Useful / Core.

## 2.1 Foundations (enable everything else — rule 14)

### C1 — Engineering Foundations & Integrity Repairs
| Field | Detail |
|---|---|
| **Category** | Foundation / engineering enablement |
| **Current V1 state** | No CI and 0 `.test.tsx` vs 149 `.tsx` components (02 D2/D10 via 07 R5); fetch-all read paths + non-user-scoped cache keys + global invalidation (`tasks.service.ts:15`, `study.service.ts:294`, `rooms.service.ts:15` — 02 D5/D9 via 07 O6); PGRST204 retry silently strips new columns from task writes (02 D3 via 07 R6); **simulated fictional peers served in production** (`presence.service.ts:8-49`, 02 §1.6/D1 via 07 X6 — violating the repo's own no-fake-integration rule) |
| **User problem** | Every V2 change multiplies on unguarded codepaths; users are currently shown fake presence data — a trust defect with no upside |
| **Proposed V2 capability** | Phase-0 program: CI running the existing green suite on every push; user-scoped cache keys and targeted invalidation; fail-loud schema check at deploy (kill the silent PGRST204 strip); replace simulated presence with real room Presence or remove/label it; extract the six 1,000–1,600-line page components incrementally as touched (02 D6 via 07 R13) |
| **How it works** | CI pipeline (typecheck + `vitest run` + build + a runtime Lighthouse/axe gate); cache keyed by user id with per-collection invalidation; deploy-time schema assertion; presence widget backed by the same realtime channel rooms already use |
| **User value** | Indirect but total: honest data, faster and fewer regressions; the foundation every other candidate stands on |
| **Frequency of use** | Continuous (every session touches the read path) |
| **Competitive inspiration** | None needed — internal quality debt (02 §5 calls CI "the single cheapest high-value fix") |
| **Why it fits Solis** | Rule 14; the codebase is already well-tested at the engine layer (1,162 green tests, 01 §0) — this extends the discipline to the shell |
| **Differentiation potential** | None directly; protects all of it |
| **Technical complexity** | **L** across the program (CI is S; cache scoping M; page extraction is incremental L) |
| **Dependencies** | None — this is the dependency |
| **Data requirements** | Existing Supabase schema; existing test suite |
| **AI requirement** | **None** |
| **Privacy considerations** | Presence fix removes fabricated peer data (an honesty issue, not a PII one); cache scoping prevents cross-user cache leakage risk (02 D5 via 07) |
| **Risks** | Regression risk during extraction is real (07 R5/R13) — mitigated by CI first and incremental extraction on the existing `useStudyPage` pattern |
| **Priority** | **V2 Core — Phase 0. Non-negotiable.** |

### C2 — Cross-Device State Continuity ("sync the invisible state")
| Field | Detail |
|---|---|
| **Category** | Foundation / state model |
| **Current V1 state** | 37 source files write ~40 distinct `solis_*` localStorage keys; daily intention, morning-ritual completion, welcome-back choices, note pins, note version history, notification inbox, gentle-start capacity are device-local even in cloud mode (VERIFIED: 01 §1 debt 1; break #4; 02 §1.7/D13 via 07 G4) |
| **User problem** | A student on two devices gets inconsistent ritual states and loses pins/history/inbox — invisible data loss that erodes trust in "cloud" mode (01 §4 break #4) |
| **Proposed V2 capability** | Every user-authored or user-visible state moves to user-scoped cloud storage; localStorage remains only as an offline cache, not a system of record |
| **How it works** | Inventory the 40 keys; classify (user content / device preference / ephemeral); migrate user-content classes to new Supabase tables behind `IDataService`; keep the offline WAL (exists: `pwaSync.ts`, VERIFIED 01 §2) as the write path |
| **User value** | The product finally *is* multi-device; ritual progress, pins, and history survive device switches |
| **Frequency of use** | Daily (every session start) |
| **Competitive inspiration** | Table stake — every cloud competitor syncs this by default (03 §5 item 4) |
| **Why it fits Solis** | The data layer abstraction (`IDataService`, 16 sub-services — VERIFIED 01 §2) makes this evolution, not rearchitecture (rule 13) |
| **Differentiation potential** | Low alone; high as the enabler of everything |
| **Technical complexity** | **L** (many small migrations; the offline WAL must be respected) |
| **Dependencies** | C1 (CI to guard migrations); Supabase schema additions |
| **Data requirements** | New tables for intention/ritual state/pins/note history/inbox; migration from existing localStorage payloads |
| **AI requirement** | **None** |
| **Privacy considerations** | More user data lands in the cloud — RLS must cover every new table (01 §3.11 asserts RLS copy; migration SQL not re-verified — 01 §3.15) |
| **Risks** | Migration risk (07 R2); partial-migration inconsistency — mitigated by shipping per-class with a visible sync state |
| **Priority** | **V2 Core — Phase 1** |

### C3 — One Canonical Schedule Model (incl. recurrence browsing)
| Field | Detail |
|---|---|
| **Category** | Foundation / planning IA |
| **Current V1 state** | Three coexisting scheduling vocabularies: derived dashboard timeline blocks (`DashboardPage.tsx:184-196`), persisted task time blocks (`HourlyPlannerView.tsx`), and study plan items (`StudyPage` agenda) — bridged in both directions but no single surface "owns" a commitment (VERIFIED, 01 §3.1/§4 break #1; 01 OPINION: "single largest IA debt"). Recurrence engine exists and is persisted but has no browsing UI (01 §3.2 OPINION, G8) |
| **User problem** | A student meets three schedulers on day one and must learn which surface owns their time; recurrence schedules are invisible |
| **Proposed V2 capability** | Tasks, study plan items, time blocks, habit windows, review blocks, and rest become typed entries in one canonical schedule entity (fixed / flexible / defended — the Clockwise data-model lesson, 04 §2.3); the Today timeline, hourly planner, study agenda, and calendar overlays become projections; recurring schedules become a browsable projection |
| **How it works** | One table/type union with per-source provenance; incremental backfill migration inside Supabase (rule 13, no rewrite); existing bridges (convert-to-task, plan-item completion) become writes to the same entity; projections render the four existing surfaces unchanged at first |
| **User value** | Kills the "where is my time" confusion permanently; makes C29 (retention-aware replanning), habit scheduling (C10), and due-review blocks (C4) *possible* — you cannot reflow what isn't one model (07 §2.1) |
| **Frequency of use** | Every planning interaction, daily |
| **Competitive inspiration** | Reclaim's typed flexible/defended events (04 §2.2); Motion's backward scheduling needs exactly this substrate (04 §2.1) |
| **Why it fits Solis** | Highest-leverage structural fix in input 07 (I1: "highest-leverage fix in this document"); rides existing IDataService architecture |
| **Differentiation potential** | Indirect but foundational — the differentiators C29/C30 are gated on it |
| **Technical complexity** | **XL** (touches every page that renders or writes time) — de-risked by projections-first migration so no surface rewrites at once |
| **Dependencies** | C1 (CI guards migration); C2 (same storage foundation); consumed by C4, C10, C15, C17, C29, C30 |
| **Data requirements** | Unified schedule table with type/provenance/flexibility fields; migration of three existing stores |
| **AI requirement** | **None** (deterministic engine consumes it) |
| **Privacy considerations** | Same RLS posture as C2 |
| **Risks** | The largest migration risk in V2 (07 R2) — mitigated by incremental schema evolution, projections unchanged, and the green suite (07 R2 cites 04 §7.2 Logseq warning) |
| **Priority** | **V2 Core — Phase 1. The identity fix.** |

## 2.2 Loop closure (the product's felt difference)

### C4 — Due Review in the Daily Surface
| Field | Detail |
|---|---|
| **Category** | Learning / recall |
| **Current V1 state** | SM-2/FSRS flashcards, Anki import/export, adaptive suggester all implemented and working (01 §3.3) — but due cards surface only on Study and via dashboard retention alerts; no due-review block exists in the timeline, and the dashboard's "Active Knowledge" card resurfaces notes, not cards (VERIFIED, 01 §4 break #2) |
| **User problem** | The loop's strongest engine is one navigation hop away from the daily surface; recall loses to whatever is in front of the student |
| **Proposed V2 capability** | A due-review block in the daily timeline with live counts, plus a one-tap drill CTA (dashboard + morning ritual) — exactly 01 §7.3's recommendation |
| **How it works** | The canonical schedule model (C3) gains a `review` entry type materialized at day start from FSRS due counts, capped by the daily review-minute budget (C11); drill CTA carries subject context into the existing review modal |
| **User value** | Recall becomes part of the day instead of a destination; retention stops decaying by neglect |
| **Frequency of use** | Daily |
| **Competitive inspiration** | Anki's daily-due framing; MSL's revision integration (03 §2.A) — but scheduled into *Solis's* timeline, which no competitor does (03 §6.1) |
| **Why it fits Solis** | Smallest possible closure of the strongest existing engine; pure determinism |
| **Differentiation potential** | Moderate (SRS-in-planner is unserved per 03 §3: "nobody bundles FSRS with a planner") |
| **Technical complexity** | **S** given C3; **M** standalone |
| **Dependencies** | C3 (block type); FSRS due counts (exist) |
| **Data requirements** | None new |
| **AI requirement** | **None** |
| **Privacy considerations** | None (all local computation) |
| **Risks** | Minimal; risk of nagging mitigated by the cap and by triage dismissal (C5) |
| **Priority** | **V2 Core — Phase 1** |

### C5 — Triage Queue & Analytics Write-Back
| Field | Detail |
|---|---|
| **Category** | Intelligence / interaction model |
| **Current V1 state** | Explainable Signal/Evidence/Action recommendation cards exist (01 §3.9) but only navigate away; nothing writes back — no acknowledge/schedule/snooze; retention alerts, drift warnings, and block alerts compete across surfaces; Scholar Report is orphaned from goals/exams; interruption data has no trend view (VERIFIED: 01 §4 break #3 + disconnections; 04 §10.1) |
| **User problem** | Insights become guilt unless the user improvises follow-through; alerts nag instead of working |
| **Proposed V2 capability** | One "needs a decision" queue (Linear triage pattern, 04 §10.1) where every deterministic insight arrives as an actionable object: acknowledge / schedule (writes a C3 block) / dismiss (persisted, stops nagging). Scholar Report links from exam surfaces; interruption trends join cognitive-load analytics (07 X3/X4) |
| **How it works** | Insight objects gain `state` (open/acknowledged/dismissed/actioned) + action payloads; dismissals persist per-insight-type; the dashboard badge counts open items; every insight keeps its evidence receipt |
| **User value** | Analytics finally closes its loop — the system's advice becomes one tap from done; attention is spent once, in one place |
| **Frequency of use** | Daily |
| **Competitive inspiration** | Linear Priority Inbox / Triage (04 §10.1); measurement wired to action is RescueTime's differentiation (04 §5.1) |
| **Why it fits Solis** | Directly repairs V1's VERIFIED break #3; the deterministic brain gains a control surface without any AI |
| **Differentiation potential** | Moderate — "explainable progress" is table stake #8 (03 §5) and Solis will exceed it |
| **Technical complexity** | **M** |
| **Dependencies** | C3 (for "schedule" actions); consumes existing intelligence snapshot (01 §3.9) |
| **Data requirements** | Insight-state table; dismissal history |
| **AI requirement** | **None** (deterministic first — AI narrative is C28's job, as an optional layer) |
| **Privacy considerations** | Insight states are user data → user-scoped storage (C2) |
| **Risks** | Queue bloat if the engine over-produces insights — mitigated by caps and by persisted dismissals (rule against nagging) |
| **Priority** | **V2 Core — Phase 1** |

### C6 — Unified Reflections & Drift-Pad Reader
| Field | Detail |
|---|---|
| **Category** | Reflection / knowledge continuity |
| **Current V1 state** | Three reflection stores coexist (daily reflections, room reflections, weekly-review notes) with no unified timeline (VERIFIED, 01 §4 disconnections); drift-pad parked thoughts are written (`FocusContext.tsx:851-862`) with **no reader** anywhere (VERIFIED, 07 X2) |
| **User problem** | The student's own record of their semester is scattered; parked thoughts — captured mid-focus for later — are never resurfaced, so the capture is wasted |
| **Proposed V2 capability** | One "my reflections" timeline joining all three stores; parked drift-pad thoughts surface as triage items (C5) with one-tap convert-to-task/note |
| **How it works** | Read-side unification first (one query view over existing stores — no data migration needed); drift-pad writes gain a `resurfaced` flag consumed by the triage queue |
| **User value** | Reflection becomes reviewable history instead of three silos; mid-focus thoughts actually come back |
| **Frequency of use** | Weekly review + ad-hoc; drift surfacing after focus sessions |
| **Competitive inspiration** | Capacities' daily-note inbox + reflect-back pattern (04 §9.2); Tana's Weekly Reflection (04 §7.3) |
| **Why it fits Solis** | Pure consolidation (rule 5); makes the reflection record visible-and-summarized, the Harkin 2016 "physically recorded" moderator (06 §9) |
| **Differentiation potential** | Low directly; strengthens the loop story |
| **Technical complexity** | **S–M** |
| **Dependencies** | C5 (triage sink for drift items) |
| **Data requirements** | None new (read-side join) |
| **AI requirement** | **None** (Ask Solis may index reflections later — C25's grounding extension) |
| **Privacy considerations** | Reflections are sensitive self-data; already RLS-covered stores |
| **Risks** | Minimal |
| **Priority** | **V2 Core — Phase 1** |

### C7 — Frictionless Day Mechanics
| Field | Detail |
|---|---|
| **Category** | Planning / daily UX |
| **Current V1 state** | Routines require a manual "Sync today" on two different pages (VERIFIED, 01 §4); evening closure turns tomorrow intentions into *new* tasks instead of linking existing backlog — duplicate risk (`DashboardPage.tsx:728-744`, VERIFIED, 07 I4); aborted stopwatch work is honest but invisible ("will not be recorded" — `FocusPage.tsx:1348-1361`, VERIFIED, 01 §4 break #5) |
| **User problem** | Manual ceremony the system already has the data to eliminate; duplicated backlog; real partial work vanishes from analytics |
| **Proposed V2 capability** | Three deterministic fixes: (a) routines materialize automatically at first day load (01 §7.8); (b) evening closure offers link-or-create against the backlog; (c) partial/aborted stopwatch work is logged with honest framing (duration, reason optional) and feeds analytics and the calibration ledger (C8) |
| **How it works** | (a) `materializeRoutinesForToday()` already exists in the contract (VERIFIED 01 §3.1) — call it on first load, keep manual override; (b) evening intention input matches backlog first; (c) abort flow writes a partial session record flagged `aborted: true`, excluded from streaks but included in minutes/calibration |
| **User value** | Removes three daily frictions; analytics finally sees real-world partial work — the honest ground truth calibration needs |
| **Frequency of use** | Daily (morning, evening, and during focus) |
| **Competitive inspiration** | Reclaim's automatic habit materialization (04 §2.2); Toggl's planned-vs-actual loop needs honest actuals (04 §5.2) |
| **Why it fits Solis** | All three are VERIFIED V1 frictions with deterministic fixes (rule 6) |
| **Differentiation potential** | Low; compounds C8 |
| **Technical complexity** | **S–M** |
| **Dependencies** | C8 benefits from (c); otherwise standalone |
| **Data requirements** | `aborted` flag + optional reason on sessions; backlog-link table for evening intentions |
| **AI requirement** | **None** |
| **Privacy considerations** | Partial-work logs are user data → C2 |
| **Risks** | (c) must never shame: copy stays neutral ("logged 22 min of a planned 50") — 06 §11 one-tap recovery framing |
| **Priority** | **V2 Core — Phase 1** |

## 2.3 Evidence-backed depth (deterministic, citation-carrying)

### C8 — Calibration Ledger & Per-Item Slippage Forecasting
| Field | Detail |
|---|---|
| **Category** | Planning intelligence |
| **Current V1 state** | V1 logs plan estimates and session actuals (VERIFIED, 01 §4); exam-level feasibility exists (`timeCushion.ts`, `examFeasibility.ts` — VERIFIED, 01 §3.1/§3.8) but nothing calibrates the *student's own* estimation bias, and per-item slippage does not exist |
| **User problem** | Only 30% of students finish tasks in predicted time; actuals exceed worst-case estimates (Buehler et al. 1994 — VERIFIED, 06 §1); reference-class forecasting cut overruns 38%→5% (VERIFIED, 06 §1). Awareness alone doesn't fix it (VERIFIED, 06 §1) — only structural countermeasures do |
| **Proposed V2 capability** | A deterministic ledger: predicted-vs-actual per task/subject; a visible "your estimates run X% optimistic" score; future estimates auto-inflated from the student's own history (opt-out-able); per-item slippage forecast in the intelligence brief ("at current pace, Topic X lands 3 days short by Oct 14"); auto-segmentation of >90-min captures (06 §1 segmentation effect) |
| **How it works** | Join existing estimates and actuals; per-subject overrun ratio (with sample-size guardrails) feeds the C3 planner's capacity math and C17's budget; feasibility engine consumes inflated durations instead of ideal ones (06 §4 "outside view") |
| **User value** | The app gets measurably smarter about *this student's* pace every week — the single highest-value analytics upgrade per 04 §5.2 |
| **Frequency of use** | Continuous (every plan and session); visible at morning ritual and weekly review |
| **Competitive inspiration** | Motion's per-task Do Date ≠ Due Date (04 §2.1); Toggl 2.0 planned-vs-actual (04 §5.2) — Solis already holds both halves of the data |
| **Why it fits Solis** | Entirely deterministic (rule 8); rides existing engines; the evidence base is the strongest in input 06 |
| **Differentiation potential** | **High** — building block of the Diff2 flagship (C29) and Diff5 (C30) |
| **Technical complexity** | **M** |
| **Dependencies** | C7 (honest partial work improves the data); feeds C17, C30, C29 |
| **Data requirements** | Already recorded (estimates, actuals, sessions) |
| **AI requirement** | **None** (LLM-duration prediction is explicitly speculative and must never silently override the ledger — 06 §1) |
| **Privacy considerations** | All computation local/deterministic |
| **Risks** | Small-sample overcorrection early on — mitigated by minimum-count thresholds and "insufficient data" honesty |
| **Priority** | **V2 High Value — Phase 2** |

### C9 — WOOP Goal Wizard (Obstacle-First Goals)
| Field | Detail |
|---|---|
| **Category** | Goals / motivation science |
| **Current V1 state** | Goals have milestones, horizons, exam/project workspaces, feasibility, and generated study plans (VERIFIED, 01 §3.8) — but nothing asks for obstacles, and generated plans carry no fallback |
| **User problem** | Implementation intentions work (d = 0.61, Gollwitzer & Sheeran 2006 — VERIFIED, 06 §4); the MCII/WOOP meta shows g = 0.336 overall, g = 0.255 academic (Wang et al. 2021 — VERIFIED, 06 §4); unreinforced if-thens fail (Wang's own recommendation: remind at trigger time — VERIFIED, 06 §3/§4) |
| **Proposed V2 capability** | Goal creation becomes a 4-step Wish → Outcome → **Obstacle** → If-Then wizard; the if-then is scheduled and fires as a reminder at its trigger time; every generated study plan embeds a pre-written fallback branch ("if I miss Monday's session, then Tuesday 18:00 replaces it") |
| **How it works** | Wizard stores if/then structured fields on the goal; the notification service (quiet-hours aware, VERIFIED 01 §3.14) fires trigger-time reminders; plan generator emits fallback entries as C3 flexible blocks |
| **User value** | The best-evidenced goal mechanism available (Wang 2021), converted from worksheet to working system |
| **Frequency of use** | Per goal (term-scale) + reminder firing weekly |
| **Competitive inspiration** | None of the profiled competitors ships WOOP (input 06 survey found none) |
| **Why it fits Solis** | Deterministic; rides existing goal/plan/notification machinery; protects identity (goals become plans, not affirmations) |
| **Differentiation potential** | **High** — evidence-first goal design is unserved |
| **Technical complexity** | **M** |
| **Dependencies** | Notifications (exist); C3 for fallback blocks |
| **Data requirements** | New goal fields (obstacle, if/then, fallback) |
| **AI requirement** | **Optional** (AI-drafted WOOP is speculative — 06 §4: facilitation *quality* moderated effects; a good wizard beats an AI author) |
| **Privacy considerations** | Obstacles can be personal; stays in user's account |
| **Risks** | Wizard fatigue — mitigated by making the obstacle step skippable-but-prompted; overclaiming is barred (07 R12) |
| **Priority** | **V2 High Value — Phase 2** |

### C10 — Evidence-Aligned Habit System
| Field | Detail |
|---|---|
| **Category** | Habits |
| **Current V1 state** | Boolean/quantitative/tiered habits, streaks + amnesty, 90-day heatmap, auto-toggle, rhythm story (VERIFIED, 01 §3.7) — but chain-based streaks, no weekly-consistency scoring, no month-scale framing, and habits are tracked but never *scheduled* (VERIFIED, 01 §3.7; 04 §2.2) |
| **User problem** | Median 59–66 days to habit formation, range 4–335, only ~23% reach automaticity (Singh et al. 2024, PNAS — VERIFIED, 06 §2): binary chains punish exactly the users who need the most time, and "21-day" folklore sets false expectations |
| **Proposed V2 capability** | (a) Weekly-consistency scoring ("6/7 days") replaces the unbroken chain as the headline; month-scale expectation copy everywhere; context-stability prompt after a miss ("same time, same place next time?" — determinants VERIFIED, 06 §2); (b) habits become flexible calendar events with a time window + duration, placed by the C3 planner and re-placed with approval when reality intrudes (Reclaim mechanism, 04 §2.2) |
| **How it works** | Scoring is a pure computation over existing toggle history; habit-window placement is a C3 entry type consuming measured capacity (C8-inflated); re-placement always via approve-diff (rule 2) |
| **User value** | Habits survive real weeks and exams; expectations match the evidence; streaks stop being attrition machines |
| **Frequency of use** | Daily |
| **Competitive inspiration** | Reclaim AI Habits (04 §2.2); Habitify time-of-day placement (04 §4.1); the anti-pattern is Streaks' merciless chains (04 §4.2) |
| **Why it fits Solis** | V1 already has the data (heatmaps, tiered habits); the delta is scoring + placement — both deterministic |
| **Differentiation potential** | Moderate (Reclaim-style habits exist in calendar tools; *evidence-framed* habit design does not) |
| **Technical complexity** | **M** |
| **Dependencies** | C3 (placement); C8 (capacity) |
| **Data requirements** | Habit window/duration fields; consistency computed from existing history |
| **AI requirement** | **None** |
| **Privacy considerations** | None new |
| **Risks** | Placement autonomy creep — approval gates mandatory (rule 2); keep the chain visible as a secondary stat for users who like it |
| **Priority** | **V2 High Value — Phase 2** |

### C11 — Retrieval Tickets, Exam-Anchored Intervals & Workload Caps
| Field | Detail |
|---|---|
| **Category** | Learning / SRS depth |
| **Current V1 state** | FSRS-5/SM-2 flashcards, Anki IO, exam cram all working (VERIFIED, 01 §3.3) — but SRS scheduling stops at flashcards; no exam-anchored gap rule; no review workload caps (VERIFIED via 07 U5) |
| **User problem** | Spacing beats massing (d ≈ 0.42) and the optimal gap is ~10–20% of the retention interval (Cepeda 2008 — VERIFIED, 06 §7), yet V1 schedules cards per-card without anchoring to the exam that matters; a ballooning deck can silently eat a day |
| **Proposed V2 capability** | (a) Note-based "retrieval tickets" (AI- or hand-written questions on pinned notes/lectures) scheduled on the same FSRS backbone; (b) exam-anchored interval biasing toward the 10–20% rule given days-until-exam; (c) deterministic daily review-minute caps with overflow pushed forward |
| **How it works** | (a) extends the card schema with a `source` (note/lecture) and feeds C4's daily block; (b) is a modifier on the existing FSRS engine output; (c) caps via subject-health data (exists, 01 §3.3) |
| **User value** | Every note becomes recallable; review load respects the student's actual capacity; exam proximity shapes the schedule |
| **Frequency of use** | Daily (via C4's block) |
| **Competitive inspiration** | RemNote unifies notes+SRS (03 §2.B) but doesn't schedule into a planner; the 10–20% rule appears in no profiled product (06 §7) |
| **Why it fits Solis** | Extends V1's strongest verified engine rather than replacing it (rule 13); deterministic scheduling, AI only as content-drafter |
| **Differentiation potential** | **High** (Diff2 building block; notes→scheduled-recall is unserved) |
| **Technical complexity** | **M–L** |
| **Dependencies** | C4 (daily surfacing); C22 (typed records feed better tickets); C25 (AI question generation is Optional) |
| **Data requirements** | Ticket schema + source links; exam dates (exist on goals) |
| **AI requirement** | **Optional** (AI-generated questions, user-correctable; scheduling itself is deterministic — 06 §7 marks content quality unproven) |
| **Privacy considerations** | Ticket content is notes-derived; BYOK flow unchanged (C25) |
| **Risks** | Card-quality risk for AI-generated tickets — user-correctable by design (05 §4 B pattern) |
| **Priority** | **V2 High Value — Phase 2** |

### C12 — Confidence-Calibrated Quizzing
| Field | Detail |
|---|---|
| **Category** | Learning / metacognition |
| **Current V1 state** | Flashcard review and quiz surfaces exist (VERIFIED, 01 §3.3/§3.6); no confidence-before-reveal step exists anywhere (VERIFIED via 07 U9) |
| **User problem** | JOLs are systematically overconfident after re-reading, and calibration discrepancy predicts bad strategy choice (Wei 2025; Lee 2025 — VERIFIED, 06 §9); students study what *feels* known |
| **Proposed V2 capability** | Before revealing any quiz/flashcard answer: one-tap confidence (sure / likely / guess); per-subject calibration score over time ("right 95% when sure — 60% when 'likely'") |
| **How it works** | One extra tap in the existing review modal; calibration is a deterministic ratio with sample-size guard; surfaced in Analytics and the weekly review (C28's numbers) |
| **User value** | Study time redirects to overconfident gaps; metacognitive honesty becomes visible and improvable |
| **Frequency of use** | Every review session |
| **Competitive inspiration** | Brainscape's confidence-based repetition (03 §2.B) — Solis adds the *calibration score over the student's own history* |
| **Why it fits Solis** | Deterministic, tiny, evidence-strong (rule 5/8) |
| **Differentiation potential** | Moderate (Brainscape-adjacent but deeper) |
| **Technical complexity** | **S** |
| **Dependencies** | None beyond review surfaces |
| **Data requirements** | Confidence field per attempt; calibration rollup |
| **AI requirement** | **None** |
| **Privacy considerations** | None new |
| **Risks** | One extra tap per card — mitigated by making it a toggleable mode with a default-on trial; calibration copy must never shame |
| **Priority** | **V2 High Value — Phase 2** |

### C13 — Close-the-Loop Next-Action Notes
| Field | Detail |
|---|---|
| **Category** | Focus / attention |
| **Current V1 state** | Focus context carries identity into every session (VERIFIED, 01 §4 "strong"); switching away from unfinished items loses no data but leaves attention residue unmanaged |
| **User problem** | Switching to a new task while the previous is unfinished degrades performance (Leroy 2009 — VERIFIED, 06 §6); a written next action discharges the residue |
| **Proposed V2 capability** | Before ending a session early or switching plan items: an optional one-line "next step when I return" note, pre-filled onto the unfinished item and surfaced on its next block |
| **How it works** | A prompt in the existing abort/switch flow (the abort dialog already exists — 01 §3.4); the note rides the auto-cascade into the task/plan item |
| **User value** | Faster, calmer re-entry; the unfinished task stops haunting the next session |
| **Frequency of use** | Every early exit / task switch |
| **Competitive inspiration** | None observed in profiled products (06 §6 found no implementation) |
| **Why it fits Solis** | Cheap, deterministic, directly mapped to verified evidence; honors the existing auto-cascade |
| **Differentiation potential** | Low–moderate |
| **Technical complexity** | **S** |
| **Dependencies** | None |
| **Data requirements** | Next-action field on tasks/plan items (exists as subtask space) |
| **AI requirement** | **None** |
| **Privacy considerations** | None new |
| **Risks** | Prompt fatigue — one optional field, never blocking |
| **Priority** | **V2 High Value — Phase 2** |

### C14 — Detachment Gate & Scheduled Rest
| Field | Detail |
|---|---|
| **Category** | Burnout prevention / recovery |
| **Current V1 state** | Evening closure ritual exists (VERIFIED, 01 §3.1) but the plan stays visible afterward; rest is not a schedule concept |
| **User problem** | Recovery happens when taxed systems are not re-engaged; psychological detachment is the central recovery experience (effort–recovery model — VERIFIED construct, 06 §12); incomplete detachment predicts exhaustion |
| **Proposed V2 capability** | After the evening ritual, the plan hides until morning (with an explicit "day is done" state and paused nudges); rest blocks are first-class C3 entries that count as planned, and the daily score never punishes a planned-restful evening |
| **How it works** | A post-closure UI state (plan hidden, notifications muted via existing quiet hours); `rest` block type in C3 excluded from productivity pressure |
| **User value** | The app actively protects recovery instead of demanding more |
| **Frequency of use** | Daily (evening) |
| **Competitive inspiration** | None in the category (06 §12 found no implementation among study apps) |
| **Why it fits Solis** | Direct expression of principle 7 (calm over engagement); deterministic |
| **Differentiation potential** | **High** as positioning (an anti-engagement feature in an engagement economy) |
| **Technical complexity** | **S–M** |
| **Dependencies** | C3 (rest type); notifications (exist) |
| **Data requirements** | Rest block type; evening-closure state (exists, needs cloud sync via C2) |
| **AI requirement** | **None** |
| **Privacy considerations** | None new |
| **Risks** | Users who study late may find hiding the plan annoying — make the gate opt-out-able with an honest one-time explanation |
| **Priority** | **V2 High Value — Phase 2** |

### C15 — Adaptive Breaks from Circadian Data
| Field | Detail |
|---|---|
| **Category** | Focus / energy |
| **Current V1 state** | Circadian synthesis computes peak windows and feeds focus personalization (VERIFIED, 01 §3.9) but only *reports* — it never acts on break timing (07 U8/A6) |
| **User problem** | Break timing learned from the individual is the most-praised mechanism in the time-analytics category (Rize pattern — 04 §5.1); fixed Pomodoro cadences ignore measured energy |
| **Proposed V2 capability** | Deterministic break insertion: buffer blocks between C3 blocks, timed from the student's circadian curve and session-quality history; A/B'd against fixed cadences and reported honestly |
| **How it works** | The planner inserts `buffer` blocks (C3 type) from circadian peaks/valleys; the Focus Room suggests breaks at computed midpoints; A/B outcome comparison lives in analytics |
| **User value** | Breaks land when *this* student actually dips, not on a 25-minute clock |
| **Frequency of use** | Daily |
| **Competitive inspiration** | Rize smart breaks (04 §5.1); Reclaim AI Buffer Time (04 §2.2) |
| **Why it fits Solis** | V1 already computes the hard part (circadian synthesis, VERIFIED 01 §3.9); the delta is making it act — via proposals, never silent edits |
| **Differentiation potential** | Moderate |
| **Technical complexity** | **M** |
| **Dependencies** | C3 (buffer type); existing circadian engine |
| **Data requirements** | Existing session/circadian history |
| **AI requirement** | **None** |
| **Privacy considerations** | None new (all from the student's own telemetry) |
| **Risks** | Over-insertion annoyance — caps and approve-diff on plan changes |
| **Priority** | **V2 High Value — Phase 2** |

### C16 — Anti-Avoidance Kit (Two-Minute Starter & Obstacle Naming)
| Field | Detail |
|---|---|
| **Category** | Procrastination support |
| **Current V1 state** | Focus Room supports quick sessions and deferral exists with undo (VERIFIED, 01 §3.1/§3.4) — but nothing targets the *avoided* task itself; no re-framing prompt |
| **User problem** | Task aversiveness is the strongest tractable procrastination correlate (r ≈ .40, Steel 2007 — VERIFIED, 06 §3); treatment evidence is small (g = 0.34 — VERIFIED, 06 §3), so honesty demands a scaffold, not a cure claim |
| **Proposed V2 capability** | On tasks that slip twice: a one-tap "just the first 2 minutes" action (opens a tiny focus session) and a short "what makes this hard — boring / unclear / scary?" prompt producing a re-frame or first-step subtask |
| **How it works** | Deferral counts already exist (VERIFIED, 01 §3.1); a threshold triggers the kit deterministically; answers are stored on the task |
| **User value** | Attacks starting friction at the entry point — the evidence-backed lever (06 §3 RECOMMENDATION) |
| **Frequency of use** | Per avoided task |
| **Competitive inspiration** | None observed (06 §3 found no implementation) |
| **Why it fits Solis** | Deterministic, tiny, honest scoping ("self-regulation scaffold, not therapy" — 06 §3) |
| **Differentiation potential** | Moderate |
| **Technical complexity** | **S** |
| **Dependencies** | Focus Room (exists); C5 (can surface the kit as a triage item) |
| **Data requirements** | Slip-count (exists via deferralCount); obstacle/reframe fields |
| **AI requirement** | **None** (AI reframing is speculative per 06 §3) |
| **Privacy considerations** | Obstacle answers are personal; user-scoped |
| **Risks** | Overclaiming risk — copy never claims treatment (07 R12) |
| **Priority** | **V2 High Value — Phase 2** |

### C17 — Deadline Collision Radar & Weekly Load Budget
| Field | Detail |
|---|---|
| **Category** | Workload intelligence |
| **Current V1 state** | Workload capacity bar and exam feasibility exist (VERIFIED, 01 §3.2/§3.8); no cross-deadline clustering detection; no weekly committed-vs-available budget |
| **User problem** | Deadline bunching overwhelms students and pushes surface learning (Advance HE toolkit — OBSERVED PATTERN, 06 §10); silent overload is the default outcome in every planner |
| **Proposed V2 capability** | Deterministic radar: cluster detection across tasks/exams/study plans weeks ahead, with explicit trade-off prompts ("these three land in the same week — move X?"); a weekly load budget showing committed vs measured-available minutes, forcing explicit choices rather than silent overload |
| **How it works** | Pure computation over C3 entries; trade-off proposals arrive via C5 as approve-diffs; budget uses C8-inflated durations |
| **User value** | The study-OS answer to a problem institutions are told to fix and rarely do (06 §10) |
| **Frequency of use** | Weekly (radar), daily (budget bar) |
| **Competitive inspiration** | Motion's at-risk early warning (04 §2.1) — deterministic and explained here |
| **Why it fits Solis** | All inputs exist in the canonical model; rule 8 (deterministic beats AI at this) |
| **Differentiation potential** | **High** when combined with C30 (term scale) |
| **Technical complexity** | **M** |
| **Dependencies** | C3, C8, C5 |
| **Data requirements** | None new |
| **AI requirement** | **None** |
| **Privacy considerations** | None new |
| **Risks** | Alert fatigue — radar is weekly, not continuous; dismissals persist via C5 |
| **Priority** | **V2 High Value — Phase 2** |

### C18 — Rooms Accountability Micro-Mechanics
| Field | Detail |
|---|---|
| **Category** | Collaboration / accountability |
| **Current V1 state** | Realtime rooms (presence, synced timer, host failover, chat, reflections, pacts) implemented and working (VERIFIED, 01 §3.5); missing: goal declaration, closing check-in, scheduled recurring sessions (VERIFIED via 07 U7; 04 §10.3) |
| **User problem** | The effective parts of paid body doubling are the declared goal and the end-of-session check-in, not the co-worker (Focusmate mechanism — VERIFIED, 04 §10.3); body-doubling evidence itself is thin (06 §14) and demands measurement, not claims |
| **Proposed V2 capability** | (a) Mandatory goal declaration when joining a room session; (b) closing check-in ("did you do what you declared?") feeding personal analytics; (c) scheduled recurring room sessions; (d) measured: rooms-vs-solo completion compared in-app (06 §14) |
| **How it works** | Declaration/check-in ride the existing room event stream and post-session reflection; scheduling is a C3 entry; analytics join already-recorded session data |
| **User value** | Turns presence into accountability with three modest realtime additions (04 §10.3) |
| **Frequency of use** | Per room session (several times/week for the cohort that uses rooms) |
| **Competitive inspiration** | Focusmate's 3-step flow (04 §10.3); Flow Club's hosted structure (03 §2.D) |
| **Why it fits Solis** | V1's rooms are already ahead of competitors (03 §3: "ahead — free productized rooms with commitment devices is rare"); this deepens, not adds |
| **Differentiation potential** | **High** (pacts + witnessed commitment productized nowhere — 03 §6.3) |
| **Technical complexity** | **M** (realtime additions on an existing, working stream) |
| **Dependencies** | Rooms infra (exists); C5 (check-ins as data); C31 (pacts) shares the mechanics |
| **Data requirements** | Declaration/check-in records |
| **AI requirement** | **None** |
| **Privacy considerations** | Declarations are semi-public within the room — keep them behavioral, never identity claims (Gollwitzer 2009, 06 §4); value-at-zero-participants rule enforced (04 §2.3) |
| **Risks** | Thin underlying evidence — mitigated by shipping with in-app measurement and honest copy (06 §14; 07 R12) |
| **Priority** | **V2 High Value — Phase 2** |

## 2.4 Intake & reach (the two missed table stakes)

### C19 — Material→Recall Ingestion Pipeline (narrow first)
| Field | Detail |
|---|---|
| **Category** | Intake / learning pipeline |
| **Current V1 state** | No ingestion of lecture PDFs/slides/syllabi into the study system (VERIFIED gap, 03 §5 table stake #2 missed outright); AI flashcard generation exists only from *notes* (grounded, 3-tier, VERIFIED 01 §3.6); an LMS/deck importer exists for content (01 §3.3) |
| **User problem** | The most tedious setup step is turning the material students already have (syllabus, PDFs, slide decks) into a structured study system; the 2024–26 AI wave has set that expectation everywhere (03 §4.4) |
| **Proposed V2 capability** | Drop a PDF/text syllabus or document → schema-validated structured topic tree + exam dates + draft cards, **source-cited, every field user-confirmed** before saving; output enters the canonical schedule and the FSRS backbone — the step Turbo/Knowt structurally cannot do (03 §7.1) |
| **How it works** | Deterministic PDF text extraction → AI structuring pass (syllabus is free text; nothing deterministic can parse it — 05 §4 C) → schema validation → confirm-everything review screen → writes topics/dates/cards through existing services; per-field provenance retained for citations |
| **User value** | "Kills hours of setup" (05 §4 C); turns onboarding's hardest step into a review instead of data entry |
| **Frequency of use** | Per term / per course (a few times per semester) — high-stakes moments |
| **Competitive inspiration** | Turbo AI / StudyFetch / Knowt / Vaia (03 §2.B–C) — table-stakes expectation; differentiation is where output lands |
| **Why it fits Solis** | The ask's own thesis: material→cards→schedule is exactly where Solis's FSRS + planner wiring beats the content machines (07 §0 verdict 3; 03 §7.1) |
| **Differentiation potential** | **Very High** — closes the largest expectation gap *and* converts it into Solis's home advantage |
| **Technical complexity** | **L** (PDF extraction quality is the hard part; messy scans are weak even for incumbents — StudyFetch reviews, 05 §4 C) |
| **Dependencies** | C3 (topics/dates land in the model); existing topic trees + import machinery (01 §3.3) |
| **Data requirements** | Extracted-document store with provenance (for citations); user-provided files only |
| **AI requirement** | **Core** (structuring pass; schema-validated; user confirms every field — 05 §4 C) |
| **Privacy considerations** | User documents go to the AI provider only via the user's own key (BYOK) or the existing edge-function path; document the data flow per feature (05 §3.14); no document content is retained server-side beyond the user's own store |
| **Risks** | Hallucinated dates/deadlines are "the dangerous one" (05 §4 C) — mitigated by schema validation + mandatory per-field confirmation; failure posture: unparseable files fall back to manual entry, app never blocks (rule 4) |
| **Priority** | **V2 Differentiator — Phase 3** (the flagship new surface; sequenced after the loop works) |

### C20 — Live Calendar Subscriptions (read-only ICS first)
| Field | Detail |
|---|---|
| **Category** | Integrations |
| **Current V1 state** | ICS *export* one-way; import is paste-only feeds with manual sync — "partially complete as an integration" (VERIFIED, 01 §3.15); no two-way Google/Outlook sync (VERIFIED gap, 03 §3) |
| **User problem** | Class schedules and events live in the student's calendar; paste-and-pray import means the plan is stale the day the timetable changes |
| **Proposed V2 capability** | Read-only ICS URL subscriptions with polling, overlaid in the planner as fixed C3 entries; external events become collision-aware inputs (C17) — never silently moved; Google OAuth two-way sync deferred to V3 (narrow scope later; OAuth risk — 05 §4 L) |
| **How it works** | Server-side or client-side fetch of subscribed URLs on an interval; diff → update overlay entries; conflicts surface as triage items, not auto-reschedules |
| **User value** | The plan finally reflects real life; collisions are caught before the day |
| **Frequency of use** | Continuous (passive) |
| **Competitive inspiration** | MSL syncs Google/Apple/Outlook/iCal/Canvas (03 §2.A) — the bar; read-only ICS is the honest first slice |
| **Why it fits Solis** | Completes an existing integration rather than opening a new front (rule 13); avoids the OAuth control problem flagged in 05 §4 L |
| **Differentiation potential** | Low (table stake); enables C17/C29 realism |
| **Technical complexity** | **M** (ICS parsing exists in V1 — `CalendarFeedModal`, VERIFIED 01 §3.15) |
| **Dependencies** | C3 (overlay entries) |
| **Data requirements** | Subscription records (URL, sync state); cached external events |
| **AI requirement** | **None** |
| **Privacy considerations** | Calendar URLs are user secrets — stored encrypted at rest; no third-party data sharing |
| **Risks** | Polling rate limits/provider throttling — backoff + honest sync-state UI (failure honesty is V1's consistent quality, 01 §4) |
| **Priority** | **V2 High Value — Phase 3** |

### C21 — Mobile Surface: PWA, Widgets & Runtime Hardening
| Field | Detail |
|---|---|
| **Category** | Platform / reach |
| **Current V1 state** | 5-tab bottom bar with 48px targets, route prefetch, responsive CSS, mobile notes split-view (VERIFIED, 01 §5.2) — but the small-viewport runtime was **never verified** (no browser pass in any input; Lighthouse/axe not run — 01 §0/§5.2/§5.3); no widgets; web-only flagged as table stake #4 missed (03 §5) |
| **User problem** | "Web-only is a churn filter at student prices" (03 §5 item 4, VERIFIED competitor finding); capture and review happen on the phone |
| **Proposed V2 capability** | (a) Mobile runtime audit first (real devices + Lighthouse + axe — 01 §7.6); (b) PWA installability with the existing offline service worker hardened for mobile; (c) home-screen widgets (due-review counts, focus quick-start, capture) via PWA shortcuts and platform widget APIs where reachable; (d) fix the dense rooms/exam modals for phones (01 §5.2 OPINION) |
| **How it works** | Audit gates design; service worker already exists (`solis-offline-sw.js`, VERIFIED 01 §2) — extend caching strategy; widgets start as PWA shortcuts + share-target capture |
| **User value** | The study OS is present at the moment of capture and the moment of recall — the phone |
| **Frequency of use** | Continuous |
| **Competitive inspiration** | Every serious competitor ships mobile (MSL, Forest, TickTick — 03 §2); the gap is table stakes, not envy |
| **Why it fits Solis** | Rule 11; the offline WAL + service worker are the right foundation (03 §7.3) |
| **Differentiation potential** | Low as parity; the *offline-first* quality could become one once parity lands |
| **Technical complexity** | **L** (audit + PWA polish M; true OS widgets L and platform-dependent) |
| **Dependencies** | C1 (audit tooling in CI); C2 (state must sync for widgets to be truthful); C4 (widget content = due counts) |
| **Data requirements** | None new |
| **AI requirement** | **None** |
| **Privacy considerations** | Widget data on the lock screen must be minimal (counts, not content) |
| **Risks** | Runtime verification could surface rework (07 R9) — that is the point of auditing first; avoid native-app scope creep in V2 (PWA first, stores deferred) |
| **Priority** | **V2 Core** for audit + PWA baseline (Phase 3 per 07 Part 4, but criticality is Core — rule 11); **High Value** for widgets |

### C22 — Term/Timetable Projection Layer
| Field | Detail |
|---|---|
| **Category** | Planning / term structure |
| **Current V1 state** | Weekly-only scheduling; no rotating/A-B class grid or semester structure (VERIFIED gap, 03 §3 timetable row); an LMS importer exists for content, not the term grid (07 G5 nuance) |
| **User problem** | Real student terms are rotating timetables and 15-week arcs, not undifferentiated weeks |
| **Proposed V2 capability** | A term/timetable *projection* over the canonical model: class slots (recurring, room, rotation pattern) seed the weekly grid; a term view shows the 15-week arc (feeds C30). Manual entry + C19/C20 imports populate it; photo-based Schedule Scan is declined for V2 (07 G5) |
| **How it works** | Timetable entries are recurring C3 entries with rotation rules; the existing recurrence engine (persisted, VERIFIED 01 §3.2) provides the pattern model; the term view aggregates |
| **User value** | The plan finally matches the institution's shape of the semester |
| **Frequency of use** | Term-scale setup; weekly visibility |
| **Competitive inspiration** | MyStudyLife rotating/A-B timetables (03 §2.A) — the category bar |
| **Why it fits Solis** | Explicitly a projection, *not a fourth scheduler* (07 §2.2) — the whole point of C3 |
| **Differentiation potential** | Moderate (parity with MSL; combined with C30 it becomes Diff5) |
| **Technical complexity** | **M–L** |
| **Dependencies** | C3 (mandatory); C20 (import source) |
| **Data requirements** | Timetable entry schema (rotation, room, course link) |
| **AI requirement** | **None** in V2 (photo scan declined) |
| **Privacy considerations** | None new |
| **Risks** | Scope creep toward a full SIS — deliberately bounded to a projection |
| **Priority** | **V2 High Value — Phase 3** |

### C23 — Typed Study Records & Saved Views (+ Related-Content Suggestions)
| Field | Detail |
|---|---|
| **Category** | Knowledge / structure |
| **Current V1 state** | Notes have wiki-links, backlinks-in-graph, versioning, inline `::` cards (VERIFIED, 01 §3.6); no typed study records, no saved views; deterministic related-content suggestions absent |
| **User problem** | Study notes are untyped text, so the FSRS/mastery engine's inputs are untyped; exam questions and mistakes are not queryable assets (04 §7.1/§7.3) |
| **Proposed V2 capability** | Typed record types — `Lecture`, `Reading`, `ExamQuestion`, `Mistake` — with fields (course, date, source, confidence); 2–3 saved views ("unresolved exam questions for CS210 by mastery gap", "mistakes made >2 times"); deterministic related-content link suggestions with one-tap accept (Capacities pattern, 04 §9.2/§11.1 #14) |
| **How it works** | Note schema gains a `type` + fields; views are saved filters (Bases mechanism — structure as view, 04 §7.1); suggestions via deterministic keyword/trigram matching over the existing local index; NLP capture can emit typed records (Tana capture-schema bridge, 04 §7.3) |
| **User value** | Structure arrives through capture, not setup; the engine gets better-typed inputs; mistakes become a study queue |
| **Frequency of use** | Daily capture; weekly views |
| **Competitive inspiration** | Obsidian Bases (04 §7.1), Tana supertags (04 §7.3), Capacities objects (04 §9.2) — mechanisms, not clones |
| **Why it fits Solis** | The hard part (syllabus trees) already exists; this types the inputs and feeds C11's retrieval tickets |
| **Differentiation potential** | Moderate |
| **Technical complexity** | **M** |
| **Dependencies** | Rides C19's ingestion (typed records from documents); feeds C11, C25 (grounding quality) |
| **Data requirements** | Note type/field schema; migration is additive (existing notes stay untyped until typed) |
| **AI requirement** | **Optional** (suggestions deterministic; AI classification available as an explicit action) |
| **Privacy considerations** | All local matching; no embeddings service (V1's local RAG design preserved — 01 §3.13) |
| **Risks** | Taxonomy fatigue — types are optional labels with defaults, never required filing (anti-pattern: Mem's auto-organization, 04 §8.4) |
| **Priority** | **V2 High Value — Phase 3** |

### C24 — FSRS-6 Upgrade (evaluate, then upgrade)
| Field | Detail |
|---|---|
| **Category** | Learning engine |
| **Current V1 state** | FSRS-5 engine (VERIFIED, 02 §2 via 07 O1), well-tested (`fsrsEngine.ts` in the green suite, 01 §3.3) |
| **User problem** | FSRS-6 (2025) adds a 21st trainable parameter personalizing per-user forgetting-curve decay and outpredicts SM-2 on ~10k-user benchmarks; Anki ships fsrs-rs 6.6.x in current releases (VERIFIED, 06 §7; 03 §2.B) — the benchmark scheduler moved |
| **Proposed V2 capability** | Evaluate FSRS-6 against the existing engine on V1's own review logs; if it wins, upgrade behind the same interface, preserving existing card state and opt-out |
| **How it works** | Benchmark harness offline; parameter migration preserving stability/difficulty state; feature-flagged rollout |
| **User value** | Fewer reviews for the same retention — the Anki FAQ claim Solis's users inherit (05 §3.3) |
| **Frequency of use** | Every review (invisible) |
| **Competitive inspiration** | Anki 26.09.x (03 §2.B) — table stake for the med/law/language cohort (03 §4.5) |
| **Why it fits Solis** | Direct engine upgrade inside existing tests; rule 13 (no rewrite) |
| **Differentiation potential** | Low alone (parity); table-stakes credibility |
| **Technical complexity** | **M** |
| **Dependencies** | None (self-contained engine) |
| **Data requirements** | Existing review logs for benchmarking |
| **AI requirement** | **None** |
| **Privacy considerations** | None |
| **Risks** | State-migration bugs — mitigated by the round-trip-tested import machinery (01 §3.11: import.test.ts round-trips SM-2 state) |
| **Priority** | **V2 High Value — Phase 3** (evaluate early; ship when benchmark confirms) |

### C25 — Server Push Decision
| Field | Detail |
|---|---|
| **Category** | Notifications / platform |
| **Current V1 state** | Notifications are browser-local: inbox and preferences device-local; no server push; `webPushEnabled: false` (VERIFIED, 01 §3.14; 02 §1.7/D13 via 07 G7) |
| **User problem** | Reminders don't reach a closed laptop or another device — the if-then reminders (C9) and block-start nudges lose their force when the app isn't open (Wang 2021: unreinforced implementation intentions fail — VERIFIED, 06 §4) |
| **Proposed V2 capability** | **A decision, made early:** (a) build real Web Push (server-side VAPID push tied to schedule triggers — cross-device delivery), or (b) reposition V2 copy to honest app-open reminders. Input 07 marks this decision-required; this strategy recommends (a), narrowly scoped to deterministic schedule triggers only |
| **How it works** | Edge function evaluates due triggers from C3 and sends Web Push payloads; quiet hours enforced server-side too; inbox state syncs via C2 |
| **User value** | Triggers fire when they matter, on the device in hand |
| **Frequency of use** | Daily (background) |
| **Competitive inspiration** | Every mobile-first competitor pushes (03 §2 passim) |
| **Why it fits Solis** | Deterministic triggers only; **no AI-generated nudges** (boundary 5) |
| **Differentiation potential** | Low (parity) |
| **Technical complexity** | **M–L** (server push infra) |
| **Dependencies** | C2 (synced state); C3 (trigger source); C1 (edge function under CI) |
| **Data requirements** | Push subscription records per device |
| **AI requirement** | **None** |
| **Privacy considerations** | Push payloads must be minimal (counts, titles) — content stays in-app; user-controlled categories + quiet hours (existing, 01 §3.14) |
| **Risks** | Notification permission fatigue; browser push limitations on iOS — honest capability copy required (07 G7) |
| **Priority** | **V2 High Value — decision in Phase 0/1, implementation Phase 3** |

## 2.5 AI layer & differentiation (all respect the invariants: AI proposes, user disposes; AI-absent ⇒ fully functional)

### C26 — Grounded Ask Solis Deepening (+ Surfaced AI Confidence)
| Field | Detail |
|---|---|
| **Category** | AI / knowledge Q&A |
| **Current V1 state** | Ask Solis works: injection guard, BM25+trigram RRF retrieval, citations, faithfulness gate — but low-faithfulness results only warn in **console**, and the answer UI shows no source tier or faithfulness hint (VERIFIED, 01 §3.13/§7.7; 02 §1.9 via 07 U6) |
| **User problem** | The student can't tell how much to trust an answer; the safety machinery exists but is invisible — "detect-and-warn, not detect-and-block" (07 U6) |
| **Proposed V2 capability** | (a) Surface source tier + faithfulness in the answer UI ("grounded from your note, line 42"); (b) deepen grounding: better retrieval, forced citations, grounding extended to plans/sessions/review history (the unserved tutor-seed, 03 §6.5) |
| **How it works** | (a) is pure UI over existing scores (`ai.service.ts:621`); (b) extends the retrieval index with the canonical model's entities; answers stay chunk-scoped, never whole-notebook (05 §3.14) |
| **User value** | Trustworthy answers with checkable sources; the data advantage ChatGPT lacks (05 §4 A) |
| **Frequency of use** | Daily-to-weekly |
| **Competitive inspiration** | Perplexity's receipts-in-context (04 §8.5); StudyFetch's citations — grounded in the *user's own system* is the unserved version (03 §6.5) |
| **Why it fits Solis** | 05 §4 A: KEEP & DEEPEN — the core AI anchor; the grounding pipeline already exists |
| **Differentiation potential** | **High** (provenance over the student's own materials sidesteps the open-web accuracy wars — 04 §8.5) |
| **Technical complexity** | **S** for (a); **M** for (b) |
| **Dependencies** | Existing AI service; C3/C23 (richer grounded entities) |
| **Data requirements** | Retrieval index extension |
| **AI requirement** | **Core** (this is an AI feature; deterministic keyword search can't answer synthesis questions — 05 §4 A) |
| **Privacy considerations** | Sends retrieved chunks only, never whole notebooks (05 §3.14); BYOK unchanged; free-tier-key caveat surfaced in Settings (05 §3.14) |
| **Risks** | Latency — stream with ~2s TTFT budget (05 §3.13 OBSERVED PATTERN; V1 streaming behavior unverified — verify first, 07 O4) |
| **Priority** | **V2 High Value** — (a) surfaced confidence is Core-scoped (tiny), (b) deepening Phase 4 |

### C27 — Socratic Tutor Mode
| Field | Detail |
|---|---|
| **Category** | AI / tutoring |
| **Current V1 state** | Ask Solis answers directly; no pedagogical constraint mode exists |
| **User problem** | Students use AI to shortcut learning; the only strong independent evidence (Harvard PS2 Pal RCT, 194 students, ~2× learning gains) applies to *constrained, Socratic* tutors — not answer machines (VERIFIED, 05 §3.1); ChatGPT Study Mode / Claude Learning Mode prove the constraint pattern (04 §8.1) |
| **Proposed V2 capability** | A Tutor Mode toggle on Ask Solis with a hard behavioral contract: never hand over final answers to marked coursework; respond with a hint ladder (nudge → scaffold → worked analog) and a knowledge check; grounded in the student's own syllabus/notes so the questioning is course-specific |
| **How it works** | System-prompt-level constraint (the mechanism is governance, not capability — 04 §8.1); hint-ladder depth is a user setting; usage logged non-moralizingly into analytics ("you asked for direct answers 14× this week") |
| **User value** | Integrity-safe tutoring grounded where no general chatbot can ground it |
| **Frequency of use** | Several times/week during term |
| **Competitive inspiration** | ChatGPT Study Mode / Claude Learning Mode (04 §8.1) — the transfer is the constraint, and Solis's grounding is the edge |
| **Why it fits Solis** | "Highest-leverage AI transfer for Solis, nearly free" (04 §8.1 RECOMMENDATION); protects product identity (learning, not answers) |
| **Differentiation potential** | **Very High** — course-specific Socratic tutoring over the student's own material is unserved (03 §6.5, Diff6) |
| **Technical complexity** | **S–M** (prompt layer + UX; no infra) |
| **Dependencies** | C26's grounding; BYOK key path |
| **Data requirements** | Course context from C3/C23 |
| **AI requirement** | **Core** |
| **Privacy considerations** | Same chunk-scoped BYOK flow as C26 |
| **Risks** | Socratic modes can degrade into scripted questioning (MIT critique via 04 §8.1) — mitigated by hint-depth settings and measured usage; never claims to be a therapist or grader |
| **Priority** | **V2 Differentiator — Phase 4** |

### C28 — AI-Drafted Study Plans (deterministic validator disposes)
| Field | Detail |
|---|---|
| **Category** | AI / planning assist |
| **Current V1 state** | Deterministic study-plan generation from goals exists (VERIFIED, 01 §3.8); no AI drafting; MSL's Scout ("one sentence → planned week") and Notion 3.0 normalize the expectation (VERIFIED, 03 §2.A/§4.1) |
| **User problem** | "How do I split 12 weeks across these topics?" is a drafting problem LLMs do well; planning *invariants* (capacity, collisions, feasibility) they do badly (PlanBench — VERIFIED, 05 §3.2; 05 §4 D) |
| **Proposed V2 capability** | Optional "draft my week/plan" pass: LLM drafts a sequence from the user's real subjects, dates, and mastery; the deterministic feasibility math validates it *before it is shown*; the user confirms as an approve-diff; infeasible drafts are rejected with the reason, not silently fixed |
| **How it works** | Schema-constrained JSON output; validator = existing exam-feasibility + C8-inflated capacity + C17 collision math; on validation failure the draft returns with the failing constraint named |
| **User value** | Scout-class convenience without Motion-class autonomy or hallucinated plans |
| **Frequency of use** | Weekly (week draft) / per term (plan draft) |
| **Competitive inspiration** | MSL Scout, Notion 3.0 (03 §2.A/§4.1) — but validator-gated and approval-gated, which none of them show |
| **Why it fits Solis** | 05 §4 D: BUILD — draft + confirm + validate; the exact human-in-the-loop shape Anthropic recommends (05 §3.11) |
| **Differentiation potential** | **High** (BYOK, validated, explainable — Diff3) |
| **Technical complexity** | **M–L** |
| **Dependencies** | C3 (writes via approve-diff); C8 (capacity); C17 (collisions) |
| **Data requirements** | Uses existing entities; no new stores |
| **AI requirement** | **Useful→Core** (drafting is Core to this feature; the *plan* itself remains deterministic-first — the feature is optional to the product, rule 4) |
| **Privacy considerations** | Sends structured entity summaries, not full notes; BYOK |
| **Risks** | Confident-but-infeasible drafts — mitigated by the validator (05 §4 D: reliability of failure is good because the checker disposes); never auto-applies |
| **Priority** | **V2 Differentiator — Phase 4** |

### C29 — Weekly Review Agent (approve-diff proposal)
| Field | Detail |
|---|---|
| **Category** | AI / review ritual |
| **Current V1 state** | Weekly review is a strong 5-step wizard with deterministic fallback and next-week seeding as static items (VERIFIED, 01 §3.10) — a report, not a cycle-closing proposal (07 U11) |
| **User problem** | The review should close the cycle: prediction-vs-actual as its spine (06 §9/§14 map), and next week should arrive as a proposal the student approves — not static seeded items |
| **Proposed V2 capability** | The weekly review gains (a) a prediction-vs-actual section (planning calibration C8 + metacognitive calibration C12); (b) an AI-drafted next-week plan presented as an approve-diff, with all evidence computed by the deterministic engines (Notion-agent architecture, Reclaim gate — 04 §8.2/§2.2) |
| **How it works** | The LLM receives only computed numbers (numbers-in-prompt pattern — 05 §4 E: can't be factually wrong about the user); the draft lands in the triage queue as one diff; dismissal persists |
| **User value** | The week genuinely closes; estimates and calibration visibly improve week over week |
| **Frequency of use** | Weekly |
| **Competitive inspiration** | Notion 3.0 in-context agents + Reclaim approval gates (04 §8.2/§2.2); Linear cycle-closing (04 §10.1) |
| **Why it fits Solis** | Upgrades V1's strongest ritual without touching its deterministic core; the loop's "Improve" stage (07 §3.1) |
| **Differentiation potential** | **High** |
| **Technical complexity** | **M** |
| **Dependencies** | C8, C12 (the numbers); C5 (delivery); C3 (writes) |
| **Data requirements** | Existing weekly data |
| **AI requirement** | **Useful** (narrative + draft; the review works fully without AI via existing fallback — VERIFIED, 01 §3.10) |
| **Privacy considerations** | Numbers-only prompt; BYOK |
| **Risks** | Purple prose — bounded by numbers-in-prompt; approval fatigue — one diff, one pass |
| **Priority** | **V2 Differentiator — Phase 4** |

### C30 — Retention-Aware Replanning (memory pushes back on the calendar)
| Field | Detail |
|---|---|
| **Category** | Flagship differentiation |
| **Current V1 state** | Retention/mastery engines compute and surface (VERIFIED, 01 §3.9); the planner never reflows for review load — "the closed loop nobody closes" (03 §6.1, VERIFIED as an observed absence across every profiled product) |
| **User problem** | A ballooning deck, a decaying subject, or an approaching exam changes what tomorrow should look like — and no product's calendar responds |
| **Proposed V2 capability** | When review workload or retention health crosses thresholds, the planner proposes reflows (insert/extend the due-review block C4, shift flexible blocks, rebalance the week) as **approve-diffs in the triage queue** — never silent; every proposal carries its evidence receipt |
| **How it works** | Thresholds on deterministic signals (due-count vs cap C11; subject health; cushion drift); proposals are C3 diff objects consumed via C5; user-approved writes only |
| **User value** | The schedule finally answers to memory, not just to deadlines — Solis's single most defensible differentiator (Diff2) |
| **Frequency of use** | Weekly-ish (threshold-driven) |
| **Competitive inspiration** | None — this is 03 §6.1's unserved white space; Reclaim's approval-gate pattern (04 §2.2) supplies the interaction model |
| **Why it fits Solis** | Builds directly on the verified engine stack (retention, subject health, feasibility) and the C3 model; zero AI required |
| **Differentiation potential** | **Very High — the flagship** |
| **Technical complexity** | **L** (gated on C3 being real) |
| **Dependencies** | C3 (mandatory), C4, C11, C5, C8 |
| **Data requirements** | None new (engine outputs + schedule model) |
| **AI requirement** | **None** (deliberately — 05 §4 H: deterministic replanner wins; autonomy avoided) |
| **Privacy considerations** | None new |
| **Risks** | Trust risk if reflows feel automatic (07 R7) — the approve-diff is the whole design; over-proposal — thresholds tuned conservatively, dismissals persist |
| **Priority** | **V2 Differentiator — Phase 4** |

### C31 — Term-Scale Feasibility Intelligence
| Field | Detail |
|---|---|
| **Category** | Differentiation / planning intelligence |
| **Current V1 state** | Exam-level feasibility + cushion exists (VERIFIED, 01 §3.8); nothing models the 15-week term across subjects |
| **User problem** | Products optimize the day (Motion) or week (Reclaim, Scout); nobody computes "you cannot pass this unit at current pace" early and honestly (03 §6.4) |
| **Proposed V2 capability** | A term view computing per-subject feasibility over the whole arc: workload balance, exam clustering, calibration-inflated pace (C8), and the honest early warning — deterministic, explained, with proposed trade-offs (via C17/C5) |
| **How it works** | Extends the existing feasibility engine to term horizon; consumes timetable (C22), ledger (C8), retention state |
| **User value** | The most valuable sentence a study app can say — "you will miss this" — said weeks early (04 §11.1 #3) |
| **Frequency of use** | Weekly check; term milestones |
| **Competitive inspiration** | None — 03 §6.4 white space; Motion's per-task at-risk warning is the closest (04 §2.1) |
| **Why it fits Solis** | "Exactly where a deterministic engine beats an LLM" (03 §6.4) |
| **Differentiation potential** | **Very High** (Diff5) |
| **Technical complexity** | **M–L** (rides C3/C8) |
| **Dependencies** | C3, C8, C22, C5 |
| **Data requirements** | None new |
| **AI requirement** | **None** |
| **Privacy considerations** | None new |
| **Risks** | Anxiety from harsh warnings — framing must stay factual with recovery actions attached (06 §11 buoyancy framing) |
| **Priority** | **V2 Differentiator — Phase 4** |

### C32 — Study Pacts as a Measured Experiment
| Field | Detail |
|---|---|
| **Category** | Collaboration / commitment |
| **Current V1 state** | Weekly-minutes pacts with invite codes exist (VERIFIED, 01 §3.5); thin mechanics; deposit-style stakes untested in-app |
| **User problem** | Commitment devices among friends are productized nowhere (03 §6.3); but deposit uptake is the verified weak link (Giné et al. — VERIFIED, 06 §13) and body-doubling evidence is thin (06 §14) |
| **Proposed V2 capability** | Productize pacts with **behavioral stakes only** (a shared pact board showing who showed up; weekly recorded summaries exchanged, not daily nudges — Harkin's reported-progress moderator, 06 §13/§14); ship as a labeled in-app experiment with measured completion/return rates |
| **How it works** | Builds on C18's declaration/check-in records; the pact board is a read-only aggregation of recorded summaries; no money, ever |
| **User value** | Social accountability that the evidence actually supports (monitoring + reporting), without the deposit trap |
| **Frequency of use** | Weekly |
| **Competitive inspiration** | Forest group planting is decorative; Flow Club's partners are strangers (03 §6.3) — neither productizes commitment among friends |
| **Why it fits Solis** | Rooms already ahead (03 §3); deepens the rarest social asset with honest evidence handling |
| **Differentiation potential** | **High** (Diff4) — conditional on measurement |
| **Technical complexity** | **M** |
| **Dependencies** | C18 (mechanics); C2 (synced records) |
| **Data requirements** | Pact membership + weekly summary records |
| **AI requirement** | **None** (AI-matched partners is explicitly speculative — 06 §14) |
| **Privacy considerations** | Behavioral sharing only; never identity goals (Gollwitzer 2009 — VERIFIED, 06 §4); all sharing opt-in; value-at-zero-participants enforced |
| **Risks** | Low uptake (verified for deposits, 06 §13) and thin evidence (06 §14) — accepted because it ships as a *labeled experiment*, not a bet (07 R12) |
| **Priority** | **V2 Experimental — Phase 4** |

### C33 — Related-Content Link Suggestions
*(Merged into C23 — deterministic one-tap-accept suggestions over the existing local index, per 04 §9.2/§11.1 #14. AI requirement: None. Priority: V2 High Value, Phase 3.)*

### C34 — Voice Dictation into Capture Fields
| Field | Detail |
|---|---|
| **Category** | Capture / input |
| **Current V1 state** | NLP text capture exists (VERIFIED, 01 §3.2); no voice input |
| **User problem** | Hands-free entry matters on mobile and while switching contexts; STT is near-free and near-perfect (05 §3.7) but public-use discomfort is a real adoption barrier (PYMNTS — VERIFIED, 05 §3.7) |
| **Proposed V2 capability** | Optional dictation button in capture fields using on-device Web Speech API first; cloud STT never the default; transcription is visible-before-save |
| **How it works** | Web Speech API where available; graceful absence elsewhere; text enters the existing deterministic parser |
| **User value** | Faster capture in the moments a keyboard is awkward |
| **Frequency of use** | Occasional, user-dependent |
| **Competitive inspiration** | Todoist Ramble, Superlist voice add (04 §3.1/§3.4) — but on-device-first |
| **Why it fits Solis** | 05 §4 G: OPTIONAL experiment — cheap, worst case is a visible mis-transcription |
| **Differentiation potential** | Low |
| **Technical complexity** | **S** |
| **Dependencies** | None |
| **Data requirements** | None persisted beyond the resulting text |
| **AI requirement** | **Optional** (on-device STT; no cloud default) |
| **Privacy considerations** | On-device first means audio leaves the device only if the user explicitly enables a cloud fallback — keep the default off (05 §3.7/§3.14) |
| **Risks** | Browser support variance — feature-detect and hide |
| **Priority** | **V2 Experimental — Phase 4** |

### C35 — Interleaved Practice Sets (labeled, measured)
| Field | Detail |
|---|---|
| **Category** | Learning / practice design |
| **Current V1 state** | No interleaving anywhere (VERIFIED via 07 U10) |
| **User problem** | Interleaving wins at delay (Brunmair & Richter 2019) but learners' judgments don't track the advantage (Németh 2025 — both VERIFIED, 06 §8) — students avoid what works because it *feels* worse; boundary conditions (only similar content) are real |
| **Proposed V2 capability** | For topics with sibling categories of the same type, the suggester offers mixed sets carrying the label "feels worse, works better — you'll score better in 2 weeks"; outcomes compared at 1–2-week delay in analytics before any claim |
| **How it works** | Deterministic set-mixing for same-type topics only; the label is static copy; measurement joins existing quiz/review outcomes |
| **User value** | Converts a metacognitive trap into a supported choice |
| **Frequency of use** | Per study session (opt-in) |
| **Competitive inspiration** | None observed (06 §8 found no implementation) |
| **Why it fits Solis** | Evidence-first culture; measurement honesty (principle 9) |
| **Differentiation potential** | Moderate |
| **Technical complexity** | **M** |
| **Dependencies** | C23 (topic typing makes "similar categories" detectable); review surfaces |
| **Data requirements** | Set composition logs + delayed outcome join |
| **AI requirement** | **None** (AI-generated problem sets are speculative, 06 §8) |
| **Privacy considerations** | None new |
| **Risks** | Wrong-content interleaving can reverse the effect (boundary conditions VERIFIED, 06 §8) — same-type gating is mandatory; never claim benefit before the delayed measurement |
| **Priority** | **V2 Experimental — Phase 4** |

## 2.6 Deliberate declines (recommend AGAINST building)

Each declined candidate carries the evidence that kills it and the rule it violates. These are strategy, not omissions.

| # | Candidate (what it would be) | AI req. | Privacy | Evidence against | Rule(s) violated | What we do instead |
|---|---|---|---|---|---|---|
| **D1** | **Autonomous agentic replanning** — "AI reschedules your life" (Motion's core loop) | Core | Broad context to vendor | LLMs can't plan reliably (PlanBench — VERIFIED, 05 §3.2); agent loops compound errors (Anthropic — 05 §3.2); Motion's most-cited complaint is exactly this opacity (OBSERVED PATTERN, 05 §3.3); Gartner: >40% of agentic projects canceled (VERIFIED, 05 §3.2) | 2, 4 (identity), 7, 8 | C30: deterministic replanning as approve-diffs |
| **D2** | **Proactive AI nudges / AI coach** interrupting the student | Core | Context to vendor | An interrupting AI defeats a focus app ("Assistance or Disruption?", 2025 — VERIFIED, 05 §3.4/§5.2); V1's deterministic explainable alerts already cover the need (05 §4 I) | 4, 7 | Deterministic triggers (C5, C9) that offer optional AI actions |
| **D3** | **LLM memory layer** (Mem0/Zep-style learned memory) | Core | Second vendor sees user data | Postgres + RAG matches memory systems at ~8× lower TCO (arXiv 2026 — VERIFIED, 05 §3.9); memory-poisoning attack surface ("Trojan Hippo"); the DB *is* the memory (05 §4 J) | 7, 9, 10 | Grounded retrieval over structured data (C26) |
| **D4** | **Live voice tutor / AI companion** | Core | Continuous audio to vendor | ~$2–4/mo audio tokens (VERIFIED pricing math, 05 §3.12); off-mission scope creep; Harvard evidence applies to constrained tutors, not companions (VERIFIED, 05 §4 K) | 4, 7 | C27 Socratic text Tutor Mode |
| **D5** | **Autonomous tool agents** — calendar OAuth agent, MCP tool loops, browser automation (Comet-style) | Core | Broad OAuth scope risk | No Solis user problem blocked on tool autonomy (05 §4 L); auto-decline/reschedule is the documented control failure (IPPO via 05 §3.4); prompt-injection risk documented for browser agents (arXiv via 04 §8.5) | 9, 10 | Read-only ICS subs (C20); data *out* via export (exists) |
| **D6** | **LLM-per-capture task parsing** | Core | Every capture to vendor | Deterministic parsing is instant, offline, free — the industry norm (Todoist's grammar-based behavior, 05 §3.7); network round-trip per task adds latency/cost/misparse risk (05 §5.7) | 6, 7, 8 | Existing deterministic NLP parser; LLM fallback only on explicit user invocation (05 §4 F) |
| **D7** | **LLM as the intelligence engine** (replacing FSRS/mastery/feasibility math) | Core | Metrics vendor-dependent | Those engines are validated, explainable, free, offline (05 §4 M); an opaque single source of truth is unexplainable drift | 2, 4, 8 | Engines stay; AI narrates computed numbers only (C29) |
| **D8** | **Gamification theater** — Karma-style points/levels/box economies | None | None | Rewards checking boxes, incentivizing trivial task churn over real study (04 §3.1); momentum must key off study minutes and retention (04 §3.1 RECOMMENDATION) | 3, 4 | Honest competence signals: mastery, consistency, calibration improvements (06 §13) |
| **D9** | **Identity-goal social sharing** ("I'm going to be a topper" celebrations) | None | Social pressure | Public *identity* goals backfire — law students who announced did fewer relevant tasks (Gollwitzer 2009 — VERIFIED, 06 §4/§13) | 4, 15 | Behavioral share cards ("studied 3h40m on Organic Chem this week") — V3 |
| **D10** | **Monetary deposit stakes** in pacts | None | Payment data | Deposits fail on uptake — people decline to deposit (Giné et al. NEJM; JMIR 2022 — VERIFIED, 06 §13) | 15 | Behavioral stakes (C32) |
| **D11** | **Unnecessary social network** — stranger pairing, open feeds, follower graphs, network-dependent features | None | Public-by-design surfaces | Pairing-with-strangers is an operations-intensive trust surface (04 §10.3 EXPERT OPINION); network-dependent value killed Clockwise (VERIFIED sunset — 04 §2.3); every feature must deliver at zero participants | 3, 4 | Rooms + pacts among *existing* members (C18, C32) |
| **D12** | **Infrastructure-heavy ingestion in V2** — lecture-audio transcription, photo Schedule Scan | Core | Audio to vendor | Audio ingestion infrastructure absent; crowded meeting-notetaker space (04 §7.3 stretch); photo-timetable parsing is an ML project, not a feature (07 G5) | 5, 10, 14 | Narrow document ingestion (C19); **Later (V3)**: audio transcription, photo scan |
| **D13** | **AI auto-filing / auto-organizing notes** (Mem-style inference organization) | Core | Content to vendor | When base UX is weak, AI organization can't compensate; trust in auto-structure is hard to win back (04 §8.4 cautionary) | 4, 9 | Typed records + deterministic one-tap suggestions (C23) |
| **D14** | **Platform/storage rewrite** (new data layer, native-app rebuild before parity) | None | None | Logseq spent 2024–2026 on a DB rewrite amid mixed-to-critical community reaction (04 §7.2); 07 R2; V1's architecture is the asset, not the obstacle | 13, 14 | Incremental schema evolution inside Supabase/IDataService (C2, C3) |

---

# Part 3 — Prioritization

## 3.1 Criteria used

Tier assignment weighs nine criteria (from the brief). No mechanical score is presented — tiering is judgment, with the dominant criteria named per candidate; where a formula and judgment diverge, judgment wins and says so.

| Criterion | Question it answers | Weighting note |
|---|---|---|
| **User value** | Is the problem real and evidence-backed? | Highest weight; input 06's VERIFIED evidence outranks plausible ideas |
| **Core-loop impact** | Which loop stage (Trigger/Plan/Act/Track/Understand/Adapt/Improve — 07 Part 3) does it serve? | Candidates serving no stage were declined |
| **Frequency** | Daily > weekly > term-scale | A term-scale feature can still be Core if it's the identity |
| **Retention** | Does it create a reason to return? | Weighed against principle 7 — retention via calm, not compulsion |
| **Differentiation** | Is it unserved (03 §6) or table-stakes parity? | Table stakes gate credibility; white space builds the moat |
| **Effort** | S/M/L/XL | Weighed against the dependency chain, not alone |
| **Risk** | Trust, migration, regression | C1's CI exists precisely to lower everyone else's risk |
| **Maintenance** | Long-term subsystem cost (rule 10) | Killed X5 (dead AI telemetry: defer or delete) and shaped several declines |
| **Strategic importance** | Foundational enabler vs optional | Foundations can outrank their direct user value |

## 3.2 Tier definitions

- **V2 Core** — defines the release; the loop is broken without it. Ship in Phase 0–1 (+ the mobile baseline).
- **V2 High Value** — evidence-backed depth that rides the core; ship within V2, Phase 2–3.
- **V2 Differentiators** — the moat; sequenced Phase 3–4 because they compound everything before them.
- **V2 Experimental** — build as measured, labeled experiments; success metrics defined *before* launch.
- **Later (V3)** — real, evidenced, not now.
- **Reject/Avoid** — declined with reasons; revisit only if the evidence changes.

## 3.3 Classification of every candidate

| ID | Candidate | Tier | Dominant criteria | Reasoning |
|---|---|---|---|---|
| C1 | Engineering Foundations & Integrity Repairs | **V2 Core** | Strategic importance, risk, maintenance | Every later phase multiplies these codepaths; CI is "the single cheapest high-value fix" (02 §5); simulated presence in production is an integrity defect that blocks all social V2 work (07 R4, X6) |
| C2 | Cross-Device State Continuity | **V2 Core** | User value, core-loop impact, strategic importance | ~40 device-local keys are a VERIFIED continuity failure (01 §1); nothing else is trustworthy until state follows the student |
| C3 | One Canonical Schedule Model | **V2 Core** | Core-loop impact, strategic importance, user value | The "single largest IA debt" (01 OPINION) and the enabler of C4/C10/C17/C30/C31; highest-leverage fix in input 07 |
| C4 | Due Review in the Daily Surface | **V2 Core** | Core-loop impact, frequency, effort | Smallest closure of the strongest engine; VERIFIED break #2; S-effort, daily use |
| C5 | Triage Queue & Analytics Write-Back | **V2 Core** | Core-loop impact, user value | Repairs VERIFIED break #3; converts analytics from report to control surface; every other insight feature flows through it |
| C6 | Unified Reflections & Drift-Pad Reader | **V2 Core** | User value, effort | VERIFIED disconnection with a readerless capture (X2); cheap read-side consolidation |
| C7 | Frictionless Day Mechanics | **V2 Core** | Frequency, effort, rule 6 | Three VERIFIED daily frictions with deterministic fixes; removes manual work the data already covers |
| C8 | Calibration Ledger & Slippage | **V2 High Value** | User value (strongest evidence), differentiation | Buehler 1994 + reference-class 38%→5% (06 §1); the building block of the flagship (C30/C31) |
| C9 | WOOP Goal Wizard | **V2 High Value** | User value, differentiation | g = 0.336/0.255 academic (Wang 2021); unserved by every competitor surveyed |
| C10 | Evidence-Aligned Habits | **V2 High Value** | User value, retention, frequency | Singh 2024 rewrites the habit contract; scheduling rides C3; retention via honesty, not chains |
| C11 | Retrieval Tickets & Exam-Anchored Review | **V2 High Value** | User value, differentiation | Extends the strongest verified engine; Cepeda 10–20% rule unserved; feeds Diff2 |
| C12 | Confidence-Calibrated Quizzing | **V2 High Value** | User value, effort | S-effort, strong JOL evidence (06 §9), daily frequency |
| C13 | Close-the-Loop Notes | **V2 High Value** | User value, effort | Leroy 2009; S-effort; protects the Act stage |
| C14 | Detachment Gate & Scheduled Rest | **V2 High Value** | User value, differentiation (positioning) | Effort–recovery model; the anti-engagement feature that embodies principle 7 |
| C15 | Adaptive Breaks | **V2 High Value** | User value, effort | Circadian engine exists and only reports (07 U8); A/B'd, proposal-gated |
| C16 | Anti-Avoidance Kit | **V2 High Value** | User value, effort | Strongest tractable correlate (r ≈ .40); tiny; honest scoping |
| C17 | Deadline Collision Radar & Load Budget | **V2 High Value** | User value, differentiation | Deadline bunching evidence-aligned (06 §10); rides C3/C8; feeds C31 |
| C18 | Rooms Accountability Micro-Mechanics | **V2 High Value** | Differentiation, user value | Focusmate's verified effective mechanics (04 §10.3) on a working realtime base; shipped with measurement |
| C19 | Material→Recall Ingestion Pipeline | **V2 Differentiator** | Differentiation, user value, strategic importance | The largest expectation gap (table stake #2 missed); output enters a real schedule — the step incumbents can't take; sequenced Phase 3 so ingested material lands in a *working* loop |
| C20 | Live Calendar Subscriptions | **V2 High Value** | User value, effort | Table stake #5 partial; read-only ICS first avoids the OAuth control problem; two-way Google is V3 |
| C21 | Mobile: PWA, Widgets, Runtime Hardening | **V2 Core** (audit + PWA baseline) / High Value (widgets) | User value, retention, rule 11 | "Web-only is a churn filter" (03 §5); runtime never verified; audit gates design; widgets ride the core |
| C22 | Term/Timetable Projection | **V2 High Value** | User value, differentiation (with C31) | Parity with MSL's bar (03 §3); explicitly a projection, not a fourth scheduler |
| C23 | Typed Study Records & Saved Views (+ C33 suggestions) | **V2 High Value** | User value, strategic importance | Types the engine's inputs; validated demand (Tana's student push — 04 §7.3); feeds C11/C26 |
| C24 | FSRS-6 Upgrade | **V2 High Value** | User value, effort | Benchmark scheduler moved (06 §7; 03 §2.B); self-contained M with tested migration machinery |
| C25 | Server Push Decision | **V2 High Value** | User value, strategic importance | Decision-required (07 G7); recommend real push, deterministic triggers only; if declined, reposition copy honestly |
| C26 | Grounded Ask Solis Deepening (+ surfaced confidence) | **V2 High Value** (surfacing is Core-scoped) | User value, differentiation, effort | 05 §4 A: keep & deepen; surfacing existing scores is S-effort and repairs U6 |
| C27 | Socratic Tutor Mode | **V2 Differentiator** | Differentiation, user value, effort | Harvard RCT constrains the design (05 §3.1); course-specific grounding is the moat; S–M effort |
| C28 | AI-Drafted Study Plans | **V2 Differentiator** | Differentiation, user value, risk | Scout-class convenience; validator + approve-diff neutralize the PlanBench failure mode |
| C29 | Weekly Review Agent | **V2 Differentiator** | Core-loop impact (Improve), differentiation | Closes the cycle as a proposal; numbers-in-prompt makes it factually safe (05 §4 E) |
| C30 | Retention-Aware Replanning | **V2 Differentiator** | Differentiation (flagship), user value, strategic importance | 03 §6.1 white space; the sentence "memory pushed back on my calendar" is Solis's moat; gated on C3 |
| C31 | Term-Scale Feasibility | **V2 Differentiator** | Differentiation, user value | 03 §6.4 white space; deterministic engine beats an LLM exactly here |
| C32 | Study Pacts Experiment | **V2 Experimental** | Differentiation, risk (evidence thin) | Diff4, but deposit evidence says low uptake and body-doubling evidence is thin (06 §13/§14) — labeled experiment, behavioral stakes only |
| C33 | Related-Content Suggestions | **V2 High Value** (merged into C23) | Effort, user value | Deterministic, one-tap accept; the safe version of AI-organization (04 §9.2/§8.4) |
| C34 | Voice Dictation | **V2 Experimental** | Effort, risk | 05 §4 G optional; on-device first; public-use discomfort limits reach |
| C35 | Interleaved Practice Sets | **V2 Experimental** | User value, risk | VERIFIED effect with VERIFIED metacognitive trap (06 §8); boundary conditions mandatory; measure at delay before claiming |
| D1–D14 | Deliberate declines | **Reject/Avoid** | All | Each carries its evidence and rule violation in Section 2.6 |

**Tier counts:** Core 8 (C1–C7, C21 baseline) · High Value 19 (C8–C20, C22–C26, C33) · Differentiators 6 (C19, C27–C31) · Experimental 3 (C32, C34, C35) · Reject/Avoid 14 (D1–D14).

## 3.4 Borderline calls, argued

- **Mobile: Core or High Value?** **Core (baseline).** The brief's rule 11 plus the VERIFIED "web-only is a churn filter" finding (03 §5) make the *audit + installable baseline* part of the release definition; true OS widgets stay High Value because platform surface area is unbounded. Its build-order position (Phase 3, per 07 Part 4) reflects dependency reality — widgets are truthful only after C2 syncs state — not criticality.
- **Ingestion: Core or Differentiator?** **Differentiator, deliberately.** It is the biggest new surface, but building it before the loop closes would pour material into three scheduling vocabularies and a non-writing analytics surface (07 Part 4's reason for Phase 3). Differentiation tier + late phase captures both facts.
- **Server push: build or reposition?** **Decide early, lean build.** Wang 2021's "unreinforced implementation intentions fail" (VERIFIED, 06 §4) is the product argument: C9's if-then reminders need to fire when the app isn't open. Scope is deterministic triggers only; the decline of D2 (no AI nudges) keeps the surface honest.
- **Rooms/pacts: High Value or Experimental?** Split by mechanics: C18 (declaration/check-in) is High Value — the mechanics are verified-effective in the paid category (04 §10.3) and ride a working system. C32 (pacts productized) is Experimental because the *evidence for stakes uptake is verified-weak* (06 §13) and honesty demands measurement-first (principle 9).
- **FSRS-6: now or later?** High Value, evaluated early. It is self-contained M-effort with tested state round-trips (01 §3.11), and "SRS claims without a modern algorithm are increasingly disqualifying" (03 §4.5) — but it ships when the benchmark on V1's own logs confirms, not on fashion.
- **Adaptive breaks: High Value or Experimental?** High Value — the engine (circadian synthesis) is VERIFIED-implemented (01 §3.9); the delta is deterministic actuation with approval gates, and the A/B comparison is part of the feature, not a hedge.

## 3.5 Build order (consistent with input 07, Part 4)

| Phase | Theme | Candidates | Exit criterion |
|---|---|---|---|
| **0** | Foundations | C1 (+ the C25 *decision*, mobile/a11y audits) | CI green on every push; presence honest; cache user-scoped; audits run |
| **1** | Loop closure — the identity | C2, C3, C4, C5, C6, C7 | Every VERIFIED loop break of 01 §4 repaired; a new device sees the same day |
| **2** | Evidence-backed depth | C8–C18, C23 | The loop stages carry their citations; determinism everywhere |
| **3** | Intake & reach | C19, C20, C21, C22, C24, C25-impl, C33 | Table stakes #2/#4 closed; material enters a working schedule |
| **4** | AI layer & differentiation | C26(b), C27, C28, C29, C30, C31, C32, C34, C35 | AI strictly a proposal layer; the flagship differentiators live behind approve-diffs |

## 3.6 V2 definition of done (RECOMMENDATION)

V2 ships when: (1) the **Core tier** is complete — one schedule model, synced state, recall in the day, triage write-back, unified reflections, frictionless day, honest foundations, installable mobile baseline; (2) **High Value** depth is substantially shipped across the loop stages; (3) at least the ingestion pipeline **and** retention-aware replanning are live as differentiators (the latter behind approve-diffs); (4) the experiments (pacts, voice, interleaving) are instrumented with pre-declared metrics; and (5) the declines remain declined. Everything in the Later (V3) list — two-way Google OAuth sync, Canvas/LMS import, lecture-audio transcription, photo Schedule Scan, behavioral share cards, family/school surfaces — is explicitly out of V2.

---

## Closing note

The strategy in one paragraph: **Solis V1 proved that a deterministic, explainable, cross-wired study brain can be built and tested by a small team; the six research inputs agree its failures are structural — loops that don't close, continuity that doesn't exist, intake that never happens. V2 therefore refuses the category's loudest temptations (autonomous agents, AI nudges, gamification, social feeds, paywalled study modes) and spends its whole budget on making the brain act: one schedule model, synced state, recall in the day, a triage queue that writes back, evidence-backed mechanisms with their citations shown, real material flowing in, and memory state pushing back on the calendar — with AI as a proposal layer that the student, always, disposes.**

Every VERIFIED FACT above resolves to inputs 01–07 and, through them, to the repository state and web sources they inspected on 2026-09-27. Judgments are the author's, labeled as such.

*Prepared as the product-strategy input to the Solis V2 planning phase (input 08). No code checks were executed in this session; all verification inherits from the inputs' evidence trails.*
