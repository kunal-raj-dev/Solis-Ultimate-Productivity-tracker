# Solis V1 — Product Surface Audit

**Document ID**: `docs/v2-research/01-v1-product-audit.md`
**Stage**: Solis V2 Research & Product Planning — input 01
**Date**: 2026-09-27
**Method**: Direct source inspection of `src/` (≈450 TS/TSX files) plus docs-folder cross-check. No files were modified. Verification commands were executed in this session and are quoted verbatim.
**Repo audited**: the nested repository root `Solis-Ultimate-Productivity-tracker-main/` (the outer folder is only a workspace wrapper).

---

## 0. Evidence & Verification Trail (what was actually run)

| Check | Command | Result |
|---|---|---|
| Typecheck | `npm run typecheck` (= `tsc -b`) | Passed, 0 errors, no output |
| Unit/integration tests | `npx vitest run` | **128 test files, 1162 tests, all passed** (~9.5s) |
| Production build | `npx vite build` | Passed, **built in 7.20s**, route-level code-split chunks visible (e.g. `dist/assets/StudyPage-*.js` 126.68 kB) |

**Not run in this audit** (therefore reported as *not verified here*, not as failures): a live-browser pass (Lighthouse/axe accessibility scoring, mobile-viewport interaction testing), a connected Supabase runtime session, and the Vercel deployment. Every claim below that depends on runtime behavior in a real browser is labeled OPINION or PATTERN rather than FACT.

**Labeling convention used throughout:**
- **VERIFIED FACT** — read directly in source this session, with `path:line` citation.
- **VERIFIED BY RUN** — executed command listed in §0 or inline.
- **OBSERVED PATTERN** — structural reading of code that suggests a behavior or trend; not confirmed at runtime.
- **EXPERT OPINION** — analyst judgment.
- **RECOMMENDATION** — proposed action for V2.

---

## 1. Executive Summary

Solis V1 is an unusually complete, unusually coherent single-developer-scale product. The advertised feature surface (plan → focus → capture → recall → review → analyze) is not a facade: every headline capability traces to real, wired-up code with loading/error/empty states, optimistic updates with undo, and cross-domain automation. The deterministic core (time blocking, SM-2/FSRS, retention decay, mastery, circadian synthesis, exam time-cushion) is genuinely deterministic and well-tested; AI (Gemini) is additive, layered behind a 3-tier fallback (server edge proxy → user key → local extraction) so nothing breaks without it.

The three structural debts that matter most for V2:

1. **Device-local state fragmentation** — 37 source files read/write `localStorage` with ~40 distinct `solis_*` keys (`grep -rl "localStorage" src` → 37 files; unique key count → 40). Daily intention, morning-ritual completion, welcome-back choices, note pins, note version history, notification inbox, sidebar state, gentle-start capacity all live only on the device even when the cloud backend is active. Cloud users switching devices lose invisible-but-real product state.
2. **Three coexisting scheduling models** — derived dashboard time blocks (`DashboardPage.tsx:184-193` `buildTimeBlocks`), persisted task time blocks (`TasksPage.tsx` hourly/weekly planner), and study plan items (`StudyPage.tsx` agenda) are bridged (convert-to-task, plan-item completion prompts) but remain three mental models of "where is my time".
3. **Page-level fan-out data loading** — Dashboard and Analytics each issue ~13 parallel collection fetches per visit (`DashboardPage.tsx:279-309`, `AnalyticsPage.tsx:106+`), softened by cache-first seeds and `Promise.allSettled` partial-failure banners but structurally O(entities) per view.

**Corrections to the brief that was given to this audit:**
- The brief said "React 18". **VERIFIED FACT**: `package.json:22-23` declares `react: ^19.0.0` and installed versions are `react 19.2.8` / `react-dom 19.2.8` (checked via `node -e require(...)`). React Router is `^7.3.0`, Supabase JS `^2.112.3`.
- Docs claim old counts ("34/34 suites, 174 tests" in `docs/SOLIS_7_DAY_PRODUCT_VALIDATION.md`; "83 files / 750 tests" in `docs/SOLIS_COMPREHENSIVE_AUDIT_AND_PRODUCT_STRATEGY.md`). **VERIFIED BY RUN**: current truth is 128 files / 1162 tests passing. The docs are directionally right (green suite, clean build) but numerically stale.
- The comprehensive-audit doc's "brutally honest" criticisms (broken loop, all-or-nothing streaks, no time cushion) are **largely already fixed in code** since that document was written: streak amnesty exists (`DashboardPage.tsx:564-608`), a time-cushion engine exists (`src/utils/planning/timeCushion.ts`, consumed in `AppLayout.tsx:178-190`), calm roll-over exists (`TasksPage.tsx:666-714`), inline `::` flashcards exist (`NotesPage.tsx:595-650`). The doc should not be treated as current-state.

---

## 2. Verified System Facts

