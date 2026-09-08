-- ============================================================================
-- SOLIS MIGRATION: Phase 2 — Solis Study Rooms & Real-Time Engine
-- Date: September 2026
-- Description: Real-time collaborative study rooms with authoritative epoch timer,
--              participant presence tracking, and synchronized room chat.
-- ============================================================================

-- 1. STUDY ROOMS TABLE (Authoritative Epoch-based Session Anchor)
CREATE TABLE IF NOT EXISTS public.study_rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  host_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  timer_state TEXT NOT NULL DEFAULT 'idle' CHECK (timer_state IN ('idle', 'running', 'paused')),
  target_duration_seconds INTEGER NOT NULL DEFAULT 1500 CHECK (target_duration_seconds > 0 AND target_duration_seconds <= 14400),
  started_at TIMESTAMPTZ,
  paused_elapsed_seconds INTEGER NOT NULL DEFAULT 0 CHECK (paused_elapsed_seconds >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Fast Indexes for Study Rooms
CREATE INDEX IF NOT EXISTS idx_study_rooms_host_id ON public.study_rooms (host_id);
CREATE INDEX IF NOT EXISTS idx_study_rooms_created_at ON public.study_rooms (created_at DESC);

-- Enable RLS on study_rooms
ALTER TABLE public.study_rooms ENABLE ROW LEVEL SECURITY;

-- RLS Policies for study_rooms
DROP POLICY IF EXISTS "study_rooms_select_authenticated" ON public.study_rooms;
CREATE POLICY "study_rooms_select_authenticated" ON public.study_rooms
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "study_rooms_insert_host" ON public.study_rooms;
CREATE POLICY "study_rooms_insert_host" ON public.study_rooms
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = host_id);

DROP POLICY IF EXISTS "study_rooms_update_host" ON public.study_rooms;
CREATE POLICY "study_rooms_update_host" ON public.study_rooms
  FOR UPDATE TO authenticated
  USING (auth.uid() = host_id)
  WITH CHECK (auth.uid() = host_id);

DROP POLICY IF EXISTS "study_rooms_delete_host" ON public.study_rooms;
CREATE POLICY "study_rooms_delete_host" ON public.study_rooms
  FOR DELETE TO authenticated
  USING (auth.uid() = host_id);


-- ============================================================================
-- 2. ROOM PARTICIPANTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.room_participants (
  room_id UUID NOT NULL REFERENCES public.study_rooms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'focusing' CHECK (status IN ('focusing', 'break', 'idle')),
  joined_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  PRIMARY KEY (room_id, user_id)
);

-- Indexes for room participants
CREATE INDEX IF NOT EXISTS idx_room_participants_room ON public.room_participants (room_id);
CREATE INDEX IF NOT EXISTS idx_room_participants_user ON public.room_participants (user_id);

-- Enable RLS on room_participants
ALTER TABLE public.room_participants ENABLE ROW LEVEL SECURITY;

-- RLS Policies for room_participants
DROP POLICY IF EXISTS "room_participants_select" ON public.room_participants;
CREATE POLICY "room_participants_select" ON public.room_participants
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "room_participants_insert_own" ON public.room_participants;
CREATE POLICY "room_participants_insert_own" ON public.room_participants
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "room_participants_update_own" ON public.room_participants;
CREATE POLICY "room_participants_update_own" ON public.room_participants
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "room_participants_delete_own" ON public.room_participants;
CREATE POLICY "room_participants_delete_own" ON public.room_participants
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);


-- ============================================================================
-- 3. ROOM MESSAGES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.room_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES public.study_rooms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL CHECK (char_length(content) > 0 AND char_length(content) <= 2000),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Indexes for room messages
CREATE INDEX IF NOT EXISTS idx_room_messages_room_created ON public.room_messages (room_id, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_room_messages_user ON public.room_messages (user_id);

-- Enable RLS on room_messages
ALTER TABLE public.room_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for room_messages (Only active room participants can read/send)
DROP POLICY IF EXISTS "room_messages_select_participant" ON public.room_messages;
CREATE POLICY "room_messages_select_participant" ON public.room_messages
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.room_participants rp
      WHERE rp.room_id = room_messages.room_id
        AND rp.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "room_messages_insert_participant" ON public.room_messages;
CREATE POLICY "room_messages_insert_participant" ON public.room_messages
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM public.room_participants rp
      WHERE rp.room_id = room_messages.room_id
        AND rp.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "room_messages_delete_own" ON public.room_messages;
CREATE POLICY "room_messages_delete_own" ON public.room_messages
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);


-- ============================================================================
-- 4. PERMISSIONS & REALTIME PUBLICATION
-- ============================================================================
GRANT SELECT, INSERT, UPDATE, DELETE ON public.study_rooms TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.room_participants TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.room_messages TO authenticated;

-- Ensure Realtime publications include the new tables
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'study_rooms'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.study_rooms;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'room_participants'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.room_participants;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'room_messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.room_messages;
  END IF;
EXCEPTION
  WHEN undefined_object THEN
    -- Fallback if publication does not exist yet in local development
    NULL;
END $$;
