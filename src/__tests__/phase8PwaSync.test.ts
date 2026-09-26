import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  attachWriteAheadLog,
  createMemoryStore,
  flushOfflineMutationQueue,
  getPendingOfflineMutations,
  initPwaSync,
  isMutationMethodName,
  isReplayableFailure,
  queueOfflineMutation,
  __resetPwaSyncForTests,
  OfflineMutationStore
} from '../services/offline/pwaSync';

/**
 * Phase 8.4 — Offline-First PWA Write-Ahead Log (plan §8.4)
 *
 * Verification gates:
 *   1. Mutating methods on a provider surface are wrapped with write-ahead
 *      logging; reads are never wrapped.
 *   2. The log entry is durable BEFORE the network attempt (write-ahead).
 *   3. Success purges the entry; definitively-offline failures keep it for
 *      replay; server-side rejections and ambiguous online failures are
 *      purged (reviews P8F2/P8F8 — replay has no idempotency key, so a
 *      slow-but-successful write must never be applied twice).
 *   4. Replay is strictly FIFO (anchored on queuedAt across boots, P8F4) and
 *      stops at the first replayable failure; permanently failed entries are
 *      purged so they cannot wedge the queue (review P8F2).
 *   5. Entries queued by a different account never replay (review P8F3).
 *   6. Mock/demo providers stay unwrapped (local writes are already durable).
 */

let store: OfflineMutationStore;

beforeEach(() => {
  __resetPwaSyncForTests();
  store = createMemoryStore();
  initPwaSync({
    store,
    resolveProviderMode: () => 'supabase',
    resolveOwnerId: async () => 'user_a',
    registerServiceWorker: false
  });
});

/** Records the pending queue DURING the call to prove write-ahead ordering. */
class FakeTaskService {
  calls: Array<{ name: string; args: unknown[] }> = [];
  pendingDuringCreate: number | null = null;

  async createTask(...args: unknown[]) {
    this.calls.push({ name: 'createTask', args });
    this.pendingDuringCreate = (await getPendingOfflineMutations()).length;
    return { id: 't_new', ...(args[0] as Record<string, unknown>) };
  }

  async deleteTask(...args: unknown[]) {
    this.calls.push({ name: 'deleteTask', args });
    throw new Error('Failed to fetch');
  }

  async toggleTaskCompletion(...args: unknown[]) {
    this.calls.push({ name: 'toggleTaskCompletion', args });
    throw new Error('invalid input syntax for type uuid'); // server rejection
  }

  getTasks() {
    return Promise.resolve([]);
  }
}

/** Plain object-literal sub-service (the Mock provider's shape). */
const makeFakeNotesService = () => ({
  createNote: async (...args: unknown[]) => ({ id: 'n_new', args })
});

class FakeProvider {
  tasks = new FakeTaskService();
  notes = makeFakeNotesService();
}

describe('isMutationMethodName', () => {
  it('classifies mutations and leaves reads alone', () => {
    expect(isMutationMethodName('createTask')).toBe(true);
    expect(isMutationMethodName('deleteNote')).toBe(true);
    expect(isMutationMethodName('toggleHabitToday')).toBe(true);
    expect(isMutationMethodName('materializeRoutinesForToday')).toBe(true);
    expect(isMutationMethodName('updateTimerState')).toBe(true);

    expect(isMutationMethodName('getTasks')).toBe(false);
    expect(isMutationMethodName('getAllTimeBlocks')).toBe(false);
    expect(isMutationMethodName('getRoomByCode')).toBe(false);
  });
});

