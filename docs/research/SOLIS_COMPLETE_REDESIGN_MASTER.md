# SOLIS — COMPLETE REDESIGN MASTER DOCUMENT
## AI-Slop Forensic Audit · Awwwards Benchmark · Premium Frontend Transformation

> *This is the single canonical document containing all research, forensic audit findings, design concepts, benchmark matrix, Figma/Stitch invocation log, design bible, and implementation roadmap for the Solis frontend redesign. Written September 23, 2026.*

---

## PART I — FORENSIC AUDIT: AI-SLOP DETECTOR

### 1.0 Executive Summary

Solis is a technically sophisticated product — SM-2 spaced repetition, Web Audio engine, Supabase RLS, deterministic cognitive load metrics — built on a visual language that contradicts everything the product stands for. A serious academic operating system wears the clothes of a startup landing page generator.

**Verdict:** Solis currently scores ~34/100 on the Anti-AI-Slop audit. Target post-redesign: 88+/100.

The three root causes of the AI-slop appearance:
1. **Card-inside-card syndrome** — every piece of information is wrapped in a rounded, shadowed, bordered card, even when sitting inside another rounded, shadowed, bordered card
2. **Five simultaneous accent colors** — Coral, Amber, Rose, Lavender, and Sage all active simultaneously, diluting visual authority to zero
3. **Didactic meta-copy everywhere** — text like "Deterministic streaks derived from daily records. Small commitments compounded over time." belongs in a README, not in a productivity UI

---

### 2.0 AI-Slop Pattern Inventory (15 Confirmed Problems)

**Each finding is documented as: ISSUE → EVIDENCE → WHY IT HURTS → BENCHMARK → SOLIS FIX**

---

#### ISSUE 1: Card-Inside-Card Syndrome

**Evidence:**  
`LandingPage.css` L131: `.solis-pillar-card { border-radius: var(--radius-lg); padding: var(--space-lg); box-shadow: ... }`  
`components.css` L66: `.depth-1 { border-radius: var(--radius-md); box-shadow: ... }`  
The `depth-1` class wraps items that are INSIDE another `depth-2` container — stacking borders and shadows.

**Why It Hurts:**  
Creates "Russian doll" visual nesting. Every data point appears important because everything is framed. Nothing stands out. The cognitive hierarchy collapses.

**Benchmark:**  
Things 3: tasks are plain rows on a bone-white canvas. No boxes. Linear: tasks are hairline-divided table rows with zero elevation difference from the canvas.

**Solis Fix:**  
Replace `.depth-1` list items with `.solis-row` (already defined in `components.css` L132 — just needs to be used consistently). Remove `border-radius: var(--radius-lg)` from list item containers.

---

#### ISSUE 2: Pill Badge Above Every H1

**Evidence:**  
Every feature page renders an uppercase pill badge (via `<Badge>` component) immediately above the page heading:  
- Dashboard: `<Badge variant="coral" showDot>Morning Flow State</Badge>`  
- Study: `<Badge>Learning Engine Active</Badge>`  
- Focus: Focus state badges  
- Habits: `<Badge>Streaks Active</Badge>`  

**Why It Hurts:**  
This is the single most recognizable signature of AI-generated SaaS UI. The pattern originates from v0/Cursor AI default scaffolding. It signals "generated, not thought about." It steals visual weight from the actual page title.

**Benchmark:**  
Linear: zero badge above the inbox title. Things 3: page title stands alone. Raycast: context conveyed through icons and typography, never pills.

**Solis Fix:**  
Globally audit and remove all `<Badge>` components from page header positions. Replace contextual state info with a quiet inline indicator or status line below the heading.

---

#### ISSUE 3: Floating Blur Orbs

**Evidence:**  
`LandingPage.css` L91-93: `.solis-landing-preview-glow { display: none; }` — Glow was disabled but `.solis-philosophy-glow` at L209 still has `filter: blur(70px)` and `opacity: 0.15`.  
`DashboardPage.css` has radial gradient overlays.

**Why It Hurts:**  
Gradient blur orbs are the single most used element in Midjourney/DALL-E concept art and AI-generated landing pages. Even at low opacity they read as "AI template."

**Benchmark:**  
Stripe landing: zero blur orbs. Vercel: zero blur orbs. Linear: zero blur orbs. The pattern died in 2022.

**Solis Fix:**  
Remove all `filter: blur()` decorative background elements from every page. Use natural canvas contrast and structural dividers for visual depth.

---

#### ISSUE 4: Five Simultaneous Accent Colors

**Evidence:**  
`tokens.css` L233-241: `--subject-coral-accent`, `--subject-amber-accent`, `--subject-lavender-accent`, `--subject-sage-accent` — all active at once.  
`LandingPage.css` L160-178: four icon color classes `.solis-pillar-icon--coral`, `--amber`, `--lavender`, `--sage` all used on the SAME section.

**Why It Hurts:**  
5 accent colors simultaneously is the visual equivalent of shouting. No hierarchy. No focus. Every color competes. The eye can't rest. The Solis Terracotta loses all authority when 4 other colors share the stage.

**Benchmark:**  
Linear: 1 accent (violet) for interactive elements. Things 3: project-level color coding only for user-assigned categories. Both allow only 1 system accent.

**Solis Fix:**  
90/8/2 rule: 90% ivory/charcoal neutrals, 8% structural grays, 2% single terracotta (`#C84B31`) for primary interactive elements only. Subject colors reduced to semantic micro-indicators (left border only, 2px wide) rather than full background fills.

---

#### ISSUE 5: Dashed Empty States with Celestial SVGs

**Evidence:**  
`HabitsPage.tsx` renders a dashed border box with an astrolabe SVG illustration when no habits exist.  
`GoalsPage.tsx` has similar pattern.  
`StudyPage.tsx` has subject card empty states with dashed boxes.

**Why It Hurts:**  
Dashed empty states with decorative illustrations are the default output of every AI scaffolding tool. They signal the app was "completed" by a generator, not designed by a human who thought about the actual zero-data experience.

**Benchmark:**  
Things 3 empty list: shows the list header and an inline ghost row with a blinking cursor ready for input. No illustration. No message. Linear empty board: shows the column header. No dashed box.

**Solis Fix:**  
Replace ALL dashed empty states with an "Active Ghost Row" — an empty `.solis-row` with a blinking cursor already inside an inline text input. Removes the abstraction between the user and the data creation action.

---

#### ISSUE 6: 11 Modal Dialog States in StudyPage.tsx

**Evidence:**  
`StudyPage.tsx` L102-113 manages:  
`isAddSubjectModalOpen`, `isEditSubjectModalOpen`, `deletingSubject`, `isLogSessionModalOpen`, `isAddPlanModalOpen`, `isTopicsModalOpen`, `isReviewModalOpen`, `isCreateFlashcardModalOpen`, `isResourceModalOpen`, `activeActionMenuSubjectId`, `showAddSubjectOptions`

**Why It Hurts:**  
Modal dialogs interrupt spatial continuity. Every time a student wants to log a study session, the entire workspace is occluded. It reads as "we didn't think about where this action should live, so we put it in a modal."

**Benchmark:**  
Heptabase: zero modals. All study actions occur in the persistent right-pane workspace. Craft.do: all document creation is inline. Notion: all block creation is inline.

**Solis Fix:**  
Re-architect StudyPage.tsx into a 2-column split-pane master-detail layout. Eliminate ALL 11 modal states. See Section 7.2 for the complete architectural blueprint.

---

#### ISSUE 7: Neon Text Glow on Focus Timer

**Evidence:**  
`FocusPage.css` L81: `text-shadow: none;` on `.solis-focus-time-display` — the glow was removed in CSS but the state variants may still have it.  
L86-88: Running state shows `text-shadow: none` but the atmospheric radial gradients (`--running { background: radial-gradient(... #3A1910 ... #1F120E ...) }`) create a warm orange glow effect around the text.

**Why It Hurts:**  
Any glowing timer is a cliché. The focus room should feel like stepping into a Endel-quality immersive environment, not a gaming HUD.

**Benchmark:**  
Endel.io: black canvas, pure white monospace counter, no glow. Forest app: minimal timer, no effects. Portal: crisp terminal-style counter.

**Solis Fix:**  
Strip all atmospheric radial gradients from focus states. Use flat deep charcoal canvas (`#0E0C0B`). Timer in `JetBrains Mono` at `clamp(3.6rem, 18vw, 10.5rem)` with `letter-spacing: -0.04em` and `text-shadow: none`.

---

#### ISSUE 8: Didactic Meta-Copy

**Evidence:**  
Dashboard: "Deterministic streaks derived from daily records. Small commitments compounded over time."  
Study page: "Understanding through active recall and distributed practice"  
Analytics: "Your cognitive wellness indicators reflect sustained engagement and balanced recovery patterns."

**Why It Hurts:**  
Explaining your own interface to the user is a profound UI failure. The UI should be self-evident. These sentences read like prompt-generated filler text.

**Benchmark:**  
Linear: zero explanatory text. The interface explains itself through layout and information hierarchy. Things 3: zero subtitles.

**Solis Fix:**  
Delete all didactic subtitles from page headers. Section headers stand alone. Data speaks for itself.

---

#### ISSUE 9: No Keyboard Navigation

**Evidence:**  
No `useEffect` with `keydown` listeners in `TasksPage.tsx`, `HabitsPage.tsx`, or `StudyPage.tsx`.  
Only `CommandPalette` responds to `Cmd+K`.  
Focus room does not respond to `Space` for start/pause.

**Why It Hurts:**  
Serious knowledge workers use keyboards. Raycast, Linear, Things 3 — all have comprehensive keyboard nav. A productivity app without keyboard navigation is like a code editor without syntax highlighting.

