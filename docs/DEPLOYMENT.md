# SOLIS — PRODUCTION DEPLOYMENT GUIDE

---

## 1. Deployment Topology

```text
┌────────────────────────────────────────────────────────┐
│                        USER                            │
└──────────────────────────┬─────────────────────────────┘
                           │ HTTPS (TLS 1.3)
                           ▼
┌────────────────────────────────────────────────────────┐
│                  FRONTEND HOST                         │
│            (Vercel / Cloudflare Pages)                 │
│                                                        │
│  - Static Asset Edge CDN                               │
│  - SPA Fallback Rewrite (/(.*) -> /index.html)         │
│  - Security Headers (nosniff, DENY, XSS-Protection)    │
│  - Zero-FOUC Synchronous Theme Hydration               │
└──────────────────────────┬─────────────────────────────┘
                           │ Supabase REST (PostgREST) + Auth WSS
                           ▼
┌────────────────────────────────────────────────────────┐
│                  BACKEND & DATABASE                    │
│                 (Supabase Managed)                     │
│                                                        │
│  - Supabase GoTrue Authentication Service              │
│  - PostgreSQL 15+ Engine                               │
│  - Row Level Security (RLS) Multi-Tenant Boundaries    │
│  - Realtime Change Notifications                       │
└────────────────────────────────────────────────────────┘
```

---

## 2. Step-by-Step Vercel Deployment

1. **Import Git Repository**:
   - Connect the repository `kunal-raj-dev/Solis-Ultimate-Productivity-tracker` on Vercel.
2. **Framework Preset**:
   - Select **Vite** (Build command: `npm run build`, Output directory: `dist`).
3. **Set Production Environment Variables**:
   ```env
   VITE_DATA_LAYER=supabase
   VITE_SUPABASE_URL=https://<your-project-id>.supabase.co
   VITE_SUPABASE_ANON_KEY=<your-anon-publishable-key>
   ```
4. **Deploy**:
   - Vercel will run `tsc -b && vite build` and deploy the immutable release.

---

## 3. Pre-Flight Deep Link & Routing Verification

After deployment, test the following deep links directly on a fresh browser window:
* `https://your-domain.com/app/dashboard`
* `https://your-domain.com/app/tasks`
* `https://your-domain.com/app/study`
* `https://your-domain.com/app/focus`
* `https://your-domain.com/app/notes`
* `https://your-domain.com/app/analytics`
* `https://your-domain.com/app/review`
* `https://your-domain.com/app/settings`

All routes must load cleanly without 404 errors due to [`vercel.json`](file:///c:/Users/kunal/Desktop/Solis/vercel.json) rewrites.
