# 03 — Competitor Research: Study-Productivity in 2026

**Date compiled:** 2026-09-27
**Method:** Web search plus direct page fetches of official product/pricing/app-store pages (listed in Sources). Claims are labeled:

- **VERIFIED FACT** — read this session on a primary source (official site, app-store listing, changelog/releases page). Where the only source is a dated secondary article, that is stated.
- **OFFICIAL CLAIM (UNVERIFIED)** — a number/claim stated on the vendor's own page that was not independently corroborated (user counts, success-rate stats).
- **OBSERVED PATTERN** — a pattern seen across multiple secondary sources/search results, not confirmed on a primary page.
- **REVIEWER OPINION / EXPERT OPINION** — judgment quoted or synthesized from reviewers.
- **RECOMMENDATION** — my judgment for Solis V2, derived from the above.

**Fetch failures noted up front:** `quizlet.com/upgrade` and `quizlet.com/subscribe` returned HTTP 403, `knowt.com/pricing` returned 404, `turbolearn.ai` 301-redirected to `turbo.ai` (followed). Quizlet pricing therefore rests on one recent secondary source (Aicademy, updated Aug 29 2026) and is labeled accordingly. Todoist's live pricing page rendered feature names but stripped dollar amounts; the prices below come from Todoist's own pricing-update pages surfaced in search results.

Solis V1 facts referenced throughout come from the ask (direct code inspection of this repository) and are treated as given.

---

## 1. Category map

The "study productivity" category has fragmented into five stacks. Few products span more than two:

| Stack | Representative products | Core job |
|---|---|---|
| **Student scheduling/planning** | MyStudyLife, Motion, Reclaim.ai, Todoist, Notion + templates | "What do I do, when?" |
| **Learning & spaced repetition** | Anki, RemNote, Quizlet, Brainscape, Knowt, Gizmo, Vaia (StudySmarter) | "Do I actually know this?" |
| **AI content machines** (2024–26 wave) | Turbo AI (ex-TurboLearn), StudyFetch, Knowt, Gizmo, Flashka, Alice.tech | "Turn my lecture/PDF into notes, cards, quizzes" |
| **Focus & accountability** | Forest, Focusmate, Flow Club, LifeAt, Study Together/StudyStream, Saner.ai | "Make me start and keep going" |
| **All-in-one student OS** (thin or absent) | MyStudyLife (closest), Vaia, Knowt (aspiring) | Whole-semester cockpit |

**Solis V1 already spans four of the five stacks** (planner cockpit, FSRS/SM-2 learning, focus room, realtime study rooms, notes with wiki-links) — a footprint none of the profiled competitors matches (VERIFIED FACT about Solis, per code inspection given in the ask; OBSERVED PATTERN across the profiles below).

---

## 2. Product profiles

### A. Student planning & scheduling

#### MyStudyLife
- **Positioning (VERIFIED FACT, mystudylife.com + App Store):** "Free student planner — forever"; classes, homework, exams, activities, revision in one app. 4.5★/6.2K ratings on iOS App Store.
- **Pricing (VERIFIED FACT, App Store in-app purchase list):** MyStudyLife+ $6.99/mo or $39.99/yr; Family Connect tiers $9.99–$19.99/mo (1–5 students); "MSL Premium Weekly $2.99". Core planner free. Site claims no ads, no data selling, GDPR/FERPA alignment.
- **Standouts:** Rotating/A-B timetables; **Schedule Scan** (timetable from a photo); **Family Connect** parent app; **MyStudyLife for Schools**; syncs Google/Apple/Outlook calendar, iCal, Blackboard, Canvas; widgets.
- **AI shipped (VERIFIED FACT):** **Scout**, an AI study coach — "turns one sentence into a fully planned week — schedule, tasks and revision"; plan-my-week and due-tomorrow queries in plain language. Built-in Pomodoro focus timer.
- **Collaboration:** Family/parent visibility; institutional edition. No peer study layer.
- **Weaknesses (REVIEWER OPINION, search summaries):** Premium gating of grade tracking/widgets annoys some users; planner is strong on scheduling but shallow on actual learning science (no SRS).