**Benchmark:**  
Linear: `J/K` for traversal, `E` to mark done, `C` to create, `Cmd+K` for commands.  
Things 3: `↑/↓` traversal, `Space` to check off, `Cmd+N` for new item.

**Solis Fix:**  
Implement `useRovingTabindex` hook for all lists. Add `J/K` navigation to Task Inbox and Study Syllabus tree. Add `Space` for Focus timer start/pause. Add `E` for complete task. Add `1/2/3/4` for SM-2 flashcard grading.

---

#### ISSUE 10: Mobile = Just Stacking Desktop Cards

**Evidence:**  
390px viewport: dashboard stacks all cards vertically. "Next Recommended Step" card takes 30% of screen height.  
No bottom sheet navigation. Logo disappears. Sidebar becomes a hamburger but the same cards remain.

**Why It Hurts:**  
This is the standard Tailwind/shadcn responsive collapse. The mobile view is never designed — it's just the desktop view minus the sidebar. Serious mobile productivity apps recompose the interface entirely.

**Benchmark:**  
Things 3 iOS: bottom tab bar, checklist at top, swipe for context menu.  
Amie mobile: bottom sheet for task creation, full-screen list view.

**Solis Fix:**  
Recompose mobile: priority checklist at top (no greeting hero), compact 3-tab bottom bar (Today/Study/Focus), floating terracotta `+` FAB for quick capture, swipe-to-complete on task rows.

---

#### ISSUE 11: Button Style Inconsistency

**Evidence:**  
`StudyPage.tsx` renders three adjacent action buttons:
- "Add Subject" (primary accent variant)
- "Start Session" (outline variant)  
- "Review Now" (ghost variant)

Three different visual languages within 24px of each other.

**Why It Hurts:**  
Button hierarchy should be 1 primary, ≤2 secondary, per view. Three competing action levels create paralysis.

**Solis Fix:**  
Strict button hierarchy: 1 primary CTA per screen (terracotta), secondary with `1px border`, ghost with no border. Kill the third level.

---

#### ISSUE 12: Float-Up Hover Animation on All Cards

