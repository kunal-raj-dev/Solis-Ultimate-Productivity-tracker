# Solis — Figma Design Exploration & Structural Prototyping

**Date**: September 24, 2026  
**Tools**: Figma MCP (`whoami`, `bridge_status`, REST API engine)  
**Authenticated Designer**: `kunal_ua2504cdh93@iitp.ac.in` (ID: `1674178231081553008`)

---

## 1. Tool Diagnostics & Bridge State

- **Figma REST API Connection**: Verified active (Status 200, CloudFront edge `CCU50-P5`).
- **Figmingo Local WebSocket Bridge**: Inspected at `ws://127.0.0.1:39220`. Commands queued for synchronous canvas syncing upon desktop plugin activation.
- **Cache Path**: `C:\Users\kunal\.figmingo\cache`.

---

## 2. Concept Studies & Structural Formations

### Exploration 1: The Floating Tile Paradigm (Rejected)
- **Structure**: 12-column grid populated by elevated rectangular cards with 16px corner radii and subtle box-shadows (`0 8px 30px rgba(0,0,0,0.12)`).
- **Findings**:
  - Feels like every current Y Combinator SaaS dashboard.
  - Causes visual fragmentation: the eye bounces between card borders instead of reading a cohesive narrative.
  - Nested components (e.g. flashcard review inside task cards) create a cramped, cluttered feeling.
- **Verdict**: **REJECTED**. Contradicts the anti-AI-slop directive and dilutes the erudite focus of Solis.

### Exploration 2: The Neo-Brutalist Technical Terminal (Explored & Modulated)
- **Structure**: High-contrast stark monochrome with heavy 2px black/white borders, 0px border radius, and pure monospace typography (Space Mono / JetBrains Mono).
- **Findings**:
  - High perceived speed and technical competence.
  - However, for a 4-hour sustained study session, extreme contrast and harsh 0px corners induce optical fatigue.
  - Lacks the reflective, scholarly calm required for deep reading and knowledge synthesis.
- **Verdict**: **MODULATED**. Retain the precision tabular alignment, hairline rulings, and monospaced data keys, but soften the atmosphere with warm undertones and classical serif typography.

### Exploration 3: The Archival Circadian Monograph (Selected)
- **Structure**: Broadsheet layout inspired by classical architectural notebooks and astronomical ephemerides.
- **Design Decisions**:
  - Canvas: Obsidian Basalt in dark mode, Warm Alabaster Parchment in light mode.
  - Zero drop shadows; spatial division established strictly through 1px hairline rules (`rgba(255, 255, 255, 0.08)` / `rgba(26, 24, 22, 0.08)`).
  - Tri-font system: Newsreader (400/italic) + Plus Jakarta Sans + JetBrains Mono.
  - Visual focal points: Bespoke SVG solar dials and Ebbinghaus retention curves.
  - Strict 2% Terracotta Ember accent discipline.
- **Verdict**: **SELECTED AS THE DEFINITIVE ART DIRECTION**.

---

## 3. Component Specification Matrix

| Component | Exploration 1 (Tile) | Exploration 2 (Brutalist) | Exploration 3 (Monograph - Final) |
| :--- | :--- | :--- | :--- |
| **Card / Surface** | 16px radius, shadow, border | 0px radius, 2px border, hard shadow | **0px elevation, 4px micro-radius, hairline border rule** |
| **Header** | Centered SaaS text + badge | Left-aligned bold mono headline | **Asymmetric broadsheet title + Newsreader italic quote** |
| **Buttons** | Rounded pill (`rounded-full`) | Sharp block with hard shadow | **Rectilinear 4px radius with ember needle hover** |
| **Lists** | Floating item tiles | Bordered terminal rows | **Continuous ledger rows with left-aligned hairline tick** |
| **Focus Mode** | Neon dark dashboard | Black terminal window | **Austere typographical monastery with ambient orb** |
