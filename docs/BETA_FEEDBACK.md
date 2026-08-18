# SOLIS — FRIENDS BETA FEEDBACK SYSTEM & TESTER GUIDE

**Target Audience**: Solis Private / Friends Beta Testers  
**Release Version**: Solis v1.0.0-beta  
**Feedback Registry**: `docs/BETA_FEEDBACK.md`  

---

## 1. Beta Testing Protocol & Mission

Thank you for testing Solis! Solis is designed as an architectural cockpit for serious scholars, engineers, and researchers—unifying deep focus, spaced repetition, hierarchical knowledge trees, and intelligent study scheduling.

Rather than asking vague questions like *"Do you like the app?"*, we ask you to complete **6 specific real-world tasks** and share your candid experience.

---

## 2. Guided Action Tasks for Testers

Please perform the following 6 tasks in your personal workspace:

### 🎯 Task 1: Create a Subject & Knowledge Tree
1. Navigate to **Study Vault** (`/app/study`).
2. Click **Create Subject** (e.g. *Quantum Computing*, *Distributed Systems*, *Macroeconomics*).
3. Assign a custom color and target study hours per week.
4. Add at least **3 topics** with varying confidence levels (e.g. *Low*, *Medium*, *Mastered*).

### 🎯 Task 2: Plan Your Study Schedule
1. In the **Study Vault**, navigate to the **Study Planner** tab.
2. Schedule a study plan item for tomorrow targeting one of your newly created topics.
3. Verify that it appears with the appropriate target duration.

### 🎯 Task 3: Deep Focus Sanctuary Session
1. Navigate to **Focus Sanctuary** (`/app/focus`).
2. Select your subject/topic and configure a **25-minute Pomodoro** or **Deep Flow** session.
3. Start the timer. Test the ambient soundscapes (e.g., *Rain*, *Binaural Beats*, *White Noise*) and full-screen / zen mode.
4. Complete or stop the session and fill out the **Post-Focus Retrospective** (Energy, Focus Depth, Subjective Output).

### 🎯 Task 4: Scholar Note & Spaced Repetition Flashcard
1. Navigate to **Knowledge Notes** (`/app/notes`).
2. Create a new structured note with tags (e.g. `#architecture`, `#consensus`).
3. Link the note to your subject.
4. Create a **Flashcard** from key concepts in your note.

### 🎯 Task 5: Spaced Repetition Review Queue
1. Navigate to **Study Vault** -> **Flashcards** (`/app/study` or `/app/review`).
2. Start a review session on your flashcards.
3. Test rating your recall accuracy (*Again*, *Hard*, *Good*, *Easy*) and notice the next scheduled review calculation.

### 🎯 Task 6: Explore Solis Learning & Cockpit Intelligence
1. Navigate to **Scholar Cockpit** (`/app/dashboard`) and **Cognitive Analytics** (`/app/analytics`).
2. Check your **Daily Flow**, study heatmap, and **Exam Readiness** indicators.
3. Verify what Solis recommends you focus on next.

---

## 3. Guiding Questions for Beta Testers

After completing the tasks, please reflect on these 6 questions:

1. **Confusion**: Was there any point where you were unsure what to click next or what a button did?
2. **Delight**: What interaction or visual feedback felt unusually satisfying or smooth?
3. **Latency / Friction**: Did any page transition, modal opening, or timer action feel sluggish?
4. **Mental Model**: Did anything behave differently from what you expected?
5. **Missing Tools**: What critical feature or workflow did you instinctively search for but couldn't find?
6. **Retention Driver**: What core element of Solis would make you open it again tomorrow morning?

---

## 4. Feedback Priority Classification Matrix

When logging feedback or issues, use the following priority tiers:

| Priority Tier | Classification | Description & Action |
| :--- | :--- | :--- |
| **P0 — Blocker** | 🚨 Cannot Use | Data loss, broken authentication, blank page (crash), unable to complete core action |
| **P1 — Friction** | ⚠️ Major Friction | Confusing UX, misplaced action, misleading label, broken responsive layout |
| **P2 — Improvement**| 💡 Useful Addition | Thoughtful feature request, workflow shortcut, improved visualization |
| **P3 — Polish** | ✨ Visual / Polish | Minor alignment, subtle typography tweak, micro-interaction enhancement |

---

## 5. Beta Tester Feedback Log

*Testers or developers can append entries to this log.*

### Log Entry Template:
```markdown
### [P0/P1/P2/P3] Short Summary of Feedback
- **Tester ID / Name**: (e.g., Alex)
- **Device & Browser**: (e.g., Chrome 128 on macOS / Safari on iOS)
- **Theme**: (Day / Night)
- **Related Module**: (Auth / Dashboard / Study / Focus / Notes / Analytics / Tasks)
- **Description**: What happened vs. what was expected?
- **Action Taken / Decision**: (Pending triage / Fixed / Roadmap)
```

---

### Active Feedback Entries

*(Entries will be added as friends test the live deployment)*

---

## 6. Privacy & Beta Expectations

1. **Private Workspace**: Each tester has an isolated account guarded by PostgreSQL Row Level Security. No other beta tester can view your notes, tasks, or study logs.
2. **No Data Mining**: Beta notes and entries are strictly private to each tester and will never be used for external research without explicit consent.
3. **Continuous Evolution**: Bugs or feedback reported during this beta will directly inform subsequent product iterations.
