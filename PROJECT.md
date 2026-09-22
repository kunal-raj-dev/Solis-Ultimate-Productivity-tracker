# Project: Solis Part 2 — Active Learning System

## Architecture
Solis Part 2 transforms Solis from a passive tracking web app into an integrated, active learning operating system ("The system that helps me remember what I learn").
The architecture maintains a strict separation between **Canonical Deterministic State** (stored locally in IndexedDB/MockDataService/PostgreSQL) and **Advisory AI Intelligence** (Gemini 1.5 Flash/Pro with client-side key storage and zero-dependency REST).

```
                      [ User / Student ]
                              │
              ┌───────────────┴───────────────┐
              ▼                               ▼
       [ Today Cockpit ]              [ Study Sanctuary ]
    (Resurfacing, Realism)        ("What Should I Study Now?")
              │                               │
              │                               ▼
              │                     [ Focus Session Room ]
              │                   (Preserves params, timer)
              │                               │
              │                               ▼
              │                     [ Reflection & Logging ]
              │                   (Auto-logs StudySession,
              │                    updates subject & topic)
              ▼                               │
     [ Knowledge Studio ]                     │
   (Wiki-links, Backlinks,                    ▼
   Flashcards, Quiz Runner) ◄───────── [ SRS & Retention ]
              ▲                      (SM-2, Decay Tiers,
              │                       Topic Masteries)
              │
    [ Ask Solis & Review ]
   (Grounded Q&A, Citations,
   Weekly Narrative Synthesis)
```

## Feature Inventory
Every feature identified during the survey phase is inventoried below and mapped to a milestone:

| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| 1 | Adaptive Study Recommender Engine | Canonical "What Should I Study Now?" engine unifying weak mastery, overdue SRS cards, exam proximity (<30d), and subject neglect signals with explicit explainability. | M1 | Survey 1 (R1) |
| 2 | Seamless Focus Transition & Closed Loop | Complete parameter continuity (`subjectId`, `topicId`, `planId`, `title`, `duration`) into `/app/focus`, and auto-logging `StudySession` in `saveReflection` to update subject hours and topic mastery. | M1 | Survey 1 (R1) |
| 3 | AI Flashcard Intelligence & Review UI | High-yield atomic card generation with full user review/edit/discard control directly from note content before saving to `dataService.flashcards`. | M2 | Survey 2 (R2) |
| 4 | AI Formative Quiz Runner & Scoring | Interactive quiz generation from notes with contract bug fix (`correctOptionIndex` vs `correctAnswerIndex`), live scoring, and conceptual explanations. | M2 | Survey 2 (R2) |
| 5 | Bidirectional Wiki-linking & Backlinks | SPA client-side routing for `[[Note Title]]` links without full page reloads, and bidirectional "Linked References" backlink index panel in `NotesPage`. | M3 | Survey 2 (R3) |
| 6 | Explainable Daily Knowledge Resurfacing | Dashboard resurfacing card connected to `retentionEngine.ts` decay tiers (`OVERDUE`, `NEEDS_ATTENTION`, etc.) with explainable badges ("Last studied 19 days ago"). | M3 | Survey 2 (R3) |
| 7 | Source-Grounded Q&A ("Ask Solis") | Source-grounded semantic search and inquiry drawer backed by local notes with strict provenance citations and graceful refusal when missing data. | M4 | Survey 3 (R4) |
| 8 | Weekly Review Narrative Synthesis | 5-pillar weekly reflection ritual integrating deterministic planning realism ($T_{actual} / T_{planned}$) with on-demand AI narrative synthesis and note generation. | M4 | Survey 3 (R4) |
| 9 | Dual-Track E2E Test Suite & Final Audit | 100% passing E2E tests across Tiers 1-4, Tier 5 adversarial coverage hardening, zero git commits/pushes/deploys, and comprehensive report in `SOLIS_PART_2_IMPLEMENTATION_REPORT.md`. | M5 | Survey 3 (R5) |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M1 | Study & Adaptive Planning Loop | Features 1 & 2: Recommender engine unification, weak mastery & exam signals, Focus transition parameter preservation (`topicId`, `duration`), and closed-loop session logging. | none | PLANNED |
| M2 | Active Recall & Quiz Intelligence | Features 3 & 4: Editable/discardable AI flashcards in `AIGenerationModal`, quiz scoring contract fix in `AITakeQuizModal`, formative comprehension testing. | none | PLANNED |
| M3 | Knowledge Graph & Resurfacing | Features 5 & 6: SPA `[[Note Title]]` link navigation, bidirectional backlinks panel in Notes, and `retentionEngine`-driven Daily Resurfacing card. | none | PLANNED |
| M4 | Grounded Q&A & Narrative Synthesis | Features 7 & 8: Grounded "Ask Solis" drawer verification, Weekly Review realism calibration and AI narrative note generation. | M1, M3 | PLANNED |
| M5 | Final Milestone: E2E Test Pass & Coverage Hardening | Feature 9: Phase 1: Pass 100% of E2E test suite (Tiers 1-4). Phase 2: Tier 5 adversarial coverage hardening. | M1, M2, M3, M4, TEST_READY.md | PLANNED |

