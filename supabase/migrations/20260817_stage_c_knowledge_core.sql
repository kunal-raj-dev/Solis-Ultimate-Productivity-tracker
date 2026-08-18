-- ============================================================================
-- SOLIS MIGRATION: Stage C — Knowledge Core (Study Resources Library)
-- Date: August 2026
-- ============================================================================

-- 1. Create Study Resources Table
CREATE TABLE IF NOT EXISTS public.study_resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  topic_id UUID REFERENCES public.study_topics(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  author TEXT,
  url TEXT,
  type TEXT NOT NULL DEFAULT 'paper' CHECK (type IN ('pdf', 'paper', 'book', 'video', 'documentation', 'article')),
  status TEXT NOT NULL DEFAULT 'unread' CHECK (status IN ('unread', 'in_progress', 'completed')),
  rating NUMERIC(2,1) CHECK (rating >= 1 AND rating <= 5),
  notes TEXT,
  tags TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Enable Row Level Security
ALTER TABLE public.study_resources ENABLE ROW LEVEL SECURITY;

-- 3. Isolation Policies
CREATE POLICY "study_resources_user_isolation" ON public.study_resources
  FOR ALL USING (auth.uid() = user_id);

-- 4. Fast Lookups Indexes
CREATE INDEX IF NOT EXISTS idx_study_resources_user ON public.study_resources (user_id, subject_id);
CREATE INDEX IF NOT EXISTS idx_study_resources_topic ON public.study_resources (user_id, topic_id);
CREATE INDEX IF NOT EXISTS idx_study_resources_status ON public.study_resources (user_id, status);
