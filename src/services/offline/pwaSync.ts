/**
 * Solis — Plan §8.4: Offline-First PWA Write-Ahead Log
 *
 * IndexedDB write-ahead mutation queue for uninterrupted offline library
 * study, paired with a service worker (`public/solis-offline-sw.js`) that
 * keeps the app shell available without a network.
 *
 * How the write-ahead log works (honest semantics, no simulated success):
 *   1. While the ACTIVE provider is the cloud one (Supabase), every mutating
 *      call on the provider surface is first LOGGED to IndexedDB (write-ahead),
 *      then executed for real.
 *   2. Success → the log entry is purged. The queue is a safety net for the
 *      window between logging and a lost/failed response, not a cache.
 *   3. Failure that looks offline/unreachable (navigator offline, fetch /
 *      network / timeout errors) → the entry stays queued and is replayed in
 *      original order once connectivity returns. Server-side rejections
 *      (validation, permissions) are purged — replaying them cannot succeed.
 *   4. In Demo/Mock mode writes are already local and durable, so the log
 *      stays out of the way (queueing there would double-apply on replay).
 *
 * This module is a service (IO allowed); it registers no UI and touches no
 * React. Cache invalidation after a replay follows master.md §14.2: the
 * notify happens before pages re-read.
 */

import { dataService, ServiceContainer } from '../dataService';
import { getSupabaseClient, isSupabaseConfigured } from '../supabase/supabaseClient';

export type OfflineProviderMode = 'supabase' | 'mock';

export interface OfflineMutationEntry {
  id: string;
  /** Monotonic sequence number — replay order is strictly FIFO. */
  seq: number;
  entity: string;
  method: string;
  args: unknown[];
  queuedAt: string;
  status: 'pending' | 'synced';
  /**
   * Review P8F3: account that queued the mutation (local session user id).
   * Replay under a DIFFERENT account is never allowed — on a shared browser,
   * user A's queued writes must not land in user B's workspace.
   */
  userId?: string | null;
}

export interface OfflineMutationStore {
  put(entry: OfflineMutationEntry): Promise<void>;
  delete(id: string): Promise<void>;
  getPending(): Promise<OfflineMutationEntry[]>;
}

export interface FlushResult {
  replayed: number;
  failed: number;
  /** True when flush was skipped (no store, wrong provider, or offline). */
  skipped: boolean;
}

export interface PwaSyncOptions {
  /** Overrides the default IndexedDB store (tests / private-mode fallback). */
  store?: OfflineMutationStore;
  /** Overrides provider detection (tests). Defaults to ServiceContainer. */
  resolveProviderMode?: () => OfflineProviderMode;
  /**
   * Review P8F3: resolves the account that owns queued mutations. Defaults to
   * the local Supabase session (no network). Flush refuses to run without an
   * identified owner so queued writes can never replay into the wrong account.
   */
  resolveOwnerId?: () => Promise<string | null>;
  /** Force service-worker registration on/off (defaults to PROD builds). */
  registerServiceWorker?: boolean;
}

const DB_NAME = 'solis_pwa_sync';
const DB_VERSION = 1;
const STORE_NAME = 'mutation_log';

const SERVICE_WORKER_URL = '/solis-offline-sw.js';

/**
 * Entity surfaces exposed on the dataService contract whose mutations are
 * captured. `auth` is excluded (session lifecycle, not data) and `analytics`
 * is read-only.
 */
export const OFFLINE_QUEUED_ENTITIES = [
  'tasks',
  'notes',
  'habits',
  'goals',
  'study',
  'focus',
  'flashcards',
  'reviews',
  'routines',
  'resources',
  'reflections',
  'rooms'
] as const;

/** Verbs that identify a mutating call on a provider sub-service. */
const MUTATION_METHOD_PREFIXES = [
  'create',
  'update',
  'delete',
  'toggle',
  'save',
  'log',
  'add',
  'import',
  'remove',
  'edit',
  'archive',
  'restore',
  'promote',
  'review',
  'reschedule',
  'complete',
  'record',
  'send',
  'end',
  'join',
  'leave',
  'start',
  'submit',
  'materialize'
];