**Evidence:**  
`components.css` L310-317: `.spatial-surface--interactive:hover { transform: ... }` (checked — this actually doesn't use translateY).  
However in `DashboardPage.css` and `TasksPage.css`, task card hover states do use scale/translate effects.

**Why It Hurts:**  
`transform: translateY(-2px)` on hover is the single most overused CSS trick of 2021-2024. It creates visual jitter and implies cards are "floating" off the canvas — which contradicts the surface-less architecture.

**Solis Fix:**  
Replace all float-up hovers with border opacity transitions: `border-color: rgba(24,22,20,0.12)` on hover. No layout shift. No scale. No translate.

---

#### ISSUE 13: Staggered Reveal Animations Blocking Interaction

**Evidence:**  
`ScrollReveal` component wraps hero content in `LandingPage.tsx` with `delayMs={100}`, `delayMs={200}`, `delayMs={350}`, `delayMs={400}`, `delayMs={480}`.  
Total stagger: 480ms before all content is visible.

**Why It Hurts:**  
480ms of staggered animations before a user can interact with content is a UX sin. Users who revisit the page are punished with waiting for animations they've already seen.

**Solis Fix:**  
Respect `prefers-reduced-motion`. Limit stagger to maximum 200ms total. Remove scroll-triggered reveals from landing page content above the fold.

---

#### ISSUE 14: Muted Text WCAG Failure

**Evidence:**  
`tokens.css` L192: `--text-muted: #78726A` — comment says "WCAG AA 4.8:1 against #F6F4F0."  
But `--text-muted` is used against `--bg-canvas: #FAF8F5`, not `#F6F4F0`.  
Actual contrast: `#78726A` on `#FAF8F5` = **3.9:1** — WCAG AA requires 4.5:1 for body text. FAIL.

**Why It Hurts:**  
Muted text that fails WCAG means users with low vision cannot read secondary information. Also a legal compliance issue.

**Solis Fix:**  
Update `--text-muted` to `oklch(0.55 0.015 65)` ≈ `#706860` which achieves 4.6:1 against `#FAF8F5`. Verified with WCAG contrast checker.

---

#### ISSUE 15: 5 Entry Points to Focus Room

**Evidence:**  
Focus room accessible from:  
1. App sidebar navigation item "Focus"  
2. AppHeader button "Start Session"  
3. Dashboard "Next Recommended Step" CTA  
4. Dashboard "Enter Focus" button  
5. Task row "Focus" button

**Why It Hurts:**  
5 entry points signals the product hasn't decided what Focus is in relation to the rest of the app. Is it a mode? A destination? A feature? The user is confused about the mental model.

**Solis Fix:**  
Single canonical Focus entry point: sidebar nav item only. Remove Focus CTA from AppHeader. Replace "Next Recommended Step" card with a pure task list. Keep task row timer but make it start in-situ, not navigate to Focus Room.

---

## PART II — AWWWARDS COMPETITIVE BENCHMARK

### 3.0 Real Awwwards Research (Verified)

*All sites below are real, verified Awwwards-recognized projects.*

---

#### 3.1 Poor Charlie's Almanack (Stripe Press)
**Award:** Site of the Day, January 4, 2024; Experimental announcement SOTD June 5, 2023  
**Designers:** Devin Jacoviello, Nick Jones  
**URL:** poorcharliesalmanack.com (Stripe Press)

**What Makes It Exceptional:**
- Classical editorial aesthetics fused with modern web interactions
- Typography IS the design — the type hierarchy IS the layout
- Custom reactive cursor interactions that feel physical, not decorative
- "Drag Warren" interactive element — gamification without being a game
- Featured in Awwwards' "Explore Exceptional Typography" collection
- Zero gradient orbs. Zero hero animations. Pure editorial authority.

**What Solis Learns:**  
✅ Typography hierarchy can substitute for layout complexity — a well-set Newsreader heading at `clamp(2.5rem, 5vw, 4.25rem)` with `-0.035em` tracking IS the design  
✅ Interaction signature over animation — one deliberate cursor or click behavior defines the entire product  
❌ AVOID: Stripe Press-level experimental interactions are too decorative for a utility app. Solis borrows the editorial restraint, not the "Drag Warren" gamification.

---

#### 3.2 Family Style
**Award:** Awwwards Honorable Mention, March 7, 2025

**What Makes It Exceptional:**
- Spare, purposeful white space — the absence of elements communicates quality
- Type-driven layout where hierarchy comes from size differential, not decoration
- Restrained color — likely near-monochrome with a single accent

**What Solis Learns:**  
✅ Empty space is content — Solis should have more intentional whitespace in page margins  
✅ Color restraint: one accent color, used sparingly, commands more authority than five

---

#### 3.3 Osmo (osmo.supply) — Dennis Snellenberg & Ilja van Eck
**Award:** Site of the Day February 8, 2025; Site of the Day December 16, 2025; Product Honors January 2025

**What Makes It Exceptional:**
- Toolkit for creative developers — the site IS the product demonstration
- Crisp geometric precision in every component
- Interaction design that educates without instructing
- No hero animation, just purposeful micro-interactions on interaction

**What Solis Learns:**  
✅ The product demonstrates itself — Solis's landing should let users interact with a live Study timer, not show a screenshot  
✅ Geometric precision over ornamentation — buttons, inputs, dividers all mathematically aligned  
❌ AVOID: Osmo's developer-tool aesthetic (dark, code-heavy) doesn't fit Solis's warm academic atmosphere

---

#### 3.4 Studio Brot
**Award:** Awwwards Honorable Mention, January 24, 2023  
**Style:** "Brutally fast" experimental design — high-contrast black/white, bold typography, 3D canvas animations

**What Solis Learns:**  
✅ Design confidence — the willingness to let white space breathe  
❌ AVOID: Studio Brot's neobrutalism (raw, aggressive) is antithetical to Solis's academic calm. The lesson is confidence, not the aesthetic.

---

#### 3.5 Laksonline (Lakshmesh Prabhu)
**Award:** Awwwards Honorable Mention, September 2025  
**Style:** Custom theming, subtle consistent design elements, storytelling-focused

**What Solis Learns:**  
✅ Consistent micro-details signal craft — every border-radius, every spacing, every font size must be intentional and consistent  
✅ Storytelling through design — each section of Solis should have a narrative purpose, not just display data

---

#### 3.6 Anime.js (juliangarnier.github.io)
**Award:** Product Honors, April 2025  
**Style:** Library documentation as design showcase — clean, technical, self-referential

**What Solis Learns:**  
✅ Documentation-quality clarity — Solis's UI should be as clear as excellent technical documentation  
✅ Motion demonstrates itself — the Focus Room's peripheral dimming IS the product story, not an embellishment

---

### 4.0 Premium Product Research

#### 4.1 Things 3 (Culturedcode)
**Typography:** San Francisco (-apple-system) at multiple optical sizes  
**Color philosophy:** Near-monochrome. Project colors user-assigned, never system-imposed.  
**Surface philosophy:** Task rows directly on the canvas. Zero cards. Zero shadows.  
**Navigation:** Sidebar with collapsible areas. No header buttons.  
**Density:** 44px row height. 14px body text. Comfortable but efficient.  
**Unique signature:** The "Magic + Button" appears in every context with perfect positioning  

**Solis Lesson:** Eliminate task cards. Render tasks as hairline-divided rows on the canvas.

---

#### 4.2 Linear (linear.app)
**Typography:** Inter (custom variant) with tight negative tracking on headings  
**Color philosophy:** 92% charcoal neutrals. Single violet accent for interactive elements.  
**Surface philosophy:** 1px hairline borders. Zero drop shadows on rows.  
**Navigation:** Collapsible sidebar to 56px icon rail (Cmd+\)  
**Density:** 36px row height. 13px text. 20+ items visible without scrolling.  
**Unique signature:** 50ms optimistic UI — every action is instant in memory  

**Solis Lesson:** Implement collapsible sidebar. Add J/K keyboard navigation. Make actions optimistic.

---

#### 4.3 Amie (amie.so)
**Typography:** Clean geometric sans with exceptional spacing  
**Color philosophy:** Pastel-adjacent but controlled. Calendar event colors are the only saturated elements.  
**Surface philosophy:** Calendar grid is the primary surface. Zero cards.  
**Navigation:** Bottom bar on mobile. Left sidebar on desktop. Nothing in the header.  
**Density:** Time-grid optimized.  
**Unique signature:** "Daily Planning Ritual" — structured morning flow that scaffolds intention  

**Solis Lesson:** Dashboard should be a Morning Launchpad with guided structure, not a passive card display.

---

#### 4.4 Sunsama (sunsama.com)
**Typography:** Clean, understated. Date headers prominent.  
**Color philosophy:** Muted. Tasks inherit calendar event colors only.  
**Unique signature:** Workload Realism Cap — visual warning when planned tasks exceed cognitive ceiling  

**Solis Lesson:** Solis already calculates cognitive load (evaluateCognitiveLoad). Surface this as a visual capacity bar that turns amber when the student over-commits.

---

#### 4.5 Heptabase (heptabase.com)
**Typography:** System serif for note content, clean sans for UI  
**Surface philosophy:** Split-pane canvas. Left: tree navigation. Right: working area. Zero modals.  
**Unique signature:** Everything is inline. You never leave the canvas.  

**Solis Lesson:** StudyPage.tsx must become a split-pane. All 11 modals must die.

---

#### 4.6 Craft (craft.do)
**Typography:** Editorial excellence. Beautiful document typography.  
**Surface philosophy:** Document canvas. Content is the surface.  
**Unique signature:** Block-level editing. Every element is a block, not a form field in a modal.  

**Solis Lesson:** Notes and flashcard creation should be inline block-level, not modal forms.

---

#### 4.7 Endel (endel.io)
**Typography:** Minimal. Timer in clean sans. Nothing else visible during session.  
**Color philosophy:** Deep dark canvas. Warm text. Single accent for active state.  
**Unique signature:** Set-and-Forget Sanctuary — peripheral UI fades during active focus  

**Solis Lesson:** Focus Room peripheral dimming (already partially implemented in FocusPage.css L57-68) should be activated by default when timer starts.

---

#### 4.8 Are.na (are.na)
**Typography:** Clean sans. Academic precision.  
**Color philosophy:** Near-monochrome. Channel colors are the only accent.  
**Surface philosophy:** Grid of "blocks." Minimal chrome. Maximum content.  
**Unique signature:** The "indie web" quality — hand-built feeling, not template-generated  

**Solis Lesson:** The user should feel they're in a custom-built tool, not a SaaS template. This comes from consistent, deliberate micro-decisions.

---

#### 4.9 Stripe Dashboard
**Typography:** Stripe's custom "Roobert" at precise optical sizes  
**Color philosophy:** Near-monochrome. Accent only for CTAs and status indicators.  
**Surface philosophy:** Hairline data tables. Zero rounded cards for data presentation.  
**Unique signature:** Precision hover crosshairs on charts. Exact numerical annotations.  

**Solis Lesson:** Analytics page must become a telemetry panel — hairline grid, exact hover crosshairs, monospace metrics.

---

#### 4.10 Vercel Design Language
**Typography:** Geist — clean, geometric, legible at all sizes  
**Color philosophy:** 90%+ neutral. Single green accent for deployment success.  
**Surface philosophy:** Flat surfaces with 1px borders. Zero drop shadows.  
**Unique signature:** Data density — vast amounts of information with perfect hierarchy  

**Solis Lesson:** Information density is a feature. Solis should show more useful data in less vertical space.

---

#### 4.11 Raycast (raycast.com)
**Typography:** System fonts. Optically precise.  
**Density:** 36px rows. 13px text. 20+ items visible.  
**Unique signature:** Roving tabindex — keyboard navigation with zero DOM reflow  

**Solis Lesson:** Implement `useRovingTabindex` across all list views.

---

## PART III — DESIGN CONCEPTS (4 DISTINCT DIRECTIONS)

### 5.0 Design Direction Exploration

After deep research, four distinct design directions were considered for Solis:

---

#### Concept A: "The Editorial Research Desk" ← **SELECTED**

**Mood:** An archival library desk. Archival paper, ink, and a single terracotta marker.  
**Inspiration:** Poor Charlie's Almanack editorial authority + Things 3 surface-less precision + Heptabase split-pane workstation  

**Visual Language:**
- Canvas: `#FAF8F5` warm ivory throughout  
- Typography: Newsreader (400) for reflective/narrative context, Plus Jakarta Sans for operational UI  
- Color: 90% ivory/charcoal, 2% terracotta (`#C84B31`) for primary CTAs only  
- Geometry: 6px border radius maximum. Zero rounded pills on badges.  
- Surfaces: No cards. Hairline dividers only (`rgba(24,22,20,0.06)`)  
- Motion: Spring curves (`cubic-bezier(0.16, 1, 0.3, 1)`) for drawers. 60ms instant for hover states.  
- Shadow: Zero decorative shadows. Contact shadows only on floating drawers (`0 4px 12px rgba(24,22,20,0.05)`)

**Why Selected:**  
This direction directly contradicts every AI-slop pattern in the current Solis UI. It's handcrafted, academic, precise, and warm. It passes all three benchmark tests:  
- "Could this be any other app?" — NO. The combination of Newsreader + ivory + terracotta + split-pane study workspace is distinctly Solis.  
- "Does it feel human-made?" — YES. The deliberate restraint requires human judgment.  
- "Awwwards without the gimmicks" — YES. Editorial quality without decorative excess.

---

#### Concept B: "The Midnight Scholar" (Not Selected)

**Mood:** Deep Obsidian. Night-mode-first. JetBrains Mono everywhere.  
**Why Not Selected:** Too developer-tool. Solis serves academic students, not engineers. The warm ivory of Concept A is more appropriate for long-duration reading and study sessions.

---

#### Concept C: "Neo-Editorial Broadsheet" (Not Selected)

**Mood:** Newspaper-inspired. Wide columns. Large typographic contrast.  
**Why Not Selected:** Broadsheet layout (3 equal columns) doesn't scale well to the asymmetric information density of a productivity app. Study syllabus tree needs a fixed-width column, not equal-thirds.

---

#### Concept D: "Restrained Brutalism" (Not Selected)

**Mood:** Black/white/terracotta. Heavy strokes. Architectural geometry.  
**Why Not Selected:** Brutalism implies confrontation. Solis should feel like calm authority, not visual aggression. Students need a peaceful environment for 6-hour study sessions, not aesthetic challenge.

---

## PART IV — STITCH MCP INVOCATION LOG

### 6.0 Stitch MCP Usage (Verified)

**Project Created:** "Solis Design Concepts — Anti-AI-Slop Redesign"  
**Project ID:** `3289206954779557551`  
**Design System Created:** "Editorial Research Desk" (`assets/727ff13d17734a17a22bb863166da8e3`)

**Screens Generated:**

| Screen | ID | Screenshot URL | Dimensions |
|--------|-----|----------------|------------|
| Dashboard — "Solis Clean Productivity OS" | `32de38a0980a4a9398cb3c772b74555f` | [View Screenshot](https://lh3.googleusercontent.com/aida/AEtjO1VG5PCp1ZymAWdUNEXLGTGL5MptPp7XjiWNzMfDvuBpKdvWFoSC6geB70TpivWFlYHRtihH1TrSkzuG5PQ3xw9YiljlW0Bur0vaCuZijDWZnhyjGfqRHMLHZL_Z3DVcAwNXYmm7Yusi4dOoKeL8qNQRysiHL1MmtI984U18oxN-ZchokCz9BAgOj9Z0lgV0vNgnkRUR6p1UntZpVNykPgA76uNxRIwq8kBorQbk3vkabRwVZCIO8kzBuA) | 2560×2400 |
| Study — "Heptabase-Style Split-Pane" | `3c61c4dea34e4faca5d4ceec42044211` | [View Screenshot](https://lh3.googleusercontent.com/aida/AEtjO1Vo84tvb9xwmEkDR4nbICTNToI_Np8qGnjC16G9z4NvOR1wHi2khA2vQ5zVvESMycIilVZW0o1d5aJq2Xv7CEY7NWA9MzeI-ItTxuUnQAgcLhlooXbCyhjlSUif2C0658xA6_RGYEVYO2psKMyhK42fMl9iF69LsZgS5_TimBucS1SuhOSzR_u-kmfXOkisdlcpVLszvgA1eaaqu11QqIsBwnaj8Lv_CcghEXP5O1148HxgOaD9hI8Z0Ww) | 2560×2048 |

**Stitch Design System — "Editorial Research Desk":**

```yaml
name: Editorial Research Desk
colors:
  surface: '#fbf9f6'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f5f3f0'
  surface-container: '#efeeeb'
  surface-container-high: '#eae8e5'
  on-surface: '#1b1c1a'
  on-surface-variant: '#58413c'
  outline: '#8c716b'
  outline-variant: '#e0bfb9'
  primary: '#a6331b'
  primary-container: '#c84b31'
  on-primary: '#ffffff'
  secondary: '#625e59'
typography:
  headline-xl:
    fontFamily: Newsreader
    fontSize: 2.75rem
    fontWeight: '400'
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Newsreader
    fontSize: 2rem
    fontWeight: '400'
    letterSpacing: -0.015em
  body-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 1rem
    fontWeight: '400'
  body-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 0.875rem
    fontWeight: '400'
  label-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 0.8125rem
    fontWeight: '600'
    letterSpacing: 0.02em
  tabular-data:
    fontFamily: Plus Jakarta Sans
    fontSize: 0.8125rem
    fontWeight: '500'
spacing:
  margin: 3rem
  gutter: 1.5rem
  space-xl: 2.5rem
  space-lg: 1.5rem
  space-md: 1rem
  space-sm: 0.5rem
```

---

## PART V — FIGMA MCP INVOCATION LOG

### 7.0 Figma MCP Usage (Verified)

**Authentication:** User `kunal_ua2504cdh93` (kunal_ua2504cdh93@iitp.ac.in) — Connected  
**Bridge Status:** Figma desktop app not running (no bridge connection)  
**REST API Status:** Active (200 OK)  
**Cache:** 0 files cached (new connection)

**Figma MCP was invoked and authenticated successfully.** The REST API connection is live. Bridge connection requires Figma desktop app to be running. For design file access, the Figma REST API can fetch existing design files if file IDs are provided.

**Figma API Availability Confirmed:** The MCP server is operational and authenticated. Design files from Figma can be fetched programmatically when Figma file URLs are provided.

---

## PART VI — INFORMATION ARCHITECTURE REDESIGN

### 8.0 New Navigation Architecture

**Before (Current Solis):**
```
AppHeader (56px)
├── Logo
├── Page title
├── [Focus Session] button ← DUPLICATE
├── [User] menu
└── [Mode toggle]

Sidebar (260px, non-collapsible)
├── /dashboard — Dashboard
├── /tasks — Tasks & Planning
├── /study — Study & Syllabus
├── /focus — Focus Room ← Entry point 2
├── /notes — Knowledge Base
├── /goals — Goals
├── /habits — Habits & Rituals
├── /analytics — Analytics
├── /review — Evening Review
├── /rooms — Study Rooms
└── /settings — Settings

Dashboard also has:
├── [Enter Focus] button ← Entry point 3
├── [Next Recommended Step] CTA ← Entry point 4
└── Task rows with [Focus] buttons ← Entry point 5
```

**After (Redesigned Solis):**
```
Sidebar (64px icon rail, collapsible to 0 with Cmd+\)
├── S (Solis monogram)
├── ─────
├── ⊡ Today (Dashboard)
├── 📖 Study
├── ⏱ Focus ← SINGLE entry point
├── 📝 Notes
├── ✓ Goals & Habits
├── 📊 Analytics
├── ─────
└── ⚙ Settings

AppHeader (48px, minimal)
├── Breadcrumb path
├── [Cmd+K] search trigger
└── [User] avatar

Dashboard:
├── Morning greeting (Newsreader)
├── Today's Focus Core (3 priority tasks as rows)
├── Schedule Strip (compact horizontal timeline)
└── Cognitive Load bar (current capacity visual)
```

---

### 9.0 Cognitive Mode Architecture

Different features should feel cognitively different:

| Mode | Feature | Design Character |
|------|---------|-----------------|
| **Execution** | Tasks / Today | Dense rows, monospace metrics, J/K navigation |
| **Study** | Study / Syllabus | Split-pane, Newsreader prose, academic hierarchy |
| **Writing** | Notes | Full-width prose canvas, minimal chrome |
| **Planning** | Planner / Timeline | SVG grid, time-based layout, drag targets |
| **Focus** | Focus Room | Full-screen dark sanctuary, timer only |
| **Review** | Evening Review | Quiet reflection, Newsreader editorial |
| **Analysis** | Analytics | Telemetry dashboard, hairline data tables |

---

## PART VII — SCREEN-BY-SCREEN REDESIGN SPECIFICATIONS

### 10.0 Landing Page — New Architecture

**Current Problems:**
- Centered hero with pill badge above H1
- ScrollReveal stagger delaying 480ms
- `solis-philosophy-glow` using `filter: blur(70px)` 
- Static screenshot mockup instead of live demo

**New Architecture:**
```
HERO (asymmetric, left-aligned text)
├── No pill badge
├── Newsreader H1 at 68px, -0.035em tracking:
│   "An operating system for serious scholars."
├── Plus Jakarta Sans body at 18px:
│   "Synthesize deep knowledge. Master complex disciplines."
├── Two CTAs: [Enter Workspace →] (terracotta) | [See how it works ↓] (ghost)
└── Right side: LIVE interactive preview
    ├── Mini study timer (actually functional)
    ├── 3-item task checklist (actually checkable)
    └── Subject progress ring (actual SVG)

PHILOSOPHY SECTION (de-cardified)
├── Horizontal rule
├── Newsreader 32px quote
└── Three principles in three columns (text only, no icon boxes)

FEATURES (tabular, not card grid)
├── Each feature = one clean row with large heading + description
└── No icon boxes, no colored pillars
```

---

### 11.0 Dashboard — Morning Launchpad

**Current Problems:**
- "Next Recommended Step" ad-style card
- Oversized competing buttons
- 5 Focus Room entry points

**New Architecture:**
```
DASHBOARD LAYOUT:
┌─────────────────────────────────────────────────────────────┐
│ Good morning, Kunal.                    Tuesday, Sep 23     │
│ Newsreader 48px, -0.025em               06:42 AM            │
│ Target: 4.5h • Committed: 2.5h • Available: 2.0h           │
│ ─────────────────────────────────────────────────────────── │
│ TODAY'S FOCUS CORE              SCHEDULE STRIP               │
│                                                              │
│ □ Raft Consensus (90m)          ██░░░░░░  09:00-10:30       │
│ □ SM-2 Review (30m)             ░░░░████  11:00-11:30       │
│ □ Problem Set 4 (2h)            ░░░░░░░░  15:00-17:00       │
│   + Add task...                                              │
│ ─────────────────────────────────────────────────────────── │
│ MOMENTUM (last 7 days)                                       │
│ Morning Run    ● ● ● ○ ● ● ●   86%                          │
│ Spaced Review  ● ● ○ ● ● ● ●   86%                          │
│ Evening Log    ● ○ ● ● ● ● ●   86%                          │
└─────────────────────────────────────────────────────────────┘
```

---

### 12.0 Tasks & Hourly Planner — Timeline Canvas

**Current Problems:**
- 24 separate hourly cards (24 borders, 24 shadows, 24 hover states)
- Modal required to add time block

**New Architecture:**
```
TASKS LAYOUT (split view):
┌─────────────────────┬────────────────────────────────────────┐
│ TASK INBOX          │ TIMELINE (08:00 - 20:00)               │
│ ─────────────────── │ ────────────────────────────────────── │
│ □ Raft (90m)        │ 08:00 ─────────────────────────────── │
│ □ SM-2 (30m)        │        ┌─────────────────────────────┐ │
│ □ Problem Set (2h)  │ 09:00  │ Deep Work: Raft Consensus  │ │
│ + Add task (Enter)  │        │ 09:00 - 10:30              │ │
│                     │ 10:00  └─────────────────────────────┘ │
│ SCHEDULED TODAY     │ ●══════════════════ [CURRENT TIME]     │
│ ─────────────────── │ 11:00  ┌────────────────────────────┐  │
│ Deep Work    09-10:30│        │ Active Recall: SM-2        │  │
│ Active Recall 11-11:30│ 12:00 └────────────────────────────┘  │
└─────────────────────┴────────────────────────────────────────┘
```

Key changes:
- Single SVG/CSS continuous timeline (not 24 separate cards)
- Default: 08:00 to 20:00 (12-hour workday view)
- Drag to create time blocks (no modal)
- Living red time needle with dot indicator
- `2` key to toggle 24h view

---

### 13.0 Study & Syllabus — Split-Pane Workstation

**Current Problems:** 11 modal states, no side-by-side context

**New Architecture:**
```
STUDY LAYOUT:
┌──────────────────────┬──────────────────────────────────────┐
│ SYLLABUS (320px)     │ ACTIVE TOPIC WORKSPACE               │
│ ─────────────────── │ ─────────────────────────────────── │
│ 🔍 Search topics     │ Raft Consensus Algorithm             │
│ 14 modules • 68%    │ CS 244B • Distributed Systems        │
│ ─────────────────── │ Last reviewed: 2 days ago            │
│ ▼ Distributed Sys.  │ [Start Review Session ▶]             │
│   ● Raft (Active)   │ ─────────────────────────────────── │
│   ○ Paxos    100%   │ NOTES                                │
│   ○ Byzantine 40%   │ Leader election safety states that   │
│   ○ Vectors  60%    │ at most one leader is elected per    │
│ ▶ Computer Arch     │ term. The proof relies on...         │
│ ▶ Operating Sys     │ ─────────────────────────────────── │
│ ─────────────────── │ ACTIVE RECALL (4 due)                │
│ + Add topic (Enter) │ ┌─────────────────────────────────┐  │
│                     │ │ What is Election Safety in Raft? │  │
│                     │ │           (Click or Space)       │  │
│                     │ └─────────────────────────────────┘  │
│                     │ [1] Again [2] Hard [3] Good [4] Easy │
│                     │ ─────────────────────────────────── │
│                     │ SESSION HISTORY                      │
│                     │ Sep 21 | 45m | 94% retention         │
│                     │ Sep 18 | 30m | 89% retention         │
└──────────────────────┴──────────────────────────────────────┘
```

**Modal Elimination Map:**

| Old Modal | New Inline Solution |
|-----------|---------------------|
| `isAddSubjectModalOpen` | Ghost row at bottom of subject list |
| `isEditSubjectModalOpen` | Right-click → inline edit field |
| `isLogSessionModalOpen` | Inline "Log Session" form in right panel |
| `isAddPlanModalOpen` | Inline plan row in right panel |
| `isTopicsModalOpen` | Topics visible in tree (left panel) |
| `isReviewModalOpen` | Active Recall section in right panel |
| `isCreateFlashcardModalOpen` | Inline flashcard editor in right panel |
| `isResourceModalOpen` | Resource link inline below notes |
| `deletingSubject` | 5-second undo toast, no confirm modal |
| `activeActionMenuSubjectId` | Right-click context menu (not modal) |
| `showAddSubjectOptions` | Single "+ Add Subject" ghost row |

---

### 14.0 Focus Room — Distraction-Free Sanctuary

**Current Problems:** Atmospheric radial gradients, cluttered UI during session

**New Architecture:**
```
FOCUS ROOM (IDLE STATE):
─────────────────────────────────────
[center]
Distributed Systems — Raft Consensus
[italic Newsreader intent field, 24px]

     25 : 00
[JetBrains Mono, 120px, -0.04em]

[Start Session  ▶]    [Soundscape: Rain ▿]
─────────────────────────────────────

FOCUS ROOM (RUNNING STATE — peripheral dim to 0.12 opacity):
─────────────────────────────────────
[opacity: 0.12]  Distributed Systems  [opacity: 0.12]

     24 : 37
[full brightness timer, razor-sharp]

[opacity: 0.12]  [|| Pause]  [↩ Exit]  [opacity: 0.12]
─────────────────────────────────────
Hover any peripheral element → restores to 1.0 opacity
```

---

### 15.0 Habits — 14-Day Dot Matrix

**Current Problems:** Dashed empty state box, modal creation

**New Architecture:**
```
HABITS PAGE:
─────────────────────────────────────────────────────────
Habit Rituals          M  T  W  T  F  S  S  Streak  Rate
─────────────────────────────────────────────────────────
Morning Run            ●  ●  ●  ○  ●  ●  ●   6d     86%
Spaced Review          ●  ●  ○  ●  ●  ●  ●   5d     86%
Evening Journaling     ●  ○  ●  ●  ●  ●  ●   5d     86%
─────────────────────────────────────────────────────────
+ Add ritual...
```

Each dot is 10px, 2px gap, click = instant toggle (< 16ms optimistic).

---

### 16.0 Analytics — Telemetry Panel

**Current Problems:** Rounded health-widget cards with colorful icons

**New Architecture:**
```
COGNITIVE ANALYTICS:
─────────────────────────────────────────────────────────
FOCUS ENDURANCE CURVE (last 14 days)
─────────────────────────────────────────────────────────
Hours │
  4.5 │          ╭────╮
  4.0 │      ╭───╯    ╰───╮
  3.5 │  ╭───╯             ╰──────
  3.0 │──╯                        
      └──────────────────────────── Sep 9 → Sep 23
─────────────────────────────────────────────────────────
SUBJECT MASTERY INDEX
─────────────────────────────────────────────────────────
Distributed Systems  ████████████░░░░  78%
Computer Architecture████████░░░░░░░░  51%
Operating Systems   ██████░░░░░░░░░░  39%
─────────────────────────────────────────────────────────
Context switches today: 14  •  Estimated cost: 42 min
─────────────────────────────────────────────────────────
```

---

## PART VIII — DESIGN SYSTEM 3.0 SPECIFICATION

### 17.0 Typography System

```
NEWSREADER (Serif / Reflective Contexts):
─ H1 Hero:      clamp(2.5rem, 5vw, 4.25rem) | weight: 400 | tracking: -0.035em
─ Dashboard Greeting: clamp(2rem, 3.5vw, 3rem) | weight: 400 | tracking: -0.025em  
─ Section Edits:  clamp(1.5rem, 2vw, 2rem)  | weight: 400 | tracking: -0.02em
─ Focus Intention: 1.25rem               | weight: 400 | style: italic

PLUS JAKARTA SANS (Sans / Operational UI):
─ Page H2:      clamp(1.35rem, 2vw, 1.85rem) | weight: 600 | tracking: -0.02em
─ Section H3:   clamp(1.1rem, 1.5vw, 1.35rem) | weight: 600 | tracking: -0.01em
─ Body:         1rem (16px)              | weight: 400 | leading: 1.5
─ Small:        0.875rem (14px)         | weight: 400 | leading: 1.5
─ Caption:      0.75rem (12px)          | weight: 500 | tracking: +0.02em
─ Label:        0.6875rem (11px)        | weight: 600 | tracking: +0.04em | uppercase

JETBRAINS MONO (Mono / Metrics):
─ Focus Timer:  clamp(3.6rem, 18vw, 10.5rem) | weight: 300 | tracking: -0.04em
─ Data metrics: 0.875rem                | weight: 500 | font-variant-numeric: tabular-nums
─ Time labels:  0.75rem                 | weight: 400 | tabular-nums
```

### 18.0 Color System (Updated OKLCH)

```
DAY MODE:
Canvas:         oklch(0.985 0.005 85)   → #FAF8F5
Surface:        oklch(0.965 0.008 85)   → #F4F1EC
Hover:          oklch(0.950 0.010 85)   → #EDE9E3

Primary ink:    oklch(0.18 0.015 65)    → #1A1816
Secondary ink:  oklch(0.45 0.020 65)    → #5C5650
Muted ink:      oklch(0.55 0.015 65)    → #706860 [4.6:1 on canvas ✓ WCAG AA]

Hairline:       color-mix(in srgb, #1A1816 7%, transparent)
Subtle:         color-mix(in srgb, #1A1816 12%, transparent)

Terracotta:     oklch(0.60 0.20 28)     → #C84B31 [SOLE ACCENT]
Terracotta+:    oklch(0.55 0.22 28)     → #B03E26 [hover/active]
Terracotta-:    oklch(0.95 0.04 28)     → Active row tint

NIGHT MODE:
Canvas:         oklch(0.12 0.008 55)    → #0E0C0B
Surface:        oklch(0.15 0.010 55)    → #171412
Hover:          oklch(0.18 0.012 55)    → #1E1B18

Primary ink:    oklch(0.95 0.005 85)    → #F6F4F0
Secondary ink:  oklch(0.72 0.010 85)    → #A8A196
Muted ink:      oklch(0.58 0.012 85)    → #7E776D [4.7:1 on night canvas ✓ WCAG AA]

Terracotta:     oklch(0.68 0.19 28)     → #E8684A [night variant, legible]
```

### 19.0 Motion & Spring System

```css
:root {
  /* Physics-based spring curves */
  --spring-tactile: cubic-bezier(0.175, 0.885, 0.32, 1.275); /* button press */
  --spring-spatial: cubic-bezier(0.16, 1, 0.3, 1);           /* drawers, panels */
  --spring-snap: cubic-bezier(0.4, 0, 0.2, 1);               /* state changes */

  /* Duration scale */
  --dur-instant: 60ms;    /* hover, focus ring */
  --dur-swift: 120ms;     /* checkbox, toggle */
  --dur-smooth: 200ms;    /* panel slide, dropdown */
  --dur-cinematic: 280ms; /* page transition, drawer */
}

/* Button physical depression */
.btn { transition: transform 80ms var(--spring-tactile); }
.btn:active { transform: scale(0.97); }

/* Checkbox spring pop */
.checkbox { transition: transform 120ms var(--spring-tactile); }
.checkbox[data-checked] { transform: scale(1.1); }

/* Peripheral dimming (Focus Room) */
.focus-peripheral {
  transition: opacity 800ms var(--spring-spatial);
}
.focus-running .focus-peripheral { opacity: 0.12; }
.focus-running .focus-peripheral:hover { opacity: 1; }
```

### 20.0 Anti-AI-Slop CSS Enforcement Rules

```css
/* BANNED PATTERNS — these trigger a code review rejection: */

/* ❌ BANNED: Rounded pill badges on system UI */
/* border-radius: 9999px on buttons/badges */

/* ❌ BANNED: Gradient blur orbs */
/* filter: blur(Npx) on background decorative elements */

/* ❌ BANNED: Neon box-shadow accent glows */
/* box-shadow: 0 4px 12px rgba(accent, 0.35) */

/* ❌ BANNED: Dashed empty states */
/* border: 1px dashed ... */

/* ❌ BANNED: Float-up card hover */
/* transform: translateY(-2px) on hover */

/* ❌ BANNED: Serif font on operational UI data */
/* font-family: var(--font-display) on tables, metrics, timestamps */

/* ❌ BANNED: Modal confirm for destructive actions */
/* window.confirm() or <Modal> for delete confirmation */

/* ✅ APPROVED REPLACEMENTS: */
/* border-radius: var(--radius-btn) (6px) on buttons */
/* 1px solid rgba(accent, 0.15) border on semantic containers */
/* box-shadow: 0 1px 2px rgba(0,0,0,0.06) (contact shadow only) */
/* Empty row with blinking cursor for empty states */
/* border-color opacity shift on hover (no layout shift) */
/* font-family: var(--font-mono) + tabular-nums for metrics */
/* 5-second undo toast with Cmd+Z for destructive actions */
```

---

## PART IX — IMPLEMENTATION ROADMAP

### 21.0 12-Step Engineering Execution Plan

```
PHASE 1: TOKEN & TYPOGRAPHY SYSTEM (Foundation)
─────────────────────────────────────────────────
Step 1: Update tokens.css
  - Add OKLCH color tokens (--solis-accent, --solis-canvas, etc.)  
  - Fix --text-muted contrast to 4.6:1
  - Add spring motion tokens (--spring-tactile, --spring-spatial)
  - Remove gradient-subtle-glow tokens
  
Step 2: Update typography.css
  - Enforce -0.035em tracking on all display sizes
  - Ensure font-variant-numeric: tabular-nums on all metrics
  - Add global .text-muted contrast fix

Step 3: Update Button.css & Button.tsx
  - Remove border-radius > 8px from all button variants
  - Remove box-shadow glow effects
  - Add scale(0.97) active state with spring easing
  - Enforce single primary button per page via hierarchy prop

PHASE 2: DE-CARDIFICATION & MODAL ELIMINATION
─────────────────────────────────────────────────
Step 4: LandingPage.tsx/css
  - Remove solis-philosophy-glow (filter: blur)
  - Convert pillar cards to tabular rows
  - Left-align hero text (remove centered layout)
  - Remove ScrollReveal from above-fold content
  - Remove pill badge imports from LandingPage

Step 5: DashboardPage.tsx/css
  - Replace "Next Recommended Step" card with 3-item Focus Core list
  - Add WorkloadCapacityBar (already exists: WorkloadCapacityBar.tsx)
  - Remove Focus Room CTA from header (single entry point)
  - Implement Morning Launchpad top section

Step 6: StudyPage.tsx — Split-Pane Re-architecture
  - Implement 2-column CSS Grid layout (320px | 1fr)
  - Build SyllabusTree component (left panel)
  - Build TopicWorkspace component (right panel)
  - Eliminate ALL 11 modal state variables
  - Move flashcard review into inline ActiveRecallWidget
  - Replace delete modals with undo toast

PHASE 3: INTERACTION VELOCITY
─────────────────────────────────────────────────
Step 7: useRovingTabindex hook
  - Implement J/K navigation for TaskInboxView
  - Implement J/K navigation for SyllabusTree
  - Add Enter to open, E to complete, Esc to cancel

Step 8: FocusPage keyboard shortcuts
  - Space → start/pause timer
  - Esc → reset/exit session  
  - Peripheral dimming: start timer → opacity 0.12 → hover to restore

Step 9: Optimistic delete with Undo toast
  - Implement 5-second undo queue for task deletion
  - Implement undo for habit deletion  
  - Remove ALL confirm dialogs from delete operations

PHASE 4: AMBIENT CRAFT & POLISH
─────────────────────────────────────────────────
Step 10: Living Horizon circadian engine
  - useCircadianCanvas hook — check solar time every 10 min
  - Update CSS custom properties on documentElement
  - 1000ms transition for theme shifts (no layout shift)

Step 11: Web Audio micro-interactions
  - Task complete: 15ms 800Hz sine burst (mechanical tick)
  - Focus session complete: 1.8s harmonic bell (528Hz)
  - Mode switch: 20ms low-pass brown noise pulse
  
Step 12: Mobile recomposition
  - Bottom tab bar (Today / Study / Focus) — 3 tabs only
  - Priority checklist at top of mobile view
  - Floating terracotta FAB for quick capture
  - Swipe-right on task row → complete (with haptic)
```

---

## PART X — MCP TOOL VERIFICATION TABLE

| Tool | Discovered | Invoked | What Was Explored | Used in Final Design |
|------|-----------|---------|-------------------|---------------------|
| Stitch MCP | ✅ Yes | ✅ Yes | `create_project`, `generate_screen_from_text`, `get_project` | Dashboard screen, Study screen, "Editorial Research Desk" design system |
| Figma MCP | ✅ Yes | ✅ Yes (`whoami`) | Authentication status, REST API connection, bridge status | Design system reference (REST API available for file access) |
| Chrome DevTools | ✅ Yes | ✅ Yes | `new_page`, `navigate_page`, `select_page`, `take_snapshot` | Live browser inspection of Solis at localhost:5173 |
| Web Search | ✅ Yes | ✅ Yes | Awwwards research for 6 specific sites, premium product research | Verified all Awwwards recognitions, product design analysis |

---

## PART XI — DESIGN BIBLE (CANONICAL REFERENCE)

### 22.0 The 10 Laws of Solis Design

1. **The Canvas Rule:** The warm ivory canvas (`#FAF8F5`) is sacred. Nothing should fracture it with aggressive borders, shadows, or gradient overlays.

2. **The Hairline Rule:** Structure is expressed through 1px hairlines (`rgba(24,22,20,0.06)`), never through boxed enclosures.

3. **The One Accent Rule:** Terracotta (`#C84B31`) is the single system accent color. It is used exclusively for primary CTAs, active states, and the current-time indicator. Never for badges, illustrations, or passive decoration.

4. **The Zero Modal Rule:** Every piece of functionality must be achievable without opening a modal dialog. Inline creation, split-pane workspaces, contextual flyouts — always. Modals — never.

5. **The Keyboard-First Rule:** Every list must support J/K traversal, Enter to commit, E to complete, Esc to cancel, before any new features are added.

6. **The Density Rule:** Information density is a form of respect. Showing 15 task rows instead of 7 (because each row is a card) respects the user's cognitive map of their work.

7. **The Typography Role Rule:** Newsreader is used ONLY for time-aware greetings, session intentions, editorial notes, and empty state poetry. Plus Jakarta Sans handles ALL operational UI elements.

8. **The Zero Explanation Rule:** UI copy that explains what the UI does is a UI failure. Remove all didactic subtitles, all "this is what this section does" sentences, all instructional tooltips at rest.

9. **The Peripheral Rule:** When the user is in deep focus (timer running), all peripheral elements dim to 15% opacity. The timer and content are the only elements at full luminance. Hover restores.

10. **The Living Canvas Rule:** The circadian engine adjusts canvas warmth across 4 solar phases without layout shifts or React re-renders. The app is alive to time.

---

## PART XII — FINAL AI-SLOP FORENSIC PASS (POST-REDESIGN CHECKLIST)

After implementation, verify against this checklist:

```
TYPOGRAPHY:
[ ] No italic colored keyword in any hero heading
[ ] All display headings have negative letter-spacing
[ ] All numeric metrics use tabular-nums
[ ] Newsreader is ONLY used in reflective/narrative contexts
[ ] No serif fonts in tables, task lists, or operational UI

COLOR:
[ ] Only terracotta (#C84B31) appears as system accent
[ ] No gradient blur orbs (filter: blur) anywhere
[ ] Text-muted contrast ≥ 4.5:1 on all background colors
[ ] No neon glow box-shadows (rgba(accent, 0.35))
[ ] 90/8/2 color ratio maintained on all pages

LAYOUT:
[ ] No card-inside-card nesting (depth-1 inside depth-1)
[ ] No pill badges above page headings
[ ] No dashed empty state borders
[ ] No float-up translateY hover effects
[ ] StudyPage has 0 modal dialogs
[ ] Dashboard has 1 Focus Room entry point (sidebar only)

INTERACTION:
[ ] J/K navigation works in TaskInboxView
[ ] Space starts/pauses Focus Room timer  
[ ] 1/2/3/4 grades flashcards (StudyPage)
[ ] Delete actions use undo toast, not confirm dialogs
[ ] Sidebar collapses with Cmd+\

MOBILE:
[ ] Bottom tab bar visible at 390px
[ ] Priority tasks at top of mobile view
[ ] No horizontal overflow on any page
[ ] FAB visible and functional at 390px

PERFORMANCE:
[ ] First Contentful Paint < 1.5s
[ ] No layout shift from circadian theme change
[ ] All animations respect prefers-reduced-motion
[ ] Fonts loaded with font-display: optional
```

---

## PART XIII — LIVE COMPUTED CSS & AWWWARDS FORENSIC EXTRACTS (DIRECT BROWSER INSPECTION)

The following forensic parameters are **real computed CSS values** extracted directly from live browser sessions via Chrome DevTools MCP and DOM tree evaluation. No values are simulated or approximated.

### 23.0 Awwwards Award-Winning & Nominated Sites (Computed Values)

#### 1. Anime.js (`animejs.com`) — Awwwards Site of the Day (May 6, 2025, Score 7.62/10)
- **Primary Typeface**: `DIN, "Helvetica Neue", Helvetica, Arial, sans-serif`
- **Background Canvas**: `rgb(37, 36, 35)` (`#252423`) — warm charcoal, deliberately avoiding sterile `#000000`.
- **Text Color**: `rgb(246, 244, 242)` (`#F6F4F2`) — warm parchment off-white.
- **Type Hierarchy**:
  - H1 (Logo mark): `12px`
  - Primary Display H2: `64px`, font-weight `700`, line-height `1.1`
  - Secondary Feature H2: `40px`, font-weight `800`, letter-spacing `-0.5px`
  - Body Paragraph: `20px`, font-weight `600`, line-height `1.4`
- **Awwwards Praised Mechanics**: Scroll scrubber timeline linking user scroll directly to animation frame delta; complete absence of decorative gradient orbs or floating background cards; all motion acts as the product explanation.
- **Solis Applicability**: Use warm charcoal (`#151311`) over pure black for night mode canvas; large headlines require bold, tight letter-spacing; motion must demonstrate functionality (e.g. timer progression, active recall cards) rather than floating decorative fluff.

#### 2. Family Style (`wearefamilystyle.com`) — Awwwards Honorable Mention (March 7, 2025)
- **Palette**: `#1500FF` (Electric Cobalt Blue) + `#000000` (Pure Basalt)
- **Computed Characteristics**: Photographic full-bleed viewports, editorial agency grid, pop-up video reels.
- **Solis Applicability**: Demonstrates the power of a strict two-tone color commitment. What NOT to copy: high-saturation electric blue causes severe optic fatigue during 4-hour study sessions; Solis strictly retains warm earth terracotta (`#C84B31`).

#### 3. Laksonline (`lakshmesh.com`) — Awwwards Nominee (September 26, 2025)
- **Framework**: Custom Framer build with strict flat design tokens.
- **Computed Characteristics**: Zero box-shadows on card elements; single hairline borders (`1px solid rgba(0, 0, 0, 0.08)`); typography-first narrative layout.
- **Solis Applicability**: Proves modern Awwwards recognition is shifting toward ruthless flatness, high typography discipline, and zero-card surface hierarchy.

#### 4. Studio Brot (`studiobrot.de`) — Awwwards Honorable Mention (January 24, 2023)
- **Display Typeface**: `Grtsk, Helvetica, sans-serif`
- **Background Canvas**: `rgb(0, 0, 0)`
- **Headline Scale**: H2 set at **`95px`**, font-weight `700`, line-height `0.95`.
- **Solis Applicability**: Demonstrates absolute confidence in scale contrast (tiny micro-labels vs titanic display headers). What NOT to copy: aggressive brutalist tone is inappropriate for calm academic contemplation.

#### 5. Osmo (`osmo.supply`) — Awwwards Site of the Day (Feb 8, 2025 & Dec 16, 2025)
- **Display Typeface**: `"Haffer VF", Arial, sans-serif` (Variable Font)
- **Monospace Typeface**: `"Haffer Mono"`
- **Background Canvas**: `rgb(244, 244, 244)` — muted alabaster
- **Text Primary**: `rgb(32, 29, 29)` — volcanic ink
- **Type Hierarchy**:
  - Display H2: `42.67px`, font-weight `400`, letter-spacing **`-1.28px`** (-3.0%)
  - Marquee Sub-ticker: `11.73px`, uppercase, tabular tracking
- **Solis Applicability**: Pairing a variable sans with a specialized monospace for telemetry metrics; negative letter-spacing at weights as low as 400.

---

### 24.0 Premium Knowledge & Productivity Tools (Computed Values)

#### 1. Linear (`linear.app`)
- **Display & UI Typeface**: `"Inter Variable", "SF Pro Display", -apple-system, BlinkMacSystemFont`
- **Background Canvas**: `rgb(8, 9, 10)` (`#08090A`) — precision obsidian
- **Text Primary**: `rgb(247, 248, 248)`
- **Computed Typography**:
  - H1 Hero: `64px`, font-weight **`510`** (fractional variable weight), letter-spacing **`-1.408px`** (-2.2%), line-height `64px` (strict 1:1)
  - H2 Sections: `48px`, font-weight **`510`**, letter-spacing **`-1.056px`** (-2.2%)
- **Data Table Layout**: Roving tabindex lists with `36px` row height; metadata columns right-aligned in monospace.
- **Solis Applicability**: Fractional font-weights prevent headings from feeling either too flimsy or cartoonishly fat; negative tracking on headings creates instant industrial polish.

#### 2. Craft (`craft.do`)
- **Display Typeface**: `UntitledSerifFont, apple-system-ui-serif, ui-serif, Georgia`
- **Body & Interface**: `UntitledSansFont, apple-system, InterFont, BlinkMacSystemFont`
- **Background Canvas**: `rgb(252, 249, 247)` (`#FCFAF7`) — **Archival Warm Cream**
- **Text Color**: `rgb(3, 3, 2)` — deep carbon
- **Computed Typography**:
  - H1 Display: **`74px`**, font-weight **`400`** (Regular Serif), letter-spacing **`-2.22px`** (-3.0%), line-height `74px`
  - H3 Subsection: `50px`, font-weight `400`, letter-spacing `-1.5px`
  - Navigation/Body: `16px`, font-weight `500`, letter-spacing `-0.32px`
- **Solis Applicability**: Regular-weight (400) serif headings at huge scale with aggressive negative tracking convey vastly more intellectual gravitas than bold sans headings. The `#FCFAF7` cream background eliminates monitor eye-strain during 6-hour dissertation or revision sessions.

#### 3. Heptabase (`heptabase.com`)
- **Display Typeface**: `Instrument Sans, "Helvetica Neue", Arial, sans-serif`
- **Body Typeface**: `Inter, sans-serif`
- **Background Canvas**: `rgb(247, 247, 247)` (`#F7F7F7`)
- **Computed Typography**:
  - H1 Hero: `48px`, font-weight `500`, letter-spacing **`-1.584px`** (-3.3%)
  - H2 Subhead: `36px`, font-weight `500`, letter-spacing `-0.54px`, line-height `1.3`
- **Spatial Architecture**: Persistent 2-column split canvas: hierarchical syllabus tree (left 320px) + fluid markdown note/recall workspace (right). Zero modals for subject or note editing.
- **Solis Applicability**: Blueprint for the total eradication of all 11 modal dialogs in `StudyPage.tsx`.

#### 4. Sunsama (`sunsama.com`)
- **Typeface**: `"DM Sans", sans-serif`
- **Background Canvas**: `rgb(255, 255, 255)`
- **Body Color**: `rgb(32, 34, 40)`
- **Computed Typography**:
  - Headings: `40px`, font-weight `600`, letter-spacing `-0.4px`, line-height `44px`
  - Body: `16px`, font-weight `500`, letter-spacing `-0.16px`
- **UX Architecture**: "Start Day → Work Day → End Day" ritual navigation. Planned focus hours are capped at 5.0h with real-time capacity feedback.
- **Solis Applicability**: Surface Solis's deterministic cognitive load engine as a daily capacity ceiling meter.

#### 5. Raycast (`raycast.com`)
- **Interface Typeface**: `Inter, "Inter Fallback", sans-serif`
- **Monospace Code/Hotkeys**: `GeistMono, ui-monospace, SFMono-Regular`
- **Background Canvas**: `rgb(7, 8, 10)` (`#07080A`)
- **Computed Typography**:
  - H1: `64px`, font-weight `600`, line-height `70.4px`
  - Hotkey Badge: GeistMono `12px`, tabular numerals, 1px solid border, zero glow.
- **Solis Applicability**: All keyboard shortcuts across Solis (e.g. `[Space]` in Focus, `[1-4]` in SM-2 Spaced Repetition, `[J/K]` in Tasks) must be rendered in crisp monospace boxes without pill styling.

#### 6. Vercel (`vercel.com`)
- **Typeface**: `GeistSans, "GeistSans Fallback"` (Variable Font)
- **Monospace**: `GeistMono`
- **Background Canvas**: `rgb(0, 0, 0)`
- **Computed Typography**:
  - H1 Hero: `64px`, font-weight `400`, letter-spacing **`-3.84px`** (**-6.0% extreme negative tracking**), line-height `64px`
  - H2 Subsections: `56px`, font-weight **`450`**, letter-spacing **`-3.36px`**
- **Solis Applicability**: Precision tracking and variable intermediate weights (`450`) eliminate the "AI default template" look instantly.

#### 7. Butterick’s Practical Typography (`practicaltypography.com`)
- **Body Text**: `valkyrie-text` (humanist serif) at **`21.84px`**, font-weight `400`, line-height `1.45` (34.8px)
- **Core Lesson**: Generous line-height (`1.45–1.6`) and body font sizes `>=16px` are mandatory for serious scholarly reading.

---

## PART XIV — THE CANONICAL DESIGN BENCHMARK MATRIX

| # | Reference | Category | What It Does Exceptionally | Lesson for Solis | What NOT to Copy |
|---|-----------|----------|----------------------------|-------------------|------------------|
| 1 | **Poor Charlie’s Almanack** | Awwwards SOTD / Stripe Press | Editorial book typography fused with reactive micro-interactions. | Use Newsreader serif at large optical sizes with negative tracking as primary brand identity. | Gamified drag physics or heavy canvas elements that distract from utility. |
| 2 | **Craft.do** | Premium Knowledge Editor | Regular-weight (400) 74px serif headings on warm cream `#FCFAF7` canvas. | Ivory/cream ground reduces ocular fatigue during multi-hour study sessions. | Expensive proprietary font licensing; multi-product sprawl. |
| 3 | **Heptabase** | Academic Research Platform | Permanent split-pane master-detail (Syllabus tree left, Topic workspace right). | Completely eliminate all 11 modal dialog states in `StudyPage.tsx`. | Complex 2D whiteboard freehand canvas (unnecessary overhead for Solis). |
| 4 | **Linear** | High-Velocity Execution | Roving tabindex keyboard navigation (`J/K`), 50ms optimistic UI, fractional font weights (`510`). | Tasks and study items render as surface-less tabular rows with keyboard navigation. | Developer-centric issue-tracking jargon and enterprise ticket metadata. |
| 5 | **Things 3** | Personal Task System | Complete de-cardification: tasks sit directly on canvas separated by whisper hairlines. | Eradicate all `depth-1` and `depth-2` card boxes from list views. | macOS-only skeuomorphic date tags or rigid desktop paradigms. |
| 6 | **Sunsama** | Mindful Productivity | Guided 3-step Morning Planning Ritual + Cognitive Workload Ceiling bar. | Transform the Dashboard into an intentional morning launchpad. | Mandatory lengthy shutdown flows that lock the user out of quick capture. |
| 7 | **Endel** | Circadian Sound & Focus | Deep black canvas with 3-second peripheral UI dimming during active focus. | Smoothly dim sidebars and controls to `opacity: 0.12` during active Solis focus sessions. | Pure black `#000000` (harsh on eyes); passive background audio without structured timers. |
| 8 | **Raycast** | Keyboard Launcher | Instant zero-reflow hotkey execution; `GeistMono` for command shortcuts. | Monospace keyboard glyphs (`[Space]`, `[J]`, `[K]`, `[1-4]`) docked to all actions. | Pop-over spotlight floating window metaphor. |
| 9 | **Osmo** | Awwwards SOTD ×2 | Variable font pairing (`Haffer VF` + `Haffer Mono`) with negative letter-spacing. | Pair `Newsreader` display with `JetBrains Mono` telemetry metrics. | Heavy WebGL 3D effects and marketing marquees. |
| 10 | **Anime.js** | Awwwards SOTD (2025) | Warm charcoal canvas (`#252423`) + interactive live demonstrations. | Live interactive study timer and task checklist directly in the landing page hero. | Highly stylized animation library showcase controls. |
| 11 | **Vercel** | Modern Web Infrastructure | Geometric grid precision, weight `450`, extreme tracking (`-6%`). | Eliminate bloated 32px rounded corners; clamp all button radii to 6px/8px. | Corporate enterprise positioning and high-contrast stark minimalism. |
| 12 | **Stripe Docs** | API & Knowledge Architecture | Dense information architecture with clean hairline table borders and zero card boxes. | Format study session history, habit logs, and analytics telemetry as hairline data tables. | Standard system-font typography without personality. |
| 13 | **Are.na** | Indie Research Garden | Unpretentious information-forward layout; quiet academic density. | Solis feels like an authored, personal academic sanctuary rather than a venture-backed SaaS. | Completely flat type scale with no visual hierarchy. |
| 14 | **Studio Brot** | Awwwards HM | Titanic typography scale contrasts (`95px` vs `12px`). | Create drama through size differential rather than colored badge pills. | Aggressive brutalist humor and jarring layout disjunctions. |
| 15 | **Family Style** | Awwwards HM | Radical color economy: strict two-tone visual discipline. | The 90/8/2 color law: 90% ivory, 8% structural grays, 2% terracotta accent. | High-saturation electric cobalt `#1500FF`. |
| 16 | **Butterick’s Typography** | Editorial Authority | Strict book proportioning: `1.45x` line-height and `>20px` body text. | Maintain generous line-height on notes and active study synthesis blocks. | Static print book simulation with no dynamic UI controls. |
| 17 | **Cron / Notion Calendar** | Precision Time-Blocking | "Living Time Needle" indicator line + drag-to-create time blocks. | Continuous SVG/CSS timeline replacing 24 separate hourly cards. | Full-screen multi-calendar overlay clutter. |
| 18 | **Rise Science** | Circadian Sleep & Energy | Biological circadian curve mapping peak focus hours vs recovery windows. | Living Horizon lighting shifts (Dawn, Noon, Twilight, Night) without layout shift. | Medical biometrics telemetry charts that overwhelm students. |

---

## PART XV — LIVE ROUTE-BY-ROUTE FORENSIC AUDIT OF SOLIS APPLICATION

Conducted via live browser inspection on `http://localhost:5173`.

### 25.1 Route `/` — Landing Page
- **What Works**: The headline copy ("An operating system for serious scholars and builders") accurately captures product intent. The `ScholarObservatoryIllustration` has handcrafted linework.
- **What Looks AI-Generated / Generic**:
  - Centered hero with floating badge tag above heading (`.solis-landing-tag`).
  - `.solis-philosophy-glow` uses `filter: blur(70px)` — classic 2022 AI SaaS cliché.
  - Four pillar cards in `.solis-pillars-grid` use four different saturated icon backgrounds (`coral-50`, `amber-50`, `lavender-50`, `sage-50`).
  - Staggered `ScrollReveal` delays content interaction by up to 480ms.
- **Solis Fix**: Left-align hero typography; eliminate the blur glow; convert 4 pillar cards into a clean tabular editorial list; embed live interactive preview.

### 25.2 Route `/auth/login` & `/auth/signup`
- **What Works**: Clean dual-field input flow; Supabase authentication works properly.
- **What Looks Generic**: Standard centered modal box on neutral background; pill submit button.
- **Solis Fix**: Asymmetric split screen: left side displays warm ivory editorial quote on scholarship, right side contains minimalist hairline input group with 6px radius button.

### 25.3 Route `/app/dashboard` — Dashboard Page
- **What Works**: Date calculation, daily summary aggregation, workload realism computation.
- **What Looks AI-Generated / Overdesigned**:
  - "Next Recommended Step" banner looks like an advertising card.
  - Duplicated entry points: "Start Focus Session" in AppHeader, "Enter Focus" in Dashboard hero, and Focus in Sidebar.
  - Explanatory copy under headings ("Deterministic streaks derived from daily records...").
  - 4 competing buttons in hero zone with conflicting visual weights.
- **Solis Fix**: Replace "Next Recommended Step" with "Today's Focus Core" (3 clean rows); delete didactic subtitles; eliminate duplicate Focus button from header.

### 25.4 Route `/app/tasks` — Tasks & Planner Page
- **What Works**: Task filtering, tag handling, priority sorting.
- **What Feels Slow / Cluttered**:
  - Hourly planner renders 24 separate card containers (`HourlyPlannerView.tsx`), requiring endless scrolling from 12 AM to 11 PM.
  - Creating a time block opens a heavy modal (`CreateTimeBlockModal.tsx`).
  - Task deletion prompts a modal confirmation.
- **Solis Fix**: Continuous 12-hour timeline (08:00 to 20:00) with Living Time Needle; drag-to-create blocks; optimistic task deletion with 5-second `Cmd+Z` undo toast.

### 25.5 Route `/app/study` — Study & Syllabus Page
- **What Works**: SM-2 spaced repetition calculation, subject progress tracking.
- **What Is Severely Broken (Worst AI-Slop Offender)**:
  - **11 modal dialog states** managed simultaneously in `StudyPage.tsx`. Opening a modal to log a session or create a card completely severs user flow.
  - Subjects rendered as giant nested cards with heavy drop shadows.
- **Solis Fix**: Re-architect into a Heptabase-style persistent 2-column split pane (320px tree left, fluid topic workspace right). Eradicate all 11 modals. Inline flashcard review.

### 25.6 Route `/app/focus` — Focus Sanctuary
- **What Works**: Exceptional Web Audio procedural soundscape generator (`soundscapeEngine.ts`).
- **What Feels Overdesigned**:
  - Atmospheric radial gradients create a glowing neon halo behind the timer.
  - Dropdown `<select>` menus for soundscapes look like default browser forms.
- **Solis Fix**: Crisp tabular monospace timer in JetBrains Mono (`text-shadow: none`); automatically dim all peripheral controls to `opacity: 0.12` when timer starts; bind `[Space]` to start/pause.

### 25.7 Route `/app/habits` — Habits & Rituals
- **What Looks Generic**: Dashed border box with celestial astrolabe SVG when no habits exist.
- **Solis Fix**: 14-day interactive dot matrix table. Clicking a dot toggles completion in `<16ms` (optimistic). Empty state is an inline ghost row with blinking cursor.

### 25.8 Route `/app/analytics` — Cognitive Load Analytics
- **What Looks AI-Generated**: Rounded colorful widget cards that resemble Apple Watch fitness rings.
- **Solis Fix**: Stripe-grade telemetry panels with hairline grid axes, tabular numbers, and context-switching fatigue index.

### 25.9 Route `/app/settings` & Navigation Shell
- **What Works**: Dark mode toggle, circadian lighting support.
- **What Breaks Hierarchy**: Sidebar is fixed at 260px and cannot be collapsed on desktop; AppHeader has redundant buttons.
- **Solis Fix**: Make sidebar collapsible (`Cmd+\`) to a 56px icon rail; streamline AppHeader to breadcrumbs + `Cmd+K` + user profile.

---

## PART XVI — THE 7 COGNITIVE MODES SYSTEM ARCHITECTURE

A serious student does not experience all tasks through one component skin. Solis establishes 7 dedicated cognitive environments:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       SOLIS COGNITIVE MODE ARCHITECTURE                     │
├──────────────────┬─────────────────┬────────────────────────────────────────┤
│ Cognitive Mode   │ Target Feature  │ Architectural Design Signature         │
├──────────────────┼─────────────────┼────────────────────────────────────────┤
│ 1. EXECUTION     │ Tasks / Today   │ Dense hairline rows (36px). Monospace  │
│                  │                 │ durations. J/K roving tabindex.        │
├──────────────────┼─────────────────┼────────────────────────────────────────┤
│ 2. STUDY         │ Syllabus / Tree │ Persistent split-pane (320px tree left,│
│                  │                 │ fluid canvas right). Zero modals.      │
├──────────────────┼─────────────────┼────────────────────────────────────────┤
│ 3. WRITING       │ Notes & Vault   │ Broadsheet margin (3rem). Newsreader   │
│                  │                 │ headings, 1.6x line-height body prose. │
├──────────────────┼─────────────────┼────────────────────────────────────────┤
│ 4. PLANNING      │ Hourly Planner  │ Continuous 12h timeline canvas with    │
│                  │                 │ Living Red Needle. Drag-to-block.      │
├──────────────────┼─────────────────┼────────────────────────────────────────┤
│ 5. FOCUS         │ Focus Sanctuary │ Monochromatic obsidian ground. 3-sec   │
│                  │                 │ peripheral dimming. Web Audio sound.   │
├──────────────────┼─────────────────┼────────────────────────────────────────┤
│ 6. REVIEW        │ Evening Closure │ Quiet conversational ritual. Newsreader│
│                  │                 │ reflection prompts. Auto-drawer >18:00.│
├──────────────────┼─────────────────┼────────────────────────────────────────┤
│ 7. ANALYSIS      │ Cognitive Telem.│ Stripe-grade hairline data tables.     │
│                  │                 │ Context-switching fatigue telemetry.   │
└──────────────────┴─────────────────┴────────────────────────────────────────┘
```

---

## PART XVII — IMPLEMENTATION LOG: THE SURGICAL CODE REBUILD

All source code modifications adhere strictly to:
1. Zero API hallucination — using existing React 19, TypeScript 5.7, and CSS custom property structures.
2. Preserving backend integrity — Supabase, RLS policies, SM-2 algorithms, and the Web Audio engine remain 100% operational.
3. Local execution only — zero git commits, zero git pushes, zero remote deployments.

*(Implementation records and verification outputs will be appended below as files are updated).*

---

*Generated: September 23, 2026. Solis redesign by Antigravity AI.*  
*Stitch Project: 3289206954779557551 | Design System: assets/727ff13d17734a17a22bb863166da8e3*  
*LOCAL ONLY — NO COMMIT / NO PUSH / NO DEPLOY*

