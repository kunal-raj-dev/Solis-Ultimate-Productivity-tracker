# Solis: The New Visual Identity, Design System & Interaction Architecture
### International-Grade Academic & Productivity Operating System (Version 3.0)
**Document Classification:** Master Architectural Specification & Design System Bible  
**File Path:** `docs/research/SOLIS_NEW_VISUAL_IDENTITY_AND_UX_SYSTEM.md`  
**Status:** Validated, Implemented & Verified in Codebase  
**Verification Gate:** 72/72 Test Suites Green (610/610 Tests Passing), 0 TypeScript Errors, 100% Vite Build Success  
**Scope:** Complete Product Frontend Reinvention (Tokens, Typography, Surfaces, Spatial Grid, Motion, Screens, & Accessibility)

---

## 1. Executive Summary & Design Thesis

### 1.1 The Problem: The AI-Generated SaaS Trap
In the modern software landscape of 2024–2026, web applications are experiencing an acute crisis of aesthetic homogeneity: the "AI-Slop SaaS Default." The telltale symptoms are ubiquitous:
- **Card-in-a-Card Hallucinations:** Multi-nested high-radius containers (`border-radius: 24px` through `36px`) creating visual claustrophobia.
- **Radioactive Neon Glows:** Garish CSS `box-shadow: 0 0 80px rgba(...)` and `text-shadow` gradients borrowed from generic component libraries that induce eye fatigue during serious knowledge work.
- **Instructional Badge Overload:** Explaining the application's philosophy through wordy italicized quotes and colored pills instead of functional, high-density affordances.
- **Modal Dialogue Fatigue:** Forcing the user into modal traps for everyday data entry, shattering mental flow and spatial context.

### 1.2 The Solis Design Thesis: Chrono-Basalt & Alabaster Parchment
Solis is not a generic to-do list, nor is it a corporate project management dashboard. It is an **Academic & Productivity Operating System** built for competitive scholars, deep-work researchers, software engineers, and disciplined knowledge workers.

Our design thesis is founded on three pillars:
1. **Instrumental Restraint (The Tool Should Recede):** The software should feel like a bespoke analog instrument—a mechanical chronometer, an architect's drafting table, a master scholar's archival ledger. It does not shout for attention with decorative candy; it provides calm, tabular clarity.
2. **Operational Calm vs. Ornamental Calm:** True calm does not come from pastel gradients or philosophical slogans plastered across cards. Operational calm arises from **deterministic latency (<50ms interaction loops), clear spatial anchors, razor-sharp tabular data, and zero surprise layout shifts.**
3. **The Materiality of Chrono-Basalt & Alabaster Parchment:**
   - **Night Mode (Chrono-Basalt):** Built on deep volcanic obsidian (`#0E0C0B`), basalt slate, and warm charcoal surfaces. Borderlines are hairline-thin (`0.06` opacity), creating subtle depth without harsh contrast boundaries.
   - **Day Mode (Alabaster Parchment):** Built on warm organic alabaster ivory (`#FAF8F5`), creamy surface layers, and deep carbon ink (`#1A1816`). Text reads like an archival printed book rather than a glowing LED spreadsheet.

---

## 2. Research Foundations & Category Audit Synthesis

To build an interface with generational endurance, we conducted an empirical audit of the five most disciplined productivity tools in modern computing history. Rather than copying their components, we distilled their foundational UX philosophies into Solis:

