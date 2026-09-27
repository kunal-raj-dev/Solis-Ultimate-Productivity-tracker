# 07 — Solis V1→V2 Gap Analysis (Synthesis)

**Document ID:** `docs/v2-research/07-gap-analysis.md`
**Stage:** Solis V2 Research & Product Planning — synthesis (input 07)
**Date:** 2026-09-27
**Method:** Synthesis of six research inputs into one decision-grade gap analysis. **No code checks, builds, or web fetches were executed for this synthesis session**; every VERIFIED FACT below inherits its verification from the input documents' own evidence trails (01/02 executed `tsc -b`, `npx vitest run` — 128 files / 1,162 tests passing — and production builds in their sessions; 03–06 executed direct web fetches and searches). Judgments made here are labeled EXPERT OPINION or RECOMMENDATION.

**Input documents — all six located on disk, none missing.** 01, 02, 05 were found in the nested repo root `Solis-Ultimate-Productivity-tracker-main/Solis-Ultimate-Productivity-tracker-main/docs/v2-research/`; 03, 04, 06 in the workspace `docs/v2-research/`. This split is noted for traceability only.

| # | Document | Key contribution |
|---|---|---|
| 01 | V1 product audit | Verified capability map; where the core loop breaks; ranked V2 opportunities |
| 02 | V1 technical audit | Architecture strengths; 23-item debt register (6 must-fix) |
| 03 | Competitor research | Five category stacks; 10 table stakes; 5 white spaces; verified pricing |
| 04 | Adjacent products | 14 ranked transferable mechanisms; 8 anti-patterns |
| 05 | AI landscape 2026 | Build/avoid AI lists with evidence; cost envelope; design invariants |
| 06 | Learning science | 10 evidence-backed mechanisms; V1→V2 mechanism map |

**Labels used:** **VERIFIED FACT** (source-checked in an input document, with its citation) · **OBSERVED PATTERN** · **EXPERT OPINION** · **RECOMMENDATION**. Citations use input-doc number + section.

**Product thinking rules applied** (from the brief): no blind copying; no feature supermarket; protect core identity; depth over quantity; reduce manual work only where automation genuinely helps; AI only where it adds real value; deterministic over AI when deterministic wins; privacy first; long-term cost of every subsystem; mobile, not desktop-only; accessibility from the start; respect V1 architecture — no rewrites; fix foundations before layering; every major capability connects to a real user problem.

---

## 0. Executive verdict

1. **The V1 surface is real, deep, and tested.** VERIFIED FACT (01 §0/§3; 02 §0.3): 18 routes, 14 feature pages, 128 test files / 1,162 tests passing, clean typecheck, 7.2s build. The strongest loop — exam-anchored Plan → Focus → reflection auto-cascade → SM-2 recall → deterministic intelligence → weekly review seeding — is verified end-to-end in code: one user action (completing a focus reflection) updates seven downstream entities (`FocusContext.tsx:715-895`, cited in 01 §4).

