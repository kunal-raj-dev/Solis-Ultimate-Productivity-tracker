# SOLIS — FIGMA MCP & STITCH MCP CONCEPT RESEARCH LOG
## Multi-Agent Visual Exploration, Architectural Synthesis, and Direction Decision

**Date:** September 23, 2026  
**Agents/Roles:** Lead Creative Director, Systems Architect, Visual Systems Designer, Motion Engineer  
**MCP Servers Invoked:**
- `figma` (REST API & Bridge Socket)
- `StitchMCP` (Generative UI & Theme Compiler)

---

## 1. Tool Discovery & Actual MCP Invocations

### Figma MCP Investigation
- **Tool Calls:**
  - `figma:whoami`: Authenticated successfully as user `kunal_ua2504cdh93` (`id: 1674178231081553008`, `kunal_ua2504cdh93@iitp.ac.in`). Rate limits: 0 throttles, 200 OK.
  - `figma:bridge_status`: Queried local bridge socket at `ws://127.0.0.1:39220`. Bridge reported `connected: false` (desktop Figmingo plugin idle), command buffer intact.
- **Architectural Finding:**
  The Figma REST API is live and verified. For high-velocity generative screen prototyping and responsive multi-column layout exploration, Stitch MCP provides complete design-token compiling and HTML/CSS rendering.

### Stitch MCP Investigation
- **Tool Calls:**
  - `StitchMCP:list_projects`: Discovered existing projects including `projects/3289206954779557551` ("Solis Design Concepts — Anti-AI-Slop Redesign") and `projects/14684188427409364226` ("Field Notebook Operating System").
  - `StitchMCP:get_project`: Extracted comprehensive theme metadata, color scales, and typography hierarchies.
  - `StitchMCP:generate_screen_from_text`: Invoked 3 times across distinct conceptual models to generate complete high-fidelity UI explorations.

---

## 2. Exploration of Three Genuinely Different Concepts

### Concept A: The Archival Broadsheet Workspace (Editorial Research Desk)
- **Stitch Screen Generated:** `projects/3289206954779557551/screens/c2e0fac22c044a42bbc2ac2ef227456b`
- **Screenshot Artifact:** `https://lh3.googleusercontent.com/aida/AEtjO1VGPy2rY2BeTtubQdbg3ZSczjDjUrXRFwIPyOLFAC8XEjmGXITitdyvSRnGAWowwbJ1JDAPZG4MkmhZOkN50lhnmdzIs7PQnY60Kt2DV5ouu3iHgBhwCqew0QJGpeEjTwtzdrTidQsGvmZSWCDIMIiscQ2xdeAIUg6kr0juJRScxgZP3NdFBZO9Ls0Yl788NO7aEFVj4nMuhVugSI9av1K9G9Od5aC3ngqECGVFIzAPZwkOYPr1Rp4QU2E`
- **Design Thesis:**
  Information is organized like an archival academic broadsheet folio (e.g. Oxford/Cambridge monograph). Structure is articulated strictly through generous unprinted ivory margins, typographic scale contrasts, and 1px hairline ruling. No floating boxes.
- **Layout Strategy:**
  Asymmetrical 3-bay broadsheet:
  1. *Left Index Rail (260px)*: Daily epistemic intention in italic serif, priority study commitments, and term progress.
  2. *Center Broadsheet (Master Canvas)*: Daily syllabus ledger, active study agenda with tabular hours, verified notes excerpts resting directly on paper.
  3. *Right Marginalia (280px)*: Ebbinghaus retention decay curves, SM-2 queue metrics, milestone countdown (`T-42 Days`), and scholarly citations.
- **Typography:**
  - Headlines: *Newsreader* 44px / 1.15 line-height, -0.025em tracking.
  - Body: *Plus Jakarta Sans* 15px / 1.6 line-height.
  - Marginalia & Readouts: *JetBrains Mono* 11px / 1.4 line-height with `font-variant-numeric: tabular-nums`.
- **Color System:**
  - Base: Warm Alabaster Ivory `#FAF8F5`.
  - Inks: Carbon Primary `#1A1816`, Iron Gall Secondary `#635E59`, Graphite Marginalia `#9E968F`.
  - Accent: Solis Cinnabar / Terracotta `#C84B31` (strictly <2% of surface).
- **Surfaces:**
  100% surface-less flat rag paper. Zero drop shadows, zero background cards. Dividers are 1px hairlines in `rgba(26, 24, 22, 0.07)`.
- **Iconography:**
  Bespoke micro-glyphs (hollow circular markers `○`, completed solid markers `●`, citation brackets `§`, Roman numerals).
- **Custom Asset Strategy:**
  Handcrafted SVG colophon seals, mathematical notation brackets, and linear timeline rails.