```
┌───────────────────────────────────────────────────────────────────────────────┐
│                    SOLIS DESIGN SYNTHESIS FRAMEWORK                           │
├─────────────────┬───────────────────────────────┬─────────────────────────────┤
│ Product         │ Core Philosophy Borrowed      │ Explicitly Rejected         │
├─────────────────┼───────────────────────────────┼─────────────────────────────┤
│ LINEAR          │ Sub-50ms keyboard velocity,   │ Generic dark-mode purple/   │
│                 │ table-native density, micro-  │ indigo glow; developer-only │
│                 │ spatial discipline            │ cold corporate jargon       │
├─────────────────┼───────────────────────────────┼─────────────────────────────┤
│ THINGS 3        │ Intentional white space,      │ Rigid iOS-only patterns;    │
│                 │ delicate typography, tactile  │ absence of deep web study   │
│                 │ task completion feel          │ analytics and time blocks   │
├─────────────────┼───────────────────────────────┼─────────────────────────────┤
│ SUNSAMA         │ Calm 24-hour time blocking,   │ Slow, bloated React tree;   │
│                 │ deliberate daily shutdown,    │ subscription paywall gates  │
│                 │ unscheduled shelf to timeline │ on basic study functions    │
├─────────────────┼───────────────────────────────┼─────────────────────────────┤
│ CRON / NOTION   │ Continuous time-grid, living  │ Heavy calendar clutter;     │
│ CALENDAR        │ time needle, razor-sharp      │ disconnection from syllabus │
│                 │ hairline event blocks         │ & spaced repetition mastery │
├─────────────────┼───────────────────────────────┼─────────────────────────────┤
│ ENDEL           │ Circadian psychoacoustic      │ Gimmicky generative loops   │
│                 │ soundscapes, bio-rhythm sync, │ that distract from focus;   │
│                 │ peripheral dimming in Zen     │ complex setup requirements  │
└─────────────────┴───────────────────────────────┴─────────────────────────────┘
```

### 2.1 The Synthesis: A Handcrafted Symphony
Solis synthesizes these paradigms into a coherent whole:
- **From Linear:** We took the keyboard-first navigation architecture (`Cmd+J`, `Cmd+K`, keyboard task selection) and hairline boundary discipline (`0.06` alpha).
- **From Things 3:** We took the breathing room around major content canvases, graceful status updates, and the principle that a completed task should feel mechanically satisfying.
- **From Sunsama:** We took the philosophy that time is finite: unscheduled tasks must sit on an ergonomic staging shelf, dragged or quick-slotted directly into an hourly timeline.
- **From Cron:** We implemented the living time needle—a continuous coral indicator line that sweeps across the 24-hour day in real time.
- **From Endel:** We integrated procedural, browser-native Web Audio soundscapes (binaural alpha/theta waves, brown noise, gentle rain) coupled with a zero-glow, high-contrast tabular countdown.

---

## 3. Anti-AI-Slop Code of Craft

To ensure Solis permanently avoids the visual clichés of AI-generated SaaS, the codebase strictly adheres to the **Anti-AI-Slop Code of Craft**:

### 3.1 Rule 1: The Total Ban on Card-in-Card Nesting
- **Anti-Pattern:** A page container contains a card, which contains three sub-cards, each containing a pill-bordered action container.
- **Solis Standard:** A surface is defined by **hairline division lines (`border: 1px solid var(--border-hairline)`) and subtle background elevations**, never by piled-up floating cards. Container borders use a tight, tailored radius (6px or 8px max).

### 3.2 Rule 2: Elimination of Radioactive Neon Glow
- **Anti-Pattern:** `text-shadow: 0 0 80px var(--accent)` or multi-layered blurred box shadows that simulate a cyber-punk arcade.
- **Solis Standard:** Crisp, high-contrast tabular figures rendered with `font-feature-settings: 'tnum', 'zero'`. Focus is achieved through peripheral opacity reduction, not retina-scorching glow.

### 3.3 Rule 3: The 92 / 6 / 2 Chromatic Balance Rule
- **92% Ground & Ink:** The vast majority of the screen is composed of foundational canvas, muted surface elevations, and high-legibility ink (`--text-primary`, `--text-secondary`).
- **6% Structural Boundaries:** Hairline borders, dividers, subtle progress tracks, and spatial grid markers.
- **2% High-Value Focal Accent:** The signature warm terracotta coral (`#E65A41`) is strictly reserved for actionable primary triggers: the living time needle, active timer countdown state, and critical alerts.

### 3.4 Rule 4: Action Over Philosophy (Kill the Slogan Pills)
- **Anti-Pattern:** Top of every page featuring an italic quote explaining what habits or tasks are.
- **Solis Standard:** Replace meta-commentary with immediate functional state: current date, active streak, cognitive capacity gauge, and actionable filters.