- **App shell & routes** — 18 routes: landing `/`, 4 auth routes, and 14 app routes under `/app` (dashboard, tasks, study, focus, habits, goals, analytics, notes, review, rooms, rooms/:roomId, settings, guides, guides/:guideId), all lazy-loaded behind `Suspense` with a 404 redirect home. `src/App.tsx:29-76`.
- **Data layer** — `IDataService` facade with 16 sub-services (auth, tasks, study, notes, focus, habits, goals, analytics, flashcards, reviews, routines, resources, reflections, rooms, pacts, presence) + scoped pub/sub channels. `src/services/api.interface.ts:256-275`. Production **throws** if Supabase is not configured (`dataService.ts:31-37`); dev defaults to an in-memory mock with localStorage persistence; guest workspaces can be snapshotted and migrated into the cloud account (`AuthContext.tsx:64-115`, `services/migration/guestMigration.ts`).
- **Realtime** — Supabase Realtime channels for rooms/presence; in mock mode, per-room `BroadcastChannel` sync mirrors host/timer state across tabs (`src/hooks/useStudyRoom.ts:46-115`).
- **Offline** — IndexedDB write-ahead mutation log that queues failed cloud mutations and replays FIFO on reconnect, plus a service worker for the app shell (`src/services/offline/pwaSync.ts:1-40`, `public/solis-offline-sw.js`).
- **AI** — Gemini via user-supplied session-scoped key (`sessionStorage`, `SettingsPage.tsx:38-39`), plus an authenticated Supabase Edge Function proxy path (`GENERATE_CARDS_EDGE_FUNCTION`, `ai.service.ts:39-41`). Guardrails (prompt-injection detection, output redaction), local RAG (BM25 + hashed trigram index + RRF + reranker), faithfulness scoring, telemetry (`src/services/ai/ai.service.ts`, `src/utils/ai/*`).
- **Deployment** — `vercel.json` with keepalive cron (`/api/keepalive` daily 12:00), SPA rewrites, and security headers (HSTS, X-Frame-Options DENY, Permissions-Policy).
- **Chrome companion** — `public/chrome-extension/` directory exists; Focus tab-defense uses `document.visibilityState` drift detection locally (`FocusPage.tsx:183-217`). The extension's actual store behavior was **not inspected** in this pass — report as unverified.

---

## 3. Part 1 — V1 Capability Map

Status legend: **Implemented** (code exists and is wired) / **Working correctly** (wired + tested or internally consistent with fallbacks) / **Partially complete** / **Weak** (exists but shallow/fragile) / **Technical debt** / **V2 opportunity**.

### 3.1 Planning & Daily Structure

| Capability | Status | Evidence & notes |
|---|---|---|
| Daily cockpit (Today) | Implemented, **Working correctly** | `DashboardPage.tsx` (1369 lines): cache-first hydration (68-97), 13-slice `Promise.allSettled` load with partial-data banner (279-351, 872), skeleton state (856-866), empty stubs (1078-1084, 1185-1191, 1254-1264). |
| Daily intention anchor | Implemented; **Technical debt (persistence)** | Free-text intention + goal link, debounced save with unmount flush (`DashboardPage.tsx:199-245, 258-275`). Stored in `localStorage` only — never synced. |
| Morning planning ritual (90s) | Implemented | Time-of-day CTA before 14:00 with done-state (`DashboardPage.tsx:978-993`); completion flag per-day in `localStorage` (250-256); `MorningPlanningModal` + `morningRitual.ts` engine with tests (`src/utils/planning/__tests__/morningRitual.test.ts` in green suite). |
| Evening closure ritual | Implemented | CTA after 17:00 (`DashboardPage.tsx:995-1005`); `handleSaveEveningClosure` auto-creates tomorrow-intention tasks AND a reflection note (722-777). |
| Recurring routines | Implemented | `IRoutineService` with `materializeRoutinesForToday()` (`api.interface.ts:158-164`); management modal + manual "Sync today" on Dashboard and Study (`DashboardPage.tsx:667-679`, `StudyPage.tsx:394-406`). |
| Unified 24h timeline (derived) | Implemented, Working correctly | `buildTimeBlocks` merges study plan + task deadlines + focus sessions + routines + persisted blocks; conflict detection + allocation stats (`DashboardPage.tsx:184-196`); expanded grid vs compact ribbon views. |
| Hourly planner (persisted blocks) | Implemented, Working correctly | `HourlyPlannerView.tsx` (724 lines), `CreateTimeBlockModal`, `HourReviewModal` (actual-vs-planned review with reschedule-and-continue, `TasksPage.tsx:568-597`); global block-alert monitor polling every 30s app-wide (`AppLayout.tsx:53-100`). |
| Weekly planner | Implemented | `WeeklyPlannerView.tsx` (540 lines) with drag-free slot-to-day-hour scheduling (`TasksPage.tsx:1322-1363`). |
| Calendar conflicts & free time | Implemented | `utils/planning/timeBlocking.ts` (`findTimeBlockConflicts`), deep-link `?action=replan` auto-reschedule (`TasksPage.tsx:315-350`); external ICS feeds overlaid in the hourly planner (`CalendarOverlayCard` used by `HourlyPlannerView.tsx`). |
| Gentle start / welcome-back re-entry | Implemented, Working correctly | 3+ day absence detection (`DashboardPage.tsx:116-134`); Gentle Start (50% capacity, day-scoped shared key read by both Today and Tasks — `P3F5` comments), streak amnesty per-habit with partial-failure handling (564-608), priority triage (610-617). |
| One-tap deferral ("→ Tomorrow") | Implemented | Zeigarnik deferral with deferralCount + undo toast, duplicated on both pages (`DashboardPage.tsx:488-528`, `TasksPage.tsx:624-664`). |
| Past-block calm roll-over | Implemented | `handleRollPastBlocksToToday` finds next free slot against **today's** full grid (P3F1 fix comment) (`TasksPage.tsx:666-714`). |
| Exam time cushion ("Shovel-style") | Implemented, Working correctly | `calculateTimeCushion` with routine-commitment projection; persistent D-Day pill in the header from any page (`AppLayout.tsx:114-207`, `AppHeader.tsx:135-173`); Exam Command Workspace modal with milestone toggles and 1-tap recall drill / focus launch. |
| Study-plan generation from goals | Implemented | `generateGoalStudyPlanDrafts` (`GoalsPage.tsx:266-300`); weekly review seeds next week's plan (`WeeklyReviewPage.tsx:380-413`). |

**OBSERVED PATTERN**: three scheduling vocabularies coexist (derived timeline blocks, persisted task blocks, study plan items). Bridges exist in both directions (plan item → task: `useStudyPage.ts:518`; block → task status sync: `TasksPage.tsx:546-566`), but a user must still learn which of the three surfaces "owns" a commitment. **OPINION**: this is the single largest IA debt for V2.

### 3.2 Tasks

