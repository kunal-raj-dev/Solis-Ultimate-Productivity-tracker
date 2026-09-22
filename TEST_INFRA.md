# E2E Test Infra: Solis Part 1 Transformation

## Test Philosophy
- Opaque-box, requirement-driven, deterministic test suite derived from `ORIGINAL_REQUEST.md`.
- No mock drift or false positives: all tests run against native services, store models, and DOM interfaces using Vitest.
- Systematic 4-tier methodology: Feature Coverage (Tier 1), Boundary & Corner Cases (Tier 2), Cross-Feature Interactions (Tier 3), Real-World Scenarios (Tier 4).

## Feature Inventory Coverage Map
| # | Feature | Requirement | Tier 1 | Tier 2 | Tier 3 | Tier 4 |
|---|---------|-------------|:------:|:------:|:------:|:------:|
| 1 | Theme & Colors (#0E0C0B, #FAF8F5, #E65A41) | R1 | 5 | 5 | ✓ | ✓ |
| 2 | Typography Tracking & Hairlines | R1 | 5 | 5 | ✓ | ✓ |
| 3 | AI-Slop & Neon Glow Removal | R1 | 5 | 5 | ✓ | ✓ |
| 4 | Collapsible 68px Rail Sidebar (Cmd+\) | R2 | 5 | 5 | ✓ | ✓ |
| 5 | Contextual Header Breadcrumbs | R2 | 5 | 5 | ✓ | ✓ |
| 6 | Inline Task Creation (Zero Modal) | R4 | 5 | 5 | ✓ | ✓ |
| 7 | Tabular Task Rows & Hairline Dividers | R4 | 5 | 5 | ✓ | ✓ |
| 8 | Tactile Completion & 5s Undo (Cmd+Z) | R4 | 5 | 5 | ✓ | ✓ |
| 9 | Recurrence Engine (daysOfWeek, timezone) | R4 | 5 | 5 | ✓ | ✓ |
| 10 | 24h Time Blocking & De-Cardified Grid | R5 | 5 | 5 | ✓ | ✓ |
| 11 | Living Time Needle Precision | R5 | 5 | 5 | ✓ | ✓ |
| 12 | Past Block Review & 1-Click Auto-Replan | R5 | 5 | 5 | ✓ | ✓ |
| 13 | Task -> Focus Continuity | R6 | 5 | 5 | ✓ | ✓ |
| 14 | Focus Completion Back-Sync to Task & Block | R6 | 5 | 5 | ✓ | ✓ |
| 15 | Today Cockpit 5-Tier Layout & Evening Closure | R3 | 5 | 5 | ✓ | ✓ |

## Test Architecture
- **Test Runner**: Vitest (`npx vitest run`)
- **Type Checker**: TypeScript (`npx tsc -b`)
- **Bundler / Production Verification**: Vite (`npm run build`)
- **Key Test Files**:
  - `src/__tests__/part1TasksAndPlanning.test.ts`
  - `src/__tests__/hourlyPlanner.test.ts`
  - `src/__tests__/tasks.test.ts`
  - `src/__tests__/theme.test.ts`
  - `src/__tests__/navigation.test.ts`
  - `src/__tests__/dashboard.test.ts`

## Real-World Application Scenarios (Tier 4)
| # | Scenario | Features Exercised | Target Behavior |
|---|----------|--------------------|-----------------|
| 1 | Student Morning Planning Ritual | F6, F7, F10, F11 | Student opens Today Cockpit, adds 3 tasks via inline row with Enter, time-blocks 2 tasks into afternoon slots |
| 2 | High-Velocity Execution & Quick Undo | F8, F9 | Student marks task complete, realizes mistake, presses Cmd+Z within 5s, task immediately reverts to todo |
| 3 | Recurring Study Schedule (Mon/Wed/Fri) | F9 | Student completes Wednesday Physics study task; system immediately schedules next occurrence for Friday |
| 4 | Study Session Continuity | F13, F14 | Student clicks "Focus" on time-blocked Math task, completes 25m Pomodoro, reflection automatically logs 25m to both task and scheduled block |
| 5 | Missed Block Auto-Replan | F10, F12 | Student misses 2:00 PM block due to lecture delay; clicks "Review", selects "Later Today +2h", block moves to 4:00 PM |
| 6 | Calm Evening Closure | F15 | After 18:00, user clicks evening closure, reflects on daily intention and wins without intrusive banners |

## Coverage Thresholds
- Baseline test suite: 58 test files, 425 unit/integration tests all passing (100%).
- All Part 1 requirements (R1 to R6) verified by automated tests.
- 0 TypeScript compiler errors.
- Clean production build with 0 bundling errors.