---

## 4. Design Tokens 3.0: Chrono-Basalt & Alabaster Parchment

The Solis token system is codified in `src/styles/tokens.css` with strict layer separation: Primitive Colors → Semantic Ground/Surfaces → Functional Accents → Layout & Radii.

### 4.1 Primitive Palette Specifications
```css
/* Warm Alabaster Ivory Scale (Day Ground) */
--color-ivory-50:  #FDFCFB;
--color-ivory-100: #FAF8F5; /* Canonical Day Canvas */
--color-ivory-200: #F4EFEB;
--color-ivory-300: #EDE5DF;
--color-ivory-400: #DDD2C8;
--color-ivory-500: #C4B5A5;

/* Deep Chrono-Basalt Scale (Night Ground) */
--color-charcoal-900: #0E0C0B; /* Canonical Night Canvas */
--color-charcoal-800: #151311; /* Night Surface Primary */
--color-charcoal-700: #1C1917; /* Night Surface Secondary */
--color-charcoal-600: #262320; /* Night Surface Elevated */
--color-charcoal-500: #332F2B;
--color-charcoal-400: #4D4742;

/* Signature Terra-Cotta Coral */
--color-coral-500: #E65A41; /* Living Needle, Active Focus */
--color-coral-600: #CC4830; /* Active / Pressed */
--color-coral-400: #ED745E; /* Hover State in Dark Mode */
```

### 4.2 Semantic Mapping & Contrast Ratios
| Token | Day Mode (`[data-theme="light"]`) | Night Mode (`[data-theme="dark"]`) | Minimum WCAG Ratio | Purpose |
| :--- | :--- | :--- | :--- | :--- |
| `--bg-canvas` | `#FAF8F5` (Alabaster Ivory) | `#0E0C0B` (Chrono-Basalt) | AAA Ground | Root application viewport |
| `--bg-surface-primary` | `#F4EFEB` | `#151311` | AAA Ground | Sidebars, main workspace panes |
| `--bg-surface-secondary` | `#FFFFFF` | `#1C1917` | AA Surface | Elevated rows, cards, drawers |
| `--text-primary` | `#1A1816` (Deep Carbon Ink) | `#FAF8F5` (Alabaster Bone) | 16.4:1 (AAA) | Operational headers, body prose |
| `--text-secondary` | `#686058` | `#A69E95` | 5.8:1 (AA) | Metadata, timestamps, labels |
| `--border-hairline` | `rgba(26, 24, 22, 0.06)` | `rgba(255, 255, 255, 0.06)` | Structural | Ultra-subtle panel dividers |
| `--border-subtle` | `rgba(26, 24, 22, 0.12)` | `rgba(255, 255, 255, 0.12)` | Boundary | Card perimeters, input borders |

### 4.3 Structural Geometry & Z-Index Governance
```css
/* Precise Radii (Ban on 24px+ Blob Geometry) */
--radius-xs: 4px;   /* Micro-badges, timeline markers */
--radius-sm: 6px;   /* Standard buttons, input fields */
--radius-md: 8px;   /* Workspace panels, cards, split panes */
--radius-lg: 12px;  /* Modals, command palette overlays */
--radius-full: 9999px; /* Status dots, avatar pills */

/* Strict Z-Index Scale */
--z-base: 0;
--z-raised: 10;
--z-sticky: 100;
--z-header: 200;
--z-dropdown: 300;
--z-drawer: 400;
--z-modal: 500;
--z-popover: 600;
--z-tooltip: 700;
--z-toast: 800;
```

---

## 5. Typographic Architecture: The Tri-Font Role Segregation

Typography in Solis is treated as an architectural hierarchy. Each font family is bound strictly to a dedicated cognitive role:

