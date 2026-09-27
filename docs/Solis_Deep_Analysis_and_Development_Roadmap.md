# Solis Deep Analysis & Phased Development Roadmap

> **Analysis Date:** September 27, 2026  
> **Codebase Status:** Phase 3 Complete (Active Learning System)  
> **Audit Basis:** Full source code inspection of all 15 feature pages, 13 service modules, 20+ utility engines, and all type definitions  
> **Purpose:** Section-by-section depth audit → enhancement backlog → dependency-aware phased roadmap

---

## 1. Executive Summary

Solis is a genuinely sophisticated student productivity web application. It is not a "basic student project" — it has a deterministic intelligence engine, an FSRS-based spaced repetition system, a real-time focus sanctuary with Web Audio synthesis, bidirectional wiki-linking, a morning/evening ritual system, study rooms with presence, and a clean `IDataService` abstraction over Supabase. The architecture health score is legitimately high (8.8/10 per the existing audit).

**However, the product has a fundamental gap: its sections are strong individually but weakly connected.** The intelligence engine exists but doesn't visibly drive user behavior. The Focus Room logs sessions but the post-session data rarely surfaces anywhere meaningful. Goals exist but don't automatically generate study plan items. The analytics page shows dashboards but doesn't push recommendations back into the planner. Each section feels like it was designed in isolation.

**The core thesis of this roadmap:**  
> Make every section's output feed the next section's input. Turn Solis from a collection of excellent isolated features into one coherent learning operating system.

**Three strategic priorities:**
1. **Close the loop** — connect sections that already talk past each other
2. **Deepen the core workflow** — Dashboard → Study → Focus → Reflection is the daily spine; it must be frictionless and intelligent
3. **Surface what the system already knows** — the intelligence engine computes rich signals nobody sees

---

## 2. Current Solis Product Structure

### Confirmed Sections (from actual codebase)

| Section | Route | Primary File | Lines | Status |
|---|---|---|---|---|
| **Dashboard / Today Cockpit** | `/app/dashboard` | `DashboardPage.tsx` | 1,217 | Active |
| **Tasks** | `/app/tasks` | `TasksPage.tsx` | 1,585 | Active |
| **Study & Syllabus** | `/app/study` | `StudyPage.tsx` | 582 (+hook) | Active |
| **Focus Room** | `/app/focus` | `FocusPage.tsx` | 1,222 | Active |
| **Study Rooms** | `/app/rooms` | `RoomsPage.tsx` | 566 | Active |
| **Knowledge & Notes** | `/app/notes` | `NotesPage.tsx` | 1,278 | Active |
| **Habits & Rituals** | `/app/habits` | `HabitsPage.tsx` | 887 | Active |
| **Goals** | `/app/goals` | `GoalsPage.tsx` | 550 | Active |
| **Analytics** | `/app/analytics` | `AnalyticsPage.tsx` | 895 | Active |
| **Weekly Review** | `/app/review` | `WeeklyReviewPage.tsx` | 736 | Active |
| **Settings** | `/app/settings` | `SettingsPage.tsx` | 1,460 | Active |
| **Guide Center** | `/app/guides` | `GuideCenterPage.tsx` | — | Active |
| **Auth** | `/auth/*` | `LoginPage`, `SignupPage`, etc. | — | Active |

### Confirmed Cross-Cutting Features (not page-level)

| Feature | Location | Notes |
|---|---|---|
| Command Palette | `CommandPalette.tsx` | Cmd+K, fuzzy search |
| Ask Solis Drawer | `AskSolisDrawer.tsx` | Grounded Q&A from notes |
| Mini Focus Player | `MiniFocusPlayer.tsx` | Persists across navigation |
| Morning Planning Modal | `MorningPlanningModal.tsx` | 3-step morning ritual |
| Evening Closure Modal | `EveningClosureModal.tsx` | 4-step evening ritual |
| Ambient Peer Presence Widget | `AmbientPeerPresenceWidget.tsx` | Shows who's studying |
| Notification Center | `NotificationCenterDrawer.tsx` | Smart notifications |
| Cognitive Load Alert | `CognitiveLoadAlert.tsx` | Overload warning |
| Knowledge Resurfacing Card | `KnowledgeResurfacingCard.tsx` | SRS-driven deck resurfacing |
| Exam Horizon Bar | `ExamHorizonBar.tsx` | Countdown to exams |
| Study Pacts | `StudyPactsSection.tsx` | Accountability commitments |
| Activation / Onboarding | `ActivationWelcomeModal.tsx` | First-run flow |

### Intelligence Engine (Confirmed Utilities)

- `utils/intelligence/` — rhythm, execution, mastery, attention, recommendations, retention engine, mastery engine, subject health engine, circadian synthesis
- `utils/learning/` — FSRS engine, SM-2/spaced repetition, leech detector, exam cram mode, Feynman evaluator
- `utils/planning/` — syllabus pacing, exam feasibility, morning ritual, time cushion, time blocking, workload calculator
- `utils/tasks/` — NLP parser, recurrence engine, replan engine, task micro-stepper, workload calculator
- `utils/focus/` — soundscape engine, haptics engine, tab defense, interruption tracker

---

## 3. Section-by-Section Audit

### 3.1 Dashboard / Today Cockpit

**What it currently does:**
- Greets user with time-of-day message, date, solar arc illustration
- Daily Intention anchor bar (localStorage, debounced auto-save)
- WorkloadCapacityBar (estimated vs. available minutes)
- SmartTaskInput with NLP parsing (inline task capture)
- TaskRow list with top-5 view / "Show all" accordion
- Zeigarnik deferral — one-tap defer task to tomorrow with undo
- Study Plan agenda items from `getTodayPlan()`
- Habit completion grid / toggle (daily rituals)
- TimeBlockGrid (visual 24h planner view / lists view toggle)
- KnowledgeResurfacingCard (SRS-decay-driven note resurfacing)
- ExamHorizonBar (goal-linked countdown bars)
- AmbientPeerPresenceWidget (peer presence from study rooms)
- CognitiveLoadAlert (overcommitment detection)
- Morning Planning Modal trigger / Evening Closure Modal trigger
- WelcomeBackModal (3+ day absence re-entry with Gentle Start / Priority Triage)
- ActivationWelcomeModal (onboarding)
- NextBestActionCard (empty-state guidance)
- Partial data resilience with PartialDataWarningBanner

**What's missing / weak:**
1. **No today's actual study session summary.** Completed study sessions today don't surface as a "what you accomplished" section — only the task list shows completion.
2. **Time blocking grid doesn't show utilization feedback.** No "you have 2.5 free hours left today" kind of signal.
3. **Habit display is just a toggle list.** No visual streak momentum or gamification that would make daily return feel rewarding.
4. **The "Study Plan" section shows items but doesn't distinguish priority/urgency.** A session 3 days overdue looks identical to one due today.
5. **Knowledge Resurfacing Card shows only one card at a time.** Low motivation/engagement — feels like a minor widget rather than an active learning moment.
6. **No "today's focus score" or "momentum meter."** The dashboard loads and shows data but doesn't give the user a quick read on how their day is going overall.
7. **Morning/Evening ritual is trigger-based, not state-aware.** If a user already did morning planning, there's no indication — the button still appears the same.
8. **Daily Intention is free text that goes nowhere.** It's saved to localStorage but never connected to goals, tasks, or the review ritual.

---

### 3.2 Tasks

**What it currently does:**
- List view with category filter, time filter, sort, search
- Task creation via modal (full) or SmartTaskInput (NLP)
- Subtasks with inline creation, toggle, delete, edit
- Priority levels: urgent, high, medium, low
- Due date, due time, estimated minutes
- Task categories: study, deep_work, admin, health, personal, custom
- Recurrence engine (daily, weekly, specific days)
- Task linking to subjects and goals
- Tags
- 4 view modes: List, Schedule (hourly day planner), Week (weekly calendar), Matrix (Eisenhower 2x2)
- Hourly Planner: creates time blocks, reviews, reschedules
- Weekly Planner: block-based week view
- Priority Matrix: Urgent/Important quadrant view
- Task Inbox: capture-first view
- Workload Capacity bar
- Deferral with undo
- Replan engine (suggests next available slot when overloaded)
- Keyboard shortcuts (Cmd+Z undo completion, etc.)

**What's missing / weak:**
1. **The 4 view modes feel disconnected.** Switching from List to Schedule loses context — the selected task isn't preserved or highlighted.
2. **The Eisenhower Matrix is static.** It shows the quadrant but doesn't help you move tasks between quadrants efficiently.
3. **No bulk actions.** You can't select multiple tasks to defer, complete, or re-categorize them.
4. **Recurring tasks don't show their recurrence pattern inline.** A recurring task looks identical to a one-off task in the list.
5. **No "today's workload vs. yesterday" comparison.** The capacity bar shows today's load but no historical context.
6. **Task completion has no satisfying feedback loop.** Completing a task is a checkbox click — no animation, no progress signal, no connection to streak or habit data.
7. **NLP parser exists but the grammar/feedback isn't surfaced.** When the parser detects a due date, the user doesn't see a "✓ detected: due Friday 5pm" confirmation — they just see a form field update.
8. **No time tracking on tasks.** You estimate 30 minutes, complete the task — but never learn if your estimates were accurate. No calibration loop.
9. **Subtask progress isn't visible in the parent task row.** You need to expand the task to see "3/5 subtasks done."

---

### 3.3 Study & Syllabus

