# SOLIS — MASTER PRODUCT, UX & ARCHITECTURE SPECIFICATION (`master.md`)

> **STATUS**: CONSTITUTIONAL SOURCE OF TRUTH (ACTIVE)
> **VERSION**: 1.0.0 — Canonical Product Consolidation
> **SUPREMACY**: This document supersedes all 65+ legacy `.md` files in the root directory, `docs/`, `design/`, and `design-system/`.

---

## 1. Document Authority & Governance

### 1.1 Supreme Source of Truth
`master.md` is the **single authoritative specification** for the Solis product, user experience, domain model, intelligence engines, and technical architecture.
- All prior markdown files (`README.md`, `PROJECT.md`, `ARCHITECTURE.md`, `SOLIS_SYSTEM_AUDIT_REPORT.md`, `SOLIS_UI_UX_TRANSFORMATION_REPORT.md`, `SOLIS_TASK_AND_STUDY_ROOM_EVOLUTION_REPORT.md`, `SOLIS_WEB_FEATURE_ROADMAP.md`, `docs/**`, `design/**`, `design-system/**`) are **archived historical context**.
- Whenever any file, code comment, test, or legacy document conflicts with `master.md`, **`master.md` wins unconditionally**.

### 1.2 Mandatory Rules for Future AI Agents & Engineers
1. **Read First**: Every AI agent or developer must read `master.md` before planning, modifying, or adding any code in this repository.
2. **Zero Feature Invention**: No agent may invent new pages, navigation items, database tables, modals, intelligence engines, or AI features not explicitly specified in Section 7 and Section 11 of this document.
3. **Zero Parallel Duplicate Systems**: Never build a "V2" engine alongside an existing engine. Modify or replace the canonical module in-place as defined in Section 18.
4. **Canonical Terminology Enforcement**: All UI copy, TypeScript interfaces, component props, and guide documentation must use the exact terms in Section 5.
5. **No Fake/Simulated Integrations**: Never ship simulated OAuth buttons, hardcoded fake calendar events, or hash-based pseudo-embeddings disguised as "AI" or "Synced". Every feature must be 100% real, deterministic, or explicitly gated behind a valid user-configured API key.
6. **Spec-First Change Protocol**: If a product requirement genuinely needs to evolve, `master.md` must be updated and approved **before** implementation code is changed.

---

## 2. Product Vision & Positioning

### 2.1 Core Purpose (One Sentence)
**Solis is a calm, local-first-capable daily study and deep-work operating system that unifies syllabus tracking, time-blocked task execution, distraction-free focus sessions, active-recall notes/flashcards, and honest progress analytics in one cohesive workspace.**

### 2.2 What Solis Is
- A **daily execution and learning workspace** for serious students, exam candidates, self-directed learners, and technical builders.
- A **closed-loop learning system**: Plan the day (`Today` / `Tasks`) $\rightarrow$ Execute deep work (`Focus` / `Study Rooms`) $\rightarrow$ Consolidate knowledge (`Subjects`, `Notes`, `Flashcards`) $\rightarrow$ Calibrate realism (`Progress` & `Weekly Review`).
- A **deterministic, transparent system** where every metric (mastery, retention, daily capacity, streaks, planning realism) is computed from real logged sessions and explained in plain language.

### 2.3 What Solis Is NOT
- **Not a B2B enterprise team PM tool** (no Jira boards, sprint velocity charts, team permissions, or CRM pipelines).
- **Not an unopinionated blank canvas** like Notion or Obsidian requiring weeks of custom setup.
- **Not a gamified casino app** with XP points, loot boxes, competitive leaderboards, or guilt-inducing streak punishments.
- **Not an AI-slop wrapper** where every screen is buried under floating chatbots, unverified LLM hallucinations, or fake "circadian resonance" pseudo-science.

---

## 3. Target Users & Core Jobs-To-Be-Done

### 3.1 Primary User Persona
**The Serious Scholar & Technical Builder**:
- University students (STEM, Medicine, Law, Humanities), competitive exam candidates (USMLE, Bar, GATE, CFA), grad researchers, and self-taught software engineers.
- They manage multiple concurrent subjects/projects, concrete exam or deliverable deadlines, daily tasks, reading materials, and concept notes.
- **Primary Frustration**: Fragmentation across 5+ apps (Todoist for tasks, Google Calendar for blocks, Forest/Pomofocus for timers, Notion/Obsidian for notes, Anki for flashcards) leading to overplanning, context-switching fatigue, and forgotten material.

### 3.2 Core Jobs-To-Be-Done (JTBD)
1. **Morning Calibration (Under 2 Minutes)**: *"Show me what is due today, what topics are decaying in memory, and how much realistic capacity I have so I can commit to a doable daily plan."*
2. **Time-Blocked Task Management**: *"Let me capture tasks quickly, organize my backlog, and assign tasks or study blocks to specific hours of my day without maintaining two separate schedules."*
3. **Distraction-Free Deep Execution**: *"Lock me into a calm focus timer (solo or in a quiet co-working room) where I can park intrusive thoughts without losing flow, and automatically log my completed time to my subject, topic, and task."*
4. **Structured Curriculum & Active Recall**: *"Let me break my subjects into syllabus topics, write markdown notes, turn key concepts into SM-2 flashcards, and review due flashcards before I forget them."*
5. **Honest Calibration & Reflection**: *"Show me where my hours actually went, how my planned time compares to my actual execution, and guide me through a fast daily closure or weekly review."*

---

## 4. Product Principles & Non-Negotiables

1. **One Way to Do One Job**: One unified schedule model, one mastery/retention engine, one recommendation engine, one notification service, and one audio engine.
2. **Plain Language Over Pseudo-Scientific Jargon**: Use clear, human-centered labels (`Today`, `Tasks`, `Focus`, `Subjects`, `Notes`, `Goals`, `Habits`, `Study Rooms`, `Progress`) instead of obscure jargon ("Cockpit Telemetry", "Sanctuary Protocol", "Circadian Resonance", "Horizon Calibration").
3. **Calm Density & Progressive Disclosure**: Every screen has **one primary focal point**. Secondary tools (filters, analytics breakdowns, AI generation, routines) stay tucked behind clean tabs, drawers, or modals until requested.
4. **Deterministic First, AI Optional**: Every feature in Solis must work 100% deterministically without an API key. When a user provides a Gemini API key in Settings, AI acts as an **optional accelerator** (drafting flashcards, summarizing notes, synthesizing weekly reviews) with a guaranteed deterministic fallback.
5. **Zero Silent Data Loss**: Every form input in Settings, Tasks, Focus, Study, Notes, Goals, and Habits must persist reliably to the active storage backend (`Supabase` when authenticated, `localStorage` in Demo/Offline mode) and invalidate stale caches immediately.
6. **Honest Cap on Daily Deep Work**: Default daily deep-work capacity is **360 minutes (6.0 hours)**, configurable by the user in Settings (`dailyGoalMinutes`). This single constant governs workload warnings across the entire app.
7. **Streak Forgiveness ("Never Miss Twice")**: Consistency is built on self-compassion, not perfectionism. Missing an isolated single day never resets habit streaks to zero; streaks enter a 24-hour "Recovery" state to encourage immediate resumption and eliminate user churn.
8. **Forward Time Cushion Over Vanity Totals**: Knowing how many hours you studied yesterday is secondary to knowing if you have enough open hours before your exam. Every exam goal must project remaining workload against available routine hours to compute a deterministic surplus/deficit.

---

## 5. Canonical Terminology Dictionary

All UI labels, documentation, and code comments must standardize on these canonical terms:

| Concept | Canonical Term (Use This) | Deprecated / Banned Synonyms (Do Not Use) | Definition |
| :--- | :--- | :--- | :--- |
| Daily home screen | **Today** (`/app/dashboard`) | Today Cockpit, Solar Command Center, Observatory | The user's daily briefing, unified schedule, priority tasks, and due reviews. |
| Actionable work item | **Task** (`Task`) | Action Item, Pipeline Node, Todo Artifact | A discrete unit of work with status (`todo`, `in_progress`, `completed`), priority, optional due date, and optional subject/goal link. |
| Scheduled time slot | **Time Block** (`TaskTimeBlock`) | Study Plan Block, Derived TimeBlock, Hour Slot | A scheduled time interval (`startHour`/`startTime`, `durationMinutes`) on a specific date linked to a Task or Subject/Topic. |
| Recurring schedule template | **Routine** (`StudyRoutine`) | Ritual Block, Fixed Anchor | A weekly recurring commitment (e.g., "MWF 09:00 Organic Chemistry Lecture") that projects onto the daily schedule. |
| Timed deep-work session | **Focus Session** (`FocusSession`) | Focus Pod, Flow Sanctuary, Work Session | An active timer session (`focus`, `short_break`, `long_break`) that records focused minutes and optionally logs a `StudySession`. |
| Logged academic/learning record | **Study Session** (`StudySession`) | Academic Log, Session Telemetry | A completed record of study duration, subject, topic, session type, and focus rating (`1–5`). |
| Academic course or domain | **Subject** (`StudySubject`) | Discipline, Field, Curriculum Pillar | A top-level learning domain (e.g., "Neurobiology", "Distributed Systems") containing Syllabus Topics. |
| Unit within a Subject | **Topic** (`StudyTopic`) | Syllabus Node, Sub-discipline, Concept Unit | A specific unit inside a Subject with mastery level, study minutes, and linked notes/flashcards. |
| Spaced-repetition card | **Flashcard** (`Flashcard`) | Recall Prompt, Memory Card, SM-2 Node | An active-recall Q&A card scheduled via the SuperMemo-2 (SM-2) algorithm. |
| Long-form document | **Note** (`Note`) | Knowledge Note, Archival Dossier, Thought Canvas | A Markdown document linked to a Subject, category, and tags. |
| Medium/long-term objective | **Goal** (`Goal`) | Horizon, North Star, Objective Vector | A target outcome with a deadline, milestones, and experience mode (`standard`, `exam`, `project`). |
| Daily recurring behavior | **Habit** (`Habit`) | Daily Ritual, Habit Constellation | A daily or weekly behavior tracked for consistency and streaks. |
| Live multiplayer focus space | **Study Room** (`StudyRoom`) | Study Sanctuary, Collaborative Pod, Flow Room | A real-time shared room with a synchronized host timer, participant presence, status, and chat. |
| Analytics & insights page | **Progress** (`/app/analytics`) | Cognitive Rhythm, Telemetry Observatory | Visual breakdown of study hours, focus completion, topic mastery, and retention forecasts. |
| End-of-day reflection | **Daily Reflection** (`DailyReflection`) | Evening Closure Protocol, Nadir Synthesis | A brief end-of-day check-in capturing wins, unfinished tasks, and energy/clarity rating. |