```
┌───────────────────────────────────────────────────────────────────────────────┐
│                    SOLIS TYPOGRAPHIC ROLE CONTRACT                           │
├─────────────────┬───────────────────────────────┬─────────────────────────────┤
│ Font Family     │ Assigned Cognitive Role       │ CSS Rule / Feature Settings │
├─────────────────┼───────────────────────────────┼─────────────────────────────┤
│ Newsreader      │ Editorial Reflection, Weekly  │ font-family: var(--font-    │
│ (Serif)         │ Review, Philosophical Pauses, │   display);                 │
│                 │ Arrival Greetings             │ font-style: normal / italic │
├─────────────────┼───────────────────────────────┼─────────────────────────────┤
│ Plus Jakarta    │ Operational Heads, Table Data,│ font-family: var(--font-    │
│ Sans (Sans)     │ Buttons, Inputs, Navigation,  │   interface);               │
│                 │ Kanban Cards, Split Drawers   │ letter-spacing: -0.025em    │
├─────────────────┼───────────────────────────────┼─────────────────────────────┤
│ JetBrains Mono  │ Timestamps, Monospace Timer,  │ font-family: var(--font-    │
│ (Mono)          │ Revision Intervals (SM-2),    │   mono);                    │
│                 │ Keyboard Shortcuts (⌘K, ⌘J)   │ font-variant-numeric: tnum  │
└─────────────────┴───────────────────────────────┴─────────────────────────────┘
```

### 5.1 Tracking Scale & Optical Balance
To eliminate loose, amateurish typography, all operational headings in Solis enforce tight negative tracking:
- **Display Headlines (`h1`, `h2`):** `letter-spacing: -0.025em; line-height: 1.15;`
- **Section Headers & Card Titles:** `letter-spacing: -0.015em; line-height: 1.3; font-weight: 600;`
- **Monospace Telemetry:** `letter-spacing: -0.01em; font-feature-settings: 'tnum', 'zero';`
- **Micro Labels (`uppercase`):** `letter-spacing: +0.05em; font-size: 11px; font-weight: 600;`

---

## 6. Spatial System & Hairline Geometry

### 6.1 The 8-Point Spatial Rhythm
Every layout dimension in Solis derives from an 8px base unit with a 4px half-step for micro-alignment:
`4px (micro) → 8px (sm) → 16px (md) → 24px (lg) → 32px (xl) → 48px (2xl) → 64px (3xl)`

### 6.2 Hairline Divider Physics
Instead of heavy drop shadows and 2px borders, Solis relies on **hairline boundaries**:
- In Day Mode: `rgba(26, 24, 22, 0.06)` creates an almost imperceptible, ink-like dividing score.
- In Night Mode: `rgba(255, 255, 255, 0.06)` separates panels without creating eye-jarring gridlines.
- Depth is achieved through slight background tint elevation (`#0E0C0B` → `#151311` → `#1C1917`), maintaining visual hierarchy without physical clutter.

---

## 7. Motion Doctrine & Spring Micro-Physics

Motion in Solis is functional and tactile, never decorative or lingering.

### 7.1 Motion Rules
1. **Duration Cap:** No UI transition exceeds `240ms`. Fast operational transitions run at `120ms` to `160ms`.
2. **Cubic-Bezier Easing:** Transitions use smooth deceleration curves:
   - Entrance / Popover: `cubic-bezier(0.16, 1, 0.3, 1)` (smooth deceleration).
   - Exit / Dismissal: `cubic-bezier(0.7, 0, 0.84, 0)` (quick acceleration out).
3. **Mechanical Tactility:** Buttons utilize a subtle `:active` transform scale (`scale(0.985)`) coupled with haptic trigger events on supported mobile devices.
4. **Accessibility Compliance:** `@media (prefers-reduced-motion: reduce)` immediately zeroes out all transform, scale, and slide transitions, reverting to instant opacity swaps.

---

## 8. Navigation & Spatial Wayfinding

### 8.1 Desktop Architectural Rail
- **Expanded Width:** `260px` with generous vertical rhythm, clear section headers (`TODAY`, `KNOWLEDGE`, `HORIZONS`), and keyboard badges.
- **Collapsed Width:** `68px` high-efficiency icon rail with instant tooltips.
- **The "Ask Solis ⌘J" Capsule:** Centrally anchored in the top header, this architectural pill provides a direct, keyboard-accessible portal to Solis's deterministic AI tutor and syllabus navigator, opening instantly upon pressing `Cmd+J` or `Ctrl+J`.