| Capability | Status | Evidence |
|---|---|---|
| Task CRUD + subtasks | Implemented, Working correctly | `TasksPage.tsx:765-941` with optimistic updates and rollback on failure; subtask add/toggle/delete. |
| 4 views (List / Day Schedule / 7-Day Week / Eisenhower Matrix) | Implemented | `TasksPage.tsx:1134-1373`; URL-driven `?view=` (67-76); keyboard 1/2/3 switching (410-459). |
| NLP capture ("Review DSA at 4pm for 45m !high") | Implemented | `SmartTaskInput` on Dashboard + 3 Tasks views; recurrence fields parsed and persisted (`DashboardPage.tsx:364-394`, `TasksPage.tsx:967-998`); parser in `src/utils/tasks/nlpParser.ts` (tested in green suite). |
| Recurrence | Implemented | `recurrenceEngine.ts`; `isRecurring`/`recurrence` persisted on create (967-984). **OPINION**: surfaced only via NLP/form — no UI to browse the recurrence schedule itself; shallow by product standards. |
| Undo (⌘Z) for complete + delete | Implemented, Working correctly | 5s-window undo stack with toast actions (`TasksPage.tsx:356-459`); delete-undo recreates the task (356-384). |
| Filters, search, sort | Implemented | 6 time filters × 5 categories + title/desc/tag search (`TasksPage.tsx:153-206, 943-958`). |
| Workload capacity bar | Implemented | `calculateWorkload` with gentle-start capacity shared across pages (`TasksPage.tsx:109-141`); auto-replan candidates hook (`734-762`). |
| Task↔focus bridging | Implemented | "Start focus" carries taskId/subjectId/duration via query+state (`TasksPage.tsx:1279-1288`); focus reflection updates task minutes/status (`FocusContext.tsx:802-826`). |
| Error/empty states | Implemented | Sync-error banner with retry, full-error card, per-filter empty copy (`TasksPage.tsx:1086-1131`, `1218-1226`, `1263-1267`). |

### 3.3 Study Management

| Capability | Status | Evidence |
|---|---|---|
| Subjects (archive/restore/delete, colors, target hours) | Implemented | `api.interface.ts:69-95`; `StudyPage.tsx` header + `SubjectFormModals`; delete offers archive-instead (`StudyPage.tsx:480-484`). |
| Syllabus topic trees + mastery levels | Implemented, Working correctly | `SyllabusTopicTree` in a zero-modal split-pane workspace (`StudyPage.tsx:251-359`); focus auto-advances unstudied→learning on exact title match (`FocusContext.tsx:773-787`). |
| Study plan agenda (today queue) | Implemented | `StudyPlanAgenda` with add/toggle/delete/convert-to-task/launch-focus (`StudyPage.tsx:375-412`). |
| Manual session logging | Implemented | `StudyResourceGrid` log-session modal with retention rating 1-5 and "create note from session" option (`StudyPage.tsx:415-441`). |
| Flashcards: create / review / SM-2+FSRS | Implemented, Working correctly | `FlashcardReviewModal`, `recordCardAttempt` (`api.interface.ts:142-149`); engines `src/utils/learning/fsrsEngine.ts`, `spacedRepetition.ts`, `leechDetector.ts`, `examCram.ts` (all covered by tests in `src/utils/learning/__tests__`). |
| Anki import/export + LMS import | Implemented | `.apkg` export via `createAnkiPackageApkg` (`StudyPage.tsx:177-203`); `ImportModal` with deck mode; `utils/import/deckImporter.ts`, `lmsImporter.ts` — import round-trip covered by `src/__tests__/import.test.ts` (9 tests, incl. merge/replace modes). |
| Exam cram mode | Implemented | `ExamCramModal` + cram session flag (`StudyPage.tsx:499-506`). |
| Adaptive suggester | Implemented | AI-first with deterministic fallback toast ("AI offline/unconfigured") (`AdaptiveStudySuggester.tsx:30-42`). |
| Topic intelligence drawer | Implemented | Per-topic history/mastery/retention from the learning snapshot (`StudyPage.tsx:561-578`, `TopicIntelligenceDrawer.tsx`). |
| Resources + citation | Implemented | `ResourceLibraryModal`; resource → note citation (`NotesPage.tsx:339-347`); resource status tracking. |
| Split-screen PDF lecture reader | Implemented | `SplitScreenPdfWorkspace` (`StudyPage.tsx:538-549`). **Not runtime-verified** (file-rendering quality unknown from code alone). |
| Inline flashcards (`Term :: Definition`) | Implemented, Working correctly | Extracted on explicit save only, deduped per-note and per-batch (`NotesPage.tsx:587-650`). |
| Subject health / weekly focus target | Implemented | Weekly hours vs target strip (`StudyPage.tsx:346-356`); subject health engine in `utils/intelligence/subjectHealthEngine.ts`. |

### 3.4 Focus Room

| Capability | Status | Evidence |
|---|---|---|
| Countdown + stopwatch, presets (25/50/5/custom ≤180m) | Implemented | `FocusContext.tsx` (962 lines); presets + custom modal with clamp (`FocusPage.tsx:400-406`). |
| Pre-session energy calibration (3-tap) | Implemented | Low→15m, Steady→25m, Sharp→90m deterministic recommendation (`FocusPage.tsx:67-93, 408-419`); persisted on the session (`FocusContext.tsx:747-748`). |
| Web-Audio soundscapes | Implemented | `utils/focus/soundscapeEngine.ts` synthesizes presets; volume, mute, affinity recommendation from history (`FocusPage.tsx:376-380, 916-943`). |
| Tab defense + drift tracking | Implemented | visibilitychange drift log ≥5s, optional auto-log as internal interruption, Tab Defense modal (`FocusPage.tsx:170-217, 1364-1370`). |
| Interruption counters (internal/external) | Implemented | Manual +1 buttons and drift pad park (`FocusPage.tsx:1183-1266`). |
| Cognitive drift pad (parked thoughts) | Implemented | `CognitiveDriftPad`, Alt+D; parked thoughts carried into reflection and note (`FocusContext.tsx:750, 851-862`). |
| Mid-session checkpoint + zen mode + analog pie | Implemented | Halfway banner (`FocusPage.tsx:984-997`); Z-key zen with exit bar (485-511); countdown-only analog toggle (745-769). |
| Centering breathwork (2m) | Implemented | `CenteringSanctuaryModal` with begin-focus handoff (1296-1300). |
| Post-session reflection → auto-log cascade | Implemented, **Working correctly** — the strongest automation in the app | `FocusContext.saveReflection` (715-895) in one user action: saves FocusSession → auto-logs linked StudySession with retention rating → promotes matching unstudied topic to learning → auto-completes "review flashcards"-type habits (idempotent, `habitAutoToggle.ts`) → updates linked task minutes/status → completes plan item on request → updates time block (actual minutes, partial/complete) → optional distillation note with session metadata → quiet milestone toast. |
| Abort guard | Implemented | Confirmation dialog with honest copy ("Elapsed progress … will not be recorded") (`FocusPage.tsx:1348-1361`). |
| Screen-reader support | Implemented | `aria-live` timer announcements (`FocusPage.tsx:466-482`). |