#### Todoist (student flows)
- **Positioning:** Generic but student-heavy task manager; large template ecosystem.
- **Pricing (VERIFIED FACT via official pricing-update pages quoted in search):** Pro rose **$5→$7/mo monthly and $48→$60/yr ($4→$5/mo)** effective **December 10, 2025**; Business $8→$10/user/mo (monthly). Beginner (free): 5 personal projects, 3 filter views. Live `todoist.com/pricing` fetch confirmed the free-tier shape (5 projects, 1-week activity history) and AI feature names but prices were stripped from the scrape.
- **AI shipped (VERIFIED FACT, pricing page):** **Task Assist**, **Filter Assist** (natural-language filters), **Email Assist**, **Ramble** (voice capture; unlimited on Pro). Task breakdown and tips on Pro.
- **Student angle (VERIFIED FACT via Student Beans/Student App Centre in search):** 20% off annual and 3 months free via third-party student verification, not a first-party program.
- **Weaknesses (REVIEWER OPINION):** No calendar-native scheduling of study; price increase tested goodwill; not study-science aware.

#### Motion
- **Positioning:** AI-first auto-scheduling task+calendar app; now marketing itself as an AI work platform.
- **Pricing (VERIFIED FACT, usemotion.com/pricing, Sept 2026):** Pro AI **$19/seat/mo** and Business AI **$29/seat/mo** (annual toggle shown; page carried transitional "This plan is not available" labels — treat exact live price as in flux; search sources cite $19–29 range). **AI credit metering:** 7,500 credits/seat/mo (Pro) and 15,000 (Business) with **overtime rate "25 cents/100 credits"**. No permanent free tier (OBSERVED PATTERN across reviews).
- **Standouts:** Autonomous task→calendar scheduling with auto-rescheduling; AI Project Manager, AI Gantt, AI Meeting Notetaker, AI Docs.
- **AI shipped:** Essentially the whole product; multi-surface agents + credit-metered usage.
- **Collaboration:** Teams tier with capacity planning, dashboards, permissions.
- **Weaknesses (REVIEWER OPINION, consistent across 2026 reviews):** Expensive vs. Todoist-class tools; overkill for simple capture; learning curve.

#### Reclaim.ai
- **Positioning:** Defensive AI scheduling layer over existing calendars; increasingly "AI agents for your week."
- **Pricing (VERIFIED FACT, reclaim.ai/pricing):** Lite free; Starter $10/seat/mo yearly ($12 monthly); Business $15 ($18); Enterprise $22 (yearly only). Sells add-on "Attendee User" packs (e.g., $8/mo for 3 on Starter).
- **Standouts (all VERIFIED FACT from pricing page):** AI Focus Time, AI Habits, AI Tasks, AI Smart Meetings, AI Buffer Time, AI Planner, AI Time Tracking, an AI Assistant chat, and **tiered "AI Agents" counts (5 on Lite → unlimited on Enterprise)** — agents are now a plan feature, not a demo.
- **Collaboration:** Team OOO calendar, workforce analytics, smart scheduling links.
- **Weaknesses (REVIEWER OPINION):** Requires living in Google/Outlook; task sources via integrations rather than native depth; not student-oriented (no terms/exams concept).

#### Notion (+ student template economy)
- **Positioning:** Workspace students assemble themselves; huge template marketplace (official marketplace claims 30,000+ templates; VERIFIED FACT as a claim on notion.com).
- **Education pricing (VERIFIED FACT, notion.com/students):** **Plus plan free** for individual students with an institution email (WHED-verified); K-12 excluded from that offer; student orgs get Plus free.
- **AI shipped (VERIFIED FACT via official changelog surfaced in search):** **Notion 3.0 (Sept 18, 2025) rebuilt Notion AI as Agents** — agents that can operate across pages/databases for multi-step tasks (reported ~20-minute autonomous runs). Standalone AI add-on discontinued for new subscribers, moving to plan/usage-based pricing (OBSERVED PATTERN in search; ~$10 per 1,000 credits for custom agents).
- **Collaboration:** Realtime multi-user, sharing, publishing.
- **Weaknesses (REVIEWER OPINION, widespread):** Blank-canvas cost; students buy $20–40 templates and still spend hours maintaining them; no learning science; the 2026 student-template wave now ships with AI prompt presets bolted on (OBSERVED PATTERN, 2sync/bullet.so template roundups).

### B. Learning & spaced repetition

#### Anki
- **Positioning:** Open-source gold standard for long-term retention; free everywhere except iOS.
- **Pricing (VERIFIED FACT + secondary):** Free (desktop/web/Android); AnkiMobile ~$24.99 one-time (secondary, Aicademy Aug 2026).
- **2025–26 state (VERIFIED FACT, github.com/ankitects/anki/releases):** Active release cadence — **26.09.3 (Sept 23, 2026)** current; 26.08/26.09 updated to **fsrs-rs 6.6.1/6.6.2**, experimental editor rewrite behind a new Experiments preferences section, security fixes in 26.09. FSRS is the modern default scheduler for serious users (secondary: flashcard-maker.cc, July 2026, claims FSRS on by default for new installs — plausible but not independently confirmed here).
- **Weaknesses (REVIEWER OPINION, consistent):** Dated UI, steep learning curve, you author your own cards, ecosystem fragmentation (add-ons, AnkiDroid drift).
- **Signal:** The most influential algorithm in the category is being shipped as a versioned, maintained core — anyone building SRS in 2026 is benchmarked against FSRS.

