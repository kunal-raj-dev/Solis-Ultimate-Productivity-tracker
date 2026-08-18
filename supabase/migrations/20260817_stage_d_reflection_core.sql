-- ============================================================================
-- SOLIS MIGRATION: Stage D — Reflection Core (Daily Journaling & Habit-to-Goal)
-- Date: August 2026
-- ============================================================================

-- 1. Create Daily Reflections Table
CREATE TABLE IF NOT EXISTS public.daily_reflections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  energy_score INTEGER NOT NULL DEFAULT 4 CHECK (energy_score >= 1 AND energy_score <= 5),
  focus_score INTEGER NOT NULL DEFAULT 4 CHECK (focus_score >= 1 AND focus_score <= 5),
  wins TEXT[] NOT NULL DEFAULT '{}',
  friction_points TEXT[] NOT NULL DEFAULT '{}',
  tomorrow_intentions TEXT[] NOT NULL DEFAULT '{}',
  synthesis_notes TEXT,
  completed_habits_count INTEGER NOT NULL DEFAULT 0,
  completed_tasks_count INTEGER NOT NULL DEFAULT 0,
  study_minutes_logged INTEGER NOT NULL DEFAULT 0,
  review_cards_completed INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_user_reflection_date UNIQUE (user_id, date)
);

-- 2. Add goal_id to habits table
ALTER TABLE public.habits
  ADD COLUMN IF NOT EXISTS goal_id UUID REFERENCES public.goals(id) ON DELETE SET NULL;

-- 3. Enable Row Level Security
ALTER TABLE public.daily_reflections ENABLE ROW LEVEL SECURITY;

-- 4. Isolation Policies
CREATE POLICY "daily_reflections_user_isolation" ON public.daily_reflections
  FOR ALL USING (auth.uid() = user_id);

-- 5. Fast Lookup Indexes
CREATE INDEX IF NOT EXISTS idx_daily_reflections_user_date ON public.daily_reflections (user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_habits_goal ON public.habits (user_id, goal_id);
