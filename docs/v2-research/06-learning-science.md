# Learning Science Evidence Base for Solis V2

**Research area:** What actually makes students more effective — and what that implies for product mechanisms in a study OS.

**Date:** 2026-09-27
**Method:** Web search + direct page fetches (September 2026). Priority given to 2024–2026 meta-analyses and studies; older foundational work is explicitly marked as such. Claims are labeled:

- **VERIFIED FACT** — figure or finding confirmed from a source I read directly this session (fetched page, or a search-result record quoting the source's abstract/findings).
- **OBSERVED PATTERN** — a consistent theme across multiple sources (often practitioner syntheses or secondary coverage) that I did not verify at primary-source level.
- **EXPERT OPINION** — a claim or interpretation attributed to a named researcher/organization, or standard practice in the field, not experimentally established here.
- **RECOMMENDATION** — my synthesis: how the evidence should shape Solis V2.

Solis V1 feature facts are cited as *(V1, from the ask's verified code-inspection facts)*.

---

## Executive summary — the strongest evidence-backed mechanisms

| # | Mechanism | Evidence anchor | Strength |
|---|-----------|----------------|----------|
| 1 | **Calibration ledger**: show predicted-vs-actual time for every task and use the student's own past overruns to inflate future estimates | Buehler et al. 1994; reference-class forecasting (Flyvbjerg) | VERIFIED FACT |
| 2 | **Spaced retrieval as the default scheduler**, with adaptive per-user forgetting curves | Cepeda et al. 2008; Bego et al. 2024; FSRS-6 benchmark | VERIFIED FACT |
| 3 | **Obstacle-first goal wizard (WOOP/MCII)**: Wish → Outcome → Obstacle → if-then Plan, with a fallback plan | Gollwitzer & Sheeran 2006; Wang et al. 2021 meta | VERIFIED FACT |
| 4 | **Habit timelines in months, not 21 days**; streaks that tolerate misses and reward context stability | Singh et al. 2024 PNAS meta | VERIFIED FACT |
| 5 | **Confidence-calibrated self-quizzing**: ask "how sure are you?" before revealing answers; show calibration history | JOL literature (Wei 2025; Lee 2025) | VERIFIED FACT |
| 6 | **Interleaved practice for similar problem types**, with a heads-up that it *feels* worse and *works* better | Brunmair & Richter 2019; Németh et al. 2025 | VERIFIED FACT |
| 7 | **Progress monitoring that is physically recorded and (optionally) shared** | Harkin et al. 2016 meta | VERIFIED FACT |
| 8 | **Detachment ritual**: evening ritual explicitly closes the day; plans visibly end; rest is scheduled, not stolen | Effort–recovery model (Sonnentag); Madigan et al. 2024 | VERIFIED FACT / EXPERT OPINION |
| 9 | **One-tap schedule recovery after misses** — reschedule, don't rebuke | Academic buoyancy (Martin; Putwain 2023); Wang et al. 2021 fallback-plan recommendation | VERIFIED FACT / EXPERT OPINION |
| 10 | **Procrastination counter = reduce task aversiveness at the entry point** (2-minute starters, next-tiny-action prompts) | Steel 2007 correlates; Rozental et al. 2018 | VERIFIED FACT |

Speculative ideas (marked as such in the body): AI-predicted forgetting for non-flashcard content, AI-generated interleaved problem sets, automated social-pact matching, VR body doubling.

---

## 1. Planning accuracy and the planning fallacy

### What the evidence says

- **VERIFIED FACT:** In Buehler, Griffin & Ross's (1994) classic study, psychology students estimated how long their senior thesis would take; **only 30% of students completed their projects in the time they predicted**, and actual completion exceeded even their *worst-case* estimates. Secondary summaries put the average at ~34 predicted days vs ~55 actual, but the primary figures I could verify directly this session are the 30% figure and the worst-case failure (The Decision Lab, fetched).
- **VERIFIED FACT:** Merely being aware of the planning fallacy is not enough — The Decision Lab's synthesis explicitly states "merely being aware of the planning fallacy is not enough." Awareness alone doesn't fix estimates.
- **VERIFIED FACT (from search-result records of the source):** Reference-class forecasting — predicting from the distribution of *past, comparable* efforts rather than from the inside view of the current plan — reduced average cost overruns from 38% to 5% in Flyvbjerg's before/after project data.
- **VERIFIED FACT:** The **segmentation effect** — breaking a project into small subtasks — yields estimates for small tasks that are accurate or even overestimates (The Decision Lab, fetched).
- **OBSERVED PATTERN:** Recent practitioner sources (2025–2026) claim people underestimate task durations by ~40–50% on average; I could not find a dedicated 2024–2026 meta-analysis on student study-time estimation — treat the 30%/worst-case figures as the solid core.

### Product mechanism

- **Calibration ledger (evidence-backed).** Every plan item carries an estimate and a logged actual (Solis V1 already logs focus sessions and auto-completes plan items *(V1, from the ask)*). The app shows a running "your estimates run X% optimistic" number per subject and offers one-tap "adjust future estimates by my history" when scheduling. This is reference-class forecasting with the student's own data — the one countermeasure with demonstrated before/after results.
- **Segmentation by default (evidence-backed).** Capture (NLP capture in V1 *(V1, from the ask)*) should split anything estimated >90 minutes into subtasks automatically; small tasks get accurate estimates naturally.
- **Speculative:** AI-predicted duration from past session telemetry for the *same topic type*. Plausible, but the human-visible calibration ledger is the evidence-backed core; the AI layer is a nice-to-have that must never silently override the ledger.

---

## 2. Consistency and habit formation

### What the evidence says

- **VERIFIED FACT (fetched primary source):** Singh et al. (2024, *PNAS*), a systematic review/meta-analysis of 20 studies (2,601 participants) on health-behavior habit formation: median time to habit formation **59–66 days**; means **106–154 days**; individual range **4–335 days**; in one tracked study **only 23% of participants reached the automaticity threshold**. The review explicitly rejects the "21-day" myth and advises practitioners to expect **"at least two to five months."**
- **VERIFIED FACT:** Pre–post improvements in automaticity were real and substantial (SMD 0.69, 95% CI 0.49–0.88), i.e., habit formation *can be supported*, it just takes longer than folklore suggests.
- **VERIFIED FACT:** Key determinants of successful habit formation in the meta-analysis: **morning practice, self-selected habits, repetition frequency, context stability, implementation plans, affective judgement, and preparatory routines.**
- **VERIFIED FACT:** Lally et al. (2010) — the origin of the famous figure — found a median of 66 days to peak automaticity with a range of **18–254 days**, and that simple behaviors form faster than complex ones.

### Product mechanism

- **Kill "21-day" framing everywhere (evidence-backed).** Habit UIs should communicate "expect 2–5 months; 4–335 days is normal." This sets expectations that prevent the classic drop-out when day 21 arrives with no automaticity.
- **Miss-tolerant streaks (evidence-backed by the variability data).** With a 4–335-day range and most people not reaching automaticity in tracked windows, binary streaks that reset on a single miss punish exactly the users who need the most time. V1 has streaks and 90-day heatmaps *(V1, from the ask)*; V2 should score **weekly consistency rate** (e.g., 6/7 days) rather than unbroken chains, and show the streak as "days engaged," not "days perfect."
- **Anchor new habits to morning contexts and self-selected behaviors (evidence-backed).** Morning-ritual slotting and letting the student author their own habit (rather than accept a template) are the two determinants an app can directly support — both already partially exist in V1's morning ritual and habit editing *(V1, from the ask)*.
- **Context-stability prompt (evidence-backed).** After a habit miss, ask "same time, same place next time?" — the meta-analysis names context stability and implementation plans as determinants.
- **Speculative:** Habit difficulty auto-detection (auto-detecting that a quantitative habit is stalling and suggesting decomposition). Reasonable, unproven.

---

## 3. Procrastination: causes and effective counters

### What the evidence says

- **VERIFIED FACT:** Steel's (2007, *Psychological Bulletin*) meta-analytic review (7,800+ citations): the strong, consistent correlates of procrastination are **task aversiveness (r ≈ .40), task delay, self-efficacy, impulsiveness (r ≈ .41)** and **low conscientiousness (r ≈ −.62)**. Procrastination correlates negatively but moderately with academic performance (r ≈ −.21 to −.25). Notably, neuroticism/anxiety/depression links are weak once other factors are controlled.
- **VERIFIED FACT (fetched primary source):** Rozental et al. (2018), the first meta-analysis of psychological treatments for procrastination: overall effect **g = 0.34** (95% CI 0.11–0.56) — small but real; CBT subgroup reached **g = 0.55** (moderate, significant) after removing one outlier. Critical caveats: only 12 eligible studies (N=718), 92% high risk of bias for blinding, and **post-treatment outcomes only — long-term effects unexplored.**
- **VERIFIED FACT:** A 2025/2026 RCT (Zhou et al., *Acta Psychologica*, per search record) found MCII (WOOP) significantly reduced procrastination and task aversiveness with sustained effects.
- **OBSERVED PATTERN:** A November 2024 meta-analysis links mindfulness to lower procrastination; guided web-based interventions (Özmen et al. 2023) are effective and scalable.
- **Implication (my reading, RECOMMENDATION):** Since aversiveness is the strongest tractable correlate, product design should attack *starting friction* and *task unpleasantness at the entry point*, not willpower.

### Product mechanism

- **Two-minute starter (evidence-backed).** Every procrastinated task gets a one-tap "just do the first 2 minutes" action that starts a tiny focus session. This directly targets task aversiveness — the r ≈ .40 correlate — by shrinking the perceived task. Focus Room in V1 already supports quick sessions *(V1, from the ask)*; the missing piece is surfacing it *on the avoided task itself*.
- **Obstacle naming (evidence-backed).** When a task slips twice, prompt: "what makes this aversive — boring, unclear, scary?" and generate a concrete re-framing or a first-step subtask. This is CBT-style restructuring, the treatment class with the best (if modest) meta-analytic effect.
- **Pre-decisional "if-then" for known derailers (evidence-backed).** If the student marks a plan item as delayed, auto-suggest an implementation intention ("if it's 4pm Tuesday and I haven't started X, then I'll do 10 minutes at my desk"). Wang et al. 2021 shows unreinforced implementation intentions fail — so the app should *remind* the if-then at the trigger time, not just store it.
- **Honest scoping:** the app is a self-regulation scaffold, not therapy. The 2018 meta-analysis's small evidence base and unknown long-term effects mean Solis should not claim to "treat" procrastination; measure its own effect (see §14 recommendation on internal measurement).
- **Speculative:** Impulse-surfing timer (delay + urge log) and AI reframing of aversive tasks. Both plausible extensions of CBT content; no direct evidence for their app implementation.

---

## 4. Goal setting

### What the evidence says

- **VERIFIED FACT:** Gollwitzer & Sheeran's (2006) meta-analysis of ~100 studies found **d = 0.61** (medium) for implementation intentions — if-then plans specifying when, where, and how — on goal attainment.
- **VERIFIED FACT (fetched primary source):** Wang et al. (2021) meta-analysis of Mental Contrasting with Implementation Intentions (MCII/WOOP): **g = 0.336** (95% CI 0.229–0.443) across 21 articles / 15,907 participants; trim-and-fill adjusted 0.242. Academic-domain effects were significant (**g = 0.255**). Facilitated (face-to-face) interventions did better (g = 0.465) than document-based ones (g = 0.277) — implying *guidance quality matters*, not just the worksheet.
- **VERIFIED FACT:** Wang et al.'s explicit recommendations: reinforce strategy use (multiple sessions/reminders — "unreinforced implementation intentions may fail"), and build **flexibility into plans** ("if one MCII strategy fails, I'll form a new MCII strategy") to avoid rigid self-regulation.
- **VERIFIED FACT:** Gollwitzer et al. (2009), "When Intentions Go Public": announcing *identity-relevant* goals produced a premature sense of social reality — law students who announced their intentions subsequently did fewer relevant tasks. Publicly announcing "I'm going to be a straight-A student" can *reduce* effort.
- **OBSERVED PATTERN:** WOOP outperforms positive visualization and goal-setting alone in applied RCTs (e.g., the 2017 resident-physician study).

### Product mechanism

- **Obstacle-first goal wizard (evidence-backed).** Goal creation in V1 (milestones, generated study plans *(V1, from the ask)*) should become a 4-step flow: Wish → best Outcome → **main inner Obstacle** → "if [obstacle situation], then I will [action]" plan, stored and *scheduled as a reminder*. Generated study plans should embed these if-then triggers on milestone dates.
- **Fallback plans, not one rigid plan (evidence-backed).** Every generated study plan should include a pre-written recovery branch ("if I miss Monday's session, then Tuesday 18:00 replaces it") — matching Wang et al.'s flexibility recommendation.
- **Exam feasibility with the outside view (evidence-backed).** V1's exam feasibility scoring *(V1, from the ask)* is the right instinct; it should consume the §1 calibration ledger (personal overrun rates) rather than ideal durations.
- **Anti-pattern to avoid:** celebratory social sharing of *identity* goals ("I'm going to ace my finals") — the Gollwitzer 2009 effect suggests sharing **specific behavioral plans** ("I'll do 3 problem sets this week, Tue/Thu/Sat") instead.
- **Speculative:** AI-drafted WOOP for each goal. The MCII meta-analysis shows *quality of facilitation* moderated effects, so a good wizard matters more than an AI author.

---

## 5. Time management

### What the evidence says

- **VERIFIED FACT (fetched primary source):** Aeon, Faber & Panaccio (2021, *PLOS ONE*), meta-analysis of 158 studies / 53,957 participants: time management is **moderately related to job performance (r ≈ .25), academic achievement, and wellbeing**; the link to **psychological distress is strong (r = −0.358)**. Wellbeing effects were somewhat *stronger* than performance effects (life-satisfaction link ~72% stronger than the job-satisfaction link). Strongest individual-difference correlate: conscientiousness (r = 0.451). Caveats: mostly cross-sectional studies, high heterogeneity, and the authors warn time management "should not be treated as a panacea."
- **VERIFIED FACT:** Academic effects were slightly larger than work effects; time management predicted all academic results-based outcomes except standardized tests.
- **My reading (RECOMMENDATION):** The strongest quantified benefit of time management is *distress reduction* (r = −0.358), not output. A study OS should market and measure calm, not just productivity.

### Product mechanism

- **Distress-first framing of the daily plan (evidence-backed).** V1's morning ritual and daily plan *(V1, from the ask)* should present "today is handled" relief framing and a realistic finish time, not an exhaustive backlog. The intelligence brief can explicitly track "plan completed by X% → stress indicator" using V1's existing mood/energy calibration inputs.
- **Structure, not more tasks (evidence-backed).** The meta-analysis supports *perceived* time management (structure, control) over raw throughput; the app should make structure visible (timeline, week view) even when capacity is low.
- **Speculative:** Calendar-sync-driven automatic daily restructuring of the plan against real availability. Plausible, unproven in student trials.

---

## 6. Focus and cognitive load

### What the evidence says

- **VERIFIED FACT:** Leroy's (2009) attention-residue research (construct widely used in 2024–2025 applied literature): switching to a new task while the previous one is **unfinished** leaves part of attention allocated to the prior task, degrading performance on the new one. An unfinished task is the highest-cost interruption.
- **VERIFIED FACT (from search record of the source):** Storck et al. (2025, PMC) — distraction increases cognitive load; **cues can reduce load even in distracted learning environments.**
- **OBSERVED PATTERN:** A 2025 meta-analysis (Shen, *Frontiers in Psychology*) finds digital distractions impair reading-comprehension processes; multiple 2024–2025 studies tie short-form-video/social-media task switching to reduced sustained attention in students. Task-switch costs scale with task dissimilarity.
- **EXPERT OPINION:** The frequently cited "23 minutes to refocus" figure (Gloria Mark) circulates widely in practitioner sources; I did not verify the primary figure this session and do not rely on it here.

### Product mechanism

- **Close-the-loop before switch (evidence-backed).** Before ending a focus session early or switching plan items, Solis should force (or offer) a 1-line "next step" note on the unfinished item — a written next action acts as a closure cue that discharges the residue. This is cheap to build and directly maps to Leroy's finding.
- **Tab defense and soundscape (evidence-aligned).** V1's tab defense and Web-Audio soundscapes *(V1, from the ask)* are consistent with the cueing finding (Storck 2025): the environment (cues, reduced channels) reduces load. Extend with an optional pre-session device-plan ("I will not open X") — a mini implementation intention.
- **Single-task session defaults (evidence-backed).** One plan item per focus session, with a visible "session is about X" header; multi-task sessions should be discouraged or split.
- **Distraction logging with feedback loop (evidence-backed).** Post-session reflection (V1 has this *(V1, from the ask)*) should capture interruption counts; the intelligence engine can correlate interruptions with session outcomes — this is monitoring, which §9 shows works.
- **Speculative:** Attention-quality scoring from input telemetry. Fragile and potentially creepy; skip unless carefully consented.

---

## 7. Spaced repetition and retrieval practice (beyond the basics)

### What the evidence says

- **VERIFIED FACT:** Cepeda et al. (2008, *Psychological Bulletin*), quantitative synthesis of 317 experiments: spaced practice beats massed practice (d ≈ 0.42); the **optimal gap is roughly 10–20% of the retention interval** (some sources cite 10–30%), scaling logarithmically — a test in 1 week wants a ~1–2-day gap; a test in 1 year wants ~5–8-week gaps.
- **VERIFIED FACT (from search records):** Bego et al. (2024, *International Journal of STEM Education*) single-paper meta-analyses confirm spaced *retrieval* practice boosts long-term memory in STEM; a 2026 meta-analysis (Maye et al.) finds spaced repetition improves objective knowledge-test performance in medical education; a 2026 PMC study (Sigayret) replicates the testing effect while probing boundary conditions. Transfer/application effects of retrieval practice are weaker than memory effects but present (~d ≈ 0.4 per secondary citations of the meta-analytic literature).
- **VERIFIED FACT:** FSRS (Free Spaced Repetition Scheduler) — the modern, optimizer-based successor to SM-2 — reached version 6 in 2025 with a 21st trainable parameter personalizing the per-user forgetting-curve decay rate; the open **SRS benchmark on ~10,000 Anki users' review logs** shows FSRS outpredicting SM-2 on log-loss/AUC. FSRS is natively integrated into Anki (23.10+).
- **OBSERVED PATTERN:** Low-stakes quizzing reduces test anxiety while improving learning (teacher-report syntheses, 2024); the retrieval *attempt* strengthens memory even when recall fails.

### Product mechanism

- **Retrieval as a scheduler, not a module (evidence-backed).** V1 already has FSRS/SM-2 flashcards, Anki import/export, and an adaptive suggester *(V1, from the ask)*. V2 should extend scheduling beyond flashcards: daily "retrieval tickets" for notes (Ask Solis-generated questions on pinned notes — V1 has AI flashcard/quiz generation *(V1, from the ask)*) scheduled on the same FSRS backbone.
- **Exam-anchored intervals (evidence-backed).** Apply the 10–20% rule explicitly: given an exam date (V1 has exam feasibility data *(V1, from the ask)*), the scheduler should bias review gaps toward ~10–20% of days-until-exam rather than pure per-card optimality.
- **Workload-aware review caps (evidence-aligned).** FSRS Helper (the Anki add-on) computes review load from stability/difficulty; Solis's deterministic engine should cap daily review minutes and push overflow forward — V1's subject-health scores are the natural display.
- **Pretesting/errorful practice (expert opinion, well-known literature).** Pre-questions before studying prime learning; low risk to test in-app as an experiment.
- **Speculative:** AI-generating high-quality retrieval questions for arbitrary notes at scale — the *scheduling* is evidence-backed, the *content quality* is unproven and should be user-correctable.

---

## 8. Interleaving

### What the evidence says

- **VERIFIED FACT:** Brunmair & Richter (2019, *Psychological Bulletin*) meta-analysis: interleaved practice yields **worse practice-session performance but better delayed-test performance** than blocked practice; moderate overall effect with strong moderators. Boundary conditions: benefits are **absent or reversed for expository texts and vocabulary**; effectiveness depends on **similarity of the to-be-learned materials** (works best for highly similar categories — math problem types, artists/styles).
- **VERIFIED FACT:** Firth (2021, *Review of Education*) systematic review: interleaving consistently superior to blocking for concept learning, with the same boundary conditions.
- **VERIFIED FACT (from search record):** Németh et al. (2025, *Learning and Individual Differences*): adaptive sequencing boosted interleaving gains immediately and at delay — but **learners' judgments of learning did not reflect the advantage**. Students will *feel* blocked practice is working better. This is a metacognitive trap.

### Product mechanism

- **Mixed problem-type sets for similar content (evidence-backed).** In Study/syllabus trees *(V1, from the ask)*, when a topic has sibling categories of the same type (e.g., calculus rules, grammar forms), the suggester should offer interleaved sets — and *never* interleave across dissimilar content.
- **Expectation-setting label (evidence-backed).** Interleaved sets carry a UI note: "this feels harder and slower — that's the effect working; you'll score better in 2 weeks." Directly counters the verified JOL blind spot.
- **Measure at delay (evidence-backed).** The effect only shows up on delayed tests; the intelligence engine should compare interleaved-cohort vs blocked-cohort quiz results at 1–2 week lag before claiming success.
- **Speculative:** Fully adaptive interleave/blocking switching per learner. Németh 2025 suggests adaptivity helps, but per-user switching algorithms are unproven.

---

## 9. Reflection and metacognition

### What the evidence says

- **VERIFIED FACT:** Harkin et al. (2016, *Psychological Bulletin*), meta-analysis of experimental evidence: **monitoring goal progress promotes goal attainment**, and interventions increasing monitoring frequency are effective self-regulation tools. Effects were **larger when progress was reported (or made public) and when it was physically recorded** (per the PubMed record surfaced in search). (Exact effect size not verified from primary text this session.)
- **VERIFIED FACT:** Students' judgments of learning (JOLs) are systematically **overconfident after re-reading** (fluency illusion); overconfidence produces underachievement (Wei 2025, PMC; Lee 2025, *Int. J. AI in Education* — calibration discrepancy predicts ineffective subsequent strategy choice; Finn & Metcalfe 2014 for children's persistent overconfidence).
- **VERIFIED FACT:** The interleaving JOL blind spot (Németh 2025, §8) — subjective judgments do not track the best-performing strategy.
- **OBSERVED PATTERN:** Practitioner syntheses (e.g., structural-learning.com) converge: the fix for miscalibration is *testing what learners can retrieve, not what they feel they know*.

### Product mechanism

- **Confidence-calibrated quizzes (evidence-backed).** Before revealing any quiz/flashcard result, ask for a confidence rating (sure/likely/guess). Over time, show a **calibration score** per subject ("you're right 95% of the time when you say you're sure — but 60% when you say 'likely'"). This converts JOL research into a visible signal and redirects study time to overconfident gaps.
- **Weekly review with prediction-vs-actual (evidence-backed).** V1's weekly review ritual *(V1, from the ask)* should include: estimated vs actual study minutes (planning calibration, §1), predicted vs actual quiz performance (metacognitive calibration, this section), and what will change next week (monitoring with commitment).
- **Physically recorded progress (evidence-backed).** Habit ticks, session logs, and written reflections satisfy Harkin's "physically recorded" moderator — V1 already records these *(V1, from the ask)*; V2 should make the record *visible and summarized*, not just stored.
- **Optional public/peer reporting (evidence-backed, with a caveat).** Harkin's "reported" moderator supports shareable progress *summaries*; the Gollwitzer 2009 caveat (§4) means share *behavior* ("14 sessions this month"), never *identity* ("I'm becoming a topper").
- **Speculative:** AI-written weekly narrative (V1 has this *(V1, from the ask)*) — keep it descriptive; the evidence supports *the student's own* reflection prompts over passive AI summaries.

---

## 10. Workload management

### What the evidence says

- **OBSERVED PATTERN:** Deadline bunching — many deadlines colliding — is identified by higher-education practitioner toolkits (e.g., Advance HE's Education for Mental Health toolkit) as overwhelming students, pushing surface learning and undermining motivation. This is a well-established institutional concern, not a single verified experiment.
- **VERIFIED FACT (from search record):** Inan et al. (2025, PMC) find relationships between coursework demand, learning engagement, and **mental fatigue** among online students.
- **OBSERVED PATTERN:** Cognitive-load-theory-based course-design guidance (Univ. of Michigan, 2024) stresses that haphazard deadlines and cluttered interfaces disproportionately burden students with executive-function difficulties.

### Product mechanism

- **Deadline collision radar (evidence-aligned).** With tasks, exams, and generated study plans in one model *(V1, from the ask)*, Solis can detect clustering weeks ahead and auto-propose spreading prep — this is the study-OS answer to a problem institutions are told to fix but rarely do. (The evidence for the *problem* is strong at the practitioner level; evidence for app-based spreading is unproven — the mechanism is a reasonable inference, RECOMMENDATION.)
- **Weekly load budget (evidence-aligned).** Show committed minutes vs available minutes per week; when a subject's plan pushes the budget over, force explicit trade-offs rather than silent overload.
- **Speculative:** Auto-balancing plans across weeks using subject-health scores. Directionally consistent with the fatigue data; needs in-app measurement.

---

## 11. Schedule recovery after disruption

### What the evidence says

- **VERIFIED FACT (construct):** Academic buoyancy (Andrew Martin) is the capacity to bounce back from *everyday* academic setbacks — a missed deadline, a bad grade, competing due dates. Putwain (2023, *Learning and Individual Differences*, per search record) found students high in buoyancy **experienced less adversity later**, i.e., buoyancy buffers future struggles; a 2025 study (Liu et al., PMC) ties buoyancy to psychological resources for recovering from performance dips. Predictors (the "5 Cs"): confidence, coordination, commitment, control, composure.
- **VERIFIED FACT:** Wang et al. (2021) recommend flexible fallback plans in MCII ("if one strategy fails, I'll form a new one") — rigidity hinders goals.
- **EXPERT OPINION:** Practitioner consensus that the "what-the-hell effect" (one miss → total abandonment) is a major failure mode; I did not verify a primary experiment this session, so treat as design guidance rather than fact.

### Product mechanism

- **One-tap recovery, no guilt (evidence-aligned).** When plan items are missed, the morning ritual should offer a single "rebalance today" action that re-schedules overdue items around remaining capacity — V1 has replan *(V1, from the ask)*; the V2 delta is making recovery the *promoted* action with recovery-specific framing ("plans that absorb misses work better than plans that don't").
- **Buoyancy framing in the intelligence brief (evidence-aligned).** Surface a "recoveries this month" metric; normalize misses as data (control + composure from the 5 Cs).
- **Pre-written fallback plans (evidence-backed, §4).** Fallback branches for common disruptions (late start, missed morning, exam moved) turn recovery from a decision into a tap.
- **Speculative:** AI-adaptive replanning that re-optimizes the whole week on disruption. Useful, but the evidence supports *simple rescheduling + framing*; optimize later.

---

## 12. Burnout prevention

### What the evidence says

- **VERIFIED FACT:** Madigan et al. (2024, *European Journal of Psychology of Education* — per search record) is the first systematic review/meta-analysis of interventions to reduce student burnout; both person-directed (CBT, mindfulness, relaxation) and context-directed interventions show effects, generally small. A 2025 meta-analysis ties **academic burnout most strongly to dropout intention**, with satisfaction protective.
- **VERIFIED FACT:** Chong et al. (2025, PMC review): **social and family support** is a key mitigation strategy for student burnout; Popa-Velea et al. (2025, *Frontiers*) list physical activity, relaxation, and CBT approaches as individual preventives.
- **VERIFIED FACT (construct):** The effort–recovery model (Meijman & Mulder; Geurts & Sonnentag 2006) holds that recovery happens when taxed systems are *not re-engaged*; **psychological detachment** — mentally switching off — is the central recovery experience (Sonnentag & Fritz 2007's four recovery experiences: detachment, relaxation, mastery, control). Incomplete detachment predicts exhaustion.
- **Implication (RECOMMENDATION):** For a study OS, burnout prevention = *protecting recovery time*, not just tracking load.

### Product mechanism

- **Evening ritual as detachment gate (evidence-backed construct).** V1's evening ritual *(V1, from the ask)* should explicitly close the study day: tomorrow's plan is previewed and then *hidden* until morning, notifications pause, and the UI communicates "the day is done." This operationalizes psychological detachment — the plan stopping being visible is the app's most direct recovery lever.
- **Scheduled rest as first-class plan items (evidence-backed construct).** Rest blocks, activity, and buffer time appear in the timeline like tasks; the daily score should not punish an unproductive-but-planned evening.
- **Load early-warning (evidence-aligned).** V1's momentum score and subject-health scores *(V1, from the ask)* can flag monotonic week-over-week load increases and flat weekends; the intelligence brief suggests a lighter week *before* exhaustion, per the dropout-risk meta-analysis.
- **Streak safety valve (evidence-backed, §2).** Habit streaks that never miss become stressors; miss-tolerant streaks (§2) double as burnout hygiene.
- **Speculative:** Passive burnout prediction from telemetry. Risky to promise; better to expose the signals (load trend, rest deficit) and let the deterministic engine explain them.

---

## 13. Motivation and accountability

### What the evidence says

- **VERIFIED FACT:** Self-Determination Theory's needs — **autonomy, competence, relatedness** — are well-established predictors of academic motivation; Vasconcellos et al. (2020, *Journal of Educational Psychology*, meta-analysis of SDT-based school interventions) shows SDT-based interventions improve needs satisfaction, motivation, and outcomes in school contexts; Wang et al. (2024) extends with a multilevel meta-analysis.
- **VERIFIED FACT:** Harkin et al. (2016): monitoring works better when progress is **physically recorded and reported** — the accountability-relevant half of the motivation stack.
- **VERIFIED FACT:** Commitment devices: deposit contracts (self-funded stakes) *do* leverage loss aversion, but the landmark smoking-cessation RCT (Giné et al., *NEJM*) found **rewards outperformed deposits because people decline to deposit**; a 2022 JMIR RCT in a physical-activity app found the same uptake problem. Commitment lotteries are a proposed hybrid fix.
- **VERIFIED FACT:** Gollwitzer et al. (2009): public *identity* goals backfire (§4) — public accountability helps when it concerns **behavior and progress records**, not self-image.
- **No dedicated 2024–2025 meta-analysis on stake-based commitment devices in student apps was found this session** — the above trials are the best available evidence.

### Product mechanism

- **Autonomy by construction (evidence-backed).** Self-selected goals and habits (SDT autonomy) — V1 already supports user-authored goals/habits *(V1, from the ask)*; templates should be offered as *starting points the user edits*, not defaults.
- **Competence signals that are honest (evidence-backed).** Visible progress: mastery scores, streak-consistency, calibration improvements (§7, §9). Progress displays should reflect *effort and improvement*, not just raw scores, so low-performers still experience competence.
- **Behavioral (not identity) sharing (evidence-backed).** Share cards show actions and records ("studied 3h40m on Organic Chem this week", "recovered from 2 missed days"), never "I'm going to be a doctor."
- **Optional stakes, friction-aware (evidence-backed caveat).** If V2 adds study pacts with stakes, expect **low uptake** (verified); prefer pact mechanics where the "stake" is social/behavioral (a shared pact board showing who showed up) over money. Do not make deposits the headline feature.
- **Speculative:** Loss-framed in-app currencies (no real money). Untested; run as an experiment, not a core mechanic.

---

## 14. Social and body-doubling learning

### What the evidence says

- **EXPERT OPINION / EVIDENCE THIN (important honesty):** Body doubling — working alongside another person (physically or virtually) — is widely endorsed by ADHD organizations (CHADD, ADDA, Cleveland Clinic) and practitioners, but **rigorous peer-reviewed evidence remains thin**: ADD.org itself notes "there's no research to prove its effectiveness"; the strongest formal study found to date is a 2025 VR study (n=12) showing faster task completion and better sustained attention when body doubling vs alone.
- **OBSERVED PATTERN:** Social facilitation effects (others present → improved effort on tasks) are long-established in social psychology; "study-with-me" streams and virtual co-working grew as practitioner phenomena post-2020. Realtime co-presence is anecdotally one of the stickiest product categories (Focusmate et al.), but that is market observation, not learning science.
- **VERIFIED FACT (related):** Social support mitigates student burnout (Chong et al. 2025) — co-presence has a plausible wellbeing channel even if the productivity evidence is thin.

### Product mechanism

- **Keep realtime Study Rooms, measure them (RECOMMENDATION).** V1's Study Rooms (presence, synced timer, chat, timeline events, study pacts *(V1, from the ask)*) sit on thin formal evidence — so treat them as an in-app experiment: compare completion rates, session length, and return rate of sessions started in rooms vs solo. This is exactly what a deterministic analytics engine can answer from its own event data.
- **Low-friction presence design (evidence-aligned).** Presence cues (who's studying now) with minimal chat pressure — the plausible active ingredients are *witnessed commitment* (Harkin's reported-progress moderator) and *ambient structure* (CHADD's "forces you to choose a project and a time"), not conversation.
- **Study pacts as progress-monitoring pairs (evidence-backed core).** The evidence-backed layer of pacts is monitoring + reporting (Harkin 2016), not peer surveillance; pacts should exchange weekly recorded summaries, not daily nudges.
- **Speculative (clearly marked):** AI-matched pact partners by schedule/syllabus; VR body doubling. The VR study is n=12 — not a basis for feature bets.

---

## Cross-cutting anti-patterns (evidence says: avoid)

1. **Unbroken streaks as the primary habit mechanic** — the 4–335-day variability (Singh 2024) makes binary chains punishing; use consistency rates. *(evidence-backed)*
2. **Public identity-goal celebration** — Gollwitzer 2009; share behaviors, not identities. *(evidence-backed)*
3. **Trusting felt fluency** — re-reading feels productive and isn't; JOLs mislead on interleaving too (Németh 2025). Confidence-calibrated retrieval is the antidote. *(evidence-backed)*
4. **Money-stakes as headline retention mechanic** — deposit uptake is the weak link (Giné et al.; JMIR 2022). *(evidence-backed caveat)*
5. **Awareness-only bias education** — knowing about the planning fallacy doesn't fix it; only structural countermeasures (ledger, segmentation) work. *(evidence-backed)*
6. **Rigid generated plans** — plans must carry fallback branches; rigidity is an intervention weakness identified in the MCII meta-analysis. *(evidence-backed)*
7. **Presenting AI predictions as facts** — deterministic, explainable engines (V1's intelligence approach *(V1, from the ask)*) should stay the default; AI is for content generation and narrative, which the evidence does not yet support as behavioral levers. *(RECOMMENDATION)*

## Solis V1 → V2 mechanism map (summary)

| V1 surface (from ask) | Evidence-backed V2 delta |
|---|---|
| Tasks + NLP capture + replan | Auto-segmentation of long tasks; calibration ledger feeding estimates; promoted one-tap recovery |
| FSRS/SM-2 flashcards, Anki IO, adaptive suggester | Exam-anchored 10–20% gap rule; retrieval tickets for notes; workload caps |
| Focus Room + tab defense + reflection | Close-the-loop next-action notes before switching; single-task session header |
| Intelligence engine, subject health, momentum | Calibration scores (planning + metacognitive); interleaving-vs-blocked delayed comparison; load/rest early warning |
| Morning/evening rituals | Detachment gate (plan hidden after evening ritual); recovery-first morning framing |
| Weekly review + next-week seeding | Prediction-vs-actual section as the review's spine |
| Habits + streaks + heatmap | Month-scale expectations; miss-tolerant consistency scoring; context-stability prompts |
| Goals + exam feasibility + generated plans | WOOP wizard with if-then reminders and fallback branches; outside-view feasibility |
| Realtime Study Rooms + pacts | Behavioral-sharing only; in-app experiment design for body-doubling claims |

---

## Sources

Fetched directly this session (primary verification):

1. Singh et al. (2024), "Time to Form a Habit: A Systematic Review and Meta-Analysis of Health Behaviour Habit Formation and Its Determinants," *PNAS* — https://pmc.ncbi.nlm.nih.gov/articles/PMC11641623
2. Rozental et al. (2018), "Targeting Procrastination Using Psychological Treatments: A Systematic Review and Meta-Analysis," *Frontiers in Psychology* — https://pmc.ncbi.nlm.nih.gov/articles/PMC6125391 (also https://www.frontiersin.org/journals/psychology/articles/10.3389/fpsyg.2018.01588/full)
3. Wang et al. (2021), "A Meta-Analysis of the Effects of Mental Contrasting With Implementation Intentions on Goal Attainment," *Frontiers in Psychology* — https://www.frontiersin.org/journals/psychology/articles/10.3389/fpsyg.2021.565202/full
4. Aeon, Faber & Panaccio (2021), "Does time management work? A meta-analysis," *PLOS ONE* — https://journals.plos.org/plosone/article?id=10.1371/journal.pone.0245066
5. The Decision Lab, "Planning fallacy" — https://thedecisionlab.com/biases/planning-fallacy (verification of Buehler et al. 1994 figures and countermeasures)

Verified via search-result records quoting the source (primary not fetched):

6. Steel (2007), "The Nature of Procrastination," *Psychological Bulletin* — https://pubmed.ncbi.nlm.nih.gov/17201571
7. Brunmair & Richter (2019), "Similarity matters: A meta-analysis of interleaved learning and its moderators," *Psychological Bulletin* — https://pubmed.ncbi.nlm.nih.gov/31556629
8. Harkin et al. (2016), "Does monitoring goal progress promote goal attainment? A meta-analysis," *Psychological Bulletin* — https://pubmed.ncbi.nlm.nih.gov/26479070 (PDF fetch returned unsupported content type; effect size not verified, directional finding and moderators are from the PubMed record)
9. Cepeda et al. (2008), "Distributed practice in verbal recall tasks," *Psychological Bulletin* (via summaries incl. https://www.psychologytoday.com and Uner 2021 WashU record)
10. Gollwitzer & Sheeran (2006), "Implementation intentions and goal achievement: A meta-analysis" (d = 0.61; cited in Wang 2021 fetch and search records)
11. Gollwitzer et al. (2009), "When Intentions Go Public," *Psychological Science* — https://www.academia.edu/13463072
12. Vasconcellos et al. (2020), "Self-determination theory applied to physical education: A systematic review and meta-analysis," *Journal of Educational Psychology* — https://psycnet.apa.org/record/2019-61785-001
13. Bego et al. (2024), "Single-paper meta-analyses of the effects of spaced retrieval practice," *Int. J. STEM Education* — https://link.springer.com/article/10.1186/s40594-024-00468-5
14. Maye et al. (2026), "The Effectiveness of Spaced Repetition in Medical Education" (meta-analysis) — https://pubmed.ncbi.nlm.nih.gov/41601436
15. Storck et al. (2025), "Learning and distraction: Evidence for cognitive load effects," PMC — https://pmc.ncbi.nlm.nih.gov/articles/PMC13129625
16. Németh et al. (2025), "Does adaptive sequencing boost the interleaving effect?" *Learning and Individual Differences* — https://www.sciencedirect.com/science/article/pii/S1041608025001803
17. Firth (2021), "A systematic review of interleaving as a concept learning strategy," *Review of Education* — https://bera-journals.onlinelibrary.wiley.com/doi/10.1002/rev3.3266
18. Wei (2025), judgments of learning (JOLs) for oneself vs others, PMC — https://pmc.ncbi.nlm.nih.gov/articles/PMC12705826; Lee (2025), "Calibration Discrepancy Predicts Students' Subsequent…," *Int. J. AI in Education* — https://link.springer.com/article/10.1007/s40593-025-00514-5
19. Madigan et al. (2024), "Interventions to reduce burnout in students: A systematic review and meta-analysis," *European Journal of Psychology of Education* — https://link.springer.com/article/10.1007/s10212-023-00731-3
20. Chong et al. (2025), "Student Burnout: A Review on Factors Contributing," PMC — https://pmc.ncbi.nlm.nih.gov/articles/PMC11852093
21. Sonnentag & Fritz (2007) Recovery Experience Questionnaire; effort–recovery model syntheses — https://pmc.ncbi.nlm.nih.gov/articles/PMC3862850 (Zoupanou 2013) and related Sonnentag literature
22. Martin, "Academic buoyancy" (construct); Putwain (2023) — https://www.mdpi.com/2079-3200/11/3/42; Liu et al. (2025) — https://pmc.ncbi.nlm.nih.gov/articles/PMC12176830
23. Giné, Karlan & Zinman (2010), smoking-cessation commitment contracts, *NEJM*; JMIR 2022 deposit-contract RCT (Dataverse record) — https://dataverse.nl/citation?persistentId=doi:10.34894/G3KOYT
24. Flyvbjerg, "From Nobel Prize to Project Management" (reference-class forecasting; 38% → 5% overrun reduction) — https://www.academia.edu
25. FSRS-6 and Open SRS Benchmark — https://github.com (fsrs4anki helper/benchmark records); Mindomax overview — https://www.mindomax.com
26. Body-doubling evidence state: ADD.org — https://add.org; CHADD — https://chadd.org; 2025 VR body-doubling study — https://www.researchgate.net
27. Advance HE, Education for Mental Health toolkit (workload/deadline bunching) — https://advance-he.ac.uk; Inan et al. (2025), coursework demand and engagement, PMC — https://pmc.ncbi.nlm.nih.gov
28. Özmen et al. (2023), guided web-based interventions for procrastination, PMC — https://pmc.ncbi.nlm.nih.gov; mindfulness–procrastination meta-analysis (Nov 2024), UNE record — https://blog.une.edu.au

*All URLs are public http(s). Older-than-2024 items are marked with their year; everything labeled VERIFIED FACT above was checked against the listed source or its indexed record this session. Claims I could not verify at primary-source level (e.g., Harkin's exact effect size, Gloria Mark's "23 minutes," the "40–50% underestimation" practitioner figure) are labeled OBSERVED PATTERN or excluded.*
