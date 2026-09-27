# Reader Critique — 08-product-strategy.md & 09-architecture-roadmap.md

**Date:** 2026-09-27
**Method:** Cold read of `08-product-strategy.md` (960 lines) and `09-architecture-roadmap.md` (577 lines) as a skeptical first-time executive, with `07-gap-analysis.md` read for context only. **No repository checks, builds, or external fact-checking were performed** — per the brief, the documents are judged as written. All line references below are to the two target documents unless marked "07".

---

## Top findings (cross-cutting, in order of severity)

1. **The plan has no time, team, or money dimension.** 09 L313: "phases are ordered, not dated." No headcount, no budget, no revenue model anywhere in either document — a founder cannot judge feasibility, and an investor cannot judge the ask.
2. **Success is unfalsifiable.** 09 Part 7 (L535): "No numeric targets are invented below… set targets after one baseline quarter of Phase-1 telemetry." And 08 L949: "High Value depth is **substantially shipped**" — undefined. As written, V2 can never be judged to have succeeded or failed by its own document.
3. **The epistemic label "VERIFIED FACT" is inflated.** Both documents stamp "VERIFIED FACT" on claims they did not verify (08 L6, 09 L8 admit this explicitly). The label asserts verification the text cannot stand behind.
4. **The vision oversells the roadmap.** The thesis sentence is "memory state pushes back on the calendar" (08 L19), yet the feature that delivers it (C30) is scheduled last (Phase 4), gated on the riskiest migration (C3, XL) — it may never ship, while the vision asserts it as what V2 *is*.
5. **The docs' own core invariant is violated by their own Phase-1 features.** 08 L79: "No silent state writes ever — AI or deterministic." But C4's review block is "materialized at day start" (08 L182) and C15's buffers are "insert[ed]" by the planner (08 L415) with no approval gate described.

---

## Question 1 — What is UNCLEAR, contradictory, or hand-wavy

*(ordered by importance)*

**1.1 The Core tier definition contradicts the build schedule.** 08 L878: "V2 Core — defines the release… **Ship in Phase 0–1** (+ the mobile baseline)." But C21 (mobile) is "V2 Core for audit + PWA baseline (**Phase 3** per 07 Part 4, but criticality is Core — rule 11)" (08 L555), and 09 Phase 1's "Explicitly NOT included" list names mobile (L364). So a "Core" item that "defines the release" ships after 12 High-Value Phase-2 items. The §3.4 borderline-call paragraph ("its build-order position reflects dependency reality — not criticality," 08 L930) names the tension but never resolves what "Core" operationally means: release gate or ship window? The two definitions say different things.

**1.2 Document 08 is internally inconsistent on C23's phase — and on C11's dependencies — with errors 09 only half-resolves.** 08 §3.5 puts C23 in Phase 2 (L943), while C23's own priority row says "V2 High Value — **Phase 3**" (L597). 09 flags and resolves this (L366), but in doing so it also reveals 08 C11's dependency row — "C22 (typed records feed better tickets); C25 (AI question generation is Optional)" (08 L338) — contains **two** wrong IDs: C22 is the timetable projection, and C25 is the *Server Push Decision*, not AI question generation. 09's resolution note (L366) corrects only the C22→C23 slip and silently drops the C25 mis-citation, despite L8 claiming both inconsistencies were "flagged and resolved explicitly." A skeptical reader stops trusting cross-references after the third one is wrong — see also 1.3.

**1.3 C8's differentiation row cites the wrong flagship.** 08 L273: "building block of the **Diff2 flagship (C29)** and Diff5 (**C30**)." Everywhere else, the Diff2 flagship is C30 (L739: "Very High — the flagship"; L918) and Diff5 is C31 (L760). C29 is the Weekly Review Agent. The error is unflagged in either document, and 09 repeats the correct mapping (L493: "building block of flagship C30/C31") without noting the discrepancy — the two documents quietly disagree.

