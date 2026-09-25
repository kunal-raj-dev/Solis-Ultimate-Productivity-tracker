#!/usr/bin/env node
/**
 * ============================================================================
 * SOLIS — HIGH-RELIABILITY KEEPALIVE & INACTIVITY PREVENTER
 * ============================================================================
 * 
 * Purpose:
 * Supabase Free Tier projects automatically pause after 7 days of inactivity.
 * This script sends an authenticated keepalive ping to the Supabase REST API
 * and optionally pings the production frontend site to prevent spin-down.
 * 
 * Usage:
 *   node scripts/keepalive.mjs
 *   npm run keepalive
 * 
 * Can be run locally, in GitHub Actions, or scheduled via external cron.
 */

import fs from 'fs';
import path from 'path';

// Helper to safely load env vars from .env or .env.local without throwing
function loadEnv() {
  const env = { ...process.env };
  const envFiles = ['.env', '.env.local', '.env.production'];

  for (const file of envFiles) {
    const fullPath = path.resolve(process.cwd(), file);
    if (fs.existsSync(fullPath)) {
      try {
        const content = fs.readFileSync(fullPath, 'utf8');
        for (const line of content.split('\n')) {
          const trimmed = line.trim();
          if (trimmed && !trimmed.startsWith('#')) {
            const eqIdx = trimmed.indexOf('=');
            if (eqIdx !== -1) {
              const key = trimmed.slice(0, eqIdx).trim();
              const val = trimmed.slice(eqIdx + 1).trim();
              if (!env[key]) {
                env[key] = val;
              }
            }
          }
        }
      } catch (err) {
        console.warn(`[KeepAlive] Warning reading ${file}:`, err.message);
      }
    }
  }
  return env;
}

const env = loadEnv();
const supabaseUrl = env.VITE_SUPABASE_URL || env.SUPABASE_URL || '';
const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY || env.SUPABASE_ANON_KEY || '';
const siteUrl = env.SITE_URL || env.VITE_SITE_URL || '';

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('☀️  SOLIS SYSTEM KEEPALIVE & UPTIME MONITOR');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log(`[Timestamp] : ${new Date().toISOString()}`);

async function pingSupabase() {
  if (!supabaseUrl || !supabaseAnonKey || supabaseUrl.includes('your-project-id')) {
    console.log('⚠️  VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY is missing or using placeholder in .env.');
    console.log('   Skipping Supabase ping. Solis is currently running in local Mock mode.');
    return { success: true, skipped: true, reason: 'unconfigured_local_mock' };
  }

  const cleanUrl = supabaseUrl.replace(/\/+$/, '');
  // Query actual table with limit=1 to ensure PostgREST executes a PostgreSQL SELECT query
  const targetEndpoint = `${cleanUrl}/rest/v1/tasks?select=id&limit=1`;
  console.log(`📡 Pinging Supabase Database: ${cleanUrl} (querying /rest/v1/tasks)`);

  const startTime = Date.now();
  try {
    const headers = {
      'apikey': supabaseAnonKey,
      'Authorization': `Bearer ${supabaseAnonKey}`,
      'Accept': 'application/json',
      'User-Agent': 'Solis-Keepalive-Bot/1.0'
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000);

    const response = await fetch(targetEndpoint, {
      method: 'GET',
      headers,
      signal: controller.signal
    });

    clearTimeout(timeoutId);
    const duration = Date.now() - startTime;

    console.log(`   Status Code : ${response.status} ${response.statusText}`);
    console.log(`   Latency     : ${duration} ms`);

    const sbProjectRef = response.headers.get('sb-project-ref');
    if (sbProjectRef) {
      console.log(`   Project Ref : ${sbProjectRef}`);
    }

    if (response.status === 200 || response.status === 204 || response.status === 206) {
      console.log('✅ Supabase PostgreSQL query executed successfully (Inactivity counter reset).');
      return { success: true, duration, status: response.status };
    } else if (response.status === 503 || response.status === 521 || response.status === 522) {
      console.error('❌ Supabase project appears to be PAUSED or SLEEPING.');
      console.error('   Please visit your Supabase dashboard and click "Restore project".');
      return { success: false, duration, status: response.status, paused: true };
    } else if (response.status === 401 || response.status === 403) {
      console.error('❌ Supabase API key rejected (401/403). Check your publishable/anon key.');
      return { success: false, duration, status: response.status, unauthorized: true };
    } else {
      console.log(`ℹ️  Supabase responded with status ${response.status}. Connection registered.`);
      return { success: true, duration, status: response.status };
    }
  } catch (err) {
    const duration = Date.now() - startTime;
    if (err.name === 'AbortError') {
      console.error(`❌ Connection timed out after 12s. Supabase may be waking up or DNS unreachable.`);
    } else {
      console.error(`❌ Connection failed: ${err.message}`);
    }
    return { success: false, duration, error: err.message };
  }
}

async function pingWebsite() {
  if (!siteUrl) return;

  console.log(`\n🌐 Pinging Application Site: ${siteUrl}`);
  const startTime = Date.now();
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(siteUrl, {
      method: 'GET',
      headers: { 'User-Agent': 'Solis-Keepalive-Bot/1.0' },
      signal: controller.signal
    });

    clearTimeout(timeoutId);
    const duration = Date.now() - startTime;
    console.log(`   Status Code : ${response.status} ${response.statusText}`);
    console.log(`   Latency     : ${duration} ms`);
    if (response.status >= 200 && response.status < 400) {
      console.log('✅ Web application edge is WARM & RESPONSIVE.');
    } else {
      console.warn(`⚠️  Web application responded with unexpected status: ${response.status}`);
    }
  } catch (err) {
    console.warn(`⚠️  Web application ping returned: ${err.message}`);
  }
}

async function main() {
  const sbResult = await pingSupabase();
  await pingWebsite();

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  if (sbResult.success) {
    console.log('🎉 Keepalive sequence completed successfully!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    process.exitCode = 0;
  } else {
    console.log('⚠️  Keepalive completed with warnings.');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    process.exitCode = 0;
  }
}

main();
