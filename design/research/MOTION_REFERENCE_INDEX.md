# Solis — Motion & Parallax Reference Index

## Overview
This index documents motion design principles, timing curves, parallax depth architectures, and accessibility constraints benchmarked across leading digital products.

---

## 1. Motion Tiers & Durations

### A. Micro-Interactions (100–150ms)
* **Usage**: Button active press, checkbox check scale, dropdown item hover, toggle slide.
* **Easing**: `cubic-bezier(0.16, 1, 0.3, 1)` (snappy spring-like response).
* **Physics**: `transform: scale(0.98)` on click, `transform: scale(0.88)` on checkbox toggle.

### B. Standard UI Transitions (200–350ms)
* **Usage**: Accordion expansion, modal entry, segmented control pill sliding, toast alerts.
* **Easing**: `cubic-bezier(0.2, 0.8, 0.2, 1)`.
* **Physics**: Combined `opacity` and `translateY(4px) -> translateY(0)`.

### C. Scene & Atmosphere Morphs (400–700ms)
* **Usage**: Focus Sanctuary state shifts (`idle` -> `running` -> `paused` -> `completed`), atmospheric orb color transitions.
* **Easing**: `cubic-bezier(0.25, 1, 0.5, 1)` (soft spatial breathing curve).

---

## 2. Parallax Depth Architecture

```text
Layer 0: Background Canvas (#FAF8F5 / #161413)
Layer 1: Atmospheric Light Orb (Speed: 0.05, Passive RAF)
Layer 2: Narrative Typography (Speed: 0.15)
Layer 3: Primary Content & Interactive Stream (Speed: 1.0)
Layer 4: Foreground Controls & Floating Headers
```

* **Performance Rules**:
  - Parallax calculations execute exclusively inside `requestAnimationFrame`.
  - Listeners use `{ passive: true }`.
  - `IntersectionObserver` automatically pauses calculation when scenes are offscreen.

---

## 3. Accessibility: `prefers-reduced-motion`
* When user enables reduced motion at the OS level:
  - All parallax transforms resolve to `transform: none`.
  - Transitions clamp to `opacity` shifts under 100ms.
  - Full functionality, state cues, and timer countdowns are preserved.
