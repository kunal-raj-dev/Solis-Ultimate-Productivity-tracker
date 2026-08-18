# Solis — Full Application Performance Audit

## 1. Executive Summary
An in-depth profiling and architecture audit was performed across all 12 routes, React context trees, data services, animation loops, and Vite bundle structure. The audit revealed that recent feature additions (Phase 5 spatial effects, theme system, navigation, and Phase 6 intelligence) introduced multiple compounding bottlenecks:
1. **Monolithic Bundle (693.12 kB single JS chunk)** with zero route-level code splitting.
2. **Blocking Multi-Query Waterfalls (8–14 queries per page)** on Dashboard and Analytics with full-page skeleton blocking.
3. **Zero In-Memory Query Deduplication/Cache**, causing identical datasets to be refetched on every route transition.
4. **High-Frequency React State Thrashing**:
   - Focus Timer running `setSecondsRemaining` at 60–120 FPS via `requestAnimationFrame`.
   - Parallax Scene calling React `setState` on every scroll frame.
5. **Context Provider Instability** in `DataContext.tsx` passing un-memoized object references.
6. **GPU Compositing Strain** from multiple large fixed `filter: blur(80px)` atmospheric orbs.

---

## 2. Route Performance Ranking (Baseline)

| Route | Baseline Status | Bottleneck Description |
| :--- | :--- | :--- |
| **`/app/dashboard`** | **CRITICAL** | 8 concurrent queries + sequential $N$-topic waterfall; full skeleton block; intelligence recalculation. |
| **`/app/analytics`** | **CRITICAL** | 6 concurrent queries + $N$-topic waterfall; synchronous intelligence derivations blocking mount. |
| **`/app/focus`** | **NEEDS OPTIMIZATION** | Timer running `setState` 60–120 times/sec via RAF; parallax context re-renders on scroll. |
| **`/app/study`** | **NEEDS OPTIMIZATION** | Fetches all subjects + sessions + plans; parallax scene scroll listeners. |
| **`/app/notes`** | **ACCEPTABLE** | Un-debounced note list filtering; individual fetch without cache. |
| **`/app/tasks`** | **ACCEPTABLE** | Direct query on filter changes; acceptable latency. |
| **`/app/habits`** | **FAST** | Small payload; quick render. |
| **`/app/goals`** | **FAST** | Direct query; quick render. |
| **`/app/settings`** | **FAST** | Pure local/user state. |
| **`/` (Landing)** | **NEEDS OPTIMIZATION** | Forced to load full 693 kB application JS chunk before rendering public page. |
| **`/auth/login`** | **NEEDS OPTIMIZATION** | Monolithic bundle download latency on cold load. |

---

## 3. Top 10 Performance Bottlenecks

