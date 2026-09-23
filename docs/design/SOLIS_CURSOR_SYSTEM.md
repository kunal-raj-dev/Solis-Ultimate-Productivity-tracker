# Solis — Contextual Desktop Cursor System

**Date**: September 24, 2026  
**Target Environment**: Fine-pointer Desktop Devices (Mouse / Trackpad)  
**Fallback**: Seamless native cursor on coarse touch screens (iOS / Android / Tablets)

---

## 1. Design Intent

The Solis custom cursor acts as a **precision drafting stylus and optical loupe**. It replaces clumsy OS arrows on desktop with a micro-instrument that accentuates layout hierarchy without adding input lag or obstructing interaction targets.

---

## 2. Cursor Operational States

| Cursor State | Visual Geometry | Trigger Conditions | Behavioral Response |
| :--- | :--- | :--- | :--- |
| **`DEFAULT`** | `6px` solid obsidian/alabaster dot with `1px` subtle rim | Open workspace ground, text columns, dividers | Smooth sub-pixel tracking with zero lerp latency |
| **`ACTION`** | Expanded `32px` circular ring with living ember center dot | Buttons, interactive links, primary CTAs | Subtle magnetic attraction to the button centroid |
| **`EXAMINE`** | `44px` circular loupe with `VIEW` micro-label in JetBrains Mono | Monograph cards, subject roadmap nodes, retention graphs | Gentle scale expansion with translucent aperture fill |
| **`DRAG`** | Horizontal double-chevron hairline glyph | Time-block schedule edges, split-pane dividers | Locks cursor axis and provides visual direction hints |
| **`ZEN`** | Opacity smoothly drops to `0` after 3 seconds of inactivity | Focus Room Sanctuary | Complete disappearance to prevent visual distraction during deep thought |

---

## 3. Engineering & Usability Safeguards

1. **Hardware Acceleration**: Handled strictly via GPU transforms (`transform: translate3d(x, y, 0)`). Zero layout recalculation or reflows.
2. **Coarse Pointer Detection**:
   ```css
   @media (pointer: coarse) or (hover: none) {
     .solis-cursor-container {
       display: none !important;
     }
     * {
       cursor: auto !important;
     }
   }
   ```
3. **Native Click Affordance**: The custom cursor is purely visual (`pointer-events: none`). Native browser hit-testing, clicking, drag-selection, and text selection remain 100% uninhibited.