### 3.5 Collaboration (Rooms, Pacts, Presence)

| Capability | Status | Evidence |
|---|---|---|
| Study rooms: create/join by code, delete | Implemented | `RoomsPage.tsx` with 3 tabs (sanctuaries / pact / history) (46, 245-248); join-by-code (143). |
| Synced timer, breaks, host failover | Implemented, Working correctly | `useStudyRoom` (Supabase realtime + mock BroadcastChannel demo sync with dedup of service-emitted events, `useStudyRoom.ts:46-115`); `promoteNextHost` in the room contract (`api.interface.ts:201-208`). |
| Presence, chat, timeline events | Implemented | `ActiveRoomView.tsx` (1322 lines) with presence/chat/timeline tabs (107); status chips (focusing/idle). |
| Room reflections → personal history | Implemented | `saveRoomReflection`/`getUserRoomHistory` in the contract (`api.interface.ts:197-200`); history tab on RoomsPage. |
| Ambient peer presence (site-wide) | Implemented | Passive "N scholars focusing right now" header chip polling every 60s — deliberately NOT on the mutation bus to avoid refetch storms (`AppHeader.tsx:43-71`); dashboard widget with ghost mode (`AmbientPeerPresenceWidget.tsx:21-29`). |
| Study pacts (weekly minutes pact, invite codes) | Implemented | `IStudyPactService` (`api.interface.ts:210-220`); `StudyPactsSection` join/sync/complete wiring (`StudyPactsSection.tsx:77-114`). |
| Cheering | Implemented (contract + widget) | `sendCheer` in `IPresenceService` (`api.interface.ts:222-229`). **OPINION**: thin emotional feature; verify real usage before investing. |

**OPINION**: realtime features are the least test-covered part of the suite (unit tests exercise engines, not two-client sync). The mock-mode BroadcastChannel sync is well-designed for demo, but real multiplayer behavior (latency, host race) is unverified in this audit.

### 3.6 Notes & Knowledge

| Capability | Status | Evidence |
|---|---|---|
| Markdown editor w/ toolbar, read/split modes, task toggling | Implemented | `NotesPage.tsx:1236-1347`; metrics (words/reading time) (218, 1257-1259). |
| 2-tier lossless autosave (1s local / 4s cloud) | Implemented, Working correctly | `useDebouncedAutoSave` with status pill states incl. cloud-error ("Draft saved locally — cloud sync pending") (`NotesPage.tsx:140-167`); note-bound payloads prevent cross-note mis-save (70-83); dirty flush on note switch (452-454); restore-prompt for newer local drafts, never forced (460-498, 1434-1455). |
| Wiki-links ([[...]]) + autocomplete + graph | Implemented | Draft detection at cursor with keyboard nav (`NotesPage.tsx:677-745`); `KnowledgeGraph` overlay (1362-1372); reading-view wikilink navigation via `?q=` (1318-1325). **OBSERVED PATTERN**: backlinks exist in `utils/notes/wikilinks.ts` and are surfaced in the graph; there is no dedicated backlinks pane in the editor itself. |
| Pinning | Implemented | localStorage pin list; pinned float on top (`NotesPage.tsx:121-122, 236-242`). **Technical debt**: device-local. |
| Version history (snapshots) | Implemented | Snapshot recorded on every cloud sync; restore-into-editor (`NotesPage.tsx:154-157, 758-761, 1263-1293`). **Technical debt**: localStorage-scoped, capped. |
| AI flashcards (grounded, 3-tier) | Implemented, Working correctly | Edge proxy → user key → deterministic chunk-mining; grounding gate drops un-cited cards (`ai.service.ts:99-133, 471-525`); citation chip jumps to exact source line (`NotesPage.tsx:763-784`). |
| AI quiz | Implemented | `AITakeQuizModal` (`NotesPage.tsx:1487-1492`); requires key (deterministic fallback not present here — see 3.14). |
| Ask Solis (global RAG Q&A) | Implemented, Working correctly | Global drawer ⌘J; injection guard, BM25+trigram RRF retrieval, citations, faithfulness gate with warn-only policy (`ai.service.ts:584-626`). |
| Note → task conversion | Implemented | Selection/TODO-line aware (`NotesPage.tsx:295-337`). |
| Note → focus | Implemented | Header "Focus" button with subject+title carry (1112-1126). |
| Markdown export | Implemented | `.md` file download (248-268). |
| Mobile index/editor split view | Implemented | `mobileView` state + CSS class (97, 844). |

### 3.7 Habits

