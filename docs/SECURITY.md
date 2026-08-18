# SOLIS — SECURITY ARCHITECTURE & THREAT MODEL

---

## 1. Security Fundamentals

Solis is designed with a **Zero-Trust Client** security model:
* The frontend browser client is strictly untrusted.
* All data isolation and authorization is enforced at the PostgreSQL database engine layer via **Row Level Security (RLS)**.
* No service-role key or database master secret exists anywhere in the frontend codebase.

---

## 2. Row Level Security (RLS) Policies

Every PostgreSQL table in Solis enforces RLS. Below is the active policy matrix:

| Table | Policy Name | Permitted Operations | Constraint Enforcement |
| :--- | :--- | :--- | :--- |
| `public.profiles` | `profiles_user_isolation` | ALL | `auth.uid() = id` |
| `public.subjects` | `subjects_user_isolation` | ALL | `auth.uid() = user_id` |
| `public.study_topics` | `study_topics_user_isolation`| ALL | `auth.uid() = user_id` AND `EXISTS (SELECT 1 FROM subjects WHERE ... AND user_id = auth.uid())` |
| `public.study_plan_items`| `study_plan_user_isolation` | ALL | `auth.uid() = user_id` AND subject/topic ownership validation |
| `public.tasks` | `tasks_user_isolation` | ALL | `auth.uid() = user_id` AND subject/plan ownership validation |
| `public.focus_sessions` | `focus_sessions_user_isolation`| ALL | `auth.uid() = user_id` |
| `public.notes` | `notes_user_isolation` | ALL | `auth.uid() = user_id` AND subject/session ownership validation |
| `public.habits` | `habits_user_isolation` | ALL | `auth.uid() = user_id` |
| `public.goals` | `goals_user_isolation` | ALL | `auth.uid() = user_id` |

---

## 3. Defense Against Common Vulnerabilities

### 3.1 CSV Formula Injection (CWE-1236)
* **Threat**: Malicious note or task titles starting with formula characters (`=`, `+`, `-`, `@`, `\t`, `\r`) executed inside Excel or Google Sheets upon CSV export.
* **Mitigation**: All exported CSV cells pass through `escapeCSVField` in [`src/utils/export.ts`](file:///c:/Users/kunal/Desktop/Solis/src/utils/export.ts), which prepends `'` to dangerous leading characters and escapes double quotes.

### 3.2 Cross-Site Scripting (XSS) & Content Security
* **Threat**: Malicious script execution via Markdown or Note rendering.
* **Mitigation**:
  - React default JSX string encoding sanitizes all rendered variables.
  - Zero usage of `dangerouslySetInnerHTML`, `eval()`, or `new Function()`.
  - HTTP Security Headers configured in `vercel.json` (`X-XSS-Protection: 1; mode=block`, `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`).

### 3.3 Import Spoofing & Foreign User Injection
* **Threat**: Malicious JSON backup containing foreign `user_id` values attempting to overwrite or associate data with other users.
* **Mitigation**: [`src/utils/import.ts`](file:///c:/Users/kunal/Desktop/Solis/src/utils/import.ts) reconstructs internal relations and discards imported `user_id` parameters, enforcing the active `auth.uid()`.

---

## 4. Privacy & Deterministic Intelligence Boundary

* **No External LLM/AI Telemetry**: All productivity scores, mastery signals, cognitive rhythm calculations, and attention ratings are calculated 100% locally in browser memory.
* **Zero Third-Party Data Leakage**: User notes, study logs, and daily habits are never transmitted to external analytics or advertisement networks.