**What it currently does:**
- Subject list with color coding, target hours/week, completion percentage
- Subject detail view with: Syllabus Topic Tree, Study Plan Agenda, Spaced Reviews Sanctuary, Study Resource Grid, Adaptive Study Suggester
- Hierarchical syllabus topics: Unit → Chapter → Concept
- Topic mastery levels: unstudied, learning, mastered
- Study plan items: create, toggle, delete, add to plan
- Manual session logging (type, duration, topics covered, retention rating 1-5)
- SM-2 / FSRS flashcard review queue per subject
- Resource library: papers, books, videos, links per subject/topic
- TopicIntelligenceDrawer: per-topic insights when clicking a topic
- SplitScreenPdfWorkspace: PDF viewer alongside notes/flashcards
- Exam Horizon Bar (goal-linked)
- AdaptiveStudySuggester: recommends what to study next
- Import .apkg (Anki deck) / LMS importer
- Export to Anki .apkg format

**What's missing / weak:**
1. **StudyPage.tsx is a monolith** (2,199 lines). State management is brittle at scale.
2. **Session logging is entirely manual.** The user must navigate to "Log Session" and fill a form. There's no automatic connection: "You just finished a 50m Focus session on Physics — log it here?"
3. **Topic mastery is 3-state (unstudied/learning/mastered) but FSRS computes continuous retention scores.** These aren't reconciled — you can have a "mastered" topic with low FSRS retention.
4. **The Adaptive Study Suggester exists but is a widget, not a workflow.** It recommends a topic but doesn't guide the user through starting a session on it.
5. **Subjects show "completedHoursThisWeek" but no trend.** Is this more or less than last week? No comparison.
6. **Resource library is a flat list.** No annotation, no connection to topics they're linked from, no "I read this" completion marker.
7. **No "subject health" dashboard card.** The subjectHealthEngine exists in `utils/intelligence/subjectHealthEngine.ts` but isn't surfaced visually.
8. **The topic tree has no visual mastery heatmap.** You see a list with labels but not a visual "coverage map."

---

### 3.4 Focus Room

**What it currently does:**
- Pomodoro (25m), Deep Flow (50m), Short Rest (5m), Custom (1-180m) presets
- Countdown and stopwatch modes
- Digital and analog pie timer displays
- Zen Mode (fullscreen, hides all UI except timer)
- Subject and task linking before session
- Pre-session energy calibration (Low/Steady/Sharp) → adjusts recommended duration
- Target Outcome intention lock (what will you achieve this session)
- Ambient soundscape synthesizer (Pink Noise, Brown Noise, Binaural Alpha, Binaural Theta, Rainfall, Harmonic Drone) — synthesized via Web Audio API
- Volume control + mute
- Cognitive Drift Pad (park distracting thoughts mid-session)
- Centering Sanctuary Modal (mid-session centering exercise)
- Tab Defense (detects tab switching, logs drift events, configurable)
- Interruption tracking: internal / external
- Post-Focus Reflection Modal (flow quality 1-5, notes, synthesize to note option, complete linked task option)
- Keyboard shortcuts (Space: start/pause, Z: Zen, Alt+D: Drift Pad, Esc: exit Zen)
- Mini Focus Player (persists across navigation when session is running)
- Haptics engine (mechanical tick, resonant bell chimes)
- Session data saved to Supabase via FocusContext

**What's missing / weak:**
1. **The reflection modal is optional and the data goes nowhere visible.** Flow quality ratings, notes, and interruption counts are logged but never appear in analytics or form patterns the system acts on.
2. **No session history view within Focus.** After 20 sessions, you can't see your session history, average flow quality, or which subjects got the most deep work.
3. **Soundscape selection is persistent across sessions** (same soundscape every time). No "recommend a soundscape for this subject" or "try something different today."
4. **The pre-session energy calibration is a one-tap shortcut** but not saved across sessions — no circadian pattern learning.
5. **Drift Pad thoughts are parked but their destination is opaque.** "Parked as task" — but where? The user can't see these in the task list with a "from drift pad" label.
6. **No break management.** After a Pomodoro ends, the app just shows the reflection modal — there's no "start your 5-minute break" transition, no break timer, no break activity suggestion.
7. **Session completion has no celebration or milestone tracking.** The 100th session looks identical to the 1st.
8. **No connection to the Study Plan.** When a Focus session ends, the linked study plan item is not automatically marked complete — this requires a separate action.

---

### 3.5 Study Rooms (Collaborative)

**What it currently does:**
- Create rooms with name, subject, modality (silent/lo-fi/discussion), capacity, optional code
- Browse rooms by search, state (running/idle), subject, modality
- Join via room code
- Room timer (shared start/stop)
- Participant presence display (avatars)
- Room history / session reflections
- Study Pacts section (accountability commitments)
- AmbientPeerPresenceWidget on dashboard

**What's missing / weak:**
1. **Rooms are not real-time.** The audit confirms: "All client updates rely on an in-memory single-tab event emitter." There are no Supabase Realtime channel subscriptions. Rooms are effectively a stub — the "running" state is not synchronized between users.
2. **No shared timer synchronization.** If User A starts the timer, User B doesn't see it update.
3. **No in-room chat or reaction system.** Study rooms have no communication layer.
4. **No body-doubling session structure.** Focusmate has: intro check-in, 50m work, debrief. Solis rooms have no session structure.
5. **Study Pacts are disconnected from actual session data.** A pact says "I'll study 2 hours daily" but the system doesn't verify it against logged sessions.
6. **No room analytics.** How many hours have you studied in rooms vs. solo? Who's your most frequent study partner?
7. **No public/featured rooms.** You can only find rooms you already know about.

---

### 3.6 Knowledge & Notes

**What it currently does:**
- Markdown editor with auto-save (debounced, 1200ms)
- Note categories: concept, lecture, problem_solving, revision, idea, reflection, reference
- Subject and topic linking
- Tags with multi-tag filtering
- Search across title and content
- Bidirectional wiki-linking (`[[Note Title]]`) with backlinks panel
- Markdown reading view
- AI flashcard generation from note content (AIGenerationModal)
- AI quiz runner from note content (AITakeQuizModal)
- Inline flashcard parsing (`::front::` syntax)
- Ask Solis grounded Q&A drawer
- Knowledge Resurfacing Card (on Dashboard, not within Notes)
- Resource library integration
- Export note to markdown file
- Note metrics (word count, reading time)

**What's missing / weak:**
1. **The editor has no toolbar.** Markdown syntax is bare — no bold/italic/heading shortcuts without knowing markdown.
2. **Wiki-link autocomplete is missing.** You type `[[` and there's no popup showing existing note titles to link to.
3. **Notes have no version history.** If you accidentally delete content, it's gone.
4. **The AI generation (flashcards, quiz) requires navigating to Notes.** If you're reading a flashcard and think "I should make a note about this," there's no path back without losing context.
5. **Knowledge graph is not visualized.** Backlinks exist but there's no visual node-link graph of how notes connect to each other.
6. **Notes aren't searchable from the Command Palette.** The Command Palette exists but searching for note content isn't wired up.
7. **No "pinned" or "starred" notes.** No way to surface important notes without searching.
8. **Reflection notes from Evening Closure are auto-created but look identical to study notes.** No visual differentiation by source.

---

### 3.7 Habits & Rituals

**What it currently does:**
- Create habits with: title, category (study/wellness/mindset/routine), frequency (daily/weekdays/weekends/custom), color, kind (boolean/quantitative/tiered)
- Quantitative habits: target value + unit (e.g., "Read 20 pages")
- Tiered habits: base tier + stretch tier values
- 7-day (mobile) or 14-day completion matrix
- Streak calculation (deterministic, from habit_records)
- Streak amnesty (from WelcomeBackModal on return after 3+ days)
- Goal linking (habit → goal)
- Quick capture bar (quick add habit by title only)
- Toggle today / toggle specific date

**What's missing / weak:**
1. **The completion matrix is 14 days max.** No long-term streak visualization — you can't see your 90-day pattern or monthly consistency.
2. **Habits have no "best streak" vs "current streak" comparison displayed.** You see current streak but not your personal record.
3. **Quantitative habits have no progress bar for today.** If your goal is "read 20 pages" and you've done 12, there's no partial-progress display — only complete/incomplete.
4. **No habit scheduling.** A "daily" habit doesn't have a preferred time — no "remind me at 8am" even though notification infrastructure exists.
5. **Habit categories (study/wellness/mindset/routine) are defined but not used for cross-category insights.** No "Your wellness habits are strong but mindset habits are lagging" type signal.
6. **Tiered habits (base/stretch) are implemented in the engine but the UI doesn't explain the tier system clearly.** Most users won't discover it.
7. **No connection between habits and study sessions.** If "Review flashcards daily" is a habit, completing a spaced review session should auto-toggle it.
8. **Streak loss UI is punitive by default.** A missed day shows a broken streak with no recovery path except amnesty.

---

### 3.8 Goals

**What it currently does:**
- Create goals with: title, description, category, horizon (daily/weekly/monthly/semester/annual/lifetime), status (active/completed/archived/on_hold)
- Goal experience types: exam, project, personal
- Milestones: sub-goals with completion toggle
- Progress derived from milestone completion percentage
- Exam Workspace Modal: exam-specific view with subject links, study resource links, flashcards, topics
- Project Workspace Modal: project-specific view
- ExamFeasibilityBar: shows if current pace is sufficient to reach goal
- DynamicSyllabusPacingCard: pacing recommendations
- ExamHorizonBar: days countdown + progress
- Filter/sort by horizon, status, category, experience type
- Goal linking to subjects, tasks, habits

