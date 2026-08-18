# Solis — The Personal Study & Productivity Operating System

> **A calm, sovereign, and deterministic operating environment for deep work, syllabus mastery, knowledge synthesis, and cognitive rhythm.**

---

## 🌟 Overview

Solis is built for scholars, engineers, and deep thinkers who demand data ownership, deterministic intelligence, and distraction-free cognitive flow. Unlike generic task managers, Solis weaves together **curriculum roadmaps**, **focus sanctuaries**, **externalized memory**, and **behavioral consistency** into a unified personal operating system.

---

## 🚀 Key Modules & Capabilities

* **🧭 Daily Flow & Arrival**: Context-aware daily dashboard with arrival quotes, active momentum scores, pending task horizons, and evening closure rituals.
* **📚 Study Studio**: Living syllabus roadmap, topic mastery classification (`unstudied` $\to$ `learning` $\to$ `mastered`), and granular session logs with retention ratings.
* **🔥 Focus Sanctuary**: Distraction-free flow environment with custom interval timers, binaural atmosphere themes, and automated post-session reflection capture.
* **📝 Knowledge Studio**: Externalized memory canvas with markdown support, concept tag taxonomy, and debounced local draft auto-preservation.
* **⚡ Command Palette (`Cmd+K` / `Ctrl+K`)**: Rapid multi-entity search across Tasks, Notes, Subjects, Topics, Goals, and Navigation routes.
* **✨ 5-Pillar Weekly Review Ritual (`/app/review`)**: Structured weekly calibration synthesizing accomplished hours, intellectual breakthroughs, friction points, cognitive rhythm, and next week's commitments.
* **🔒 Data Sovereignty Hub**: Complete JSON backup exports (`solis-export-v1`), individual CSV collection downloads, and conflict-safe workspace restoration.
* **🌗 Day & Night Atmospheres**: Zero-FOUC theme hydration with Warm Ivory (Day) and Deep Charcoal (Night) visual environments.

---

## 🛠️ Technology Stack

* **Frontend**: React 19, TypeScript 5.7, Vite 6
* **Persistence & Auth**: Supabase, PostgreSQL 15+ with Row Level Security (RLS)
* **Styling**: Vanilla CSS Design System with semantic CSS variables
* **Testing**: Vitest (28 test suites, 128 unit/integration tests)
* **Typography**: Newsreader (Editorial Serif) & Plus Jakarta Sans (Interface Sans)

---

## 📦 Quick Start & Development

### 1. Clone & Install
```bash
git clone https://github.com/kunal-raj-dev/Solis-Ultimate-Productivity-tracker.git
cd Solis-Ultimate-Productivity-tracker
npm install
```

### 2. Configure Environment
```bash
cp .env.example .env
```
Provide your Supabase URL and anon key in `.env`:
```env
VITE_DATA_LAYER=supabase
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-publishable-anon-key
```

### 3. Run Development Server
```bash
npm run dev
```

### 4. Execute Full Verification Pipeline
```bash
npm run verify
```
Runs full TypeScript typechecking (`tsc -b`), Vitest test suite (`vitest run`), and production bundle compilation (`vite build`).

---

## 📖 Documentation Index

* [`docs/PRODUCTION_RUNBOOK.md`](docs/PRODUCTION_RUNBOOK.md) — Operational runbook, triage, and rollback procedures.
* [`docs/SECURITY.md`](docs/SECURITY.md) — Threat model, RLS contracts, and vulnerability mitigations.
* [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) — Hosting setup, SPA rewrites, and pre-flight checks.
* [`docs/PHASE8_PERFORMANCE_REPORT.md`](docs/PHASE8_PERFORMANCE_REPORT.md) — Large-data benchmarks (1,800+ entities) and profiling results.
* [`docs/RELEASE_CHECKLIST.md`](docs/RELEASE_CHECKLIST.md) — Production release candidate sign-off checklist.
* [`CHANGELOG.md`](CHANGELOG.md) — Complete Solis development changelog (Phases 1–8).