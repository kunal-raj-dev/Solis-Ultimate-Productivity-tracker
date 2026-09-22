-- ============================================================================
-- SOLIS MIGRATION: Task Time-Blocks & Collaborative Study Rooms Evolution
-- Date: September 2026
-- Description: Authoritative 24-hour daily time grid, time-block reviews,
--              study room codes, shared objectives, break states, timeline events,
--              and end-of-session reflective synthesis.
-- ============================================================================

-- 1. TASK TIME BLOCKS (24-Hour Daily Time Grid & Scheduling Engine)
CREATE TABLE IF NOT EXISTS public.task_time_blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  task_id UUID REFERENCES public.tasks(id) ON DELETE SET NULL,
  task_title TEXT NOT NULL,
  description TEXT,
  date DATE NOT NULL,
  start_hour INTEGER NOT NULL CHECK (start_hour >= 0 AND start_hour <= 23),
  start_minute INTEGER NOT NULL DEFAULT 0 CHECK (start_minute >= 0 AND start_minute <= 59),
  duration_minutes INTEGER NOT NULL DEFAULT 60 CHECK (duration_minutes > 0 AND duration_minutes <= 1440),
  subject_id UUID REFERENCES public.subjects(id) ON DELETE SET NULL,
  goal_id UUID REFERENCES public.goals(id) ON DELETE SET NULL,
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('urgent', 'high', 'medium', 'low')),
  status TEXT NOT NULL DEFAULT 'planned' CHECK (status IN ('planned', 'active', 'completed', 'partial', 'missed')),
  actual_minutes INTEGER NOT NULL DEFAULT 0 CHECK (actual_minutes >= 0),
  progress_percent INTEGER NOT NULL DEFAULT 0 CHECK (progress_percent >= 0 AND progress_percent <= 100),
  reflection TEXT,
  blocker TEXT,
  next_action TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Fast Indexes for Task Time Blocks
CREATE INDEX IF NOT EXISTS idx_task_time_blocks_user_date ON public.task_time_blocks(user_id, date);
CREATE INDEX IF NOT EXISTS idx_task_time_blocks_task_id ON public.task_time_blocks(task_id);
CREATE INDEX IF NOT EXISTS idx_task_time_blocks_status ON public.task_time_blocks(user_id, status);

-- Enable RLS on task_time_blocks
ALTER TABLE public.task_time_blocks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "task_time_blocks_user_isolation" ON public.task_time_blocks
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);


-- ============================================================================
-- 2. EXTEND STUDY ROOMS (Room Codes, Objectives, Break State, Types)
-- ============================================================================
ALTER TABLE public.study_rooms
  ADD COLUMN IF NOT EXISTS room_code TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS subject_id UUID REFERENCES public.subjects(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS topic TEXT,
  ADD COLUMN IF NOT EXISTS session_type TEXT NOT NULL DEFAULT 'deep_focus',
  ADD COLUMN IF NOT EXISTS shared_objective TEXT,
  ADD COLUMN IF NOT EXISTS break_duration_seconds INTEGER NOT NULL DEFAULT 300,
  ADD COLUMN IF NOT EXISTS is_break BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS is_private BOOLEAN NOT NULL DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_study_rooms_room_code ON public.study_rooms(room_code);
CREATE INDEX IF NOT EXISTS idx_study_rooms_subject ON public.study_rooms(subject_id);


-- ============================================================================
-- 3. EXTEND ROOM PARTICIPANTS (Personal Objective & Readiness)
-- ============================================================================
ALTER TABLE public.room_participants
  ADD COLUMN IF NOT EXISTS personal_objective TEXT,
  ADD COLUMN IF NOT EXISTS is_ready BOOLEAN NOT NULL DEFAULT FALSE;


-- ============================================================================
-- 4. STUDY ROOM TIMELINE EVENTS (Live Synchronized Room Log & Reactions)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.study_room_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES public.study_rooms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_name TEXT,
  event_type TEXT NOT NULL CHECK (
    event_type IN ('session_start', 'session_pause', 'session_resume', 'break_start', 'break_end', 'session_end', 'objective_achieved', 'nudge', 'reaction')
  ),
  message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_study_room_events_room_created ON public.study_room_events(room_id, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_study_room_events_user ON public.study_room_events(user_id);

ALTER TABLE public.study_room_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "study_room_events_select" ON public.study_room_events;
CREATE POLICY "study_room_events_select" ON public.study_room_events
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.room_participants rp
      WHERE rp.room_id = study_room_events.room_id
        AND rp.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "study_room_events_insert" ON public.study_room_events;
CREATE POLICY "study_room_events_insert" ON public.study_room_events
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM public.room_participants rp
      WHERE rp.room_id = study_room_events.room_id
        AND rp.user_id = auth.uid()
    )
  );


-- ============================================================================
-- 5. STUDY ROOM REFLECTIONS (End-of-Session Closing Synthesis)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.study_room_reflections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES public.study_rooms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_name TEXT,
  room_title TEXT NOT NULL,
  subject_id UUID REFERENCES public.subjects(id) ON DELETE SET NULL,
  subject_name TEXT,
  duration_seconds INTEGER NOT NULL DEFAULT 0,
  objective_achieved BOOLEAN NOT NULL DEFAULT TRUE,
  reflection_text TEXT NOT NULL DEFAULT '',
  next_step TEXT,
  retention_rating INTEGER DEFAULT 5,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_room_reflections_user ON public.study_room_reflections(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_room_reflections_room ON public.study_room_reflections(room_id);

ALTER TABLE public.study_room_reflections ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "room_reflections_user_isolation" ON public.study_room_reflections;
CREATE POLICY "room_reflections_user_isolation" ON public.study_room_reflections
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);


-- ============================================================================
-- 6. PERMISSIONS & REALTIME PUBLICATION
-- ============================================================================
GRANT SELECT, INSERT, UPDATE, DELETE ON public.task_time_blocks TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.study_room_events TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.study_room_reflections TO authenticated;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'task_time_blocks'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.task_time_blocks;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'study_room_events'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.study_room_events;
  END IF;
EXCEPTION
  WHEN undefined_object THEN
    NULL;
END $$;
