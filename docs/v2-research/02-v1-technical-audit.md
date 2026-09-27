# Solis V1 — Technical Foundation Audit

**Date:** 2026-09-27
**Scope:** Architecture, data model, state management, engines, realtime, notifications, AI plumbing, testing, build/CI, error-handling patterns, technical debt, scalability.
**Method:** Direct source inspection of this repository + executed verification commands (log in §0.3). All paths are relative to the repo root (`Solis-Ultimate-Productivity-tracker-main/Solis-Ultimate-Productivity-tracker-main/`).

**Evidence labels used throughout:**
- **VERIFIED FACT** — read in source or produced by a command run in this session.
- **OBSERVED PATTERN** — a recurring structure seen across multiple files.
- **EXPERT OPINION** — judgement based on the verified facts, not directly checkable in code.
- **RECOMMENDATION** — what V2 should do; not a statement about current behavior.

**Note on the task brief:** the brief states "React 18 + TypeScript + Vite SPA" as a verified fact. **VERIFIED FACT (corrective):** this repository runs **React 19.2.8** (`package.json` declares `"react": "^19.0.0"`; installed version confirmed via `node -e "require('react/package.json').version"` → `19.2.8`). The rest of the brief's feature inventory was spot-checked and held up (see §2).

---

## 0. Audit Method & Verification Log

### 0.1 What was read
Core files read line-by-line this session: `src/services/dataService.ts`, `src/services/api.interface.ts`, `src/services/supabase/supabaseService.ts`, `src/services/supabase/supabaseClient.ts`, `src/services/supabase/schema.sql`, `src/services/supabase/schema_phase4.sql`, `src/services/supabase/modules/tasks.service.ts`, `src/services/supabase/modules/rooms.service.ts` (partial), `src/services/supabase/modules/presence.service.ts`, `src/services/supabase/modules/types.ts`, `src/services/cache.ts`, `src/services/ai/ai.service.ts`, `src/services/notifications/notification.service.ts` (header), `src/services/offline/pwaSync.ts` (header), `src/services/migration/guestMigration.ts` (header), `src/services/keepaliveService.ts` (header), `src/context/AuthContext.tsx`, `src/context/DataContext.tsx`, `src/context/FocusContext.tsx` (key sections), `src/hooks/useStudyRoom.ts`, `src/hooks/useDataService.ts`, `src/App.tsx`, `src/main.tsx`, `package.json`, `tsconfig.json`, `vite.config.ts`, `vercel.json`, `.gitignore`, `.env`, `.github/workflows/supabase-keepalive.yml`, `supabase/migrations/20260901_phase2_study_rooms.sql`, `supabase/functions/generate-cards/index.ts`, `supabase/migrations/20260922_tasks_part1_evolution.sql` / `20260922_task_timeblocks_and_study_rooms_evolution.sql` / `20260927_study_pacts.sql` (targeted greps), `src/utils/learning/fsrsEngine.ts` (header), `src/utils/intelligence/retentionEngine.ts` (header), `src/services/supabase/modules/study.service.ts` (getTodayPlan), `src/services/mock/mockService.ts` (notify/streak sections), `master.md` (governance header), `TEST_INFRA.md`. Plus repository-wide greps cited inline.

### 0.2 What was NOT verified (stated honestly)
- **No live Supabase connection was exercised.** Whether RLS/migrations actually applied in the cloud project (`tmxrupqgttaxlcrrcubt`) cannot be confirmed from the repo; migrations are SQL files only. Everything about the DB is repo-level evidence.
- **The app was not run in a browser.** No runtime/E2E/manual verification; behavior claims are code-level.
- **No coverage measurement was run** (no coverage tooling configured).
- `src/services/mock/mockService.ts` (2,987 lines) and `src/services/mock/mockData.ts` were only sectionally read, not fully audited.
- Files in `src/services/supabase/modules/` other than those listed were only inspected via targeted greps (cache keys, notify calls), not line-by-line.

### 0.3 Commands executed and results

| Check | Command | Result |
|---|---|---|
| Typecheck | `npx tsc -b` | **Pass** — exit code 0, no output |
| Test suite | `npx vitest run --reporter=basic` | **Pass** — `Test Files 128 passed (128)`, `Tests 1162 passed (1162)`, duration 12.72s |
| Production build | `npm run build` (`tsc -b && vite build`) | **Pass** — exit 0, built in 15.19s; largest chunks: `index-BG0ZHUTK.js` 430.81 kB (gzip 119.82 kB), `vendor-framework` 261.45 kB, `vendor-supabase` 210.88 kB, `StudyPage` 126.68 kB, `TasksPage` 88.20 kB |
| Git state | `git ls-files \| grep -i "\.env"` → only `.env.example`; `git log --oneline` shows active commit history (latest `f529245 feat(phase-6)…`) | `.env` is **not** tracked; repo is a live git repo (the outer working folder is not) |

---

## 1. Architecture Inventory

### 1.1 Stack & toolchain — VERIFIED FACT

