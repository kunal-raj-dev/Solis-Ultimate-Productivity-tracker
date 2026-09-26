import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  createAutoSaveController,
  useDebouncedAutoSave,
  AutoSaveController,
  AutoSaveStatus,
  LOCAL_DRAFT_DELAY_MS,
  CLOUD_SYNC_DELAY_MS
} from '../../hooks/useDebouncedAutoSave';

/**
 * Phase 0/1 — Notes Auto-Save Harness (plan §0.1, deferred to §1.2)
 *
 * Pins the Lossless 2-Tier Notes Auto-Save contract:
 *   - Tier 1 (Instant Local Draft): 1,000ms debounce into
 *     `localStorage['solis_note_draft_${id}']`.
 *   - Tier 2 (Cloud / Primary DB): 4,000ms debounce through the caller's
 *     `onCloudSave` (e.g. `dataService.notes.updateNote`).
 *   - `beforeunload` guard active while changes are uncommitted.
 *
 * The timer state machine is exercised through `createAutoSaveController` —
 * the plain (non-React) core that `useDebouncedAutoSave` binds to the note
 * editor — because the Vitest suite runs in a node environment without a DOM
 * renderer. The hook binding is pinned by an export-shape assertion.
 */

interface NoteDraftPayload {
  title: string;
  content: string;
}

