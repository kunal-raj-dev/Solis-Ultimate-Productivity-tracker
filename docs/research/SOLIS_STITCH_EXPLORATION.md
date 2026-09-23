# Solis — Stitch MCP Design System & Layout Synthesis

**Date**: September 24, 2026  
**Tools**: Stitch MCP (`list_projects`, `get_project`, `create_design_system`, `generate_screen_from_text`)

---

## 1. Stitch Project Analysis & Comparative Evaluation

Through Stitch MCP, three distinct design projects and theme configurations were inspected:

### Project A: `projects/3289206954779557551` ("Solis Design Concepts — Anti-AI-Slop Redesign")
- **Theme Archetype**: Editorial Research Desk
- **Typography**: Newsreader (Headline) + Plus Jakarta Sans (Body & Labels)
- **Palette**: Warm Ivory (`#FAF8F5`), Obsidian Charcoal (`#1B1C1A`), Terracotta Accent (`#C84B31`)
- **Key Mechanics**:
  - Surface-less architecture with subtle hairline grid alignment.
  - Zero drop shadows; 1px solid `rgba(24, 22, 20, 0.06)` dividers.
  - Micro-radius geometry (`4px` / `6px`), strict ban on `rounded-full` pill badges.
- **Strength**: High legibility, dignified academic serenity, excellent tactile feel.

### Project B: `projects/14684188427409364226` ("Solis Academic & Productivity OS 3.0")
- **Theme Archetype**: Field Notebook Operating System
- **Typography**: Newsreader (Display) + Inter (Body) + JetBrains Mono (Labels/Data)
- **Palette**: Alabaster Ground (`#FFF8F4`), Iron Gall Secondary (`#78583E`), Living Coral Needle (`#FF6347`)
- **Key Mechanics**:
  - Open ledger format with asymmetric 12-column layout (3-col Index, 6-col Work Canvas, 3-col Marginalia).
  - Explicit 4px/8px geometric progression with generous 2.5rem desktop margins.
  - Coral focus needle indicator pinned to active working states.
- **Strength**: The addition of JetBrains Mono brings analytical rigor and mathematical clarity to timers, retention curves, and syllabus metrics.

### Project C: `projects/12658061149486103178` ("The High-Contrast Architect")
- **Theme Archetype**: Neo-Brutalism
- **Typography**: Bebas Neue + Space Mono
- **Palette**: Pure Black (`#000000`) + Acid Green (`#CCFF00`)
- **Verdict**: Too harsh and aggressive for long study hours; rejected in favor of the warm erudition of Projects A and B.

---

## 2. Definitive Synthesis: "The Circadian Monograph"

By combining the strengths of Stitch Projects A and B:
1. **Typography**:
   - **Display / Editorial**: `Newsreader`, weights 400 and 400 italic.
   - **Interface / Reading**: `Plus Jakarta Sans`, weights 400, 500, 600.
   - **Analytical / Chrono**: `JetBrains Mono`, weights 400, 500, tabular numbers.
2. **Surfaces & Borders**:
   - Flat planes without faux-3D elevation or blur halos.
   - Hairline boundary system with 4px geometric corner radius.
3. **Color Tokens**:
   - Obsidian Basalt base (`#0E0C0B`) in dark mode; Warm Alabaster Parchment (`#FAF8F5`) in light mode.
   - Solar Cinnabar / Living Coral (`#E65A41` / `#C84B31`) restricted to 2% operational accent.
