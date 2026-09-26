-- ============================================================================
-- SOLIS MIGRATION: Phase 5 Deep Learning Intelligence, Study Flow & Accessibility
-- Date: September 2026
-- Description:
--   Adds pre_session_energy to public.focus_sessions — the 3-tap pre-session
--   energy calibration (low | steady | sharp) captured on the Focus launch
--   screen before the timer starts (plan §5.1). Nullable by design: sessions
--   started without a check-in record no energy value.
-- ============================================================================

ALTER TABLE public.focus_sessions
  ADD COLUMN IF NOT EXISTS pre_session_energy TEXT;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'focus_sessions_pre_session_energy_check'
  ) THEN
    ALTER TABLE public.focus_sessions
      ADD CONSTRAINT focus_sessions_pre_session_energy_check
      CHECK (pre_session_energy IS NULL OR pre_session_energy IN ('low', 'steady', 'sharp'));
  END IF;
END $$;