**1.4 "No silent state writes ever — AI or deterministic" (08 L79) collides with the docs' own mechanics.** C4's due-review block "materialized at day start from FSRS due counts" (L182) and C7(a)'s routines "materialize automatically at first day load" (L245) are deterministic writes with no approval gate described (C7 keeps a "manual override," which is not the same as approval-before-write). Worst, C15 contradicts *itself*: "How it works: The planner **inserts** `buffer` blocks" (L415) vs. "Why it fits Solis: …via **proposals, never silent edits**" (L419). The central trust invariant is asserted as absolute and then applied loosely exactly where it is hardest.

**1.5 The canonical model's hardest questions are hand-waved.** C3's fix for "no single surface 'owns' a commitment" (08 L156) never states who owns edits under the new model: when the hourly planner is "a projection," does editing there write to the canonical entity? What is the transition mechanism — dual-write, cutover, read-old/write-new? "Projections render the four existing surfaces unchanged at first" (L159) describes rendering only; the write path during migration — the actual risk — is never specified. Likewise C2's "classify (user content / device preference / ephemeral)" (L138) never gives the classification of the ~40 keys, though that classification *is* the scope of the migration.

**1.6 Undefined and unexplained terms.** A cold executive reader hits, with no glossary: **BYOK** (the trust pillar's central mechanism, never expanded), **WAL** (write-ahead log, 08 L138), **RLS** (row-level security, 08 L148; 09 L30), **JOLs** (08 L350), **TTFT** (08 L661), **"Flash-class"** cost envelope (L82 — unintelligible without knowing Gemini's model-tier naming), and "quarter-scale effort" (09 L313). FSRS/SM-2 are used from L32 onward but only half-explained at C24. "Every serious competitor ships mobile" (L546) — "serious" is undefined and load-bearing.

**1.7 Hand-wavy quantification of the cost story.** 08 L82: "$1.20–1.50/heavy-user/mo, $0 operator under BYOK (05 §3.12 — computed from fetched Gemini pricing)" — a single-vendor price snapshot, second-hand, with no sensitivity analysis, while "free learning loop forever" (L99) is a permanent commitment with no sustainability model behind it (see 2.1).

---

## Question 2 — What is MISSING

*(ordered by importance)*

