-- ============================================================================
-- SOLIS — PHASE 4 POSTGRESQL SCHEMA REFERENCE (Strictly Acyclic RLS)
-- Advanced Study System, Knowledge Workspace & Domain Interconnection
-- ============================================================================

-- 1. ENHANCE SUBJECTS WITH STATUS & DESCRIPTION
ALTER TABLE public.subjects
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived')),
  ADD COLUMN IF NOT EXISTS description TEXT;

-- 2. CREATE CANONICAL STUDY TOPICS TABLE
CREATE TABLE IF NOT EXISTS public.study_topics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  order_index INTEGER NOT NULL DEFAULT 0,
  mastery_level TEXT NOT NULL DEFAULT 'unstudied' CHECK (mastery_level IN ('unstudied', 'learning', 'mastered')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_study_topics_subject ON public.study_topics(user_id, subject_id);
ALTER TABLE public.study_topics ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "study_topics_user_isolation" ON public.study_topics;
CREATE POLICY "study_topics_user_isolation" ON public.study_topics
  FOR ALL USING (
    auth.uid() = user_id AND
    EXISTS (SELECT 1 FROM public.subjects WHERE public.subjects.id = study_topics.subject_id AND public.subjects.user_id = auth.uid())
  )
  WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (SELECT 1 FROM public.subjects WHERE public.subjects.id = study_topics.subject_id AND public.subjects.user_id = auth.uid())
  );

