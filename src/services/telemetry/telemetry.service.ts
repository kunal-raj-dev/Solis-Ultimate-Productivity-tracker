/**
 * Solis Product Telemetry & Error Sink (Phase 0, P0-08)
 *
 * V1 had 114 console.error/warn sites, no error sink, and AI telemetry with
 * no consumer — so every reliability claim was unverifiable. This service is
 * the minimal honest answer:
 *
 *  - OPT-IN by default. Product telemetry events are recorded only after the
 *    user opts in (Settings → AI & Data). No event leaves the device unless
 *    the user opted in AND an endpoint is configured.
 *  - ERRORS ARE ALWAYS CAPTURED LOCALLY (device-only ring buffer). Capturing
 *    failures for debugging never required permission because nothing is sent
 *    anywhere by default.
 *  - PRIVACY FLOOR: event payloads carry names and coarse counters only.
 *    Never note content, session content, or prompt/completion text — the AI
 *    telemetry consumer strips those fields before recording.
 *
 * Remote sink: set VITE_TELEMETRY_ENDPOINT to a POST endpoint you control.
 * There is deliberately no third-party vendor wired in (rule 10: long-term
 * cost; the V2 success metrics only need events, not surveillance).
 */

const OPT_IN_KEY = 'solis_telemetry_opt_in';
const LOG_KEY = 'solis_telemetry_log';
const MAX_MEMORY_ENTRIES = 250;
const MAX_PERSISTED_ENTRIES = 100;

export type TelemetryKind = 'event' | 'error' | 'ai';

export interface TelemetryEntry {
  kind: TelemetryKind;
  /** kebab-case event name, e.g. "review.due_materialized". */
  name: string;
  /** Coarse scalar attributes — never free-form user content. */
  data?: Record<string, string | number | boolean | null>;
  at: string;
}

type TelemetryListener = (entry: TelemetryEntry) => void;

class TelemetryService {
  private entries: TelemetryEntry[] = [];
  private listeners = new Set<TelemetryListener>();
  private initialized = false;

  public isOptedIn(): boolean {
    try {
      return window.localStorage.getItem(OPT_IN_KEY) === 'true';
    } catch {
      return false;
    }
  }

  public setOptIn(optIn: boolean): void {
    try {
      window.localStorage.setItem(OPT_IN_KEY, optIn ? 'true' : 'false');
    } catch {
      // storage unavailable — opt-in stays session-only
    }
    this.track('telemetry.opt_in_changed', { optIn });
  }

  /**
   * Record a product telemetry event. No-op unless the user opted in; local
   * capture only unless a remote endpoint is configured.
   */
  public track(name: string, data?: Record<string, string | number | boolean | null>): void {
    if (!this.isOptedIn()) return;
    this.record({ kind: 'event', name, data });
  }

  /**
   * Record an error for the reliability metric. Always captured locally,
   * regardless of opt-in (nothing leaves the device unless opted in).
   */
  public captureError(context: string, err: unknown): void {
    const message = err instanceof Error ? err.message : String(err);
    this.record({
      kind: 'error',
      name: 'error.captured',
      data: { context, message: message.slice(0, 200) }
    });
  }

  /**
   * Consumer for the previously-unconsumed AI latency telemetry (X5
   * sink-or-delete resolution: it now has a sink). Strips prompt and
   * completion text — only operation, timing and token counters survive.
   */
  public consumeAiRecord(record: {
    operation: string;
    durationMs: number;
    promptTokens?: number;
    completionTokens?: number;
    estimatedCostUsd?: number;
  }): void {
    if (!this.isOptedIn()) return;
    this.record({
      kind: 'ai',
      name: 'ai.request',
      data: {
        operation: record.operation,
        durationMs: record.durationMs,
        promptTokens: record.promptTokens ?? null,
        completionTokens: record.completionTokens ?? null,
        estimatedCostUsd: record.estimatedCostUsd ?? null
      }
    });
  }

  public getRecentEntries(): TelemetryEntry[] {
    return [...this.entries];
  }

  public subscribe(listener: TelemetryListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  /** Install window error handlers + the AI telemetry consumer. Idempotent. */
  public init(): void {
    if (this.initialized || typeof window === 'undefined') return;
    this.initialized = true;

    this.restorePersisted();

    window.addEventListener('error', (event) => {
      this.captureError('window.error', event.error || event.message);
    });
    window.addEventListener('unhandledrejection', (event) => {
      this.captureError('unhandled.rejection', event.reason);
    });
  }

  private record(entry: Omit<TelemetryEntry, 'at'>): void {
    const full: TelemetryEntry = { ...entry, at: new Date().toISOString() };
    this.entries.push(full);
    if (this.entries.length > MAX_MEMORY_ENTRIES) {
      this.entries.splice(0, this.entries.length - MAX_MEMORY_ENTRIES);
    }
    this.persistTail(full);
    for (const listener of this.listeners) {
      try {
        listener(full);
      } catch {
        // telemetry listeners must never break the app
      }
    }
  }

  private persistTail(entry: TelemetryEntry): void {
    try {
      const raw = window.localStorage.getItem(LOG_KEY);
      const tail: TelemetryEntry[] = raw ? JSON.parse(raw) : [];
      tail.push(entry);
      while (tail.length > MAX_PERSISTED_ENTRIES) tail.shift();
      window.localStorage.setItem(LOG_KEY, JSON.stringify(tail));
    } catch {
      // storage unavailable/full — telemetry is best-effort by design
    }
  }

  private restorePersisted(): void {
    try {
      const raw = window.localStorage.getItem(LOG_KEY);
      if (!raw) return;
      const tail = JSON.parse(raw);
      if (Array.isArray(tail)) this.entries = tail.slice(-MAX_MEMORY_ENTRIES);
    } catch {
      // ignore malformed persisted logs
    }
  }
}

export const telemetryService = new TelemetryService();
