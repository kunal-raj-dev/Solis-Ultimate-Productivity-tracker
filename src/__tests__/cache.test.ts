import { describe, it, expect, beforeEach } from 'vitest';
import { queryCache } from '../services/cache';

describe('Solis Query Cache Suite', () => {
  beforeEach(() => {
    queryCache.invalidate();
  });

  it('stores and retrieves items correctly before TTL expires', () => {
    queryCache.set('test_key', { score: 95 });
    const cached = queryCache.get<{ score: number }>('test_key');
    expect(cached).toEqual({ score: 95 });
  });

  it('returns null for nonexistent keys', () => {
    const missing = queryCache.get('nonexistent');
    expect(missing).toBeNull();
  });

  it('expires entries after custom TTL passes', async () => {
    queryCache.set('short_lived', { text: 'temporary' });
    // Simulate expired TTL
    const result = queryCache.get('short_lived', -1);
    expect(result).toBeNull();
  });

  it('clears all cached entries upon global invalidation', () => {
    queryCache.set('tasks:all', [1, 2, 3]);
    queryCache.set('subjects:true', ['math', 'cs']);
    queryCache.invalidate();

    expect(queryCache.get('tasks:all')).toBeNull();
    expect(queryCache.get('subjects:true')).toBeNull();
  });

  it('invalidates entries matching specific key prefix', () => {
    queryCache.set('tasks:all', [1, 2]);
    queryCache.set('tasks:today', [1]);
    queryCache.set('subjects:all', ['art']);

    queryCache.invalidate('tasks:');
    expect(queryCache.get('tasks:all')).toBeNull();
    expect(queryCache.get('tasks:today')).toBeNull();
    expect(queryCache.get('subjects:all')).toEqual(['art']);
  });
});
