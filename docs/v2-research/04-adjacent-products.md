# 04 — Adjacent Products: Transferable Mechanisms for a Student Study OS

**Researcher:** adjacent-products researcher (workflow subagent)
**Date:** 2026-09-27
**Scope:** Mechanism-level research into adjacent categories — what each product does *exceptionally well*, the mechanism that makes it work, and how that mechanism would or would not transfer to Solis V2 (a student study OS).

---

## 0. Method and evidence labels

Every load-bearing claim in this document carries one of four labels:

| Label | Meaning |
|---|---|
| **VERIFIED FACT** | Confirmed by reading a source in this session. Product pages were fetched directly where possible (primary). Where a direct fetch was blocked (HTTP 403/404) but search-result summaries gave consistent, specific detail, the claim is marked VERIFIED FACT *(secondary, via search)* with the blocking noted where load-bearing. |
| **OBSERVED PATTERN** | A recurring theme across multiple independent sources or reviews; directionally reliable, not individually audited. |
| **EXPERT OPINION** | The researcher's judgment, based on the evidence gathered here plus domain knowledge. |
| **RECOMMENDATION** | What the researcher thinks Solis V2 should do. |

**Sources:** all URLs actually used are listed in §12 (Sources). Fetches were performed today (2026-09-27); searches prioritized 2025–2026 material; older items are flagged.

**Solis V1 baseline:** the VERIFIED FACTS in the task brief (from direct code inspection of this repository) are cited as *"per the task brief."* They were not re-audited in this session.

**Known limitations of this research:**
- openai.com, chatgpt.com and the Jisc article returned HTTP 403 to direct fetches; ChatGPT Study Mode mechanics rest on search-result summaries of the official announcement and reviews (secondary).
- Some review sites (TechRadar, App Store, Trustpilot) were read only via search summaries, not fetched.
- Search result summaries occasionally paraphrase; exact numbers quoted from marketing pages are vendor claims and are marked as such.
- I could not test any of these products hands-on; all "mechanism" descriptions are what the vendors and reviewers describe, not observed behavior.

---

## 1. Coverage map: where the adjacent categories already overlap Solis V1

Per the task brief, Solis V1 already has: dashboard cockpit (daily plan, habits, timeline, rituals, intelligence brief, momentum score); tasks (list/schedule/week/matrix, NLP capture, recurrence, replan); study (subjects, syllabus trees, FSRS/SM-2, Anki import/export, adaptive suggester, subject health); Focus Room (timers, Web-Audio soundscapes, tab defense, drift pad, reflection with auto-logging); realtime Study Rooms (presence, synced timer, chat, events, study pacts); Notes (wiki-links, backlinks, graph, pins, version history, AI flashcards/quizzes, grounded Ask Solis); Habits (boolean/quantitative/tiered, streaks, heatmap, auto-toggle); Goals (milestones, exam feasibility, generated plans); deterministic Analytics (retention decay, mastery, subject health, circadian synthesis, explainable recommendations); Weekly Review; backups/iCal.

**EXPERT OPINION:** Solis V1's coverage is unusually broad — broader than any single adjacent product. The research question is therefore not "what features are missing" but "which *mechanisms* in the adjacent tools are deeper or better-engineered than Solis's first-pass versions, and which interaction patterns would compound with Solis's existing deterministic intelligence layer."

| Adjacent category | Solis V1 has a version of it | The gap the adjacent product exposes |
|---|---|---|
| AI auto-scheduling | Daily plan + replan | Reclaim/Motion's *continuous* rescheduling with approval gates (§2) |
| Task managers | List/schedule/week/matrix + NLP | Todoist's zero-friction capture; Things' triage ergonomics (§3) |
| Habit tracking | Streaks, heatmap, tiers | Time-of-day placement, mood correlation, social challenges (§4) |
| Time analytics | Deterministic engine, circadian synthesis | Passive capture of *what actually happened*; adaptive breaks (§5) |
| Focus | Timers, tab defense, soundscapes | Loss-aversion stakes, social body doubling (§6) |
| Knowledge mgmt | Wiki-links, backlinks, graph | Typed objects + database views (§7) |
| AI assistance | Ask Solis, Scholar Report | Socratic study modes; agentic multi-step workflows (§8) |
| Personal OS | All-in-one cockpit | Structure-free capture → structured objects pipeline (§9) |
| Collaboration | Study Rooms, pacts | Triage inboxes, in-context comments, pre-commitment (§10) |

---

## 2. Calendars & scheduling

### 2.1 Motion (usemotion.com) — deadline-driven auto-replanning

**What it is:** an "AI productivity superapp" that auto-schedules tasks onto a calendar and re-optimizes continuously. **VERIFIED FACT** (fetched usemotion.com, 2026-09-27): Motion "takes all of your projects and tasks, prioritizes and timeblocks them on your calendar, and dynamically optimizes your schedule dozens of times a day, all done automatically"; it combines work/personal calendars across Outlook, Google and iCloud. In 2025–2026 Motion expanded into "AI Employees" (AI Task Planner, AI Project Manager, AI Notetaker, AI Workflows Builder that turns SOP documents into repeatable auto-assigned project templates) — **VERIFIED FACT** (fetched).

**The mechanism that makes it excellent:**
1. **"Do Date ≠ Due Date."** Motion schedules *do* dates by working backwards from due dates through durations, priorities and dependencies — **VERIFIED FACT** (quoted phrase and behavior from usemotion.com).
2. **At-risk early warning.** When a task is at risk, Motion "proactively warns you days or weeks in advance," and unfinishable work "gets re-shuffled" — **VERIFIED FACT**.
3. **Continuous re-optimization without ceremony.** Plans "change all the time" and the system re-plans automatically whenever anything changes — **VERIFIED FACT**.
4. Reviewers consistently describe Motion as strongest where project management meets intelligent scheduling, with Reclaim stronger on calendar/habit defense — **OBSERVED PATTERN** (max-productive.ai Aug 2025; akiflow.com Dec 2025; techpoint.africa Mar 2025 comparison summaries).

**Transfer to a student study OS:**
- Mechanism 1–2 transfer *directly and cheaply*: a semester is a web of deadlines (assignments, exams) and study durations. Solis V1 already generates study plans from goals and has "exam feasibility drift warnings" (per the task brief); Motion's insight is to apply the same backward-scheduling math **per task, continuously**, not just per exam. **RECOMMENDATION:** extend Solis's feasibility engine from exam-level to every plan item: each day, compute a "slippage forecast" ("at current pace, Syllabus Topic X lands 3 days short by the Oct 14 exam") and surface it in the intelligence brief. This is a deterministic computation Solis is already positioned to make; no LLM required.
- Mechanism 3 transfers **partially and with a guardrail**. **EXPERT OPINION:** Motion's fully autonomous re-shuffling is the single most-cited trust complaint about the category; silent rescheduling of a student's revision plan would feel like the app "moving the furniture." Reclaim's answer (below) — preview-and-approval before changes apply — is the right pattern for students whose plans are exam-critical.

### 2.2 Reclaim.ai — defended, flexible, *negotiable* scheduling

