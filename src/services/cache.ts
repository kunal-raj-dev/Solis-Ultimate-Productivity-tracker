/**
 * Solis Client-Side Query Cache
 * High-performance, lightweight in-memory cache with instant mutation-driven invalidation.
 * Prevents redundant network requests when navigating between application views.
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

class QueryCache {
  private cache = new Map<string, CacheEntry<any>>();
  private defaultTTLMs = 30000; // 30 seconds default TTL

  public get<T>(key: string, customTTLMs?: number): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const ttl = customTTLMs !== undefined ? customTTLMs : this.defaultTTLMs;
    if (Date.now() - entry.timestamp > ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  public set<T>(key: string, data: T): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  public invalidate(prefix?: string): void {
    if (!prefix) {
      this.cache.clear();
      return;
    }

    for (const key of this.cache.keys()) {
      if (key.startsWith(prefix)) {
        this.cache.delete(key);
      }
    }
  }

  public delete(key: string): void {
    this.cache.delete(key);
  }
}

export const queryCache = new QueryCache();