**What's missing / weak:**
1. **Milestones are just a checklist.** They have no due dates, no ordering, no dependency tracking between milestones.
2. **Goal progress is percentage of milestones completed** — but a milestone "Complete Chapter 5" has the same weight as "Pass the exam." Progress feels arbitrary.
3. **The ExamFeasibilityBar exists but is a binary pass/fail signal** — it doesn't explain how many more hours per week are needed to close the gap.
4. **No automatic "create study plan from goal."** You set an exam goal, but the system doesn't automatically propose a study schedule toward that goal.
5. **Goals don't cascade to the daily plan.** Setting a weekly goal of "10 hours of Physics" doesn't automatically suggest daily session targets.
6. **The Exam Workspace Modal is powerful but hidden.** Users have to know to click "Open Exam Workspace" from a goal card — the value isn't obvious.
7. **No goal journal / progress log.** You can't write a weekly note on a goal saying "made significant progress this week."
8. **Completed goals are archived but not celebrated.** No retrospective summary is generated when a goal is marked complete.

---

### 3.9 Analytics

**What it currently does:**
- Time range scopes: this_week, last_week, this_month, last_month, all_time
- SolisIntelligenceReport: rhythm + execution + mastery + attention
- Cognitive Rhythm: study hours by day-of-week
- Execution Intelligence: plan vs. actual hours, task completion rate
- Mastery Intelligence: topic mastery distribution
- Attention Intelligence: focus session quality, interruptions
- CognitiveLoadAlert: overcommitment warning
- ExamReadinessCard: readiness score per goal + subject
- RetentionForecastGraph: projected retention decay curves by topic
- ThermalDifficultyMatrix: 2D scatter of topic difficulty vs. study investment
- ScholarReportModal: exportable narrative intelligence report (AI-generated)
- Overall habit streak stats
- Partial data warning banner

**What's missing / weak:**
1. **No charts of any kind.** The analytics page is entirely text-based and card-based. There are no visual graphs for study hours over time, habit completion rate over 30 days, task velocity, etc.
2. **The IntelligenceReport is generated but not actionable.** It tells you "this week you studied 4.2 hours" but doesn't have a clear "therefore, do X" directive.
3. **There's no comparison view.** "This week vs. last week" requires manually switching scopes — there's no side-by-side.
4. **The ThermalDifficultyMatrix exists but has no interaction.** You can't click a dot to navigate to that topic.
5. **The Scholar Report is on-demand.** The user must actively click "Generate Report" — it's not proactively shown when patterns emerge.
6. **No heatmap of study activity.** GitHub-style contribution graph for study days is the most asked-for analytics feature in this category.
7. **Subject-level analytics are buried.** To see "how much time on Physics this month" you need the intelligence report — there's no quick per-subject chart.
8. **No task completion velocity chart.** "You completed 23 tasks last week vs. 14 this week" isn't surfaced.

---

### 3.10 Weekly Review

**What it currently does:**
- 3-step ritual: (1) Intelligence Overview, (2) Reflection Inputs, (3) Next Week Commitment
- Step 1: Shows SolisIntelligenceReport for the week (rhythm, execution, mastery, attention)
- Step 2: Breakthroughs text, friction points text, next-week commitment text, subject selection for focus
- Step 3: Next week target hours, create actionable task option, create goal horizon option
- AI narrative synthesis: generates a poetic weekly reflection narrative (uses `aiService`)
- Saves review completion as a note

**What's missing / weak:**
1. **The 3-step flow has no visual continuity.** Steps feel like isolated forms with no story thread through them.
2. **The AI narrative is optional and takes significant time to generate.** Most users won't wait for it.
3. **The review doesn't compare to previous reviews.** Was this week better or worse than last week? No trend line.
4. **"Next Week Commitment" is free text** that creates a task — but it doesn't auto-populate the following week's study plan or influence the planner.
5. **The review ritual doesn't verify habit data.** Which habits were completed 7/7 days? This should be surfaced as part of the review, not just mentioned in the intelligence report.
6. **No pre-populated prompts for reflection fields.** "Breakthroughs" is an empty text box — blank page anxiety for most users.
7. **No streak for completing weekly reviews.** Accountability for the review ritual itself is missing.
8. **The review result doesn't persist in a visible history.** You can generate a note but there's no "Review History" tab showing your past 8 weeks of reviews.

---

### 3.11 Settings

**What it currently does:**
- Profile: name, email, focus field
- Theme: Light/Dark/System
- Notification preferences: smart notification times, daily study reminder, focus session alerts
- Focus preferences: preferred duration, break duration
- AI: Gemini API key management (session-scoped in sessionStorage), model selection, key validation
- Data: Full workspace JSON backup export, per-entity CSV exports (tasks, sessions, focus, notes, habits, goals)
- Import: JSON workspace restore
- Calendar: iCal/Google Calendar integration (iCal feed URL, .ics file import)
- Guides: reset onboarding
- Account: password change, sign out

**What's missing / weak:**
1. **Notification preferences are present but the notification system's actual reliability isn't confirmed.** Browser notification permission state is shown but not managed proactively.
2. **No "data insights" in settings.** How much data do I have? (X sessions, Y notes, Z flashcards). Users don't know what they've built.
3. **AI settings are minimal.** Only API key + model. No temperature, no system prompt customization, no "AI tone" preference.
4. **Export is download-only.** No scheduled export, no cloud backup destination.
5. **iCal integration is available but its status is not shown.** Is the feed active? When was it last synced?
6. **No danger zone UX clarity.** Delete account option may or may not exist but isn't clearly surfaced.

---

## 4. Improvements for Every Existing Section

### 4.1 Dashboard — Evolution Path

**Minimum (current):** Daily plan + tasks + habits toggle  
**Good:** Sections react to each other — completing a focus session marks the plan item; habits show partial progress; morning state is remembered.  
**Excellent:** The dashboard *knows* what kind of day the user is having. By noon it shows: "You've done 1.5h of your 3h plan — on track." By evening it proactively opens the closure ritual.  
**Exceptional:** The dashboard *personalizes itself* based on the user's circadian data. At 6am it shows the morning ritual and the day's energy prediction. At 11pm it shows only the evening closure and tomorrow's agenda, everything else dims.

**Core improvements (must-build):**
- Today's study session summary — "You studied 1h 20m today across 2 sessions" (derived from focus + study sessions)
- Study plan item completion → automatically mark when focus session ends on that plan item
- Morning ritual completion state (show ✓ done instead of same "Plan Your Day" button)
- Streak momentum section — current habit streak + "keep the chain" motivation
- Time remaining today calculation — "Based on your calendar, you have 2h 40m of study time left"
- Daily intention connected to goals (dropdown from goals instead of free text)

**Advanced improvements:**
- Circadian dashboard: header shifts content priority based on time of day
- "Today's study score" progress ring — derived from plan completion + habit completion + focus time
- Cross-section daily summary card: "3 tasks ✓, 2 habits ✓, 1h 25m focus, 2 SRS cards reviewed"

---

### 4.2 Tasks — Evolution Path

**Minimum:** CRUD with priority, due date, categories  
**Good:** 4 view modes that share state, inline subtask progress, recurring task labels  
**Excellent:** Time estimates are calibrated by history ("you usually take 45m, not 30m for problem sets")  
**Exceptional:** The task system understands *load* and *context*. It automatically surfaces the right task at the right time based on due pressure, energy level, and available time blocks.

**Core improvements:**
- Subtask progress visible in parent row: "3/5 subtasks" badge
- Recurring task visual label in list view (↻ icon with pattern description)
- NLP parser confirmation bubble: "Detected: due Friday 5pm, estimated 45m" below input
- Bulk selection with actions (defer group, complete group, move to tomorrow)
- View mode state preservation: switching views keeps scroll/selection position
- Time estimate calibration: track actual vs. estimated minutes; show "your average for this category is X" when creating

**Advanced improvements:**
- Smart next-task suggestion: "Based on your energy level and 2h available, start with [task X]"
- Task completion celebration: subtle animation + streak counter ("3rd task today!")
- Drift Pad tasks clearly labeled with 🧠 origin icon in the task list

---

### 4.3 Study & Syllabus — Evolution Path

**Minimum:** Subject management + session logging + topic tree  
**Good:** One-click session start from topic → focus room → auto-log on return  
**Excellent:** Topic mastery heatmap, subject health scores visible at subject level, adaptive session suggestions drive the daily plan  
**Exceptional:** The study system evolves your syllabus automatically. As you study topics, it adjusts pacing, surfaces neglected areas, and proposes plan items for the upcoming week without you asking.

**Core improvements:**
- **Close the session loop:** After a Focus session ends with a subject, prompt "Log this as a study session?" with all fields pre-filled — subject, duration, topic (from focus title), retention from post-focus reflection
- **FSRS retention score reconciled with mastery level:** If a topic's FSRS retention drops below 60%, its mastery level auto-downgrades to "learning"
- **Subject health score displayed on each subject card:** Single indicator (green/amber/red) derived from: hours this week vs. target, overdue topics, retention decay
- **Topic mastery heatmap in the syllabus view:** Color-coded grid of topics showing mastery level at a glance
- **StudyPage decomposition:** Extract state into `useStudyPage` hook (already exists) and split render into sub-components by view

**Advanced improvements:**
- **Weekly study plan proposal:** Every Sunday, system proposes a study plan for the week based on exam proximity, topic retention decay, and hours target
- **Resource progress tracking:** "I've read 60% of this book" progress marker on resources

---

### 4.4 Focus Room — Evolution Path

**Minimum:** Timer + soundscape + reflection  
**Good:** Energy-calibrated sessions, tab defense, drift pad, interruption logging  
**Excellent:** The Focus Room becomes a genuine cognitive sanctuary. Break sequences are guided. Session history is visible. The reflection data shapes future recommendations.  
**Exceptional:** The Focus Room adapts to you. After 20 sessions, it knows your peak focus window, your typical interruption pattern, and your best soundscape. It suggests your optimal session type before you configure anything.