| Layer | Technology | Version (installed) |
|---|---|---|
| UI | React + react-dom | 19.2.8 (brief said 18 — incorrect) |
| Language | TypeScript, `strict`, `noUnusedLocals`, `noUnusedParameters`, `noFallthroughCasesInSwitch` | 5.9.3 |
| Build | Vite 6 + `@vitejs/plugin-react`, route-level `lazy()` splitting (`src/App.tsx:11-28`), manual vendor chunking (`vite.config.ts:94-116`) | 6.4.3 |
| Routing | react-router-dom 7 (`BrowserRouter`, nested layouts) | ^7.3.0 |
| Animation | framer-motion | ^13.4.2 |
| Backend SDK | `@supabase/supabase-js` | 2.112.3 |
| Tests | Vitest | 3.2.7 |
| Styling | Plain CSS files per component + token sheets (`src/styles/tokens.css`, `themes.css`, `typography.css`); no CSS-in-JS, no Tailwind | — |

- **VERIFIED FACT:** `tsconfig.json` `include: ["src"]` — `vite.config.ts` is *not* covered by `tsc -b`.
- **VERIFIED FACT:** `vite.config.ts:19-20` embeds a **hardcoded fallback Supabase URL and publishable key** (`https://tmxrupqgttaxlcrrcubt.supabase.co` / `sb_publishable_-vxrkvw_6Ef3rwFd957ymw_gfmM99Co`); the same pair is hardcoded as a fallback in `.github/workflows/supabase-keepalive.yml` (env of the keepalive step). The key is a browser-safe publishable key and `.env` is git-ignored (verified via `git ls-files`), but the project URL+key pair is nonetheless committed in source.
- **VERIFIED FACT:** `package.json` scripts: `build = tsc -b && vite build`, `verify = tsc -b && vitest run && vite build`, `keepalive = node scripts/keepalive.mjs`.
- **VERIFIED FACT:** The only CI workflow is `.github/workflows/supabase-keepalive.yml` — a **Supabase free-tier inactivity ping on a 2-day cron**. There is **no CI that runs typecheck, tests, or build** on push/PR.

### 1.2 Layer map — VERIFIED FACT (structure), EXPERT OPINION (cleanliness)

```
types/ (25 domain type modules, no runtime code)
  ▲
utils/          — pure engines: intelligence/ (13 modules), planning/ (7), learning/ (6),
  ▲               tasks/ (5), notes/, focus/, ai/ (guardrails, RAG, evals, telemetry), calendar/, import/export
  ▲
services/       — api.interface.ts (16 domain service interfaces + IDataService)
  ├─ supabase/  — SupabaseDataService facade + 17 modules + supabaseMappers
  ├─ mock/      — MockDataService (in-memory, same interface)
  ├─ ai/ notifications/ offline/ calendar/ migration/ keepalive cache
  ▲
context/        — AuthContext, DataContext, FocusContext, Theme, Toast, Guide
hooks/          — useStudyRoom (realtime), useTimeBlockScheduler, useAsync, etc.
  ▲
features/ + components/ — 149 .tsx component files, feature pages under src/features/
```

- **VERIFIED FACT:** The service factory (`src/services/dataService.ts:12-139`) enforces: in PROD a missing Supabase config is a **fatal error** (`dataService.ts:31-37`); in dev you opt into Supabase via `VITE_DATA_LAYER`; there is no silent mock fallback in production. Guest→Supabase and Supabase→guest switches are explicit (`switchToMock`, `switchToSupabase`), and `switchToMock(snapshot)` restores the guest workspace on failed auth (`dataService.ts:76-82`).
- **VERIFIED FACT:** A transparent delegating proxy object (`dataService.ts:142-165`) means consumers never hold a stale service reference when the container swaps providers.
- **OBSERVED PATTERN:** `utils/` engines are pure and deterministic (headers state this, e.g. `fsrsEngine.ts` "every function here is pure and deterministic"; `master.md §18` codifies it), with co-located unit tests for nearly every engine.

### 1.3 The IDataService abstraction — VERIFIED FACT

`src/services/api.interface.ts:256-275` defines `IDataService` as 16 sub-services (auth, tasks, study, notes, focus, habits, goals, analytics, flashcards, reviews, routines, resources, reflections, rooms, pacts, presence) plus `subscribe(listener, channels?)` / `notifySubscribers(channel)`.

- **Strengths (EXPERT OPINION, grounded in the interface):** the interface is the single contract both backends implement; `MockDataService` implements the same 16 domains (`mockService.ts:93`), so the entire app is demo-runnable offline and testable without network.
- **Weaknesses (VERIFIED FACT):**
  - Only 9 of 16 domains have a first-class pub/sub channel: `DataEntityChannel = 'tasks' | 'habits' | 'notes' | 'study' | 'focus' | 'goals' | 'pacts' | 'presence' | 'all'` (`api.interface.ts:239`); flashcards, reviews, routines, resources, reflections, rooms broadcast on `'all'` — i.e., **every mutation there wakes every subscriber** (`supabaseService.ts:95-103`).
  - `matchesChannelFilter` (`api.interface.ts:246-254`) means *unscoped* subscribers receive everything — a correct default but easy to trip over.
