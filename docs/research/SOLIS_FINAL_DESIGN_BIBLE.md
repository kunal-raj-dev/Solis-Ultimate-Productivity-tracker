# SOLIS — THE CANONICAL DESIGN BIBLE
## Visual Systems Architecture, Craft Standards, and Engineering Specifications

**Version:** 4.0.0 (Archival Broadsheet & Celestial Instrument)  
**Authority:** Solis Design & Product Architecture  
**Status:** Living Canonical Source of Truth  

---

## 1. BRAND & PHILOSOPHY

### 1.1 What Solis Is
Solis is a quiet, handcrafted personal operating system designed for serious scholars, researchers, and deep-craft builders. It treats intellectual work with the dignity of an archival research library and the mechanical precision of an astronomical chronometer.

### 1.2 What Solis Is NOT
- Solis is **NOT** a gamified task tracker with confetti explosions, cartoon avatars, and streak guilt.
- Solis is **NOT** a generic SaaS dashboard composed of rounded bento cards, pastel pill badges, and purple gradient glows.
- Solis is **NOT** a marketing landing page masquerading as a web application.
- Solis is **NOT** a bloated all-in-one workspace with endless nested dropdown menus.

### 1.3 Core Design Principles
1. **Surface-less Architecture**: Information is organized through hairline grid alignment, spatial ratios, and typographic contrast rather than container boxes inside container boxes.
2. **Tactile Permanence**: Depth is physical and milled—articulated through 1px hairlines, subtle paper grain, and beveled edge highlights—never through synthetic blurred drop-shadows or ambient neon halos.
3. **Typographic Authority**: The interface speaks in three deliberate voices: *Newsreader* for literary contemplation, *Plus Jakarta Sans* for crisp operational utility, and *JetBrains Mono* for tabular telemetry and marginalia.
4. **Restraint Over Decoration**: Accents represent less than 2% of the visual field. Every line, glyph, and transition communicates state, momentum, or epistemic progress.
5. **Instantaneous Interaction Velocity**: Zero gratuitous intro animations. Keyboard-first navigation (`Cmd+K`, `N`, `Space`, `1..4`). Optimistic local mutations with sub-millisecond perceived latency.

---

## 2. COLOR ARCHITECTURE

The Solis color system is built strictly from natural pigments, ink compounds, and mineral grounds across two dedicated modes.

### 2.1 Warm Ivory (Day Flow)
| Token | Hex Value | Semantic Role |
|---|---|---|
| `--bg-canvas` | `#FAF8F5` | Base canvas ground (unbleached archival rag paper) |
| `--bg-surface-primary` | `#FFFFFF` | Primary content canvas |
| `--bg-surface-secondary` | `#F4F1EC` | Tool docks, search wells, and secondary reference rails |
| `--bg-surface-tertiary` | `#EAE6DF` | Recessed input wells and inactive toggle tracks |
| `--border-hairline` | `rgba(26, 24, 22, 0.07)` | Structural grid ruling, tabular row dividers |
| `--border-subtle` | `rgba(26, 24, 22, 0.12)` | Component borders, input frames |
| `--border-strong` | `rgba(26, 24, 22, 0.25)` | Active focus borders, modal perimeters |
| `--text-primary` | `#1A1816` | Deep carbon ink for headlines, titles, and body prose |
| `--text-secondary` | `#635E59` | Iron gall warm grey for subheadings and table headers |
| `--text-muted` | `#9E968F` | Graphite pencil for timestamps, marginalia, and keyboard keys |
| `--accent-primary` | `#C84B31` | Solis Terracotta / Cinnabar (active timers, key commits) |
| `--accent-brass` | `#B58942` | Burnished brass for active horizon badges and streaks |
| `--accent-sage` | `#3E7250` | Academic sage for verified retention and mastery |

