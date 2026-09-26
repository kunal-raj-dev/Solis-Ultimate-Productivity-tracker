-- ============================================================================
-- SOLIS MIGRATION: Phase 1 (F-103) — Multi-User Cloud Study Pacts
--
-- Enables two students to form weekly mutual accountability commitments:
--  - creator initiates pact with weekly target minutes & shared objective
--  - partner joins via unique 6-character alphanumeric invite code
--  - both students sync verified minutes from their personal study logs
--  - end-of-week summaries reflect mutual commitment in an anti-shame tone
--  - real-time updates broadcast over Supabase Realtime
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.study_pacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  creator_name text NOT NULL DEFAULT 'Scholar',
  partner_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  partner_name text NOT NULL,
  partner_email text,
  invite_code text NOT NULL UNIQUE,
  shared_objective text,
  subject_id uuid REFERENCES public.study_subjects(id) ON DELETE SET NULL,
  subject_name text,
  week_start_date date NOT NULL,
  week_end_date date NOT NULL,
  creator_target_minutes integer NOT NULL CHECK (creator_target_minutes >= 15),
  partner_target_minutes integer NOT NULL CHECK (partner_target_minutes >= 15),
  creator_confirmed_minutes integer NOT NULL DEFAULT 0 CHECK (creator_confirmed_minutes >= 0),
  partner_confirmed_minutes integer NOT NULL DEFAULT 0 CHECK (partner_confirmed_minutes >= 0),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'completed', 'cancelled')),
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  completed_at timestamp with time zone
);

-- Indexes for lightning queries
CREATE INDEX IF NOT EXISTS idx_study_pacts_created_by ON public.study_pacts(created_by);
CREATE INDEX IF NOT EXISTS idx_study_pacts_partner_id ON public.study_pacts(partner_id);
CREATE INDEX IF NOT EXISTS idx_study_pacts_invite_code ON public.study_pacts(invite_code);
CREATE INDEX IF NOT EXISTS idx_study_pacts_status ON public.study_pacts(status);
CREATE INDEX IF NOT EXISTS idx_study_pacts_week ON public.study_pacts(week_start_date, week_end_date);

-- Enable Row Level Security (RLS)
ALTER TABLE public.study_pacts ENABLE ROW LEVEL SECURITY;

-- 1. SELECT: Users can view pacts they created, pacts where they are the partner, or pending pacts to join
CREATE POLICY study_pacts_select ON public.study_pacts
  FOR SELECT
  TO authenticated
  USING (
    created_by = auth.uid()
    OR partner_id = auth.uid()
    OR status = 'pending'
  );

-- 2. INSERT: Users can create pacts
CREATE POLICY study_pacts_insert ON public.study_pacts
  FOR INSERT
  TO authenticated
  WITH CHECK (
    created_by = auth.uid()
  );

-- 3. UPDATE: Either member can update their progress; pending pacts can be joined
CREATE POLICY study_pacts_update ON public.study_pacts
  FOR UPDATE
  TO authenticated
  USING (
    created_by = auth.uid()
    OR partner_id = auth.uid()
    OR (status = 'pending' AND partner_id IS NULL)
  )
  WITH CHECK (
    created_by = auth.uid()
    OR partner_id = auth.uid()
    OR (status = 'active' AND partner_id = auth.uid())
  );

-- 4. DELETE: Only the creator may delete the pact
CREATE POLICY study_pacts_delete ON public.study_pacts
  FOR DELETE
  TO authenticated
  USING (
    created_by = auth.uid()
  );

-- ============================================================================
-- RPC: Join Study Pact by Invite Code
-- Ensures atomic partner assignment and status promotion to 'active'
-- ============================================================================
CREATE OR REPLACE FUNCTION public.join_study_pact_by_code(
  p_invite_code text,
  p_partner_name text
)
RETURNS SETOF public.study_pacts
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_pact public.study_pacts%ROWTYPE;
BEGIN
  SELECT * INTO v_pact
  FROM public.study_pacts
  WHERE invite_code = upper(trim(p_invite_code))
    AND status = 'pending'
    AND partner_id IS NULL;

  IF v_pact.id IS NULL THEN
    RAISE EXCEPTION 'Study pact invite code not found or already active.';
  END IF;

  IF v_pact.created_by = auth.uid() THEN
    RAISE EXCEPTION 'You cannot join your own study pact as partner.';
  END IF;

  UPDATE public.study_pacts
  SET partner_id = auth.uid(),
      partner_name = coalesce(nullif(trim(p_partner_name), ''), 'Peer Scholar'),
      status = 'active',
      updated_at = timezone('utc'::text, now())
  WHERE id = v_pact.id;

  RETURN QUERY
  SELECT *
  FROM public.study_pacts
  WHERE id = v_pact.id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.join_study_pact_by_code(text, text) TO authenticated;

-- Add study_pacts to Realtime publication
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
      AND schemaname = 'public' 
      AND tablename = 'study_pacts'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.study_pacts;
  END IF;
END $$;
