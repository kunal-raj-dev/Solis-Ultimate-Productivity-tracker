-- ============================================================================
-- SOLIS MIGRATION: Phase 3 Cognitive Flow, Anti-Shame & Planning Direct Manipulation
-- Date: September 2026
-- Description:
--   1. Adds deferral_count to public.tasks — incremented by the one-tap
--      "→ Tomorrow" Zeigarnik deferral on overdue task rows (plan §3.3).
--   2. Adds amnesty_dates to public.habits — local dates (YYYY-MM-DD) excused
--      by the "Streak Amnesty" gentle re-entry option (plan §3.4). Excused
--      days are treated as non-evaluating by the streak engine; they are
--      never fabricated as completions.
-- ============================================================================

-- 1. ADD deferral_count TO public.tasks
ALTER TABLE public.tasks
  ADD COLUMN IF NOT EXISTS deferral_count INTEGER NOT NULL DEFAULT 0;

-- 2. ADD amnesty_dates TO public.habits
ALTER TABLE public.habits
  ADD COLUMN IF NOT EXISTS amnesty_dates DATE[] NOT NULL DEFAULT '{}';