#### RemNote
- **Positioning:** Notes + spaced repetition unified ("powerful all-in-one for committed students" — reviewer quote via shouldiuse.io).
- **Pricing (VERIFIED FACT, remnote.com/pricing):** Free (unlimited notes/cards, 250 AI credits/mo, 5 AI cards/mo); **Pro $8/mo ($96/yr)**; **Pro with AI $18/mo ($216/yr, 20,000 AI credits/mo, 1,000 AI cards/mo, lecture recorder, AI grading/chat)**. Monthly/Yearly/Lifetime toggles; EDU plan referenced.
- **Standouts:** PDF annotation, image occlusion, incremental reading, custom schedulers, local knowledge bases, plugin system.
- **Weaknesses (REVIEWER OPINION):** Steep learning curve; AI tier is pricier than rivals; complexity creep.

#### Quizlet
- **Positioning:** Mass-market study sets; largest distribution, most contested goodwill.
- **Pricing (secondary source, dated Aug 29 2026 — quizlet.com blocked direct fetch):** Quizlet Plus ~**$7.99/mo or $35.99/yr**; Plus Unlimited ~$9.99/mo; free tier caps Learn/Test modes.
- **AI shipped (secondary, consistent with search):** **Q-Chat AI tutor (launched Mar 2023) retired in 2025**; AI features (study-guide/flashcard generation) folded into Plus.
- **The cautionary tale (OBSERVED PATTERN across Aicademy, Fora Soft, Knowt marketing):** Quizlet moved once-free Learn/Test modes behind Plus and killed Q-Chat; competitors (Knowt, Anki-adjacent apps) now lead their pitches with "what Quizlet used to give free."
- **Weaknesses:** Paywall-driven churn; free tier increasingly hollow.

#### Brainscape
- **Positioning:** Learning-science-first flashcards with confidence-based repetition and certified/expert deck catalog.
- **Pricing (VERIFIED FACT, brainscape.com/pricing):** Basic free (unlimited own cards, AI generation of "100s of cards," 2,500 pre-loaded cards); **Pro $7.99/mo** (unlimited AI cards, unlimited certified decks); Enterprise with "up to 70% savings." Note: a Sept 2026 review (languavibe.com) cites $19.99/mo, $59.99/6-mo, $95.99/yr, $199.99 lifetime — the official page's single $7.99 figure suggests that review reflects stale/regional pricing; the official page is the better source.
- **Weaknesses (REVIEWER OPINION):** Less modern UI; free tier narrow; catalog-centric rather than tool-centric.

#### Knowt (emerging, 2025–26 riser)
- **Positioning (VERIFIED FACT, knowt.com):** "The #1 Quizlet Alternative with AI Study Tools"; "5 million students & teachers have switched" and "50% of all AP Students use Knowt" (OFFICIAL CLAIMS, UNVERIFIED); 4.8★/6,200+ reviews claimed.
- **Pricing:** Core study modes explicitly free — "unlimited rounds of our free learn mode, matching game, spaced repetition or practice test mode"; paid Student/Teacher/School plans exist but weren't priced on the page fetched (knowt.com/pricing 404'd).
- **Standouts:** Quizlet set import; AI Lecture Notetaker, PDF/video/PPT summarizers; **"Kai"** AI assistant for voice tutoring and podcast generation; AP/ACT/SAT hubs, Free-Response Room with automatic grading; 5M+ resource library (official claim).
- **Collaboration:** Shared decks/library; teacher plans.
- **Strategic read:** The category's clearest free-tier attack — monetizing schools and exam-prep verticals rather than paywalling study modes.

#### Gizmo
- **Positioning (VERIFIED FACT, gizmo.ai):** "Get addicted to learning" — auto-flashcard/quiz generation from YouTube, PDF, PPT, notes; Gizmo Live. Pricing not shown on page (testimonial: "basically free"); competitors list it at ~$8/mo (secondary: fluxo.today/toolquestor comparisons — treat as unconfirmed).