-- 3. ENHANCE STUDY PLAN ITEMS (Acyclic: checks subjects & study_topics)
ALTER TABLE public.study_plan_items
  ADD COLUMN IF NOT EXISTS topic_id UUID REFERENCES public.study_topics(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS scheduled_date DATE DEFAULT CURRENT_DATE,
  ADD COLUMN IF NOT EXISTS priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('urgent', 'high', 'medium', 'low')),
  ADD COLUMN IF NOT EXISTS notes TEXT,
  ADD COLUMN IF NOT EXISTS linked_task_id UUID REFERENCES public.tasks(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_study_plan_topic ON public.study_plan_items(topic_id);
CREATE INDEX IF NOT EXISTS idx_study_plan_task ON public.study_plan_items(linked_task_id);

DROP POLICY IF EXISTS "study_plan_user_isolation" ON public.study_plan_items;
CREATE POLICY "study_plan_user_isolation" ON public.study_plan_items
  FOR ALL USING (
    auth.uid() = user_id AND
    (subject_id IS NULL OR EXISTS (SELECT 1 FROM public.subjects WHERE public.subjects.id = study_plan_items.subject_id AND public.subjects.user_id = auth.uid())) AND
    (topic_id IS NULL OR EXISTS (SELECT 1 FROM public.study_topics WHERE public.study_topics.id = study_plan_items.topic_id AND public.study_topics.user_id = auth.uid()))
  )
  WITH CHECK (
    auth.uid() = user_id AND
    (subject_id IS NULL OR EXISTS (SELECT 1 FROM public.subjects WHERE public.subjects.id = study_plan_items.subject_id AND public.subjects.user_id = auth.uid())) AND
    (topic_id IS NULL OR EXISTS (SELECT 1 FROM public.study_topics WHERE public.study_topics.id = study_plan_items.topic_id AND public.study_topics.user_id = auth.uid()))
  );

-- 4. ENHANCE TASKS (Acyclic: checks subjects & study_plan_items)
ALTER TABLE public.tasks
  ADD COLUMN IF NOT EXISTS plan_item_id UUID REFERENCES public.study_plan_items(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_tasks_plan_item ON public.tasks(plan_item_id);

DROP POLICY IF EXISTS "tasks_user_isolation" ON public.tasks;
CREATE POLICY "tasks_user_isolation" ON public.tasks
  FOR ALL USING (
    auth.uid() = user_id AND
    (subject_id IS NULL OR EXISTS (SELECT 1 FROM public.subjects WHERE public.subjects.id = tasks.subject_id AND public.subjects.user_id = auth.uid())) AND
    (plan_item_id IS NULL OR EXISTS (SELECT 1 FROM public.study_plan_items WHERE public.study_plan_items.id = tasks.plan_item_id AND public.study_plan_items.user_id = auth.uid()))
  )
  WITH CHECK (
    auth.uid() = user_id AND
    (subject_id IS NULL OR EXISTS (SELECT 1 FROM public.subjects WHERE public.subjects.id = tasks.subject_id AND public.subjects.user_id = auth.uid())) AND
    (plan_item_id IS NULL OR EXISTS (SELECT 1 FROM public.study_plan_items WHERE public.study_plan_items.id = tasks.plan_item_id AND public.study_plan_items.user_id = auth.uid()))
  );

-- 5. ENHANCE FOCUS SESSIONS (Acyclic: checks subjects & study_plan_items)
ALTER TABLE public.focus_sessions
  ADD COLUMN IF NOT EXISTS subject_id UUID REFERENCES public.subjects(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS plan_item_id UUID REFERENCES public.study_plan_items(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS topic TEXT;

CREATE INDEX IF NOT EXISTS idx_focus_sessions_subject ON public.focus_sessions(subject_id);
CREATE INDEX IF NOT EXISTS idx_focus_sessions_plan_item ON public.focus_sessions(plan_item_id);

DROP POLICY IF EXISTS "focus_sessions_user_isolation" ON public.focus_sessions;
CREATE POLICY "focus_sessions_user_isolation" ON public.focus_sessions
  FOR ALL USING (
    auth.uid() = user_id AND
    (subject_id IS NULL OR EXISTS (SELECT 1 FROM public.subjects WHERE public.subjects.id = focus_sessions.subject_id AND public.subjects.user_id = auth.uid())) AND
    (plan_item_id IS NULL OR EXISTS (SELECT 1 FROM public.study_plan_items WHERE public.study_plan_items.id = focus_sessions.plan_item_id AND public.study_plan_items.user_id = auth.uid()))
  )
  WITH CHECK (
    auth.uid() = user_id AND
    (subject_id IS NULL OR EXISTS (SELECT 1 FROM public.subjects WHERE public.subjects.id = focus_sessions.subject_id AND public.subjects.user_id = auth.uid())) AND
    (plan_item_id IS NULL OR EXISTS (SELECT 1 FROM public.study_plan_items WHERE public.study_plan_items.id = focus_sessions.plan_item_id AND public.study_plan_items.user_id = auth.uid()))
  );

-- 6. ENHANCE STUDY SESSIONS (Acyclic: checks subjects, study_plan_items & focus_sessions)
ALTER TABLE public.study_sessions
  ADD COLUMN IF NOT EXISTS plan_item_id UUID REFERENCES public.study_plan_items(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS focus_session_id UUID REFERENCES public.focus_sessions(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_study_sessions_plan_item ON public.study_sessions(plan_item_id);
CREATE INDEX IF NOT EXISTS idx_study_sessions_focus ON public.study_sessions(focus_session_id);

DROP POLICY IF EXISTS "study_sessions_user_isolation" ON public.study_sessions;
CREATE POLICY "study_sessions_user_isolation" ON public.study_sessions
  FOR ALL USING (
    auth.uid() = user_id AND
    (subject_id IS NULL OR EXISTS (SELECT 1 FROM public.subjects WHERE public.subjects.id = study_sessions.subject_id AND public.subjects.user_id = auth.uid())) AND
    (plan_item_id IS NULL OR EXISTS (SELECT 1 FROM public.study_plan_items WHERE public.study_plan_items.id = study_sessions.plan_item_id AND public.study_plan_items.user_id = auth.uid())) AND
    (focus_session_id IS NULL OR EXISTS (SELECT 1 FROM public.focus_sessions WHERE public.focus_sessions.id = study_sessions.focus_session_id AND public.focus_sessions.user_id = auth.uid()))
  )
  WITH CHECK (
    auth.uid() = user_id AND
    (subject_id IS NULL OR EXISTS (SELECT 1 FROM public.subjects WHERE public.subjects.id = study_sessions.subject_id AND public.subjects.user_id = auth.uid())) AND
    (plan_item_id IS NULL OR EXISTS (SELECT 1 FROM public.study_plan_items WHERE public.study_plan_items.id = study_sessions.plan_item_id AND public.study_plan_items.user_id = auth.uid())) AND
    (focus_session_id IS NULL OR EXISTS (SELECT 1 FROM public.focus_sessions WHERE public.focus_sessions.id = study_sessions.focus_session_id AND public.focus_sessions.user_id = auth.uid()))
  );

-- 7. ENHANCE NOTES (Acyclic: checks subjects, study_sessions & study_plan_items)
ALTER TABLE public.notes
  ADD COLUMN IF NOT EXISTS study_session_id UUID REFERENCES public.study_sessions(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS plan_item_id UUID REFERENCES public.study_plan_items(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_notes_subject_id ON public.notes(subject_id);
CREATE INDEX IF NOT EXISTS idx_notes_study_session ON public.notes(study_session_id);
CREATE INDEX IF NOT EXISTS idx_notes_plan_item ON public.notes(plan_item_id);

DROP POLICY IF EXISTS "notes_user_isolation" ON public.notes;
CREATE POLICY "notes_user_isolation" ON public.notes
  FOR ALL USING (
    auth.uid() = user_id AND
    (subject_id IS NULL OR EXISTS (SELECT 1 FROM public.subjects WHERE public.subjects.id = notes.subject_id AND public.subjects.user_id = auth.uid())) AND
    (study_session_id IS NULL OR EXISTS (SELECT 1 FROM public.study_sessions WHERE public.study_sessions.id = notes.study_session_id AND public.study_sessions.user_id = auth.uid())) AND
    (plan_item_id IS NULL OR EXISTS (SELECT 1 FROM public.study_plan_items WHERE public.study_plan_items.id = notes.plan_item_id AND public.study_plan_items.user_id = auth.uid()))
  )
  WITH CHECK (
    auth.uid() = user_id AND
    (subject_id IS NULL OR EXISTS (SELECT 1 FROM public.subjects WHERE public.subjects.id = notes.subject_id AND public.subjects.user_id = auth.uid())) AND
    (study_session_id IS NULL OR EXISTS (SELECT 1 FROM public.study_sessions WHERE public.study_sessions.id = notes.study_session_id AND public.study_sessions.user_id = auth.uid())) AND
    (plan_item_id IS NULL OR EXISTS (SELECT 1 FROM public.study_plan_items WHERE public.study_plan_items.id = notes.plan_item_id AND public.study_plan_items.user_id = auth.uid()))
  );

-- 8. ENHANCE GOALS (Acyclic: checks subjects)
ALTER TABLE public.goals
  ADD COLUMN IF NOT EXISTS subject_id UUID REFERENCES public.subjects(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_goals_subject_id ON public.goals(subject_id);

DROP POLICY IF EXISTS "goals_user_isolation" ON public.goals;
CREATE POLICY "goals_user_isolation" ON public.goals
  FOR ALL USING (
    auth.uid() = user_id AND
    (subject_id IS NULL OR EXISTS (SELECT 1 FROM public.subjects WHERE public.subjects.id = goals.subject_id AND public.subjects.user_id = auth.uid()))
  )
  WITH CHECK (
    auth.uid() = user_id AND
    (subject_id IS NULL OR EXISTS (SELECT 1 FROM public.subjects WHERE public.subjects.id = goals.subject_id AND public.subjects.user_id = auth.uid()))
  );