- **VERIFIED FACT (cache):** `src/services/cache.ts` is a 30-second-TTL in-memory Map. `SupabaseDataService.notify()` invalidates **the entire cache** on every mutation (`supabaseService.ts:121-124` — `queryCache.invalidate()` with no prefix). `MockDataService.notify()` does **not** touch the cache at all (`mockService.ts:356-365` — no `queryCache` reference in the file).
- **VERIFIED FACT (cache-key scope):** several cache keys omit the user id: `tasks:${JSON.stringify(filter||{})}` (`tasks.service.ts:15`), `study_plan_today` (`study.service.ts:294`), `study_rooms_list` (`rooms.service.ts:15`). `time_blocks` keys do include userId (`tasks.service.ts:349`).

### 1.4 Data model & relationships — VERIFIED FACT (from migrations)

**26 tables**, all 26 with `ENABLE ROW LEVEL SECURITY`, 50 policies (counted via grep across `supabase/migrations/*.sql`):

| Domain group | Tables | Key relationships |
|---|---|---|
| Identity | `profiles` (1:1 with `auth.users`, cascade) | — |
| Tasks | `tasks`, `subtasks`, `task_time_blocks` | tasks → subjects (SET NULL), tasks → study_plan_items (`plan_item_id`); time_blocks → tasks, subjects, goals |
| Study | `subjects`, `study_topics`, `study_sessions`, `study_plan_items` | topics → subjects cascade; sessions → subjects/plan_items/focus_sessions; plan_items → subjects/topics/tasks |
| Focus | `focus_sessions` (+ `drift_thoughts` 2026-09-19) | focus_sessions → subjects/plan_items; study_sessions → focus_sessions (focus→study auto-log FK) |
| Habits | `habits`, `habit_records` (UNIQUE(habit_id, completion_date)) | records → habits cascade |
| Goals | `goals`, `goal_milestones` | milestones → goals cascade; goals → subjects |
| Knowledge | `notes` (+ cross-links to subjects/study_sessions/plan_items), `flashcards`, `review_queue_items`, `study_routines`, `study_resources`, `daily_reflections` | — |
| Social | `study_rooms`, `room_participants` (PK room_id+user_id), `room_messages`, `study_room_events`, `study_room_reflections`, `study_pacts` | rooms → auth.users (host cascade) |

