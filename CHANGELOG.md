# SOLIS CHANGELOG

All notable changes across the Solis development lifecycle are documented below.

---

## [1.0.0] — Phase 8: Production Excellence & Launch Readiness (2026-08-17)

### Added
* **Vercel SPA Rewrites & Security Headers**: Created `vercel.json` with SPA routing fallbacks and HTTP security headers (`nosniff`, `DENY`, `XSS-Protection`).
* **CSV Formula Injection Mitigation (CWE-1236)**: Hardened `escapeCSVField` in `export.ts` to neutralize dangerous formula triggers (`=`, `+`, `-`, `@`, `\t`, `\r`).
* **Complete Production Documentation**: Added `PRODUCTION_RUNBOOK.md`, `SECURITY.md`, `DEPLOYMENT.md`, `PHASE8_PERFORMANCE_REPORT.md`, and `RELEASE_CHECKLIST.md`.
* **Automated Verification Pipeline**: Added `npm run verify` script executing TypeScript checking, Vitest tests, and Vite production bundle generation in one command.
* **Large-Data Stress Benchmarks**: Added `largeData.test.ts` validating sub-25ms multi-entity search and sub-50ms deterministic intelligence over 1,800+ records.
* **Accessibility Enhancements**: Added `role="switch"` and `aria-checked` attributes to Switch and Checkbox components.

---

## [0.7.0] — Phase 7: Ecosystem, Portability & Personal Workflows (2026-08-17)

### Added
* **Data Sovereignty Hub**: Complete JSON backup export (`solis-export-v1`), individual CSV collection downloads, and conflict-safe import restoration.
* **Command Palette (`Cmd+K` / `Ctrl+K`)**: Multi-entity instant search across Tasks, Notes, Subjects, Topics, Goals, and Navigation routes.
* **Personal Workflow Accelerators**: One-click conversions between Study Plans $\to$ Tasks, Topics $\to$ Focus Blocks, and Focus Sessions $\to$ Knowledge Notes.
* **Notification Preferences & Quiet Hours**: Configurable study reminders with overnight quiet hours suppression.
* **Offline Resilience & Draft Protection**: Added `OfflineBanner` and debounced local storage draft preservation in Knowledge Notes canvas.
* **5-Pillar Weekly Review Ritual (`/app/review`)**: Structured guided reflection for weekly momentum, knowledge breakthroughs, friction calibration, attention rhythm, and upcoming commitments.

---

## [0.6.0] — Phase 6: Deterministic Intelligence & Performance Optimization (2026-08-17)

### Added
* **Cognitive Rhythm & Mastery Analytics**: Mathematical derivation of deep study ratios, consistency percentages, topic retention decay, and planning realism.
* **Performance Reformation**: Split initial monolithic JS bundle by 63% and CSS by 53% via Vite manual chunking and route lazy-loading.
* **Timer Render Optimization**: Cut focus timer re-renders by 98% (1 FPS bailout).
* **In-Memory SWR Caching**: Instant warm-cache initialization across Dashboard, Study, and Analytics pages.

---

## [0.5.0] — Phase 5: Design System & Atmospheric Aesthetics (2026-08-17)

### Added
* **Atmospheric Canvas & Particle Shaders**: Cinematic Day/Night background canvases.
* **Day & Night Themes**: Warm Ivory (Day) and Deep Charcoal (Night) with zero-FOUC synchronous hydration script.
* **Tactile Micro-Interactions**: Smooth card lift hover effects and tactile button presses.

---

## [0.4.0] — Phase 4: Study Operating System & Knowledge Workspace (2026-08-17)

### Added
* **Living Syllabus & Topic Roadmap**: Hierarchy linking Subjects $\to$ Topics $\to$ Study Plans $\to$ Notes.
* **Study Session Logging**: Retention ratings, topic tagging, and synthesis notes.
* **Knowledge Studio**: Editorial thinking canvas with category classification.

---

## [0.3.0] — Phase 3: Identity & PostgreSQL Persistence Engine (2026-08-17)

### Added
* **Supabase Authentication**: Real-time auth state synchronization, auto token refresh, and session recovery.
* **PostgreSQL Schema & RLS**: 100% table isolation under PostgreSQL Row Level Security.
* **Cross-User Test Suite**: Automated isolation verification between User A and User B.

---

## [0.2.0] — Phase 2: Deterministic Productivity Core (2026-08-17)

### Added
* **Task Sanctuary**: Priority matrices, time estimation, and subtask tracking.
* **Focus Sanctuary**: Interval timers, flow metrics, and ambient audio options.
* **Habits & Rituals**: Streak tracking, consistency metrics, and daily matrix.
* **Goal Horizons**: Horizon categorization (`short_term`, `medium_term`, `long_term`, `vision`).

---

## [0.1.0] — Phase 1: Architecture & Foundations (2026-08-17)

### Added
* **React 19 + TypeScript Foundation**: Modular component architecture.
* **Service Abstraction (`IDataService`)**: Pluggable interface supporting Supabase and Mock data layers.
