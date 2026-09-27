/**
 * Solis Client-Side Query Cache
 * High-performance, lightweight in-memory cache with instant mutation-driven invalidation.
 * Prevents redundant network requests when navigating between application views.
 *
 * Phase 0 (V2) correctness rules — the TTL is a safety net, never the correctness mechanism:
 * 1. USER-SCOPED: every entry lives under the active user scope. Switching accounts (or
 *    signing out) clears the cache wholesale, so data can never leak across accounts on a
 *    shared browser. Callers keep building plain keys; the scope prefix is internal.
 * 2. CHANNEL INVALIDATION: entries may declare the pub/sub channel whose mutations make
 *    them stale (`set(key, data, channel)`). `invalidateChannel(channel)` then drops only
 *    that channel's entries plus channel-agnostic ones. UNDECLARED entries default to
 *    'all' — invalidated by every mutation — which is exactly the pre-V2 behavior, so
 *    classification is conservative by default and a missed annotation can only cost
 *    performance, never staleness.
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const ALL_CHANNELS = 'all';

class QueryCache {
  private cache = new Map<string, CacheEntry<any>>();
  /** key -> channel the entry was cached under ('all' = invalidated by any mutation). */
  private channels = new Map<string, string>();
  private defaultTTLMs = 30000; // 30 seconds default TTL
  private scope = 'anon';

  /** Internal: the storage key for a caller key, namespaced by user scope. */
  private scoped(key: string): string {
    return `${this.scope}:${key}`;
  }

  /**
   * Point the cache at a user account. Any scope change (login, logout, guest↔account)
   * clears every entry — cross-account staleness is structurally impossible.
   */
  public setUserScope(userId: string | null): void {
    const next = userId || 'anon';
    if (next === this.scope) return;
    this.scope = next;
    this.clearAll();
  }

  public get<T>(key: string, customTTLMs?: number): T | null {
    const entry = this.cache.get(this.scoped(key));
    if (!entry) return null;

    const ttl = customTTLMs !== undefined ? customTTLMs : this.defaultTTLMs;
    if (Date.now() - entry.timestamp > ttl) {
      this.cache.delete(this.scoped(key));
      this.channels.delete(this.scoped(key));
      return null;
    }

    return entry.data as T;
  }

  public set<T>(key: string, data: T, channel: string = ALL_CHANNELS): void {
    const storageKey = this.scoped(key);
    this.cache.set(storageKey, {
      data,
      timestamp: Date.now()
    });
    this.channels.set(storageKey, channel);
  }

  /**
   * Prefix invalidation on caller keys (scope-aware). Existing call sites that drop a
   * known key or key prefix keep their exact semantics.
   */
  public invalidate(prefix?: string): void {
    if (!prefix) {
      this.clearAll();
      return;
    }

    const scopedPrefix = this.scoped(prefix);
    for (const key of this.cache.keys()) {
      if (key.startsWith(scopedPrefix)) {
        this.cache.delete(key);
        this.channels.delete(key);
      }
    }
  }

  public invalidatePrefix(prefix: string): void {
    this.invalidate(prefix);
  }

  /**
   * Channel invalidation for the mutation path: drops entries cached under `channel`
   * plus channel-agnostic ('all') entries. Undefined or 'all' clears everything.
   */
  public invalidateChannel(channel?: string): void {
    if (!channel || channel === ALL_CHANNELS) {
      this.clearAll();
      return;
    }
    for (const [key, entryChannel] of this.channels) {
      if (entryChannel === channel || entryChannel === ALL_CHANNELS) {
        this.cache.delete(key);
        this.channels.delete(key);
      }
    }
  }

  public delete(key: string): void {
    const storageKey = this.scoped(key);
    this.cache.delete(storageKey);
    this.channels.delete(storageKey);
  }

  private clearAll(): void {
    this.cache.clear();
    this.channels.clear();
  }
}

export const queryCache = new QueryCache();