/** A mutation method carrying the write-ahead wrapper's idempotency flag. */
type WalWrappedFunction = ((...args: unknown[]) => unknown) & { __solisWalWrapped?: boolean };

/** Pure predicate: does this method name mutate data (never read)? */
export function isMutationMethodName(name: string): boolean {
  const lower = name.toLowerCase();
  if (lower.startsWith('get')) return false;
  return MUTATION_METHOD_PREFIXES.some((prefix) => lower.startsWith(prefix));
}

/**
 * True ONLY when the browser is definitively offline, so no bytes can have
 * been exchanged and replay is safe.
 *
 * Review P8F8: timeout / dropped-response errors while still "online" are
 * deliberately NOT replayable — the server may have applied the write and the
 * replay path has no idempotency key, so retrying them could double-apply.
 * Those calls were already surfaced as errors to the caller; the user can
 * retry them consciously.
 */
export function isReplayableFailure(_err: unknown): boolean {
  return typeof navigator !== 'undefined' && navigator.onLine === false;
}

/* ─────────────────────────── Stores ─────────────────────────── */

/**
 * FIFO ordering across boots (review P8F4): persisted entries keep the seq
 * numbers of a previous boot, so ordering is anchored on `queuedAt` first
 * (monotonic across boots) with `seq` breaking same-millisecond ties within
 * a boot. `seqCounter` is also re-seeded from pending entries at init.
 */
function comparePendingEntries(a: OfflineMutationEntry, b: OfflineMutationEntry): number {
  const byQueuedAt = (a.queuedAt || '').localeCompare(b.queuedAt || '');
  if (byQueuedAt !== 0) return byQueuedAt;
  return a.seq - b.seq;
}

/** Default store: IndexedDB `solis_pwa_sync` → `mutation_log` (keyPath id). */
export function createIndexedDbStore(): OfflineMutationStore {
  let dbPromise: Promise<IDBDatabase> | null = null;

  const openDb = (): Promise<IDBDatabase> => {
    if (dbPromise) return dbPromise;
    dbPromise = new Promise((resolve, reject) => {
      if (typeof indexedDB === 'undefined') {
        reject(new Error('IndexedDB is not available in this environment.'));
        return;
      }
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error || new Error('IndexedDB open failed.'));
    });
    return dbPromise;
  };

  const runTransaction = async <T>(
    mode: IDBTransactionMode,
    action: (store: IDBObjectStore) => IDBRequest<T>
  ): Promise<T> => {
    const db = await openDb();
    return new Promise<T>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, mode);
      const request = action(tx.objectStore(STORE_NAME));
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error || new Error('IndexedDB request failed.'));
    });
  };

  return {
    async put(entry) {
      await runTransaction('readwrite', (store) => store.put(entry));
    },
    async delete(id) {
      await runTransaction('readwrite', (store) => store.delete(id));
    },
    async getPending() {
      const all = await runTransaction<OfflineMutationEntry[]>('readonly', (store) => store.getAll());
      return all
        .filter((entry) => entry && entry.status === 'pending')
        .sort(comparePendingEntries);
    }
  };
}

/** In-memory fallback (tests, private browsing where IndexedDB is blocked). */
export function createMemoryStore(): OfflineMutationStore {
  const entries = new Map<string, OfflineMutationEntry>();
  return {
    async put(entry) {
      entries.set(entry.id, JSON.parse(JSON.stringify(entry)));
    },
    async delete(id) {
      entries.delete(id);
    },
    async getPending() {
      return Array.from(entries.values())
        .filter((entry) => entry.status === 'pending')
        .sort(comparePendingEntries);
    }
  };
}

/* ─────────────────────── Write-ahead log core ─────────────────────── */

let activeStore: OfflineMutationStore | null = null;
let resolveMode: () => OfflineProviderMode = () => ServiceContainer.getMode();
let seqCounter = 0;
let isReplaying = false;
let initialized = false;

