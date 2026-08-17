# Solis — Architecture & Domain Engineering Manual

> **Product**: Solis — Personal Study + Productivity Operating System  
> **Status**: Phase 3 of 8 (Real Identity, Persistence & Security Engine) Complete  
> **Target Experience**: A calm, cinematic visual journey through the user's day.

---

## 1. Project Directory Structure

```text
Solis/
├── .env.example                    # Clean environment configuration template (NEVER commit secrets)
├── .gitignore                      # Enforces exclusion of .env*, credentials, and build output
├── supabase/
│   └── migrations/
│       └── 20260817_initial_schema.sql  # Reproducible PostgreSQL schema + RLS definitions
├── public/
│   └── favicon.svg                 # Brand mark SVG vector
├── src/
│   ├── __tests__/                  # Automated pure domain & persistence mapper unit tests (Vitest)
│   │   ├── tasks.test.ts           # Task state transitions, filtering, subtask cascades
│   │   ├── streaks.test.ts         # Deterministic streak calculation engine
│   │   ├── productivity.test.ts    # Daily summary & momentum scoring formula
│   │   ├── timer.test.ts           # Timestamp-based countdown calculations
│   │   ├── validation.test.ts      # Domain boundary validation rules
│   │   └── supabase.test.ts        # Database row mappers & model isolation
│   ├── assets/                     # SVGs, brand assets, illustration tokens
│   ├── config/                     # App and theme configurations
│   ├── constants/                  # Navigation contracts
│   ├── context/                    # Global React Contexts
│   │   ├── AuthContext.tsx         # Race-safe Supabase Auth lifecycle & session manager
│   │   ├── ThemeContext.tsx        # Light/Dark/System theme provider
│   │   ├── ToastContext.tsx        # Toast messaging dispatch queue
│   │   └── DataContext.tsx         # Live reactive repository subscriber provider
│   ├── hooks/                      # Custom hooks (useMediaQuery, useDataService)
│   ├── types/                      # TypeScript domain definitions
│   ├── utils/                      # Pure domain mathematics, streaks, validation, timer
│   ├── styles/                     # Layered CSS Token Architecture
│   ├── services/                   # Data Layer Abstraction (Service Pattern)
│   │   ├── api.interface.ts        # Strict contracts for all 7 domain services + subscribe
│   │   ├── dataService.ts          # Production-safe service container factory
│   │   ├── mock/                   # In-memory development repository
│   │   │   ├── mockData.ts
│   │   │   └── mockService.ts
│   │   └── supabase/               # Real PostgreSQL Persistence & RLS Engine
│   │       ├── supabaseClient.ts   # Centralized Supabase client singleton
│   │       ├── supabaseMappers.ts  # snake_case <-> camelCase domain transformations
│   │       ├── supabaseService.ts  # SupabaseDataService implementing IDataService
│   │       └── schema.sql          # In-tree copy of PostgreSQL schema
│   ├── components/                 # UI, Feedback, Layout, ProtectedRoute, and Motion Primitives
│   └── features/                   # Domain Feature Engines (Tasks, Study, Focus, Habits, Goals, Dashboard)
```

---

## 2. Authentication Architecture & Session Lifecycle

### A. Authoritative State Machine (`src/context/AuthContext.tsx`)
The authentication state is tracked deterministically across four unambiguous states:
* `initializing`: Initial session hydration from Supabase Auth storage (renders peaceful `<LoadingScreen />` to eliminate layout flashing).
* `authenticated`: Session verified and user profile hydrated.
* `unauthenticated`: No active session; unauthenticated access to protected routes is blocked.
* `auth_error`: Invalid credentials or network failure with accessible alert notifications.

### B. Race-Safety & Asynchronous Sequence Protection
* Employs monotonic sequence tokens (`seqRef.current`) and component mount guards (`isMountedRef.current`) to guarantee that out-of-order asynchronous responses from `getUser()` or token refreshes cannot corrupt the active session state.
* Listens to Supabase real-time auth events (`INITIAL_SESSION`, `SIGNED_IN`, `SIGNED_OUT`, `TOKEN_REFRESHED`) for instant cross-tab synchronization.

### C. Route Guards & Redirection Protocol
* **Protected Routes (`/app/*`)**: Wrapped in `<ProtectedRoute>` via `<AppLayout>`. Unauthenticated visitors are redirected to `/auth/login` while preserving target route in `location.state.from`.
* **Auth Routes (`/auth/login`, `/auth/signup`)**: Authenticated visitors are automatically forwarded to `/app/dashboard`.

