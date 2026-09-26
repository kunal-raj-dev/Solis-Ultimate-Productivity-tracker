import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Solis - Lossless 2-Tier Notes Auto-Save Engine (plan §1.2)
 *
 * Tier 1 (Instant Local Draft): a short debounce (default 1,000ms) writes the
 * payload to `localStorage` so a crash, tab close, or navigation never loses
 * keystrokes.
 * Tier 2 (Cloud / Primary DB): a longer debounce (default 4,000ms) pushes the
 * payload through `dataService` (wired by the caller) so the cloud copy stays
 * fresh without interrupting typing.
 *
 * While changes are uncommitted, a `beforeunload` guard warns before the tab
 * closes with unsaved work. The scheduling state machine lives in
 * `createAutoSaveController` (plain, deterministic, timer-driven) so it can be
 * exercised directly by unit tests; `useDebouncedAutoSave` is the thin React
 * binding used by feature pages.
 */

export type AutoSaveStatus =
  | 'idle' // nothing pending
  | 'dirty' // edits captured, debounces running
  | 'saved-locally' // Tier 1 committed
  | 'cloud-synced' // Tier 2 committed
  | 'cloud-error'; // Tier 2 failed — local draft still protects the work

export const LOCAL_DRAFT_DELAY_MS = 1000;
export const CLOUD_SYNC_DELAY_MS = 4000;

export interface AutoSaveControllerOptions<T> {
  /** Tier-1 `localStorage` key (e.g. `solis_note_draft_${noteId}`). `null` disables Tier 1. */
  storageKey?: string | null;
  localDelayMs?: number;
  cloudDelayMs?: number;
  /** Serializes the payload for `localStorage`. Defaults to `JSON.stringify`. */
  serialize?: (payload: T) => string;
  /** Tier-2 commit (e.g. `dataService.notes.updateNote`). */
  onCloudSave: (payload: T) => Promise<void>;
  /** Optional status listener (the React hook binds this to component state). */
  onStatusChange?: (status: AutoSaveStatus) => void;
}

export interface AutoSaveController<T> {
  /** Marks the payload dirty and restarts both debounce timers. */
  schedule(payload: T): void;
  /** Immediately persists an uncommitted payload to Tier 1 (no status change). */
  flushLocal(): void;
  /** Immediately commits the payload to Tier 1 + Tier 2. Throws on cloud failure. */
  saveNow(payload: T): Promise<void>;
  isDirty(): boolean;
  getStatus(): AutoSaveStatus;
  /** Clears timers and the `beforeunload` guard. */
  dispose(): void;
}