**Core improvements:**
- **Guided break transitions:** After Pomodoro completes → "Time for a 5-minute break" → optional break timer → then prompt for next session or plan item
- **Session history panel:** Last 7 sessions visible in-page: date, subject, duration, flow quality, interruptions
- **Drift Pad task destination clarification:** Show "Added to your Tasks as 🧠 [title]" with a link
- **Post-session auto-suggest plan item:** "This session covered your Physics plan item — mark it complete?"
- **Flow quality trend:** After 5+ sessions, show a sparkline of flow quality over recent sessions

**Advanced improvements:**
- **Circadian session suggestions:** "Your highest flow quality sessions happen between 9-11am — schedule one now?"
- **Break activity suggestions:** Breathing exercise, walk prompt, hydration reminder during breaks
- **100-session milestone:** First achievement system (subtle, tasteful — not gamification theater)
- **Soundscape learning:** After 10 sessions, suggest the soundscape correlated with your highest flow scores

---

### 4.5 Study Rooms — Evolution Path

**Minimum (current):** Room browsing + join + timer + presence display (non-real-time)  
**Good:** Real-time presence and timer sync (requires Supabase Realtime)  
**Excellent:** Structured body-doubling sessions with check-in, work period, and debrief  
**Exceptional:** Study rooms are a genuine accountability layer. Pacts auto-verify against session data. Partner analytics show mutual consistency.

**Core improvements (Phase 0 blocker first):**
- **Supabase Realtime integration:** This is the foundation everything else depends on. Implement presence channels, broadcast timer state, and real-time participant updates.
- **Session structure:** Intro check-in (what are you studying?), synchronized work period, debrief (how did it go?)
- **Study Pact verification:** Pacts automatically verify against actual session logs each day — show compliance badge
- **Room activity feed:** Live "Kunal started a 50m session on Physics" updates within the room

**Advanced improvements:**
- **Partner analytics card:** "You and Priya have studied together for 12 hours total across 8 sessions"
- **Accountability streak for pacts:** Pact streak shown on the dashboard
- **Public rooms discovery:** Trending rooms, subject-filtered discovery

---

### 4.6 Notes — Evolution Path

**Minimum:** Markdown editor + categories + tags  
**Good:** Wiki-links, backlinks panel, AI generation, inline card parser  
**Excellent:** Notes are the knowledge foundation. Graph visualization shows connections. Wiki-link autocomplete removes friction. Notes are searchable from anywhere.  
**Exceptional:** Notes actively surface themselves when relevant. When starting a Focus session on Quantum Mechanics, the system shows: "You have 3 notes on this topic — review before starting?"

**Core improvements:**
- **Wiki-link autocomplete:** When user types `[[`, show a dropdown of existing note titles that filter as they type
- **Markdown toolbar:** Bold, italic, heading, code block, bullet list buttons above the editor
- **Note pinning:** Star/pin system to surface important reference notes
- **Notes in Command Palette:** Cmd+K shows notes in search results (fuzzy match on title and content preview)
- **Version history:** Last 10 auto-save snapshots recoverable per note

**Advanced improvements:**
- **Knowledge graph visualization:** Canvas-based node-link diagram of notes connected by wiki-links — click to navigate
- **Note-to-focus bridge:** "You have 4 notes on this topic — open them while studying?" banner when starting focus on a linked subject
- **Contextual note suggestions:** When working on a goal or study plan item, surface related notes automatically

---

### 4.7 Habits & Rituals — Evolution Path

**Minimum:** Boolean habits with streak tracking  
**Good:** Quantitative habits, tiered habits, 14-day matrix, goal linking  
**Excellent:** Habits have scheduling, partial-progress display, and auto-toggle from study activity  
**Exceptional:** The habit system understands your behavioral pattern. It knows you complete wellness habits in the morning and study habits in the evening. It sends reminders at the right time, not just a generic daily alert.

**Core improvements:**
- **90-day completion heatmap:** Replace or augment the 14-day matrix with a longer-view GitHub-style heatmap
- **Quantitative progress today:** For numeric habits, show today's progress bar (12/20 pages read)
- **Study-habit auto-toggle:** When a spaced review session is completed, auto-toggle the "Review flashcards daily" habit if it exists
- **Personal best streak display:** Show "Best: 42 days / Current: 8 days" on each habit card
- **Habit time preference:** Let users set a preferred time for each habit; notification service uses this time

**Advanced improvements:**
- **Habit category insights:** "Your mindset habits (meditation) are at 87% completion — strongest category this month"
- **Chain protection alert:** "You're 2 hours from losing your 30-day streak on [habit] — complete it before midnight"
- **Streak recovery (graceful):** Instead of showing "broken" immediately, show "1-day grace — complete by tomorrow to continue"

---

### 4.8 Goals — Evolution Path

**Minimum:** Goal CRUD + milestones + exam workspace  
**Good:** Exam feasibility bar, pacing card, horizon countdown  
**Excellent:** Goals cascade to the study plan. Milestones have due dates. The system proposes weekly session targets from goal data.  
**Exceptional:** Goals are living documents. The system tracks them against actual behavior and adjusts feasibility predictions dynamically. A goal 3 weeks behind schedule gets an "intervention" flag.

**Core improvements:**
- **Milestone due dates + ordering:** Milestones need dates and sequence dependencies
- **"Generate Study Plan from Goal" action:** Creates a set of study plan items across the next N weeks derived from goal target date, topics, and available hours
- **Weekly session target from goal:** "To pass Physics exam on Dec 15, you need 8.5h/week — you've done 4h this week"
- **Goal completion retrospective:** When marking a goal complete, prompt for a "What I Learned" note that auto-saves to the notes system
- **Goal → daily plan cascade:** Active exam goals contribute to the daily dashboard's ExamHorizonBar with session suggestions

**Advanced improvements:**
- **Goal health score:** Derived from pace, milestone completion rate, and study session alignment
- **Mid-point intervention:** If you're 50% through the time until an exam but only 20% through the syllabus, the system sends a proactive alert

---

### 4.9 Analytics — Evolution Path

**Minimum (current):** Text-based intelligence report with exam readiness and retention forecast  
**Good:** Visual charts for study hours, habit completion, task velocity  
**Excellent:** Side-by-side week comparisons, clickable data points that navigate to the relevant section  
**Exceptional:** Analytics are proactive. When a pattern crosses a threshold, the system sends a notification: "Your study time has dropped 40% this week — would you like to adjust this week's plan?"

**Core improvements:**
- **Study hours bar chart:** Weekly bars for the last 8 weeks — the single most asked-for analytics visualization in this category
- **Activity heatmap:** GitHub-style contribution graph of study days (365-day view)
- **Per-subject time breakdown:** Pie or bar showing study time distribution across subjects for selected period
- **Week-over-week comparison:** Current week vs. last week for key metrics, shown as delta badges (▲12%, ▼8%)
- **Clickable ThermalDifficultyMatrix dots:** Click a topic dot → navigate to that topic in the Study section

**Advanced improvements:**
- **Predictive exam readiness trend:** "At your current pace, your readiness score reaches 80% in 3 weeks"
- **Focus quality trend chart:** Flow quality scores over last 20 sessions (sparkline)
- **Personalized insight cards:** System-generated observations: "You study best on Wednesday mornings" or "Your Physics retention is at risk — last reviewed 12 days ago"

---

### 4.10 Weekly Review — Evolution Path

**Minimum:** 3-step form with AI synthesis  
**Good:** Pre-populated prompts, streak for completing reviews, history tab  
**Excellent:** The review connects directly to next-week planning — outputs become inputs for the Monday morning plan  
**Exceptional:** The review ritual is the most important weekly interaction. It compares data automatically, surfaces surprises, and produces a tangible next-week action plan without the user having to do mental math.

**Core improvements:**
- **Review history tab:** Last 8 weekly reviews visible as a timeline — title, key metric, AI summary excerpt
- **Pre-populated reflection prompts:** Breakthroughs: "What concept finally clicked this week?" — reduces blank page anxiety
- **Week-over-week data comparison auto-populated in Step 1:** "Study hours: 7.2h (▲ 1.8h from last week)"
- **Review streak tracker:** "You've completed 4 consecutive weekly reviews 🔥" shown in sidebar
- **Next week planning output:** Review completion → "Would you like to create this week's study plan now?" flow

**Advanced improvements:**
- **Quarterly review flow:** Every 4th weekly review becomes a "Monthly Retrospective" with expanded prompts and a longer intelligence window

---

### 4.11 Settings — Evolution Path

**Core improvements:**
- **Data summary card:** "Your workspace: 42 notes, 312 flashcards, 87 study sessions, 23 goals" — makes users feel the value of their data
- **Calendar feed status indicator:** Green/red sync status with last-synced timestamp
- **Notification test button:** "Send test notification" to verify browser permissions are working
- **AI key validation with last-used timestamp:** "Key valid ✓ — last used 2 hours ago"

---

## 5. Deep Feature Expansion Opportunities

### 5.1 The Closed Daily Loop (Highest Priority System-Level Fix)

**The Problem:**  
The core daily workflow — Dashboard → Study → Focus → Reflection → Analytics — has broken handoffs:

- Starting a Focus session from a Study plan item doesn't mark that item in-progress
- Completing a Focus session doesn't prompt session logging in Study
- Evening closure reflections don't feed into next-day's morning plan
- Weekly review outputs don't automatically populate next week's plan

**The Fix:**
Every major action should have a defined "what happens next" handoff:

```
[Study Plan Item] → click "Start Focus" → Focus Room loads with plan item pre-filled
[Focus Session Completes] → post-reflection "Mark plan item complete?" → yes → plan item ticked
[Evening Closure] → "tomorrow's intentions" → create as tomorrow's tasks
[Weekly Review] → "next week commitment" → create as study plan items for Monday
[Goal created with exam date] → system proposes weekly sessions for that goal
```

This is the most impactful improvement across the entire product. It doesn't require building anything new — it requires connecting existing endpoints.

---

### 5.2 Intelligence Surface Layer