---

## 6. Feature Consolidation Decisions (Kept / Merged / Simplified / Deferred / Removed)

| Existing Capability | Duplicate / Overlap Found in Repo | Decision | Canonical Feature | Reason |
| :--- | :--- | :--- | :--- | :--- |
| **Daily Schedule & Time Blocking** | 4 overlapping schedule UIs + 2 incompatible data models: (1) Derived `TimeBlock` (`src/utils/planning/timeBlocking.ts` + `TimeBlockGrid.tsx` on Dashboard), (2) Persisted `TaskTimeBlock` (`HourlyPlannerView.tsx` on TasksPage), (3) `TaskTimelineView.tsx` on TasksPage, (4) `StudyPlanAgenda.tsx` on StudyPage. Blocks created in TasksPage never show on Dashboard! | **MERGE & SIMPLIFY** | **Unified Daily Schedule (`TaskTimeBlock` + `StudyPlanItem` + `StudyRoutine`)** | Users must have ONE daily schedule. Blocks created on `TasksPage` or `Today` must read/write from the same unified schedule selector so `Today` and `Tasks > Schedule` always show identical blocks. Merge `HourlyPlannerView` and `TaskTimelineView` into a single `Schedule` tab on `TasksPage`. |
| **Tasks Views (`TasksPage.tsx`)** | 5 separate sub-views (`HourlyPlannerView`, `TaskInboxView`, `TaskTimelineView`, `TaskPriorityMatrix`, `TaskReviewSummary`) + broken Inbox filter (`if (t.dueDate) return false` makes Today/Upcoming/Overdue filters always empty). | **SIMPLIFY** | **3 Clean Task Views: `List` (All/Today/Upcoming/Overdue/Completed), `Schedule` (24h Time-Blocker), `Matrix` (Eisenhower 2×2)** | Eliminates the redundant `Timeline` vs `Today & Planner (24h)` split and folds `Daily Review` metrics into the `Schedule` header and `Evening Closure Modal`. Fixes the Inbox filter bug so all tasks filter properly. |
| **Topic Mastery & Retention Calculation** | 3 competing engines: (1) `mastery.ts` (`0–100` numeric), (2) `masteryEngine.ts` + `retentionEngine.ts` + `sufficiencyModel.ts` (categorical, but starved of flashcards/notes because `intelligence/index.ts` passes `flashcards: []`), (3) `masteryIntelligence.ts` (hardcoded `95/65/25` map ignoring sessions). | **MERGE** | **Single Canonical Mastery & Retention Engine (`src/utils/intelligence/masteryEngine.ts` + `retentionEngine.ts`)** | Feed real `flashcards`, `notes`, `studySessions`, and `resources` into `createLearningIntelligenceSnapshot()`. Retire `mastery.ts` and `masteryIntelligence.ts` duplicate formulas so `Today`, `Subjects`, `Goals (Exam)`, and `Progress` report identical mastery/retention numbers. |
| **Study & Focus Recommendations** | 3 competing engines: (1) `recommendations.ts` on Dashboard, (2) `circadianSynthesis.ts` (`CircadianSynthesisCard`) on Dashboard, (3) `adaptivePlanner.ts` (`AdaptiveStudySuggester`) on StudyPage. | **MERGE** | **Single Deterministic Recommendation Engine (`src/utils/intelligence/recommendations.ts`)** | One explainable recommendation engine powers both the `Today` "Next Best Action" and `Subjects` study suggestions, eliminating contradictory advice. |
| **Auto-Replan & Overdue Rescheduling** | 3 separate mechanisms: `HourReviewModal.tsx` 1-click reschedule, `replanEngine.ts` auto-replan, and `CalendarOverlayCard.tsx` `?action=replan`. | **MERGE** | **Unified Replan Engine (`src/utils/tasks/replanEngine.ts`)** | Make `replanEngine.ts` respect multi-hour `durationMinutes`, routines, and existing blocks, and invoke it from both `Today` and `Tasks > Schedule`. |
| **Daily Capacity & Productivity Score** | 3 conflicting capacity constants (`360m` in `workloadCalculator.ts`, `330m` in `circadianSynthesis.ts`, `840m` in `availableTime.ts`) and 3 productivity score formulas (`productivity.ts`, `analytics.service.ts`, `mockService.ts`). | **MERGE** | **Single Capacity Constant (`user.dailyGoalMinutes || 360`) & Single Productivity Formula (`src/utils/productivity.ts`)** | Ensures consistent workload bars and momentum scores across `Today`, `Tasks`, and `Progress`. |
| **Dashboard Onboarding & Banners** | 3 simultaneous onboarding elements on `DashboardPage`: permanent hardcoded `solis-quick-start-banner`, `NextBestActionCard`, and `ActivationWelcomeModal`, plus 12+ stacked widgets causing severe scroll fatigue. | **SIMPLIFY** | **Single Dismissible Activation Checklist (`NextBestActionCard`) + 5-Zone Focused `Today` Layout** | Remove the permanent hardcoded 3-step banner (`solis-quick-start-banner`) and `CircadianSynthesisCard` duplicate widget. Keep `Today` scannable in 5 clear zones. |
| **Notification Services** | 2 unsynchronized systems: `src/services/notifications/notification.service.ts` (`solis_smart_notification_prefs`) vs `src/utils/notifications.ts` (`solis_notification_preferences` + `solis_notifications_inbox_v1`). | **MERGE** | **Single Notification Service (`src/services/notifications/notification.service.ts`)** | Wire `SettingsPage`, `AppHeader`, `NotificationCenterDrawer`, and browser notification triggers to one unified store and fix the broken `/app/study-rooms` link to `/app/rooms`. |
| **Audio & Soundscape Systems** | 3 overlapping Web Audio files: `soundscapeEngine.ts`, `hapticsEngine.ts`, and duplicate chime synthesis inside `notifications.ts` and `timer.ts`. | **MERGE** | **Unified Focus Audio Module (`soundscapeEngine.ts` + `hapticsEngine.ts`)** | Keep ambient noise/binaural synthesis in `soundscapeEngine.ts` and UI/timer completion chimes in `hapticsEngine.ts`. |
| **Reflection & Review Flows** | 5 separate reflection surfaces: Dashboard `Daily Intention`, `EveningClosureModal`, `PostFocusReflectionModal`, `RoomReflectionModal`, and `WeeklyReviewPage`. | **SIMPLIFY** | **3 Distinct Reflection Cadences: Post-Session (Focus/Room rating), Daily Closure (`EveningClosureModal`), Weekly Review (`WeeklyReviewPage`)** | Keep post-session ratings lightweight (1 click + optional note), unify daily intention + evening closure into `DailyReflection`, and keep `WeeklyReviewPage` as the weekly synthesis wizard. |
| **External Google Calendar "Sync"** | `calendar.service.ts` claims "Google Calendar Linked" in Settings and Dashboard, but is 100% fake (`setTimeout(350)` + 3 hardcoded fake events: `CS 301`, `Research Lab Sync`, `Study Group`). | **SIMPLIFY / HONEST LOCAL SCHEDULE** | **Built-in Fixed Commitments / Class Schedule (`RecurringRoutinesModal`) + Honest `.ics` / Manual External Event Entry** | Remove fake Google Calendar OAuth simulation and hardcoded fake events (`CS 301`). Let users manage recurring classes/commitments directly via `Routines` without deceptive fake OAuth badges. |
| **Remotion "Circadian Focus Reel"** | `src/remotion/` + `CircadianFocusReelModal.tsx` on `AnalyticsPage.tsx` renders a hardcoded 10-second marketing animation unrelated to user data. | **REMOVE** | **Removed** | Adds zero user value, bloats bundle size with `@remotion/player`, and confuses users on the Analytics page. |
| **Unused Visual / Parallax Wrappers** | `src/components/parallax/*`, `src/components/scene/*`, `src/components/motion/ParallaxLayer.tsx`, `src/components/illustrations/*`, and dead DB table `public.drift_thoughts`. | **REMOVE / DEPRECATE** | **Removed from active runtime** | Unused by any application route; `CognitiveDriftPad` already persists directly to `tasks` and `notes`. |
| **B2B CRM Design System Templates** | `design-system/solis/pages/{dashboard,focus,landing}.md` contain auto-generated CRM instructions (deal animations, leaderboards). | **REMOVE / SUPERSEDE** | **Superseded by `master.md` Section 12** | Contradicts Solis's calm academic identity. |
| **Academic Capacity & Exam Planning** | Daily capacity only checks today's minutes (`workloadCalculator.ts`). No calculation of available hours before exams vs required syllabus hours. | **BUILD CANONICAL** | **Forward Time Cushion Engine (`src/utils/planning/timeCushion.ts`)** | Computes surplus/deficit hours between weekly routines and exam syllabus requirements, preventing last-minute cramming panic. |
| **Notes & Active Recall Creation** | Creating flashcards from notes requires opening a multi-step modal, creating double-entry friction during lecture note capture. | **BUILD CANONICAL** | **Inline Flashcard Extraction (`concept :: definition`)** | Allows typing `term :: definition` directly in markdown notes to auto-index active recall cards in topic decks without modal hops. |
| **Habit Streaks & Churn Prevention** | Hardcoded binary streak reset destroys multi-week momentum upon a single missed day (`streaks.ts`). | **IMPROVE CANONICAL** | **"Never Miss Twice" Streak Forgiveness** | Protects user momentum by granting a 24h recovery grace period before resetting streak counters. |

---

## 7. Final Product Scope (V1 Canonical Scope)

Solis V1 consists of **10 canonical product modules** (plus Public Landing, Authentication, Guide Center, and Settings):