### 8.2 Mobile Wayfinding (390px / 430px Fluidity)
- Floating `64px` bottom navigation bar anchored to thumb reach.
- Quick navigation between core modes: Today Flow, Tasks, Study, and Focus.
- Secondary options tucked cleanly into a bottom sheet drawer.

---

## 9. Screen Architecture: Cockpit / Dashboard Experience (`/app/dashboard`)

### 9.1 Conceptual Transformation
The Dashboard is the scholar's **Morning Launchpad**. It bridges strategic intention with tactical execution:
- **Arrival Header:** Gentle Newsreader serif greeting contextualized to the time of day, displaying current date, streak velocity, and circadian status.
- **Cognitive Load Telemetry:** Real-time capacity gauge (0–100%) alerting the user if scheduled work exceeds the healthy cognitive threshold (7.5 hours/day).
- **Living Daily Flow:** Inline view of today's time blocks with the real-time needle indicating progress.
- **Quick-Capture Intention:** A low-friction input field at the top of the timeline to rapidly log priorities without opening forms.

---

## 10. Screen Architecture: Tasks & Hourly Planner (`/app/tasks`)

```
┌───────────────────────────────────────────────────────────────────────────────┐
│                       HOURLY PLANNER VIEW LAYOUT                              │
├──────────────────────────────────────┬────────────────────────────────────────┤
│ 24-HOUR CONTINUOUS TIME GRID         │ UNSCHEDULED STAGING SHELF              │
│                                      │                                        │
│  08:00  ┌──────────────────────────┐ │ ┌────────────────────────────────────┐ │
│         │ Algorithmic Complexity   │ │ │ Unscheduled Tasks (4)              │ │
│         │ 08:00 — 09:30 · CS-401   │ │ ├────────────────────────────────────┤ │
│  09:00  └──────────────────────────┘ │ │ [•] Literature Review Synthesis    │ │
│  09:30 ─── LIVING NEEDLE 09:42 ───── │ │     Est: 45m · High · Quick-Slot + │ │
│  10:00  ┌──────────────────────────┐ │ │ [•] Submit Problem Set 3           │ │
│         │ Calendar: Team Sync      │ │ │     Est: 30m · Normal · Slot +     │ │
│         │ 10:00 — 10:30 (Hairline) │ │ └────────────────────────────────────┘ │
│  11:00  └──────────────────────────┘ │                                        │
└──────────────────────────────────────┴────────────────────────────────────────┘
```

### 10.1 Key Re-architectures
1. **The Living Time Needle (`.solis-living-needle`):** A razor-thin coral rule positioned dynamically based on the current minute of the day. A monospace tag displays the exact current time, creating urgency without anxiety.
2. **Hairline Calendar Event Rows (`.solis-calendar-event-row`):** Replaced purple dashed boxes with crisp, hairline-bordered rows featuring monospace time boundaries and subtle calendar badges.
3. **Unscheduled Staging Shelf (`.solis-unscheduled-shelf`):** A dedicated right-hand or bottom drawer where backlog tasks reside. Users can click "Quick Slot" to instantly assign a task to the next available block, or drag-and-drop onto the timeline.
4. **Time Block Cards (`.solis-time-block-card`):** Restyled with 8px radius, hairline borders, status accent left-bars, and contextual actions (Start Focus, Reschedule, Mark Complete).

---

## 11. Screen Architecture: Study Studio & Syllabus Workspace (`/app/study`)

### 11.1 The Zero-Modal Revolution
The previous version of Solis suffered from modal spam (11 distinct modal dialogs). We completely restructured Study into an **interactive split-pane master-detail workspace (`.solis-study-split-pane`)**:
- **Master Column:** Subject grid cards with 8px radius, clean hairline borders, mastery percentage rings, and exam horizon badges.
- **Detail Drawer:** Selecting a subject smoothly slides out the full syllabus tree in-place, allowing users to drill down into Topics, Flashcard Decks, and Revision Queues without ever losing spatial context.
- **Exam Horizon Bar:** High-density countdown strip displaying days remaining until target exams (e.g., *GRE Advanced Math — 42 Days Remaining*), driving deliberate study prioritization.

