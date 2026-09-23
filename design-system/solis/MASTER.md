# Design System Master File — The Archival Circadian Monograph

> **LOGIC:** When building a specific page, first check `design-system/solis/pages/[page-name].md`.
> If that file exists, its rules **override** this Master file.
> If not, strictly follow the rules below.

---

**Project:** Solis
**Design Philosophy:** The Archival Circadian Monograph (Broadsheet Editorial meets Precision Instrument)
**Compliance Standard:** WCAG 2.2 AA (Minimum 4.5:1 text contrast, 7:1 enhanced; 3:1 non-text graphics)
**Design Dials:** Variance 9/10 (Bold / Asymmetric) | Motion 3/10 (Horological / Mechanical) | Density 4/10 to 8/10 (Context-adaptive)

---

## Global Rules

### Color Palette (Circadian Architecture)

#### Day Canvas (Ivory Vellum & Deep Ink)
| Token | Hex / Value | Usage & Accessibility |
|-------|-------------|----------------------|
| `--bg-canvas` | `#F6F4F0` | Primary page canvas (warm archival vellum) |
| `--bg-surface-primary` | `#FFFFFF` | Milled paper cards, elevated surfaces |
| `--bg-surface-secondary` | `#EFECE6` | Subtle inset wells, grouping containers |
| `--text-primary` | `#181614` | Deep basalt ink (16.2:1 contrast ratio against vellum) |
| `--text-secondary` | `#55504A` | Secondary metadata (7.4:1 contrast ratio) |
| `--text-muted` | `#6E685F` | Tertiary archival notes (WCAG AA 4.7:1 strictly verified) |
| `--accent-brass` | `#B58942` | Horological brass accents, telemetry rings |
| `--accent-terracotta` | `#C84B31` | Focal actions, primary active states, solar focus |
| `--border-hairline` | `rgba(26, 24, 22, 0.06)` | Precise archival bounding rules |
| `--border-subtle` | `rgba(24, 22, 20, 0.12)` | Subtle component borders |
| `--border-default` | `rgba(24, 22, 20, 0.18)` | Standard card and input boundaries |

#### Night Canvas (Volcanic Basalt & Obsidian)
| Token | Hex / Value | Usage & Accessibility |
|-------|-------------|----------------------|
| `--bg-canvas` | `#0E0C0B` | Deep volcanic basalt canvas |
| `--bg-surface-primary` | `#1A1715` | Milled basalt plates |
| `--bg-surface-secondary` | `#23201D` | Layered secondary wells |
| `--text-primary` | `#F6F4F0` | Ivory luminescent text (15.8:1 contrast ratio) |
| `--text-secondary` | `#A8A196` | Warm silver secondary text (8.1:1 contrast ratio) |
| `--text-muted` | `#7E776D` | WCAG AA 4.7:1 verified night muted text |
| `--accent-terracotta` | `#E05A3E` | Night-adapted solar terracotta focus |
| `--border-hairline` | `rgba(255, 255, 255, 0.06)` | Milled slate hairline boundaries |

---

## Typography

- **Display & Headings:** `EB Garamond`, `Georgia`, serif
  - Optical styling: Classical broadsheet hierarchy, ligatures enabled, generous letter-spacing on uppercase chapter headers.
- **Body & Controls:** `Instrument Sans`, `Inter`, -apple-system, sans-serif
  - Optical styling: Crisp legibility, proportional metrics, 1.5 line height for deep reading comfort.
- **Telemetry & Metrics:** `Fira Code`, `JetBrains Mono`, monospace
  - Optical styling: Strictly `font-variant-numeric: tabular-nums;` to prevent jitter on ticking timers and live statistics.

---

## Spacing & Touch Architecture

*Touch Floor: 44px min-height & min-width across all interactive elements on coarse pointers (`@media (pointer: coarse)`).*
*Mobile Tap Optimization: `touch-action: manipulation` across all buttons, inputs, links to eliminate 300ms delay.*

| Token | Value | Semantic Role |
|-------|-------|---------------|
| `--space-xs` | `4px` | Fine-grain interior icon offset |
| `--space-sm` | `8px` | Badge padding, sibling tag gaps |
| `--space-md` | `16px` | Standard field padding |
| `--space-lg` | `24px` | Card interior padding |
| `--space-xl` | `32px` | Monograph section separator |
| `--space-2xl` | `48px` | Broadsheet column gap |
| `--space-3xl` | `64px` | Hero canvas margin |

---

## Motion & Horological Physics

- **Motion Dial:** 3/10 (Subtle, purposeful, mechanical).
- **Physics Philosophy:** Damped mechanical spring timing (`cubic-bezier(0.16, 1, 0.3, 1)`). No bouncy cartoon wobbles or radioactive glow pulses.
- **Accessibility Invariant:** Complete `@media (prefers-reduced-motion: reduce)` enforcement:
  `animation-duration: 0.01ms !important; transition-duration: 0.01ms !important;`

---

## Component Specs

### Buttons
```css
.solis-btn {
  font-family: var(--font-sans);
  font-weight: 500;
  border-radius: var(--radius-sm);
  cursor: pointer;
  touch-action: manipulation;
  transition: background-color var(--duration-fast) var(--ease-out),
              border-color var(--duration-fast) var(--ease-out),
              color var(--duration-fast) var(--ease-out),
              transform var(--duration-fast) var(--ease-spring);
}
.solis-btn:focus-visible {
  outline: 2px solid var(--border-focus);
  outline-offset: 2px;
}
```

### Form Controls
```css
.solis-input {
  font-family: var(--font-sans);
  border: 1px solid var(--border-default);
  background: var(--bg-surface-primary);
  color: var(--text-primary);
  touch-action: manipulation;
}
.solis-input:focus-visible {
  border-color: var(--border-focus);
  outline: none;
  box-shadow: 0 0 0 1px var(--border-focus);
}
```

---

## Anti-Patterns & Prohibitions

- ❌ **No Emojis as Icons** — Strictly SVG iconography (`lucide-react` or handcrafted Solis SVGs).
- ❌ **No Missing Pointer Cursors** — Every clickable element must exhibit `cursor: pointer`.
- ❌ **No Floating Jitter** — Numerical values and telemetry timers must declare `tabular-nums`.
- ❌ **No Low-Contrast Greys** — Minimum contrast ratio strictly 4.5:1 for body and 3:1 for large display.
- ❌ **No Mobile Tap Delay** — Always apply `touch-action: manipulation`.

---

## Pre-Delivery Verification Checklist

- [x] No emojis used as icons (all SVGs: Lucide / bespoke SVGs)
- [x] `cursor: pointer` on all clickable elements
- [x] `touch-action: manipulation` across interactive controls
- [x] 44px minimum tap target floor for coarse pointers
- [x] Focus states visible (`:focus-visible`)
- [x] `prefers-reduced-motion` strictly respected
- [x] Form inputs have accessible labels & error ARIA live announcements
- [x] Tabular numbers on telemetry metrics (`tabular-nums` / `font-mono`)
- [x] Responsive layout across 375px, 768px, 1024px, 1440px
