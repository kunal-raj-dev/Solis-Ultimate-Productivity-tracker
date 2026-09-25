-- ============================================================================
-- SOLIS MIGRATION: Phase 1 Canonical Data Integrity, FK & RLS Fixes
-- Date: September 2026
-- Description:
--   1. Adds missing task_id column & index to public.focus_sessions (fixes PGRST204).
--   2. Adds explicit foreign keys from study_rooms, room_participants, room_messages,
--      study_room_events, and study_room_reflections to public.profiles(id) so
--      PostgREST embedded joins (profiles:host_id, profiles:user_id) resolve cleanly
--      without PGRST200 errors.
--   3. Updates RLS policies on public.profiles and public.study_room_reflections so
--      authenticated Study Room peers can resolve display names and room reflections.
--   4. Ensures all collaborative study room tables are registered in supabase_realtime.
-- ============================================================================

-- 1. ADD task_id TO public.focus_sessions
ALTER TABLE public.focus_sessions
  ADD COLUMN IF NOT EXISTS task_id UUID REFERENCES public.tasks(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_focus_sessions_task_id ON public.focus_sessions(task_id);

DROP POLICY IF EXISTS "focus_sessions_user_isolation" ON public.focus_sessions;
CREATE POLICY "focus_sessions_user_isolation" ON public.focus_sessions
  FOR ALL USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);


-- 2. ENSURE EVERY AUTH USER HAS A CORRESPONDING public.profiles ROW BEFORE ADDING FKs
INSERT INTO public.profiles (id, name, email)
SELECT
  u.id,
  COALESCE(u.raw_user_meta_data->>'name', 'Solis Scholar'),
  COALESCE(u.email, 'scholar@solis.space')
FROM auth.users u
WHERE NOT EXISTS (
  SELECT 1 FROM public.profiles p WHERE p.id = u.id
)
ON CONFLICT (id) DO NOTHING;


-- 3. ADD FOREIGN KEYS TO public.profiles(id) FOR POSTGREST EMBEDDED JOINS
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'study_rooms_host_id_profiles_fkey'
  ) THEN
    ALTER TABLE public.study_rooms
      ADD CONSTRAINT study_rooms_host_id_profiles_fkey
      FOREIGN KEY (host_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'room_participants_user_id_profiles_fkey'
  ) THEN
    ALTER TABLE public.room_participants
      ADD CONSTRAINT room_participants_user_id_profiles_fkey
      FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'room_messages_user_id_profiles_fkey'
  ) THEN
    ALTER TABLE public.room_messages
      ADD CONSTRAINT room_messages_user_id_profiles_fkey
      FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'study_room_events_user_id_profiles_fkey'
  ) THEN
    ALTER TABLE public.study_room_events
      ADD CONSTRAINT study_room_events_user_id_profiles_fkey
      FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'study_room_reflections_user_id_profiles_fkey'
  ) THEN
    ALTER TABLE public.study_room_reflections
      ADD CONSTRAINT study_room_reflections_user_id_profiles_fkey
      FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
  END IF;
END $$;


-- 4. RLS POLICIES FOR COLLABORATIVE PROFILE & REFLECTION VISIBILITY
-- Allow authenticated users to read profile display names for Study Room hosts/participants
DROP POLICY IF EXISTS "profiles_select_authenticated" ON public.profiles;
CREATE POLICY "profiles_select_authenticated" ON public.profiles
  FOR SELECT TO authenticated
  USING (true);

-- Allow authenticated users to read shared reflections within study rooms while restricting writes to own rows
DROP POLICY IF EXISTS "room_reflections_select_authenticated" ON public.study_room_reflections;
CREATE POLICY "room_reflections_select_authenticated" ON public.study_room_reflections
  FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS "room_reflections_user_isolation" ON public.study_room_reflections;
CREATE POLICY "room_reflections_user_isolation" ON public.study_room_reflections
  FOR ALL TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);


-- 5. ENSURE REALTIME PUBLICATION COVERAGE
DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOREACH tbl IN ARRAY ARRAY[
    'study_rooms',
    'room_participants',
    'room_messages',
    'study_room_events',
    'study_room_reflections',
    'task_time_blocks'
  ]
  LOOP
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime' AND tablename = tbl
    ) THEN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I', tbl);
    END IF;
  END LOOP;
EXCEPTION
  WHEN undefined_object THEN
    NULL;
END $$;