**2.1 Business model.** Neither document states how Solis V2 makes money. Pricing, paid tier, metering mechanics, conversion expectations, and unit economics are all absent — only fragments exist (Flow Club's $40/mo at L46, "meter only generative AI" at L82, Quizlet paywall lessons). A founder's first question — "what is the business?" — has no answer. Related: nothing on distribution, launch, or growth.

**2.2 Timeline, team, and budget.** 09 L313 concedes "phases are ordered, not dated" and speculates about "a single-developer-scale team" without ever saying who is building. An XL migration plus an L migration plus six features in one phase (Phase 1), with no calendar, is not a plan an executive can staff or fund.

**2.3 Any evidence from actual users.** The persona (08 L46) is asserted, not derived. Across ~1,500 lines, not one data point about V1's existing users — no counts, retention, churn, session data, or interviews — is cited. All evidence is competitor research and learning science. Does anyone want a triage queue or a WOOP wizard? The documents never ask.

**2.4 Multi-device conflict resolution.** C2 syncs ~40 state classes across devices, but neither document says how concurrent edits or offline WAL replay conflicts resolve (last-write-wins? per-key merge?). This is the first question any engineer asks about sync, and it is unaddressed.

**2.5 Migration rollback and existing-user safety.** C2/C3 are called "the biggest migrations V2 will ever run" (09 L121) yet there is no rollback story, no backup/restore plan, and no statement of what happens to a user whose migration half-completes — beyond "honest migration messaging (D16)" (09 L357).

**2.6 The iOS push hole — and its sequencing consequence for WOOP.** 09 §3.7 says missing server push "guts WOOP if-then reminders" (L189), and C25's own risk row admits "browser push limitations on iOS" (08 L638). Yet C9 (WOOP, the flagship goal mechanism) ships in **Phase 2** while push ships in **Phase 3** (08 L944) — meaning C9's core mechanism is degraded for its entire first release window, and may never fully work on iPhones. No document states this interim compromise or what the actual iOS capability will be ("honest capability copy" is not an answer).

**2.7 The ingestion free-tier boundary.** C19 is "Core" AI (08 L510) with a "BYOK/edge path" (09 L424). What happens for a student with no API key — is the flagship surface unavailable, metered, or operator-subsidized? The docs' "$0 operator under BYOK" claim (08 L82) and the "existing edge-function path" fallback (08 L511) point in opposite directions and are never reconciled.

**2.8 Experiment designs.** 08 L881 requires "success metrics defined *before* launch" for the three experiments (pacts C32, voice C34, interleaving C35) — but no thresholds, sample-size logic, or stopping rules are given anywhere. The promise is made; the design is missing.

**2.9 What gets cut.** The IA tree (09 §3.11) only adds. A V2 that adds a triage inbox, term view, timetable grid, and new AI modes presumably deprecates or reshelves something — the docs never say what leaves, which is how "feature supermarket" actually happens despite rule 3.

---

## Question 3 — What is OVERREACHING

*(ordered by importance)*

**3.1 "VERIFIED FACT" as a stamp on unverified claims.** Both documents assert "No code checks, builds, or web fetches were executed in this session" (09 L8; 08 L6) and then label load-bearing claims "VERIFIED FACT" anyway — e.g., 09 L17 declares the entire architecture inventory "all **VERIFIED FACT** (02 §1–§2)" for code the author never opened, and third-hand competitor facts arrive as "VERIFIED via 08" (09 L280). The honest description is "reported as verified by input X." The label as used transfers certainty across a citation chain the reader cannot audit — and the documents' entire decision-grade posture rests on that transfer.

**3.2 Absence claims as a moat.** The differentiation case leans on "nobody/nowhere" statements derived from a competitor set the reader never sees: "No profiled competitor ships anything like it end-to-end" (08 L32); "which no competitor does" (L187); "pacts + witnessed commitment **productized nowhere**" (L483, L774); "the category's loudest trend and its **worst documented trust failure**" (L24). Absence across a finite, unseen sample is the weakest possible evidence for "moat," stated at maximum confidence. "Every serious competitor ships mobile" (L546) compounds it with an undefined qualifier.

**3.3 The vision commits to what the roadmap schedules last.** 08 L19: memory state "pushes back on the calendar" is sentence one of the three-sentence vision, and C30 is "the flagship" (L739). But C30 is Phase 4, gated on C3 ("mandatory," XL, L740) — the single riskiest item by the docs' own account. If C3 slips, the thesis sentence of the product is unshipped while everything else lands. The vision should have been tempered to the schedule, or the schedule to the vision.

**3.4 "Calm over engagement" is honored per-feature and violated in aggregate.** Principle 7 (L84): "The plan is presented as 'today is handled,' never as an exhaustive backlog." Yet the plan adds, to the daily surface alone: a due-review block, a triage badge and inbox, rest and buffer block types, a detachment state, partial-work capture prompts, a confidence tap per card (C12), a next-action note on every early exit (C13), an obstacle-naming prompt on slipping tasks (C16), goal declarations and check-ins per room session (C18), a WOOP wizard per goal (C9), and a pact board weekly (C32) — 35 build candidates total against a philosophy of "no feature supermarket" (rule 3). No document confronts the aggregate interaction tax; each item's "Risks" row optimizes locally ("one extra tap," "optional," "one diff, one pass") while the product's stated positioning is anti-attention-economy.

**3.5 "Numbers-in-prompt… can't be factually wrong about the user" (08 L713).** This is the clearest untempered AI enthusiasm in the documents. Feeding an LLM correct numbers prevents wrong *digits*, not wrong *statements*: misread trends, invented causal attributions ("your retention fell because…"), and confident overgeneralization from noisy data all remain. Principle 1 ("Engines compute; AI drafts language," L78) should have produced "the AI may misinterpret the numbers it narrates" — instead the doc claims factual safety by prompt construction.

**3.6 The Socratic Tutor moat rests on one 194-student RCT.** C27's evidence is "the only strong independent evidence (Harvard PS2 Pal RCT, 194 students, ~2× learning gains)" (08 L669), yet differentiation is "Very High" and the feature is called "the moat" (L676). An n=194 RCT in one course does not establish that a system-prompt constraint on a BYOK model reproduces the effect in Solis — and per principle 9 ("honest experiments, labeled," L86), a mechanism resting on thin transfer should ship as a measured experiment. Instead it is a Phase-4 differentiator with usage metrics but no learning-outcome measurement anywhere in 09 Part 7.

**3.7 Reference-class forecasting transplanted to individuals.** C8 anchors on "reference-class forecasting cut overruns 38%→5%" (08 L266) — a project/institution-level result — and concludes "The app gets **measurably smarter** about *this student's* pace every week" (L269) before any measurement exists (09 Part 7 has no targets). A per-student overrun ratio with "sample-size guardrails" (L279) is plausible; "measurably smarter" is a claim the plan cannot yet evidence.

**3.8 Design changes stated as outcomes.** C10: weekly-consistency scoring means "streaks stop being attrition machines" (L311) — no evidence that consistency framing improves behavior or retention is offered, only that chains conflict with Singh 2024's timeline data. C31: "the most valuable sentence a study app can say — 'you will miss this'" (L756) is pure assertion; the accuracy of a deterministic term-scale forecast is assumed ("deterministic engine beats an LLM," L759 — beating an LLM is not being right), and a false early warning would spend the trust the product is built on.

**3.9 Self-contradicting framing.** 08 L14: "Its problem is **not missing features**" — followed by a plan whose Phase 3 flagship exists because a table stake was "missed outright" (L498) and whose Core tier includes a missing mobile surface. The structural/additive distinction is real, but the slogan is falsified by the document's own budget.

**3.10 Smaller overreaches.**
- "AI-absent ⇒ fully functional… an architectural invariant **tested in CI**, not a hope" (08 L81) — CI does not exist yet (that is Phase 0's whole point, G1), and no CI design for the invariant is described. Claiming CI coverage for an unbuilt system.
- "willingness to pay for co-presence at student prices is **proven**" from Flow Club's $40/mo (50% student discount = $20/mo) and a self-selected member survey (08 L46). Paying for a hosted body-doubling service proves neither willingness to pay for Solis's free rooms nor anything about Solis's market.
- "reflow *dismissal rate* doubles as a trust metric" (09 L550) — high dismissal could equally mean bad thresholds; the metric is invented into meaning.
- 09 L568: "nothing in V2 need be undone" for the V3 OS pivot — asserted, not argued; native-app and two-way-sync pivots (acknowledged as conditional at L562, L568) could easily force rework of widget, push, and provenance assumptions.

---

## Summary judgment

The documents are unusually disciplined about *declines* — the 14-item do-not-build list is the strongest material in either file, and most AI overreach is genuinely resisted. The failures are the mirror image: the *positive* claims (moats, "nobody does this," "measurably smarter," "can't be factually wrong") run consistently ahead of the evidence on the page; the plan has no time, money, team, or success thresholds; and the documents' own invariants (no silent writes, no feature supermarket, calm over engagement, Core = Phase 0–1) are each contradicted somewhere in their own feature tables. Cross-reference errors (C8→C29, C11's C22/C25 row, C23's phase) are small individually but, coming from documents whose entire authority is citation precision, they undercut the trust posture the strategy is selling.

*Prepared as an independent cold-read critique for the Solis V2 planning phase. No code checks, builds, or external fact-finding were executed; every finding above is grounded in the text of 08, 09, and (contextually) 07.*
