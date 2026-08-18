# Solis — Phase 7 Ecosystem & Portability Audit

## 1. Executive Summary
Phase 7 transforms Solis from a standalone web application into a complete, portable, and resilient personal productivity ecosystem. This audit evaluates current data structures, portability capabilities, workflow bottlenecks, and resilience layers to define the exact Phase 7 architecture.

---

## 2. Data Inventory & Ownership Audit

| Domain Entity | Storage Layer | Current Portability | Phase 7 Export Formats | Import / Recovery Strategy |
| :--- | :--- | :--- | :--- | :--- |
| **User Profile & Preferences** | PostgreSQL `profiles` | None | JSON | Restore / Merge Preferences |
| **Tasks & Subtasks** | PostgreSQL `tasks`, `subtasks` | None | JSON, CSV | Validate schema, map to `auth.uid()`, deduplicate |
| **Study Subjects & Topics** | PostgreSQL `subjects`, `study_topics` | None | JSON, CSV | Re-link hierarchical topic foreign keys safely |
| **Study Plans** | PostgreSQL `study_plan_items` | None | JSON, CSV | Re-link subject associations |
| **Study Sessions** | PostgreSQL `study_sessions` | None | JSON, CSV | Preserve timestamps and duration history |
| **Focus Sessions** | PostgreSQL `focus_sessions` | None | JSON, CSV | Preserve focus durations and modes |
| **Habits & Completion Records** | PostgreSQL `habits`, `habit_records` | None | JSON, CSV | Reconstruct 7-day and multi-week matrices |
| **Goals & Milestones** | PostgreSQL `goals`, `goal_milestones` | None | JSON, CSV | Preserve horizon categorization and completion status |
| **Knowledge Notes** | PostgreSQL `notes` | None | JSON, CSV, Markdown | Preserve markdown body, tags, and subject linkages |

---

## 3. Versioned Backup Specification (`solis-export-v1`)

```json
{
  "schema": "solis-export-v1",
  "version": 1,
  "exportedAt": "2026-08-17T20:00:00.000Z",
  "client": "Solis Productivity OS",
  "profile": {
    "name": "Kunal",
    "email": "kunal@solis.space",
    "focusField": "Computer Science & Architecture",
    "preferences": {
      "theme": "light",
      "soundEnabled": true,
      "defaultFocusDurationMinutes": 25,
      "defaultBreakDurationMinutes": 5,
      "dailyStudyGoalMinutes": 180,
      "weekStartDay": "monday",
      "density": "comfortable"
    }
  },
  "subjects": [],
  "topics": [],
  "studyPlans": [],
  "studySessions": [],
  "focusSessions": [],
  "tasks": [],
  "habits": [],
  "goals": [],
  "notes": []
}
```

---

## 4. Import & Restore Safety Guardrails

1. **Explicit Scope Constraint**: All imported records are stripped of any foreign `user_id` and assigned strictly to the active authenticated `user.id` (`auth.uid()`).
2. **Pre-Import Preview & Validation**:
   - Validates JSON against the `solis-export-v1` schema specification.
   - Calculates record counts and detects potential ID collisions.
   - Displays a clear summary to the user before any database write.
3. **Conflict Resolution Modes**:
   - **Merge & Append (Skip Existing)**: Keeps current workspace and adds new non-conflicting items.
   - **Create Copies**: Generates fresh UUIDs for all incoming items to prevent collisions.
   - **Full Restore (Replace)**: Replaces current records with backup data following an explicit confirmation safeguard.

---

## 5. Global Command Palette & Unified Search (`Cmd+K` / `Ctrl+K`)

* **Unified Search Index**: Real-time multi-entity search spanning Notes, Tasks, Subjects, Topics, and Goals.
* **Direct Navigation Shortcuts**:
  - `G D` $\to$ Dashboard
  - `G S` $\to$ Study Studio
  - `G F` $\to$ Focus Sanctuary
  - `G N` $\to$ Notes Studio
  - `G T` $\to$ Tasks Sanctuary
  - `G A` $\to$ Analytics
* **Instant Creation Actions**:
  - `N` $\to$ Draft New Note
  - `T` $\to$ Create New Task
  - `F` $\to$ Launch Focus Session
  - `S` $\to$ Log Study Session
  - `W` $\to$ Open Weekly Review Ritual

---

## 6. Personal Workflow Accelerators

* **Study Plan $\to$ Focus Pod**: One-click transition carrying subject ID, plan item title, and target duration directly into the Focus Sanctuary.
* **Study Plan $\to$ Task Conversion**: Transform an uncompleted study plan item into a actionable task.
* **Focus Completion $\to$ Knowledge Reflection**: Instant prompt upon completing a focus block to draft a linked knowledge note capturing takeaways.
* **Topic $\to$ Rapid Study / Note**: Contextual buttons on topic cards to immediately launch targeted focus or draft concept notes.

---

## 7. Resilience & Local-First Guardrails

* **Offline Detection (`useOnlineStatus`)**: Non-intrusive floating indicator when network connectivity is lost, ensuring user inputs are preserved locally.
* **Note Editor Draft Auto-Preservation**: Debounced local draft caching (`solis_note_draft_<id>`) ensuring in-progress edits survive navigation or accidental page reloads.

---

## 8. Weekly Review Ritual

* Structured 5-step guided reflection leveraging existing Phase 6 analytics:
  1. **Accomplished Momentum**: Review completed sessions, tasks, and habit streaks.
  2. **Knowledge Synthesis**: Review notes written and topic mastery progression.
  3. **Calibration & Postponements**: Inspect uncompleted plans and neglected subjects.
  4. **Attention Calibration**: Deep work ratio and dominant cognitive rhythm analysis.
  5. **Next Week's Intentions**: Set primary focus fields and high-horizon goals.
* Option to save the completed reflection directly as a permanent Knowledge Note.
