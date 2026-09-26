-- ============================================================================
-- SOLIS MIGRATION: Phase 6 — Study Room Host Failover
-- Plan §6.2: If the host disconnects, the oldest remaining participant is
-- auto-promoted to host.
--
-- Why an RPC instead of a plain UPDATE: the `study_rooms_update_host` RLS
-- policy (20260901_phase2_study_rooms.sql) only allows the CURRENT host to
-- update a room row, so a remaining participant can never promote itself
-- directly. This SECURITY DEFINER function performs the deterministic
-- promotion on behalf of the remaining participants after verifying the
-- caller is genuinely in the room and the host is genuinely gone.
--
-- Called from `SupabaseRoomsService.promoteNextHost` (useStudyRoom failover).
-- ============================================================================

CREATE OR REPLACE FUNCTION public.promote_next_study_room_host(p_room_id uuid)
RETURNS SETOF public.study_rooms
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_host_id uuid;
  v_next_host uuid;
BEGIN
  SELECT host_id INTO v_host_id
  FROM public.study_rooms
  WHERE id = p_room_id;

  IF v_host_id IS NULL THEN
    RETURN;
  END IF;

  -- Only a current participant of the room may trigger failover.
  IF NOT EXISTS (
    SELECT 1
    FROM public.room_participants
    WHERE room_id = p_room_id
      AND user_id = auth.uid()
  ) THEN
    RETURN;
  END IF;

  -- No-op while the host is still among the participants.
  IF EXISTS (
    SELECT 1
    FROM public.room_participants
    WHERE room_id = p_room_id
      AND user_id = v_host_id
  ) THEN
    RETURN;
  END IF;

  -- Deterministic election: oldest remaining participant wins; user_id is a
  -- stable tie-breaker for identical joined_at timestamps.
  SELECT user_id INTO v_next_host
  FROM public.room_participants
  WHERE room_id = p_room_id
  ORDER BY joined_at ASC, user_id ASC
  LIMIT 1;

  IF v_next_host IS NULL OR v_next_host = v_host_id THEN
    RETURN;
  END IF;

  UPDATE public.study_rooms
  SET host_id = v_next_host,
      updated_at = timezone('utc'::text, now())
  WHERE id = p_room_id
    AND host_id = v_host_id;

  RETURN QUERY
  SELECT *
  FROM public.study_rooms
  WHERE id = p_room_id;
END;
$$;

-- Any authenticated member of a room may request the failover check; the
-- function itself guards who can actually cause a promotion.
GRANT EXECUTE ON FUNCTION public.promote_next_study_room_host(uuid) TO authenticated;