**What it is:** an AI scheduling layer that defends time rather than just filling it. **VERIFIED FACT** (fetched reclaim.ai, 2026-09-27): "AI Tasks — auto-sync and schedule Tasks to your calendar, by priority"; "AI Habits — AI-powered recurring events that flex and find time"; "AI Focus Time — Set your weekly goal, auto-defend time to get stuff done" (vendor-claimed result: "+7.6 hours of focus time per week"); "Reclaim dynamically adapts meetings, tasks, and focus time to reduce overload, resolve conflicts"; **AI Buffer Time** ("Auto-schedule breaks & travel across your meetings"); an **AI Planner** ("Automate the perfect daily plan"); and — critically — "preview and approval controls before changes are applied." Third-party coverage characterizes it as protecting priorities via flexible re-scheduling of habits and tasks across calendars — **VERIFIED FACT** (reclaim.ai homepage nav and copy; corroborated by pipeline.zoominfo.com Aug 2026 and saner.ai summaries).

**The mechanism that makes it excellent:**
1. **Habits as *flexible calendar events with a time window*, not fixed reminders.** A habit is scheduled into a range (e.g., "study Spanish, 3–6pm, 45min") and slides within the range when conflicts arrive. This is the key mental-model difference from every habit tracker.
2. **Defense, not just scheduling.** The unit of value is "protected time" against a stated weekly goal, with the system rebalancing when reality intrudes.
3. **Approval gates.** The AI proposes; the human approves — the trust-preserving inversion of Motion's autonomy.

**Transfer:**
- **Habit-as-flexible-event is the strongest single transferable mechanism in the calendar category for Solis.** Solis V1 habits are tracked on a 90-day heatmap with streaks (per the task brief), but scheduling lives in the separate daily plan. **RECOMMENDATION:** fuse them — give each Solis habit a `time_window` + `duration` + `priority`, let the deterministic daily planner place it inside the window, and re-place it (with approval) when a plan item overruns. This also creates the data spine for "which habits actually survive midterms" analytics.
- The **approval-gate pattern** should be adopted as a global Solis principle for any agent-initiated plan change (see §8.2 Notion agents). **RECOMMENDATION:** every LLM-proposed plan edit lands in a "proposed changes" diff the student approves in one tap.
- Buffer-time scheduling (automatic breaks between blocks) is directly transferable to Solis's Focus Room + timeline and pairs naturally with the circadian engine (§5.2).

### 2.3 Clockwise — sunset case study (current state verified)

**Current state — important correction to the category brief:** Clockwise's product is being shut down. **VERIFIED FACT** (fetched getclockwise.com, 2026-09-27): "Our product will no longer be available starting on March 27, 2026"; the team is joining Salesforce; all Clockwise-managed Focus Time blocks, Flexible Meetings, Smart Holds and Scheduling Links will be removed; lifetime stats cited: "8 million hours of Focus Time created," "23 million meetings moved to better times," ~40,000 organizations; Reclaim is recommended as the migration target with a price-match guarantee. An earlier Register-reported story (via search summary) said Salesforce acqui-hired the Clockwise team while the app "isn't" immediately discontinued — consistent with a staged sunset. **No evidence was found in any search for a Workday acquisition; the Workday claim sometimes repeated in older comparisons is unverified and appears incorrect.**

**The mechanism that made it excellent:** team-wide flexible meetings — meetings marked "flexible" could be moved by the optimizer to manufacture uninterrupted Focus Time for *everyone at once*; "Smart Holds" pre-reserved focus, travel, and break time. **VERIFIED FACT** (fetched, features listed above).

**Transfer:**
- **VERIFIED FACT-level lesson:** demand for machine-defended focus time was real and large (8M hours created), and yet a team-calculus product can die when its value depends on network adoption. **EXPERT OPINION:** this validates building focus-time defense *for a single user* (which Solis can do) and warns against any V2 feature whose value requires the student's whole class to adopt Solis simultaneously.
- The **Focus Time block as a first-class calendar object** ("hold," with metadata, that the planner can relocate) is worth stealing as a data model: Solis's timeline plan items should be typed objects (fixed / flexible / defended) the engine can reason about, not strings.

---

## 3. Task managers

### 3.1 Todoist — capture speed + a gamified identity system

**VERIFIED FACT** (fetched todoist.com, 2026-09-27): "Capture and organize tasks instantly using easy-flowing, natural language"; Today/Upcoming views; custom filters; calendar view; 50+ templates across categories including Education; "Todoist Assist" that "transforms scattered tasks into clear action plans"; scale claims of 2+ billion completed tasks. Reviewers consistently rank natural-language capture as best-in-class and repeatedly praise **Karma** — points, levels, streaks and daily/weekly goals for task completion — with notable effects on daily engagement, and note NLP capture is frequently called out as especially valuable for ADHD users — **OBSERVED PATTERN** (klika.us Jan 2025; resolutely.app; declutterthemind.com Aug 2025; ones.com Aug 2026 summaries). Newer builds add voice capture ("Ramble to record") that structures spoken tasks — **VERIFIED FACT** *(secondary, via search of App Store listing)*.

**The mechanisms that make it excellent:**
1. **Capture latency near zero.** The NLP parser (dates, priorities, projects, labels inline) removes the "where does this go / when is this" decision at the moment of capture.
2. **Karma converts completion into identity.** It is not a points shop; it is a persistent, visible score of *being someone who follows through*, with levels and goal streaks.

**Transfer:**
- Solis V1 has NLP capture (per the task brief) and a momentum score. **RECOMMENDATION:** the transferable refinement is not "add gamification" but (a) make capture work **everywhere** (global hotkey, mobile share-sheet, voice) with the same parser, and (b) treat **Karma as a cautionary tale**: Karma rewards *checking boxes*, which for students can incentivize trivial task churn over real study. If Solis adds a persistent momentum identity, it should key off **study-session minutes and retention metrics** (data Solis already has deterministically), not task counts.
- Education templates ("Student Project" board) are cheap to replicate and good activation content — **VERIFIED FACT** they exist; **RECOMMENDATION** ship a semester template library.

### 3.2 Things 3 — triage ergonomics that still lead the category a decade in