**The Problem:**  
The intelligence engine (`utils/intelligence/`) is sophisticated. It computes: cognitive rhythm, execution intelligence, topic mastery, attention intelligence, retention signals, subject health scores, circadian synthesis, recommendations. Almost none of this is visible to the user in a way that drives behavior.

**The Fix — Progressive Intelligence Display:**
- **Dashboard:** 1-2 sentence intelligence summary (not a modal, just text below the greeting): "Your strongest focus window is 9–11am. You have 3 overdue SRS topics."
- **Study section:** Subject health score on each subject card (single colored indicator)
- **Goals section:** Feasibility score with hours-per-week guidance instead of just a bar
- **Focus Room:** Pre-session suggestion: "Based on your retention data, spending this session on Thermodynamics would have the highest impact"
- **Notifications:** Intelligence-driven alerts (not just time-based reminders): "Your Physics retention drops to 40% in 2 days without a review"

---

### 5.3 The "What Should I Study Next?" Clarity

**The AdaptiveStudySuggester widget exists** in the Study section but the user has to go to Study → select a subject → see the widget. The recommendation engine (`computeExplainableRecommendations`) runs and produces typed recommendations with reasons, but the user never sees them proactively.

**The Fix:**
Surface the #1 recommendation from the engine in two places:
1. Dashboard: "Recommended next: Quantum Mechanics (Retention at 42% — overdue 3 days)" → click → starts focus session
2. Focus pre-session idle state: "Suggested for this session based on your learning data"

This is already computed. It just needs to be surfaced.

---

## 6. UX Improvements

### 6.1 Navigation & Information Architecture

**Current Issues:**
- "Study & Syllabus" and "Knowledge & Notes" feel like separate apps, not connected knowledge systems
- "Study Rooms" is deeply nested — discovery is low
- "Guide Center" has no persistent surface area (users forget it exists)
- Mobile navigation (5 tabs: Today, Focus, Subjects, Tasks, Progress) is reasonable but excludes Notes and Habits from mobile prominence

**Improvements:**
- Add a "Study" indicator on the sidebar showing today's plan completion percentage
- Show a small "🔥 N" streak badge on the Habits nav item
- Contextual breadcrumbs within Study: "Study → Physics → Quantum Mechanics → [topic detail]"

### 6.2 Empty States

All section empty states need to be **instructional**, not just decorative:
- Tasks empty state: "Add your first task. Try: 'Study Quantum Mechanics by Friday for 2h'"
- Notes empty state: "Create your first note. Notes link to subjects and auto-generate flashcards."
- Goals empty state: "Set your first exam goal. The system will track your readiness daily."

### 6.3 Loading States

- Dashboard loads all 13 data sources simultaneously — this is correct but the skeleton should show the most important sections (task list, study plan) first
- Study section: show subject skeletons while topics load in background

### 6.4 Error Recovery

- The PartialDataWarningBanner approach is good. Extend it: show which specific sections failed and have targeted retry buttons per section.

### 6.5 Mobile Experience

- The Focus Room works on mobile but the soundscape bar and preset switcher are cramped
- The 14-day habit matrix breaks on narrow screens — the 7-day collapse is correct but the transition isn't smooth
- The Task Priority Matrix is not usable on mobile — needs a simplified version or should be desktop-only with a clear indication

---

## 7. Cross-Section Integration Opportunities

This is the most important architectural section. Solis has the data. What it lacks is the wiring.

### 7.1 Confirmed Integration Gaps (from code inspection)

| From | To | Current State | What It Should Do |
|---|---|---|---|
| Focus Session Complete | Study Plan Item | Manual | Auto-prompt: "Mark plan item complete?" |
| Focus Session Complete | Study Session Log | Manual | Auto-log with pre-filled fields from session params |
| Evening Closure | Tomorrow's Tasks | Partial (creates tasks) | Also populates morning planning modal next day |
| Weekly Review | Next Week Study Plan | Manual (creates one task) | Should seed next week's study plan items |
| Goals (Exam) | Study Plan | None | Should propose weekly sessions toward exam |
| Goals Milestone Due Date | Tasks | None | Should create a task when milestone due date approaches |
| Habit "Review Flashcards" | SRS Session Complete | None | Should auto-toggle habit when review session saved |
| Analytics Recommendations | Planner | None | Recommendations should create plan items or suggest them |
| Morning Planning Modal | Study Plan | Partial | Morning intent should update today's study plan priority |
| Daily Intention | Goals | None | Should link intention to a goal for tracking |
| Task Completion | Habit Tracking | None | Completing a study task should optionally trigger a study habit |
| Drift Pad Thoughts | Task List | Partial (creates tasks) | Should be clearly labeled and filterable by origin |

### 7.2 Integration Architecture Recommendation

Add a lightweight **cross-domain event system** that fires typed events when significant actions happen:

```typescript
type SolisEvent = 
  | { type: 'focus_session_completed', subjectId: string, planItemId?: string, durationMinutes: number }
  | { type: 'study_plan_item_started', planItemId: string, subjectId: string }
  | { type: 'goal_created', goalId: string, examDate?: string }
  | { type: 'weekly_review_completed', nextWeekCommitment: string }
```

Subscribers (dashboard, study planner, habits) can react to these events to provide the "closed loop" experience. The existing `dataService.subscribe` channel system is the right foundation — extend it with typed event payloads.

---

## 8. Competitive Inspiration (Applied, Not Copied)

### 8.1 Dashboard (inspired by Sunsama)

Sunsama's "daily planning ritual" is mandatory — it forces you to intentionally schedule each task into the day before you start. Solis has the morning planning modal but it's optional and doesn't enforce time-boxing.

**Solis can do better:** Make the morning ritual more guided (3 minutes, 3 steps) but keep the "skip" option for users who've already planned. The key Sunsama behavior to adopt: **every task needs a time estimate before it enters the daily plan.** Solis's workload guard already does this calculation — just close the loop.

### 8.2 Study Section (inspired by RemNote)

RemNote's "study session" automatically surfaces due flashcards, notes, and concepts tied to the current document. The learning is embedded in the content.

**Solis can do better:** When a user opens a subject, the AdaptiveStudySuggester should be the most prominent element — not a widget in a tab. "Before you start: 3 overdue flashcards and 1 low-retention topic need attention." This is a 5-minute active recall primer before the deep work session.

### 8.3 Focus (inspired by Brain.fm)

Brain.fm's claim is that its AI-generated music is functionally different from ambient music for focus. Solis uses Web Audio API synthesis which is legitimately different from Spotify playlists — this is an underplayed differentiator.

**Solis can do better:** Market the soundscape science. Add a brief "How our soundscapes work" tooltip explaining binaural beats + pink noise. Let users set a default soundscape per subject (e.g., "Physics → Binaural Alpha"). Track which soundscape correlates with highest flow quality for that user and suggest it.

### 8.4 Habits (inspired by Streaks / Habitify)

Streaks (iOS) uses circular completion indicators with counts rather than checkboxes. This small UX change has a significant motivational impact.

**Solis can do better:** Replace the checkbox-based habit list with visual progress rings for quantitative habits and completion circles for boolean habits. Add the "Chain" visual metaphor — a linked chain that visually breaks when a streak ends.

### 8.5 Analytics (inspired by RescueTime)

RescueTime's "Productivity Pulse" is a single number (0-100) that summarizes the day. This is polarizing but effective for quick self-assessment.

**Solis can do better:** The daily momentum score already exists in `utils/productivity.ts`. Surface it prominently on the dashboard as a "Daily Study Score" (not gamified — just informational). Show: "Today: 74 / Your avg: 68 / This week: 71."

### 8.6 Collaboration (inspired by Focusmate)

Focusmate's core value is the structured 50-minute session with a stranger. The accountability comes from the commitment to another person, not just a timer.

**Solis can do better:** Study Pacts already exist. The missing piece is verification and ceremony. When both pact members complete their sessions on the same day, send a "You and [partner] both hit your goals today 🎉" notification. This costs nothing to implement once Realtime is working.

---

## 9. Existing Feature Improvements vs. New Features

### Category A: Existing Section Improvements (Priority — These Come First)

These are changes to sections that already exist. They deepen value without adding new surfaces.

| Improvement | Section | Complexity | Impact |
|---|---|---|---|
| Close Focus → Study Plan loop | Focus + Study | Low | Critical |
| Auto-log study session post-focus | Focus + Study | Low | Critical |
| Wiki-link autocomplete | Notes | Medium | High |
| Study hours bar chart | Analytics | Medium | High |
| Activity heatmap (365-day) | Analytics | Medium | High |
| Subtask progress in task row | Tasks | Low | High |
| 90-day habit heatmap | Habits | Medium | High |
| Milestone due dates | Goals | Low | High |
| Subject health score on card | Study | Low | High |
| Session history in Focus | Focus | Low | Medium |
| Daily study score on dashboard | Dashboard | Low | Medium |
| Review history tab | Weekly Review | Medium | Medium |
| Plan item → Focus launch | Study | Low | High |
| Daily intention linked to goals | Dashboard | Low | Medium |
| Guided break transitions | Focus | Low | Medium |
| Intelligence surfaced on dashboard | Dashboard | Medium | High |
| Markdown toolbar in notes | Notes | Low | Medium |
| Note pinning | Notes | Low | Medium |
| Bulk task actions | Tasks | Medium | Medium |
| Goal → study plan generation | Goals | High | High |
| Quantitative habit progress today | Habits | Low | Medium |
| Week-over-week analytics comparison | Analytics | Medium | High |
| Morning ritual completion state | Dashboard | Low | Medium |
| Streak for completing weekly reviews | Weekly Review | Low | Medium |

### Category B: Completely New Capabilities (Phase Later)

These would add a new surface/module that doesn't exist today.