/**
 * Review P8F3: account ownership of queued mutations. Defaults to the local
 * Supabase session (pure local read — no network, offline-safe). Flush
 * refuses to run without an identified owner, and entries owned by a
 * different account are purged rather than replayed.
 */
let resolveOwnerId: () => Promise<string | null> = async () => {
  try {
    if (!isSupabaseConfigured()) return null;
    const { data } = await getSupabaseClient().auth.getSession();
    return data.session?.user?.id ?? null;
  } catch {
    return null;
  }
};

/** Owner resolution that can never throw (ownership unknown → null). */
async function resolveOwnerIdSafe(): Promise<string | null> {
  try {
    return await resolveOwnerId();
  } catch {
    return null;
  }
}

function makeEntryId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `wal_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

function serializeArgs(args: unknown[]): unknown[] | null {
  try {
    return JSON.parse(JSON.stringify(args ?? []));
  } catch {
    return null; // non-serializable payload can never be replayed safely
  }
}

/**
 * Wraps every mutating method on a provider surface with write-ahead logging.
 * Works on both provider shapes: Supabase sub-services (class instances whose
 * methods live on the prototype) and Mock sub-services (object-literal fields).
 * Idempotent — already-wrapped methods are skipped.
 */
export function attachWriteAheadLog(
  target: unknown,
  store: OfflineMutationStore = activeStore || createMemoryStore()
): void {
  if (!target || typeof target !== 'object') return;

  // Log helpers bound to THIS attach call's store, so tests (and any explicit
  // target) never depend on module-level initialization order.
  const writeAheadTo = async (entry: OfflineMutationEntry): Promise<void> => {
    try {
      await store.put(entry);
    } catch (err) {
      // The log is a safety net, never a gate: a storage failure must not
      // block the real mutation. The write proceeds unlogged instead.
      console.warn('[pwaSync] Write-ahead log write failed; continuing without it:', err);
    }
  };
  const purgeFrom = async (id: string): Promise<void> => {
    try {
      await store.delete(id);
    } catch {
      // A purge failure leaves a stale entry; the next flush will retry it.
    }
  };

  for (const entity of OFFLINE_QUEUED_ENTITIES) {
    const subService = (target as Record<string, unknown>)[entity];
    if (!subService || typeof subService !== 'object') continue;
    const owner = subService as Record<string, unknown>;

    // Union of own properties (mock literals) and prototype methods (classes).
    const proto = Object.getPrototypeOf(owner);
    const methodNames = new Set<string>([
      ...Object.getOwnPropertyNames(owner),
      ...((proto && proto !== Object.prototype ? Object.getOwnPropertyNames(proto) : []) as string[])
    ]);

    for (const name of methodNames) {
      const current = owner[name];
      if (typeof current !== 'function') continue;
      if ((current as { __solisWalWrapped?: boolean }).__solisWalWrapped) continue;
      if (!isMutationMethodName(name)) continue;

      const original = current as (...args: unknown[]) => unknown;
      const entityName = entity;
      const wrapped: WalWrappedFunction = function (this: unknown, ...args: unknown[]): unknown {
        const originalCall = () => original.apply(this, args);

        // Replay traffic must flow straight through — no re-queue loops.
        if (isReplaying) return originalCall();
        if (resolveMode() !== 'supabase') return originalCall();

        const serialized = serializeArgs(args);
        if (!serialized) return originalCall();

        const entry: OfflineMutationEntry = {
          id: makeEntryId(),
          seq: ++seqCounter,
          entity: entityName,
          method: name,
          args: serialized,
          queuedAt: new Date().toISOString(),
          status: 'pending'
        };

        // Write-ahead: the log write (stamped with the owning account, review
        // P8F3) completes BEFORE the network attempt, so a crash mid-flight
        // still leaves a replayable record.
        return resolveOwnerIdSafe()
          .then((ownerId) => {
            entry.userId = ownerId;
            return writeAheadTo(entry);
          })
          .then(originalCall)
          .then(
            (value) => {
              void purgeFrom(entry.id);
              return value;
            },
            (err) => {
              if (!isReplayableFailure(err)) {
                // The server rejected the call — replaying cannot fix it.
                void purgeFrom(entry.id);
              }
              throw err;
            }
          );
      };

      wrapped.__solisWalWrapped = true;
      owner[name] = wrapped;
    }
  }
}

/** Manual write-ahead enqueue (used by tests and future explicit call sites). */
export async function queueOfflineMutation(
  entity: string,
  method: string,
  args: unknown[],
  ownerId?: string | null
): Promise<void> {
  if (!activeStore) throw new Error('Offline write-ahead log is not initialized.');
  const serialized = serializeArgs(args);
  if (!serialized) throw new Error('Mutation arguments are not serializable and cannot be queued.');
  const userId = ownerId !== undefined ? ownerId : await resolveOwnerIdSafe();
  await activeStore.put({
    id: makeEntryId(),
    seq: ++seqCounter,
    entity,
    method,
    args: serialized,
    queuedAt: new Date().toISOString(),
    status: 'pending',
    userId
  });
}

export async function getPendingOfflineMutations(): Promise<OfflineMutationEntry[]> {
  if (!activeStore) return [];
  return activeStore.getPending();
}

/**
 * Replays pending mutations in original order against the ACTIVE provider,
 * stopping at the first replayable failure to preserve FIFO dependencies.
 * Entries that permanently fail (server rejection) or belong to a different
 * account are purged so neither can wedge the queue (reviews P8F2, P8F3).
 * After a successful replay the query cache is notified BEFORE any page
 * re-read (master.md §14.2 cache invalidation law).
 *
 * `replayTarget` defaults to the live dataService proxy; tests inject a
 * hermetic provider.
 */
export async function flushOfflineMutationQueue(
  replayTarget: unknown = dataService
): Promise<FlushResult> {
  if (!activeStore || isReplaying) {
    return { replayed: 0, failed: 0, skipped: true };
  }
  if (resolveMode() !== 'supabase') {
    return { replayed: 0, failed: 0, skipped: true };
  }
  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    return { replayed: 0, failed: 0, skipped: true };
  }

  // Review P8F3: without an identified account, nothing may replay — queued
  // writes must never land in the wrong workspace on a shared browser.
  const currentOwnerId = await resolveOwnerIdSafe();
  if (!currentOwnerId) {
    return { replayed: 0, failed: 0, skipped: true };
  }

  const pending = await activeStore.getPending();
  if (pending.length === 0) {
    return { replayed: 0, failed: 0, skipped: false };
  }

  let replayed = 0;
  let failed = 0;

  isReplaying = true;
  try {
    for (const entry of pending) {
      try {
        if (entry.userId !== currentOwnerId) {
          // Another account queued this write (or ownership is unprovable).
          // Drop it — replaying user A's mutations into user B's account is
          // exactly the cross-account leak the ownership stamp guards against.
          console.warn(
            `[pwaSync] Dropping offline mutation queued by a different account (${entry.userId ?? 'unknown'}).`
          );
          await activeStore.delete(entry.id);
          continue;
        }
        const provider = (replayTarget ?? {}) as Record<string, Record<string, unknown>>;
        const subService = provider[entry.entity];
        const method = subService?.[entry.method];
        if (typeof method !== 'function') {
          // Contract drift (method no longer exists) — the entry can never
          // replay; drop it rather than wedge the queue forever.
          await activeStore.delete(entry.id);
          continue;
        }
        await (method as (...args: unknown[]) => Promise<unknown>).apply(subService, entry.args);
        await activeStore.delete(entry.id);
        replayed++;
      } catch (err) {
        if (!isReplayableFailure(err)) {
          // Review P8F2: a permanent (non-replayable) server rejection during
          // replay can never succeed — purge the poisoned entry and let the
          // rest of the FIFO queue proceed.
          console.error('[pwaSync] Dropping permanently failed offline mutation:', err);
          try {
            await activeStore.delete(entry.id);
          } catch {
            // A failed purge retries on the next flush.
          }
          failed++;
          continue;
        }
        console.error('[pwaSync] Offline replay failed; stopping at first failure:', err);
        failed++;
        break;
      }
    }
  } finally {
    isReplaying = false;
  }

  if (replayed > 0) {
    dataService.notifySubscribers('all');
  }
  return { replayed, failed, skipped: false };
}

/**
 * Registers the offline app-shell service worker (PROD builds only — never in
 * dev, so Vite HMR stays untouched).
 */
export function registerSolisServiceWorker(force = false): void {
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return;
  const isProd = import.meta.env.PROD === true;
  if (!isProd && !force) return;
  navigator.serviceWorker.register(SERVICE_WORKER_URL, { scope: '/' }).catch((err) => {
    console.warn('[pwaSync] Service worker registration skipped:', err?.message || err);
  });
}

/**
 * Boots the offline-first layer: attaches the write-ahead log to the current
 * (and every future) provider, hooks connectivity events, and flushes any
 * mutations queued while offline. Idempotent.
 */
export function initPwaSync(options: PwaSyncOptions = {}): void {
  if (initialized) return;
  initialized = true;

  // Prefer IndexedDB when the environment actually provides it (browsers);
  // fall back to an injected or in-memory store (tests, private mode, SSR).
  if (options.store) {
    activeStore = options.store;
  } else if (typeof indexedDB !== 'undefined') {
    activeStore = createIndexedDbStore();
  } else {
    activeStore = createMemoryStore();
  }

  if (options.resolveProviderMode) {
    resolveMode = options.resolveProviderMode;
  }
  if (options.resolveOwnerId) {
    resolveOwnerId = options.resolveOwnerId;
  }

  // Review P8F4: keep the FIFO sequence monotonic across boots — persisted
  // entries carry the seq numbers of earlier boots, so new entries must
  // continue past the highest pending seq (the queuedAt-first store sort is
  // the belt-and-braces ordering backstop).
  void (async () => {
    try {
      const pending = await activeStore?.getPending();
      const maxSeq = (pending ?? []).reduce((max, entry) => Math.max(max, Number(entry.seq) || 0), 0);
      if (maxSeq > seqCounter) seqCounter = maxSeq;
    } catch {
      // Seeding is best-effort; ordering falls back to the queuedAt-first sort.
    }
  })();

  attachWriteAheadLog(dataService, activeStore);

  // Re-attach whenever the ServiceContainer swaps providers (login/logout,
  // guest migration) so the new instances are covered too.
  const originalSetService = ServiceContainer.setService.bind(ServiceContainer);
  ServiceContainer.setService = (service, mode) => {
    originalSetService(service, mode);
    attachWriteAheadLog(service, activeStore || undefined);
  };

  if (typeof window !== 'undefined') {
    window.addEventListener('online', () => {
      void flushOfflineMutationQueue();
    });
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible' && navigator.onLine) {
          void flushOfflineMutationQueue();
        }
      });
    }
  }

  if (options.registerServiceWorker !== undefined) {
    if (options.registerServiceWorker) registerSolisServiceWorker(true);
  } else {
    registerSolisServiceWorker();
  }

  // Catch up on anything queued before this boot (e.g. killed tab while offline).
  void flushOfflineMutationQueue();
}

/** Test-only reset so each suite starts from a clean module state. */
export function __resetPwaSyncForTests(): void {
  activeStore = null;
  seqCounter = 0;
  isReplaying = false;
  initialized = false;
  resolveMode = () => ServiceContainer.getMode();
  resolveOwnerId = async () => {
    try {
      if (!isSupabaseConfigured()) return null;
      const { data } = await getSupabaseClient().auth.getSession();
      return data.session?.user?.id ?? null;
    } catch {
      return null;
    }
  };
}