#### Vaia (formerly StudySmarter)
- **Positioning (VERIFIED FACT, vaia.com/en-us):** "The #1 learning app for university & school," **"40 Million + Students"** (OFFICIAL CLAIM, UNVERIFIED), "94% of users achieve better grades" (OFFICIAL CLAIM, marketing). Rebrand to Vaia in US/Spain confirmed via official newsroom surfaced in search; legal entity StudySmarter; raised $15M Series A (Owl Ventures) in 2021 (older fact).
- **Standouts:** Vaia AI, **Exam AI** (graded mock exams with feedback), lecture-slide→flashcards, study sets/notes/modes incl. spaced repetition, mock exams, textbooks; Apple "App of the day."
- **Pricing:** Heavy free positioning; Premium exists (footer "Cancel Premium"); exact prices vary by region (not shown on page fetched).
- **Weaknesses (REVIEWER OPINION):** Ad/funnel-heavy free tier; breadth over depth; AI claims outrun demonstrable scheduling depth.

### C. AI content machines (the 2024–26 wave)

#### Turbo AI (formerly Turbolearn)
- **Positioning (VERIFIED FACT, turbo.ai):** "The fastest way to learn anything"; "10,000,000+ learners," 4.8★ with 300k+ reviews (OFFICIAL CLAIMS). Rebrand from TurboLearn confirmed by the redirect.
- **Standouts:** Upload lectures/PDF/YouTube/notes → AI Notetaker records lectures and takes notes; endless question generation; flashcards; chatbot; AP study guides; live collaborative docs (Google-Docs-style editing — notable: collaboration entering the AI-notes wave); STEM formulas/diagrams.
- **Pricing:** Free tier confirmed ("note generation, flashcards, and quizzes"); paid tier exists, prices not shown on page (secondary roundups price it ~$9–15/mo — UNCONFIRMED).

#### StudyFetch
- **Positioning (VERIFIED FACT, studyfetch.com):** "The Top AI Learning Platform"; 8M+ users; founded 2023 (schema data). **Sparky** AI tutor (page name; some press uses "Spark.E"), Study Plan with milestones and **cram mode**, **Live Lecture** real-time note generation, **Arcade** gamified challenges, audio recaps, explainer videos, citations back to source material.
- **Claims to note:** "92% of regular active users reported grade improvements," "30% reduction in average study time" from a 1,000-student Dec 2024 finals study (OFFICIAL CLAIMS, UNVERIFIED; no methodology shown).
- **Pricing:** "Getting started is free"; premium tiers not shown on page.
- **Weaknesses (REVIEWER OPINION):** Claims-heavy marketing; depth beyond generation (scheduling, habits) absent.

#### Alice.tech and Flashka (early movers to watch)
- **Alice.tech** — Copenhagen, YC-backed, 2025 Series A (secondary: hokai.io, Aug 2026); turns uploaded course notes into flashcards, quizzes, and **AI-graded mock oral and written exams**. Notably exam-simulation-shaped rather than card-shaped.
- **Flashka** — lecture notes→flashcards, European seed round (secondary, Aug 2026).
- Both are second-iteration attempts on the same "notes→recall" loop; differentiation is drifting toward *assessment* (mock exams) rather than *generation*.

### D. Focus & accountability

#### Forest
- **Positioning (VERIFIED FACT, App Store):** "The focus timer used by 60 million people worldwide" (OFFICIAL CLAIM); 4.8★/49K ratings; top productivity app in 136 countries (OFFICIAL CLAIM).
- **Pricing (VERIFIED FACT, App Store):** Free with ads/IAP; **Forest Plus subscription $5.99/mo or $35.99/yr ("Early Bird")** plus cosmetics ($1.99 items). Real-tree planting partnership (Trees for the Future, 2M+ trees — official claim).
- **Standouts:** Loss-aversion gamification (tree withers if you leave), app blocking with Allow Lists + scheduled **Time Guard** windows (iOS 16+), group planting, Apple Health sync, stats as a visual forest.
- **Weaknesses (REVIEWER OPINION, App Store reviews):** Clunky friends feature; app slowdown with lots of logged data; shallow beyond the timer.

#### Focusmate
- **Positioning (VERIFIED FACT, focusmate.com/pricing):** 1:1 video coworking/body doubling. **Free: 3 sessions/week; Plus $8/mo billed annually ($12 monthly), unlimited sessions**; Business custom.
- **Weaknesses (REVIEWER OPINION):** Random partners vary in quality; camera-on is a barrier for some.

#### Flow Club (premium end of body doubling)
- **Positioning (VERIFIED FACT, flow.club):** Hosted small-group focus sessions (up to 9 people, 30 min–3 hr; 60-min most popular); 1,200+ hosts; 400K+ sessions / 3M+ hours since 2021 (OFFICIAL CLAIMS). Strong ADHD targeting: "62% of 245 surveyed members identify as ADHD" (official survey claim).
- **Pricing (VERIFIED FACT):** **$40/mo or $400/yr; 50% student discount**; hosts earn discounts.
- **Signal:** People pay SaaS prices for *co-presence* — and the market prices students at half. A free, productized version of this is an open flank.