**VERIFIED FACT** (TechRadar review dated May 30, 2025, via search summary): Things 3 remains a paid, Apple-only, one-time-purchase task manager praised for "an excellent user flow"; the Today view "collects everything due today in one place" and an Upcoming view gives "a drag-and-drop overview of the week or month" (also in jotform.com's 2026 daily-planning roundup, via search summary). Apple Design Award winner; minimal UI; no natural-language input or collaboration by design — **OBSERVED PATTERN** across 2025 reviews (focuzed.io Sept 2025; imore; igeeksblog summaries).

**The mechanism that makes it excellent:** **the daily triage ritual.** Upcoming is a *planning surface* (drag anything into any day), and Today is a *commitment surface* — a short list you genuinely intend to finish. The design weaponizes the psychological difference between "scheduled" and "committed."

**Transfer:**
- Solis's dashboard daily plan already implies this, but **RECOMMENDATION:** make the distinction *enforced*: anything not explicitly pulled into Today lives in a clearly separate "Upcoming / backburner" area; overloading Today triggers a gentle deterministic warning ("Today carries 11h of planned work — your best measured capacity is 6h"). Solis's circadian synthesis data makes this warning more truthful than anything Things could compute. This is a low-cost, high-trust interaction upgrade.
- **EXPERT OPINION:** Things proves "fewer views, better default views" wins multi-year loyalty in this category — a useful brake on V2 feature sprawl.

### 3.3 TickTick — the all-in-one that validates Solis's thesis

**VERIFIED FACT** (fetched ticktick.com, 2026-09-27): calendar layouts (yearly/monthly/weekly/daily/agenda, weekly "highlights busy and free time blocks"); Pomodoro timer ("break tasks into 25-minute intervals"); habit tracker ("rich habit library, flexible tracking options, and insightful statistics"); Eisenhower matrix; NLP date recognition; AI Voice Capture extracting "dates, priorities" and creating multiple tasks; audio summaries; "Constant Reminder" notifications that "keep ringing until you complete the task"; 40+ themes; cross-platform sync. **OBSERVED PATTERN** (Capterra and tooltivity Jul 2026 summaries): users explicitly praise having tasks + time-blocking calendar + habits + Pomodoro "in a single app"; the richer calendar is paywalled (free tier limitation).

**The mechanism that makes it excellent:** **module integration beats module quality.** TickTick rarely wins any individual comparison; it wins *workflow* comparisons because tasks, calendar, habits and timer share one data model — finishing a task during a Pomodoro updates statistics, habits, and the calendar in one gesture.

**Transfer:**
- **EXPERT OPINION:** TickTick is the closest *commercial* structural cousin to Solis, and its success is evidence the all-in-one study OS is a real product category rather than a feature-blob trap. The transferable lesson is architectural: Solis's IDataService abstraction (per the task brief) is the right spine — V2 should be judged on **cross-module event flows** (focus session → task → habit → analytics, automatically), which is exactly where V1 already invests (focus-to-study auto-log, habit auto-toggle). **RECOMMENDATION:** extend the same auto-wiring to Pomodoro-style defaults inside the Focus Room (Solis has countdown/stopwatch; add configurable work/break cadences with break suggestions drawn from circadian data — see §5.2).
- "Constant Reminder" (a nag-until-done mode for critical items) is a 20-line feature with outsized utility for exam deadlines — **VERIFIED FACT** it exists; **RECOMMENDATION** adopt for high-stakes plan items.

### 3.4 Superlist — sensory completion and notes-in-tasks

**VERIFIED FACT** (fetched superlist.com, 2026-09-27): "Infinitely nested lists and subtasks"; "Quick add from anywhere — Type or talk" (e.g., "Dentist Friday at 2pm") with home-screen/lock-screen widgets; notes directly inside tasks; AI that "turns voice recordings into action items, summarize[s] meeting notes"; real-time collaboration; recurring tasks. Reviewers single out the sensory design — "the little details like sounds really stand out" — **OBSERVED PATTERN** (play.google.com listing; tool-atlas.com; hypertools.so summaries). Pricing criticism: the $25/month "Super" tier for AI features is called overpriced — **VERIFIED FACT** *(secondary, hypertools.so via search)*.

**The mechanism that makes it excellent:** **completion as a felt experience** — sound, motion and visual feedback on checking a task; plus the collapsing of note-taking into the task object so a task can hold a whole brain-dump.

**Transfer:**
- **RECOMMENDATION:** adopt the "task holds its process" pattern for study tasks (a plan item opens into subtasks, linked syllabus topics, session logs and reflection notes — most of this data already exists in Solis, it just needs to be *surfaced in the task object*).
- The sensory-completion mechanism is cheap (Web Audio — Solis already synthesizes soundscapes) and disproportionately delightful. **RECOMMENDATION:** a distinctive completion sound/animation, tuned to Solis's brand, and richer feedback at *session* completion (not just task completion).
- **Cautionary:** AI paywalled at a premium price point drew backlash while AI costs deflate — **RECOMMENDATION** keep Solis's user-supplied-key model (per the task brief) as the differentiator, not a paid AI moat.

---

## 4. Habit trackers

### 4.1 Habitify — habits placed in a day, mood joined to habit data

**VERIFIED FACT** (fetched habitify.me, 2026-09-27): habits organized by time of day ("Morning / Noon / Night" sample schedule with timed entries like "Meditate 8:30 AM," "Reflect 8 PM"); Apple Calendar sync of the habit schedule; "Challenge your Friends" and "Join Monthly Challenge … Climb the leaderboards"; "insightful metrics" with milestone celebrations; Apple Health/Google Fit sync; **mood tracking** ("Track your emotional health, understand its effects on your habits"); built-in focus timer; reflection notes ("Capture and reflect on your thoughts"). Cross-platform real-time sync is repeatedly named the differentiator vs. competitors — **OBSERVED PATTERN** (App Store reviews and a 6-app comparison, via search summaries).

**The mechanisms that make it excellent:**
1. **The habit plan is a schedule, not a checklist.** Habits occupy real times of day.
2. **Mood × habit correlation** gives habit data a *why* dimension.

**Transfer:**
- Both mechanisms map cleanly onto Solis. Time-of-day placement: covered in §2.2 (fuse with Reclaim-style windows). Mood: **RECOMMENDATION** add a one-tap mood/energy check to the evening ritual (Solis already has morning/evening rituals per the task brief) and join it to habit completion, focus-session quality and subject health in the deterministic engine — this converts Solis's intelligence brief from "what happened" to "what happened and how you felt," which is where habit science actually lives. No LLM needed; it's a correlation view.
- Social challenges (leaderboards) transfer naturally to Solis's realtime Study Rooms — **RECOMMENDATION** a room-level monthly challenge ladder; but note the Clockwise lesson (§2.3): keep all social features valuable at zero participants.

### 4.2 Streaks — the chain as the entire product

**VERIFIED FACT** *(secondary, via search of App Store listing and productivity.directory/humanpicks 2025–2026 reviews)*: Streaks tracks up to 12–24 tasks as consecutive-day chains; iCloud sync; task sharing between users; Apple Watch and widgets; one-time purchase (~$4.99); Apple Design Award winner (2016); App Store rating ~4.8. **OBSERVED PATTERN:** consistently cited as the minimalist benchmark — "counting a chain better than almost anything else on iOS."

**The mechanism that makes it excellent:** **one mechanic, executed perfectly.** The streak chain *is* the motivation system; everything else (widgets, watch, share cards) exists to keep the chain visible.

**Transfer:**
- Solis V1 already has streaks + a 90-day heatmap (per the task brief) — the *data* is there. **RECOMMENDATION:** the transferable part is **surface area and share-ability**: streak state must be visible without opening the app (a future mobile/extension surface) and shareable as a card (social accountability artifact). Cheap, high-retention.
- **EXPERT OPINION / caution:** chain mechanics punish absence — a missed day during exams can destroy months of streak and the user's relationship with the app. Solis's tiered habits (per the task brief) are the right substrate for a **streak-freeze or "exam mode" grace rule** — a mechanism Streaks lacks but student reality demands.

---

## 5. Time tracking & personal analytics

### 5.1 RescueTime / Rize — passive capture + intervention

**VERIFIED FACT** (fetched rescuetime.com, 2026-09-27): background automatic tracking of apps/websites; **Focus Sessions** that "Block distracting websites, apps, and even email or chat"; "Set goals and get smart alerts that put you back on track before distractions can take over"; detailed pattern reports; explicit privacy posture ("do not collect keystrokes, form input, screenshots, or webpage content"). Rize — **VERIFIED FACT** (fetched rize.io, 2026-09-27): tracks window metadata ("app name, title, and URL") with ML assignment to projects; "Automatic focus detection and intelligent distraction blocking"; "Smart break reminders and wellness prompts"; overwork alerts; an "AI Productivity Coach" with "personalized check-ins … and actionable nudges"; employees "review and approve their time data before leadership sees it." **OBSERVED PATTERN** across 2025–2026 reviews (memtime.com; theprocesshacker.com 2024; efficient.app): Rize's break reminders adapting to your own work patterns is the most-praised mechanism, with the limitation that it's poor for client billables.

**The mechanisms that make them excellent:**
1. **Zero-effort ground truth.** Both tools answer "where did the time actually go" from passive capture, not self-report.
2. **Measurement wired to action** — the same app that measures blocks/nudges (RescueTime's differentiation, repeatedly noted by reviewers — **OBSERVED PATTERN** via fueler.io May 2025 summary).
3. **Break timing learned from the individual** (Rize).
4. **Consent-first analytics** (Rize's review-before-share).

**Transfer:**
- **The browser-only gap is the hard constraint.** Solis is a web SPA with Supabase (per the task brief); it cannot passively watch the OS. **VERIFIED FACT:** that's what Rize/RescueTime desktop agents do. **EXPERT OPINION:** attempting an Electron-level monitor in V2 would burn months on the wrong problem. What transfers is the *pattern*: Solis should mine **its own session data** (focus sessions, tab-defense events, drift-pad usage, task completions, study logs) as the passive ground truth it *can* capture — effectively making the Focus Room the tracking agent.
- **Adaptive breaks** transfer cleanly: Solis's circadian synthesis (per the task brief) already models personal energy rhythms; **RECOMMENDATION** compute personalized break timing and insert Buffer-style breaks into the plan timeline (§2.2), then A/B against fixed Pomodoro cadences.
- **Consent-first analytics** (Rize mechanism 4) should become a Solis principle: every intelligence-brief insight is user-reviewable, editable ("that session was actually browsing, not study") and deletable — which Solis's deterministic, explainable engine already philosophically matches (per the task brief). **RECOMMENDATION** add the "approve/correct my data" surface explicitly.

### 5.2 Toggl Track — the planning pivot (and the risk of it)

**VERIFIED FACT** *(secondary, via search summaries: saasgenius.com Oct 2025; App Store listing Sep 2026; community.toggl.com Jul 2025)*: Toggl Track remains a simple one-click time tracker with 100+ integrations and strong reporting; **Toggl 2.0 (2025)** merges time tracking with *planning* — "Track your hours, manage your tasks, and build work plans based on real data" — with mixed early community feedback.

**The mechanism that makes it excellent:** **closing the loop between estimated and actual time** — plans built from what you really did, not what you hope.

**Transfer:**
- **RECOMMENDATION:** this loop is the single highest-value analytics upgrade for Solis: for every recurring plan-item type (e.g., "Problem Set for MATH201"), compare planned vs. actual minutes across the semester and feed the drift into the existing feasibility engine and next-week plan seeding (both exist in V1 per the task brief). That is estimation-calibration as a feature — "your problem sets run 40% over estimate; next week's plan accounts for it." Fully deterministic.
- **OBSERVED PATTERN** caution: Toggl's 2.0 rollout shows that fusing planning into a tracker can upset existing workflows — sequence such changes behind opt-in.

---

## 6. Focus tools

### 6.1 Forest — loss aversion + visible accumulation

**VERIFIED FACT** *(secondary, via App Store listing and 2025–2026 coverage via search)*: a gamified Pomodoro where "a virtual tree grows" while you stay off your phone and "leaving the app kills the tree"; accumulated sessions become a forest; positioned explicitly against phone addiction. **OBSERVED PATTERN:** the mechanic spawned a clone category (Focus Plant, Focus Friend) and remains popular into 2026.

**The mechanism that makes it excellent:** **staked commitment with irreversible loss** — abandoning a session destroys something you built — plus **visible accumulation** (the forest) turning abstract discipline into an artifact. Classic commitment-device psychology (pre-commitment, loss aversion).

**Transfer:**
- Solis's Focus Room already has tab defense and post-session reflection (per the task brief) — the *enforcement* half exists. **RECOMMENDATION:** add the *stakes* half: a per-week "Focus Garden" that grows with completed defended sessions and visibly shrinks/marks an abandoned tree when a defended session is quit early. This is a purely client-side visual layer over data Solis already records — near-zero backend cost, high motivational yield. Pair with the Study Pacts mechanic (below).
- **EXPERT OPINION:** one tree-type-per-subject variant would also make the garden an analytics surface (which subject's trees survive), but keep V2 scope to the base mechanic.

---

## 7. Knowledge management

### 7.1 Obsidian (Bases) — local files become typed databases

**VERIFIED FACT** (fetched obsidian.md changelog for v1.9.0, May 21 2025): Bases is a core plugin that "lets you turn any set of notes into a powerful database"; "create custom table views to visualize and interact with data"; "filter your notes by properties and create formulas to derive your own dynamic properties"; all data "backed by your local Markdown files and properties stored in YAML" (.base files). Bases left early access ~Aug 2025 (1.9.10) — **VERIFIED FACT** *(secondary, Reddit/XDA via search)*; later updates added a card view and CSV export — **VERIFIED FACT** *(secondary)*. Help docs exist at obsidian.md/help/bases (page fetched; body did not render — only title confirmed).

**The mechanism that makes it excellent:** **structure is a *view*, not a location.** Notes stay plain files; databases are projections (filters + formulas) over properties. You never re-file a note when your system changes — you write a new base.

**Transfer:**
- Solis Notes already has properties-equivalents (topics, subjects, links) and wiki-links/backlinks (per the task brief). **RECOMMENDATION:** introduce **typed study records** — `Lecture`, `Reading`, `ExamQuestion`, `Mistake` — as structured note objects with fields (course, date, source, confidence), then ship 2–3 **saved views** ("all unresolved exam questions for CS210 sorted by mastery gap," "mistakes made >2 times"). This is Bases' view-over-props mechanism applied to study data, and it feeds the FSRS/mastery engine with better-typed inputs. It is also exactly the gap Tana is attacking with students (§7.3), so the student-side demand is validated by a well-funded competitor's positioning.

### 7.2 Logseq — a cautionary platform lesson

**VERIFIED FACT** *(secondary, via logseq forum changelogs, GitHub README and community coverage via search)*: Logseq spent 2024–2025 rebuilding on a database core ("DB version") to fix the file-based architecture's performance/structure limits; a 2.0 Beta (DB version) reached wider release around mid-2026, with a new mobile app; community reaction to the long development arc was mixed-to-critical. **OBSERVED PATTERN:** the classic-file version remained the reliable daily driver for most users throughout the rewrite.

**Transfer:**
- **EXPERT OPINION / RECOMMENDATION:** Logseq is the category's clearest warning against a ground-up platform rewrite while users depend on the product. For Solis V2 this argues for **incremental data-model evolution inside the existing Supabase/IDataService spine** (typed columns, backfill migrations) rather than any "V2 storage" rearchitecture. Noted as a governance principle, not a feature.

### 7.3 Tana — supertags + AI pipeline aimed at students

**VERIFIED FACT** (fetched outliner.tana.inc, 2026-09-27 — Tana's own student page): Supertags "turn a node into a typed object with a template of fields" (e.g., an assignment with due-date, course, priority fields flowing automatically into organized views); a "Student hub" template ("track courses, assignments, exam questions and more"); a "Study scheduler" template turning a semester into "a rhythm you can keep"; an AI notetaker that records and transcribes lectures in real time in 60+ languages "without adding a bot to the call"; day/week/month nodes with a Weekly Reflection template that transcribes guided voice memos to surface patterns; AI command nodes auto-fill fields. Third-party reviewers call Supertags "the most elegant structure system in the category" — **VERIFIED FACT** *(secondary, dexi.net via search)*.

**The mechanisms that make it excellent:**
1. **Schema arrives through capture, not setup** — you outline naturally; supertags retrofit structure.
2. **Tana is explicitly building a *student study system*** — courses/assignments/exam questions as first-class objects, lecture transcription, weekly reflection — which is direct competitive validation of Solis's domain.

**Transfer:**
- Mechanism 1 is the capture-side complement to Obsidian's view mechanism (§7.1): **RECOMMENDATION** Solis's NLP capture (already built) should be able to emit typed records ("exam question about sorting algorithms from today's lecture" → creates an `ExamQuestion` object linked to the syllabus node). Solis has the hard part already (syllabus trees); Tana proves the capture-schema bridge is where the magic is.
- Lecture transcription: **RECOMMENDATION** as a stretch item only — it requires audio ingestion infrastructure Solis lacks, and the meeting-notetaker space is crowded. A cheaper V2 slice: transcript/notes *import* with syllabus auto-linking.
- Weekly Reflection-with-voice is a direct V1 Weekly Review enhancer — **RECOMMENDATION** a guided voice memo whose transcript is stored with the review and mined by the deterministic engine next week.

---

## 8. AI assistants & AI planning tools

### 8.1 ChatGPT Study Mode & Claude Learning Mode — the Socratic constraint

**VERIFIED FACT** *(secondary — direct fetches of openai.com and chatgpt.com returned HTTP 403; mechanics below rest on the official announcement as relayed in search summaries plus independent reviews)*: OpenAI launched **Study Mode** in mid-2025 ("select 'Study and learn' from tools in ChatGPT") for homework help, test prep, and learning new topics; it "asks short guiding questions that lead you to the answer instead of handing it over," uses knowledge checks and step-by-step guidance, and reviews describe a "ping-pong" interactive tutoring feel rather than one-shot answers (openai.com/index/chatgpt-study-mode; moderndescartes.com; Jisc Nov 2025 — Jisc page also 403'd; Reddit thread). By Sept 2026, ChatGPT reportedly auto-places users identified as ages 13–17 into a learning-focused teen experience combining Study Mode with homework help *(secondary, single-source — treat as provisional)*.

**VERIFIED FACT** *(secondary via search)*: Anthropic launched **Claude for Education** (April 2025) with **Learning Mode** — explicitly "designed to guide students' reasoning rather than simply providing answers," a Socratic-style approach — with university-wide deals (Northeastern, LSE among early partners); an MIT report later pushed back on the gap between the Socratic promise and measured student outcomes (kingy.ai Apr 2025; tinaaustin.substack.com summaries).

**The mechanism that makes these excellent:** a **system-prompt-level behavior constraint** — the same model, *refused permission to answer*, becomes a tutor. The product innovation is governance of the AI's helpfulness, not new capability.

**Transfer:**
- **This is the highest-leverage AI transfer for Solis, and it is nearly free.** Ask Solis is already grounded in the student's own notes (per the task brief). **RECOMMENDATION:** add a **Tutor Mode** toggle to Ask Solis with a hard behavioral contract: never produce the final answer to a problem the user marks as coursework; respond with a question, a hint ladder (nudge → scaffold → worked analog), and a knowledge check before closing the loop. Ground the Socratic prompts in the student's syllabus/notes so the questioning is course-specific — something ChatGPT Study Mode cannot do. This also directly addresses the academic-integrity positioning both OpenAI and Anthropic have staked out, at zero infrastructure cost (user-key Gemini, per the task brief).
- **OBSERVED PATTERN caution:** the MIT critique suggests Socratic modes can degrade into scripted questioning; **RECOMMENDATION** make hint-ladder depth a user setting and log mode usage into analytics ("you asked Ask Solis for direct answers 14× this week") rather than moralizing.

### 8.2 Notion AI / Notion 3.0 agents — agentic workflow runs in-context

**VERIFIED FACT** (fetched notion.com/blog/introducing-notion-3-0): launched Sept 18, 2025; agents execute "multi-step workflows," "up to 20 minutes of autonomous work at a time across hundreds of pages at once"; they act on "anything a user can do in Notion" (create docs, build databases, search across tools); personalization via an instruction page that "acts like a memory bank"; **Custom Agents** (Feb 2026, 3.3) run "on schedules or triggers you set" and are shareable — task triaging, internal Q&A, daily standups, status reports (notion.com/releases/2026-02-24, via search summary); Sept 2026 (3.7) adds admin control over which models agents may use *(secondary)*. The framing shift is explicit: "Notion AI was great for quick answers and editing a single page" → now the agent "tackles real work because it understands your work and can take action"; "Context, collaboration, and now action—all in one place." **VERIFIED FACT** (fetched).

**The mechanism that makes it excellent:** **the agent operates inside the same data model it maintains.** Because the workspace is structured, agentic outputs (databases, trackers) are actionable artifacts, not chat text.

**Transfer:**
- **RECOMMENDATION:** Solis's equivalent is the **Weekly Review Agent**: a scheduled, approval-gated run that (1) reads the week's session logs, habit completion, retention decay and slippage forecasts, (2) drafts the next-week plan seeded from review outcomes (V1 already seeds next week per the task brief), and (3) presents a diff for approval — Reclaim's gate (§2.2) + Notion's in-context artifact. Deterministic engines compute the evidence; the LLM only drafts the narrative and proposed plan. This upgrades V1's weekly narrative from a report into a *proposal*.
- **EXPERT OPINION:** the memory-bank instruction page is worth copying for Ask Solis: a user-editable "how to tutor me / what my goals are" page persisted with the workspace (V1's AI key is session-scoped; the *instruction* memory can be durable even if keys aren't).
- **Cautionary:** Notion's recurring AI-pricing/usage-term changes are a persistent user-friction theme — **OBSERVED PATTERN** (Reddit discussion via search). Solis's BYO-key model is the hedge; preserve it.

### 8.3 Reflect — speed, daily notes as inbox, capture pipeline

**VERIFIED FACT** (fetched reflect.app, 2026-09-27): networked notes where you "mirror the way your mind works by associating notes through backlinks"; graph visualization; "Built for speed — Instantly sync your notes across devices"; web clipper (Chrome/Safari) saving snippets and Kindle highlights; Google Calendar/Outlook import with agendas tied to meeting notes; multi-model AI ("Anthropic, OpenAI, and Google") for voice-note transcription, article outlines, meeting takeaways; end-to-end encryption; one price ($10/mo annual) including AI. Reflect is consistently described around backlinks + daily journaling as the core loop — **OBSERVED PATTERN** (producthunt.com and second-brain write-ups via search).

**The mechanism that makes it excellent:** **the daily note as zero-friction inbox** — capture always lands in one place; linking happens lazily afterwards. Speed is treated as the feature.

**Transfer:**
- **RECOMMENDATION:** Solis's capture surface should follow the same contract: everything (task, note, question, quote) lands in *today's* note/plan by default; typing/classification is a later one-gesture operation (this pairs with Tana-style supertagging in §7.3).
- **Capture pipeline for reading:** a clip/highlight import (web clipper; Kindle/Readwise-style) is a natural V2 input for the Notes module — for students this means lecture slides, PDFs and web sources flowing into the same wiki-link graph that Ask Solis grounds on. **VERIFIED FACT** the pattern works commercially (Reflect, Readwise integration cited on its page).

### 8.4 Mem — self-organizing notes, and the cost of weak foundations

**VERIFIED FACT** *(secondary, via search: Medium "Mem AI 2.0" review; fahimai.com; vendor positioning)*: Mem 2.0 (2025) repositions as "Your AI chief of staff" — capture without manual organizing, AI-built "durable, visible memory," voice mode; reviewed as "genuinely fast" post-relaunch, but Mem 1.0's history of "terrible UI and a nearly useless mobile app" still shadows it; alternative-listicles persist.

**The mechanism that makes it excellent (in theory):** **organization as inference** — the system assembles structure from content, removing the taxonomist's burden.

**Transfer:**
- **OBSERVED PATTERN / EXPERT OPINION:** Mem is the category's cautionary tale for "AI organizes everything" — when the base note UX is weak, AI organization can't compensate, and trust in auto-structure is hard to win back. **RECOMMENDATION:** Solis should keep organization *deterministic and visible* (typed records + explicit links, §7) and use AI for **suggestions** (link suggestions, flashcard generation — already present in V1) rather than silent auto-filing. "Related Content that surfaces unlinked connections" (Capacities, §9.2) is the safer version of Mem's idea.

### 8.5 Perplexity (incl. Comet) — research with receipts, in context

**VERIFIED FACT** *(secondary, via search summaries: aitoolsofficial.com 2026; ai.plainenglish.io Aug 2025; suprmind.ai)*: Perplexity's core loop — cited, source-linked answers with Deep Research/Labs/Spaces — extended in 2025 into **Comet**, a free AI-native browser that "researches, summarizes, and automates tasks as you browse," positioned with student use cases (research summaries, study help without tab-hopping). Academic work (arXiv BrowseSafe-Bench, via search summary) documents prompt-injection risks in browser agents — relevant caution.

**The mechanism that makes it excellent:** **answers arrive with verifiable provenance and stay in the user's working context.**

**Transfer:**
- Ask Solis's grounded Q&A already has the provenance half (answers cite the student's notes). **RECOMMENDATION:** extend grounding to *imported* sources (§8.3) so citations can point at "Lecture 7, slide 12" — provenance over the student's own materials is the defensible moat vs. general AI chat, and it sidesteps the accuracy wars of open-web RAG.
- **Cautionary (browser agents):** Comet-style autonomy carries documented prompt-injection risk — **VERIFIED FACT** (arXiv via search). Solis's V2 AI scope should stay inside Solis's own data; do not build browser automation into the roadmap.

---

## 9. Personal operating systems & all-in-one workspaces

### 9.1 Notion (workspace layer) — and what a student OS should *not* copy

**VERIFIED FACT** (fetched blog post + releases, above): Notion's trajectory — docs (1.0) → databases/integrations (2.0) → contextual AI answers (Notion AI) → autonomous in-workspace agents (3.0, Sept 2025) → scheduled custom agents (3.3, Feb 2026) — is the industry's clearest template for "the workspace becomes the agent's body." Pricing/usage-term churn is a persistent friction theme — **OBSERVED PATTERN** (search summaries).

**Transfer:**
- **EXPERT OPINION:** Notion's breadth is exactly what a *student* OS should avoid copying: students abandon Notion not for lack of features but for lack of opinionated defaults (the blank-page problem). Solis's value is the opposite bet — opinionated study workflows (rituals, reviews, FSRS) with structure pre-built. **RECOMMENDATION:** take Notion's *agentic-in-workspace* architecture (§8.2) and its *database-as-artifact* pattern, take none of its configuration surface.

### 9.2 Capacities — objects, daily inbox, and suggested connections

**VERIFIED FACT** (fetched capacities.io, 2026-09-27): "connected objects, not files buried in folders"; custom object types ("A meeting becomes a Meeting object…"); properties per type; bidirectional links and backlinks ("Link anything to anything"); **Related Content** — "scans your notes and surfaces places you wrote about something but never linked"; **daily note as inbox** — "Your daily note is your inbox. No pressure to organize. Just capture and link as you go"; calendar integration auto-creating objects from events; AI assistant; GDPR-friendly EU hosting; Pro ~$9.99/mo. Reviewers position it as the middle ground between Notion's structure and Obsidian/Roam's freeform linking — **OBSERVED PATTERN** (atlasworkspace.ai Aug 2026; skywork.ai summaries).

**The mechanism that makes it excellent:** **structure without filing** — typed objects give queries and consistency, while the daily-note inbox removes capture friction; the two halves solve the two failure modes (chaos and rigidity) simultaneously.

**Transfer:**
- This is the *cleanest synthesis* of what Solis Notes should become: daily-note inbox (Reflect, §8.3) + typed objects (Tana/Obsidian, §7) + **Related-Content suggestions as the only "auto-organization"** (deterministic embedding/keyword matching can do this; no LLM required — **RECOMMENDATION** implement as a deterministic candidate-link suggester with one-tap accept, feeding the existing knowledge graph).
- Calendar-event → object auto-creation maps to Solis's plan-item → note/record creation (V1 auto-logs study sessions per the task brief; generalize the pattern).

---

## 10. Collaboration software patterns worth borrowing

### 10.1 Linear — triage, cycles, priority inbox (and the "Rituals" correction)

**Verification note on the brief's assumption:** **no "Rituals" feature exists in Linear's changelog.** Multiple targeted searches of linear.app surfaces found no such feature; Linear's methodology content explicitly pushes back on agile ceremony; the recurring-work mechanism is **recurring issues / repeat settings**, and standups live in Slack integrations. A competing tool (Height) does ship a feature named "Rituals" — likely the source of conflation. **VERIFIED FACT** *(absence claim per exhaustive search of linear.app via site-scoped queries; single-source confirmation of Height's feature)*.

**VERIFIED FACT** (fetched linear.app, 2026-09-27): Linear's actual mechanism set — **Cycles** (recurring time-boxed sprints, e.g., "Cycle 144"); **Triage** now augmented by "Triage Intelligence" that auto-labels new issues within minutes; **Priority Inbox** ("The new Priority tab separates what needs your attention from what can wait"); issue workflow states; project updates; **Loops** — "recurring agent workflows for teams" that react to workspace activity; **Intake** converting Slack conversations into routed, labeled issues.

**The mechanisms that make it excellent:**
1. **Triage as a single queue of decisions** — everything incoming waits in one place; the user processes the queue, not ten notification surfaces.
2. **Cycles as an enforced rhythm** — the unit of commitment is the cycle, and the system computes cycle health.
3. **Agents embedded in the queue, on schedules** (Loops) rather than in chat.

**Transfer:**
- **RECOMMENDATION (strongest collaboration transfer):** build Solis's dashboard around a **triage queue**: incoming items (new assignments captured, NLP captures awaiting classification, retention alerts, drift warnings, habit misses) accumulate in one "needs a decision" inbox with keyboard-first batch processing. V1's proactive retention alerts and drift warnings (per the task brief) currently compete for attention with everything else; a queue converts them from nagging into workflow.
- **Weekly cycles** map 1:1 to Solis's week (students already live in weeks): treat the Weekly Review as the cycle-closing ritual with computed "cycle health" (plan completion %, retention trend), and cycle-opening as next-week seeding (exists in V1 — formalize the language).
- **Loops** = the scheduled Weekly Review Agent from §8.2. Same idea, different vocabulary.

### 10.2 Figma comments — decisions pinned to the work

**VERIFIED FACT** (help.figma.com via search summary; the full docs page body did not render): comments pin in-context — "In presentation view, select a comment to open its thread and reply. Select a comment pin to open the message" — with threaded replies and resolution; a long-standing community request notes comments pin to the topmost frame rather than sub-elements (a known limitation). **OBSERVED PATTERN:** Figma's review culture (in-context threads → resolve) is widely credited with keeping feedback attached to the artifact rather than in email/chat.

**The mechanism that makes it excellent:** **the artifact is the place where discussion happens**, and "resolve" is an explicit, visible commitment made by the author.

**Transfer:**
- **RECOMMENDATION:** add **pinned discussion threads to plan items and notes** in Solis's realtime Study Rooms (chat exists per the task brief; it's unanchored). "Why did you move this revision?" pinned to the plan item; "is this proof right?" pinned to a note paragraph; each thread resolvable by the owner. This turns a study room from a chatroom into a *review surface* over shared artifacts — the mechanism, not the features, is what transfers.
- **Scope guard:** V1's rooms are presence + chat + pacts; a thread-object model is a moderate addition and should ride on the same realtime event stream the rooms already use.

### 10.3 Focusmate — pre-commitment and structured body doubling

**VERIFIED FACT** (fetched focusmate.com, 2026-09-27): virtual body doubling — "working on any task with another person present, without them participating in your task"; 25/50/75-minute sessions; camera-on requirement; three-step session flow (greet + declare goals → work → check in and celebrate progress); calendar invites; favorite-partner rebooking; scale claims of 12M+ sessions, 500M+ focus minutes, 150+ countries; free tier of 3 sessions/week, Plus $8/mo (annual). A testimonial from Nir Eyal frames it as "built around pre-commitment pacts." **OBSERVED PATTERN** (Trustpilot, abbyvolk.com Sep 2025, focusmo.app, flown.com): strong retention among ADHD users; the *goal declaration and end-of-session check-in* are repeatedly named as the effective parts, not the co-worker interaction itself.

**The mechanism that makes it excellent:** **social pre-commitment with a declared goal and a scheduled post-hoc accounting** — the pair format turns "I should study" into an appointment someone is expecting you at.

**Transfer:**
- Solis's Study Rooms already have presence, a synced timer and **study pacts** (per the task brief) — Focusmate validates the direction and specifies the *missing micro-mechanics*: **RECOMMENDATION** add (1) a mandatory **goal declaration** when joining a room session (stored, displayed, and reflected in the post-session summary — V1's post-session reflection can absorb this), (2) a **closing check-in prompt** ("did you do what you declared?") whose answer feeds the momentum/analytics engine, and (3) **scheduled recurring room sessions** (book your study slot in advance, invite auto-sent). All three are modest realtime additions with outsized accountability yield.
- **EXPERT OPINION:** pairing-with-strangers (Focusmate's core) is *not* recommended for V2 — it's an operations-intensive trust surface; structured commitments among *existing* room members capture most of the mechanism at a fraction of the risk.

---

## 11. Synthesis — what to actually take into Solis V2

### 11.1 Top transferable mechanisms (ranked by value-to-effort for a student OS)

| # | Mechanism (source) | Where it lands in Solis | Why it wins for students | Cost |
|---|---|---|---|---|
| 1 | **Socratic constraint mode** (ChatGPT Study Mode, Claude Learning Mode) | Ask Solis "Tutor Mode" | Integrity-safe tutoring grounded in the student's own notes — the differentiator no general chatbot has | Very low (prompt layer) |
| 2 | **Habit-as-flexible-calendar-event with approval gates** (Reclaim) | Habits + daily plan fusion | Habits survive real weeks; trust preserved by approve-diffs | Medium |
| 3 | **Per-item slippage forecasting** (Motion's Do Date ≠ Due Date, extended from V1's exam feasibility) | Deterministic engine + intelligence brief | "You will miss this" said 2 weeks early is the most valuable sentence a study app can say | Low (existing data) |
| 4 | **Triage inbox** (Linear) | Dashboard "Needs a decision" queue | Converts alerts into workflow; matches student attention reality | Medium |
| 5 | **Estimation calibration loop** (Toggl 2.0's planned-vs-actual) | Plan items + next-week seeding | The app gets measurably smarter about *your* pace every week | Low (deterministic) |
| 6 | **Typed study records + saved views** (Obsidian Bases, Tana supertags, Capacities objects) | Notes module | Structure that feeds FSRS/mastery; exam questions become queryable assets | Medium |
| 7 | **Focus stakes: growth/loss visual** (Forest) | Focus Room + tab defense | Loss aversion on top of existing enforcement; zero backend | Very low |
| 8 | **Goal declaration + closing check-in in rooms** (Focusmate) | Study Rooms | Turns presence into accountability; feeds analytics | Low |
| 9 | **Personalized break/energy scheduling** (Rize adaptive breaks, Reclaim buffers) | Focus Room + timeline | Circadian engine finally *acts*, not just reports | Low–medium |
| 10 | **Weekly Review Agent with approve-diff** (Notion 3.0 agents, gated per Reclaim) | Weekly Review | The narrative becomes a proposal; agentic feel without autonomy risk | Medium |
| 11 | **Daily-note inbox capture → typed records** (Reflect, Capacities, Tana) | Capture surfaces | Kills capture friction; feeds the graph and the engine | Medium |
| 12 | **Mood × performance correlation** (Habitify mood tracking) | Evening ritual + analytics | Adds the *why* dimension; deterministic correlation views | Low |
| 13 | **Sensory completion + shareable streak surfaces** (Superlist, Streaks) | Task/session completion, streaks | Cheap delight and social artifacts that drive retention | Very low |
| 14 | **Related-content link suggestions** (Capacities Related Content) | Notes knowledge graph | The safe version of "AI organizes everything" — suggest, never auto-file | Low–medium |

### 11.2 What *not* to copy — anti-patterns observed

- **Silent autonomous replanning** (Motion's core loop): highest trust cost in the category. Every AI-proposed change must pass an approval diff. **EXPERT OPINION**, grounded in the Motion/Reclaim contrast above.
- **Team-calculus features with network dependencies** (Clockwise, verified sunset March 27 2026): every Solis feature must deliver value for a solo user with zero classmates on board.
- **Platform rewrites before shipping** (Logseq DB-version, 2024–2026): evolve the Supabase schema incrementally (§7.2).
- **AI-organized-no-structure** (Mem 1.x): weak base UX + magical auto-organization loses trust irrecoverably; suggest, don't file (§8.4).
- **Premium-priced AI moats** (Superlist $25/mo backlash; Notion term churn): BYO-key is Solis's structural advantage; defend it (§3.4, §8.2).
- **Karma-style box-checking economies** (Todoist): if momentum is gamified, key it to study minutes and retention, not task counts — or it will reward busywork (§3.1).
- **Streaks without mercy** (Streaks): add exam-mode grace/freeze or the tracker becomes an attrition machine every semester (§4.2).
- **Browser-agent autonomy** (Perplexity Comet + documented injection risk): keep AI inside Solis's own data surface in V2 (§8.5).

### 11.3 RECOMMENDATION — the V2 thesis in one paragraph

Every adjacent winner above succeeds by closing a loop the category usually leaves open: capture→structure (Tana/Capacities), plan→actual (Toggl), schedule→defense (Reclaim), alert→decision (Linear), presence→commitment (Focusmate), answer→understanding (Study Mode). Solis V1 already owns the rarest asset in this space — a **deterministic intelligence engine** with circadian, retention and health models. The V2 move is to *wire those models into action through trust-preserving interaction patterns*: approval-gated proposals (Reclaim/Notion), a triage queue (Linear), a Socratic Tutor Mode grounded in the student's own notes (Study Mode), flexible habit scheduling fed by measured capacity (Reclaim/Rize), and typed study records that make the engine's inputs structured (Obsidian/Tana/Capacities). That combination — deterministic personal models + agent proposals + human approval — is a mechanism-level position none of the surveyed products occupies for students.

---

## 12. Sources

### 12.1 Fetched directly in this session (primary; 2026-09-27)

- Motion — https://www.usemotion.com
- Reclaim.ai — https://reclaim.ai
- Clockwise — https://www.getclockwise.com (sunset notice)
- Linear — https://linear.app
- Habitify — https://habitify.me
- Rize — https://rize.io
- Superlist — https://superlist.com
- TickTick — https://ticktick.com
- Todoist — https://todoist.com
- Focusmate — https://www.focusmate.com
- Capacities — https://capacities.io
- Reflect — https://reflect.app
- RescueTime — https://www.rescuetime.com
- Tana for students — https://outliner.tana.inc
- Notion 3.0 — https://www.notion.com/blog/introducing-notion-3-0
- Obsidian Bases changelog — https://obsidian.md/changelog/2025-05-21-desktop-v1.9.0
- Obsidian Bases help — https://obsidian.md/help/bases (fetched; only title rendered — body not available)

### 12.2 Relied on via search-result summaries (secondary; direct fetch blocked or not performed)

- ChatGPT Study Mode — https://openai.com/index/chatgpt-study-mode ; https://chatgpt.com/features/study-mode ; https://www.moderndescartes.com/essays/study_mode ; https://nationalcentreforai.jiscinvolve.org/wp/2025/11/14/chatgpts-study-mode-what-i-wish-id-had-as-a-student (all 403 to direct fetch)
- Claude for Education / Learning Mode — https://kingy.ai (Apr 2025 analysis); tinaaustin.substack.com (MIT critique coverage)
- Notion releases — https://www.notion.com/releases ; https://www.notion.com/releases/2026-01-20 ; https://www.notion.com/releases/2026-02-24
- Mem 2.0 — https://medium.com/@danielasgharian/mem-ai-2-0-why-im-finally-excited-about-this-note-taking-app-again-2f1e0e90cc87 ; fahimai.com review
- Perplexity Comet — https://aitoolsofficial.com ; https://ai.plainenglish.io ; https://suprmind.ai ; arXiv BrowseSafe-Bench (prompt injection in AI browsers)
- Logseq DB — https://discuss.logseq.com (changelog threads; "DB Version Release Schedule?" Oct 2024) ; https://github.com/logseq/logseq
- Things 3 — https://www.techradar.com (review May 30 2025) ; https://focuzed.io (Sept 2025) ; imore.com ; igeeksblog.com ; https://www.jotform.com (2026 daily-planning roundup)
- Streaks — https://apps.apple.com (Streaks listing) ; https://productivity.directory (Streaks Review 2025) ; https://humanpicks.com (Feb 2026)
- Forest — https://apps.apple.com (Forest listing) ; Lemon8 user review (2026)
- Toggl — https://saasgenius.com (Oct 2025) ; https://community.toggl.com (Toggl 2.0 feedback, Jul 2025) ; https://apps.apple.com (Toggl listing, Sep 2026)
- Rize corroboration — https://memtime.com ; https://theprocesshacker.com (2024) ; https://efficient.app
- Reclaim corroboration — https://pipeline.zoominfo.com (Aug 2026) ; https://www.saner.ai
- Motion corroboration — https://max-productive.ai (Aug 2025) ; https://akiflow.com (Dec 2025) ; https://techpoint.africa (Mar 2025)
- Todoist corroboration — https://www.klika.us (Jan 2025) ; https://resolutely.app ; https://declutterthemind.com (Aug 2025) ; https://ones.com (Aug 2026)
- Superlist corroboration — https://play.google.com/store/apps/details?id=com.superlist.superlist ; https://www.tool-atlas.com ; https://hypertools.so
- Focusmate corroboration — https://www.trustpilot.com ; https://www.abbyvolk.com (Sep 2025) ; https://focusmo.app ; https://flown.com
- Capacities corroboration — https://www.atlasworkspace.ai (Aug 2026) ; skywork.ai
- Obsidian Bases corroboration — https://www.xda-developers.com/obsidians-new-bases-feature-replacing-notion-workflow-for-good ; Reddit r/ObsidianMD announcement thread (Aug 2025)
- Tana corroboration — https://dexi.net
- Figma comments — https://help.figma.com ("Comment on prototypes" help article)
- Clockwise/Salesforce reporting — The Register (via search-result summary)
- Reflect corroboration — https://www.producthunt.com (NotesMigrator alternatives)
- TickTick corroboration — https://www.capterra.co.za ; https://tooltivity.com (Jul 2026)

*Note: URLs in §12.2 were surfaced and summarized by search results; they were not all fetched individually. Claims drawn from them are labeled accordingly in the body.*
