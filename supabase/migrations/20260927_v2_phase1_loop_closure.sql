-- ============================================================================
-- SOLIS V2 — PHASE 1 LOOP CLOSURE (C2 / C3 / C5)
-- Canonical schedule model, proposal/approve-diff layer, state continuity.
-- All tables are user-scoped with RLS, matching the existing security spine.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. schedule_entries (C3) — the canonical schedule model.
--    Every planning surface (dashboard timeline, hourly/weekly planner, study
--    agenda, calendar overlay) projects from here. Provenance
--    (source_kind + source_id) ties each entry back to its owning domain
--    object; entries are written through those domains, never independently.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS schedule_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  entry_type TEXT NOT NULL DEFAULT 'flexible'
    CHECK (entry_type IN ('fixed', 'flexible', 'defended')),
  source_kind TEXT NOT NULL
    CHECK (source_kind IN ('task', 'study_plan_item', 'time_block', 'habit_window',
                           'review', 'rest', 'buffer', 'external_calendar', 'manual')),
  source_id TEXT,
  title TEXT NOT NULL,
  date DATE NOT NULL,
  start_hour DOUBLE PRECISION,
  duration_minutes INTEGER NOT NULL DEFAULT 30,
  status TEXT NOT NULL DEFAULT 'planned'
    CHECK (status IN ('planned', 'in_progress', 'done', 'partial', 'missed', 'cancelled')),
  actual_minutes INTEGER NOT NULL DEFAULT 0,
  provenance JSONB,
  recurrence_rule JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE schedule_entries IS
  'V2 canonical schedule model — one entry per planned commitment; surfaces project from it.';

CREATE INDEX IF NOT EXISTS idx_schedule_entries_user_date
  ON schedule_entries (user_id, date);
CREATE INDEX IF NOT EXISTS idx_schedule_entries_source
  ON schedule_entries (user_id, source_kind, source_id);

ALTER TABLE schedule_entries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "schedule_entries_select_own" ON schedule_entries;
CREATE POLICY "schedule_entries_select_own" ON schedule_entries
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "schedule_entries_insert_own" ON schedule_entries;
CREATE POLICY "schedule_entries_insert_own" ON schedule_entries
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "schedule_entries_update_own" ON schedule_entries;
CREATE POLICY "schedule_entries_update_own" ON schedule_entries
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "schedule_entries_delete_own" ON schedule_entries;
CREATE POLICY "schedule_entries_delete_own" ON schedule_entries
  FOR DELETE USING (auth.uid() = user_id);

-- ----------------------------------------------------------------------------
-- 2. proposals (C5) — the proposal / approve-diff object layer.
--    Every engine- or AI-proposed change lands here for the triage inbox.
--    Nothing edits the plan silently; approval is always explicit.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS proposals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  kind TEXT NOT NULL
    CHECK (kind IN ('insight_action', 'reflow', 'placement', 'break', 'plan_draft',
                    'review_diff', 'collision_tradeoff', 'woop_fallback')),
  source TEXT NOT NULL DEFAULT 'engine' CHECK (source IN ('engine', 'ai')),
  title TEXT NOT NULL,
  evidence TEXT,
  diff JSONB,
  status TEXT NOT NULL DEFAULT 'open'
    CHECK (status IN ('open', 'approved', 'dismissed', 'expired')),
  dedupe_key TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  decided_at TIMESTAMPTZ
);

COMMENT ON TABLE proposals IS
  'V2 proposal/approve-diff layer — AI proposes, user disposes; the triage inbox surface.';

CREATE INDEX IF NOT EXISTS idx_proposals_user_status
  ON proposals (user_id, status);
CREATE UNIQUE INDEX IF NOT EXISTS idx_proposals_open_dedupe
  ON proposals (user_id, dedupe_key)
  WHERE status = 'open' AND dedupe_key IS NOT NULL;

ALTER TABLE proposals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "proposals_select_own" ON proposals;
CREATE POLICY "proposals_select_own" ON proposals
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "proposals_insert_own" ON proposals;
CREATE POLICY "proposals_insert_own" ON proposals
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "proposals_update_own" ON proposals;
CREATE POLICY "proposals_update_own" ON proposals
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "proposals_delete_own" ON proposals;
CREATE POLICY "proposals_delete_own" ON proposals
  FOR DELETE USING (auth.uid() = user_id);

-- ----------------------------------------------------------------------------
-- 3. state_sync_items (C2) — user-scoped state continuity.
--    The ~40 device-local solis_* key classes move to the cloud; localStorage
--    is demoted to the offline cache. Last-write-wins by updated_at.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS state_sync_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  key TEXT NOT NULL,
  key_class TEXT NOT NULL DEFAULT 'user_content'
    CHECK (key_class IN ('user_content', 'device_preference', 'ephemeral')),
  payload JSONB,
  device_origin TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, key)
);

COMMENT ON TABLE state_sync_items IS
  'V2 state continuity — device-local solis_* key classes, cloud-backed; LWW by updated_at.';

CREATE INDEX IF NOT EXISTS idx_state_sync_user ON state_sync_items (user_id);

ALTER TABLE state_sync_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "state_sync_select_own" ON state_sync_items;
CREATE POLICY "state_sync_select_own" ON state_sync_items
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "state_sync_insert_own" ON state_sync_items;
CREATE POLICY "state_sync_insert_own" ON state_sync_items
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "state_sync_update_own" ON state_sync_items;
CREATE POLICY "state_sync_update_own" ON state_sync_items
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "state_sync_delete_own" ON state_sync_items;
CREATE POLICY "state_sync_delete_own" ON state_sync_items
  FOR DELETE USING (auth.uid() = user_id);