---

## 12. Screen Architecture: Focus Sanctuary (`/app/focus`)

### 12.1 The Anti-Glow Tabular Monospace Clock
- **Previous Slop:** `text-shadow: 0 0 80px rgba(230, 90, 65, 0.45)`.
- **New Standard:** Razor-sharp JetBrains Mono tabular countdown (`25:00`). Pure numeric contrast against Chrono-Basalt (`#0E0C0B`) canvas.
- **Zen Mode Peripheral Dimming:** Engaging Zen Mode transitions the viewport into a distraction-free sanctuary: sidebars, navbars, and metrics gently fade out over 3 seconds, leaving only the session topic, countdown clock, and subtle soundscape controls.
- **Web Audio Soundscape Engine:** Procedural, low-overhead synthesized acoustic generators (binaural beat frequencies, gentle rain, pink/brown noise) engineered directly through the Web Audio API without heavy external audio file streaming.

---

## 13. Screen Architecture: Knowledge & Notes Canvas (`/app/notes`)

### 13.1 Editorial Reading Measure
- **Measure Constraint:** The reading and writing canvas is strictly constrained to `--max-readable-width: 760px`, eliminating the eye strain of line lengths spanning full 1440px displays.
- **Quiet Save Indicator:** Notes auto-save continuously in the background. A tiny, unobtrusive status pill (`Saved` / `Syncing...`) provides immediate peace of mind without modal popups or distracting banners.
- **Markdown & Code Craft:** Headings render in crisp Plus Jakarta Sans, body text in high-legibility system serif or sans, and code snippets in JetBrains Mono with subtle dark syntax containment.

---

## 14. Screen Architecture: Habits & Horizons (`/app/habits`)

### 14.1 The 14-Day Consistency Matrix
- Replaced disconnected habit rows with an integrated **14-Day Consistency Matrix (`.solis-habits-matrix-container`)**.
- Each habit displays a horizontal row of 14 interactive date cells. Users can click any day to toggle completion with instant tactile feedback.
- Completed cells render in deep terracotta coral with subtle checkmarks; incomplete days show quiet hairline circles.
- Monospace streak counters (`14d streak`, `89% rate`) calculate completion velocity deterministically.

---

## 15. Screen Architecture: Goals & Strategic Horizon (`/app/goals`)

### 15.1 Milestone Horizon Cards
- Goals are organized into multi-quarter horizons (Quarterly, Bi-Annual, Annual).
- Each goal card (`.solis-goal-card`) utilizes tailored 8px radii, hairline borders, and a high-precision progress bar.
- Direct linkages connect active study subjects and habit streaks to goal milestones, grounding long-term ambitions in daily actions.

---

## 16. Screen Architecture: Analytics & Mastery Intelligence (`/app/analytics`)

### 16.1 Deterministic Telemetry Grid
- **Cognitive Effort Distribution:** Visual breakdown of study volume across subjects (e.g., Mathematics 42%, Systems Architecture 35%, Literature 23%).
- **Focus Depth Index:** Ratio of uninterrupted deep work versus fragmented sessions.
- **Spaced Repetition Retention Rate:** SM-2 forecast calculating optimal review intervals.
- All metrics are housed in clean, non-nested cards (`.solis-metric-card`) with hairline borders and tabular data readouts.

---

## 17. Modal & Surface Architecture

### 17.1 Modal Reduction Guidelines
Modals are strictly reserved for **destructive, irreversible actions** (e.g., permanently deleting a subject) and **system configuration**. All other interactions use:
- **Inline Editing:** Click-to-edit on task titles, notes, and study topics.
- **Split Drawers:** Detail views slide smoothly from the right side of the screen.
- **Contextual Popovers:** Quick priority and date adjustments appear directly adjacent to the trigger element with arrow key navigation.

---

## 18. Accessibility & Ergonomics (WCAG Standards)