#### LifeAt and virtual study rooms
- **LifeAt (VERIFIED FACT, lifeat.io):** "Immersive workspace" combining tasks + focus ambiance + calendars + co-working; 10M+ users claimed; popular with ADHD professionals. Pro pricing not shown on fetched page.
- **Virtual study-room ecosystem (OBSERVED PATTERN, search):** Study Together (24/7 rooms), StudyStream ("focus 52" streams), Academync (free shared Pomodoro rooms), Flown, Focustown (TikTok-gamified study characters), plus Discord voice study rooms — the "study with me" economy is now a real channel students arrive through.

#### Saner.ai
- **Positioning (VERIFIED FACT, saner.ai):** "AI Personal Assistant for ADHDers" — notes + email + tasks unified; Skai task assistant; built by founders including one with ADHD. Free plan confirmed on site; tier prices ($8 Starter / $16 Standard per third-party review — secondary) not shown on homepage.

### E. Institutional/adjacent signals
- **EdTech Magazine (Dec 9, 2025 — VERIFIED FACT, fetched):** Higher-ed deployments of AI agents (UT Knoxville's UT Verse; Kira Learning's adaptive AI tutor; Johns Hopkins Agent Laboratory cutting research expenses 84%); EDUCAUSE 2025 AI Landscape Study found chatbots the top institutionwide AI license (37%). Explicit expert framing: current tools are **assistants, "not yet fully autonomous agents,"** and "accuracy is always a problem if you're going to fully automate things."
- **Digital Learning Institute 2026 trend list (VERIFIED FACT, fetched):** AI-personalized learning, analytics-driven support, gamification/VR, microcredentials, social-learning integration, and cybersecurity emphasis.
- **Duolingo (OBSERVED PATTERN, secondary analyses):** The 2025 "AI-first" announcement plus monetization pressure drew sustained backlash; secondary analyses report DAU growth decelerating (40%+ → ~30%, ~20% guided for 2026). Directionally relevant: aggressive AI-cost pass-through to students is a brand risk, not just a pricing lever.

---

## 3. Head-to-head vs. Solis V1

Solis V1 features below are VERIFIED FACTS from the ask (direct code inspection). Competitor features are VERIFIED FACTS from the sources above unless noted.

| Capability | Solis V1 | Best-in-class today | Gap/edge |
|---|---|---|---|
| Timetable/term structure | Weekly plan cockpit, week/matrix views | MyStudyLife rotating/A-B schedules + Schedule Scan (photo→timetable) | **Gap:** no true semester/rotating class grid; no photo/LMS import |
| Task capture | NLP capture, recurrence, replan | Todoist Task Assist/Filter Assist/Ramble; MSL Scout "one sentence → planned week" | Roughly at par on capture; **behind on agent-executed planning** |
| Auto-scheduling | Generated study plans, replan, exam feasibility | Motion ($19+, credit-metered), Reclaim AI Planner/Habits/Focus agents | **Gap:** no calendar-aware autonomous rescheduling; no two-way Google/Outlook sync (iCal only) |
| Spaced repetition | FSRS/SM-2 + Anki import/export, adaptive suggester, subject health | Anki fsrs-rs 6.6.x (Sept 2026 releases); RemNote; Brainscape | **At parity or ahead** for a consumer app; nobody bundles FSRS with a planner |
| Material→recall pipeline | AI flashcard/quiz generation from Notes; Anki import | Turbo/StudyFetch/Knowt/Vaia: lecture audio, PDF, video, slides → notes+cards+quizzes | **Gap:** no direct ingestion of lecture recordings/PDFs/slides into cards |
| Focus environment | Focus Room: countdown/stopwatch, energy calibration, Web-Audio soundscapes, tab defense, drift pad, reflection | Forest (gamified blocker), LifeAt (immersive dashboard), Flow Club ($40/mo body doubling) | **Ahead on depth** (energy calibration, auto-logging); behind on gamification loop and camera presence |
| Social study | Realtime Study Rooms: presence, synced timer, chat, timeline, **study pacts** | Flow Club hosted sessions; Study Together 24/7 rooms; Forest group planting | **Ahead** — free productized rooms with commitment devices is rare |
| Notes/KM | Bidirectional wiki-links, backlinks, graph, versioning | RemNote, Notion | Competitive niche; no PDF annotation (RemNote gap) |
| Intelligence | Deterministic engine: retention decay, mastery, subject health, circadian synthesis, **explainable** recommendations | StudyFetch stats claims (unexplained); Brainscape confidence metrics; Reclaim time analytics | **Ahead** — explainability is nearly unique in the consumer space |
| Cross-domain wiring | focus→study auto-log, ritual toggles, review→next-week seeding, habit auto-toggle, retention alerts, drift warnings | None observed end-to-end | **Clear edge** |
| AI model | BYOK Gemini, session-scoped; deterministic engines otherwise | Cloud-metered credits (Motion/RemNote/Notion) | **Edge on privacy/cost; friction risk** (users must obtain a key) |
| Data ownership | JSON/CSV backups, mock offline service | Anki local-first; MSL no-ads/GDPR/FERPA; Solis backups | Solid; **Gap:** no mobile app/widgets; PWA offline unclear |
| Family/school surfaces | — | MSL Family Connect + Schools; Brainscape Enterprise | Gap (deliberate scope choice?) |

