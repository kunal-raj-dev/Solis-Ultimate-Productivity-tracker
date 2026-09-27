/**
 * Solis V2 Phase 1 — User-scoped state continuity (C2).
 *
 * V1 kept ~40 `solis_*` keys device-local, so a second device (and a
 * guest→account migration) started from zero. State sync moves the cloud-worthy
 * classes to Supabase while localStorage is demoted to the offline cache.
 *
 * Key classes:
 *  - `user_content`      : meaning-bearing state that should follow the student
 *                          (daily intention, ritual completion, pins, note
 *                          history, notification inbox/prefs, welcome-back choice)
 *  - `device_preference` : per-device comfort (theme details, sound levels) —
 *                          synced read-only, device wins
 *  - `ephemeral`         : never synced (session-scoped secrets, caches)
 */

export type StateSyncKeyClass = 'user_content' | 'device_preference' | 'ephemeral';

export interface StateSyncItem {
  /** Namespaced key, e.g. "intention:2026-09-27", "ritual:morning:2026-09-27". */
  key: string;
  keyClass: StateSyncKeyClass;
  payload: unknown;
  updatedAt: string;
  /** Best-effort device tag for provenance ("web-chrome", "mobile-pwa"…). */
  deviceOrigin?: string;
}