1. **Contrast Ratios:** All primary text-to-ground contrast exceeds **7:1** (WCAG AAA); all secondary text exceeds **4.5:1** (WCAG AA).
2. **Keyboard Trapping & Navigation:** Full accessibility tree support with `role="region"`, `role="dialog"`, `aria-label`, and `tabindex` management.
3. **Focus Rings:** Distinct, non-offsetting 2px focus outlines (`outline: 2px solid var(--color-coral-500); outline-offset: 2px;`) that appear only during keyboard navigation (`:focus-visible`).
4. **Haptics Integration:** Interactive triggers invoke the native `hapticsEngine.ts` for subtle vibration feedback on compatible touch devices.

---

## 19. Responsive Adaptation (Mobile 390px / 430px)

```
┌───────────────────────────────────────────────────────────────────────────────┐
│                       MOBILE RESPONSIVE MATRIX                                │
├─────────────────┬───────────────────────────────┬─────────────────────────────┤
│ Viewport Width  │ Navigation Adaptation         │ Workspace Layout            │
├─────────────────┼───────────────────────────────┼─────────────────────────────┤
│ Desktop ≥1024px │ 260px Collapsible Left Rail   │ Multi-column split panes    │
├─────────────────┼───────────────────────────────┼─────────────────────────────┤
│ Tablet 768-1023 │ 68px Icon Rail                │ Stacked split panes with    │
│                 │                               │ toggleable drawers          │
├─────────────────┼───────────────────────────────┼─────────────────────────────┤
│ Mobile ≤767px   │ 64px Floating Bottom Nav      │ Single-column full width;   │
│                 │ with thumb ergonomics         │ bottom sheets for details   │
└─────────────────┴───────────────────────────────┴─────────────────────────────┘
```
- **Horizontal Overflow Prevention:** All containers enforce `max-width: 100vw; overflow-x: hidden;` with fluid padding (`clamp(12px, 3vw, 24px)`).
- **Touch Target Floor:** All clickable elements (buttons, matrix cells, checklist triggers) enforce a minimum touch target of `44x44px`.

---

## 20. Engineering Verification & Quality Gates

Solis enforces continuous, rigorous engineering verification. Every change must pass three automated gates before approval:

### 20.1 Verification Metrics
- **TypeScript Gate:** `npm run typecheck` (`tsc -b`) → **0 errors across entire workspace.**
- **Test Suite Gate:** `npm run test` (`npx vitest run`) → **All 72 test files passed, 610/610 unit & stress tests green.**
  - Includes `src/__tests__/m1EmpiricalStress.test.ts` & `src/__tests__/m2EmpiricalStress.test.ts` asserting exact token values (`#FAF8F5`, `#0E0C0B`, `#E65A41`, `0.06` hairline opacity, negative tracking).
- **Production Build Gate:** `npm run build` (`vite build`) → **Zero warnings, complete chunk bundling in under 6 seconds.**

```bash
# Automated Test Suite Verification Log
Test Files  72 passed (72)
     Tests  610 passed (610)
  Duration  5.15s
     Build  vite v6.4.3 built in 5.26s
```

---

## 21. Next Phase Roadmap & Maintenance Guide

### 21.1 Sustaining Product Craft
To maintain this high level of craft as new features are added:
1. **Never Introduce an Untokenized Color:** Always reference `var(--bg-canvas)`, `var(--text-primary)`, or `var(--border-hairline)`.
2. **Audit New Components Against the Anti-AI-Slop Code:**
   - Does this component nest a card inside another card? If yes, refactor to hairline dividers.
   - Does this component introduce neon glow or text-shadow? If yes, strip it.
   - Does this component require a modal? If yes, convert to an inline row or split drawer.
3. **Preserve Empirical Stress Test Contracts:** The regex assertions in `m1EmpiricalStress.test.ts` protect the design system from drift. Never bypass or disable them.

---

### Conclusion
Through deep empirical research, rigorous design discipline, and surgical frontend execution, Solis 3.0 has cast off the generic tropes of AI-slop SaaS templates. It stands as a bespoke, quiet, and hyper-reliable Academic & Productivity Operating System—built to endure for years of focused human scholarship.