| New Feature | Rationale | Complexity | Priority |
|---|---|---|---|
| Supabase Realtime for Study Rooms | Makes rooms actually collaborative | High | Critical (blocker) |
| Knowledge Graph Visualization | Visual map of note connections | High | Medium |
| Study Hours Calendar Export (iCal) | Plan study sessions in real calendar | Medium | Low |
| Spaced Review Suggestions in Focus | "Before you start, review 3 cards" | Medium | High |
| Circadian intelligence personalization | Session suggestions by time of day | High | Medium |
| Quarterly Review Ritual | Expanded monthly/quarterly reflection | Medium | Low |
| Public Room Discovery | Find study rooms by subject | Medium | Low |
| Anki Web Sync | Import from AnkiWeb account | High | Low |

---

## 10. Prioritized Enhancement Backlog

### CRITICAL (Must build to fix broken loops)

| # | Feature | Section | Complexity | Dependencies |
|---|---|---|---|---|
| C1 | Focus → Study Plan closed loop | Focus + Study | Low | None |
| C2 | Focus → Study Session auto-log | Focus + Study | Low | C1 |
| C3 | Supabase Realtime for rooms | Rooms | High | Infrastructure |
| C4 | Intelligence surfaced on dashboard | Dashboard | Medium | None |
| C5 | Goal → study plan generation | Goals | High | None |

### HIGH IMPACT (Strong user value, reasonable effort)

| # | Feature | Section | Complexity | Dependencies |
|---|---|---|---|---|
| H1 | Study hours bar chart | Analytics | Medium | None |
| H2 | Activity heatmap (365-day) | Analytics | Medium | None |
| H3 | Wiki-link autocomplete | Notes | Medium | None |
| H4 | Subject health score on card | Study | Low | None |
| H5 | 90-day habit heatmap | Habits | Medium | None |
| H6 | Weekly review history tab | Review | Medium | None |
| H7 | Milestone due dates | Goals | Low | None |
| H8 | Week-over-week analytics delta | Analytics | Medium | None |
| H9 | Subtask progress in task row | Tasks | Low | None |
| H10 | Plan item → Focus launch button | Study | Low | None |

### MEDIUM IMPACT (Meaningful UX improvements)

| # | Feature | Section | Complexity |
|---|---|---|---|
| M1 | Guided break transitions | Focus | Low |
| M2 | Session history panel in Focus | Focus | Low |
| M3 | Quantitative habit progress bar | Habits | Low |
| M4 | Markdown toolbar | Notes | Low |
| M5 | Note pinning | Notes | Low |
| M6 | Daily study score on dashboard | Dashboard | Low |
| M7 | Morning ritual completion state | Dashboard | Low |
| M8 | Review streak tracker | Weekly Review | Low |
| M9 | NLP parser confirmation bubble | Tasks | Low |
| M10 | Recurring task visual label | Tasks | Low |
| M11 | Goal completion retrospective note | Goals | Low |
| M12 | Daily intention linked to goals | Dashboard | Low |
| M13 | Data summary card in settings | Settings | Low |
| M14 | Bulk task actions | Tasks | Medium |
| M15 | Notes in Command Palette | Notes | Medium |

---

## 11. Dependencies & Technical Foundations

### Foundation Work (Must be done before dependent features)

**F1 — Supabase Realtime Channel Infrastructure**  
Needed for: Study Rooms real-time sync, shared timer, presence updates  
What: Add `supabase.channel()` subscriptions in `rooms.service.ts`, broadcast timer state, handle presence joins/leaves  
Blocks: C3, and all Rooms improvements

**F2 — Cross-Domain Event Emitter (Typed)**  
Needed for: All "closed loop" integrations (C1, C2, H10)  
What: Extend `dataService.subscribe` to accept typed event payloads, not just entity channels  
Blocks: C1, C2, habit auto-toggle, drift pad origin labels

**F3 — Dashboard Intelligence Computation Layer**  
Needed for: C4 (intelligence on dashboard), daily study score, circadian suggestions  
What: The intelligence engine runs in `AnalyticsPage` but not on Dashboard. Move core computation to a shared hook `useUserIntelligence()` that runs once on auth and is accessible across pages.  
Blocks: C4, M6, and all intelligence surface features

**F4 — StudyPage Decomposition**  
Needed for: Any future Study improvements without breaking existing 2,199-line file  
What: Already partially done (`useStudyPage` hook exists). Complete the decomposition — extract rendering into focused sub-components.  
Blocks: Study section advanced improvements

**F5 — ICS Calendar Sync Status**  
Needed for: Calendar integration settings improvements  
What: Store last-synced timestamp and feed URL status in Supabase; display in Settings.

---

## 12. Development Roadmap

The roadmap is organized by **what unlocks what** — not arbitrary time periods.

```
Phase 0: Close the Loop & Surface Intelligence
  └─ No new sections. Fix the handoffs. Show what we already compute.
  
Phase 1: Analytics & Visibility
  └─ Add visual analytics. Make progress feel real.
  
Phase 2: Notes & Knowledge Depth
  └─ Wiki-link autocomplete, knowledge graph, note discovery.
  
Phase 3: Goals → Plan → Review Cycle
  └─ Goals generate plans. Reviews feed forward. Weekly ritual has history.
  
Phase 4: Habits & Rituals Maturity
  └─ Long-term heatmap, smart notifications, habit-session integration.
  
Phase 5: Real-Time Rooms
  └─ Supabase Realtime. Synchronized timers. Body-doubling structure.
  
Phase 6: Intelligence Personalization
  └─ Circadian suggestions. Soundscape learning. Adaptive difficulty.
```

---

## 13. Phase-by-Phase Implementation Plan

---

### Phase 0 — Close the Loop & Surface Intelligence

**Objective:** Fix broken handoffs between existing sections. Make what the system already knows visible. Zero new sections.

**Why This Phase Comes First:**  
These are the highest-leverage, lowest-effort changes. The daily core workflow (Dashboard → Focus → Study → Analytics) has gap points where the user must manually do work the system could do automatically. Fixing these first makes every subsequent phase more impactful because users will be more engaged with the product.

**Sections Affected:** Dashboard, Focus, Study, Tasks, Goals (minor)

**Features / Improvements Included:**

| ID | Feature | Description | Complexity |
|---|---|---|---|
| P0.1 | Focus → Plan Item auto-complete prompt | On focus session end, if `planItemId` param was set, show "Mark plan item complete?" in reflection modal | Low |
| P0.2 | Focus → Study Session auto-log | If `subjectId` is set and retention rating captured in reflection, call `dataService.study.logSession()` with pre-filled fields | Low |
| P0.3 | Morning ritual completion state | Store morning planning completion date in localStorage; Dashboard reads it and shows ✓ state on button | Low |
| P0.4 | Daily study score on dashboard | Derive score from `productivity.ts` functions; display as a single number with "Your avg: X" context | Low |
| P0.5 | Intelligence summary on dashboard | Run `computeExplainableRecommendations` for today; show top 1-2 recommendations as a card below the greeting | Medium |
| P0.6 | Subject health score on study cards | Wire `computeSubjectLearningHealths` output to a visible indicator on each subject card (green/amber/red) | Medium |
| P0.7 | Plan item → Focus launch button | Add a "▶ Start" button on each StudyPlanItem that navigates to Focus with `subjectId`, `planItemId`, `title`, and `targetMinutes` pre-filled | Low |
| P0.8 | Daily intention → goal linkage | Replace free-text Daily Intention with: free-text OR "Link to a goal" dropdown; store goalId alongside intention text | Low |
| P0.9 | Subtask progress badge in task row | Show "3/5 subtasks" badge on TaskRow without expanding | Low |
| P0.10 | Recurring task visual label | Show ↻ icon + pattern description on recurring tasks in all list views | Low |

**Dependencies:** None (all use existing data and services)

**Expected User Impact:**
- Users who complete a focus session no longer have to manually log the study session — the loop closes automatically
- The #1 recommendation from the intelligence engine appears on the dashboard daily — proactive guidance replaces passive dashboards
- Study plan items have a clear "Start" action — the path from plan to execution is one click

**Technical Impact:**
- `FocusContext.tsx` → `saveReflection()`: add plan item completion check + study session logging
- `DashboardPage.tsx`: add `computeExplainableRecommendations` call with today's data; add study score derivation
- `StudyPage.tsx` / `StudyPlanAgenda.tsx`: add `▶ Start` button with Focus navigation
- `TaskRow.tsx`: read subtasks length/completed count; render badge

**Risks:**
- Auto-logging a study session when the user didn't intend to (if they started Focus on a plan item but abandoned it). **Mitigation:** Only trigger when focus was completed (not cancelled), and always ask via the reflection modal — never silently.

**Definition of Done:**
- Completing a 25m Focus session with a linked plan item → reflection modal shows "Mark plan item complete?" → pressing Yes → plan item checked in Study page
- Dashboard shows top 1 intelligence recommendation with a clear explanation
- Each subject card in Study shows a green/amber/red health indicator derived from retention + hours data
- Every StudyPlanItem has a "▶ Start" button that launches Focus with correct params

**What Must NOT Be Built Yet:**
- Supabase Realtime (Phase 5)
- Knowledge graph visualization (Phase 2)
- New analytics charts (Phase 1)
- New goal → plan generation (Phase 3)

---

### Phase 1 — Analytics & Visibility

**Objective:** Add visual data representations that make progress feel real and comparisons meaningful.

**Why This Phase Comes After Phase 0:**  
Phase 0 creates better data (auto-logged sessions, closed loops) and makes the system smarter. Phase 1 makes that data visible. Doing Phase 1 before Phase 0 would mean visualizing incomplete/manually-entered data.

**Sections Affected:** Analytics (primary), Dashboard (minor)

**Features / Improvements Included:**