describe('notes auto-save — useDebouncedAutoSave engine (plan §1.2)', () => {
  let mockStorage: Record<string, string>;
  let beforeUnloadHandler: ((event: BeforeUnloadEvent) => void) | null;
  let controller: AutoSaveController<NoteDraftPayload>;
  let statuses: AutoSaveStatus[];
  let cloudSaveCalls: NoteDraftPayload[];

  const createController = (overrides: Partial<Parameters<typeof createAutoSaveController<NoteDraftPayload>>[0]> = {}) => {
    statuses = [];
    cloudSaveCalls = [];
    controller = createAutoSaveController<NoteDraftPayload>({
      storageKey: 'solis_note_draft_note_1',
      onCloudSave: async (payload) => {
        cloudSaveCalls.push(payload);
      },
      onStatusChange: (status) => statuses.push(status),
      ...overrides
    });
    return controller;
  };

  const lastStatus = (): AutoSaveStatus | undefined => statuses[statuses.length - 1];

  const fireBeforeUnload = (): { prevented: boolean; returnValue: unknown } => {
    const event = {
      preventDefault: vi.fn(),
      returnValue: undefined as unknown
    };
    beforeUnloadHandler?.(event as unknown as BeforeUnloadEvent);
    return { prevented: event.preventDefault.mock.calls.length > 0, returnValue: event.returnValue };
  };

  beforeEach(() => {
    vi.useFakeTimers();
    mockStorage = {};
    beforeUnloadHandler = null;

    vi.stubGlobal('localStorage', {
      getItem: (key: string) => mockStorage[key] ?? null,
      setItem: (key: string, value: string) => {
        mockStorage[key] = value;
      },
      removeItem: (key: string) => {
        delete mockStorage[key];
      },
      clear: () => {
        mockStorage = {};
      }
    });

    vi.stubGlobal('window', {
      addEventListener: (type: string, handler: (event: BeforeUnloadEvent) => void) => {
        if (type === 'beforeunload') beforeUnloadHandler = handler;
      },
      removeEventListener: (type: string) => {
        if (type === 'beforeunload') beforeUnloadHandler = null;
      }
    });
  });

  afterEach(() => {
    controller?.dispose();
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it('exposes the useDebouncedAutoSave React binding', () => {
    expect(typeof useDebouncedAutoSave).toBe('function');
  });

  it('keeps the canonical 2-tier debounce constants (1s local, 4s cloud)', () => {
    expect(LOCAL_DRAFT_DELAY_MS).toBe(1000);
    expect(CLOUD_SYNC_DELAY_MS).toBe(4000);
  });

  it('writes the local draft to the note draft key after the 1s debounce (Tier 1)', () => {
    createController();
    controller.schedule({ title: 'Glycolysis', content: 'ATP yield...' });

    expect(mockStorage['solis_note_draft_note_1']).toBeUndefined();

    vi.advanceTimersByTime(999);
    expect(mockStorage['solis_note_draft_note_1']).toBeUndefined();

    vi.advanceTimersByTime(1);
    expect(JSON.parse(mockStorage['solis_note_draft_note_1'])).toEqual({
      title: 'Glycolysis',
      content: 'ATP yield...'
    });
    expect(lastStatus()).toBe('saved-locally');
  });

  it('pushes to the cloud after the 4s debounce and clears the unload guard (Tier 2)', async () => {
    createController();
    controller.schedule({ title: 'Glycolysis', content: 'ATP yield...' });

    vi.advanceTimersByTime(3999);
    expect(cloudSaveCalls).toHaveLength(0);
    expect(controller.isDirty()).toBe(true);
    expect(fireBeforeUnload().prevented).toBe(true);

    vi.advanceTimersByTime(1);
    await vi.runAllTimersAsync();
    expect(cloudSaveCalls).toHaveLength(1);
    expect(cloudSaveCalls[0]).toEqual({ title: 'Glycolysis', content: 'ATP yield...' });
    expect(controller.getStatus()).toBe('cloud-synced');
    expect(controller.isDirty()).toBe(false);
    expect(fireBeforeUnload().prevented).toBe(false);
  });

  it('restarts both debounces on every keystroke so only the latest payload commits', async () => {
    createController();
    controller.schedule({ title: 'v1', content: 'first' });
    vi.advanceTimersByTime(800);

    controller.schedule({ title: 'v2', content: 'second — latest wins' });
    vi.advanceTimersByTime(1000);

    expect(JSON.parse(mockStorage['solis_note_draft_note_1']).content).toBe('second — latest wins');
    expect(cloudSaveCalls).toHaveLength(0);

    vi.advanceTimersByTime(3000); // 4000ms since the second schedule
    await vi.runAllTimersAsync();
    expect(cloudSaveCalls).toHaveLength(1);
    expect(cloudSaveCalls[0]).toEqual({ title: 'v2', content: 'second — latest wins' });
  });

  it('saveNow commits Tier 1 + Tier 2 immediately without waiting for the debounces', async () => {
    createController();
    controller.schedule({ title: 'stale', content: 'queued' });
    vi.advanceTimersByTime(10);

    await controller.saveNow({ title: 'Manual', content: 'Ctrl+S' });

    expect(JSON.parse(mockStorage['solis_note_draft_note_1'])).toEqual({
      title: 'Manual',
      content: 'Ctrl+S'
    });
    expect(cloudSaveCalls).toEqual([{ title: 'Manual', content: 'Ctrl+S' }]);
    expect(controller.getStatus()).toBe('cloud-synced');
    expect(controller.isDirty()).toBe(false);

    // Debounced timers were cleared — no duplicate cloud commit later.
    await vi.runAllTimersAsync();
    expect(cloudSaveCalls).toHaveLength(1);
  });

  it('keeps the local draft and the unload guard when the cloud commit fails', async () => {
    createController({
      onCloudSave: async () => {
        throw new Error('network down');
      }
    });
    controller.schedule({ title: 'Offline', content: 'edited offline' });
    vi.advanceTimersByTime(1000);
    await vi.runAllTimersAsync();

    expect(controller.getStatus()).toBe('cloud-error');
    expect(controller.isDirty()).toBe(true);
    expect(JSON.parse(mockStorage['solis_note_draft_note_1'])).toEqual({
      title: 'Offline',
      content: 'edited offline'
    });
    // Guard still active: the work is only committed locally.
    expect(fireBeforeUnload().prevented).toBe(true);

    // Manual save surfaces the failure to the caller for toast handling.
    await expect(controller.saveNow({ title: 'Offline', content: 'edited offline' })).rejects.toThrow(
      'network down'
    );
  });

  it('flushLocal persists uncommitted work immediately (note-switch protection)', () => {
    createController();
    controller.schedule({ title: 'Switching', content: 'away from this note' });

    controller.flushLocal();
    expect(JSON.parse(mockStorage['solis_note_draft_note_1'])).toEqual({
      title: 'Switching',
      content: 'away from this note'
    });

    // The pending local timer was cleared — no duplicate write afterwards.
    vi.advanceTimersByTime(1000);
    expect(controller.getStatus()).toBe('dirty');
  });

  it('skips Tier 1 when no storage key is configured', () => {
    createController({ storageKey: null });
    controller.schedule({ title: 'Ephemeral', content: 'no local tier' });

    vi.advanceTimersByTime(1000);
    expect(Object.keys(mockStorage)).toHaveLength(0);
  });

  it('dispose removes the beforeunload guard and stops pending timers', async () => {
    createController();
    controller.schedule({ title: 'Bye', content: 'unmount' });
    expect(beforeUnloadHandler).not.toBeNull();

    controller.dispose();
    expect(beforeUnloadHandler).toBeNull();

    vi.advanceTimersByTime(5000);
    expect(mockStorage['solis_note_draft_note_1']).toBeUndefined();
    expect(cloudSaveCalls).toHaveLength(0);
  });
});
