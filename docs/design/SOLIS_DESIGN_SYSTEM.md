# Solis — Unified Design System 4.0 (The Circadian Monograph)

**Date**: September 24, 2026  
**Status**: Active Production Standard

---

## 1. Philosophical Grounding

Solis is an intentional personal operating system for serious scholars, researchers, and builders who cultivate lifelong mastery. The visual language marries **classical archival print** (the focused calm of a rare-book reading room) with **celestial chronobiology** (aligning human cognitive capacity with solar rhythms).

The interface is intentionally **unboxed, tactile, and mathematically disciplined**.

---

## 2. Typographic Trinity

| Role | Family | Weights | Intended Use | CSS Variable |
| :--- | :--- | :--- | :--- | :--- |
| **Editorial & Display** | `Newsreader`, Georgia, serif | 400, 400 Italic | Hero headlines, session greetings, quotes, thesis titles | `--font-display` |
| **Operational & Interface** | `Plus Jakarta Sans`, Inter, sans-serif | 400, 500, 600 | Navigation, labels, buttons, input fields, reading body | `--font-interface` |
| **Analytical & Chrono** | `JetBrains Mono`, monospace | 400, 500 | Tabular numbers, timestamps, catalog IDs, SM-2 decay indices | `--font-mono` |

### Broadsheet Typographic Scale
- **Display XL**: `3.25rem` / `52px` (Line height `1.1`, Letter spacing `-0.025em`)
- **Display LG**: `2.5rem` / `40px` (Line height `1.15`, Letter spacing `-0.02em`)
- **Heading 1**: `1.875rem` / `30px` (Line height `1.25`, Letter spacing `-0.015em`)
- **Heading 2**: `1.375rem` / `22px` (Line height `1.35`, Letter spacing `-0.01em`)
- **Heading 3**: `1.125rem` / `18px` (Line height `1.4`, Letter spacing `-0.005em`)
- **Body Large**: `1rem` / `16px` (Line height `1.6`)
- **Body Standard**: `0.875rem` / `14px` (Line height `1.55`)
- **Marginalia / Caption**: `0.75rem` / `12px` (Line height `1.45`, JetBrains Mono)
- **Micro Code / Index**: `0.6875rem` / `11px` (Letter spacing `0.05em`, Uppercase)

---

## 3. Color Foundations & 2% Accent Rule

### Neutral Grounds & Inks
- **Night Canvas (Obsidian Basalt)**: `#0E0C0B` (Primary deep dark ground)
- **Night Canvas Deep**: `#080706` (Vignette & Focus isolation ground)
- **Night Surface Primary**: `#181614` (Subtle 1% elevated plane)
- **Night Surface Highlight**: `#23201D` (Hover state & active tool docks)
- **Hairline Divider (Dark)**: `rgba(255, 255, 255, 0.08)` (1px structural ruling)
- **Day Canvas (Warm Alabaster)**: `#FAF8F5` (Archival paper daylight ground)
- **Day Surface Primary**: `#F3EFEA` (Secondary paper shelf)
- **Hairline Divider (Light)**: `rgba(26, 24, 22, 0.08)`

### The 2% Operational Accent (Solar Cinnabar / Terracotta Ember)
- **Core Ember**: `#E65A41` (Dark mode active needle & CTA)
- **Terracotta Deep**: `#C84B31` (Light mode active needle & CTA)
- **Ember Glow Low**: `rgba(230, 90, 65, 0.12)` (Focus state tint)
- **Ember Glow Minimal**: `rgba(230, 90, 65, 0.05)` (Selection wash)

*Rule: Ember is never applied as an ambient decorative blob, glowing text drop-shadow, or card background fill. It marks active focus needles, live timers, and definitive commit actions only.*

---

## 4. Surfaces, Geometry & Border Disciplines

- **Surface-less Architecture**: Reject card-in-card nesting. Group information with 1px hairline horizontal and vertical rules.
- **Micro-Corner Radii**:
  - `0px`: Full-bleed split panes, table dividers, broadsheet margins.
  - `2px`: Tabular data badges, catalog chips, custom checkboxes.
  - `4px`: Standard buttons, input fields, modal containers.
  - `6px`: Dropdowns and popovers.
  - **Pill Ban**: Never use `rounded-full` / `9999px` capsules for system status badges or tags.
- **Elevation**: Zero directional drop shadows (`box-shadow: none`). Modals use a crisp 1px hairline border over a 40% translucent obsidian scrim.

---

## 5. What Solis Must NEVER Look Like Again (Anti-AI-Slop Guardrails)

1. **NO Neon Cyberpunk Dashboards**: No high-saturation magenta, cyan, or fluorescent violet gradients.
2. **NO Generic 3-Column Card Grids**: The landing page must never look like "Hero -> 3 feature cards -> Pricing cards".
3. **NO Floating Nested Boxes**: Never place a rounded card inside a container card with its own rounded border.
4. **NO Emoji As System Icons**: All structural iconography must be SVG vector paths.
5. **NO Uncalibrated Layout Shifts**: All timers, progress metrics, and dates must enforce `tabular-nums`.
