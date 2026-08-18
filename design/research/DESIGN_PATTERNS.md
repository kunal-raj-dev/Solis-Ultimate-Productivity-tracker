# Solis — Reusable Design Patterns

## Overview
This document specifies the core reusable UI/UX patterns across Solis.

---

## 1. Arrival & Continuity Pattern
* **Context**: When a user opens Solis or switches to Daily Flow.
* **Pattern**:
  - Time-aware editorial greeting in `Newsreader` display italic.
  - Manuscript intention line (`"What is your singular intention today?"`), persisted locally.
  - Real Data Continuity Strip: Queries `dataService` for recent focus sessions, planned topics, and distilled notes to present a 1-click continuation button.

---

## 2. Decision Surface Pattern (Tasks)
* **Context**: Task planning and backlog triage.
* **Pattern**:
  - Eliminates badge overload.
  - Priority indicated by vertical position, font weight, and due date.
  - Interactive nested subtask accordions.
  - Tactile `<SegmentedControl>` for time horizon filtering (`All`, `Today`, `Upcoming`).

---

## 3. Living Syllabus & Topic Mastery Pattern (Study)
* **Context**: Coursework and syllabus management.
* **Pattern**:
  - Subject World cards with ambient discipline color borders.
  - Topics categorized into 3 explicit mastery stages:
    - `unstudied` (neutral surface badge)
    - `learning` (warm amber badge)
    - `mastered` (calm sage badge)
  - 1-click Focus launcher from any planned study item.

---

## 4. Full-Screen Focus Sanctuary & Reflection Pattern (Focus)
* **Context**: Deep work and active study blocks.
* **Pattern**:
  - Deep radial obsidian background that morphs with timer state (`idle`, `running`, `paused`, `completed`).
  - Oversized tabular `Newsreader` countdown digits.
  - Post-Focus Reflection Ritual: An inline reflection prompt (*"What became clearer during this block?"*) appearing upon completion that saves directly to Knowledge Notes.

---

## 5. External Memory Thinking Canvas Pattern (Notes)
* **Context**: Long-form note taking, lecture synthesis, and conceptual capture.
* **Pattern**:
  - Distraction-free two-pane architecture.
  - Bound reading line length (`--max-readable-width: 760px`) and fluid 1.8 line-height.
  - Discrete auto-save feedback (`Auto-saved` / `Saving...`) without popup alerts.
