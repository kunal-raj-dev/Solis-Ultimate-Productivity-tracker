-- ============================================================================
-- SOLIS MIGRATION: Stage B — Planning Core (Recurring Routines & Goal Workspaces)
-- Date: August 2026
-- ============================================================================

-- 1. Create Study Routines Table
CREATE TABLE IF NOT EXISTS public.study_routines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  topic_id UUID REFERENCES public.study_topics(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  target_minutes INT NOT NULL DEFAULT 45,
  days_of_week INT[] NOT NULL DEFAULT '{1,3,5}',
  scheduled_time TEXT NOT NULL DEFAULT '14:00',
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('urgent', 'high', 'medium', 'low')),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Add Workspace Columns to Goals Table
ALTER TABLE public.goals
  ADD COLUMN IF NOT EXISTS experience_type TEXT NOT NULL DEFAULT 'standard' CHECK (experience_type IN ('standard', 'exam', 'project')),
  ADD COLUMN IF NOT EXISTS target_score TEXT,
  ADD COLUMN IF NOT EXISTS exam_weight NUMERIC(5,2),
  ADD COLUMN IF NOT EXISTS project_repository_url TEXT,
  ADD COLUMN IF NOT EXISTS deliverables JSONB DEFAULT '[]'::jsonb;

-- Enable Row Level Security on study_routines
ALTER TABLE public.study_routines ENABLE ROW LEVEL SECURITY;

-- 3. Row Level Security Policies
CREATE POLICY "study_routines_user_isolation" ON public.study_routines
  FOR ALL USING (auth.uid() = user_id);

-- 4. Fast Query Indexes
CREATE INDEX IF NOT EXISTS idx_study_routines_user ON public.study_routines (user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_goals_experience_type ON public.goals (user_id, experience_type);