| Capability | Status | Evidence |
|---|---|---|
| Boolean / quantitative / tiered habits | Implemented | `kind`, `unit`, `targetValue`, `baseTierValue`, `stretchTierValue` (`HabitsPage.tsx:268-312`); tier evaluation + meta labels (`tieredHabits.ts`). |
| Streaks + per-day toggling + history heatmap | Implemented, Working correctly | `toggleHabitDate` per-cell; 14-day matrix collapsing to 7 days <768px (`HabitsPage.tsx:80-84`); expandable 90-day heatmap per habit (90); `computeHabitHeatmap`/category insights/chain-risk (`habitInsights.ts`). |
| Haptics after confirmed success (not before) | Implemented | Explicit P3.5 comment + code order (`HabitsPage.tsx:169-190`). |
| Streak amnesty (welcome-back) | Implemented | Absence-day excusing with per-habit partial failure handling (`DashboardPage.tsx:564-608`). |
| Review-habit auto-toggle from study sessions | Implemented | Keyword-matched (review/flashcard/srs/recall/anki), idempotent, best-effort (`habitAutoToggle.ts:1-25`, called `FocusContext.tsx:795`). |
| "Rhythm story" non-punitive framing | Implemented | Encouragement-only titles by monthly completions (`HabitsPage.tsx:103-119`). |
| Goal-linked habits | Implemented | `goalId`/`goalTitle` on habit form (273-287). |

### 3.8 Goals

| Capability | Status | Evidence |
|---|---|---|
| Goals w/ milestones, horizons, statuses, filters/sort | Implemented | `GoalsPage.tsx:41-58, 148-224`; `GoalHeaderStats`, `GoalFilterBar`, `GoalCard`. |
| Exam vs project experience types | Implemented | `ExamWorkspaceModal` / `ProjectWorkspaceModal` (16-17); exam feasibility + dynamic pacing cards (`ExamFeasibilityCard`, `DynamicSyllabusPacingCard`, `ExamHorizonBar`). |
| Feasibility drift warnings | Implemented | Time-cushion status colors on the persistent pill (`AppHeader.tsx:135-173`) + `utils/planning/examFeasibility.ts`, `syllabusPacing.ts`. |
| Goal → study plan generation | Implemented | Deterministic drafts → plan items (`GoalsPage.tsx:266-300`). |
| Goal completion → retrospective note | Implemented | Auto-creates "Goal Retrospective" reflection note with prompts (`GoalsPage.tsx:226-262`). |

### 3.9 Analytics & Intelligence

| Capability | Status | Evidence |
|---|---|---|
| Metric tiles (volume, plan adherence, focus depth, mastery) | Implemented | `AnalyticsPage.tsx:459-544` with honest "—" placeholders when no data. |
| Time scopes (today / week / 28d) | Implemented | `SegmentedControl` (439-448). |
| Trends: WoW deltas, bars, subject breakdown, focus quality, task velocity | Implemented | `src/components/features/Analytics/TrendCharts.tsx` set (`AnalyticsPage.tsx:546-555`). |
| "Solis Noticed" personal insights | Implemented | Deterministic insight cards (557-579). |
| Explainable recommendations (signal/evidence/action) | Implemented | Signal → Evidence → button cards with typed payloads navigating to focus/study (581-639). |
| Retention forecast + exam readiness + cognitive load | Implemented | `RetentionForecastGraph`, `ExamReadinessCard`, `CognitiveLoadAlert` on both Analytics and Dashboard. |
| Activity heatmap | Implemented | `getHeatmapLevelClass` 4-level cells (`AnalyticsPage.tsx:382-388`). |
| Intelligence engines (deterministic) | Implemented, Working correctly | 15 modules under `src/utils/intelligence/` (retention, mastery×3, circadian synthesis, subject health, sufficiency model, rhythm, attention, execution, recommendations, narrative, config, topicHistory) + snapshot assembler `createLearningIntelligenceSnapshot` reused by Dashboard and Analytics (`DashboardPage.tsx:803-820`). |
| Scholar Report (proof-of-study) | Implemented | SVG + Markdown artifact with content hash, no PDF (`scholarReportGenerator.ts:32-203`). |
| Circadian synthesis feeding focus personalization | Implemented | Peak-window + soundscape affinity computed from real history (`FocusPage.tsx:346-380`). |

### 3.10 Weekly Review

| Capability | Status | Evidence |
|---|---|---|
| 5-step guided review wizard | Implemented | Steps with clickable progress (`WeeklyReviewPage.tsx:444-459`). |
| Data-grounded placeholders (no blank page) | Implemented | Breakthrough/friction placeholders generated from actual slipping tasks / learning topics (232-250). |
| AI synthesis w/ deterministic fallback | Implemented, Working correctly | `aiService.synthesizeWeek` → fallback builds observations from planning-realism ratio and consistency %, with explicit "AI offline" toast (252-303). |
| Review → save as note, create goal, create task, seed next week plan | Implemented | Four optional follow-through actions incl. 3 seeded Mon/Wed/Fri sessions (305-432). |
| Review history + streak (from notes) | Implemented | Streak counts consecutive tagged weekly-review notes, last week inclusive (220-230). |
| Room reflection history on Rooms page | Implemented | Separate from personal weekly review — two reflection stores coexist. **OPINION**: acceptable, but a unified reflection timeline is a V2 consolidation opportunity. |

### 3.11 Settings & Account

| Capability | Status | Evidence |
|---|---|---|
| Theme (dark/light) + density + readable font | Implemented | `ThemeContext` consumed in Settings (`SettingsPage.tsx:80`) and header toggle (`AppHeader.tsx:249-258`). |
| Profile + preferences (focus field, capacities) | Implemented | Save flow with honest per-section toasts (`SettingsPage.tsx:364-406`). |
| Gemini key management (session-scoped) | Implemented, Working correctly | sessionStorage w/ legacy localStorage fallback; model picker w/ deprecation migration; "Test connection" round-trip (38-39, 116-125, 458-527). |
| Notification preferences (quiet hours, categories) | Implemented | `notificationService` with quiet-hours math incl. overnight windows (`notification.service.ts:55-75`); browser permission request (539-549). |
| JSON workspace backup | Implemented | Full JSON export (`SettingsPage.tsx:226`). Import/recovery engine exists and is tested (`src/__tests__/import.test.ts` — round-trips all collections incl. habit history and SM-2 state). |
| Per-entity CSV export (6 entities) | Implemented | Tasks/study/focus/notes/habits/goals (280-315). |
| iCal (one-way export) | Implemented | `generateIcsCalendar` of time blocks + exam goals (248-273). **Partially complete as an integration**: import exists as a paste-ICS feeds feature (`CalendarFeedModal.tsx:119-153`) but there is no live subscribing URL sync — feeds are user-pasted and manually synced. |
| Data-ownership statement (RLS) | Implemented | Copy in Settings (1279). |

