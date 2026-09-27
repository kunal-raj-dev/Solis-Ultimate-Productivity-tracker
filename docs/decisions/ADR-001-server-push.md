# ADR-001: Server Push — build it, deterministic triggers only

**Status:** Accepted (Phase 0 decision, per `docs/Solis_V2_Implementation_Plan.md` P0-13)
**Date:** 2026-09-27
**Scope:** V2 Phase 3 (implementation), capability C25

## Context

V1 notifications are device-local (`webPushEnabled: false`; inbox and prefs live in
`localStorage`). Reminders therefore never reach a closed laptop — which guts the most
valuable reminder types the V2 research identified (WOOP if-then triggers fire at a moment
the app may not be open; unreinforced intentions predictably fail — implementation-intention
research via `08-product-strategy.md` C25).

## Decision

**Build real Web Push in V2 Phase 3, scoped strictly to deterministic schedule triggers:**

1. Block start (from the canonical schedule model)
2. Hour review prompts
3. WOOP if-then reminders at their declared trigger time
4. Due-review counts

## Constraints (binding)

- **Deterministic triggers only.** No AI-generated nudges, ever (standing decline D2). The
  trigger list above is closed; new trigger types require a new ADR.
- **Quiet hours are enforced server-side** (edge function), not just client-side.
- **Minimal payloads:** counts and titles only — never note content, session content, or
  message bodies.
- **Per-device subscription records** with RLS, deletable from Settings.
- **Honest capability copy:** iOS browser-push limitations are stated in the UI, not hidden.
- Requires C2 (state continuity) and C3 (canonical model) — a push built on device-local
  state would lie about it.

## Consequences

- New edge function + subscription table in Phase 3 (P3-07).
- The notification inbox/prefs become synced user data in Phase 1 (P1-08) — push composes
  with that instead of forking it.