---

## 3. Database Architecture & Schema Design (`supabase/migrations/`)

### A. Non-Redundant Source of Truth (No Duplicated Derived Fields)
To eliminate data corruption and dual sources of truth:
* `subjects`: Stores target hours, names, colors. **Does NOT store** `completed_hours_this_week` (derived dynamically from `study_sessions`).
* `habits`: Stores title, category, frequency. **Does NOT store** `current_streak` or `longest_streak` (derived deterministically from `habit_records` via `calculateStreaks`).
* `goals`: Stores title, horizon, status. **Does NOT store** `progress_percentage` (derived dynamically from `goal_milestones`).

### B. Relational Schema Summary
| Table | Primary Key | Foreign Keys | Key Constraints / Indexes |
| :--- | :--- | :--- | :--- |
| `profiles` | `id UUID` | `auth.users(id) ON DELETE CASCADE` | 1:1 user identity mapping |
| `subjects` | `id UUID` | `user_id -> auth.users(id)` | Index on `user_id` |
| `tasks` | `id UUID` | `user_id -> auth.users(id)` | Indexes on `(user_id, status)`, `(user_id, due_date)` |
| `subtasks` | `id UUID` | `task_id -> tasks(id)`, `user_id -> auth.users(id)` | Index on `task_id` |
| `study_sessions` | `id UUID` | `user_id -> auth.users(id)` | Index on `(user_id, completed_at)` |
| `study_plan_items` | `id UUID` | `user_id -> auth.users(id)` | Index on `user_id` |
| `focus_sessions` | `id UUID` | `user_id -> auth.users(id)` | Index on `(user_id, created_at)` |
| `habits` | `id UUID` | `user_id -> auth.users(id)` | Index on `user_id` |
| `habit_records` | `id UUID` | `habit_id -> habits(id)`, `user_id -> auth.users(id)` | `UNIQUE(habit_id, completion_date)` |
| `goals` | `id UUID` | `user_id -> auth.users(id)` | Index on `(user_id, status)` |
| `goal_milestones` | `id UUID` | `goal_id -> goals(id)`, `user_id -> auth.users(id)` | Index on `goal_id` |
| `notes` | `id UUID` | `user_id -> auth.users(id)` | Index on `user_id` |

---

## 4. Row Level Security (RLS) & Child Ownership

Every table in the Solis database has **Row Level Security enabled by default**. No client can read or mutate another user's rows.

### A. Direct User Records
Tables such as `profiles`, `subjects`, `tasks`, `study_sessions`, `focus_sessions`, `habits`, `goals`, `notes` enforce:
```sql
CREATE POLICY "table_user_isolation" ON public.<table>
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
```

### B. Child Records with Relational Integrity Verification
For child tables (`subtasks`, `habit_records`, `goal_milestones`), RLS policies verify both `auth.uid() = user_id` and the existence of the parent record belonging to the authenticated user:
```sql
CREATE POLICY "subtasks_user_isolation" ON public.subtasks
  FOR ALL USING (
    auth.uid() = user_id AND
    EXISTS (SELECT 1 FROM public.tasks WHERE public.tasks.id = subtasks.task_id AND public.tasks.user_id = auth.uid())
  )
  WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (SELECT 1 FROM public.tasks WHERE public.tasks.id = subtasks.task_id AND public.tasks.user_id = auth.uid())
  );
```

---

## 5. Repository Factory & Production Safety (`src/services/dataService.ts`)

* **Production Guard**: `import.meta.env.PROD` strictly forbids silent fallback to mock data. If `VITE_SUPABASE_URL` or `VITE_SUPABASE_ANON_KEY` are missing in production, the service container throws a fatal configuration error.
* **Development Flexibility**: In local development, `VITE_DATA_LAYER=supabase` connects to live PostgreSQL, while `VITE_DATA_LAYER=mock` runs in deterministic offline mode.
* **Preserved Contract**: UI components never import Supabase directly. All operations route through `IDataService`.

---

## 6. Verification & Test Suite

* **Automated Vitest Suite**: 24 tests passing across 6 test suites covering streaks, timers, validation, productivity formulas, and Supabase data mappers.
* **Production Build**: `tsc -b && vite build` completes in < 3s with 0 errors.