### 1. Monolithic Bundle (Zero Code Splitting)
* **Location**: [`src/App.tsx`](file:///c:/Users/kunal/Desktop/Solis/src/App.tsx)
* **Impact**: 693.12 kB single JS bundle. Visiting the landing page downloads and executes the entire analytics engine, notes editor, study studio, and settings code.
* **Solution**: Implement route-level code splitting using `React.lazy()` and `<Suspense>` with targeted prefetching.

### 2. Blocking 8+N Query Waterfall on Dashboard
* **Location**: [`src/features/dashboard/DashboardPage.tsx`](file:///c:/Users/kunal/Desktop/Solis/src/features/dashboard/DashboardPage.tsx)
* **Impact**: `Promise.all` fires 8 parallel queries (`tasks`, `studyPlan`, `subjects`, `notes`, `habits`, `recentSessions`, `recentFocus`, `dailySummary`) followed by $N$ sequential topic queries. The entire page blocks behind skeletons until all requests complete.
* **Solution**: Separate into **Critical** (Arrival & Intention $\to$ immediate), **Primary** (Tasks, Plan, Subjects $\to$ parallel), and **Deferred** (Intelligence recommendation $\to$ async non-blocking).

### 3. Sequential Topic Waterfall on Analytics
* **Location**: [`src/features/analytics/AnalyticsPage.tsx`](file:///c:/Users/kunal/Desktop/Solis/src/features/analytics/AnalyticsPage.tsx)
* **Impact**: Fires 6 parallel queries + $N$ sequential topic queries on mount and runs heavy intelligence derivations synchronously on the main thread.
* **Solution**: Share cached domain data from client repository; defer heavy 28-day calculations.

### 4. Zero In-Memory Query Deduplication / Cache
* **Location**: [`src/services/dataService.ts`](file:///c:/Users/kunal/Desktop/Solis/src/services/dataService.ts) & [`SupabaseDataService`](file:///c:/Users/kunal/Desktop/Solis/src/services/supabase/supabaseService.ts)
* **Impact**: Navigating between `Dashboard` $\leftrightarrow$ `Study` $\leftrightarrow$ `Focus` $\leftrightarrow$ `Analytics` causes identical data (subjects, sessions, user summary) to be repeatedly requested over the network.
* **Solution**: Add lightweight Stale-While-Revalidate (SWR) client cache (15–30s TTL) with instant cache invalidation on mutations (`notify()`).

### 5. Redundant `supabase.auth.getUser()` Network Calls
* **Location**: [`src/services/supabase/supabaseService.ts`](file:///c:/Users/kunal/Desktop/Solis/src/services/supabase/supabaseService.ts)
* **Impact**: Every individual service method calls `await this.getRequiredUserId()` (`await supabase.auth.getUser()`), multiplying network calls by 2x.
* **Solution**: Read cached local session user ID (`supabase.auth.getSession()` / memoized user ID).

### 6. Focus Timer RAF State Thrashing (60–120 FPS `setState`)
* **Location**: [`src/features/focus/FocusPage.tsx`](file:///c:/Users/kunal/Desktop/Solis/src/features/focus/FocusPage.tsx)
* **Impact**: `requestAnimationFrame` calls `setSecondsRemaining` on every frame (60–120 times/sec), causing continuous full re-renders of `FocusPage`.
* **Solution**: Update React state only when the whole second value changes (`remainingSeconds !== prevSeconds`).

### 7. Parallax Scroll Event React State Thrashing
* **Location**: [`src/components/parallax/ParallaxScene.tsx`](file:///c:/Users/kunal/Desktop/Solis/src/components/parallax/ParallaxScene.tsx)
* **Impact**: `setProgress(clamped)` is called on every scroll frame inside React state, triggering virtual DOM reconciliation of the entire scene and all child layers on every scroll event.
* **Solution**: Apply parallax translations via CSS custom properties on container or ref transforms without triggering React component tree re-renders.

### 8. Un-memoized Context Provider Reference Storms
* **Location**: [`src/context/DataContext.tsx`](file:///c:/Users/kunal/Desktop/Solis/src/context/DataContext.tsx)
* **Impact**: `DataProvider` instantiates a new object literal `{ summary, refreshCount, refreshData }` on every render, causing all context subscribers to re-render.
* **Solution**: Wrap context value in `useMemo`.

### 9. Atmospheric Canvas GPU Compositing Overhead
* **Location**: [`src/components/layout/AtmosphereCanvas/AtmosphereCanvas.css`](file:///c:/Users/kunal/Desktop/Solis/src/components/layout/AtmosphereCanvas/AtmosphereCanvas.css)
* **Impact**: Three large fixed $550\text{px}$ elements with `filter: blur(80px)` and `will-change: transform, opacity` create GPU layer compositing overhead.
* **Solution**: Optimize blur radius ($40\text{px}$–$50\text{px}$), remove unnecessary `will-change` on idle states, and use hardware-accelerated static gradients.

### 10. Un-debounced Note Auto-Save / State Filtering
* **Location**: [`src/features/notes/NotesPage.tsx`](file:///c:/Users/kunal/Desktop/Solis/src/features/notes/NotesPage.tsx)
* **Impact**: Search and category filtering recalculates without memoized boundaries.
* **Solution**: Memoize filtered list with `useMemo` and ensure debounce timers are isolated.

---

## 4. Target Progressive Architecture

```text
User Navigates
      ↓
App Shell Remains Mounted (Zero Flashing)
      ↓
Route Chunk Loaded via Lazy Code-Splitting (< 40 kB per chunk)
      ↓
Instant Above-the-Fold Render (from SWR Client Cache if available)
      ↓
Progressive Data Stream (Critical → Primary → Deferred Intelligence)
```
