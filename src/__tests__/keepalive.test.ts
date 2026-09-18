import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { keepaliveService } from '../services/keepaliveService';
import { ServiceContainer, dataService } from '../services/dataService';

describe('Solis Keepalive & Inactivity Defense Suite', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    keepaliveService.stop();
  });

  describe('ServiceContainer Dynamic Delegation', () => {
    it('starts with valid service and delegates domain properties', () => {
      expect(dataService.tasks).toBeDefined();
      expect(dataService.auth).toBeDefined();
      expect(dataService.study).toBeDefined();
      expect(dataService.focus).toBeDefined();
      expect(typeof dataService.subscribe).toBe('function');
    });

    it('allows runtime switching to MockDataService and notifies subscribers', () => {
      let notified = false;
      const unsubscribe = dataService.subscribe(() => {
        notified = true;
      });

      ServiceContainer.switchToMock();
      expect(ServiceContainer.getMode()).toBe('mock');
      expect(notified).toBe(true);

      unsubscribe();
    });
  });

  describe('Keepalive Service & Database Health', () => {
    it('reports mock mode health when running in mock data layer', async () => {
      ServiceContainer.switchToMock();
      const health = await keepaliveService.checkHealth();

      expect(health.state).toBe('mock');
      expect(health.message).toContain('development mode active');
    });

    it('detects offline state when navigator.onLine is false', async () => {
      vi.stubGlobal('navigator', { onLine: false });

      const health = await keepaliveService.checkHealth();
      expect(health.state).toBe('offline');
      expect(health.message).toContain('No internet connection');
    });

    it('notifies health subscribers on state transition', async () => {
      let emittedState = '';
      const unsubscribe = keepaliveService.subscribe((info) => {
        emittedState = info.state;
      });

      vi.stubGlobal('navigator', { onLine: false });
      await keepaliveService.checkHealth();

      expect(emittedState).toBe('offline');
      unsubscribe();
    });

    it('reports healthy when table ping returns 200 in supabase mode', async () => {
      ServiceContainer.switchToSupabase();
      vi.stubGlobal('navigator', { onLine: true });
      const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(new Response('[]', {
        status: 200,
        headers: { 'content-type': 'application/json' }
      }));

      const health = await keepaliveService.checkHealth();
      expect(fetchSpy).toHaveBeenCalledWith(
        expect.stringContaining('/rest/v1/tasks?select=id&limit=1'),
        expect.any(Object)
      );
      expect(health.state).toBe('healthy');
    });

    it('detects paused database state when server responds with 503', async () => {
      ServiceContainer.switchToSupabase();
      vi.stubGlobal('navigator', { onLine: true });
      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(new Response('Service Unavailable', {
        status: 503
      }));

      const health = await keepaliveService.checkHealth();
      expect(health.state).toBe('paused');
      expect(health.message).toContain('paused or waking up');
    });

    it('accurately identifies unauthorized / invalid API key as error rather than healthy', async () => {
      ServiceContainer.switchToSupabase();
      vi.stubGlobal('navigator', { onLine: true });
      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(new Response('Unauthorized', {
        status: 401
      }));

      const health = await keepaliveService.checkHealth();
      expect(health.state).toBe('error');
      expect(health.message).toContain('invalid or unauthorized');
    });
  });
});