### 2.2 Deep Obsidian (Night Resonance)
| Token | Hex Value | Semantic Role |
|---|---|---|
| `--bg-canvas` | `#0E0C0B` | Deep volcanic basalt midnight ground |
| `--bg-surface-primary` | `#141210` | Primary instrument chassis plates |
| `--bg-surface-secondary` | `#1A1715` | Milled tool wells and recessed telemetry bays |
| `--bg-surface-tertiary` | `#221F1D` | Elevated latches and active item states |
| `--border-hairline` | `rgba(255, 255, 255, 0.06)` | Milled panel seams and chamfer edges |
| `--border-subtle` | `rgba(255, 255, 255, 0.10)` | Recessed well boundaries |
| `--border-strong` | `rgba(255, 255, 255, 0.20)` | Active focus rules |
| `--text-primary` | `#E8E2D8` | High-contrast uncoated vellum ivory |
| `--text-secondary` | `#A8A196` | Warm parchment grey for descriptions and metadata |
| `--text-muted` | `#78726A` | Subdued basalt for timestamps, scale ticks, and keys |
| `--accent-primary` | `#E05A3E` | High-contrast dark mode Cinnabar ember |
| `--accent-brass` | `#B58942` | Burnished brass for celestial chronometer hands & indicators |
| `--accent-sage` | `#4D8F63` | Subdued sage for night retention |

---

## 3. TYPOGRAPHY SYSTEM

### 3.1 Font Stack
```css
--font-display: 'Newsreader', Georgia, 'Times New Roman', serif;
--font-interface: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
--font-mono: 'JetBrains Mono', 'SFMono-Regular', Consolas, Menlo, monospace;
```

### 3.2 Scale & Hierarchy
| Level | Font Family | Size | Weight | Line Height | Tracking | Purpose |
|---|---|---|---|---|---|---|
| **Display XL** | Newsreader | `clamp(2.5rem, 5vw, 3.5rem)` | 400 | 1.15 | -0.025em | Sanctuary hero statements, manifesto titles |
| **Display LG** | Newsreader | `2.25rem` (36px) | 400 | 1.2 | -0.02em | Page headers (Dashboard, Syllabus, Focus) |
| **Display MD** | Newsreader | `1.75rem` (28px) | 500 | 1.25 | -0.015em | Major section anchors, Lemma titles |
| **Heading SM** | Plus Jakarta Sans | `1.125rem` (18px) | 600 | 1.35 | -0.01em | Group labels, modal headers, item titles |
| **Body Regular** | Plus Jakarta Sans | `0.9375rem` (15px) | 400 | 1.6 | 0 | Longform task descriptions, guides, notes |
| **Body Small** | Plus Jakarta Sans | `0.8125rem` (13px) | 400 | 1.45 | 0 | Metadata, helper texts, table cell prose |
| **Telemetry LG** | Newsreader | `4.5rem` (72px) | 400 | 1.0 | -0.03em | Focus Room monumental countdown digits |
| **Telemetry MD** | JetBrains Mono | `1.5rem` (24px) | 500 | 1.1 | -0.02em | Key metric numbers, timer readouts |
| **Marginalia SM** | JetBrains Mono | `0.6875rem` (11px) | 500 | 1.3 | +0.06em | Overlines, catalog codes, keycaps, status |

### 3.3 Numeric Rule
All numerical readouts, countdowns, timestamps, table metrics, and retention percentages MUST enforce:
```css
font-variant-numeric: tabular-nums;
font-feature-settings: 'tnum' 1;
```

---

## 4. LAYOUT & GRID ARCHITECTURE

### 4.1 Global Dimensions
- Sidebar Expanded: `260px`
- Sidebar Collapsed Rail: `64px`
- Header Height: `56px`
- Max Content Width: `1360px`
- Outer Gutter (Desktop): `2.5rem` (40px)
- Outer Gutter (Mobile): `1rem` (16px)

