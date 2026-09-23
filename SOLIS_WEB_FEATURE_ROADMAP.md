# Solis Web Product Evolution: Final Feature Development Roadmap

> **Document Status:** Active Engineering & Product Roadmap  
> **Target Platform:** Solis Web Application (React 19 + TypeScript + Supabase + Web Audio API)  
> **Exclusions Enforced:** Mobile-native app store builds (iOS/Android), mobile lock-screen widgets, and watchOS apps have been strictly excluded to focus 100% on web and desktop operating system excellence.  
> **File Location:** `SOLIS_WEB_FEATURE_ROADMAP.md`

---

## 1. Scope & Strategy

Solis is designed as an integrated, active learning web operating system for students, researchers, engineers, and deep workers.

Instead of spreading thin across mobile app stores, this roadmap focuses on making the **Solis Web Platform** superior to standalone paid apps like Sunsama ($20/mo), Motion ($19/mo), RemNote Pro ($18/mo), and Focusmate ($8/mo) by combining:
1. **Mindful Planning & Workload Realism** (Sunsama/Motion tier)
2. **Active Recall & Spaced Repetition Knowledge Studio** (RemNote/Anki tier)
3. **Deep Work Focus Sanctuary & Neural Audio** (Brain.fm/LifeAt tier)
4. **Realtime Collaborative Study Rooms** (Focusmate/StudyTogether tier)

---

## 2. Excluded Mobile Features (Explicit Log)

The following features from initial competitive audits have been **filtered out** of our active development plan as they pertain strictly to mobile native apps:

- ❌ Native iOS / iPadOS App Store Bundle (Swift / SwiftUI)
- ❌ Native Android App Store Bundle (Kotlin / Jetpack Compose)
- ❌ iOS Lock Screen Widgets & Live Activities
- ❌ Android Home Screen Widgets & Quick Settings Tiles
- ❌ Apple Watch Companion App
- ❌ Mobile APNs / FCM Push Notification Infra (Replaced with Web Notifications API & in-app alerts)

---

## 3. Web Feature Development Plan (Phased Roadmap)

Below is the definitive list of web-focused features to be implemented in Solis, organized into logical, incremental phases.

```
┌───────────────────────────────────────────────────────────────────────────┐
│                          SOLIS WEB ROADMAP OVERVIEW                       │
├───────────────────────────────────────────────────────────────────────────┤
│ Phase 1: Smart Planning, Workload Guard & Natural Language Capture        │
│ Phase 2: AI Knowledge Studio, Active Recall & Wiki Backlinks             │
│ Phase 3: Realtime Collaborative Study Sanctuary (Web Body-Doubling)       │
│ Phase 4: Adaptive Study Recommender & Exam Workspaces                     │
│ Phase 5: Focus Sanctuary, Neural Soundscapes & Cognitive Drift Pad         │
│ Phase 6: Weekly Review Realism, Analytics & Complete Data Sovereignty     │
└───────────────────────────────────────────────────────────────────────────┘
```

---

### Phase 1: Smart Planning, Workload Guard & Natural Language Capture

#### 1.1 Natural Language Task & Study Capture
- **Description:** Single-line quick capture bar that parses titles, dates, times, durations, and categories from text.
- **Example Input:** `"Study Quantum Mechanics every Mon & Wed at 4pm for 90m #physics"`
- **Target UI:** Global `Cmd+K` Quick Capture modal.

#### 1.2 Guided Morning Planning & Workload Overcommit Guard
- **Description:** A Sunsama-style morning planning flow. Evaluates total estimated hours against available focus capacity and warns users when overcommitted (e.g., `>6 hours` of planned deep work).
- **Target UI:** `Today Cockpit` morning activation modal.

#### 1.3 iCal / Google Calendar Web Integration
- **Description:** Import external `.ics` / iCal web feeds to display external meetings and lectures alongside Solis timeblocks.
- **Target UI:** `Planner Grid` calendar overlay.

#### 1.4 Evening Workday Shutdown Ritual
- **Description:** Guided closure flow at the end of the study day to review completed items, move pending tasks, log energy/focus scores, and clear cognitive load.
- **Target UI:** `Evening Closure Modal`.

---

### Phase 2: AI Knowledge Studio, Active Recall & Wiki Backlinks

#### 2.1 AI Flashcard Auto-Generator with Review UI
- **Description:** Generates atomic flashcards (standard, cloze, concept) directly from user notes with an interactive preview modal to edit or discard before saving.
- **Target UI:** `NotesPage` -> `AIGenerationModal`.

#### 2.2 AI Formative Quiz Runner & Scoring
- **Description:** Interactive quiz generator based on note topics, featuring live scoring, concept explanations, and contract-safe option handling.
- **Target UI:** `AITakeQuizModal`.

