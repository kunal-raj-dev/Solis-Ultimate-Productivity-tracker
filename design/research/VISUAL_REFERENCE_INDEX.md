# Solis — Visual & Art Direction Reference Index

## Overview
This index documents 30+ visual and aesthetic benchmarks across contemporary award-winning web design, editorial publications, and spatial interfaces (Awwwards, Godly, Behance, Dribbble, Apple, Craft).

---

## 1. Editorial Typography & Serifs (Newsreader + Plus Jakarta Sans)
* **Benchmark Source**: The New Yorker Digital, Godly Editorial Showcases, Stripe Press, Kinfolk.
* **Core Characteristic**: High-contrast modern serifs paired with neutral geometric sans-serifs. Italic serifs used for narrative reflections and section anchors.
* **What Solis Applies**:
  - `Newsreader`: Used for display headlines, time-aware greetings, large sculptural momentum numerals, timer digits, and reflection questions.
  - `Plus Jakarta Sans`: Used for UI controls, inputs, badges, navigation, and tabular data.
  - **Glyph Safety**: 1.25x line-height and `padding-left: 2px` permanently preventing uppercase ascender/descender clipping (e.g. "K" in Knowledge).

---

## 2. Spatial Depths & Negative Space
* **Benchmark Source**: Apple Design Awards, Teenage Engineering Interfaces, Dieter Rams Principles.
* **Core Characteristic**: Negative space is not "empty space"—it is the frame that gives content gravitas and calm.
* **What Solis Applies**:
  - `Depth 0 (Canvas)`: `#FAF8F5` (Warm Ivory base that reduces optical eye fatigue).
  - `Depth 1 (Surface)`: `#FFFFFF` with ultra-fine border (`rgba(0,0,0,0.06)`).
  - `Depth 2 (Floating)`: Elevated surface with `0 8px 24px rgba(0,0,0,0.06)`.
  - `Depth 3 (Atmosphere)`: Soft radial gradient fields.
  - `Depth 4 (Sanctuary Obsidian)`: `#161413` with deep amber/coral warmth for Focus.

---

## 3. Atmospheric Light Fields vs. Decorative Blobs
* **Benchmark Source**: Endel Visuals, Cosmos Studio, Stripe Climate.
* **Core Characteristic**: Lighting is subtle, organic, and sits *behind* content to softly illuminate the environment, rather than harsh decorative gradient text fills.
* **What Solis Applies**:
  - `<SceneAtmosphere>` and `<AtmosphericOrb>` with hardware-accelerated CSS radial gradients.
  - State-driven shifts: Coral for Focus, Amber for Study, Lavender for Horizons, Sage for Rituals & Mastery.

---

## 4. Tactile Controls & Micro-Responses
* **Benchmark Source**: Linear Controls, Figma UI, Apple HIG.
* **Core Characteristic**: Physical click feedback without native OS artifacts.
* **What Solis Applies**:
  - Bespoke `<CustomSelect>` with light and dark sanctuary themes (zero Windows `#0078d7` blue highlight).
  - Sliding pill `<SegmentedControl>`.
  - Tactile active press: `:active { transform: scale(0.98); }`.

---

## 5. Asymmetric Composition vs. Equal-Width Card Walls
* **Benchmark Source**: Editorial magazines, Craft Spaces, The Verge Redesign.
* **Core Characteristic**: Varying column weights (e.g. 1.6fr primary stream vs 1.0fr supporting context) that guide the eye naturally from primary to tertiary information.
* **What Solis Applies**:
  - Replaced repetitive 4-card grids with asymmetric Daily Flow streams.
  - Living Study Queue timeline with direct Focus launchers.