| ID | Feature | Description | Complexity |
|---|---|---|---|
| P1.1 | Study hours bar chart | Weekly bars for last 8 weeks — using `study_sessions` and `focus_sessions` data | Medium |
| P1.2 | 365-day activity heatmap | GitHub-style grid; each cell = study minutes that day; color = intensity | Medium |
| P1.3 | Per-subject time pie/bar | Breakdown of study time across subjects for selected period | Medium |
| P1.4 | Week-over-week delta badges | Key metrics (study hours, tasks completed, habit rate) shown with Δ vs. last week | Low |
| P1.5 | Clickable ThermalDifficultyMatrix | Click topic dot → navigate to `/app/study` with that subject/topic highlighted | Low |
| P1.6 | Task completion velocity | "Tasks completed per week" trend line for last 6 weeks | Medium |
| P1.7 | Focus quality trend | Flow quality sparkline for last 20 focus sessions | Low |
| P1.8 | Analytics in Command Palette | Cmd+K shows analytics quick facts: "This week: 6.2h studied, 87% habit completion" | Low |

**Dependencies:** P0.2 (richer session data from auto-logging makes charts more accurate)

**Expected User Impact:**
- Users can see at a glance whether they're trending up or down
- The activity heatmap creates the "don't break the chain" motivation pattern
- Per-subject breakdown surfaces imbalances ("I've studied physics 3x more than chemistry")

**Technical Impact:**
- `AnalyticsPage.tsx`: add chart rendering (pure CSS bars or lightweight SVG — no chart library dependency to maintain zero-framework principle)
- `utils/intelligence/rhythm.ts`: ensure it returns day-by-day buckets suitable for bar chart rendering
- New: `utils/analytics/heatmap.ts` — compute 365-day grid from sessions array

**Risks:**
- SVG/CSS-only charts may be complex to build precisely. **Mitigation:** Keep charts simple (bars, dots, heatmap cells) — no animations needed for data correctness.

**Definition of Done:**
- Analytics page shows a bar chart of study hours per week for 8 weeks
- Activity heatmap renders 365 cells, color-coded by intensity
- Delta badges on all primary metrics
- ThermalDifficultyMatrix dots are clickable and navigate correctly

**What Must NOT Be Built Yet:**
- Predictive analytics or AI-generated insights (Phase 6)
- Study Room analytics (Phase 5)
- Knowledge graph (Phase 2)

---

### Phase 2 — Notes & Knowledge Depth

**Objective:** Make the Notes section genuinely powerful as a knowledge management system, not just a markdown editor.

**Why This Phase Comes Here:**  
Phase 0 and Phase 1 addressed the daily workflow and data visibility. The Notes section is the most underutilized high-value section — it already has bidirectional wiki-linking, AI generation, and inline card parsing, but lacks the UX polish to make these discoverable and frictionless. Notes are also the foundation for the "Ask Solis" grounded Q&A — better notes → better AI answers.

**Sections Affected:** Notes (primary), Command Palette, Study (minor)

**Features / Improvements Included:**

| ID | Feature | Description | Complexity |
|---|---|---|---|
| P2.1 | Wiki-link autocomplete | `[[` triggers a dropdown of existing note titles filtered as you type; arrow keys + Enter to select | Medium |
| P2.2 | Markdown toolbar | Buttons for bold, italic, H1/H2, code block, bullet list, numbered list above the editor | Low |
| P2.3 | Note pinning | Star icon on note tile; pinned notes float to top of list | Low |
| P2.4 | Notes in Command Palette | Fuzzy search across note titles and content previews in Cmd+K | Medium |
| P2.5 | Note version history | Store last 10 auto-save snapshots in Supabase; restore via dropdown in note header | High |
| P2.6 | Knowledge graph visualization | Canvas-based node-link diagram; nodes = notes, edges = wiki-links; click to navigate | High |
| P2.7 | Study → Notes contextual bridge | When starting Focus on a subject, sidebar shows: "You have 4 notes on [subject] — view them?" | Low |
| P2.8 | Reflection notes visual differentiation | Notes created from Evening Closure get a 🌙 icon and "Reflection" source label | Low |

**Dependencies:** Phase 0 for richer data; P2.1 before P2.6 (graph needs good link data)

**Definition of Done:**
- Typing `[[Qu` shows a dropdown with "Quantum Mechanics" and other matching notes
- Cmd+K returns note results with content preview snippets
- Pinned notes always appear first in the notes list
- Knowledge graph renders and is navigable (P2.6 can be Phase 2b if needed)

**What Must NOT Be Built Yet:**
- AI-powered note summarization beyond what already exists
- Note collaboration (multi-user editing)

---

### Phase 3 — Goals → Plan → Review Cycle

**Objective:** Make the Goals, Study Plan, and Weekly Review work as a coherent planning and accountability loop.

**Why This Phase Comes Here:**  
The daily loop (Phase 0) and data visibility (Phase 1) are established. Now we deepen the *strategic* layer — how do long-term goals translate into daily actions, and how does the review ritual close the weekly loop?

**Sections Affected:** Goals, Weekly Review, Study, Dashboard

**Features / Improvements Included:**

| ID | Feature | Description | Complexity |
|---|---|---|---|
| P3.1 | Milestone due dates + ordering | Milestones get `dueDate` field and ordinal position; displayed with countdown | Low |
| P3.2 | "Generate Study Plan from Goal" | From an exam goal, computes N sessions/week based on exam date and topic count; creates study plan items | High |
| P3.3 | Goal → weekly session target | "To meet your Physics exam goal, you need 8.5h/week. This week: 4.2h (49%)" shown in goal card | Medium |
| P3.4 | Goal completion retrospective | Marking goal complete prompts: "Write a reflection on this goal" → creates a reflection note | Low |
| P3.5 | Review history tab | Weekly Review page shows last 8 reviews with date, AI summary excerpt, key metrics | Medium |
| P3.6 | Pre-populated review prompts | Replace blank text areas with specific questions relevant to the user's data | Low |
| P3.7 | Review → next week planning | On review completion, offer: "Create this week's study plan?" → seeds Monday plan items | Medium |
| P3.8 | Review streak tracker | Sidebar badge: "4-week review streak 🔥" | Low |
| P3.9 | Weekly review trend data | Step 1 shows: "Study hours: 7.2h (▲1.8h vs last week)" auto-populated | Low |

**Dependencies:** P0 completed (auto-logging gives better data for goal tracking); Phase 1 for visual trend context

**Definition of Done:**
- An exam goal with a date → "Generate Study Plan" → creates 3 sessions/week for the next 6 weeks
- Weekly Review Step 1 auto-shows week-over-week comparison without user needing to switch scope
- Completing a weekly review → "Create next week's plan?" → 3 study plan items created for next week

---

### Phase 4 — Habits & Rituals Maturity

**Objective:** Make habits feel motivating over the long term, not just a daily checklist.

**Sections Affected:** Habits, Dashboard

**Features / Improvements Included:**

| ID | Feature | Description | Complexity |
|---|---|---|---|
| P4.1 | 90-day completion heatmap | Replace or extend 14-day matrix with a 3-month heatmap view toggle | Medium |
| P4.2 | Personal best streak display | Show "Best: 42d / Current: 8d" on each habit card | Low |
| P4.3 | Quantitative progress bar today | For numeric habits, show today's progress: "12/20 pages (60%)" | Low |
| P4.4 | Study → habit auto-toggle | When SRS review session saved, toggle "Review flashcards daily" habit if it exists | Low |
| P4.5 | Habit time preference + smart notify | Each habit can have a preferred time; notification service sends reminder at that time | Medium |
| P4.6 | Habit category insights | "Wellness habits: 87% this month (strongest)" shown in Analytics section | Medium |
| P4.7 | Chain protection alert | "Your 30-day streak on [habit] ends in 2 hours — complete it before midnight" | Medium |

**Dependencies:** P0 (notification infrastructure confirmed working); Study-habit auto-toggle needs typed event system (F2)

**Definition of Done:**
- Switching habit view to "90-day" shows a GitHub-style heatmap for that habit
- Completing a spaced review session auto-toggles the "Review flashcards" habit (if it exists)
- Habit time preference set to 8am → browser notification at 8am

---

### Phase 5 — Real-Time Study Rooms

**Objective:** Make Study Rooms actually collaborative with real-time synchronization.

**Why This Phase is Late:**  
Supabase Realtime requires significant infrastructure work and is a single-feature investment. Phases 0-4 improve the entire product for all users immediately. Rooms improve experience only for multi-user sessions. The order is correct: build individual excellence first, then layer collaboration on top.

**Sections Affected:** Study Rooms (entire), Dashboard (AmbientPeerPresenceWidget)

**Features / Improvements Included:**

| ID | Feature | Description | Complexity |
|---|---|---|---|
| P5.1 | Supabase Realtime channels for rooms | `supabase.channel('room:${roomId}')` with broadcast for timer state and presence | High |
| P5.2 | Synchronized room timer | Timer start/pause/complete broadcasted to all participants in real time | High |
| P5.3 | Real-time presence updates | Join/leave events update participant list instantly for all users in the room | Medium |
| P5.4 | Session structure (check-in/work/debrief) | 3-phase flow: 2m check-in → 50m work (synchronized) → 5m debrief | Medium |
| P5.5 | Study Pact verification | Pacts auto-check against session logs each day; show compliance streak | Medium |
| P5.6 | Partner analytics card | "You and [partner] have studied together 12h across 8 sessions" | Low |
| P5.7 | Mutual completion celebration | Both pact members complete → notification: "You and [partner] both hit goals today 🎉" | Low |

**Dependencies:** Supabase Realtime setup (F1)

**Definition of Done:**
- User A starts room timer → User B sees timer start without refreshing
- Participant joins room → all other participants see new avatar appear in real time
- Pact completion rate shows in room history and partner profile

