#!/usr/bin/env node
/**
 * Solis deploy-time schema check (Phase 0, P0-02).
 *
 * Validates that the deployed Supabase tables expose every column this build
 * writes. The check reads the PostgREST OpenAPI document (GET /rest/v1/ with
 * the anon key), which lists every table and column the API exposes — no
 * direct database connection required.
 *
 * Why: the V1 codebase silently retried PGRST204 ("Could not find the
 * 'recurrence' column") writes with the new columns stripped, corrupting data
 * instead of surfacing drift. That retry is gone; this check is the
 * companion gate. CI runs it when SUPABASE_URL + SUPABASE_ANON_KEY secrets
 * are present; locally run `npm run schema:check` with the same env vars.
 *
 * Exit codes: 0 = all expected columns present (or check skipped by design);
 * 1 = one or more expected columns are missing from the deployed schema.
 */

const EXPECTED_COLUMNS = {
  // Written by tasks.service.ts (the columns the old PGRST204 retry stripped).
  tasks: ['recurrence', 'is_recurring', 'deferral_count', 'natural_language_input', 'plan_item_id', 'completed_minutes'],
  // Written by the study-plan flows and read by getTodayPlan (Phase 0 P0-07).
  study_plan_items: ['scheduled_date', 'priority', 'completed', 'target_minutes'],
  // Written by the focus/study auto-cascade (FocusContext).
  study_sessions: ['plan_item_id', 'focus_session_id', 'retention_rating', 'duration_minutes'],
  // Realtime rooms (Phase 5 of V1; future Phase-2 V2 work builds here).
  study_rooms: ['timer_state', 'started_at', 'paused_elapsed_seconds', 'target_duration_seconds'],
  room_participants: ['joined_at', 'status'],
};

function extractTables(openApi) {
  // PostgREST v9- exposes `definitions`; v10+/v12 exposes `components.schemas`.
  if (openApi.definitions) return openApi.definitions;
  if (openApi.components && openApi.components.schemas) return openApi.components.schemas;
  return null;
}

async function main() {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const anonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    console.log('[schema-check] SKIP — SUPABASE_URL / SUPABASE_ANON_KEY not set. ' +
      'Set them (CI secrets or local env) to run the check.');
    process.exit(0);
  }

  const base = url.replace(/\/+$/, '');
  const openApiUrl = `${base}/rest/v1/`;

  let openApi;
  try {
    const res = await fetch(openApiUrl, {
      headers: { apikey: anonKey, Authorization: `Bearer ${anonKey}`, Accept: 'application/openapi+json' }
    });
    if (!res.ok) {
      console.error(`[schema-check] FAIL — OpenAPI document returned HTTP ${res.status}.`);
      process.exit(1);
    }
    openApi = await res.json();
  } catch (err) {
    console.error('[schema-check] FAIL — could not reach the PostgREST OpenAPI document:', err.message);
    process.exit(1);
  }

  const tables = extractTables(openApi);
  if (!tables) {
    console.error('[schema-check] FAIL — OpenAPI document has no definitions/components.schemas. Unexpected PostgREST version?');
    process.exit(1);
  }

  const missing = [];
  for (const [table, columns] of Object.entries(EXPECTED_COLUMNS)) {
    const schema = tables[table];
    if (!schema || !schema.properties) {
      missing.push(`${table}: TABLE MISSING from the exposed API (check RLS/exposure and migrations)`);
      continue;
    }
    const present = new Set(Object.keys(schema.properties));
    for (const column of columns) {
      if (!present.has(column)) missing.push(`${table}.${column}`);
    }
  }

  if (missing.length > 0) {
    console.error('[schema-check] FAIL — the deployed schema is missing columns this build writes:');
    for (const m of missing) console.error(`  - ${m}`);
    console.error('Apply pending Supabase migrations, then re-run. Do NOT strip columns from application writes.');
    process.exit(1);
  }

  console.log(`[schema-check] OK — ${Object.keys(EXPECTED_COLUMNS).length} tables checked, all expected columns present.`);
  process.exit(0);
}

main();
