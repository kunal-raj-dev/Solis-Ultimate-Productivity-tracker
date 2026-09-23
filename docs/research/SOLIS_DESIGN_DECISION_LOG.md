# Solis — Design Decision Log & Art Direction Consensus

**Date**: September 24, 2026  
**Deciders**: Complete Creative + Engineering Suite  
**Document Status**: Authoritative / Final Art Direction

---

## 1. Creative Directions Explored

### Concept A: The Digital Field Notebook
- **Essence**: Archival, tactile, scholarly, paper-influenced, subtle ink nuances, marginalia notes.
- **Evaluation**: Extremely calm and focused; perfect for notes and reading, but needs stronger operational speed for tasks and real-time focus timers.

### Concept B: The Creative Research Lab
- **Essence**: Experimental, spatial, data-dense, dynamic composition, interactive celestial diagrams.
- **Evaluation**: Highly engaging and visually distinctive, but risks visual noise if every screen features interactive canvas charts.

### Concept C: The Personal Digital Instrument
- **Essence**: High-end utilitarian hardware, extreme typographic polish, mechanical tactile feedback, calibrated dials.
- **Evaluation**: Outstanding for the Pomodoro timer, time blocking, and task completion, but lacks literary warmth for long-form study reflection.

---

## 2. The Final Chosen Direction: "The Archival Circadian Monograph"

The final identity is a **carefully balanced synthesis of Concepts A, B, and C**:
- From **Concept A (Field Notebook)**: We adopt the broadsheet margins, classical Newsreader serif typography, unboxed hairline layout, and warm alabaster / obsidian palette.
- From **Concept B (Research Lab)**: We adopt the bespoke interactive SVG celestial arcs, Ebbinghaus retention half-life curves, and cognitive capacity telemetry.
- From **Concept C (Digital Instrument)**: We adopt the mechanical precision, JetBrains Mono tabular figures, snappy 180ms spring micro-interactions, and contextual desktop cursor.

---

## 3. Core Architectural Decrees

1. **Banish Card-in-Card Nesting**: Any component featuring a rounded card inside another rounded card is permanently refactored into a single continuous ledger row or broadsheet column.
2. **Eliminate Generic Pill Badges**: All `rounded-full` badges with fluorescent colors are replaced with disciplined 2px/4px rectilinear chips set in JetBrains Mono.
3. **Strict 2% Accent Rule**: Terracotta Ember is never used as a background fill for cards or passive text. It is reserved strictly for the active focus timer, live progress needle, and primary commit button.
4. **Vite Production Build Fix**: Consolidate React and Framer Motion into unified chunking in `vite.config.ts` to eliminate circular dependency and prevent runtime context crashes on production hosts.
5. **Contextual Desktop Cursor**: Provide an artisanal desktop cursor that feels like a precision drafting instrument, with seamless fallbacks for touch devices.