1. **Today (`/app/dashboard`)**: Daily briefing header, solar progress & daily intention, unified today schedule (time blocks + routines + study plan), priority task queue with smart quick-add, due flashcard/knowledge review prompt, and daily habit check-in.
2. **Tasks (`/app/tasks`)**: Unified task management with natural-language `SmartTaskInput`, workload capacity bar, and 3 views: **List** (All, Today, Upcoming, Overdue, Completed), **Schedule** (24-hour interactive time-blocker + hour review & auto-replan), and **Matrix** (2×2 Urgent/Important Eisenhower grid).
3. **Focus (`/app/focus` + global `MiniFocusPlayer`)**: Distraction-free timer (`Focus`, `Short Break`, `Long Break`) linked to a Task or Subject/Topic, Web Audio ambient soundscapes, `CognitiveDriftPad` for parking intrusive thoughts as tasks/notes, and `PostFocusReflectionModal` that logs both a `FocusSession` and a `StudySession`.
4. **Subjects (`/app/study`)**: Academic & curriculum hub managing Subjects, hierarchical Syllabus Topics, Topic Mastery & Retention status (`TopicIntelligenceDrawer`), Spaced Repetition Flashcard Decks (`FlashcardReviewModal` with SM-2), Study Plan Agenda, and Subject Resource Library.
5. **Notes (`/app/notes`)**: Split-pane Markdown knowledge base with live reading view, category/subject/tag filtering, 1-click "Convert Selection to Task", "Create Flashcard from Note", resource citation, Markdown export, and optional AI Summary/Flashcard/Quiz generation.
6. **Goals (`/app/goals`)**: Short-, mid-, and long-term goals with milestones, progress tracking, and specialized workspaces for **Exam Goals** (`ExamWorkspaceModal` with readiness & syllabus coverage) and **Project Goals** (`ProjectWorkspaceModal` with linked tasks & deliverables).
7. **Habits (`/app/habits`)**: Daily and weekly habit tracker with 14-day interactive completion grid, deterministic streak calculation, and goal linkage.
8. **Study Rooms (`/app/rooms` & `/app/rooms/:roomId`)**: Real-time collaborative focus rooms with 6-character join codes, host-synchronized epoch timer, live participant status (`focusing`, `break`, `idle`), room chat, emoji reactions, and post-room reflection logging.
9. **Progress (`/app/analytics`)**: Deterministic analytics across `Today`, `This Week`, and `28 Days` — showing study hours by subject, 28-day consistency heatmap, planning realism ratio (planned vs. actual), cognitive load status, exam readiness, and topic retention decay curves.
10. **Weekly Review (`/app/review`)**: Guided 3-step weekly calibration wizard (1. Review This Week's Data $\rightarrow$ 2. Record Breakthroughs & Friction $\rightarrow$ 3. Commit Next Week's Target & Actionable Task/Goal) that saves a permanent reflection note.

**Supporting Global Capabilities**:
- **Command Palette (`Cmd/Ctrl + K`)**: Instant search and navigation across tasks, notes, subjects, goals, guides, and quick actions.
- **Ask Solis Drawer (`Cmd/Ctrl + J`)**: Workspace-grounded Q&A assistant using deterministic keyword/BM25 retrieval over the user's tasks, notes, subjects, and flashcards, plus optional Gemini synthesis when an API key is configured.
- **Guide Center (`/app/guides`)**: Interactive, step-by-step product guides with deep/quick modes.
- **Settings (`/app/settings`)**: Persistent profile & daily capacity settings, theme/density controls, notification & quiet-hours preferences, optional Gemini API key, and complete JSON/CSV data backup and restore.

---

## 8. Non-Goals & Explicitly Excluded Features

To prevent scope creep and multi-agent bloat, the following are **strictly excluded** from Solis:
1. **No Fake External OAuth Integrations**: Do not display fake "Connected to Google Calendar / Notion / Slack / GitHub" badges unless a real backend OAuth flow or real `.ics` parser is implemented.
2. **No Gamification Clutter**: No XP bars, avatars/skins, virtual currencies, public global leaderboards, or punitive streak-loss animations.
3. **No Heavy Video Rendering in the Web App**: No `@remotion/player` marketing videos or video editors inside user analytics or workspace routes.
4. **No Multi-Tenant Enterprise Hierarchy**: No workspaces/organizations, RBAC roles, manager approval flows, or team sprint velocity charts.
5. **No Unrequested Floating AI Popups**: AI never interrupts the user with unsolicited popups or auto-rewrites user notes without explicit user invocation.
6. **No Audio/Video Calling in Study Rooms**: Study Rooms are quiet, low-bandwidth co-working spaces (synchronized timer + presence + text chat + reactions), not Zoom/WebRTC video calls.

---

## 9. Information Architecture & Navigation Structure

### 9.1 Route Map
| Route Path | Canonical Page Title | Component | Access | Navigation Placement |
| :--- | :--- | :--- | :--- | :--- |
| `/` | Landing Page | `LandingPage` | Public | Public root |
| `/auth/login` | Sign In | `LoginPage` | Public | Auth flow |
| `/auth/signup` | Create Account | `SignupPage` | Public | Auth flow |
| `/app/dashboard` | **Today** | `DashboardPage` | Protected | Sidebar: **Daily Flow** #1 |
| `/app/tasks` | **Tasks** | `TasksPage` | Protected | Sidebar: **Daily Flow** #2 |
| `/app/focus` | **Focus** | `FocusPage` | Protected | Sidebar: **Daily Flow** #3 |
| `/app/study` | **Subjects** | `StudyPage` | Protected | Sidebar: **Knowledge** #1 |
| `/app/notes` | **Notes** | `NotesPage` | Protected | Sidebar: **Knowledge** #2 |
| `/app/goals` | **Goals** | `GoalsPage` | Protected | Sidebar: **Direction** #1 |
| `/app/habits` | **Habits** | `HabitsPage` | Protected | Sidebar: **Direction** #2 |
| `/app/rooms` | **Study Rooms** | `RoomsPage` | Protected | Sidebar: **Direction** #3 |
| `/app/rooms/:roomId` | **Active Study Room** | `ActiveRoomView` | Protected | Sub-route of `/app/rooms` |
| `/app/analytics` | **Progress** | `AnalyticsPage` | Protected | Sidebar: **Reflection** #1 |
| `/app/review` | **Weekly Review** | `WeeklyReviewPage` | Protected | Sidebar: **Reflection** #2 |
| `/app/guides` | **Guides** | `GuideCenterRoute` | Protected | Top Header Icon & Command Palette |
| `/app/guides/:guideId` | **Guide Reader** | `GuideCenterRoute` | Protected | Sub-route of `/app/guides` |
| `/app/settings` | **Settings** | `SettingsPage` | Protected | Sidebar Footer & Account Menu |

### 9.2 Desktop Sidebar Hierarchy (`src/constants/navigation.ts`)
- **DAILY FLOW**:
  1. `Today` (`/app/dashboard`) — `Sun` icon
  2. `Tasks` (`/app/tasks`) — `CheckSquare` icon
  3. `Focus` (`/app/focus`) — `Flame` icon
- **KNOWLEDGE**:
  4. `Subjects` (`/app/study`) — `BookOpen` icon
  5. `Notes` (`/app/notes`) — `FileText` icon
- **DIRECTION**:
  6. `Goals` (`/app/goals`) — `Target` icon
  7. `Habits` (`/app/habits`) — `Sparkles` icon
  8. `Study Rooms` (`/app/rooms`) — `Users` icon
- **REFLECTION**:
  9. `Progress` (`/app/analytics`) — `BarChart2` icon
  10. `Weekly Review` (`/app/review`) — `Compass` icon