### 4.2 The Asymmetrical Broadsheet Model
Standard workspace pages follow an asymmetric layout:
- **Left Index Rail (~260px - 320px)**: Anchors intentions, navigation categories, or course syllabus roadmaps.
- **Center Canvas (Flexible Dominant Bay)**: The primary working stream (tasks ledger, reading canvas, focus dial).
- **Right Marginalia (~260px - 300px)**: Contextual telemetry, retention decay curves, milestone countdowns, and quick notes.

### 4.3 De-Cardification Rules
1. **Rule of Zero Enclosures**: If a list of 5 items needs separation, render 5 ledger rows divided by `1px solid var(--border-hairline)`. Do NOT place each item in a white rounded card with box-shadow.
2. **Rule of Continuous Canvas**: Content sections share the canvas background. Section transitions are established by a top 1px hairline rule accompanied by an uppercase `Marginalia SM` label.
3. **No Card Inside Card**: Any component rendering inside a surface must have `border: none; background: transparent; box-shadow: none;`.

---

## 5. COMPONENT SYSTEM SPECIFICATIONS

### 5.1 Buttons
- **Primary CTA (`.btn-primary`)**: Solid Carbon Ink (`#1A1816` in Day) or Burnished Terracotta (`#C84B31` in Night). Crisp `4px` corner radius. Zero shadow. On hover: shifts background subtly and translates 1px downward (tactile mechanical press).
- **Secondary Action (`.btn-secondary`)**: Transparent background, `1px solid var(--border-subtle)`, text `var(--text-primary)`. Hover: background fills with `var(--bg-surface-secondary)`.
- **Tactile Switch (`.btn-switch`)**: Milled rectangular block with mono label and central indicator pip.

### 5.2 Form Inputs & Search Wells
- **Text Wells**: Background `var(--bg-surface-secondary)`, border `1px solid var(--border-subtle)`, `4px` radius.
- **Focus State**: Border shifts to `var(--accent-primary)` (1.5px solid). **ZERO outer halo or glowing outline**.
- **Underline Input Variant**: Transparent background with a single bottom hairline rule (`border-bottom: 1px solid var(--border-subtle)`), expanding to `var(--text-primary)` on focus.

### 5.3 Archival Tags & Metadata (Replacing Pill Badges)
- **Anti-Pill Constraint**: Never use `rounded-full` or `border-radius: 9999px` for badges.
- **Archival Tag**: Squared or `2px` micro-radius rectangle, padding `2px 6px`, `JetBrains Mono` 11px uppercase, background `var(--bg-surface-secondary)`, border `1px solid var(--border-hairline)`.
- **Status Glyph**: A 4px square or circle marker precedes the label (`● ACTIVE`, `▲ REVIEW`, `■ STABLE`).

### 5.4 Checkboxes & Toggles
- **Checkbox**: Crisp 14px square with `2px` radius and `1px solid var(--text-muted)`. When checked, fills with `var(--text-primary)` and displays a hairline white tick mark.
- **Task Row Checkbox**: Circular 16px ring that smoothly transitions into a filled terracotta circle with checkmark upon completion, triggering a subtle strikethrough animation on the task title.

### 5.5 Modals & Overlays
- Solid opaque surface (`#FFFFFF` in Day, `#161413` in Night) with a crisp `1px solid var(--border-strong)`.
- Scrim background is flat unblurred tint `rgba(14, 12, 11, 0.45)` in Day, `rgba(0, 0, 0, 0.70)` in Night. Zero backdrop-filter blur overdrive.

---

## 6. ICONOGRAPHY & CUSTOM ASSET LANGUAGE

### 6.1 Icon System
- Standard operational icons use `lucide-react` with strict normalized styling:
  - Size: `15px` for secondary UI, `18px` for navigation, `20px` for primary actions.
  - Stroke width: strictly `1.5px` (never heavy 2px or 2.5px).
  - Color: inherits from semantic text token (`var(--text-secondary)` or `var(--text-muted)`).

### 6.2 Bespoke Solis Visual Assets
1. **Celestial Solar Dial (`SolarDial.tsx`)**:
   - Astronomical astrolabe with concentric orbit paths, degree hash marks (0° to 360°), and an animated golden sun node tracking session progress.
