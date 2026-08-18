# SOLIS — PRODUCTION OPERATIONS RUNBOOK

**System**: Solis Personal Study & Productivity Operating System  
**Architecture**: React 19 + TypeScript + Vite + Supabase (PostgreSQL with RLS)  
**Security Level**: Strict Single-Tenant Isolation under Row Level Security

---

## 1. Quick Start & Local Operations

### Prerequisites
* Node.js `>= 18.0.0`
* npm `>= 9.0.0`

### Installation & Environment Setup
```bash
# Clone the repository
git clone https://github.com/kunal-raj-dev/Solis-Ultimate-Productivity-tracker.git
cd Solis-Ultimate-Productivity-tracker

# Install dependencies
npm install

# Copy environment template
cp .env.example .env
```

### Configure `.env`
```env
VITE_DATA_LAYER=supabase
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-browser-safe-anon-key-here
```

### Running Locally
```bash
# Start Vite development server (HMR enabled)
npm run dev

# Run full TypeScript check
npm run typecheck

# Run complete Vitest suite (28 test suites)
npm run test

# Run full production validation pipeline (Typecheck + Tests + Build)
npm run verify
```

---

## 2. Production Deployment Runbook

### Hosting Options: Vercel / Cloudflare Pages / Netlify

1. **Root Directory**: `./`
2. **Build Command**: `npm run build` (or `tsc -b && vite build`)
3. **Output Directory**: `dist`
4. **Environment Variables**:
   - `VITE_DATA_LAYER=supabase`
   - `VITE_SUPABASE_URL=https://your-project-id.supabase.co`
   - `VITE_SUPABASE_ANON_KEY=your-publishable-anon-key`
5. **SPA Rewrites**:
   - Pre-configured in [`vercel.json`](file:///c:/Users/kunal/Desktop/Solis/vercel.json) directing all routes to `/index.html` with security headers (`X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`).

---

## 3. Supabase & Database Operations

### Applying Database Migrations
Migrations are stored in order inside [`supabase/migrations/`](file:///c:/Users/kunal/Desktop/Solis/supabase/migrations):
1. `20260817_initial_schema.sql` — Profiles, Subjects, Tasks, Habits, Goals, Focus Sessions.
2. `20260817_phase4_study_knowledge.sql` — Study Topics, Study Plans, Notes, Spaced Spaced Review Queues, Acyclic RLS.

### Verifying Live RLS Policies
To verify that Row Level Security is active and isolating users:
```sql
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';
```
All tables (`profiles`, `subjects`, `study_topics`, `study_plan_items`, `tasks`, `focus_sessions`, `notes`, `habits`, `goals`) must return `rowsecurity = true`.

---

## 4. Incident Response & Triage Runbook

### Issue A: "Permission denied / 42501" Error
* **Root Cause**: The client is attempting to insert/update a record where `user_id != auth.uid()`, or referencing a `subject_id` owned by another user.
* **Triage**: Ensure the user is logged in. In `supabaseService.ts`, all insert mutations automatically inject `user_id: user.id`.

### Issue B: "Unable to connect to database / Network Error"
* **Root Cause**: Offline connection or Supabase endpoint unreachable.
* **Triage**:
  1. Check browser connectivity. The `OfflineBanner` will activate automatically.
  2. Verify Supabase project status at `https://status.supabase.com`.
  3. Notes remain preserved locally via `localStorage` draft backup (`solis_note_draft_<id>`).

### Issue C: Emergency Rollback
* **Frontend**: Trigger instant rollback on Vercel/hosting dashboard to previous immutable release SHA.
* **Database**: Never drop tables directly in production. Apply reverse alter statements or restore from Supabase Point-in-Time Recovery (PITR).