**Bottom line (RECOMMENDATION-informed OBSERVATION):** Solis's differentiation is the *wiring* — one deterministic brain across planner, learning, focus, habits, and review — plus privacy posture (BYOK + local backups). Its exposure is (a) the AI content-ingestion expectations set by the 2024–26 wave, (b) calendar/LMS interoperability, (c) mobile presence, and (d) the coming agent-era interaction model.

---

## 4. Where the category is heading (2025–26 evidence)

1. **From assistants to agents that plan.** Notion 3.0 shipped Agents doing multi-step workspace work (Sept 18, 2025 changelog); Reclaim now sells *agent counts per plan*; Motion's whole pitch is autonomous scheduling; MSL's Scout turns a sentence into a planned week. Expert consensus in higher ed (EdTech Magazine, Dec 2025) is that this is still assistant-grade with accuracy caveats — meaning there is a 12–24-month window where "agent that plans my study week and *explains itself*" is a differentiator rather than table stakes. **OBSERVED PATTERN, strongly sourced.**

2. **AI cost is being metered — credits are the new pricing unit.** Motion: 7,500 credits/seat/mo + $0.25/100 overtime (VERIFIED FACT); RemNote: 250/1,000/20,000 credits by tier (VERIFIED FACT); Reclaim: AU packs; Notion: ~$10/1,000 credits for custom agents (search). Meanwhile Todoist raised Pro 40% monthly (Dec 10, 2025) — general subscription inflation on top of AI metering. **VERIFIED FACT (Motion/RemNote/Reclaim pages) + OBSERVED PATTERN (broader).**

3. **Free-tier warfare and paywall blowback.** Quizlet's paywalling of Learn/Test and Q-Chat retirement created the opening Knowt explicitly attacks ("unlimited free learn mode… Quizlet's cheaper sister"); Vaia and Turbo lead with free access; Duolingo's AI-first monetization drew documented backlash. Monetization lesson: keep the *learning loop* free, meter the *content/agent* layer, and never strand a previously-free core mode. **OBSERVED PATTERN, well corroborated.**

4. **Material→recall generation is commoditizing; value is moving to assessment and scheduling.** 2024's novelty (PDF→flashcards) is now table stakes across Turbo, StudyFetch, Knowt, Gizmo, Vaia. The 2025–26 frontier: AI-graded mock exams (StudyFetch Exam AI-analog via Alice.tech mock orals; Vaia Exam AI; Knowt Free-Response Room with auto-grading) and personalized study plans/cram modes. **OBSERVED PATTERN.**

5. **FSRS became the benchmark scheduler.** Anki ships fsrs-rs 6.6.x in monthly releases; RemNote bundles FSRS; SRS claims without a modern algorithm are increasingly disqualifying with the med/law/language cohort. **VERIFIED FACT (Anki releases) + OBSERVED PATTERN.**

6. **Accountability is a paid product category.** Flow Club charges $40/mo (50% student discount), Focusmate monetizes 3→unlimited sessions, and a whole study-room economy (Study Together, StudyStream, LifeAt co-working) has formed around body doubling — with an explicit ADHD lens (Flow Club 62% ADHD survey claim; Saner.ai positioning). **VERIFIED FACT (pricing pages).**

7. **Family, school, and institution surfaces are growing.** MyStudyLife's Family Connect and Schools edition; Brainscape Enterprise; higher-ed AI agent deployments. Students are acquired through B2B2C channels, not only app stores. **VERIFIED FACT.**

8. **Interaction-model shifts:** natural-language capture is baseline (Scout, Todoist Ramble, Kai voice tutoring); "study with me" media and gamified virtual spaces pull engagement (Focustown, Forest); template economies (Notion 30k+ marketplace) show students will buy *pre-built systems*, i.e., they want opinionated defaults, not blank canvases. **OBSERVED PATTERN.**