2. **Solar Arc Progress (`SolarArc.tsx`)**:
   - Smooth vector arc visualizing daily capacity and momentum.
3. **Scholar Observatory Motif (`ScholarObservatoryIllustration.tsx`)**:
   - Handcrafted architectural line drawing of a quiet academic observatory with telescope and library shelves.
4. **Epistemic Retention Sparklines**:
   - Procedural SVG retention decay curves charting half-life forgetting intervals.

---

## 7. MOTION & INTERACTION LANGUAGE

### 7.1 Motion Timing Constants
- **Instant (Tactile Press):** `60ms`
- **Swift (Hover, Tooltip, Icon):** `120ms`
- **Moderate (Expand, Reveal, Modal):** `180ms`
- **Deliberate (Route transition, Focus mode):** `240ms`
- **Easing Curve:** `cubic-bezier(0.16, 1, 0.3, 1)` (Precision spring deceleration without bouncing).

### 7.2 Forbidden Motion Patterns
- No perpetual bouncing or pulsing icons.
- No floating gradient blobs moving randomly across the screen.
- No parallax scrolling on operational dashboards.
- No multi-second introductory loading splash screens.

### 7.3 Reduced Motion Guarantee
When `prefers-reduced-motion: reduce` is enabled:
- All transforms are set to `none`.
- All animation durations are clamped to `0ms`.
- Transitions reduce to instantaneous opacity toggles.

---

## 8. RESPONSIVE BREAKPOINT SPECIFICATIONS

| Breakpoint | Width Range | Layout Adaptation |
|---|---|---|
| **Mobile Compact** | 320px – 430px | Single-column linear ledger. Sidebar collapses to bottom navigation bar (5 items). FAB is completely eliminated. Header collapses breadcrumbs to current page title. Outer margins: 16px. |
| **Tablet Portrait** | 431px – 768px | Collapsed icon rail sidebar (64px). 2-column layouts where secondary telemetry docks below primary canvas. |
| **Desktop Standard**| 769px – 1280px | Full sidebar (260px). 2-column or 3-column split view (Index, Main Canvas, Marginalia Drawer). |
| **Broadsheet Widescreen**| 1281px – 1920px+ | Unconstrained 3-bay broadsheet with generous 40px outer archival borders. Maximum readability line-length capped at 72ch. |

---

## 9. ACCESSIBILITY & PERFORMANCE STANDARDS

- **Contrast Floor**: All text tokens must satisfy WCAG AA (4.5:1 for body copy, 3:1 for large display titles and active controls).
- **Keyboard Trapping & Navigation**: Every interactive control must be reachable via `Tab` and show a distinct `2px solid var(--border-focus)` focus ring with `2px` offset.
- **Screen Reader Support**: All custom icon buttons must provide explicit `aria-label` or `.sr-only` descriptions.
- **Performance Budget**:
  - Zero heavy 3D WebGL or Canvas runtimes.
  - Pure SVG vector graphics and CSS hardware-accelerated transforms (`transform`, `opacity`).
  - Bundle size maintained with route-level lazy loading.

---

## 10. ANTI-PATTERNS (THINGS SOLIS MUST NEVER DO)

1. **NEVER** wrap a list item in a standalone card container inside another card container.
2. **NEVER** render a fully rounded pill badge (`rounded-full`) for metadata or tags.
3. **NEVER** place a bright floating circular action button (FAB) in the corner of the workspace.
4. **NEVER** use neon gradients, purple glowing shadows, or high-saturation decorative blobs.
5. **NEVER** use generic 4-card metric grids with generic icons on dashboards.
6. **NEVER** truncate text headers or ascenders through careless fixed-header height calculations.
7. **NEVER** add decorative motion that delays the user from clicking or typing.
8. **NEVER** break working Supabase database calls, auth persistence, or test suites for visual purity.

*This Design Bible governs all frontend engineering and visual refactoring across the Solis codebase.*