- **Motion Strategy:**
  Subtle page-turn wipe and ink-settle fade transitions (160ms ease-out). No bouncy springs.
- **Responsive Behavior:**
  On tablet (768px–1024px), right marginalia collapses into a toggleable footnote drawer. On mobile (<768px), bays stack linearly into a continuous ledger stream with top hairline separators.
- **Strengths:**
  Immense dignity, intellectual calm, zero eye fatigue, solves card-nesting entirely.
- **Weaknesses:**
  Can feel overly conservative or static if interactive state changes lack tactile micro-feedback.
- **What Solis Borrowed:**
  The surface-less layout, the Newsreader display typography, the hairline dividers, the 3-bay broadsheet hierarchy, and the anti-pill rule.
- **What Solis Rejected:**
  Excessively dry academic formality that might slow down rapid task capture.

---

### Concept B: The Focus Sanctuary & Horological Instrument
- **Stitch Screen Generated:** `projects/3289206954779557551/screens/10994695b1ab47b3a84ee0396d490f9c`
- **Screenshot Artifact:** `https://lh3.googleusercontent.com/aida/AEtjO1Un9lJcAd0WrMXOYG7e_wUDKA5Ze7UiTpfzC61uCDfWr1SHfW-ikuraL9h8fbvCu1vHUr1hEf4oNtkMC88hix2bWrkewkvNt5SUrrFT1bXJCS_uK1xUBVHXYdbZ6jl1T3MPk0MSB23HYihI9suJvpj7VsEvXXm8fxmORoU81kbGlDy2Ic6bZ3pAwPJ5HPuRFanrDWou-pKwlW9FHD0nbYHqlTUtEajerEbEgQPRO6Nutdv9JO8XSbhMZA`
- **Design Thesis:**
  The digital workspace as a nocturnal watchmaker's instrument bench. For deep-night focus sessions, the screen transforms into a milled obsidian chassis calibrated with horological dials, celestial astrolabe progress tracks, and tactile metal switches.
- **Layout Strategy:**
  Symmetrical architectural sanctuary:
  - Top: Celestial Solar Meridian coordinates (`SOL 14°22'N`) and acoustic atmosphere switches (`BINAURAL 432Hz`, `BODLEIAN RAIN`, `SILENCE`).
  - Center: Monumental astronomical chronometer dial with fine degree tick marks and oversized tabular Newsreader timer digits (`52:18`).
  - Flanks: Active Lemma proof verification checklist on the left, epistemic drift scratchpad on the right.
- **Typography:**
  - Timer Digits: *Newsreader* 88px tabular figures with razor-thin seconds.
  - Epigraphs: *Newsreader* Italic 18px.
  - Telemetry: *JetBrains Mono* 11px uppercase with 0.08em letter spacing.
- **Color System:**
  - Base: Volcanic Basalt `#0E0C0B`.
  - Milled Plates: `#141210` and `#1A1715`.
  - Inks: Vellum Parchment `#E8E2D8` and Sand `#877E74`.
  - Accents: Burnished Brass `#B58942` and Ember Terracotta `#C84B31`.
- **Surfaces:**
  Recessed milled wells (`inset 0 1px 2px rgba(0,0,0,0.7)`) with beveled 1px chamfer highlights (`inset 0 1px 0 rgba(232,226,216,0.04)`).
- **Iconography:**
  Horological sub-dial registers, knurled knobs, mechanical switch pins.
- **Custom Asset Strategy:**
  SVG Celestial Astrolabe Dial with concentric orbital rings and dynamic sun-node transit animation.
- **Motion Strategy:**
  Smooth 60fps sweep of the solar chronometer hand, mechanical latch clicks on state toggles (60ms tactile press).
- **Responsive Behavior:**
  On mobile, the astronomical dial compacts into a thin circular solar compass at the top, and controls format as a horizontal thumb rail.
- **Strengths:**
  Profoundly immersive, hypnotic focus atmosphere, memorable signature aesthetic.
- **Weaknesses:**
  Too specialized for a dense multi-task table or daily agenda planning.
- **What Solis Borrowed:**
  The complete architecture for the Focus Room (`FocusPage.tsx`), the astronomical solar dial visualization, and the tactile milled button micro-states.
- **What Solis Rejected:**
  Overly heavy skeuomorphism in standard CRUD task workflows.

---