- **SIDEBAR FOOTER**:
  - `Settings` (`/app/settings`) — `Sliders` icon
  - Collapse / Expand Toggle (`Cmd/Ctrl + \`)

### 9.3 Top Application Header (`AppHeader.tsx`)
- **Left**: Breadcrumb (`Solis / [Current Section]`) + Live local date & time.
- **Right**:
  1. `Search workspace` button (`Cmd/Ctrl + K` $\rightarrow$ opens `CommandPalette`).
  2. `Ask Solis` button (`Cmd/Ctrl + J` $\rightarrow$ opens `AskSolisDrawer`).
  3. `Notifications` bell with unread count badge ($\rightarrow$ opens `NotificationCenterDrawer`).
  4. `Guides` book icon ($\rightarrow$ navigates to `/app/guides`).
  5. `Theme Toggle` (`Sun`/`Moon` icon $\rightarrow$ switches Warm Ivory Day / Deep Charcoal Night).
  6. `Account Menu` avatar ($\rightarrow$ Profile info, Demo Mode badge if unauthenticated, Settings link, Sign Out).

### 9.4 Mobile Navigation (`MobileNav.tsx` + `MobileMoreSheet.tsx`)
- **Bottom Bar (5 slots)**: `Today`, `Tasks`, `Focus`, `Subjects`, and `More` (opens `MobileMoreSheet` with `Notes`, `Goals`, `Habits`, `Study Rooms`, `Progress`, `Weekly Review`, `Guides`, `Settings`).

---

## 10. Core User Journeys & End-to-End Flows

### Journey 1: First-Time Onboarding & Activation
1. **Trigger**: User signs up (`/auth/signup`) or clicks "Enter Solis Workspace" (Demo Mode) and lands on `/app/dashboard`.
2. **Step-by-Step**:
   - If first visit, `ActivationWelcomeModal` offers a 30-second orientation or immediate dismissal.
   - On `Today`, a single dismissible `NextBestActionCard` guides the user through 4 real milestones: (1) Create your first Subject, (2) Add a today Task, (3) Complete a Focus Session, (4) Capture a Note or Flashcard.
3. **State Updates**: Progress is computed deterministically from actual entities (`subjects.length`, `tasks.length`, `focusSessions.length`, `notes.length`).
4. **Completion**: Once all 4 milestones are met (or the user clicks "Dismiss"), the onboarding card disappears permanently.

### Journey 2: Morning Planning & Unified Time-Blocking
1. **Trigger**: User opens `Today` (`/app/dashboard`) or `Tasks > Schedule` (`/app/tasks`).
2. **Step-by-Step**:
   - User sets their single-line **Daily Intention** in the `Today` header (persisted to `DailyReflection` for today).
   - User adds tasks via `SmartTaskInput` (e.g., `"Solve 15 organic chem problems tomorrow 2pm #high ~45m"`), which deterministically parses title, due date, due time, priority, and estimated minutes.
   - User assigns tasks to specific hours on the **Schedule** view (or clicks **"Auto-Plan Day"**, which places unscheduled today tasks and due study topics into open hours respecting `StudyRoutine` blocks and the daily capacity ceiling).
3. **State Updates**: Creates/updates `TaskTimeBlock` records in `task_time_blocks`. Both `Today` and `Tasks > Schedule` immediately render the exact same hourly blocks.

### Journey 3: Deep Focus Execution & Session Consolidation
1. **Trigger**: User clicks **"Start Focus"** on a Task, Time Block, Subject Topic, or navigates to `/app/focus`.
2. **Step-by-Step**:
   - `FocusContext` pre-selects the linked `Task`, `Subject`, `Topic`, and duration (defaulting to the user's saved `focusDuration` from Settings, e.g., 25m).
   - Optional: User enables an ambient soundscape (`Rain`, `White Noise`, `Binaural Alpha/Theta`).
   - If the user navigates away from `/app/focus`, `MiniFocusPlayer` docks at the bottom-right so the timer never loses state.
   - If an intrusive thought arises mid-session, pressing `P` or clicking **Drift Pad** opens `CognitiveDriftPad` to park a Task or Note in $<3$ seconds without stopping the timer.
   - When the timer completes (or the user finishes early after $\ge 1$ minute), `PostFocusReflectionModal` opens.
3. **State Updates**:
   - Saves a `FocusSession` (with `subjectId`, `taskId`, `durationMinutes`, `completed: true`).
   - Automatically logs a corresponding `StudySession` (updating `StudyTopic.completedMinutes` and recalculating topic mastery/retention).
   - Optionally marks the linked `Task` or `TaskTimeBlock` as `completed`.

### Journey 4: Active Recall Study Loop (Subjects $\rightarrow$ Notes $\rightarrow$ Flashcards)
1. **Trigger**: User opens `Subjects` (`/app/study`) or `Notes` (`/app/notes`).
2. **Step-by-Step**:
   - User selects a `Subject` and adds syllabus `Topics` in `SyllabusTopicTree`.
   - User writes a Markdown `Note` in `/app/notes` linked to that Subject.
   - User highlights a concept or clicks **"Create Flashcard"** (manual or AI-assisted via `AIGenerationModal`) to add cards to the topic's deck.
   - When flashcards are due (`nextReviewAt <= now`), `Today` and `Subjects` surface a **"Review Due Cards"** CTA.
   - Clicking it opens `FlashcardReviewModal`, where the user grades recall (`Again`, `Hard`, `Good`, `Easy`).
3. **State Updates**: `sm2Engine.ts` updates `intervalDays`, `easeFactor`, `repetitions`, and `nextReviewAt`, logs a `FlashcardReviewLog`, and updates the topic's mastery and retention score in `masteryEngine.ts`.

### Journey 5: End-of-Day Closure & Weekly Review
1. **Trigger**: After 17:00 local time (or clicking "Evening Closure" on `Today`), `EveningClosureModal` opens; on weekends (or via `/app/review`), the user runs `WeeklyReviewPage`.
2. **Step-by-Step**:
   - **Daily Closure**: User rates energy/clarity (`1–5`), logs top win, and clicks **"Roll Over Unfinished Tasks"** to move incomplete today tasks/blocks to tomorrow.
   - **Weekly Review**: User inspects weekly study hours, planning realism ratio, and completed tasks $\rightarrow$ records breakthroughs and friction points $\rightarrow$ commits next week's study hour target and primary task/goal.
3. **State Updates**: Persists `DailyReflection` (`daily_reflections` table) or creates a permanent `reflection` Note + linked `Task`/`Goal`.

---

## 11. Detailed Feature Specifications

### 11.1 Today (`/app/dashboard` — `DashboardPage.tsx`)
- **Purpose**: Provide a calm, scannable daily command center that answers *"What is my plan today, what needs immediate attention, and how is my momentum?"* in under 10 seconds.
- **User Problem Solved**: Eliminates morning overwhelm and multi-page hunting across tasks, calendars, flashcards, and habits.
- **Where It Lives in Navigation**: Sidebar $\rightarrow$ Daily Flow $\rightarrow$ **Today** (`/app/dashboard`).
- **Primary UI Layout (Strictly 5 Zones, Maximum 2 Columns on Desktop)**:
  1. **Zone 1 — Solar Header & Daily Intention**: Greeting with circadian phase indicator, single-line editable **Daily Intention** input (persisted to today's `DailyReflection`), and primary CTAs (`Start Focus`, `Plan Day`, and `Evening Closure` after 17:00).
  2. **Zone 2 — Onboarding Activation (Conditional)**: `NextBestActionCard` shown **only** until the 4 initial setup steps are completed or dismissed. (The duplicate hardcoded `solis-quick-start-banner` and `CircadianSynthesisCard` must be removed).
  3. **Zone 3 — Left Column: Priority Tasks & Quick Capture**: `WorkloadCapacityBar` (planned minutes vs. user's daily capacity ceiling), `SmartTaskInput`, and today's prioritized task list with 1-click completion and "Focus on This" launch.
  4. **Zone 4 — Right Column: Unified Today Schedule**: Interactive timeline (`TimeBlockGrid`) showing **all** scheduled items for today in one unified feed: `TaskTimeBlock`s, `StudyPlanItem`s, `StudyRoutine`s, and logged `FocusSession`s.
  5. **Zone 5 — Bottom Row: Due Recall, Daily Habits & Exam Horizons**: Compact 3-card strip: (a) Due Flashcards & Knowledge Resurfacing (`KnowledgeResurfacingCard`), (b) Today's Habits quick check-in, and (c) Upcoming Exam/Goal countdowns (`ExamHorizonBar`).
- **User Inputs**: Daily intention text, quick task creation, task completion toggle, time-block click/create, habit check-in toggle.
- **System Behavior**: Subscribes to `dataService` changes; computes recommendations via `computeExplainableRecommendations()` with full flashcard/note/session context; warns via `CognitiveLoadAlert` only when workload or fatigue thresholds are exceeded.
- **Data Read / Written**: Reads `tasks`, `task_time_blocks`, `study_plan_items`, `study_routines`, `subjects`, `topics`, `focus_sessions`, `flashcards`, `habits`, `goals`, `daily_reflections`. Writes `tasks`, `task_time_blocks`, `habits`, `daily_reflections`.
- **Edge Cases**: New user with zero data sees clean empty prompts inside each zone without NaN% metrics; overdue tasks from prior days surface a 1-click "Reschedule Overdue to Today" action.
- **Empty State**: Calm guidance inside the Schedule and Tasks cards with a 1-click CTA to add the first task or subject.
- **Loading State**: Layout-matched skeleton placeholders (`Skeleton.tsx`) with zero layout shift.
- **Error State**: Non-blocking warning banner with a `Retry` button if Supabase fetch fails; preserves cached data if available.
- **What This Feature Must NOT Do**: Must not render more than 5 top-level zones, must not show permanent non-dismissible onboarding banners, and must not ignore `TaskTimeBlock` records created on the Tasks page.

### 11.2 Tasks (`/app/tasks` — `TasksPage.tsx`)
- **Purpose**: Capture, organize, prioritize, and time-block all actionable work items.
- **User Problem Solved**: Bridges the gap between an unstructured to-do list and a realistic hourly calendar.
- **Where It Lives in Navigation**: Sidebar $\rightarrow$ Daily Flow $\rightarrow$ **Tasks** (`/app/tasks`).
- **Primary UI Layout**:
  - **Header**: Title, task completion counter, `WorkloadCapacityBar`, and Segmented Control switching between **3 canonical views**:
    1. **List View** (`TaskInboxView`): Filterable by `All`, `Today`, `Upcoming`, `Overdue`, `Completed`, plus Subject filter, Category filter, Search, and Sort (`Due Date`, `Priority`, `Estimated Time`).
    2. **Schedule View** (`HourlyPlannerView`): 24-hour day planner (`06:00–23:00` default expandable to 24h) with unscheduled task sidebar, 1-click slot assignment (`CreateTimeBlockModal`), hour completion review (`HourReviewModal`), and **"Auto-Replan Overdue"** button (`replanEngine.ts`).
    3. **Matrix View** (`TaskPriorityMatrix`): 2×2 Eisenhower quadrants (`Urgent & Important`, `Important / Not Urgent`, `Urgent / Not Important`, `Low Priority / Backlog`).
- **User Inputs**: `SmartTaskInput` (natural language parsing of `@date`, `#priority`, `~duration`), task creation/edit modal, status checkbox, subtask checklist, time-block assignment, hour review rating.
- **System Behavior**:
  - **List View Filter Rule**: Selecting `Today`, `Upcoming`, or `Overdue` filters across **all** tasks (`tasks`), never pre-filtering out tasks that have a `dueDate`.
  - Completing a task automatically marks its linked today `TaskTimeBlock` as completed (and vice versa).
- **Data Read / Written**: Reads/writes `tasks`, `task_time_blocks`, `subjects`, `goals`.
- **Edge Cases**: Multi-hour time blocks (`durationMinutes > 60`) must reserve all spanned hours during conflict detection and auto-replanning.
- **Empty State**: Contextual empty state per filter (e.g., "No overdue tasks — you're caught up!").
- **Loading & Error States**: Skeleton rows on initial load; optimistic UI updates with toast rollback on mutation failure.
- **What This Feature Must NOT Do**: Must not show two separate timeline tabs (`Today & Planner 24h` vs `Timeline` — these are merged into `Schedule`), and must not hide dated tasks when filtering by `Today`, `Upcoming`, or `Overdue`.

### 11.3 Focus (`/app/focus` — `FocusPage.tsx` & `MiniFocusPlayer.tsx`)
- **Purpose**: Provide an austere, distraction-free environment for timed deep work with automatic study logging and thought parking.
- **User Problem Solved**: Prevents context switching and timer drift while ensuring every focused minute counts toward subject mastery and task completion.
- **Where It Lives in Navigation**: Sidebar $\rightarrow$ Daily Flow $\rightarrow$ **Focus** (`/app/focus`) and globally via `MiniFocusPlayer` when a session is active.
- **Primary UI Layout**:
  - **Mode Switcher**: `Focus` | `Short Break` | `Long Break`.
  - **Context Bar**: Selector to bind the session to an active `Task` and/or `Subject` + `Topic`.
  - **Chronometer Stage**: Large tabular-numeral countdown timer, progress ring, duration presets (`15m`, `25m`, `45m`, `60m`, `90m`, or custom default from Settings), and primary controls (`Start`/`Pause`, `Reset`, `Complete Early`).
  - **Flow Shield Toolbar**:
    - **Ambient Soundscape Bar**: Toggle & volume slider for procedural Web Audio soundscapes (`Rain`, `Forest`, `White Noise`, `Binaural Focus`).
    - **Cognitive Drift Pad (`P`)**: Opens `CognitiveDriftPad` overlay to park an intrusive `Task`, `Note`, or `Question` without leaving the timer.
    - **Breathing Centering (`B`)**: Opens `CenteringSanctuaryModal` for a 60-second pre-session box-breathing exercise.
- **User Inputs**: Timer controls, task/subject/topic selection, soundscape selection/volume, parked thoughts, post-session focus rating (`1–5`) and reflection notes.
- **System Behavior**:
  - Timer uses authoritative epoch timestamps (`endTimeEpochMs` in `FocusContext`) so backgrounded browser tabs never drift.
  - Upon completion ($\ge 1$ minute), opens `PostFocusReflectionModal` which persists both a `FocusSession` and a `StudySession`.
- **Data Read / Written**: Reads `tasks`, `subjects`, `topics`, user timer defaults from `localStorage` (`solis_focus_defaults`). Writes `focus_sessions`, `study_sessions`, `tasks` (parked tasks or task completion), `notes` (parked notes).
- **Edge Cases**: Refreshing the browser mid-session restores the active timer state from `localStorage`; `focus_sessions` inserts must work whether or not `task_id` column is present in older DB schemas (migration adds `task_id` cleanly).
- **Empty / Loading / Error States**: Instant load from cached subjects/tasks; if session save fails offline, queues locally and notifies user.
- **What This Feature Must NOT Do**: Must not lose timer progress when navigating to `Notes` or `Subjects` (`MiniFocusPlayer` stays mounted in `AppLayout`).

### 11.4 Subjects (`/app/study` — `StudyPage.tsx`)
- **Purpose**: Organize academic courses/disciplines, syllabus topics, spaced-repetition flashcards, study plans, and reference resources.
- **User Problem Solved**: Connects syllabus structure directly to spaced-repetition review and time-logged mastery.
- **Where It Lives in Navigation**: Sidebar $\rightarrow$ Knowledge $\rightarrow$ **Subjects** (`/app/study`).
- **Primary UI Layout**:
  - **Left Rail / Subject Switcher**: List of active Subjects with color badges, exam countdowns, and overall mastery progress + `New Subject` button.
  - **Main Subject Workspace (4 Clean Tabs)**:
    1. **Syllabus & Topics** (`SyllabusTopicTree`): Hierarchical topic list showing mastery badge (`Unstudied`, `Learning`, `Reviewed`, `Mastered`), retention freshness (`Fresh`, `Stable`, `Fading`, `Overdue`), study time logged, and click-to-open `TopicIntelligenceDrawer` + quick `Start Focus` / `Log Session`.
    2. **Flashcards & Recall** (`SpacedReviewsSanctuary`): Due SM-2 flashcard queue, deck browser by topic, `New Flashcard` button (`FlashcardCreateModal`), and `Start Review Session` (`FlashcardReviewModal`).
    3. **Study Plan** (`StudyPlanAgenda`): Scheduled study blocks (`StudyPlanItem`) and recurring `Routines` (`RecurringRoutinesModal`) for this subject.
    4. **Resources** (`StudyResourceGrid`): Linked textbooks, papers, videos, and URLs with progress status (`unread`, `reading`, `completed`).
- **User Inputs**: Subject CRUD, Topic CRUD, manual Study Session log, Flashcard CRUD & SM-2 grading (`Again`, `Hard`, `Good`, `Easy`), Resource CRUD.
- **System Behavior**: Grading flashcards or logging study sessions immediately recalculates topic mastery and retention via `masteryEngine.ts` and `retentionEngine.ts`.
- **Data Read / Written**: Reads/writes `subjects`, `topics`, `study_sessions`, `study_plan_items`, `study_routines`, `flashcards`, `review_queue_items`, `study_resources`.
- **Edge Cases**: Deleting a Subject cascades or unlinks associated topics and warns the user via `ConfirmationDialog`.
- **What This Feature Must NOT Do**: Must not use hardcoded mock mastery scores when real study sessions and flashcard reviews exist.

### 11.5 Notes (`/app/notes` — `NotesPage.tsx`)
- **Purpose**: Capture structured Markdown notes linked to subjects and convert passive notes into active tasks and flashcards.
- **User Problem Solved**: Prevents notes from becoming a "write-only graveyard" by linking every note to active recall and action items.
- **Where It Lives in Navigation**: Sidebar $\rightarrow$ Knowledge $\rightarrow$ **Notes** (`/app/notes`).
- **Primary UI Layout**:
  - **Left Pane (Index)**: Search input, Category filter (`Concept`, `Lecture`, `Problem`, `Revision`, `Idea`, `Reflection`, `Reference`), Subject filter, and chronological note cards.
  - **Right Pane (Editor Canvas)**: Auto-expanding title, metadata bar (Subject selector, Category selector, Tag pills), view mode toggle (`Edit`, `Split`, `Read`), Markdown editor/preview (`MarkdownReadingView`), and Action Toolbar:
    - `Create Flashcard` (`FlashcardCreateModal` pre-filled with selection)
    - `Convert to Task` (extracts highlighted text or first `- [ ]` / `TODO:` line into a `Task`)
    - `Cite Resource` (`ResourceLibraryModal`)
    - `AI Study Tools` (`AIGenerationModal` for summary/flashcards, `AITakeQuizModal` for self-quiz)
    - `Export .md` and `Save` (`Cmd/Ctrl + S` + auto-save indicator).
- **Data Read / Written**: Reads/writes `notes`, `subjects`, `flashcards`, `tasks`, `study_resources`.
- **Edge Cases**: Unsaved changes prompt or auto-save before switching notes; AI tools work deterministically offline and use Gemini when API key is configured.
- **What This Feature Must NOT Do**: Must not overwrite note content on background sync while the user is actively typing.

### 11.6 Goals (`/app/goals` — `GoalsPage.tsx`)
- **Purpose**: Track medium- and long-term outcomes across 3 specialized modes: `Standard Goal`, `Exam Prep`, and `Project Deliverable`.
- **User Problem Solved**: Bridges high-level ambitions (passing an exam, shipping a thesis/project) with daily tasks, syllabus topics, and habits.
- **Where It Lives in Navigation**: Sidebar $\rightarrow$ Direction $\rightarrow$ **Goals** (`/app/goals`).
- **Primary UI Layout**:
  - **Top Summary**: `GoalHeaderStats` (Active Goals, Upcoming Deadlines, Overall Milestone Completion).
  - **Filter Bar**: Horizon (`Short Term`, `Mid Term`, `Long Term`), Experience Type (`Standard`, `Exam`, `Project`), Status (`Active`, `Completed`), Search, and Sort.
  - **Goal Cards Grid**: Each `GoalCard` displays progress bar, target date countdown, linked Subject/Habits, inline Milestone checklist, and specialized workspace launchers:
    - `Exam` goals open `ExamWorkspaceModal` (exam readiness score, topic coverage breakdown, weak-topic focus launcher).
    - `Project` goals open `ProjectWorkspaceModal` (deliverables checklist, linked tasks, focus time invested).
- **Data Read / Written**: Reads/writes `goals`, `goal_milestones`, plus reads `subjects`, `topics`, `tasks`, `flashcards`, `habits`.
- **Edge Cases**: Adding, toggling, or deleting a milestone must invalidate `queryCache` **before** re-fetching goals so the UI never displays stale milestone state.
- **What This Feature Must NOT Do**: Must not compute Exam Readiness from hardcoded dummy maps; must use canonical topic mastery and flashcard retention.

### 11.7 Habits (`/app/habits` — `HabitsPage.tsx`)
- **Purpose**: Build daily and weekly behavioral consistency through a fast 14-day check-in grid and deterministic streak tracking.
- **User Problem Solved**: Keeps foundational study and wellness routines visible without overcomplicating daily tracking.
- **Where It Lives in Navigation**: Sidebar $\rightarrow$ Direction $\rightarrow$ **Habits** (`/app/habits`).
- **Primary UI Layout**:
  - **Quick Capture Bar**: Single-line input to add a daily habit in one keystroke.
  - **14-Day Habit Matrix**: Each habit card shows current streak, longest streak, linked Goal badge, and a 14-day interactive completion row (`past14Days`) with tactile toggle buttons.
- **Data Read / Written**: Reads/writes `habits`, `habit_completions`, and reads `goals`.
- **Edge Cases**: Toggling a habit date must invalidate `queryCache` **before** re-fetching `getHabits()`, and streak calculation must use local calendar dates (`src/utils/streaks.ts`) everywhere rather than UTC `.toISOString()` slices.
- **What This Feature Must NOT Do**: Must not punish missed days with guilt-inducing error states.

### 11.8 Study Rooms (`/app/rooms` & `/app/rooms/:roomId` — `RoomsPage.tsx` & `ActiveRoomView.tsx`)
- **Purpose**: Provide real-time accountability pods where peers study together on a synchronized timer with ambient presence and structured session reflections.
- **User Problem Solved**: Combats solo study isolation without the distraction or bandwidth cost of video calls.
- **Where It Lives in Navigation**: Sidebar $\rightarrow$ Direction $\rightarrow$ **Study Rooms** (`/app/rooms`).
- **Primary UI Layout**:
  - **Directory (`/app/rooms`)**: 6-character Room Code quick-join bar, `Create Room` button (`CreateRoomModal`), search/modality filters, Active Rooms grid, and `My Reflections` history tab.
  - **Active Room (`/app/rooms/:roomId`)**: Top bar with copyable `#CODE` and share link, Shared Objective banner, Personal Intention bar, central synchronized Epoch Timer (host controls `Start`, `Pause`, `Reset`, `Break`), quick emoji reaction bar, and 3-tab right panel (`Participants`, `Chat`, `Timeline`).
- **Data Read / Written**: Reads/writes `study_rooms`, `room_participants`, `room_messages`, `study_room_events`, `study_room_reflections`, and logs a personal `StudySession` when submitting `RoomReflectionModal`.
- **Edge Cases & Database Contract**:
  - Foreign keys and RLS on `profiles`, `study_rooms`, `room_participants`, `study_room_events`, and `study_room_reflections` must permit authenticated room members to view peer display names, events, and shared reflections without `PGRST200` join crashes.
  - In Demo/Offline mode, `MockRoomService` provides a full local simulation so users can test rooms solo.
- **What This Feature Must NOT Do**: Must not link notifications to `/app/study-rooms` (canonical route is `/app/rooms`).

### 11.9 Progress (`/app/analytics` — `AnalyticsPage.tsx`)
- **Purpose**: Provide an honest, traceable breakdown of study effort, focus quality, planning realism, and memory retention.
- **User Problem Solved**: Replaces vanity metrics with actionable feedback on where time went and which subjects are decaying.
- **Where It Lives in Navigation**: Sidebar $\rightarrow$ Reflection $\rightarrow$ **Progress** (`/app/analytics`).
- **Primary UI Layout**:
  - **Header**: Time scope selector (`Today`, `This Week`, `28 Days`). (Remove the `Circadian Reel` Remotion video button).
  - **Row 1 — Core KPIs**: Total Study Hours, Focus Completion Rate, Planning Realism Ratio (`Planned vs. Actual`), and Active Streak.
  - **Row 2 — Cognitive Load & Exam Readiness**: `CognitiveLoadAlert` (when applicable) + `ExamReadinessCard`s for active exam goals.
  - **Row 3 — Subject Allocation & 28-Day Consistency Heatmap**: Visual distribution of hours per subject vs. target hours, and a 28-day daily intensity grid.
  - **Row 4 — Topic Retention Forecast**: Ebbinghaus/SM-2 decay curves (`RetentionForecastGraph`) with 1-click **"Review Fading Topics"** CTA.
- **Data Read / Written**: Read-only aggregation over `study_sessions`, `focus_sessions`, `study_plan_items`, `task_time_blocks`, `subjects`, `topics`, `tasks`, `habits`, `goals`, `flashcards`, `daily_reflections`.
- **What This Feature Must NOT Do**: Must not pass empty `flashcards: []` or `notes: []` into `generateSolisIntelligenceReport()`, and must not embed promotional Remotion videos.

### 11.10 Weekly Review (`/app/review` — `WeeklyReviewPage.tsx`)
- **Purpose**: Guide the user through a structured 10-minute weekly retrospective and next-week planning ritual.
- **User Problem Solved**: Prevents week-to-week drift by turning weekly metrics into concrete next-week commitments.
- **Where It Lives in Navigation**: Sidebar $\rightarrow$ Reflection $\rightarrow$ **Weekly Review** (`/app/review`).
- **Primary UI Layout**: 3-step wizard:
  - **Step 1 — Inspect the Week**: Summary of logged study hours, focus blocks, completed vs. pending tasks, planning realism ratio, and optional AI/algorithmic weekly synthesis.
  - **Step 2 — Reflect**: Prompts for `Intellectual Breakthroughs` and `Friction Points`.
  - **Step 3 — Calibrate Next Week**: Input for `Next Week Target Hours`, `Primary Commitment`, subject link, and checkboxes to automatically create a `Task` and/or short-term `Goal` and save the review as a permanent `Note`.
- **Data Read / Written**: Reads weekly metrics; writes a `Note` (`category: 'reflection'`), optional `Task`, and optional `Goal`.

### 11.11 Settings (`/app/settings` — `SettingsPage.tsx`)
- **Purpose**: Configure profile details, focus timer defaults, daily study capacity, theme/density, notifications, optional AI key, and full data backup/restore.
- **User Problem Solved**: Gives users full control over their workspace parameters and 100% data portability.
- **Where It Lives in Navigation**: Sidebar Footer & Account Menu $\rightarrow$ **Settings** (`/app/settings`).
- **Primary UI Layout**: Single-column structured cards (`max-width: 680px`):
  1. **Learner Profile**: Full Name, Email (read-only when authenticated), Primary Focus Field — **must persist to `public.profiles` / AuthContext and `localStorage` on Save**.
  2. **Focus & Capacity Defaults**: Focus Block Minutes (default `25`), Short Break Minutes (default `5`), Daily Deep-Work Capacity Target Minutes (default `360`), Sound Enabled toggle, Week Start (`Monday`/`Sunday`), Interface Density (`Comfortable`/`Compact`) — **must persist to `localStorage` (`solis_user_preferences`) and propagate across `FocusPage` and `workloadCalculator`**.
  3. **Appearance Theme**: `Warm Ivory (Day)`, `Deep Charcoal (Night)`, `System (Auto)`.
  4. **Notifications & Quiet Hours**: Browser permission button, category toggles, and Quiet Hours window — wired to the single canonical `notificationService`.
  5. **Solis Intelligence (Optional AI)**: Optional Gemini API key input (`localStorage['solis_gemini_api_key']`) with clear explanation that all core features work offline/deterministically without a key.
  6. **Data Ownership & Portability**: Full Workspace JSON Backup (covering **all** user tables including `flashcards`, `task_time_blocks`, `study_routines`, `study_resources`, `daily_reflections`), JSON Restore (`ImportModal`), and CSV collection exports.
  7. **Account & Session Security**: Guide Center launcher, Onboarding reset, and Sign Out button.
- **What This Feature Must NOT Do**: Must never discard form fields (`name`, `focusField`, `focusDuration`, `breakDuration`, `dailyGoal`, `soundEnabled`) when the user clicks "Save Preferences", and must not display fake Google Calendar OAuth connection status.

---

## 12. UX, Layout & Design System Rules

### 12.1 Aesthetic Identity: "Sunlit Archival Studio"
- **Day Theme (Default — `Warm Ivory`)**: Warm paper surfaces (`#FAF8F5` primary canvas, `#F3EFEA` secondary surface, `#FFFFFF` elevated card), deep espresso ink (`#1C1917` primary text, `#57534E` secondary text, `#78716C` muted text), warm stone borders (`#E7E2DA`).
- **Night Theme (`Deep Charcoal`)**: Warm obsidian surfaces (`#121110` primary canvas, `#1A1816` elevated card, `#24211E` interactive surface), warm parchment text (`#F5F2EB` primary, `#A8A29E` secondary), subtle graphite borders (`#2E2A25`).
- **Semantic Accents**:
  - Primary Brand / Action: **Terracotta Coral** (`#E05A47` / `--color-coral-500`)
  - Focus / Solar Energy: **Warm Ochre / Amber** (`#D97706` / `--color-amber-500`)
  - Mastery / Success / Habits: ** Botanical Sage / Emerald** (`#2E7D5B` / `--color-sage-500`)
  - Recall / Notes / Synthesis: **Archival Indigo / Lavender** (`#6366F1` / `--color-lavender-500`)
  - Warning / Overdue / Danger: **Crimson Rose** (`#E11D48` / `--status-error`)

### 12.2 Typography System
- **Display & Editorial Headings (`--font-display`)**: `'Newsreader'`, `'Instrument Serif'`, or system serif — used **only** for page titles, hero headings, and major section headers.
- **UI & Body Copy (`--font-sans`)**: `'Plus Jakarta Sans'`, `'Inter'`, or system sans-serif — used for all task rows, buttons, inputs, cards, and body text.
- **Telemetry, Timers & Code (`--font-mono`)**: `'JetBrains Mono'` with `font-variant-numeric: tabular-nums` — used for all countdown timers, timestamps, durations, percentages, and room codes.

### 12.3 Layout & Density Rules
- **Single Primary Focal Point**: Every route must have one unmistakable primary workspace area.
- **Card Discipline**: Maximum 3–4 data points per card (Title/Tag, Primary Metric or Content, Action/Status). Never nest scrollable cards inside scrollable cards.
- **Responsive Breakpoints**:
  - Desktop (`>= 1024px`): Collapsible left `Sidebar` (`240px` expanded / `68px` collapsed) + `1280px` max-width content container.
  - Tablet/Mobile (`< 1024px`): Single-column layout + fixed bottom `MobileNav` (`64px` height) with safe-area padding so content is never obscured.
- **Motion Restraint**: Transitions use fast, deterministic easing (`150ms–250ms cubic-bezier(0.22, 1, 0.36, 1)`). Respect `prefers-reduced-motion: reduce` globally. Custom cursor (`SolisCursor`) must automatically disable on touch devices.

---

## 13. Data Model & Domain Entities

| Entity | TypeScript Interface | Supabase Table | Primary Key & Ownership | Key Relationships & Invariants |
| :--- | :--- | :--- | :--- | :--- |
| **UserProfile** | `User` (`src/types/user.ts`) | `public.profiles` | `id` (`uuid`, FK `auth.users`) | Stores `name`, `email`, `focus_field`, `daily_goal_minutes`. |
| **StudySubject** | `StudySubject` (`src/types/study.ts`) | `public.subjects` | `id` (`uuid`), `user_id` | Has many `StudyTopic`s, `StudySession`s, `Note`s, `Flashcard`s. `progress` (`0–100`) is derived from topics. |
| **StudyTopic** | `StudyTopic` (`src/types/study.ts`) | `public.topics` | `id` (`uuid`), `user_id` | Belongs to `subject_id`. Tracks `status` (`unstudied`, `learning`, `reviewed`, `mastered`), `TargetMinutes`, `CompletedMinutes`. |
| **StudySession** | `StudySession` (`src/types/study.ts`) | `public.study_sessions` | `id` (`uuid`), `user_id` | Belongs to `subject_id`, optional `topic_id`. `duration_minutes > 0`, `rating` (`1–5`). |
| **StudyPlanItem** | `StudyPlanItem` (`src/types/study.ts`) | `public.study_plan_items` | `id` (`uuid`), `user_id` | Scheduled study block for a `subject_id` on `scheduled_date` with `start_time`, `end_time`, `planned_minutes`. |
| **StudyRoutine** | `StudyRoutine` (`src/types/routine.ts`) | `public.study_routines` | `id` (`uuid`), `user_id` | Recurring weekly commitment (`day_of_week` `0–6`, `start_time`, `end_time`, `category`). |
| **StudyResource** | `StudyResource` (`src/types/resource.ts`) | `public.study_resources` | `id` (`uuid`), `user_id` | Linked to `subject_id` and optional `topic_id`. |
| **Task** | `Task` (`src/types/task.ts`) | `public.tasks` | `id` (`uuid`), `user_id` | Optional `subject_id`, `goal_id`, `due_date`, `due_time`, `estimated_minutes`, `actual_minutes`, `subtasks` (JSONB). |
| **TaskTimeBlock** | `TaskTimeBlock` (`src/types/taskTimeBlock.ts`) | `public.task_time_blocks` | `id` (`uuid`), `user_id` | Links `task_id` (or custom `title`) to `block_date` + `start_hour` (`0–23`) + `duration_minutes`. |
| **FocusSession** | `FocusSession` (`src/types/focus.ts`) | `public.focus_sessions` | `id` (`uuid`), `user_id` | Optional `subject_id`, `task_id`. Records `mode`, `duration_minutes`, `completed`, `session_date`. |
| **Note** | `Note` (`src/types/note.ts`) | `public.notes` | `id` (`uuid`), `user_id` | Optional `subject_id`. Stores Markdown `content`, `category`, `tags` (`text[]`), `is_pinned`. |
| **Flashcard** | `Flashcard` (`src/types/learning.ts`) | `public.flashcards` | `id` (`uuid`), `user_id` | Belongs to `subject_id`, optional `topic_id`, `note_id`. Tracks SM-2 fields (`interval_days`, `ease_factor`, `repetitions`, `next_review_at`). |
| **ReviewLog** | `FlashcardReviewLog` (`src/types/learning.ts`) | `public.review_queue_items` | `id` (`uuid`), `user_id` | Belongs to `flashcard_id`. Records `quality_rating` (`0–5`), `reviewed_at`. |
| **Goal** | `Goal` (`src/types/goal.ts`) | `public.goals` + `public.goal_milestones` | `id` (`uuid`), `user_id` | Tracks `horizon`, `experience_type` (`standard`, `exam`, `project`), `target_date`, `progress_percentage`, child `milestones`. |
| **Habit** | `Habit` (`src/types/habit.ts`) | `public.habits` + `public.habit_completions` | `id` (`uuid`), `user_id` | Tracks `frequency`, optional `goal_id`, and daily completion dates (`completed_date`). Streaks are derived deterministically via `src/utils/streaks.ts`. |
| **DailyReflection** | `DailyReflection` (`src/types/reflection.ts`) | `public.daily_reflections` | `id` (`uuid`), `user_id` | Unique per `(user_id, reflection_date)`. Stores daily intention, wins, blockers, and energy rating. |
| **StudyRoom** | `StudyRoom` (`src/types/room.ts`) | `public.study_rooms` (+ `room_participants`, `room_messages`, `study_room_events`, `study_room_reflections`) | `id` (`uuid`), `host_id` | Synchronized timer state (`timer_state`, `timer_started_at`, `timer_duration_seconds`), 6-char `room_code`. |

---

## 14. State Management & Persistence Architecture

### 14.1 Dual-Mode Data Service (`src/services/dataService.ts`)
- Solis implements a strict `IDataService` contract (`src/services/api.interface.ts`) with two concrete providers:
  1. **`SupabaseService` (`src/services/supabase/supabaseService.ts`)**: Active when `isSupabaseConfigured() && activeUserId` is present. Persists to PostgreSQL with Row-Level Security (`auth.uid() = user_id`).
  2. **`MockService` (`src/services/mock/mockService.ts`)**: Active in Demo Mode (no Supabase session). Persists all 13 domain collections to `localStorage` under `solis_mock_db_v2_*` keys so Demo Mode survives page reloads.

### 14.2 Cache Invalidation Law (`src/services/cache.ts`)
- **Rule**: In every `Supabase*Service` mutation (`create`, `update`, `toggle`, `delete`), **`this.ctx.notify()` (which clears `queryCache`) MUST be called BEFORE any follow-up read (`this.getHabits()`, `this.getGoals()`, etc.)**.
- Never read from a cached getter prior to invalidating `queryCache` after a database write.

### 14.3 Allowed `localStorage` Keys
Outside of `MockService`, only the following browser-local keys are permitted:
- `solis_theme` (`light` | `dark` | `system`) and `solis_density` (`comfortable` | `compact`)
- `solis_user_preferences` (JSON containing `focusDuration`, `breakDuration`, `dailyGoalMinutes`, `soundEnabled`, `weekStart`)
- `solis_smart_notification_prefs` and `solis_notifications_inbox_v1` (managed exclusively by `notificationService`)
- `solis_gemini_api_key` (optional user-supplied Gemini API key)
- `solis_active_focus_session` (crash-recovery state for `FocusContext`)
- `solis_activation_dismissed_*` and `solis_guide_progress_v2`

---

## 15. API / Backend / Realtime / Integration Contracts

### 15.1 Supabase Schema & RLS Alignment
- Every column written by `src/services/supabase/modules/*.service.ts` must exist in `supabase/migrations/`.
- Specifically:
  - `public.focus_sessions` must include `task_id UUID REFERENCES public.tasks(id) ON DELETE SET NULL`.
  - `public.study_rooms` and `public.room_participants` foreign keys to user profiles must resolve cleanly in PostgREST, and RLS policies on `public.profiles`, `public.study_room_events`, and `public.study_room_reflections` must allow authenticated participants in the same room to read participant names, timeline events, and public room reflections.
  - `public.study_room_events` must be included in the `supabase_realtime` publication.

### 15.2 AI Service Contract (`src/services/ai/ai.service.ts`)
- **Model Version**: Use current supported Gemini models (`gemini-2.5-flash`) instead of retired `gemini-1.5-flash` / `gemini-1.5-pro` endpoints.
- **Header Auth**: Pass `x-goog-api-key` in request headers rather than exposing keys in URL query strings.
- **Honest Retrieval (`ragPipeline.ts`)**: Do not label trigram hashing as "Dense Semantic Vector Embeddings". Use clean, deterministic BM25 / keyword + metadata scoring over local workspace items (`tasks`, `notes`, `subjects`, `flashcards`), then pass the top-ranked context chunks to Gemini (when configured) or the deterministic synthesizer (when offline).

### 15.3 Keepalive Endpoint (`api/keepalive.ts` & `scripts/keepalive.mjs`)
- Must read `SUPABASE_URL` / `VITE_SUPABASE_URL` and `SUPABASE_ANON_KEY` / `VITE_SUPABASE_ANON_KEY` strictly from environment variables with **zero hardcoded project URLs or keys** in source files.

---

## 16. Error Handling, Edge Cases & Reliability Standards

1. **No Silent Mutation Failures**: Every user mutation must either succeed with visual confirmation or surface a clear `Toast` error message (`formatErrorMessage(err)`) and roll back optimistic state.
2. **Timezone & Date Safety**: All "Today", streak, heatmap, and schedule date keys (`YYYY-MM-DD`) must be generated in the **user's local timezone** via `getISODateString(date)` (`src/utils/date.ts`), never via UTC `new Date().toISOString().split('T')[0]`.
3. **Complete Backup & Restore Integrity**:
   - `export.ts` and `import.ts` must include all user domain collections (`subjects`, `topics`, `studyPlans`, `studySessions`, `studyRoutines`, `studyResources`, `focusSessions`, `tasks`, `taskTimeBlocks`, `habits`, `goals`, `notes`, `flashcards`, `dailyReflections`).
   - Restoring in `replace` or `merge_skip` mode must preserve `completedDates` on habits, `isCompleted` on goal milestones, and avoid duplicating existing records.
4. **Cross-Tab Timer Accuracy**: `FocusContext` and `useStudyRoom` must compute remaining seconds from `Date.now()` vs. target epoch timestamps so browser tab throttling never slows down the timer.

---

## 17. Performance, Accessibility & Responsiveness Standards

1. **Route-Level Code Splitting**: All feature pages in `src/App.tsx` must be lazy-loaded via `React.lazy()` with `RouteFallback`.
2. **Bundle Hygiene**: Do not import heavy video/animation libraries (`remotion`, `@remotion/player`) into application routes.
3. **WCAG AA Accessibility**:
   - Minimum `4.5:1` contrast ratio for body text in both Warm Ivory and Deep Charcoal themes.
   - Full keyboard navigation (`Tab`, `Shift+Tab`, `Enter`, `Escape`, arrow keys in `CommandPalette` and `GuideCenterPage`).
   - All icon-only buttons (`AppHeader`, `TaskRow`, `FocusPage`) must have descriptive `aria-label` attributes.
   - All modals/drawers must trap focus, support `Escape` to close, and use `role="dialog" aria-modal="true"`.
4. **Touch & Mobile Responsiveness**: Minimum `44×44px` tap targets on mobile; no horizontal page overflow at `375px` viewport width.

---

## 18. Codebase Architecture & Folder Ownership

```text
src/
├── assets/svg/                  # Brand marks and editorial SVG diagrams
├── components/
│   ├── ui/                      # Pure design-system primitives (Button, Card, Badge, Input, Select, Switch, etc.)
│   ├── feedback/                # Modal, ConfirmationDialog, EmptyState, ErrorBoundary, Toast, OfflineBanner
│   ├── layout/                  # Sidebar, AppHeader, MobileNav, CommandPalette, AskSolisDrawer, MiniFocusPlayer, NotificationCenter
│   └── features/                # Shared cross-page domain modals/widgets (Flashcards, Focus, Goals, Notes, Planning, Reflection, Resources)
├── constants/                   # Canonical navigation.ts and app constants
├── context/                     # AuthContext, ThemeContext, FocusContext, ToastContext, GuideContext
├── data/                        # Static guide definitions (guides.ts)
├── features/                    # Route-level feature modules (1:1 with canonical routes)
│   ├── auth/                    # LoginPage, SignupPage
│   ├── dashboard/               # Today (DashboardPage)
│   ├── tasks/                   # TasksPage (List, Schedule, Matrix views)
│   ├── focus/                   # FocusPage
│   ├── study/                   # Subjects (StudyPage, TopicIntelligenceDrawer, syllabus/flashcards/plan/resources)
│   ├── notes/                   # NotesPage
│   ├── goals/                   # GoalsPage
│   ├── habits/                  # HabitsPage
│   ├── rooms/                   # Study Rooms (RoomsPage, ActiveRoomView)
│   ├── analytics/               # Progress (AnalyticsPage)
│   ├── review/                  # WeeklyReviewPage
│   ├── guides/                  # GuideCenterPage
│   ├── settings/                # SettingsPage
│   └── landing/                 # LandingPage
├── hooks/                       # Shared hooks (useStudyRoom, etc.)
├── layouts/                     # AppLayout, PublicLayout, AuthLayout
├── services/                    # Data & integration layer
│   ├── api.interface.ts         # Canonical IDataService contract
│   ├── dataService.ts           # Provider router & pub/sub notifier
│   ├── cache.ts                 # TTL query cache
│   ├── supabase/                # SupabaseService & domain modules
│   ├── mock/                    # LocalStorage MockService
│   ├── ai/                      # Optional Gemini AI + deterministic fallback service
│   └── notifications/           # Single canonical NotificationService
├── styles/                      # tokens.css, themes.css, globals.css, animations.css
├── types/                       # Canonical TypeScript domain models
└── utils/                       # Pure deterministic domain engines
    ├── intelligence/            # Canonical masteryEngine, retentionEngine, recommendations, index
    ├── learning/                # SM-2 spaced repetition engine (sm2Engine.ts)
    ├── planning/                # Unified timeBlocking & workloadCalculator
    ├── tasks/                   # taskParser & unified replanEngine
    ├── focus/                   # soundscapeEngine & hapticsEngine
    ├── notes/                   # markdownParser & knowledgeResurfacing
    ├── date.ts                  # Local-timezone-safe date utilities
    ├── streaks.ts               # Single canonical streak calculator
    ├── productivity.ts          # Single canonical productivity score calculator
    ├── export.ts & import.ts    # Full workspace backup & restore
    └── validation.ts            # Input validation rules
```

### Architectural Boundaries
- **UI Components (`src/components/ui/`)** must never import `dataService` or domain services.
- **Feature Pages (`src/features/*`)** must never call `supabase` client directly; all reads/writes go through `dataService`.
- **Intelligence & Utility Engines (`src/utils/*`)** must be pure, deterministic functions with zero React state or direct DOM/network side effects.

---

## 19. Testing & Verification Standards

Every code change must pass these verification gates before completion:
1. **TypeScript Compilation**: `npm run typecheck` (`tsc --noEmit`) must pass with **0 errors**.
2. **Unit & Integration Suite**: `npm test` (Vitest) must pass with **0 failures**, covering:
   - SM-2 spaced repetition intervals (`sm2Engine.test.ts`)
   - Unified time-blocking & replanning (`timeBlocking`, `replanEngine`)
   - Mastery & retention calculations with real flashcards/sessions (`intelligence.test.ts`)
   - Local-date streak calculation (`streaks.test.ts`)
   - Data backup export & restore fidelity (`export`, `import`)
3. **Production Bundle Build**: `npm run build` (Vite) must succeed cleanly.
4. **End-to-End Flow Verification**: Verify both Demo Mode (`MockService`) and Authenticated Mode (`SupabaseService`) across the 5 Core User Journeys in Section 10.

---

## 20. Implementation Gap Analysis (Current vs Canonical)

| Area | Current Implementation Reality | Canonical Target (`master.md`) | Action Required |
| :--- | :--- | :--- | :--- |
| **Daily Schedule & Time Blocks** | Split across derived `TimeBlock` (`DashboardPage`) and persisted `TaskTimeBlock` (`TasksPage`). Blocks created in `TasksPage` are invisible on `DashboardPage`. | Single unified schedule feed combining `TaskTimeBlock`, `StudyPlanItem`, `StudyRoutine`, and `FocusSession` on both `Today` and `Tasks > Schedule`. | Update `buildTimeBlocks()` and `DashboardPage` to include `TaskTimeBlock`s; merge `HourlyPlannerView` and `TaskTimelineView` into one `Schedule` tab on `TasksPage`. |
| **`TasksPage` Inbox Filter Bug** | `inboxTasks` filters out all tasks with `dueDate` (`if (t.dueDate) return false`), making `Today`, `Upcoming`, and `Overdue` tabs always empty. | `List` view filters across all `tasks` accurately by `All`, `Today`, `Upcoming`, `Overdue`, and `Completed`. | Fix `TasksPage.tsx` task filtering and simplify the 5 sub-views into 3 (`List`, `Schedule`, `Matrix`). |
| **Mastery & Intelligence Engines** | 3 competing mastery engines (`mastery.ts`, `masteryEngine.ts`, `masteryIntelligence.ts`); `intelligence/index.ts` passes hardcoded `flashcards: [], notes: []`. | Single canonical engine (`masteryEngine.ts` + `retentionEngine.ts`) fed with real flashcards, notes, and study sessions. | Pass real flashcards/notes/resources into `generateSolisIntelligenceReport()` and unify `masteryIntelligence.ts` callers. |
| **Settings Persistence** | `SettingsPage.tsx` `handleSave` ignores `name`, `email`, `focusField`, `focusDuration`, `breakDuration`, `dailyGoal`, and `soundEnabled`. | All settings fields persist to `profiles` / `localStorage['solis_user_preferences']` and propagate to `FocusPage` and `workloadCalculator`. | Wire `SettingsPage.tsx`, `AuthContext`, `FocusPage.tsx`, and `workloadCalculator.ts` to read/write saved preferences. |
| **Database & Supabase Services** | `focus.service.ts` inserts missing `task_id` column (`PGRST204`); `rooms.service.ts` fails PostgREST join (`PGRST200`); `habit.service.ts` & `goal.service.ts` read stale cache before `ctx.notify()`. | Complete SQL migration for `focus_sessions.task_id` and `study_rooms` FKs/RLS; invalidate cache before re-reading in all services. | Add migration `20260330000010_canonical_fixes.sql` and fix service cache invalidation order. |
| **Notifications** | Split across `notification.service.ts` and `utils/notifications.ts`; room notification links to `/app/study-rooms` (404). | Single notification system (`notification.service.ts`) with valid `/app/rooms` route links. | Consolidate notification preferences/inbox and fix route path. |
| **Fake Calendar & Remotion Bloat** | Fake Google Calendar OAuth with hardcoded `CS 301` events; hardcoded Remotion video modal on `AnalyticsPage`; false "IndexedDB" claims on `LandingPage`. | Honest `Routines` schedule management, clean `Progress` analytics header without Remotion demo reel, accurate `LandingPage` copy. | Remove fake OAuth simulation, remove `CircadianFocusReelModal` from `AnalyticsPage`, and fix `LandingPage` copy. |
| **Hardcoded Credentials** | `api/keepalive.ts` and `scripts/keepalive.mjs` contain hardcoded fallback Supabase URL and anon key. | Environment-variable-only configuration. | Remove hardcoded fallback credentials from `api/keepalive.ts` and `scripts/keepalive.mjs`. |

---

## 21. Phased Cleanup & Implementation Roadmap

### Phase 0 — Constitutional Specification (Completed)
- Establish `master.md` at the repository root as the single source of truth.

### Phase 1 — Critical Data Integrity, Security & Database Fixes
1. Remove hardcoded Supabase fallback credentials from `api/keepalive.ts` and `scripts/keepalive.mjs`.
2. Add SQL migration to add `task_id` to `public.focus_sessions`, fix `study_rooms` / `room_participants` profile FKs and RLS policies, and add `study_room_events` to `supabase_realtime`.
3. Fix cache invalidation order in `habit.service.ts` and `goal.service.ts` (`this.ctx.notify()` before `this.getHabits()` / `this.getGoals()`).
4. Fix `SettingsPage.tsx` so profile fields (`name`, `focusField`) and timer/capacity preferences (`focusDuration`, `breakDuration`, `dailyGoal`, `soundEnabled`) persist and propagate across the app.

### Phase 2 — Schedule & Tasks Consolidation
1. Fix the `TasksPage.tsx` Inbox filter bug (`if (t.dueDate) return false`) so `All`, `Today`, `Upcoming`, `Overdue`, and `Completed` filters work accurately.
2. Consolidate `TasksPage.tsx` from 5 overlapping tabs to the 3 canonical views: **List**, **Schedule**, and **Matrix**.
3. Unify `buildTimeBlocks()` (`src/utils/planning/timeBlocking.ts`) so `TaskTimeBlock`s, `StudyPlanItem`s, `StudyRoutine`s, and `FocusSession`s appear together on both `Today` (`/app/dashboard`) and `Tasks > Schedule` (`/app/tasks`).
4. Fix `replanEngine.ts` to respect multi-hour `durationMinutes` and existing blocks.

### Phase 3 — Intelligence, Mastery & Recommendation Consolidation
1. Pass real `flashcards`, `reviews`, `notes`, and `resources` into `generateSolisIntelligenceReport()` and `computeExplainableRecommendations()`.
2. Consolidate the 3 mastery/retention engines (`mastery.ts`, `masteryEngine.ts`, `masteryIntelligence.ts`) into the single canonical engine (`masteryEngine.ts` + `retentionEngine.ts`).
3. Unify daily deep-work capacity (`dailyGoalMinutes || 360`), productivity score (`src/utils/productivity.ts`), and local-date streak calculations (`src/utils/streaks.ts`) across all services and pages.

### Phase 4 — Dashboard (`Today`) & UX Simplification
1. Streamline `DashboardPage.tsx` (`Today`) into the 5 canonical zones, removing the permanent hardcoded `solis-quick-start-banner` and duplicate `CircadianSynthesisCard`.
2. Remove the `CircadianFocusReelModal` Remotion showcase button from `AnalyticsPage.tsx` and clean up unused `parallax` / `scene` dead code.
3. Replace the fake Google Calendar OAuth simulation (`CS 301` hardcoded events) with honest recurring routines / schedule management, and update `LandingPage.tsx` to remove false IndexedDB claims.

### Phase 5 — Notifications, AI & Data Portability Hardening
1. Merge `src/utils/notifications.ts` and `src/services/notifications/notification.service.ts`, and fix the broken `/app/study-rooms` link to `/app/rooms`.
2. Upgrade `ai.service.ts` to `gemini-2.5-flash` with header-based API key authentication.
3. Upgrade `export.ts` and `import.ts` to back up and restore all user collections without losing habit streaks or milestone completion states.

### Phase 6 — End-to-End Verification & Regression Gate
1. Run `npm run typecheck`, `npm test`, and `npm run build`.
2. Verify all 5 Core User Journeys in both Demo Mode and Supabase Mode.