---

### Phase 6 — Intelligence Personalization

**Objective:** Make Solis adapt to the individual user's patterns, not just compute averages.

**Sections Affected:** Focus, Dashboard, Study, Notifications

**Features / Improvements Included:**

| ID | Feature | Description | Complexity |
|---|---|---|---|
| P6.1 | Circadian session suggestions | "Your focus quality peaks 9-11am — a session now would be high value" based on historical flow data | High |
| P6.2 | Per-subject soundscape learning | Track which soundscape correlates with highest flow quality per user; suggest it next session | Medium |
| P6.3 | Focus session milestone tracking | "100th focus session 🎉" — tasteful, non-gamified milestone acknowledgment | Low |
| P6.4 | Personalized analytics insights | Machine-learned observations: "You're 23% more productive on Wednesdays" surfaced as insight cards | High |
| P6.5 | Proactive retention alerts | Intelligence-driven notifications: "Your Thermodynamics retention drops to 40% in 48h" | Medium |
| P6.6 | Adaptive exam feasibility | Feasibility recalculates weekly against actual hours logged — drift triggers a proactive alert | Medium |

**Dependencies:** Phases 0-5 completed (rich behavioral data needed for personalization to be meaningful)

---

## 14. Milestones & Definition of Done

### Phase 0 Milestones

**M0.1 — Focus Loop Closure** (Items P0.1, P0.2)
- Done when: Completing a Focus session with a linked plan item automatically prompts session logging and plan item completion in the reflection modal. No manual logging required for a standard study session.

**M0.2 — Dashboard Intelligence** (Items P0.3, P0.4, P0.5, P0.8)
- Done when: Dashboard shows: morning ritual completion state, a daily study score number, and the top 1-2 recommendations from the intelligence engine — all loading within the existing dashboard data fetch.

**M0.3 — Study → Focus Navigation** (Items P0.6, P0.7)
- Done when: Each subject card shows a health indicator and each study plan item has a "▶ Start" button that correctly passes all params to the Focus page.

**M0.4 — Task Micro-UX** (Items P0.9, P0.10)
- Done when: TaskRow shows subtask progress badge without expanding; recurring tasks show ↻ label.

### Phase 1 Milestones

**M1.1 — Core Charts** (P1.1, P1.2, P1.3)
- Done when: Analytics page renders a bar chart, heatmap, and subject breakdown without external chart library dependencies.

**M1.2 — Comparison & Interaction** (P1.4, P1.5, P1.6, P1.7)
- Done when: Delta badges show on key metrics; clicking a ThermalDifficultyMatrix dot navigates to Study with correct topic highlighted.

### Phase 2 Milestones

**M2.1 — Editor Polish** (P2.1, P2.2, P2.3)
- Done when: Wiki-link autocomplete works in the markdown editor; toolbar is visible and functional; notes can be pinned.

**M2.2 — Discovery** (P2.4, P2.7, P2.8)
- Done when: Cmd+K returns note results; Focus session start shows contextual note bridge for linked subject.

**M2.3 — Knowledge Graph** (P2.6) — can be Phase 2b
- Done when: Graph renders with clickable nodes and navigable edges.

### Phase 3 Milestones

**M3.1 — Goal → Plan** (P3.1, P3.2, P3.3)
- Done when: An exam goal generates study plan items automatically; goal card shows weekly session target vs. actual.

**M3.2 — Review Depth** (P3.4 through P3.9)
- Done when: Review page has history tab; review completion creates next week's plan; review streak shown in sidebar.

### Phase 4 Milestones

**M4.1 — Habit Maturity** (P4.1 through P4.7)
- Done when: 90-day heatmap available; auto-toggle from study sessions works; chain protection alerts functional.

### Phase 5 Milestones

**M5.1 — Realtime Foundation** (P5.1, P5.2, P5.3)
- Done when: Two users in the same room see timer state and presence updates without page refresh. Verified with 2-user test.

**M5.2 — Room Features** (P5.4 through P5.7)
- Done when: Session structure flow works; pact verification runs daily; partner analytics visible.

### Phase 6 Milestones

**M6.1 — Circadian Intelligence** (P6.1, P6.2)
- Done when: After 20+ sessions, dashboard shows a time-of-day suggestion based on historical flow quality data.

**M6.2 — Proactive Alerts** (P6.5, P6.6)
- Done when: A notification fires when retention drops below threshold; exam feasibility alert triggers when user is significantly off-pace.

---

## 15. Long-Term Differentiation Opportunities

### 15.1 The Cognitive Sanctuary (Genuine Focus Science)

Solis already synthesizes Web Audio soundscapes mathematically. No other student tool does this — they all use curated music playlists. This is a genuine technological differentiator that is currently not marketed or explained.

Long term: build a proper "Acoustic Intelligence" layer that tracks which soundscape (binaural alpha vs. pink noise vs. silence) correlates with each user's highest flow quality for each subject type (math vs. reading vs. writing). After 50 sessions, Solis could make genuinely personalized acoustic recommendations with data backing.

### 15.2 The Learning Graph (Connected Knowledge)

Solis has bidirectional wiki-linking, FSRS retention tracking, syllabus topic trees, and note categories. No other web-based student tool combines all four. The long-term vision: every note, flashcard, topic, and session exists as a node in a personal knowledge graph. The system understands: "This flashcard is connected to this note which is connected to this topic which is covered by this exam goal."

When you start a study session, Solis knows the exact learning objects most at risk and most relevant to your goals.

### 15.3 The Planning Realism Engine

Solis already has `workloadCalculator`, `examFeasibility`, `syllabusPacing`, `timeCushion`, and `morningRitual` utilities. No competitor has this level of mathematical planning rigor. The long-term vision: Solis becomes the only student tool that tells you, with mathematical precision, whether your current study schedule is sufficient to reach your goals — and adjusts the recommendation weekly based on actual behavior.

This is the "Motion AI for students" positioning but grounded in actual learning science (spaced repetition + exam preparation research) rather than generic scheduling optimization.

### 15.4 What Solis Should NOT Become

- A general productivity app for non-students (keeps the positioning diluted)
- A social network (Study Rooms are accountability tools, not social feeds)
- A note-taking app first (Notion, Obsidian already own this — Solis' notes are a means to flashcards/quiz/recall, not the end product)
- A gamification-heavy app (points, badges, leaderboards erode the calm, intentional aesthetic)
- A subscription-first funnel (the core daily workflow should always be free; advanced AI/collaboration is the value layer)

---

## 16. Solis North-Star Product Vision

### What Solis Should Look Like When the Roadmap Is Substantially Complete

**The Core Experience:**

Every morning, a student opens Solis. The dashboard already knows approximately how much time they have today (based on calendar integration and their historical patterns). It shows their top 1-2 study recommendations based on what's most at risk in their knowledge graph. They tap a subject, the study plan for that subject is waiting, they tap "Start" on the first plan item, and the Focus Room opens — pre-configured with the right soundscape, the right duration, and their intention auto-filled from the plan item title.

They study. The timer runs. If a distracting thought appears, they park it with one tap. When the session ends, a single reflection prompt appears: "How was your flow? (1-5)" — that's it. One rating. The system takes care of the rest: marks the plan item complete, logs the study session, updates the topic mastery signal, adjusts the retention forecast, and queues the next study recommendation.

At the end of the day, the evening closure ritual takes 3 minutes. They note one win and one friction point. The system creates tomorrow's top tasks from their intentions and clears cognitive load.

On Sunday, the weekly review takes 5 minutes. The system already knows what happened — it shows a visual summary, pre-populated with data. The student writes a few sentences about what clicked and what didn't. The system proposes next week's plan, which the student approves or adjusts. Done.

**Main User Journey:**
`Goal Set → Syllabus Created → Daily Plan Generated → Focus Session Started → Session Logged → Knowledge Updated → Analytics Reflect Progress → Weekly Review Closes Loop → Next Week's Plan Starts Ready`

**Key Sections and How They Connect:**
- **Dashboard** = command center; shows today's state, top recommendation, and progress at a glance
- **Focus Room** = the primary productivity action; everything else feeds it or is fed by it
- **Study** = the long-term knowledge map; topics + sessions + flashcards + resources
- **Notes** = the thinking layer; connected to topics, generates flashcards, powers Ask Solis
- **Goals** = the strategic horizon; exam goals cascade into weekly plans
- **Analytics** = the truth mirror; shows what's actually happening vs. what was planned
- **Habits** = the consistency layer; small daily actions that compound into academic outcomes
- **Weekly Review** = the calibration ritual; closes the weekly loop and seeds the next

**What Makes Solis Useful Every Day:**
- One reliable recommendation each morning of what to study based on retention science
- Zero-friction session start from plan → focus → log
- An accurate picture of where your knowledge is strong and where it's at risk
- Progress that feels real because it's based on actual session data, not just task completion

**What Makes It Different:**
- Genuine learning science integration (FSRS, spaced repetition, retention decay) — not just a timer app
- Mathematical planning realism (exam feasibility, workload guard) — not just a to-do list
- Web Audio synthesis for focus soundscapes — not a Spotify integration
- The system actively tells you what to study next, and it's right — because it knows your syllabus, your sessions, and your exam dates

**How Intelligence Fits:**
Intelligence in Solis is advisory and explainable, never authoritative. It says: "Based on your retention data, you should review Thermodynamics today. Last reviewed 12 days ago — retention estimated at 42%." The user decides. The system never acts without asking. But it always has a reason for its suggestion, shown transparently.

---

*End of Analysis*

> **Next Step:** Use this document to create the Solis Master Development Roadmap and begin Phase 0 implementation — starting with the Focus → Study Plan closed loop (P0.1 + P0.2) as the first milestone.