RLS design (read from the SQL):
- **VERIFIED FACT:** single-user isolation on every table: `USING (auth.uid() = user_id) WITH CHECK (...)` (e.g. `schema.sql:73`).
- **VERIFIED FACT:** "strictly acyclic" reference-chain policies on phase 4+ tables — child rows additionally verify their parent belongs to the same user via `EXISTS (SELECT 1 FROM parent WHERE parent.id = child.fk AND parent.user_id = auth.uid())` (`schema_phase4.sql:26-147`). Solid defense-in-depth, at the cost of an extra subquery per row policy (see §4).
- **VERIFIED FACT:** social tables open up deliberately: `study_rooms` SELECT is open to all authenticated users (`20260901_phase2_study_rooms.sql:29-31`), `room_participants` SELECT likewise; `room_messages` SELECT/INSERT restricted to current participants via EXISTS subquery (`…:107-128`). This is what makes join-by-code work.
- **VERIFIED FACT:** the task status CHECK was widened in migration `20260922_tasks_part1_evolution.sql:18-21` to `('todo','in_progress','completed','partial','missed','archived')`, matching `TaskStatus` in `src/types/task.ts:3` and the time-block→task status sync in `tasks.service.ts:453-467`. **The type and the DB agree.**
- **VERIFIED FACT:** schema SQL exists twice — `src/services/supabase/schema.sql` (self-described at line 4 as "Reference copy of supabase/migrations/20260817_initial_schema.sql") and the real migration folder `supabase/migrations/` (15 files). The `src/` copies lag behind the migrations (they don't contain the later-stage tables).
- **VERIFIED FACT:** one Supabase Edge Function exists: `supabase/functions/generate-cards/index.ts` — server-side Gemini proxy with JWT auth gate, payload clamping (`MAX_CHUNKS=40`, `MAX_CHUNK_CHARS=4000`, `MAX_COUNT=10`), injection-hardened system instruction, and an honest 503 when `GEMINI_API_KEY` is unset (`index.ts:111-117`).

### 1.5 Auth & identity — VERIFIED FACT

- Supabase Auth with persisted session, auto-refresh, and URL-detection (`supabaseClient.ts:44-50`).
- `AuthContext` (`src/context/AuthContext.tsx`) is unusually careful: a monotonically increasing `seqRef` guard against out-of-order session updates (`:47-52`, `:135-158`), a separate `authOpRef` for login/signup/logout that sync callbacks cannot invalidate (`:49-52`), `onAuthStateChange` handling for `SIGNED_OUT`/`SIGNED_IN`/`TOKEN_REFRESHED`/`INITIAL_SESSION` (`:170-181`), and logout that bumps both guards so a stale session can never override signed-out state (`:285-292`).
- Supabase auth service resolves the user via `getSession` fast path, then `getUser` with a **6-second timeout fallback** (`modules/auth.service.ts:15-23`).
- **Guest mode is a real first-class path:** the mock service snapshots the guest workspace (`mockService.ts:398-407`), signup/login switches to Supabase *before* auth and migrates the snapshot *after* success (`AuthContext.tsx:123-133`, `:216-227`); migration failure never blocks login and archives everything locally with an honest UI (`AuthContext.tsx:64-115`). The migration contract covers subjects, topics, tasks+subtasks, notes, habits+records, flashcards only — goals, plan items and time blocks are intentionally dropped (`guestMigration.ts:60-66`).

### 1.6 Realtime — VERIFIED FACT

`src/hooks/useStudyRoom.ts` (889 lines) is the realtime centerpiece:

- **VERIFIED FACT:** one Supabase channel per room (`room:${roomId}`, `:481-488`) carrying: (1) **Presence** sync keyed on userId (`:493-510`); (2) **Postgres changes** on `study_rooms` (`*`, filtered `id=eq.<roomId>`, DELETE handled as "host closed the room", `:513-539`), `room_messages` INSERT (`:542-575`), `room_participants *` (`:578-600`), `study_room_events` INSERT (`:603-627`); (3) a **5-second polling fallback** on `getRoom` that merges state only on actual diff (`:662-681`); (4) reconnect detection with a 3-second debounce before showing "reconnecting" (`:649-658`).
- **VERIFIED FACT:** the **authoritative epoch timer** is computed purely from server-side state (`computeAuthoritativeRemaining`, `:117-142`): `remaining = target − pausedElapsed − (now − startedAt)`; all clients converge without a leader. A 500 ms tick loop (`:298-321`) renders it.
- **VERIFIED FACT:** **host failover** is a deterministic client election: when the host is absent from participants, the oldest participant (by `joinedAt` then userId) promotes itself via an idempotent service call, with a once-per-room latch that is only set *after* success (`:205-239`); the DB side is `promoteNextHost` in `api.interface.ts:201-207` + migration `20260926_phase6_room_host_failover.sql`.
- **VERIFIED FACT:** in mock mode, a per-room **BroadcastChannel** (`solis_room_${roomId}`, `:459-476`) mirrors joins/timer/chat/status between tabs, with a sync-handshake (`room_sync_request`/`room_sync_state`) that buffers late replies so a late tab converges (`:94-115`, `:346-371`).
- **VERIFIED FACT (weaknesses):** (a) `isHost` mixes a `localStorage` flag (`solis_created_room_${id}`) with **name/email heuristics** — including `user.email.toLowerCase().startsWith(room.hostName.toLowerCase())` (`:173-182`) — which is client-side identity guessing, not server authority; (b) each incoming message INSERT triggers a per-message `profiles` fetch — an N+1 pattern under chat load (`:550-573`), even though `getMessages` already joins `profiles:user_id` server-side (`rooms.service.ts:287-296`); (c) the 5-second poll runs unconditionally even when realtime is healthy.
- **VERIFIED FACT:** ambient peer presence (`dataService.presence`) is **fully simulated**: `SupabasePresenceService` serves a hardcoded array of four fictional peers ("Elena Rostova", "Marcus Chen", …) from an in-memory array; cheers and ghost mode mutate only local state + localStorage (`modules/presence.service.ts:8-49, 120-160`). It is registered inside the *production* `SupabaseDataService` (`supabaseService.ts:93`). Its only consumer is `AmbientPeerPresenceWidget.tsx`. **This contradicts the repo's own constitutional rule** "No Fake/Simulated Integrations" (`master.md §1.2 rule 5`).

### 1.7 Notifications — VERIFIED FACT

- Single canonical store in `localStorage` (`solis_notifications_inbox_v1`) with one-time migration from a legacy key and from a second legacy prefs store (`notification.service.ts:10-15`, `88-110`).
- Quiet-hours logic is a pure exported function supporting overnight windows (`:56-77`); browser Notification API + a chime fallback via the haptics/soundscape engine (`:3-8`).
- **VERIFIED FACT:** `webPushEnabled: false` by default and there is no server push, service-worker push, or backend notification delivery — notifications are device-local. **EXPERT OPINION:** fine for a single-device student tool; a real gap if V2 promises cross-device.

### 1.8 Integrations — VERIFIED FACT

- **Anki**: import via `utils/import/deckImporter.ts` (703 lines) + `lmsImporter.ts` (686) + `apkg` fixture-tested (`utils/learning/__tests__/ankiPackage.test.ts`); export via `utils/export/ankiExporter.ts`; Anki package test exists.
- **iCal**: `utils/calendar/icsGenerator.ts` + `icsParser.ts` (460 lines) with dedicated tests; `services/calendar/calendar.service.ts` uses `Promise.allSettled`.
- **Backups**: JSON/CSV export/import (`utils/export.ts`, `utils/import.ts` — 727 lines), exercised by `__tests__/export.test.ts`, `import.test.ts`.
- **PWA/offline**: `services/offline/pwaSync.ts` (612 lines) — an IndexedDB **write-ahead mutation log**: every mutating Supabase call is logged first, purged on success, replayed FIFO on reconnect, and server-rejected entries are purged rather than retried (header comments `:9-19`); queued entries are **bound to the userId that created them** so they can't replay into another account (`:42-52`). A service worker keeps the shell available (`public/solis-offline-sw.js` referenced at `:78`).
- **Keepalive**: three independent implementations — a Vercel edge function cron (`api/keepalive.ts` + `vercel.json` cron `0 12 * * *`), a GitHub Actions cron, and an in-app client service (`keepaliveService.ts` with health states `healthy | waking_up | paused | offline | mock | error` feeding the OfflineBanner). Plus a dev-server middleware in `vite.config.ts:8-83`.

### 1.9 AI plumbing — VERIFIED FACT

`src/services/ai/ai.service.ts` (646 lines) implements a deliberate three-tier chain of custody for grounded flashcards (`:461-525`):
1. **Authenticated Edge Function proxy** (`generate-cards`) — Gemini key lives server-side; client sends only chunk payloads; user JWT verified (`index.ts:99-125`).
2. **Direct Gemini** with the user's own key — key read from `sessionStorage` (`solis_gemini_api_key`), with a documented legacy `localStorage` fallback and env-var option (`ai.service.ts:220-229`).
3. **Deterministic extraction** — pure, chunk-grounded mining of "Term: definition" / "X is Y" patterns (`:145-217`), always available with no key.

Supporting machinery, all verified:
- **Grounding gate** `validateGroundedCards` (`:99-133`): any card whose `sourceChunkId` isn't in the provided chunk set is dropped — hallucinated citations cannot render.
- **Guardrails**: `utils/ai/guardrails.ts` — input sanitization with delimiters, hardened system prompts, output redaction, prompt-injection detection; `askSolis` blocks flagged queries at score ≥ 0.8 (`ai.service.ts:586-589`).
- **RAG without embeddings**: BM25 (k1=1.5, b=0.75) + deterministic hashed token/trigram similarity, fused by Reciprocal Rank Fusion (k=60), then a precision reranker (`:405-440`; `utils/ai/ragPipeline.ts`, 459 lines).
- **Faithfulness evaluation** on Ask Solis output; below-threshold results warn but still render (`:617-624`) — **OBSERVED PATTERN: detect-and-warn, not detect-and-block.**
- **Local telemetry** `utils/ai/telemetry.ts` records prompt/completion text and durations (`:337-343`) — device-local only, no external sink.
- Non-grounded AI paths (quiz generation, weekly synthesis, adaptive suggester) all use the same sanitize → hardened prompt → robust JSON parse (`:554-643`) pipeline.

### 1.10 Error / loading / partial-failure patterns — VERIFIED FACT

- **ErrorBoundary** wraps the whole tree once, at `layouts/RootLayout.tsx:15` — with reset and navigate-home actions (`ErrorBoundary.tsx:36-45`). One boundary, no per-route boundaries.
- **Partial-failure resilience** is a real pattern: 10 feature entry points load with `Promise.allSettled` and render a shared amber `PartialDataWarningBanner` with retry when slices fail (grep-verified in `DashboardPage`, `TasksPage`, `NotesPage`, `HabitsPage`, `GoalsPage`, `AnalyticsPage`, `WeeklyReviewPage`, `RoomsPage`, `useStudyPage`, `AppLayout`).
- **`useAsync`** (`hooks/useDataService.ts:3-25`) is the generic loading/error/refetch primitive; feature pages mostly hand-roll `useState` + `useEffect` + try/catch loads instead of adopting it (OBSERVED PATTERN from page reads).
- **Graceful degradation** on missing tables: `getTimeBlocks` catches a Supabase error and returns `[]` with a console warn (`tasks.service.ts:361-365`) — pragmatic for dev, but it also swallows genuine production query errors.
- **Cross-domain write chains** (focus→study→habit→task→plan-item in `FocusContext.saveReflection`, `:715-829`) wrap each downstream write in its own try/catch with comments like "never block the session flow on habit convenience" (`:792-799`). Result: **no single failure loses the focus session**, but there is no reconciliation/retry for the skipped side-effects.
- **Console-based observability:** 114 `console.error/warn` sites in non-test source; **no Sentry/PostHog/external sink** (grep for sentry|posthog → 0). Only 2 `TODO/FIXME` markers in the whole `src/`.

---

## 2. System-by-System Assessment

Scale: **Implemented** (exists, wired end-to-end) · **Working** (implemented + tested + consistent across backends) · **Partial** (works but with material gaps) · **Weak** (exists in name, unreliable or simulated) · **Debt** (works today, structurally fragile).

| System | Rating | Evidence & notes |
|---|---|---|
| **Service abstraction (IDataService)** | **Working** | 16 domains × 2 backends behind one contract (`api.interface.ts`), fatal-config guard in prod (`dataService.ts:31-37`), runtime provider switching. Weakness: partial channel coverage, all-or-nothing cache invalidation (§1.3). |
| **Auth & guest migration** | **Working** | Race-guarded context (`AuthContext.tsx:47-52`), 6s `getUser` timeout (`auth.service.ts:19`), guest snapshot→cloud migration with honest failure UI (`AuthContext.tsx:64-115`); dedicated tests (`authReliability`, `logout`, `truthfulState`). |
| **Data model / RLS** | **Working** | 26/26 tables RLS-enabled, 50 policies, acyclic parent-check policies, status/type agreement verified. Cannot verify applied state in the live project (§0.2). |
| **Tasks (list/NLP/recurrence/time-blocking/replan)** | **Implemented, Debt-leaning** | NLP parser, recurrence engine, replan engine, micro-stepper, workload calculators all exist with tests (`utils/tasks/*`). But: `getTasks` fetches **all** user tasks then filters time/search in JS (`tasks.service.ts:14-67`); the PGRST204 "schema cache" retry silently re-sends payloads with new columns stripped (`:117-125, 172-186`) — a migration-drift band-aid that can **write fewer fields than the user entered**; subtask toggle does 3 round trips + task auto-complete (`:276-314`). |
| **Study (subjects/topics/FSRS/sessions)** | **Working** | FSRS-5 engine with published weight vector, SM-2 column encoding for back-compat (`fsrsEngine.ts:20-60`), 12 leech tests, exam-cram mode; `getTodayPlan` joins subjects and computes actual minutes — but fetches **all** plan items and **all** sessions regardless of date (`study.service.ts:293-321`). |
| **Focus Room (timers, soundscapes, tab defense, reflection)** | **Working** | RAF-based precision timing with stopwatch epoch accumulation (`FocusContext.tsx:388-457`), Web-Audio synthesized soundscapes (`utils/focus/soundscapeEngine.ts`), tab-defense + drift pad with persistence, pre-session energy calibration, session intelligence — all unit-tested (`focus/__tests__/*`). |
| **Cross-domain auto-wiring (focus→study log, habit auto-toggle, task progress)** | **Working (Partial at the edges)** | `FocusContext.tsx:753-829` verified end-to-end; each side-effect individually try/catch'd; **no reconciliation** if a middle step fails (focus session survives; the study log or task progress may not). |
| **Realtime Study Rooms** | **Implemented (Partial robustness)** | Presence + 3 Postgres-change listeners + 5s poll + epoch timer + host failover + demo BroadcastChannel (§1.6). Gaps: client-side host heuristics incl. email-prefix matching (`useStudyRoom.ts:179`), N+1 profile fetch per chat message (`:554-558`), unconditional polling. |
| **Peer presence ("ambient peers")** | **Weak** | Entirely simulated with fictional users, even in Supabase mode (`presence.service.ts:8-49`; `supabaseService.ts:93`). Real Supabase Presence *is* used — but only inside study rooms, not for this widget. Violates the repo's own no-fake-integration rule (`master.md §1.2 rule 5`). |
| **Notes (wikilinks, graph, history, pinning, resurfacing)** | **Working** | Pure modules (`utils/notes/*`: wikilinks, markdownParser, noteHistory, notePins, resurfacing, inlineCardParser) each with tests; `NotesPage` is 1,497 lines (see debt). |
| **Habits (boolean/quant/tiered, streaks, heatmap, auto-toggle)** | **Working** | Streak engine with grace days + amnesty + frequency variants (`mockService.ts:367-391` call-site), tiered habits & insights unit-tested (`utils/habits/__tests__`), habit auto-toggle wired from focus reflection (`FocusContext.tsx:794-798`). |
| **Goals (milestones, feasibility, generated plans)** | **Working** | `utils/planning/examFeasibility.ts`, `goalPlanGenerator.ts`, `syllabusPacing.ts`, `timeCushion.ts` all present and tested; UI components under `features/goals/` + `components/features/Goals/`. |
| **Analytics / intelligence engine** | **Working** | Deterministic 13-module engine (`utils/intelligence/`): topic histories → mastery → retention → subject health → explainable recommendations, plus circadian synthesis, attention, rhythm, sufficiency, narrative report. `createLearningIntelligenceSnapshot` is a single pure computation boundary (`intelligence/index.ts:38-71`). Deterministic retention policy is threshold-based and config-driven (`retentionEngine.ts:1-17`). Tests: `intelligence`, `masteryIntelligence`, `circadianSynthesis`, `narrativeReport`, calibration. |
| **Weekly Review & next-week seeding** | **Working** | `features/review/WeeklyReviewPage.tsx` (909 lines) with history/streak; review tests exist. |
| **Notifications** | **Partial** | Full local pipeline (prefs, inbox, quiet hours, chime, browser notifs) but **device-local only**; no server push, no cross-device (§1.7). |
| **Settings / AI keys / backups / iCal** | **Working** | Session-scoped key with legacy fallback (`ai.service.ts:220-229`), model migration logic, JSON/CSV backup import/export, ICS parse/generate — all tested. |
| **Offline / PWA sync** | **Working** | Honest WAL semantics with per-user ownership of queued mutations (`pwaSync.ts:42-52`), FIFO replay, server-rejection purge; `phase8PwaSync.test.ts` exists. |
| **AI (Ask Solis, Scholar Report, weekly narrative, grounded cards)** | **Working (strong)** | Three-tier generation, grounding gate, guardrails, BM25+RRF RAG, faithfulness scoring, edge proxy (§1.9). Caveat: faithfulness below threshold only warns (`ai.service.ts:617-624`). |
| **Testing** | **Partial** | 128 files / 1,162 tests, all green (run in §0.3) — but 100% logic-level: **0 `.test.tsx` files vs 149 component `.tsx` files** (counted in §0.3). No jsdom/RTL, no E2E despite `TEST_INFRA.md` claiming DOM-level tiers. |
| **Build & CI** | **Partial** | `npm run verify` is excellent as a local gate, but **CI never runs it** — the only workflow pings Supabase every 2 days (§1.1). |
| **Observability** | **Weak** | Console-only (114 sites), local-only AI telemetry, no error reporting sink, no perf marks (§1.10). |

---

## 3. Technical Debt Register

Classifications: **Must fix before V2** (will block or corrupt V2 work if left) · **Improve during V2** (schedule it) · **Can wait**.

### 3.1 Must fix before V2

| # | Debt | Evidence | Why it blocks V2 |
|---|---|---|---|
| D1 | **Simulated peer presence shipped in the production service** | `modules/presence.service.ts:8-49` (fictional peers, in-memory), registered in `SupabaseDataService` at `supabaseService.ts:93`; violates `master.md §1.2 rule 5` | V2 social features will be built on a fake foundation; the honest data path (room Presence) already exists and should back this widget or the widget should be labeled/removed |
| D2 | **No CI on push/PR** — only a keepalive cron | `.github/workflows/` contains exactly one file (`supabase-keepalive.yml`) | `tsc -b` + 1,162 tests + build exist and are fast (~30s total); without CI, regressions land silently — the single cheapest high-value fix |
| D3 | **Migration-drift retry masks schema errors**: on `PGRST204`/"schema cache"/"column" errors, task create/update silently re-sends the payload **with the new columns removed** | `tasks.service.ts:117-125` (create), `:172-186` (update) | A user's recurrence/deferral data can be silently dropped; V2 schema evolution will multiply these codepaths. Replace with a deploy-time schema check and fail loudly |
| D4 | **Fetch-all-then-filter-in-JS on hot paths** | tasks (`tasks.service.ts:14-67` — all tasks, then JS time/search filters), `getTodayPlan` fetches all plan items + all sessions (`study.service.ts:293-321`), notes/analytics similar | Client memory and latency grow linearly with account age; V2 features (aggregations, more history) will compound it. Needs date-scoped queries + server-side filters + pagination |
| D5 | **Cache keys not user-scoped + mock provider doesn't invalidate the cache** | `tasks.service.ts:15`, `study.service.ts:294`, `rooms.service.ts:15` omit userId; `mockService.ts:356-365` never calls `queryCache.invalidate()`; Supabase notify clears everything (`supabaseService.ts:121-124`) | 30s TTL is the only guard; account switches on a shared browser can serve cross-account data within TTL, and correctness currently depends on cache TTL timing rather than invariants |
| D6 | **Monolithic page components** | `TasksPage.tsx` 1,584 · `NotesPage.tsx` 1,497 · `SettingsPage.tsx` 1,459 · `FocusPage.tsx` 1,373 · `DashboardPage.tsx` 1,368 · `ActiveRoomView.tsx` 1,322 · `HabitsPage.tsx` 1,020 · `AnalyticsPage.tsx` 996; plus `mockService.ts` 2,987 | Every V2 feature touching these files is a merge hazard; the extraction pattern already exists (`useStudyPage.ts` 767-line hook, `features/study/components/*`) — repeat it |

### 3.2 Improve during V2

| # | Debt | Evidence | Notes |
|---|---|---|---|
| D7 | Client-side host identity heuristics (localStorage flag, name equality, email-prefix match) | `useStudyRoom.ts:173-182` | Replace with server-derived `is_host` (join profile on room fetch); heuristics mis-assign authority |
| D8 | Realtime inefficiencies: 5s poll always on; 500ms tick; N+1 profile fetch per chat INSERT | `useStudyRoom.ts:662-681, 318-321, 550-573` | Poll should back off when `SUBSCRIBED`; message handler should derive name from a cached profile map or the room's participants list |
| D9 | Whole-cache invalidation on every mutation | `supabaseService.ts:121-124` | Makes the scoped channel system (`api.interface.ts:239`) half-illusory: events are scoped, cache invalidation is not. Add per-channel prefix invalidation |
| D10 | Zero component tests (0 `.test.tsx` vs 149 `.tsx`); no RTL/jsdom; no E2E despite `TEST_INFRA.md` tiers | Counts in §0.3 | Engines are exemplary; the React layer — where regressions are most user-visible — is untested |
| D11 | No error/performance telemetry sink; 114 console sites; ErrorBoundary only at root | grep results §1.10; `RootLayout.tsx:15` | Add a lightweight sink (even self-hosted) + per-route boundaries; V2 can't debug what it can't see |
| D12 | Hardcoded Supabase URL + publishable key fallbacks committed in source | `vite.config.ts:19-20`, `.github/workflows/supabase-keepalive.yml` env block | Not a secret leak (publishable key is public by design; `.env` untracked — verified), but it couples source to one project and invites paste-over during V2 infra changes |
| D13 | Notifications are device-local only | §1.7 | Decide early: either implement real push (needs server component) or reposition V2 copy |
| D14 | Duplicated logic across boundary: LLM JSON extraction exists in `ai.service.parseJsonFromLLM` (`ai.service.ts:353-399`) *and* re-implemented in the edge function (`generate-cards/index.ts:180-196`) | — | Extract a shared module (the edge function can't import `src/`, so promote the parser to a shared package or accept the documented duplicate) |
| D15 | Cross-domain write chains without reconciliation | `FocusContext.tsx:715-829` | Acceptable per-step best-effort design, but a periodic reconciler (or moving the chain into a single RPC/transaction) would remove the silent-skip class of bugs |
| D16 | Guest migration silently drops goals, plan items, time blocks | `guestMigration.ts:60-66` (documented intent) | At minimum surface "N items not carried over" in the migration UI; today only a generic message shows (`AuthContext.tsx:76-81`) |
| D17 | Schema SQL duplicated in `src/services/supabase/schema*.sql` as "reference copies" that lag the migrations | `schema.sql:4`, `schema_phase4.sql` vs `supabase/migrations/` | Two sources of truth; delete the copies or generate them |
| D18 | 38 `as any` casts in src + ~40 `: any` params in supabase modules (row payloads) | grep counts §0.3 | Introduce generated DB types (`supabase gen types`) at V2 start; mappers become checked |

### 3.3 Can wait

| # | Item | Evidence |
|---|---|---|
| D19 | `tsconfig.json` doesn't include `vite.config.ts` (`include: ["src"]`) — build config is untyped by `tsc -b` | `tsconfig.json` |
| D20 | `envPrefix: ['VITE_','NEXT_PUBLIC_']` legacy support | `vite.config.ts:88` |
| D21 | Four keepalive implementations (dev middleware, edge fn, GH Action, client service) — more ops surface than the product needs | §1.8 |
| D22 | `getMessages(limit=100)` default with ascending order returns the *oldest* 100, not the newest — fine while rooms are young, wrong at scale | `rooms.service.ts:287-296` |
| D23 | Only 2 TODO/FIXME markers in src — hygiene is good; keep it | grep §0.3 |

---

## 4. Scalability Observations

**Expert opinion grounded in the verified patterns above:**

1. **Read-path growth is linear and client-side.** Fetch-all + JS-filter (D4) means a 2-year-old account with thousands of tasks/sessions loads everything on every cache miss. The 30s whole-cache TTL (D9) means navigation refetches the full set frequently. This is the dominant scaling ceiling.
2. **RLS "acyclic" policies add per-row EXISTS subqueries** on the hottest tables (`tasks`, `study_sessions`, `notes` — `schema_phase4.sql:67-123`). At single-user scale this is fine; combined with the fetch-all pattern it multiplies DB work per read. Postgres can optimize these, but V2 should benchmark before adding more chained checks.
3. **Realtime is per-room-scoped and filtered** (`filter: id=eq.<roomId>`, `room_id=eq.<roomId>` — `useStudyRoom.ts:513-627`), which is the right shape. The unconditional 5s poll and per-message profile fetch (D8) cap healthy room sizes more than the pub/sub itself.
4. **Pub/sub channel coverage is incomplete** (7 of 16 domains scoped; rest broadcast `'all'`), and cache invalidation is global — so a single flashcard review wakes every mounted page's refetch today. Fixing D9 is a bigger win than adding more channels.
5. **The intelligence engine is O(history) on the client** — `createLearningIntelligenceSnapshot` recomputes topic histories/mastery/retention from raw records (`intelligence/index.ts:38-71`). It's pure and testable (a strength), but with years of data it will need memoization boundaries or server-side precomputation. The memoized snapshot pattern is already the right seam.
6. **Single-user-per-account model with social islands**: rooms/pacts/presence tables are multi-user by design and correctly RLS'd for their sharing model; everything else is strictly private. V2 social ambitions (D1) should build on the rooms/pacts pattern rather than on the simulated presence service.
7. **Storage of large artifacts is client-side**: notes, backups, PDFs (`SplitScreenPdfWorkspace`) live in the browser/localStorage/IndexDB; there is no object storage in the migrations. Cross-device continuity is therefore limited to what syncs through Supabase tables — a V2 product decision, not just an engineering one.

---

## 5. Bottom Line

**Verified facts:** the foundation is unusually disciplined for an app this size — a real 16-domain service abstraction with two backends, 26 RLS-protected tables matching the TS types, deterministic pure engines with 1,162 passing tests, a three-tier honest AI pipeline with grounding gates, a race-guarded auth flow with guest migration, and an offline WAL with per-user ownership. Typecheck, the full test suite, and the production build all pass when executed here (§0.3).

**Expert opinion:** the two structural risks for V2 are (a) the read path (fetch-all + JS joins + global cache invalidation) and (b) the six monolithic feature pages; both are already straining at V1 scale. The one integrity problem is the simulated peer presence service, which contradicts the repository's own constitutional rule and should be resolved before any V2 social work. The cheapest unambiguous win is CI that runs the existing `npm run verify`.

*Nothing in this document should be read as verifying the live cloud database or runtime behavior — those were out of reach of a source-level audit (§0.2).*
