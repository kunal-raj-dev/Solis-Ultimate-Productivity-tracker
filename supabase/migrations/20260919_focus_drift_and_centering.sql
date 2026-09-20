-- ============================================================================
-- SOLIS MIGRATION: Focus Cognitive Drift & Centering Sanctuary Engine
-- Date: September 2026
-- ============================================================================

-- 1. Add parked_thoughts, flow_quality, soundscape_type, and target_outcome to focus_sessions table
ALTER TABLE public.focus_sessions
  ADD COLUMN IF NOT EXISTS parked_thoughts JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS flow_quality INTEGER CHECK (flow_quality >= 1 AND flow_quality <= 5),
  ADD COLUMN IF NOT EXISTS soundscape_type TEXT,
  ADD COLUMN IF NOT EXISTS target_outcome TEXT;

-- 2. Standalone Drift Thoughts Table for cross-session cognitive distraction analytics
CREATE TABLE IF NOT EXISTS public.drift_thoughts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  focus_session_id UUID REFERENCES public.focus_sessions(id) ON DELETE SET NULL,
  subject_id UUID REFERENCES public.subjects(id) ON DELETE SET NULL,
  text TEXT NOT NULL,
  thought_type VARCHAR(20) NOT NULL CHECK (thought_type IN ('task', 'note', 'question')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Row Level Security Hardening
ALTER TABLE public.drift_thoughts ENABLE ROW LEVEL SECURITY;

-- 4. Isolation Policies (100% User Isolation)
CREATE POLICY "drift_thoughts_user_isolation" ON public.drift_thoughts
  FOR ALL USING (auth.uid() = user_id);

-- 5. Performance Indexes
CREATE INDEX IF NOT EXISTS idx_drift_thoughts_user_created ON public.drift_thoughts (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_drift_thoughts_session ON public.drift_thoughts (focus_session_id);
