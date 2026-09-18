# SOLIS — HIGH-AVAILABILITY & INACTIVITY PREVENTION GUIDE

**Authoritative Architecture & Operations Manual**  
**Issue Resolved**: Project shutting down / going to sleep when traffic stops ("traffic nahi aati site pe toh band ho jati h")  
**Target Systems**: Supabase PostgreSQL (Free Tier Inactivity Prevention) + Vercel SPA + Local Dev Runtime

---

## 1. Problem Root-Cause Analysis (Why the Site Shuts Down Without Traffic)

On the **Supabase Free Plan**, projects that receive **no API or database requests for 7 consecutive days are automatically PAUSED** by Supabase to conserve cloud compute.

When a Supabase project is paused:
1. The PostgreSQL container and GoTrue authentication microservices are stopped.
2. The REST API gateway at `https://<project-ref>.supabase.co/rest/v1/` begins returning `503 Service Unavailable`, `521 Web Server Is Down`, or DNS timeouts (`net::ERR_NAME_NOT_RESOLVED`).
3. When any human visitor subsequently navigates to Solis, all queries (`dataService.auth.getCurrentUser()`, task loading, study rooms) fail with connection errors:
   `"Unable to reach Solis authentication servers. The database service may be paused, restarting, or unreachable."`
4. The site appears completely "shut down" / dead until someone manually visits the Supabase dashboard and clicks "Restore project".

---

## 2. The 4-Tier High-Availability Architecture Implemented

To eliminate this vulnerability permanently, Solis now implements a **4-tier redundant defense** ensuring that traffic is continuously generated and that cold-starts or pauses never break the user experience:

```text
┌─────────────────────────────────────────────────────────────────────────┐
│                      AUTOMATED TRAFFIC GENERATORS                       │
│                                                                         │
│   [Tier 1: GitHub Actions Cron]         [Tier 2: Vercel Daily Edge Cron]│
│   Runs every 48 hours                   Runs daily at 12:00 UTC         │
│   Pings Supabase REST & Web URL         Invokes /api/keepalive          │
└────────────────────┬───────────────────────────────────┬────────────────┘
                     │                                   │
                     ▼                                   ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                        SUPABASE POSTGRESQL & AUTH                       │
│                                                                         │
│   - Receives regular active traffic                                     │
│   - Inactivity counter reset every 24–48 hours                          │
│   - 7-Day Free-Tier Pause Threshold NEVER Reached                       │
└─────────────────────────────────────────────────────────────────────────┘
                     ▲
                     │ (Heartbeat every 4 min while browser open)
┌────────────────────┴────────────────────────────────────────────────────┐
│                    CLIENT & LOCAL ARCHITECTURE                          │
│                                                                         │
│   [Tier 3: In-App Keepalive & Auto-Wakeup]                             │
│   - Monitors database state ('healthy', 'waking_up', 'paused')          │
│   - If paused: Shows elegant banner with 1-click "Work Offline"         │
│   - ServiceContainer: Dynamic runtime switching without UI freeze      │
│                                                                         │
│   [Tier 4: Standalone CLI Tool: npm run keepalive]                      │
│   - Can be connected to UptimeRobot / Cron-Job.org / local terminal     │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Detailed Component Breakdown

### Tier 1: GitHub Actions Scheduled Cron (`.github/workflows/supabase-keepalive.yml`)
* **Schedule**: `0 6 */2 * *` (Runs every 2 days at 06:00 UTC).
* **Action**: Executes `node scripts/keepalive.mjs` on GitHub's free cloud runners.
* **Redundancy**: Also supports manual 1-click execution from GitHub Actions (`workflow_dispatch`).
* **Defaults & Secrets**: Pre-configured with automatic fallbacks so it works even before configuring repository secrets:
  * `VITE_SUPABASE_URL` (Defaults to `https://tmxrupqgttaxlcrrcubt.supabase.co`)
  * `VITE_SUPABASE_ANON_KEY` (Defaults to `sb_publishable_-vxrkvw_6Ef3rwFd957ymw_gfmM99Co`)
  * `SITE_URL` (Defaults to `https://solis-ultimate-productivity-tracker.vercel.app`)

### Tier 2: Vercel Serverless Keepalive & Cron (`api/keepalive.ts` + `vercel.json`)
* **Schedule**: `0 12 * * *` (Configured under `"crons"` in `vercel.json`, supported on Vercel Hobby plan).
* **Endpoint**: `/api/keepalive` (Edge runtime function in production; Vite connect middleware in development).
* **Behavior**: Pings `/rest/v1/tasks?select=id&limit=1`, executing a genuine `SELECT` statement in PostgreSQL to ensure the Supabase inactivity counter resets, returning telemetry JSON (`{ "service": "Solis", "supabase": { "status": "active", "latencyMs": 120 } }`).
* **SPA Routing Safety**: `vercel.json` rewrites were updated with `/((?!api/).*)` to ensure the `/api` route is preserved and never rewritten to `/index.html`.

### Tier 3: In-App Client Keepalive & Offline Fallback (`src/services/keepaliveService.ts`)
* **Heartbeat**: Pings the database every 4 minutes while the browser tab is open and immediately when the user switches tabs back (`visibilitychange`).
* **Global Visibility**: Mounted globally in `RootLayout.tsx` so users on the landing page, login page, or within `/app` are immediately informed if cloud compute is waking up.
* **Cold-Start Resilience**: When Supabase is paused or waking up, `OfflineBanner` alerts the user with:
  > **Database Inactivity Sleep**: Supabase database may be paused or waking up.  
  > `[Wake / Retry]` `[Work Offline]`
* **Dynamic ServiceContainer**: Users can click **"Work Offline"** to instantly switch the active data layer to `MockDataService`. Both the data service and `AuthContext` seamlessly transition in real-time. When Supabase wakes up, clicking **"Reconnect Cloud DB"** switches back.

### Tier 4: Standalone Multi-Protocol CLI Tool (`scripts/keepalive.mjs`)
* **Command**: `npm run keepalive`
* Queries `/rest/v1/tasks?select=id&limit=1` on Supabase to verify PostgreSQL transaction execution and tests frontend web edge response at `https://solis-ultimate-productivity-tracker.vercel.app`.
* Can be plugged into free external uptime monitors (like [UptimeRobot](https://uptimerobot.com) or [Cron-job.org](https://cron-job.org)) by pointing an HTTP monitor to your deployed `/api/keepalive` endpoint every 10–30 minutes.

---

## 4. How to Run Locally & Supabase Configuration

### Step 1: Running Solis Locally
The project is pre-configured and running at:
```bash
npm run dev
# Server ready at http://localhost:3000/
```

### Step 2: Environment Configuration (`.env`)
The `.env` file in the project root is configured with live keys:
```env
# Mode: 'supabase' (connected to live PostgreSQL) or 'mock' (for local offline tests)
VITE_DATA_LAYER=supabase

# Supabase Project Configuration
VITE_SUPABASE_URL=https://tmxrupqgttaxlcrrcubt.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_-vxrkvw_6Ef3rwFd957ymw_gfmM99Co

# Application URL for keepalive ping
SITE_URL=https://solis-ultimate-productivity-tracker.vercel.app
```

---

## 5. Verification Commands

```bash
# Test Supabase connection & reset inactivity timer
npm run keepalive

# Run full TypeScript typecheck
npm run typecheck

# Run full 49-suite Vitest test suite
npm run test

# Run full production build
npm run build

# Run comprehensive release validation pipeline
npm run verify
```
