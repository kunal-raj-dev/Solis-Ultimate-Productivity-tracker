# Solis — Kinetic Motion System & Vector Continuity Doctrine

**Date**: September 24, 2026  
**Standards**: Motion Doctrine + Framer Motion Best Practices + Emil Kowalski / Jakub Krehel Principles

---

## 1. Core Kinetic Philosophy

Motion in Solis is **purposeful, physical, and restrained**. It serves three immutable functions:
1. **Orient**: Clarify spatial context when switching between broadsheet views and the Focus Sanctuary.
2. **Confirm**: Provide instantaneous physical feedback for high-velocity user keystrokes and clicks.
3. **Reward**: Celebrate task completion and study block consolidation with quiet, understated elegance.

*The Cardinal Rule: "Motion must perform, never wobble." Continuous idle breathing loops and floating cards are strictly forbidden.*

---

## 2. Timing & Easing Scales

| Motion Tier | Duration | Easing Curve | Use Case |
| :--- | :--- | :--- | :--- |
| **Micro Action** | `120ms – 160ms` | `cubic-bezier(0.16, 1, 0.3, 1)` | Checkbox toggle, button press scale (`0.98`), tab switch |
| **UI State Reveal** | `180ms – 240ms` | `cubic-bezier(0.2, 0.0, 0, 1.0)` | Dropdown reveal, command palette mount, accordion unfold |
| **Workspace Transition** | `260ms – 320ms` | `cubic-bezier(0.25, 1, 0.5, 1)` | Route cross-fade with vector continuity, view reflow |
| **Focus Sanctuary Entry** | `400ms – 500ms` | `cubic-bezier(0.16, 1, 0.3, 1)` | Deliberate withdrawal of chrome into pure monastic focus |

---

## 3. The Vector Law & Seam Continuity

- **Matched Axis & Sign**: When navigating deeper into a curriculum topic or study room, elements enter from the right ($+X$) while previous controls glide left ($-X$). When navigating upward/back, the vector cleanly inverts.
- **Stillness Before Climax**: When completing a task or submitting an exam readiness drill, enforce a **200ms dramatic comma** of stillness before the row reflects completion, preventing jarring layout snapping.
- **Accessibility & Reduced Motion**:
  - All Framer Motion variants respect `prefers-reduced-motion: reduce`.
  - When reduced motion is detected, spatial translation is replaced with an instantaneous 100ms opacity crossfade.
