-- ============================================================================
-- SOLIS MIGRATION: Task System Part 1 Evolution
-- Date: September 2026
-- Description: Supports recurring task specifications, natural language raw inputs,
--              workload realism, and enhanced time-block status linkages.
-- ============================================================================

-- 1. EXTEND TASKS TABLE WITH RECURRENCE & NLP CAPABILITIES
ALTER TABLE public.tasks
  ADD COLUMN IF NOT EXISTS recurrence JSONB,
  ADD COLUMN IF NOT EXISTS is_recurring BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS natural_language_input TEXT;

-- 2. CREATE INDEX FOR RECURRING TASK RETRIEVAL
CREATE INDEX IF NOT EXISTS idx_tasks_user_recurring ON public.tasks(user_id, is_recurring);

-- 3. ENSURE STATUS CHECK ACCEPTS 'partial' AND 'missed' FOR TASK CONTINUITY
ALTER TABLE public.tasks DROP CONSTRAINT IF EXISTS tasks_status_check;
ALTER TABLE public.tasks
  ADD CONSTRAINT tasks_status_check
  CHECK (status IN ('todo', 'in_progress', 'completed', 'partial', 'missed', 'archived'));