describe('isReplayableFailure — offline-only replay safety (review P8F8)', () => {
  it('replays failures only when the browser is definitively offline', () => {
    vi.stubGlobal('navigator', { onLine: false });
    try {
      // Offline: no bytes can have been exchanged — always safe to replay.
      expect(isReplayableFailure(new Error('Failed to fetch'))).toBe(true);
      expect(isReplayableFailure(new Error('anything at all'))).toBe(true);
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it('treats ambiguous online failures as non-replayable (server may have applied the write)', () => {
    vi.stubGlobal('navigator', { onLine: true });
    try {
      // Replay has no idempotency key: a timeout after send could mean the
      // server already applied the write — retrying could double-apply it.
      expect(isReplayableFailure(new Error('Failed to fetch'))).toBe(false);
      expect(isReplayableFailure(new Error('Request timed out'))).toBe(false);
      expect(isReplayableFailure(new Error('connection refused'))).toBe(false);
      expect(isReplayableFailure(new Error('invalid input syntax for type uuid'))).toBe(false);
    } finally {
      vi.unstubAllGlobals();
    }
  });
});

describe('attachWriteAheadLog — mutation capture', () => {
  it('executes the mutation and purges the entry on success', async () => {
    const provider = new FakeProvider();
    attachWriteAheadLog(provider, store);

    const result = await provider.tasks.createTask({ title: 'Finish Raft proof' });

    expect((result as { id: string }).id).toBe('t_new');
    expect(provider.tasks.calls).toHaveLength(1);
    expect(await store.getPending()).toHaveLength(0);
  });

  it('logs the entry BEFORE the network attempt (write-ahead semantics)', async () => {
    const provider = new FakeProvider();
    attachWriteAheadLog(provider, store);

    await provider.tasks.createTask({ title: 'Any task' });

    expect(provider.tasks.pendingDuringCreate).toBe(1);
    // After success the entry is purged again.
    expect(await store.getPending()).toHaveLength(0);
  });

  it('stamps the queued entry with the owning account (review P8F3)', async () => {
    // Offline, so the failed write is replayable and its entry survives.
    vi.stubGlobal('navigator', { onLine: false });
    try {
      const provider = new FakeProvider();
      attachWriteAheadLog(provider, store);

      await expect(provider.tasks.deleteTask('t_1')).rejects.toThrow('Failed to fetch');

      const pending = await store.getPending();
      expect(pending).toHaveLength(1);
      expect(pending[0].userId).toBe('user_a');
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it('keeps the entry queued when the browser is definitively offline', async () => {
    vi.stubGlobal('navigator', { onLine: false });
    try {
      const provider = new FakeProvider();
      attachWriteAheadLog(provider, store);

      await expect(provider.tasks.deleteTask('t_1')).rejects.toThrow('Failed to fetch');

      const pending = await store.getPending();
      expect(pending).toHaveLength(1);
      expect(pending[0].entity).toBe('tasks');
      expect(pending[0].method).toBe('deleteTask');
      expect(pending[0].args).toEqual(['t_1']);
      expect(pending[0].status).toBe('pending');
      // The real call was still attempted (honest failure to the caller).
      expect(provider.tasks.calls).toHaveLength(1);
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it('purges the entry on server-side rejections that replay cannot fix', async () => {
    vi.stubGlobal('navigator', { onLine: true });
    try {
      const provider = new FakeProvider();
      attachWriteAheadLog(provider, store);

      await expect(provider.tasks.toggleTaskCompletion('t_1')).rejects.toThrow(
        'invalid input syntax for type uuid'
      );
      expect(await store.getPending()).toHaveLength(0);
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it('wraps both prototype-method and object-literal sub-services, never reads', async () => {
    const provider = new FakeProvider();
    attachWriteAheadLog(provider, store);

    const notesService = provider.notes as Record<string, () => unknown>;
    expect((provider.tasks.createTask as { __solisWalWrapped?: boolean }).__solisWalWrapped).toBe(true);
    expect((notesService.createNote as { __solisWalWrapped?: boolean }).__solisWalWrapped).toBe(true);
    expect((provider.tasks.getTasks as { __solisWalWrapped?: boolean }).__solisWalWrapped).toBeUndefined();
  });

  it('does not queue anything for mock/demo providers (local writes are durable)', async () => {
    __resetPwaSyncForTests();
    store = createMemoryStore();
    initPwaSync({
      store,
      resolveProviderMode: () => 'mock',
      resolveOwnerId: async () => 'user_a',
      registerServiceWorker: false
    });

    const provider = new FakeProvider();
    attachWriteAheadLog(provider, store);
    await provider.tasks.createTask({ title: 'Local-only write' });

    expect(provider.tasks.calls).toHaveLength(1);
    expect(await store.getPending()).toHaveLength(0);
  });

  it('is idempotent — re-attachment never double-wraps a method', async () => {
    const provider = new FakeProvider();
    attachWriteAheadLog(provider, store);
    attachWriteAheadLog(provider, store);
    attachWriteAheadLog(provider, store);

    await provider.tasks.createTask({ title: 'Once' });
    expect(provider.tasks.calls).toHaveLength(1);
    expect(await store.getPending()).toHaveLength(0);
  });
});

describe('flushOfflineMutationQueue — FIFO replay', () => {
  it('replays queued mutations in original order and purges them', async () => {
    const provider = new FakeProvider();
    await queueOfflineMutation('tasks', 'createTask', [{ title: 'First' }]);
    await queueOfflineMutation('tasks', 'createTask', [{ title: 'Second' }]);
    expect(await getPendingOfflineMutations()).toHaveLength(2);

    const result = await flushOfflineMutationQueue(provider);

    expect(result).toEqual({ replayed: 2, failed: 0, skipped: false });
    expect(provider.tasks.calls.map((c) => (c.args[0] as { title: string }).title)).toEqual([
      'First',
      'Second'
    ]);
    expect(await store.getPending()).toHaveLength(0);
  });

  it('orders replay by queuedAt across boots, not stale seq numbers (review P8F4)', async () => {
    const provider = new FakeProvider();
    await queueOfflineMutation('tasks', 'createTask', [{ title: 'First' }]);
    await queueOfflineMutation('tasks', 'createTask', [{ title: 'Second' }]);

    // Simulate a previous boot: "Second" was persisted with an earlier
    // queuedAt. Despite its higher seq, it must replay first.
    const pending = await getPendingOfflineMutations();
    const second = pending.find((e) => (e.args[0] as { title: string }).title === 'Second');
    expect(second).toBeDefined();
    await store.put({ ...second!, queuedAt: '2020-01-01T00:00:00.000Z' });

    await flushOfflineMutationQueue(provider);

    expect(provider.tasks.calls.map((c) => (c.args[0] as { title: string }).title)).toEqual([
      'Second',
      'First'
    ]);
  });

  it('stops at the first replayable failure and keeps the remainder queued', async () => {
    // Connection drops mid-replay: the flush starts online, then the failing
    // call observes the offline flip, making its failure replayable.
    let online = true;
    vi.stubGlobal('navigator', { get onLine() { return online; } });
    try {
      const provider = new FakeProvider();
      await queueOfflineMutation('tasks', 'createTask', [{ title: 'OK' }]);
      await queueOfflineMutation('tasks', 'deleteTask', ['t_1']);
      await queueOfflineMutation('tasks', 'createTask', [{ title: 'Never reached' }]);

      // The connection drops while the delete replay is in flight, making its
      // failure definitively offline (replayable) rather than ambiguous.
      const failingDelete = provider.tasks.deleteTask.bind(provider.tasks);
      provider.tasks.deleteTask = async (...args: unknown[]) => {
        online = false;
        return failingDelete(...args);
      };

      const result = await flushOfflineMutationQueue(provider);

      expect(result.replayed).toBe(1);
      expect(result.failed).toBe(1);
      const pending = await store.getPending();
      expect(pending.map((entry) => entry.method)).toEqual(['deleteTask', 'createTask']);
    } finally {
      online = true;
      vi.unstubAllGlobals();
    }
  });

  it('purges permanently failed entries instead of wedging the queue (review P8F2)', async () => {
    // Stay online: the delete's 'Failed to fetch' is ambiguous → non-replayable.
    vi.stubGlobal('navigator', { onLine: true });
    try {
      const provider = new FakeProvider();
      await queueOfflineMutation('tasks', 'createTask', [{ title: 'OK' }]);
      await queueOfflineMutation('tasks', 'deleteTask', ['t_1']); // permanent rejection
      await queueOfflineMutation('tasks', 'createTask', [{ title: 'After poison' }]);

      const result = await flushOfflineMutationQueue(provider);

      // The poisoned entry is dropped; the FIFO queue behind it proceeds.
      expect(result.replayed).toBe(2);
      expect(result.failed).toBe(1);
      expect(await store.getPending()).toHaveLength(0);
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it('drops entries whose method no longer exists on the contract', async () => {
    const provider = new FakeProvider();
    await queueOfflineMutation('tasks', 'retireTaskFromSpace', ['t_1']);

    const result = await flushOfflineMutationQueue(provider);

    expect(result.replayed).toBe(0);
    expect(result.failed).toBe(0);
    expect(await store.getPending()).toHaveLength(0);
  });

  it('never replays entries queued by a different account (review P8F3)', async () => {
    const provider = new FakeProvider();
    // Shared browser: user B's session flushes user A's queued mutation.
    await queueOfflineMutation('tasks', 'createTask', [{ title: "Alice's offline write" }], 'user_b');

    const result = await flushOfflineMutationQueue(provider);

    expect(result.replayed).toBe(0);
    expect(provider.tasks.calls).toHaveLength(0);
    // The foreign entry is dropped rather than replayed into user A's account.
    expect(await store.getPending()).toHaveLength(0);
  });

  it('skips replay entirely when no account can be identified (review P8F3)', async () => {
    __resetPwaSyncForTests();
    store = createMemoryStore();
    initPwaSync({
      store,
      resolveProviderMode: () => 'supabase',
      resolveOwnerId: async () => null, // session unresolvable
      registerServiceWorker: false
    });

    const provider = new FakeProvider();
    await queueOfflineMutation('tasks', 'createTask', [{ title: 'Unowned write' }]);
    const result = await flushOfflineMutationQueue(provider);

    expect(result.skipped).toBe(true);
    expect(provider.tasks.calls).toHaveLength(0);
    expect(await store.getPending()).toHaveLength(1);
  });

  it('skips replay entirely when the active provider is mock', async () => {
    __resetPwaSyncForTests();
    store = createMemoryStore();
    initPwaSync({
      store,
      resolveProviderMode: () => 'mock',
      resolveOwnerId: async () => 'user_a',
      registerServiceWorker: false
    });

    const provider = new FakeProvider();
    await queueOfflineMutation('tasks', 'createTask', [{ title: 'No replay in mock' }]);
    const result = await flushOfflineMutationQueue(provider);

    expect(result.skipped).toBe(true);
    expect(provider.tasks.calls).toHaveLength(0);
    expect(await store.getPending()).toHaveLength(1);
  });
});