2. **The gap is not breadth.** Solis already spans four of the five category stacks (03 §1). The real gaps are structural, not additive:
   - **Loops that don't close**: three coexisting scheduling vocabularies (01 §4 break #1); analytics is a report with no write-back (break #3); recall lives one hop from the daily surface (break #2); aborted stopwatch work is invisible (break #5).
   - **Continuity that doesn't exist**: ~37 files / ~40 `solis_*` localStorage keys keep intention, rituals, pins, note history, and the notification inbox device-local even in cloud mode (01 §1 debt 1; 02 §1.7/D13).
   - **Intake that never happens**: no material→recall ingestion pipeline (03 §5, table stake #2 missed outright); paste-only calendar import (01 §3.15); no true mobile surface/widgets (03 §5, table stake #4 missed).
   - **Foundations that will strain**: fetch-all reads, unscoped cache, no CI, simulated peer presence in production, six monolithic pages (02 §3.1 D1–D6).

3. **The V2 thesis** (RECOMMENDATION): *keep the deterministic brain; wire it into action.* Consolidate to one planning model; sync every invisible state; make every recommendation actionable in one tap; keep AI strictly a proposal layer (AI proposes, user disposes — 05 §4); and make the one big new capability surface **ingestion**, because material→cards→schedule is exactly where Solis's FSRS + planner wiring beats the AI content machines (03 §7.1; 05 §4 candidate C).

4. **What V2 will not build** is as decision-critical as what it will: autonomous replanning, proactive AI nudges, LLM memory layers, live voice tutors, OAuth/calendar agents, MCP tool loops, LLM-per-capture parsing (05 §5, each with a verified reason), silent autonomous rescheduling, network-dependent social features, platform rewrites, premium AI moats (04 §11.2).

---

# Part 1 — The Gap Map

Each entry carries a **V2 call** — **Build / Fix / Consolidate / Defer / Decline** — and names the evidence it rests on.

## 1.1 Missing (capabilities Solis lacks)

| ID | Gap | Evidence | V2 call |
|---|---|---|---|
| G1 | **Material→recall ingestion pipeline** — drop a syllabus/PDF/slides → structured topic tree + exam dates + cards, source-cited | 03 §5 (table stake #2, missed outright; head-to-head "Gap: no direct ingestion of lecture recordings/PDFs/slides into cards"); 05 §4 C (nothing deterministic can parse free-text syllabi; "kills hours of setup" — the real user problem is the most tedious setup step) | **Build (narrow first)**: PDF/text syllabus + documents → topics/dates/cards, schema-validated, every field user-confirmed. Lecture-audio transcription **Defer** (audio ingestion infrastructure absent — 04 §7.3 stretch item; 05 §4 audio cost/scope) |
| G2 | **True mobile surface** — installable PWA with widgets and a verified mobile runtime | 03 §5 (table stake #4 missed; "web-only is a churn filter at student prices"); 01 §5.2 (5-tab bar + responsive CSS exist, **runtime unverified**; rooms/exam modals dense on phones — OPINION) | **Build** — PWA polish + widgets; run the mobile runtime audit first (01 §7.6) |
| G3 | **Live calendar subscriptions / two-way sync** | 01 §3.15 (ICS export one-way; import is paste-only, no URL polling — "partially complete as an integration"); 03 head-to-head ("no two-way Google/Outlook sync, iCal only") | **Build (read-only ICS URLs first; Google OAuth later, narrowly scoped)** |
| G4 | **Cross-device continuity of invisible state** | 01 §1 debt 1 + §4 break #4 (37 files, ~40 keys: intention, ritual flags, pins, note history, inbox, gentle-start); 02 §1.7/D13 (notifications device-local, `webPushEnabled: false`) | **Fix** — move to user-scoped cloud storage; decide server push early (02 D13) |
| G5 | **Rotating/A-B class timetable & semester structure** | 03 head-to-head timetable row (MyStudyLife rotating schedules + Schedule Scan; Solis weekly-only). Nuance: an LMS/deck importer exists in V1 (01 §3.3) — it imports content, not the term grid, so 03's gap stands for the timetable layer | **Build-lite** — a term/timetable *projection* over the single planning model (Part 2); photo-based Schedule Scan **Decline** for V2 |
| G6 | **Due-recall in the daily surface** — the capability exists but is missing *from the day* | 01 §4 break #2 (due cards live on Study + dashboard alerts; no due-review block in the timeline; dashboard "Active Knowledge" resurfaces notes, not cards) | **Build (small, high-leverage)** — due-review block + drill CTA with counts (01 §7.3) |
| G7 | **Server push notifications** | 02 §1.7/D13 (no server push, no cross-device delivery) | **Decision required** — build real push or reposition V2 copy (02 D13) |
| G8 | **Recurrence schedule browsing UI** | 01 §3.2 (engine exists and is persisted; OPINION: no UI to browse the recurrence itself — shallow by product standards) | **Build-lite** |

## 1.2 Underdeveloped (exists, but shallow relative to the evidence)

| ID | Gap | Evidence | V2 call |
|---|---|---|---|
| U1 | **Analytics is a report, not a control surface** | 01 §4 break #3 (recommendations navigate away; nothing writes back — no acknowledge/schedule/snooze) | **Fix** — actionable recommendations with persisted dismissals, delivered through the triage queue (I5) |
| U2 | **No estimation calibration** | 06 §1 (VERIFIED: only 30% of students finish on predicted time, actuals exceed worst-case — Buehler 1994; reference-class forecasting cut overruns 38%→5%). V1 already logs plan estimates and session actuals (01 §4) — the ledger is one join away | **Build (deterministic)** — predicted-vs-actual per task/subject; inflate future estimates from the student's own history; auto-segment >90-min captures |
| U3 | **Goals are not obstacle-first** | 06 §4 (VERIFIED: WOOP/MCII g=0.336, academic g=0.255 — Wang 2021; the meta-analysis's own recommendations are reinforced reminders and pre-written fallback plans) | **Build** — 4-step Wish→Outcome→Obstacle→If-Then wizard; if-then reminders at trigger time; fallback branch in every generated plan |
| U4 | **Habit model vs. the evidence** | 06 §2 (VERIFIED: median 59–66 days, range 4–335, only ~23% reach automaticity — Singh 2024); V1 streaks are chain-based with amnesty (01 §3.7) but no weekly-consistency scoring; habits are tracked but never *scheduled* (04 §2.2) | **Consolidate + Build** — consistency-rate scoring + month-scale framing; habit-as-flexible-calendar-event with approval gates (04 §11.1 #2) |
| U5 | **SRS scheduling stops at flashcards** | 06 §7 (no note-based "retrieval tickets", no exam-anchored 10–20%-of-interval gap rule, no workload caps); V1 engine is FSRS-5 (02 §2) | **Build** — retrieval tickets on the FSRS backbone, exam-anchored intervals, daily review-minute caps |
| U6 | **AI confidence is invisible** | 01 §3.13 + 02 §1.9 (faithfulness scoring exists; below-threshold results warn in console only — "detect-and-warn, not detect-and-block") | **Fix** — surface source tier + faithfulness in the answer UI (01 §7.7) |
| U7 | **Rooms lack accountability micro-mechanics** | 04 §10.3 (no goal declaration, no closing check-in, no recurring scheduled sessions); 01 §3.5 (cheering is thin — OPINION) | **Build-lite** — declaration + closing check-in; measure rooms as an experiment (06 §14) |
| U8 | **Focus loop edges**: aborted work invisible; no adaptive breaks | 01 §4 break #5 (abort copy says "will not be recorded" — honest, but analytics is blind to real partial work); 04 §5.1/§2.2 (circadian data exists but never *acts* on break timing) | **Fix + Build** — log partial/aborted work explicitly; circadian-driven break insertion (A6) |
| U9 | **Quizzing lacks confidence calibration** | 06 §9 (VERIFIED: JOL overconfidence after re-reading; calibration discrepancy predicts bad strategy choice). No confidence-before-reveal step described anywhere in 01's quiz/flashcard surface | **Build (deterministic)** — confidence rating before reveal + per-subject calibration score |
| U10 | **Interleaving not offered or labelled** | 06 §8 (VERIFIED: interleaving wins at delay but learners' judgments don't track it — Németh 2025; boundary conditions apply) | **Defer/Experiment** — offer mixed sets only for similar content, carry the "feels worse, works better" label, measure at 1–2-week delay before claiming anything |
| U11 | **Weekly review is a report, not a cycle-closing proposal** | 01 §3.10 (seeds next week as static items); 06 §9/§14 map (prediction-vs-actual should be the spine) | **Consolidate** — review becomes an approve-diff proposal + calibration section (A17) |
| U12 | **Notes lack typed study records / saved views** | 04 §7.1/§7.3 (Obsidian Bases / Tana supertags pattern; feeds FSRS/mastery with better-typed inputs; Tana's student push validates demand) | **Build (medium)** — Lecture/Reading/ExamQuestion/Mistake objects + 2–3 saved views; rides the ingestion pipeline (G1) |

## 1.3 Outdated (worked for V1; behind the 2026 bar)

| ID | Gap | Evidence | V2 call |
|---|---|---|---|
| O1 | **FSRS-5 core** | 02 §2 (V1 = FSRS-5 engine, VERIFIED); 03 §4.5 + 06 §7 (FSRS-6, 2025, per-user decay parameter, outpredicts SM-2 on ~10k-user benchmark; Anki ships fsrs-rs 6.6.x — VERIFIED) | **Evaluate/upgrade** to FSRS-6 |
| O2 | **Device-local state model** in a multi-device cloud product | same as G4 | **Fix** (= G4) |
| O3 | **Paste-only ICS** vs. live subscriptions | 01 §3.15; 03 §5 item 5 | (= G3) |
| O4 | **AI interaction latency posture** | 05 §3.13 (interactive budget ~2s TTFT with streaming — OBSERVED PATTERN; sources conflict on exact figures). V1 streaming behavior was **not verified** in any input session | **Design requirement** — verify V1 first, then set streaming targets |
| O5 | **Stale internal docs, duplicated schema SQL** | 01 §6 (old test counts persist in docs); 02 D17 (two sources of schema truth) | Housekeeping |
| O6 | **Non-user-scoped cache keys + global invalidation** | 02 D5/D9 (`tasks.service.ts:15`, `study.service.ts:294`, `rooms.service.ts:15`; whole-cache invalidate on every mutation) | **Fix (foundations)** |

## 1.4 Inefficient workflows

| ID | Gap | Evidence | V2 call |
|---|---|---|---|
| I1 | **Three scheduling vocabularies** — derived dashboard blocks, persisted task blocks, study plan items | 01 §3.1/§4 break #1 (VERIFIED; "single largest IA debt" — 01 OPINION). Bridges exist in both directions but no single surface "owns" a commitment | **Consolidate** — one canonical schedule entity with per-source projections (01 §7.1). Highest-leverage fix in this document |
| I2 | **Routines need manual "Sync today"** on two different pages | 01 §4 (VERIFIED) | **Fix** — materialize automatically at first load of the day (01 §7.8) |
| I3 | **Manual session logging duplicates the auto-cascade** because reading/PDF surfaces are not focus-anchored | 01 §4 (VERIFIED) | **Fix** — make study surfaces focus-eligible or accept lightweight logging into the same pipeline |
| I4 | **Evening closure creates new tasks instead of linking backlog** — duplicate risk | 01 §4 (VERIFIED: tomorrow intentions become *new* tasks, `DashboardPage.tsx:728-744`) | **Fix** — link-or-create |
| I5 | **Alerts scatter across surfaces** — retention alerts, drift warnings, block alerts compete for attention | 04 §10.1 (Linear triage pattern — one "needs a decision" queue); 01 §3.14 (multiple alert sources exist) | **Build** — a single triage inbox; alerts become workflow, not nagging |
| I6 | **Aborted stopwatch work invisible** | 01 §4 break #5 (VERIFIED copy: "Elapsed progress … will not be recorded") | **Fix** — log partial work with honest framing; feeds calibration (U2) |
| I7 | **Recommendations demand manual follow-through** | 01 §4 break #3 | (= U1) |

## 1.5 Disconnected features

| ID | Gap | Evidence | V2 call |
|---|---|---|---|
| X1 | **Three reflection stores** (daily reflections, room reflections, weekly-review notes), no unified timeline | 01 §4 (VERIFIED) | **Consolidate** — one "my reflections" timeline (01 §7.5) |
| X2 | **Drift pad has no reader** — parked thoughts are written, never resurfaced | 01 §4 (VERIFIED: writes at `FocusContext.tsx:851-862`; no reader found) | **Fix** — surfacing as triage items (joins I5) |
| X3 | **Interruption data has no trend view** | 01 §4 (VERIFIED: per-session counters only) | **Build-lite** — join to cognitive-load analytics |
| X4 | **Scholar Report orphaned** from goals/exams | 01 §4 (VERIFIED: standalone artifact) | **Fix** — link from exam/goal surfaces |
| X5 | **AI telemetry with no consumer** | 01 §3.13 + 02 (recorded, no UI/sink) | **Defer or delete** — rule 10: carrying dead telemetry has cost; either a sink (D11) or removal |
| X6 | **Simulated ambient presence in the production service** | 02 §1.6/D1 (VERIFIED: `presence.service.ts:8-49` serves hardcoded fictional peers even in Supabase mode; violates the repo's own no-fake-integration rule, `master.md §1.2 rule 5`) | **Fix before any V2 social work** — back the widget with real room Presence or label/remove it |
| X7 | **Memory state never pushes on the calendar** — retention engine computes, planner never reflows for review load | 03 §6.1 ("the closed loop nobody closes" — OBSERVED PATTERN of absence across every profiled product) | **Build** — retention-aware replanning; the flagship differentiator (Diff2) |
| X8 | **Habits tracked but never scheduled** | 04 §2.2; 06 mechanism map | (= U4) |

## 1.6 Intelligent Opportunities (where automation or AI substantially helps)

Rule applied throughout: deterministic first; AI only where deterministic cannot do the job (rules 6–8; 05 §4).

### Deterministic automation (no AI involved)

| ID | Opportunity | Evidence |
|---|---|---|
| A1 | **Calibration ledger + per-item slippage forecasting** ("at current pace, Topic X lands 3 days short by Oct 14") | 06 §1 (Buehler 1994; reference-class 38%→5%); 04 §2.1 Motion "Do Date ≠ Due Date" + §11.1 #3/#5; extends V1's exam-feasibility engine (01 §3.8) to every plan item |
| A2 | **Deadline collision radar + weekly load budget** | 06 §10 (deadline bunching is an institutional pain; force explicit trade-offs, not silent overload) |
| A3 | **Auto-segmentation of >90-min captures** | 06 §1 (segmentation effect: small tasks get accurate estimates) |
| A4 | **Automatic routine materialization at day start** | 01 §7.8 |
| A5 | **Habit placement/re-placement in time windows, with approval** | 04 §2.2 (Reclaim AI Habits) |
| A6 | **Adaptive breaks from circadian synthesis** | 04 §5.1 (Rize pattern) + §11.1 #9; V1 circadian engine exists (01 §3.9) but only reports |
| A7 | **Confidence-calibrated quiz reveal + calibration scores** | 06 §9 |
| A8 | **Retrieval tickets for notes on the FSRS backbone; exam-anchored 10–20% intervals; workload caps** | 06 §7 |
| A9 | **Two-minute starter surfaced on avoided/slipping tasks** | 06 §3 (task aversiveness r≈.40 is the strongest tractable correlate) |
| A10 | **Related-content link suggestions** (one-tap accept; the only "auto-organization") | 04 §9.2/§11.1 #14 (Capacities pattern; deterministic matching suffices) |
| A11 | **Close-the-loop next-action note before a task switch** | 06 §6 (attention residue — Leroy 2009) |
| A12 | **Detachment gate: evening ritual hides the plan until morning; rest as first-class items** | 06 §12 (effort–recovery model; psychological detachment is the central recovery experience) |

### AI layer (proposes; user disposes — never a silent state write, 05 §4)

| ID | Opportunity | Evidence |
|---|---|---|
| A13 | **Syllabus/document parsing → structured topics + exam dates** (schema-validated, user confirms every field) | 05 §4 C (BUILD — nothing deterministic can parse free-text syllabi); feeds G1 |
| A14 | **AI-drafted study plans** validated by the deterministic feasibility math, user-confirmed | 05 §4 D (LLMs draft sequences well, plan invariants badly) |
| A15 | **Deepened grounded Ask Solis**: forced citations, surfaced faithfulness, grounding extended to plans/sessions/review history | 05 §4 A; 03 §6.5; U6 |
| A16 | **Socratic Tutor Mode** on Ask Solis — hint ladders, guiding questions, knowledge checks, never direct coursework answers, grounded in the student's own notes | 04 §8.1/§11.1 #1; 05 §3.1 (Harvard PS2 Pal RCT: ~2× learning gains **only** for pedagogically constrained tutors — VERIFIED) |
| A17 | **Weekly Review Agent**: drafts next-week plan + narrative as an approval diff; deterministic engines compute all evidence | 04 §8.2/§11.1 #10; U11 |
| A18 | **AI flashcard/quiz generation retained** (user-triggered, preview-and-edit) | 05 §4 B |
| A19 | **Voice dictation into capture fields** (Web Speech on-device first) | 05 §4 G (optional experiment) |

**Explicit declines in this category** (each with a verified reason, 05 §5): autonomous agentic replanning (PlanBench: LLMs can't plan; Motion's opacity complaints); proactive AI-generated nudges (an interrupting AI defeats a focus app); LLM memory layers (Postgres + RAG ≈ 8× lower TCO; poisoning risk); live voice tutor/companion (~$2–4/mo audio; off-mission); autonomous calendar/OAuth agents and MCP loops (control failure mode, OAuth risk); LLM-per-capture parsing (deterministic parsing is instant, offline, free); LLM replacing FSRS/mastery/feasibility math (validated, explainable, free).

## 1.7 Differentiation Opportunities

| ID | Opportunity | Evidence |
|---|---|---|
| Diff1 | **Explainable deterministic intelligence** — Signal/Evidence/Action receipts | 03 head-to-head ("Ahead — explainability is nearly unique in the consumer space", VERIFIED about Solis from code + observed absence across competitors) |
| Diff2 | **Retention-aware replanning** — memory state pushing back on the calendar | 03 §6.1 (nobody closes this loop); A1 + X7 are the building blocks |
| Diff3 | **BYOK agentic planning under a privacy contract** — plan/replan/ingest without shipping notes to a vendor cloud | 03 §6.2 (incumbents ship credit meters — Motion 7,500 credits + $0.25/100 overtime, VERIFIED); 05 §3.12/§3.14 (Flash-class ≈ $1.20–1.50/heavy-user/mo, $0 operator under BYOK) |
| Diff4 | **Committed small-group study pacts** — productized nowhere; stakes behavioral, not monetary | 03 §6.3; 06 §13 (VERIFIED: deposit uptake is the weak link — Giné et al.; body-doubling evidence thin — §14) → ship as in-app experiment with behavioral stakes |
| Diff5 | **Term-scale feasibility intelligence** — "you cannot pass this unit at current pace," computed early, deterministically | 03 §6.4 (products optimize day or week; nobody models the 15-week term — where a deterministic engine beats an LLM) |
| Diff6 | **Tutor grounded in the student's own system** — plan/notes/history with citations, then updates the plan | 03 §6.5; A15+A16 |
| Diff7 | **Honest freemium posture** — learning loop free forever; meter only generative AI; BYOK says so structurally | 03 §5.9 + §4.3 (Quizlet paywall backlash / Knowt's free-mode wedge — OBSERVED PATTERN) |
| Diff8 | **The wiring itself** — cross-domain auto-cascade verified end-to-end | 03 head-to-head ("clear edge"); 04 §3.3 (TickTick validates the all-in-one category; Solis's engine exceeds it — EXPERT OPINION) |

## 1.8 Strategic Risks

| ID | Risk | Evidence | Mitigation |
|---|---|---|---|
| R1 | **Bloat / feature supermarket** — the opportunity list above exceeds any sane quarter | This document's Part 1; rules 3/5 | Part 4 sequence; every addition must serve a core-loop stage or be declined |
| R2 | **Consolidation migration risk** — collapsing three scheduling models touches existing user data | 01 §4 break #1; 04 §7.2 (Logseq DB-rewrite warning) | Incremental schema evolution inside Supabase/IDataService; no rewrites (rule 13) |
| R3 | **Read-path ceiling** — fetch-all + JS-filter + global cache invalidation grows linearly with account age | 02 §4 (OBSERVED/expert); D4/D9 | Fix before layering (rule 14) |
| R4 | **Integrity risk** — simulated presence in production social plumbing | 02 D1 | Fix (X6) before any social V2 work |
| R5 | **Regression risk** — zero component tests (0 `.test.tsx` vs 149 `.tsx`) and no CI during a heavy build phase | 02 D10/D2 | CI first ("the single cheapest high-value fix" — 02 §5); seed component tests as pages are touched |
| R6 | **Schema-drift masking** — PGRST204 retry silently strips new columns from task writes | 02 D3 (`tasks.service.ts:117-125, 172-186`) | Fail loudly; deploy-time schema check |
| R7 | **Trust risk from silent automation** | 05 §3.3 (Motion's most-cited complaint is opaque autonomous rescheduling — OBSERVED PATTERN); 04 §11.2 | Approval gates on every proposed change, AI or deterministic |
| R8 | **Agent-washing / cost-scope risk** | 05 §3.2 (Gartner: >40% of agentic projects canceled — VERIFIED); 05 §3.12 (agentic loops multiply tokens) | Keep AI out of loops; workflow-over-agent (Anthropic, fetched in 05) |
| R9 | **Mobile parity risk** | 01 §5.2 (dense modals; runtime unverified); 03 §5.4 | G2 with a runtime audit first |
| R10 | **Quality/a11y risk** — uneven aria coverage, nothing runtime-audited | 01 §5.3 (aria-label in only 28 of the feature files; axe/Lighthouse **not run**); 01 §0 | Run Lighthouse + axe + real-device pass before V2 UI work |
| R11 | **Monetization positioning risk** — BYOK friction vs. credit meters; paywalling study modes is the proven failure | 03 §4.3/§7.6 | State the posture explicitly; never strand a free core mode |
| R12 | **Overclaiming risk** — procrastination-treatment evidence small (g=0.34; CBT g=0.55 after outlier removal; no long-term data), body doubling thin, deposits low-uptake | 06 §3/§13/§14 (VERIFIED) | Ship these as labeled in-app experiments with honest copy; never claim treatment |
| R13 | **Monolithic pages as merge hazards** | 02 D6 (six 1,000–1,600-line components; `mockService.ts` 2,987) | Extract following the existing `useStudyPage` pattern as each is touched |

---

# Part 2 — The System View

## 2.1 The spine

The brief's chain — Goals → Planning Engine → Schedule → Study Sessions → Performance → Analytics → Insights → Schedule Adaptation → Future Planning — is the right spine. V2's job is to make it *one system with one state model and closed loops*, instead of V1's three scheduling vocabularies and non-writing analytics (Part 1, I1/U1).

```
              ┌────────────────────── TIMETABLE (term/week grid projection) ──────────────────────┐
              │                                                                                    │
 GOALS ──────►│ PLANNING ENGINE ──────► SCHEDULE (one canonical entity) ◄───── INPUT ADAPTERS     │
 WOOP wizard  │ deterministic       projections:  today timeline · hourly/weekly planner ·   │
 feasibility  │ consumes: deadlines, study agenda · calendar overlays                        │
 (calibration-│ habit windows, review workload, capacity (circadian + gentle start),          │
 ledger-fed)  │ rest, review-due load · emits PROPOSALS as approve-diffs                      │
              └──────────┬─────────────────────────────▲───────────────────────────────┘
                         ▼                             │ adaptation
                   STUDY SESSIONS ──auto-cascade──► PERFORMANCE ──► ANALYTICS (deterministic brain)
                   Focus Room, context-  session·topic· task minutes, plan adherence,
                   carried; close-the-   habit·task· calibration (planning + metacognitive),
                   loop note             block·note   subject health, retention, mood correlation
                         │                             │
                         ▼                             ▼
                   [TRACK: everything auto-captured] INSIGHTS ──► TRIAGE QUEUE (one decision inbox)
                                                                    │  acknowledge / schedule /
                                                                    ▼  dismiss (write-back)
                                                   SCHEDULE ADAPTATION (slippage, collisions,
                                                   review reflow, one-tap recovery) ──► back to engine
                                                                    ▲
                                       FUTURE PLANNING: Weekly Review closes the cycle;
                                       next week seeded as a PROPOSAL; term view (Diff5)
```

**Core decision (RECOMMENDATION, 01 §7.1): one canonical schedule entity.** Tasks, study plan items, time blocks, habit windows, review blocks, and rest all become typed entries in one model (fixed / flexible / defended — 04 §2.3 Clockwise lesson); the Today timeline, hourly planner, study agenda, and calendar overlays become *projections*. This deletes the "which surface owns my time" question (I1), makes retention-aware replanning possible (X7 — you cannot reflow what isn't one model), and gives habit scheduling (A5) and review blocks (G6) a home.

## 2.2 Where each cross-cutting concern fits

| Concern | Role in the ecosystem | Binding evidence |
|---|---|---|
| **AI** | A *proposal layer* over the spine: drafts plans (A14), parses syllabi (A13), answers grounded questions (A15), tutors Socratically (A16), narrates computed numbers (05 §4 E). Never writes state silently; never computes feasibility/retention/mastery; fully absent ⇒ app still works (05 §4 invariants; 05 §5 avoid-list) | 05 §3.11/§4; 04 §8.2 |
| **Reminders & notifications** | Deterministic timed triggers bound to the canonical schedule: block start, hour review, WOOP if-then at trigger time, quiet hours. Cross-device delivery only if the push decision (G7) is taken | 06 §4 (unreinforced implementation intentions fail — reminders must fire); 02 D13 |
| **Collaboration (rooms, pacts)** | *Witnessed commitment* attached to the spine: goal declaration + closing check-in feed the personal analytics engine; every social feature must deliver value at zero participants; treated as a measured experiment, not a bet | 04 §10.3; 04 §2.3 (Clockwise sunset); 06 §14 |
| **Analytics** | The shared brain. Its only output surfaces are the triage queue and timeline markers — and its insight objects support acknowledge/schedule/dismiss, which is the write-back that closes the loop | U1/I5; 01 §4 break #3 |
| **Integrations** | Symmetric adapters: inputs (ingestion pipeline G1, ICS URL subscriptions G3, LMS import) land in the canonical model; outputs (ICS, Anki, JSON/CSV export) leave it. No proprietary lock-in | 01 §3.15; 03 §5 items 2/5 |
| **Timetable** | A *projection layer*, not a fourth scheduler: the term/week grid that seeds recurring structure into the engine (G5) | 03 head-to-head timetable row |
| **State continuity** | Everything user-authored or user-visible syncs to the account; nothing lives only in `localStorage` (G4) | 01 §1 debt 1; 02 D13 |

**Design invariants carried from V1 (protect these):** offline-first with honest failure states; AI-absent ⇒ fully functional (05 §4 failure posture); approval gates on every proposal; explainability receipts on every recommendation; BYOK privacy posture; undo on destructive actions (01 §4 "where it is strong").

---

# Part 3 — The V2 Core Loop

Seven stages. The loop is the product; everything in Part 1 exists to make one of these stages work.

## 3.1 Stage by stage

### 1) TRIGGER — what brings the user in
**What pulls the student back:** the morning ritual CTA; a due-review alert with counts; the block-start/hour-review reminder (existing 30s monitor, `AppLayout.tsx:53-100` — 01 §3.14); the exam-cushion drift pill; a triage-queue badge; welcome-back/gentle start after absence; a WOOP if-then reminder firing at its trigger time.
**Design constraint:** every trigger is deterministic and explainable. **No AI-generated nudges** — an interrupting AI defeats a focus app (05 §5.2).

### 2) PLAN — what Solis decides for them (and what stays theirs)
The morning ritual opens on a **pre-composed day**: routines materialized automatically (A4); capacity drawn from measured history inflated by the calibration ledger (U2/A1); habit windows placed in the schedule (A5); a due-review block inserted (G6); rest scheduled as first-class items (06 §12); collision warnings raised (A2). An optional **"plan my week" AI draft** (A14) is validated by the deterministic feasibility math before it is even shown. The user approves or edits in one pass. Every generated plan carries a **fallback branch** ("if I miss Monday, Tuesday 18:00 replaces it" — U3). Solis decides the *draft*; the user disposes.

### 3) ACT — what the user does
Enters the Focus Room with full context carried (taskId/planId/subjectId — VERIFIED wiring, 01 §4). Single-task session default with a visible "this session is about X" header (06 §6). Before switching away from an unfinished item, a one-line **next-action note** closes the loop (A11). Optional: focus stakes (04 §11.1 #7) and a room session with goal declaration for witnessed commitment (U7). Tab defense, drift pad, soundscapes as in V1.

### 4) TRACK — what is captured automatically
The **auto-cascade** remains the backbone (VERIFIED, `FocusContext.tsx:715-895`): completing one reflection writes study session, topic promotion, habit, task, time block, and note. V2 adds: **confidence ratings** captured at quiz/review time (A7); interruption/drift counts (already exist); and — the fix — **aborted/partial stopwatch work logged honestly** instead of vanishing (I6). Nothing requires manual re-entry that the cascade can do.

### 5) UNDERSTAND — what Solis tells them
The deterministic engine computes mastery, retention, subject health, **calibration scores (planning + metacognitive)**, mood×performance correlations (04 §11.1 #12), and slippage forecasts (A1). Insights arrive in **one triage queue** (I5), each with its evidence receipt. The AI weekly narrative narrates only computed numbers (05 §4 E). **Ask Solis** answers from the student's own material with citations and a **visible faithfulness/source tier** (A15/U6); **Tutor Mode** (A16) refuses to hand over coursework answers and questions instead.

### 6) ADAPT — what adapts from real behavior
Per-item slippage warnings weeks ahead (A1); deadline collision radar with forced trade-offs (A2); **review-workload reflow** when a deck balloons — memory state pushing back on the calendar (X7/Diff2); replans arrive as **approve-diffs** (R7); one-tap recovery is the *promoted* action after a miss, framed without guilt (06 §11); workload caps push review overflow forward (A8). Adaptation is continuous but never silent.

### 7) IMPROVE — how the system improves over time
Estimates converge on the student's real pace (reference-class forecasting on their own history — 06 §1); FSRS personalizes decay per user (O1/FSRS-6); the planner learns measured capacity rather than assumed capacity; break cadence adapts from circadian data (A6); interleaved-vs-blocked outcomes are compared at 1–2-week delay before any claim (U10); rooms-vs-solo completion is measured (06 §14). The **weekly review closes the cycle**: prediction-vs-actual on the spine, next week seeded as a proposal (U11/A17). Each week, the product is measurably smarter about *this specific student* — without a single silent state write.

## 3.2 What is deliberately NOT in the loop

- AI that interrupts (proactive nudges) — 05 §5.2.
- Silent rescheduling of any kind — 05 §5.1; 04 §11.2.
- Gamified box-counting (Karma-style task-churn rewards) — 04 §3.1; momentum keys off study minutes and retention, not task counts.
- Public *identity*-goal celebration — share behaviors, never identities (Gollwitzer 2009, 06 §4).
- Paywalled study modes — the learning loop stays free; meter only generative AI (03 §4.3/§7.6).
- Monetary deposit stakes — behavioral stakes only, as an experiment (06 §13).

---

# Part 4 — Sequenced implications (build order)

RECOMMENDATION. Phases are severable; the loop is coherent after Phase 1; nothing in Phase 4 is required for the core promise.

| Phase | Theme | Items (IDs from Part 1) | Why here |
|---|---|---|---|
| **0** | Foundations before layering (rule 14) | CI (R5); presence fix (R4/X6); schema-drift fail-loud (R6); read-path + cache scoping (R3/O6); page extraction (R13); a11y + mobile runtime audit (R10) | Every later phase multiplies these codepaths; CI is "the single cheapest high-value fix" (02 §5) |
| **1** | Loop closure — the identity | One planning model (I1); sync invisible state (G4); recall in the daily timeline (G6); analytics write-back + triage queue (U1/I5); unified reflections + drift-pad reader (X1/X2); routine materialization (I2/I4); partial-work capture (I6) | Fixes every VERIFIED loop break in 01 §4; consolidations before additions (rule 5) |
| **2** | Depth the evidence demands | Calibration ledger + slippage (A1); WOOP goals (U3); habit windows + consistency scoring (U4); retrieval tickets + caps (A8/U5); confidence calibration (A7); close-the-loop + detachment gate (A11/A12); rooms micro-mechanics (U7) | Deterministic, evidence-backed, and all ride the Phase-1 model |
| **3** | Intake & reach | Ingestion pipeline, narrow (G1/A13); ICS URL subscriptions (G3); PWA/mobile + widgets (G2); FSRS-6 evaluation (O1); typed study records (U12); push decision (G7) | The two missed table stakes (03 §5) plus the expectation-setter; sequencing after the loop means ingested material enters a *working* schedule |
| **4** | AI layer & differentiation | Plan drafts validated (A14); Tutor Mode (A16); weekly review agent (A17); retention-aware replanning (X7/Diff2); term feasibility (Diff5); pacts productized as experiments (Diff4); surfaced faithfulness (U6) | Differentiators that compound everything before them; all respect the AI invariants (05 §4) |

---

## Closing note

The six inputs agree on one thing worth stating plainly: Solis V1's problem is not that it built too little — it is that the thing it built does not yet close its own loops, does not follow the student across devices, and does not accept the material students actually have. Every recommendation above serves those three sentences. Everything that does not was declined, with reasons.

*Prepared as the synthesis input to the Solis V2 planning phase. All VERIFIED FACT citations resolve to the six input documents and, through them, to the repository state and web sources they inspected on 2026-09-27.*