## Interface Contracts

### M1 ↔ Focus & Study
- `FocusContextValue`:
  - Adds `selectedTopicId: string | null`, `setSelectedTopicId: (id: string | null) => void`.
- `FocusPage`:
  - Parses query params `topicId`, `subjectId`, `planId`, `title`, `duration`.
- `saveReflection`:
  - If `selectedSubjectId` is present, executes `dataService.study.logSession({ subjectId, planItemId, focusSessionId, type: 'deep_study', durationMinutes, topicsCovered: [focusTitle], retentionRating })`.
- `computeExplainableRecommendations`:
  - Accepts `RecommendationSourceContext` including `goals?: Goal[]`.
  - Emits recommendations with types `'spaced_retrieval' | 'retention_intervention' | 'exam_proximity' | 'weak_mastery' | 'neglected_subject' | 'postponement_recovery' | 'next_plan_item'`.

### M2 ↔ AI Flashcards & Quiz
- `AIGenerationModal`:
  - State holds editable cards: `{ front: string; back: string; type: CardType; selected: boolean }[]`.
  - Emits `createFlashcard` only for cards where `selected === true`.
- `AITakeQuizModal` ↔ `ai.service.ts`:
  - `QuizQuestion`: `{ question: string; options: string[]; correctAnswerIndex: number; explanation: string }`.
  - Modal reads `question.correctAnswerIndex ?? (question as any).correctOptionIndex`.

### M3 ↔ Notes & Resurfacing
- `findBacklinksForNote(currentTitle: string, allNotes: Note[]): { note: Note; contextSnippet: string }[]`.
- `MarkdownReadingView`:
  - `[[Note Title]]` link click calls React Router `navigate('/app/notes?q=' + encodeURIComponent(title))` or internal onSelectNote handler without full page reload.
- `KnowledgeResurfacingCard`:
  - Ingests `notes: Note[]`, `retentionSignals?: TopicRetentionSignal[]`.
  - Selects candidate based on highest retention risk decay, falling back to oldest studied note, displaying rationale badge (`"Last studied 19 days ago • Retention Risk"`).

## Code Layout
- `src/types/`: Type definitions (`study.ts`, `learning.ts`, `learningIntelligence.ts`, `note.ts`).
- `src/services/`: Services (`dataService.ts`, `ai/ai.service.ts`, `mock/`, `supabase/`).
- `src/utils/intelligence/`: Algorithms (`recommendations.ts`, `retentionEngine.ts`, `masteryEngine.ts`, `execution.ts`, `rhythm.ts`).
- `src/features/study/`: Study workspace and components (`StudyPage.tsx`, `components/`).
- `src/features/focus/`: Focus timer (`FocusPage.tsx`, `FocusContext.tsx`).
- `src/features/notes/`: Notes studio (`NotesPage.tsx`, `components/features/Notes/`).
- `src/features/review/`: Weekly review ritual (`WeeklyReviewPage.tsx`).
- `src/components/layout/`: Global app shell & drawers (`AskSolisDrawer/`).
- `src/__tests__/`: Unit and integration test suites.
- `docs/research/`: Architectural and audit reports.