### 3.12 Onboarding & Activation

| Capability | Status | Evidence |
|---|---|---|
| Landing page (marketing) | Implemented | Hero, interactive cockpit preview, social proof, circadian sections (`LandingPage.tsx:217+`); marketing nav anchors (`navigation.ts:145-150`). |
| Guest "Explore Demo Sanctuary" | Implemented | One-click mock login with seeded workspace + guest-snapshot migration on real signup (`LoginPage.tsx:74-92`, `AuthContext.tsx:117-133`). |
| Activation modal (welcome → mental model → checklist) | Implemented | 3 stages, per-user step completion, dismiss states, counts-driven next-best-action (`ActivationWelcomeModal.tsx:35-86`, `utils/activation.ts`). |
| Next Best Action card | Implemented | Deterministic from entity counts (`DashboardPage.tsx:173-181, 1009-1015`). |
| Guided tours (ContextualHelp + Guides Center) | Implemented, Working correctly | `openGuide()` on every major page header; ~18 guide entries across 6 categories in `src/data/guides.ts` (grep: 24 `id:` entries incl. 6 categories); guide pages with progress/completion (`features/guides/*`). |
| Welcome-back (3+ days) | Implemented | See 3.1. |

**OBSERVED PATTERN**: onboarding is activation-loop-oriented (checklist of first actions) rather than feature-tour-oriented — a good pattern. **OPINION**: the mental-model stage carries a lot of copy; time-to-first-action should be measured, not assumed (the docs' "42 seconds" claim is simulation, not measurement).

### 3.13 AI (cross-cutting)

| Capability | Status | Evidence |
|---|---|---|
| Tiered availability (edge proxy / user key / deterministic) | Implemented, Working correctly | `ai.service.ts:471-525` — grounded cards; suggester + weekly synthesis have their own deterministic fallbacks (`AdaptiveStudySuggester.tsx:30-42`, `WeeklyReviewPage.tsx:264-303`). |
| Guardrails: injection detection, sanitized input/output, hardened system prompts | Implemented | `utils/ai/guardrails.ts` used in every generation path (`ai.service.ts:443-458, 584-614`). |
| Local RAG (no embeddings dependency) | Implemented | BM25 + hashed trigram + RRF + reranker (`ai.service.ts:405-440`). |
| Grounding gate + faithfulness scoring | Implemented | Uncited cards dropped (99-133); low-faithfulness answers logged (617-623). **OPINION**: faithfulness result only warns in console — it is not surfaced to the user as a confidence hint; V2 opportunity. |
| Telemetry | Implemented | `aiTelemetry.record` on generation (`ai.service.ts:337-343`). **OBSERVED PATTERN**: recorded but no UI/analytics surface found. |
| Quiz + flashcards + weekly narrative + Ask Solis | Implemented | See 3.6/3.10. |
| Session-scoped key hygiene | Implemented | sessionStorage default; Settings copy explains scope (`SettingsPage.tsx:38-39, 864-894`). |

### 3.14 Notifications

| Capability | Status | Evidence |
|---|---|---|
| Notification center drawer + unread badge | Implemented | `AppHeader.tsx:220-236`, `NotificationCenterDrawer.tsx`. |
| Time-block start / hour-review reminders (app-wide monitor) | Implemented | 30s poll, dedup sets, notify on start ≤3min and end ≤15min (`AppLayout.tsx:53-100`). |
| Browser notifications + quiet hours + chime fallback | Implemented | `notification.service.ts` single canonical store with legacy migration (1-50, 113-150). |
| **Technical debt** | — | Inbox and preferences are `localStorage`-only — notifications do not follow the user across devices; there is no server push (webPushEnabled flag defaults false). |
| Proactive retention alert (dashboard) | Implemented | Overdue-review recommendation escalates to a role="alert" strip (`DashboardPage.tsx:923-950`). |

### 3.15 Integrations & Data Management

| Capability | Status | Evidence |
|---|---|---|
| Supabase (Postgres+RLS, auth, realtime, edge function) | Implemented, Working correctly | `services/supabase/*` (16 modules + mappers + client); RLS asserted in Settings copy — **migration SQL not re-verified in this pass** (out of product-surface scope). |
| Guest→cloud migration | Implemented, Working correctly | Snapshot-before-switch, non-blocking failure with honest overlay, local archive (`AuthContext.tsx:57-133`). |
| Offline WAL + service worker | Implemented | `pwaSync.ts:1-40` (honest semantics: replay only offline-looking failures; server rejections purged). |
| Keepalive / DB wake detection | Implemented | Client service + Vercel cron (`keepaliveService.ts:1-30`, `vercel.json` crons). |
| CSV / JSON / ICS / Anki / Markdown / LMS export-import | Implemented | See 3.3/3.11. |
| Calendar ICS import | Partially complete | Paste-based feed import + toggle/sync (`CalendarFeedModal.tsx:119-153`); no URL-polling subscriptions. |

---

## 4. Part 2 — The Core Loop as Implemented

**The intended loop** (per `src/data/guides.ts` "What is Solis & The Solis Loop"): Decide → Focus → Capture → Recall → Reflect.

**The strongest loop as actually implemented** is narrower and tighter than the marketing loop:

> **Exam-anchored loop**: Goal/exam (feasibility + cushion) → morning intention/plan → time block or study plan item → Focus session with subject/task/plan links → post-session reflection auto-cascade (study session + topic promotion + habit + task + block + note) → flashcard drilling (SM-2) → Analytics intelligence (retention/mastery/health) → explainable recommendation → back to focus. The Weekly Review then seeds the next week's plan.

This loop is **VERIFIED end-to-end in code** with no manual re-entry: the only user action is completing a focus reflection; seven downstream entities update themselves (`FocusContext.tsx:715-895`).

### Where it is strong (VERIFIED)

- **Context preservation**: every entry point into Focus carries identity (taskId, planId, blockId, subjectId, title, duration) via query params + router state (`DashboardPage.tsx:704-720`, `TasksPage.tsx:1279-1288`, `StudyPage.tsx:299`, `GoalsPage` exam drill, `NotesPage.tsx:1112-1126`).
- **Determinism with receipts**: recommendations show Signal + Evidence, and the same intelligence snapshot powers Dashboard and Analytics (`DashboardPage.tsx:800-826`).
- **Failure honesty everywhere**: partial-data banners, sync-error banners with retry, offline WAL, cloud-error autosave state, guest-migration error overlay. This is the app's most consistent quality.
- **Undo optimism**: task complete/delete/defer all have undo; state rolls back on server failure (`TasksPage.tsx:356-908`).

### Where the loop breaks (VERIFIED gaps, ranked)

1. **Plan is not one thing.** A student meets three schedulers on day one (Today derived ribbon, Tasks hourly/weekly planner, Study plan agenda). Derived dashboard blocks are read-only summaries; completing a derived `task_deadline` block toggles the task, but there is no single drag-to-plan surface that writes back to one canonical model. (`DashboardPage.tsx:184-196, 681-702`; `TasksPage.tsx` planner.)
2. **Recall is a separate destination.** Due flashcards surface on Study (Spaced Reviews Sanctuary) and via dashboard retention alerts, but there is no due-review block in the daily timeline, and the dashboard's "Active Knowledge" card resurfaces notes, not cards (`DashboardPage.tsx:1223-1236`). The loop's strongest engine (SM-2) is one navigation hop away from the daily surface.
3. **Analytics is a report, not a control surface.** Recommendations navigate away but nothing writes back ("acknowledge", "schedule this", snooze). The feedback loop closes only if the user acts manually (`AnalyticsPage.tsx:594-639`).
4. **Device-local state breaks continuity.** Intention, morning-ritual done-state, welcome-back choice, gentle-start, pins, note history, notification inbox are per-device (`localStorage`, 37 files). A student on two devices gets inconsistent ritual states and loses pinned/history state — invisible data loss.
5. **Stopwatch half of the loop is under-modeled.** Open-ended sessions exist (`timerMode stopwatch`, `FocusPage.tsx:421-427`) but plan adherence and flow analytics key off completed sessions; abandoned/aborted sessions are intentionally excluded ("will not be recorded"), so real-world partial work is invisible to analytics unless the user completes the block flow.

### Where users do unnecessary manual work (OBSERVED from flows)

- Logging a manual study session duplicates what focus auto-log would have done — necessary only because focus is a separate destination from, e.g., PDF reading.
- Evening closure re-derives numbers the system already knows (study minutes/tasks/habits are pre-filled — good — but tomorrow intentions become *new tasks* rather than links to existing backlog items, risking duplicates: `DashboardPage.tsx:728-744`).
- Routines require a manual "Sync today" on two different pages instead of automatic materialization at first load of the day (both pages offer the button: `DashboardPage.tsx:667-679`, `StudyPage.tsx:394-406`).

### Where information stays disconnected (VERIFIED)

- **Two reflection stores**: daily reflections (`IReflectionService`) vs room reflections (`RoomReflection`) vs weekly-review notes. No unified "my reflections" timeline.
- **Parked thoughts** from focus sessions are written into the note text and session record, but there is no drift-pad inbox surface outside the focus flow to review parked thoughts later (`FocusContext.tsx:851-862` writes; no reader found).
- **Interruption logs** feed the session record and cognitive load, but there is no trend view of drift over time (per-session counters only).
- **Scholar report** (proof-of-study) is a standalone artifact; it is not linked from goals/exams despite being exam-adjacent evidence.
- **AI telemetry** is recorded with no consumer.

---

## 5. Part 3 — UX Observations

### 5.1 Navigation & Information Architecture

- **VERIFIED**: 4 sidebar sections / 11 items (`navigation.ts:3-105`), breadcrumb in header (Solis / current section, `AppHeader.tsx:110-133`), ⌘K palette with quick actions + workspace search + navigation commands (`CommandPalette.tsx:45-120+`), ⌘J Ask Solis, ⌘\ sidebar, and single-letter shortcuts guarded against inputs (`useKeyboardShortcuts.ts`).
- **VERIFIED**: Focus route hides all chrome (`AppLayout.tsx:39, 253-279`) and a MiniFocusPlayer persists a running timer across navigation (`AppLayout.tsx:280`, `MiniFocusPlayer.tsx`).
- **OBSERVED PATTERN / OPINION**: IA is clean and role-named ("Daily Dashboard", "Notes & Learning", "Progress & Goals") but pages are heavy: Dashboard renders 6+ panels and 5 modals; Settings is 1459 lines in one file. Deep pages are kept navigable by the palette and guides rather than by restructuring.
- **OPINION**: two competing "plan" vocabularies in nav copy ("Today" vs "Tasks & Daily Schedule" vs "Study & Syllabus" planner) reinforce the three-model problem from §3.1.

### 5.2 Mobile

- **VERIFIED**: dedicated 5-tab bottom bar (Today/Focus/Subjects/Tasks/Progress) with 48px touch targets and route prefetch (`MobileNav.tsx:9-60`); Notes index/editor split-view (`NotesPage.tsx:97, 844`); habit matrix collapses 14→7 days <768px (`HabitsPage.tsx:80-84`); media queries present in major page CSS (grep: Dashboard 9, Tasks 7, Notes 6, Sidebar 1, MobileNav 1 `@media` blocks).
- **Not verified**: actual small-viewport rendering of the dashboard cockpit grid and focus sanctuary; no browser run was performed. Marked **unverified**.
- **OPINION**: touch ergonomics look considered (haptics engine wired to confirmations, `tactile-press` class widely used), but the rooms editor and exam workspace modals are dense for phones.

### 5.3 Accessibility

- **VERIFIED**: aria-live timer announcements in Focus (`FocusPage.tsx:466-482`); aria-labels on icon-only buttons across header/notes/habits (e.g. `AppHeader.tsx:226, 242-254`; `NotesPage.tsx:898, 1017-1018`); focus-trap + Escape handling in the migration overlay (`AuthContext.tsx:97-115`); accessible test file in green suite (`src/__tests__/accessibility.test.ts`, 4 tests).
- **OBSERVED PATTERN**: `aria-label` appears in only 28 of the feature files; many custom divs (note cards, task rows, habit cells) are click-targets whose keyboard operability was not verified.
- **Not run**: axe/Lighthouse audit. **RECOMMENDATION**: run a Lighthouse + axe pass before V2 UI work; the codebase is receptive (semantic roles exist in key spots) but coverage is uneven.

### 5.4 Onboarding

- **VERIFIED**: staged activation modal (welcome → mental model → actionable checklist) driven by real entity counts; per-user, dismissible, resumable (`ActivationWelcomeModal.tsx:35-86`); Next Best Action card persists until dismissed; guest demo workspace with zero signup; guides center with ~18 guides in 6 categories, opened contextually from every page header via `guideId` props.
- **OPINION**: this is a thoughtful, non-coercive activation design. The risk is copy load (three stages of philosophy before action); the checklist's counts-based steps mitigate it.

### 5.5 Empty / Loading / Error states (cross-cutting quality check)

- **VERIFIED FACT**: the pattern is consistently implemented, not decorative:
  - Loading: skeletons (Dashboard 856-866, Tasks 1113-1118, Notes 955-960, Habits 371-376, Analytics 460-466).
  - Error: primary-failure error cards with retry + secondary sync-hiccup banners (Tasks 1086-1131, Notes 933-952, Habits 345-369) and partial-data banners on Dashboard/Analytics (872, 394).
  - Empty: illustrated EmptyState components with per-context copy (Habits 389-397, Notes 1349-1357) plus inline stubs (Dashboard 1078-1084, 1185-1191, 1254-1264).
- **OBSERVED PATTERN**: every destructive action has a ConfirmationDialog (note delete 1458-1472, focus abort 1348-1361, subject delete with archive-instead alternative `StudyPage.tsx:480-484`).

---

## 6. Docs Folder — Claimed vs Verified

| Doc claim | Source | Status in this audit |
|---|---|---|
| 34/34 suites, 174/174 tests passing | `docs/SOLIS_7_DAY_PRODUCT_VALIDATION.md:5` | **Stale.** Actual: 128 files / 1162 tests passing (ran `npx vitest run`). |
| 83 test files, 750 tests, 0 TS errors, clean build | `docs/SOLIS_COMPREHENSIVE_AUDIT_AND_PRODUCT_STRATEGY.md:13` | **Stale counts, directionally correct.** Actual: 128/1162 green; `tsc -b` clean; `vite build` 7.20s. |
| "Stages A–F … 100% Quality Bar" (2026-08-17) | `docs/STAGES_A_TO_F_AUDIT.md:6` | Consistent with the green suite; the doc's diagrammed domain graph matches the code's actual cross-domain wiring (spot-checked via FocusContext/GoalsPage/WeeklyReviewPage). |
| Its criticisms: broken loop, no time cushion, all-or-nothing streaks, no `::` inline cards | same doc §1 | **Largely outdated** — time cushion (`timeCushion.ts` + header pill), streak amnesty + gentle start, calm roll, and `::` cards all now exist in code (citations in §3). |
| "42 seconds signup→first action" simulation, 7-day persona walkthrough | `docs/SOLIS_7_DAY_PRODUCT_VALIDATION.md` | **Unverifiable from code** — it is a simulation narrative, not instrumentation. Treat as hypothesis, not measurement. |

---

## 7. Consolidated V2 Opportunity List (RECOMMENDATION)

1. **One planning model.** Collapse derived timeline blocks, persisted task blocks, and study plan items into a single canonical schedule entity with per-source projections. Highest-leverage IA fix. (Evidence: §3.1 OBSERVED PATTERN, §4 break #1.)
2. **Sync the invisible state.** Move intention, ritual flags, pins, note history, notification inbox, welcome-back choices to the cloud account (they already have user-scoped storage available). (§4 break #4.)
3. **Bring recall to the day.** Due-review block in the unified timeline and a dashboard drill CTA with counts. (§4 break #2.)
4. **Close the analytics loop.** Let recommendations be acknowledgeable/schedulable; persist dismissal to avoid nagging. (§4 break #3.)
5. **Unify reflections.** Daily + room + weekly reflections into one timeline surface. (§4 disconnections.)
6. **Accessibility & mobile runtime audit** (Lighthouse/axe, real devices) before V2 UI changes — codebase is receptive but coverage is uneven. (§5.3.)
7. **Surface AI confidence**: show the faithfulness score / source tier ("grounded from your note, line 42") in the answer UI, not just the console. (§3.13.)
8. **Materialize routines automatically** at day start (first app load) instead of manual sync buttons. (§4 manual work.)
9. **Live calendar subscriptions** (read-only ICS URLs with polling) to complete the integration started by paste-import. (§3.15.)

---

*Prepared as input to the Solis V2 research phase. All citations refer to the repository state inspected on 2026-09-27 at the paths shown; the nested repo root (`Solis-Ultimate-Productivity-tracker-main/`) is implied for all `src/` and `docs/` paths.*
