-- ============================================================================
-- SOLIS MIGRATION: Stage A — Learning Core (Spaced Reviews & Flashcards)
-- Date: August 2026
-- ============================================================================

-- 1. Create Flashcards Table
CREATE TABLE IF NOT EXISTS public.flashcards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  topic_id UUID REFERENCES public.study_topics(id) ON DELETE SET NULL,
  note_id UUID REFERENCES public.notes(id) ON DELETE SET NULL,
  front_prompt TEXT NOT NULL,
  back_answer TEXT NOT NULL,
  card_type TEXT NOT NULL DEFAULT 'standard' CHECK (card_type IN ('standard', 'cloze', 'concept')),
  difficulty_rating TEXT NOT NULL DEFAULT 'good' CHECK (difficulty_rating IN ('again', 'hard', 'good', 'easy')),
  repetition_count INT NOT NULL DEFAULT 0,
  interval_days INT NOT NULL DEFAULT 1,
  ease_factor NUMERIC(4,2) NOT NULL DEFAULT 2.50,
  next_review_date DATE NOT NULL DEFAULT CURRENT_DATE,
  last_reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Create Review Queue Items Table
CREATE TABLE IF NOT EXISTS public.review_queue_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  topic_id UUID NOT NULL REFERENCES public.study_topics(id) ON DELETE CASCADE,
  flashcard_id UUID REFERENCES public.flashcards(id) ON DELETE CASCADE,
  due_date DATE NOT NULL DEFAULT CURRENT_DATE,
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('urgent', 'high', 'medium', 'low')),
  reason TEXT NOT NULL,
  completed BOOLEAN NOT NULL DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.flashcards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.review_queue_items ENABLE ROW LEVEL SECURITY;

-- 3. Row Level Security Policies
CREATE POLICY "flashcards_user_isolation" ON public.flashcards
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "review_queue_user_isolation" ON public.review_queue_items
  FOR ALL USING (auth.uid() = user_id);

-- 4. Fast Query Indexes
CREATE INDEX IF NOT EXISTS idx_flashcards_user_subject ON public.flashcards (user_id, subject_id);
CREATE INDEX IF NOT EXISTS idx_flashcards_next_review ON public.flashcards (user_id, next_review_date);
CREATE INDEX IF NOT EXISTS idx_review_queue_user_due ON public.review_queue_items (user_id, due_date, completed);
