# Solis — The Design Bible

## 1. Product Philosophy
> **"Solis is a quiet room for ambitious minds."**
Solis is a personal operating environment for study, focus, knowledge, reflection, and compounding progress.

---

## 2. Target User
Undergraduate and graduate scholars, self-taught engineers, researchers, and serious lifelong learners tackling rigorous, high-stakes intellectual disciplines.

---

## 3. Product Promise
To turn unstructured cognitive overwhelm into calm, structured mastery without noise, distraction, or aggressive gamification.

---

## 4. Emotional Journey
1. **ARRIVE**: Settle into the space with time-aware greeting and contextual memory.
2. **SETTLE**: Quiet the mind through visual calm, warm ivory canvas, and clean typography.
3. **INTEND**: Define the singular breakthrough intention for the day.
4. **FOCUS**: Transition into a full-screen, distraction-free sanctuary with floating time.
5. **LEARN**: Navigate coursework with a living syllabus and explicit topic mastery states.
6. **CAPTURE**: Distill core insights and syntheses in an editorial thinking canvas.
7. **REFLECT**: Close study blocks and the day with reflective closure.
8. **RETURN**: Come back tomorrow to a system that remembers exactly where you left off.

---

## 5. Visual Language & Depths
* **Depth 0 (Canvas)**: `#FAF8F5` (Warm Ivory base)
* **Depth 1 (Surface)**: `#FFFFFF` with `0 1px 3px rgba(0,0,0,0.04)`
* **Depth 2 (Floating)**: `#FFFFFF` with `0 8px 24px rgba(0,0,0,0.06)`
* **Depth 3 (Atmosphere)**: Soft radial gradient fields
* **Depth 4 (Sanctuary Obsidian)**: `#161413` with deep amber/coral warmth for Focus

---

## 6. Typography Scale
* **Display Serif**: `Newsreader` (Italic for narrative moments, optical sizes 16pt–72pt, 1.25x line-height to prevent glyph clipping).
* **Interface Sans**: `Plus Jakarta Sans` (400, 500, 600, 700 with letter-spacing tracking).
* **Monospace / Numerical**: `Plus Jakarta Sans` / `JetBrains Mono` with `font-variant-numeric: tabular-nums`.

---

## 7. Color System & Subject Worlds
* **Base Palette**: Canvas `#FAF8F5`, Inks `#1A1817` / `#6B665F` / `#9E988F`.
* **Subject Worlds Palette**:
  - **Coral Flame** (`#E65A41`): Systems, Engineering, Deep Work.
  - **Golden Amber** (`#D9822B`): Mathematics, Logic, Study Horizon.
  - **Twilight Lavender** (`#7E69AB`): Theory, Philosophy, Long-Term Vision.
  - **Calm Sage** (`#4A7C59`): Algorithms, Natural Sciences, Rituals & Mastery.

---

## 8. Custom Controls Standard
* **`<CustomSelect>`**: Custom keyboard-navigable dropdowns with light, subtle, and dark sanctuary variants (eliminating OS `#0078d7` blue highlights).
* **`<SegmentedControl>`**: Tactile pill and contained switchers.
* **Tactile Interactions**: `:active { transform: scale(0.98); }` across buttons, checkboxes, and pills.

---

## 9. Motion & Parallax Standard
* Micro (100–150ms), Standard (200–350ms), Scene (400–700ms).
* Parallax primitives (`<ParallaxScene>`, `<ParallaxLayer>`, `<AtmosphericOrb>`) use passive scroll listeners, `requestAnimationFrame`, and `IntersectionObserver` offscreen pausing.
* Full `@media (prefers-reduced-motion: reduce)` support.

---

## 10. Information Architecture (4 Zones)
1. **TODAY**: Daily Flow (`/app/dashboard`), Task Sanctuary (`/app/tasks`), Study Studio (`/app/study`), Focus Sanctuary (`/app/focus`)
2. **KNOWLEDGE**: Knowledge Studio (`/app/notes`), Subject Worlds (`/app/study`)
3. **HORIZONS**: Rituals & Consistency (`/app/habits`), Goal Horizons (`/app/goals`), Cognitive Rhythm (`/app/analytics`)
4. **SYSTEM**: Preferences (`/app/settings`)

---

## 11. Anti-Patterns (The "NEVER DO THIS" List)
- ❌ **No generic card walls**: Never arrange an entire page as equal-width square boxes.
- ❌ **No badge vomit**: Never put 5 rainbow badges on a single task row.
- ❌ **No native OS selects**: Never use default browser select menus with blue highlight boxes.
- ❌ **No headline glyph clipping**: Never allow ascenders/descenders on serifs to be clipped by overflow.
- ❌ **No gamified streak fireworks**: Never show childish fire emojis or noisy gamification banners.
- ❌ **No fake AI personalization**: Never show fabricated data; continuity must come from real user actions.
- ❌ **No unconstrained textareas**: Never let writing lines exceed 760px on wide desktop displays.
- ❌ **No layout thrashing**: Never animate properties other than `transform` and `opacity`.