---

## 5. Table stakes for 2026 (what a credible study app must have)

Ranked; items 1–4 are non-negotiable in this cohort:

1. **AI planning agent** — natural-language in, executed plan out (week/term schedule, tasks, revision), with visible rescheduling when reality breaks the plan. (Scout, Motion, Reclaim, Notion 3.0 all normalize this.)
2. **Material→recall pipeline** — drop PDFs/lecture audio/video/slides → notes, flashcards, quizzes with citations back to source. (Turbo, StudyFetch, Knowt, Vaia, Gizmo.)
3. **Modern SRS with sane defaults** — FSRS-class scheduling tuned for the user, not a settings maze (Anki's lesson learned), integrated with the planner, not siloed.
4. **Mobile + cross-device sync with offline** — widgets, reminders, capture anywhere; web-only is a churn filter at student prices.
5. **Two-way calendar + LMS interop** — Google/Outlook calendar sync; at least Canvas/Blackboard/iCal import of classes and deadlines (MSL's bar).
6. **A focus environment with a loop** — timer + blocker/ambient + post-session logging that feeds back into analytics (Forest/LifeAt bar; Solis already exceeds it functionally).
7. **Social accountability option** — shared study rooms or body-doubling, even if minimal (the willingness to pay $40/mo for co-presence is proven; the free version is an acquisition magnet).
8. **Explainable progress** — "why am I behind / why this task next," with honest, deterministic metrics where possible; AI-generated insights must cite the data.
9. **Honest freemium** — the core learning loop stays free/forever; meter AI usage via credits or BYOK rather than paywalling study modes (the Quizlet/Duolingo lesson).
10. **Privacy and export** — no ad/data-selling posture, GDPR/FERPA-aligned language, full export (JSON/CSV) and local/backed-up data ownership.

Solis V1 currently satisfies items 3, 6, 8, 9, 10; partially 1, 5, 7; misses 2 and 4 outright (RECOMMENDATION — derived from the gap table).

---

## 6. White space: directions nobody serves well yet

1. **Retention-aware replanning (the closed loop nobody closes).** Every planner reschedules *tasks*; every SRS reschedules *cards*. No product lets memory state (FSRS workload, decay alerts) push back on the calendar — e.g., reflowing tomorrow's revision when a deck balloons, or warning that an exam date makes current mastery infeasible. Solis's exam-feasibility drift warnings and adaptive suggester are the closest building blocks; nobody ships it as an agent that renegotiates the whole week. **OBSERVED PATTERN + RECOMMENDATION.**

2. **Agentic planning under a privacy/BYOK contract.** The agent wave ships as cloud meters (Motion credits, Notion credits, Reclaim seats). A BYOK or local-model agent that plans, replans, and ingests materials *without shipping the student's notes to a vendor cloud* is unserved and directly on-trend with FERPA/GDPR sensitivities in education. **RECOMMENDATION based on verified BYOK-vs-metering contrast.**

3. **Committed small-group study (pacts with consequences).** Study rooms exist (Solis, Study Together) and body doubling is monetized (Flow Club), but *commitment devices among friends* — shared weekly pacts with visible stakes, streak-linked group rituals, synchronized revision on one syllabus — are nowhere productized. Forest's group planting is decorative; Flow Club's partners are strangers. Solis's study pacts are a seed; the design space (group plans, collective review rituals) is open. **RECOMMENDATION.**

4. **Term-scale intelligence.** Products optimize the day (Motion) or week (Reclaim, MSL Scout). Nobody models the 15-week term: workload balance across subjects, exam clustering, feasibility over time, "you cannot pass this unit at current pace" computed early and honestly. This is exactly where a deterministic engine beats an LLM. **OBSERVED PATTERN (absence) + RECOMMENDATION.**

5. **Evidence-grounded personal tutor tied to the student's own system.** AI tutors exist (Sparky, Kai, Q-Chat's ghost) but answer in a vacuum. The unserved version answers *from the student's own notes, cards, plans, and performance history*, cites the source block, and updates the plan afterwards — Ask Solis grounded in notes is the seed; extending grounding to plans/sessions/reviews would be a first. **RECOMMENDATION.**

---

## 7. What this implies for Solis V2 (RECOMMENDATION)

1. **Add the ingestion pipeline** (PDF/lecture audio/slides → notes/cards/quizzes, source-cited). It is the single largest expectation gap vs. the 2024–26 wave, and Solis's FSRS + planner wiring can make its output *better* than Turbo/Knowt's (cards enter a real schedule).
2. **Ship the planning agent on the deterministic spine:** Scout-style "plan my week" that writes real plan items, with autonomous replan and an explanation panel. Keep BYOK (and consider a hosted-credit fallback) rather than adopting opaque metering.
3. **Mobile surface is urgent** — PWA with offline + widgets at minimum; the mock offline service is the right foundation.
4. **Two-way calendar sync** (Google first) and one LMS import (Canvas) to match MSL's bar.
5. **Productize pacts and term intelligence** — they are defensible white space (items 3–4 above) that credit-metered incumbents structurally won't build (no deterministic engine, no social layer).
6. **Keep the learning loop free forever**; meter only generative/AI-agent usage. Say so explicitly in positioning — it is the wedge Knowt proved works against Quizlet.

---

## 8. Sources

**Fetched directly this session (primary):**
- https://mystudylife.com/ — positioning, Scout, Family Connect, Schools, sync targets
- https://apps.apple.com/us/app/my-study-life-school-planner/id910639339 — MSL+ $6.99/$39.99, Family Connect tiers, Schedule Scan, Scout
- https://www.usemotion.com/pricing — Pro AI $19 / Business AI $29 (annual), credit metering 7,500/15,000 + $0.25/100
- https://reclaim.ai/pricing — Lite/Starter $10/Business $15/Enterprise $22, AI feature and agent counts
- https://todoist.com/pricing — plan shapes, Task Assist/Filter Assist/Ramble (prices stripped in scrape)
- https://www.remnote.com/pricing — Free/Pro $8/Pro with AI $18, AI credit tiers
- https://www.brainscape.com/pricing — Basic free, Pro $7.99/mo, Enterprise
- https://knowt.com/ — positioning, Kai, free learn mode claims, AP stats claims
- https://www.turbo.ai/ — Turbo AI (ex-TurboLearn) positioning/features (redirect from turbolearn.ai)
- https://studyfetch.com/ — Sparky, Study Plan/cram, Live Lecture, Arcade, claims
- https://gizmo.ai/ — tool list, no pricing shown
- https://www.vaia.com/en-us/ — Vaia AI/Exam AI, 40M+ claim, premium existence
- https://www.saner.ai/ — ADHD assistant positioning, free plan
- https://www.notion.com/students — free Plus for verified students, AI not included
- https://www.flow.club/ — $40/$400 pricing, 50% student discount, ADHD survey claims
- https://www.focusmate.com/pricing — free 3/wk, Plus $8/$12
- https://apps.apple.com/us/app/forest-focus-for-productivity/id866450515 — 60M claim, Forest Plus $5.99/$35.99, features
- https://lifeat.io/ — immersive workspace positioning, co-working
- https://github.com/ankitects/anki/releases — 26.09.3 current (Sept 23 2026), fsrs-rs 6.6.x, editor experiment, security fixes
- https://edtechmagazine.com/higher/article/2025/12/ai-agents-higher-education-transforming-student-services-and-support-perfcon — AI agents in HE, Dec 9 2025
- https://www.digitallearninginstitute.com/blog/education-technology-trends-to-watch-in-2026 — 2026 edtech trend list
- https://useaicademy.com/blog/anki-vs-quizlet — Quizlet Plus ~$7.99/$35.99, Q-Chat retired 2025 (secondary, Aug 29 2026; disclosed vendor conflict)

**Surfaced via search only (not fetched; lower confidence):**
- notion.com changelog "Notion 3.0: Agents" (Sept 18, 2025) — via search summary
- todoist.com pricing-update pages (Pro/Business Dec 10, 2025) — via search quotes
- eu-startups.com — StudySmarter $15M Series A / Owl Ventures (2021; older fact)
- studysmarter.co.uk newsroom — Vaia rebrand announcement
- mindomax.com, notibo.net, forasoft.com, lynote.ai, studygenie.io — AI study tool comparison roundups (2026)
- hokai.io — Alice.tech YC/Series A claims; localproblems.org — Flashka funding
- studytogether.com / studystream.live / academync / flown / focustown — virtual study-room landscape (via search summaries)
- studentbeans.com, studentappcentre.com — Todoist student discounts
- compoundingalpha.substack.com — Duolingo monetization/growth deceleration analysis (secondary)
- languavibe.com (Sept 10, 2026) — Brainscape alternate pricing figures (conflicts with official page; official preferred)
- flashcard-maker.cc (July 2026) — Anki FSRS-default claim (unconfirmed)

**Could not verify (blocked/not found):** quizlet.com/upgrade and /subscribe (HTTP 403); knowt.com/pricing (404); exact Turbo/StudyFetch paid-tier prices (not shown on official pages); LifeAt Pro pricing (not shown); current Solis-market share data (none published).