#### 2.3 Bidirectional Wiki-Linking (`[[Note Title]]`) & Backlink Drawer
- **Description:** Client-side SPA routing for `[[Note Title]]` internal links and a bidirectional "Linked References" panel showing all referencing notes.
- **Target UI:** `NotesPage` side drawer & reading view.

#### 2.4 Grounded Note Intelligence ("Ask Solis")
- **Description:** Grounded Q&A drawer leveraging local note contents with strict source citations and graceful refusal when data is absent.
- **Target UI:** `AskSolisDrawer`.

#### 2.5 Explainable Daily Knowledge Resurfacing
- **Description:** Resurfacing card driven by retention decay signals (SM-2 / Ebbinghaus decay tiers), highlighting overdue topics with explainable badges (e.g., `"Last studied 19 days ago"`).
- **Target UI:** `Today Cockpit` Knowledge Resurfacing Card.

---

### Phase 3: Realtime Collaborative Study Sanctuary (Web Body-Doubling)

#### 3.1 Supabase Realtime Study Rooms
- **Description:** Live virtual study rooms utilizing Supabase Realtime subscriptions. Supports room codes (e.g., `"SOL789"`), join/leave presence, and study room types (`deep_focus`, `pomodoro`, `silent_reading`, `exam_cram`).
- **Target UI:** `/app/study-room` interface.

#### 3.2 Synchronized Group Focus Timers
- **Description:** Shared Pomodoro/Deep Work timer broadcasted across all room participants with synchronized break intervals.
- **Target UI:** `StudyRoom` active timer overlay.

#### 3.3 Silent Co-Working & Chat Rituals
- **Description:** Text-based intent declaration before sessions and reflection logging post-session, paired with optional ambient audio/video links.
- **Target UI:** `StudyRoom` sidebar & chat panel.

---

### Phase 4: Adaptive Study Recommender & Exam Engine

#### 4.1 Adaptive "What Should I Study Now?" Recommender Engine
- **Description:** Canonical recommendation engine unifying weak subject mastery, overdue flashcards, exam proximity (`<30 days`), and subject neglect signals.
- **Target UI:** `Study Sanctuary` Recommender Card.

#### 4.2 Seamless Focus Session Parameter Continuity
- **Description:** Complete parameter passing (`subjectId`, `topicId`, `planId`, `duration`) into `/app/focus`, auto-logging `StudySession` upon completion to update topic masteries.
- **Target UI:** Focus setup -> `FocusPage` -> `saveReflection`.

#### 4.3 Interactive Exam & Project Workspaces
- **Description:** Specialized study hubs with exam countdowns, weight calculations, deliverable checklists, and real-time readiness index diagnostics.
- **Target UI:** `/app/goals` & Exam detail drawers.

---

### Phase 5: Focus Sanctuary, Neural Soundscapes & Cognitive Drift Pad

#### 5.1 Web Audio API Neural Soundscape Generator
- **Description:** Zero-asset procedural audio generation including Pink Noise, Brown Noise, Binaural Alpha (10Hz), Binaural Theta (6Hz), Rainfall, and Deep Drone.
- **Target UI:** Persistent Mini-Player & Focus audio controls.

#### 5.2 Cognitive Drift Pad
- **Description:** Quick distraction capture panel embedded in the focus session, allowing users to offload random thoughts without breaking flow.
- **Target UI:** `FocusPage` side panel.

#### 5.3 Fullscreen Zen Mode & Intent Locking
- **Description:** Distraction-free full-screen environment requiring pre-session target outcome definition and mid-session centering prompts.
- **Target UI:** `FocusPage` Zen view.

---

### Phase 6: Weekly Review Realism, Analytics & Data Sovereignty

#### 6.1 5-Pillar Weekly Review Ritual
- **Description:** Structured weekly reflection evaluating deterministic planning realism ($T_{\text{actual}} / T_{\text{planned}}$), target hour calibration, friction points, and AI-synthesized summary notes.
- **Target UI:** `/app/weekly-review`.

#### 6.2 Habit Stacking & Streak Maintenance
- **Description:** 7-day habit completion matrix with deterministic streak calculations and direct connections to goals and subjects.
- **Target UI:** `/app/habits`.

#### 6.3 Complete Data Sovereignty & Portability
- **Description:** Full JSON workspace export/import validation (`solis-export-v1`) and CSV data dump for all entity collections.
- **Target UI:** `/app/settings` -> Sovereignty section.

---

## 4. Verification & Implementation Strategy

1. **Incremental Execution:** Build features tier-by-tier with strict unit and integration testing.
2. **Deterministic Data Integrity:** Maintain canonical state in IndexedDB/PostgreSQL/Supabase with fallback client storage.
3. **Zero UI Clutter:** Follow Solis' editorial typography and uncluttered visual aesthetic.
