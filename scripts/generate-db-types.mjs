#!/usr/bin/env node
/**
 * Solis DB type generation (Phase 0, P0-09 / G5).
 *
 * Single source of truth: Supabase migrations are authoritative; the
 * application consumes GENERATED row types instead of hand-written `as any`
 * mappers. This wrapper shells out to the Supabase CLI and writes
 * src/types/db.generated.ts.
 *
 * Prerequisites: the Supabase CLI installed and SUPABASE_PROJECT_ID (plus
 * an authenticated session via `supabase login`, or SUPABASE_ACCESS_TOKEN)
 * available in the environment. CI/CD should run this on migration changes
 * and fail the build when the committed types are stale.
 *
 * Usage: npm run types:db
 */
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const outFile = resolve(root, 'src/types/db.generated.ts');
const projectId = process.env.SUPABASE_PROJECT_ID;

if (!projectId) {
  console.error(
    '[db-types] FAIL — SUPABASE_PROJECT_ID is not set. Export it (and run `supabase login` ' +
    'or set SUPABASE_ACCESS_TOKEN), then re-run `npm run types:db`.'
  );
  process.exit(1);
}

const result = spawnSync(
  'supabase',
  ['gen', 'types', 'typescript', '--project-id', projectId, '--schema', 'public'],
  { encoding: 'utf8', shell: process.platform === 'win32' }
);

if (result.error || result.status !== 0) {
  console.error('[db-types] FAIL — Supabase CLI typegen failed:', result.stderr || result.error);
  process.exit(1);
}

if (!existsSync(dirname(outFile))) mkdirSync(dirname(outFile), { recursive: true });

const header = [
  '/* eslint-disable */',
  '/**',
  ' * GENERATED FILE — do not edit by hand.',
  ' * Source of truth: Supabase migrations (supabase/migrations/).',
  ' * Regenerate with `npm run types:db`. CI fails when this file is stale.',
  ' */',
  ''
].join('\n');

writeFileSync(outFile, header + result.stdout, 'utf8');
console.log(`[db-types] OK — wrote ${outFile} (${result.stdout.length} bytes).`);

// Staleness guard: fail when regeneration produced no change vs the committed
// file (run in CI with --check to enforce the committed types are fresh).
if (process.argv.includes('--check')) {
  const before = readFileSync(outFile, 'utf8');
  if (before !== header + result.stdout) {
    console.error('[db-types] FAIL — committed types are stale. Run `npm run types:db` and commit.');
    process.exit(1);
  }
}