export function createAutoSaveController<T>(
  options: AutoSaveControllerOptions<T>
): AutoSaveController<T> {
  const localDelayMs = options.localDelayMs ?? LOCAL_DRAFT_DELAY_MS;
  const cloudDelayMs = options.cloudDelayMs ?? CLOUD_SYNC_DELAY_MS;

  let localTimer: ReturnType<typeof setTimeout> | null = null;
  let cloudTimer: ReturnType<typeof setTimeout> | null = null;
  let dirty = false;
  let status: AutoSaveStatus = 'idle';
  let lastPayload: T | null = null;
  let beforeUnloadBound = false;

  const setStatus = (next: AutoSaveStatus): void => {
    if (status === next) return;
    status = next;
    options.onStatusChange?.(next);
  };

  const writeLocalDraft = (): void => {
    if (!options.storageKey || lastPayload === null) return;
    const serialize = options.serialize ?? ((payload: T) => JSON.stringify(payload));
    try {
      localStorage.setItem(options.storageKey, serialize(lastPayload));
    } catch {
      // Storage unavailable/full: Tier 1 is best-effort; Tier 2 still applies.
    }
  };

  const commitToCloud = async (rethrowOnError: boolean): Promise<void> => {
    if (lastPayload === null) return;
    const payload = lastPayload;
    try {
      await options.onCloudSave(payload);
      if (lastPayload === payload) {
        dirty = false;
        setStatus('cloud-synced');
      }
    } catch (err) {
      // Keep dirty=true so the local draft and beforeunload guard stay active.
      setStatus('cloud-error');
      if (rethrowOnError) throw err;
    }
  };

  const clearTimers = (): void => {
    if (localTimer !== null) {
      clearTimeout(localTimer);
      localTimer = null;
    }
    if (cloudTimer !== null) {
      clearTimeout(cloudTimer);
      cloudTimer = null;
    }
  };

  // Guard: warn before the tab closes while changes are uncommitted.
  const handleBeforeUnload = (event: BeforeUnloadEvent): void => {
    if (!dirty) return;
    event.preventDefault();
    event.returnValue = '';
  };

  // Guard: warn before the tab closes while changes are uncommitted. Bound
  // lazily on first use so the constructor never touches `window` (the React
  // binding constructs the controller during render).
  const bindBeforeUnload = (): void => {
    if (beforeUnloadBound || typeof window === 'undefined') return;
    window.addEventListener('beforeunload', handleBeforeUnload);
    beforeUnloadBound = true;
  };

  return {
    schedule(payload: T): void {
      bindBeforeUnload();
      lastPayload = payload;
      dirty = true;
      setStatus('dirty');

      clearTimers();
      localTimer = setTimeout(() => {
        localTimer = null;
        writeLocalDraft();
        setStatus('saved-locally');
      }, localDelayMs);
      cloudTimer = setTimeout(() => {
        cloudTimer = null;
        void commitToCloud(false);
      }, cloudDelayMs);
    },

    flushLocal(): void {
      if (localTimer !== null) {
        clearTimeout(localTimer);
        localTimer = null;
      }
      if (!dirty || lastPayload === null) return;
      writeLocalDraft();
    },

    async saveNow(payload: T): Promise<void> {
      bindBeforeUnload();
      lastPayload = payload;
      dirty = true;
      clearTimers();
      writeLocalDraft();
      setStatus('saved-locally');
      await commitToCloud(true);
    },

    isDirty(): boolean {
      return dirty;
    },

    getStatus(): AutoSaveStatus {
      return status;
    },

    dispose(): void {
      clearTimers();
      dirty = false;
      if (beforeUnloadBound && typeof window !== 'undefined') {
        window.removeEventListener('beforeunload', handleBeforeUnload);
      }
      beforeUnloadBound = false;
    }
  };
}

export interface UseDebouncedAutoSaveOptions<T> extends AutoSaveControllerOptions<T> {}

export interface UseDebouncedAutoSaveResult<T> {
  /** Marks the payload dirty and restarts both debounce timers. */
  schedule: (payload: T) => void;
  /** Immediate Tier 1 + Tier 2 commit (manual save). Throws on cloud failure. */
  saveNow: (payload: T) => Promise<void>;
  /** Flushes uncommitted work to Tier 1 (e.g. before switching notes). */
  flushLocal: () => void;
  status: AutoSaveStatus;
  isDirty: () => boolean;
}

/**
 * React binding around `createAutoSaveController`. The controller is created
 * once per mount; option values are re-read on every access so callers can
 * pass fresh closures (current note id, current metadata) without re-binding.
 */
export function useDebouncedAutoSave<T>(
  options: UseDebouncedAutoSaveOptions<T>
): UseDebouncedAutoSaveResult<T> {
  const optionsRef = useRef<UseDebouncedAutoSaveOptions<T>>(options);
  const [status, setStatus] = useState<AutoSaveStatus>('idle');
  const controllerRef = useRef<AutoSaveController<T> | null>(null);

  if (controllerRef.current === null) {
    controllerRef.current = createAutoSaveController<T>({
      get storageKey() {
        return optionsRef.current.storageKey ?? null;
      },
      get serialize() {
        return optionsRef.current.serialize;
      },
      get onCloudSave() {
        return optionsRef.current.onCloudSave;
      },
      onStatusChange: (next) => setStatus(next)
    });
  }

  useEffect(() => {
    optionsRef.current = options;
  }, [options]);

  // Flush uncommitted work to the local draft when the page unmounts.
  useEffect(() => {
    const controller = controllerRef.current!;
    return () => {
      controller.flushLocal();
      controller.dispose();
    };
  }, []);

  const schedule = useCallback((payload: T) => {
    controllerRef.current!.schedule(payload);
  }, []);

  const saveNow = useCallback(async (payload: T) => {
    await controllerRef.current!.saveNow(payload);
  }, []);

  const flushLocal = useCallback(() => {
    controllerRef.current!.flushLocal();
  }, []);

  const isDirty = useCallback(() => controllerRef.current!.isDirty(), []);

  return { schedule, saveNow, flushLocal, status, isDirty };
}