### Concept C: The Study & Knowledge Matrix (Axiomatic Epistemic Studio)
- **Stitch Screen Generated:** `projects/3289206954779557551/screens/a9b62bc97f994a76ae92e94c21061769`
- **Screenshot Artifact:** `https://lh3.googleusercontent.com/aida/AEtjO1VM2RnrReUpoSlGrY5d7UkD0C-7oPKvRQX7C9u8RffzBpVPbrDY82RvVRv9xeN_GRcv30rTt4S_rkYpIP2lrwKpfIy_P9c4FXVcFWVAUGN9LyC7ty3mY9ueobVJ0xPWpOhZ5yxErNYngNoyja1WMUm1cyqHwuYDgXAVVet_xbL_kLHSOu9bjUtsH1jbCFDKb-7IgJsgzZcn-h1p96h3pUgVRuFARAIcc0rLk5Z7YaP-GeNNu0pcEorXHMc`
- **Design Thesis:**
  A unified academic studio integrating curriculum syllabus trees, active recall spaced repetition (SM-2), and formal knowledge synthesis. Replaces gamified flashcards and disconnected syllabi with a single rigorous typographic matrix.
- **Layout Strategy:**
  Split-screen hairline-divided workspace (36% / 64%):
  - Left: Hierarchical Syllabus Roadmap with geometric mastery arcs, decay half-life telemetry (`t½ = 72h`), and active module indicators.
  - Right: Active Spaced Recall Derivation Desk featuring formal axiomatic proofs, keyboard chord grading (`[1] Hard`, `[2] Pass`, `[3] Good`, `[4] Master`), and a continuous tabular retention trajectory ledger.
- **Typography:**
  - Proof Headings: *Newsreader* 26px Medium Roman.
  - Axiomatic Code & Equations: *JetBrains Mono* 13px tabular figures.
  - Status & Grades: *JetBrains Mono* 11px uppercase with keycap framing (`[1]`, `[2]`).
- **Color System:**
  - Base: Alabaster Ivory `#FAF8F5`.
  - Hairlines: `#E6E2DC` / `rgba(40, 36, 32, 0.12)`.
  - Text: Deep Archival Ink `#1F1C18` and Muted Soot `#777169`.
  - Retention Signals: Sage `#3E7250` (Consolidated), Amber `#C28224` (Drift), Terracotta `#C84B31` (Critical Decay).
- **Surfaces:**
  Cardless split columns with crisp vertical border-right delimiter.
- **Iconography:**
  Mathematical quantifier symbols (`∀`, `∃`, `⇒`), retention decay sparklines, keyboard chord badges.
- **Custom Asset Strategy:**
  Geometric SVG mastery arcs showing retention decay angles, interactive proof reveal mask.
- **Motion Strategy:**
  Instantaneous keyboard grading feedback (sub-80ms), smooth horizontal slip on next card load.
- **Responsive Behavior:**
  On tablet/mobile, switches to a tabbed segment: "Syllabus Index" and "Recall Desk", retaining full keyboard accessibility.
- **Strengths:**
  Unsurpassed intellectual density, transforms study tracking into a serious scholarly tool, frictionless keyboard speed.
- **Weaknesses:**
  Dense information display requires disciplined white-space management.
- **What Solis Borrowed:**
  The split-pane syllabus + recall architecture for `StudyPage.tsx`, the keyboard chord assessment triggers, and the tabular retention trajectory ledger.
- **What Solis Rejected:**
  Excessively dense mathematical notation for non-technical study fields.

---

## 3. The Unified Direction: Solis "Archival Broadsheet & Celestial Instrument"

Rather than choosing one concept exclusively, the ultimate Solis visual identity emerges from the intentional synthesis of all three:

1. **Global App Shell & Day Mode (Concept A Foundation)**:
   - Surface-less broadsheet canvas (`#FAF8F5`) with crisp hairline ruling (`#E6E2DC`).
   - Newsreader display titles + Plus Jakarta Sans operational interface + JetBrains Mono tabular marginalia.
   - De-cardified action ledgers replacing all floating container cards.
   - Strict Anti-Pill rule: 2px micro-radiused archival badges instead of pill capsules.
   - Header with integrated intelligence command and quiet breadcrumbs.

2. **Focus Sanctuary & Night Immersion (Concept B Foundation)**:
   - Deep Obsidian `#0E0C0B` canvas with milled basalt surface plates (`#141210`, `#1A1715`).
   - Celestial Solar Chronometer with astronomical degree ticks, orbital declination arcs, and solar meridian node.
   - Monumental Newsreader tabular digits (`50:00`).
   - Tactile milled switch rails with zero glowing blurs.

3. **Study & Knowledge Matrix (Concept C Foundation)**:
   - Split-pane curriculum syllabus roadmap with geometric retention arcs.
   - Active recall spaced repetition desk with keyboard chords (`[1]`, `[2]`, `[3]`, `[4]`).
   - Continuous retention trajectory table replacing scattered flashcard boxes.

This synthesis creates an original, memorable product identity that completely separates Solis from generic SaaS productivity clones.
