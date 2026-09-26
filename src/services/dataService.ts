import { IDataService, DataEntityChannel, matchesChannelFilter } from './api.interface';
import { MockDataService } from './mock/mockService';
import { SupabaseDataService } from './supabase/supabaseService';
import { isSupabaseConfigured } from './supabase/supabaseClient';
import type { GuestWorkspaceSnapshot } from './migration/guestMigration';

/**
 * Service Layer Factory
 * Enforces production safety: Never silently fall back to mock data in production.
 * In development, provides explicit control via VITE_DATA_LAYER ('supabase' | 'mock').
 */
class ServiceContainer {
  private static instance: IDataService | null = null;
  private static mode: 'supabase' | 'mock' = 'mock';
  private static subscribers: Set<{
    fn: () => void;
    channels?: DataEntityChannel[];
  }> = new Set();
  private static activeUnsubscribe: (() => void) | null = null;

  public static getMode(): 'supabase' | 'mock' {
    ServiceContainer.initIfNeeded();
    return ServiceContainer.mode;
  }

  private static initIfNeeded(): void {
    if (!ServiceContainer.instance) {
      const dataLayerMode = import.meta.env.VITE_DATA_LAYER;
      const isConfigured = isSupabaseConfigured();

      if (import.meta.env.PROD) {
        if (!isConfigured) {
          throw new Error(
            'FATAL: Supabase configuration missing in production environment. VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY must be provided.'
          );
        }
        ServiceContainer.setService(new SupabaseDataService(), 'supabase');
      } else {
        // Development / Testing Environment
        if (dataLayerMode === 'supabase' && isConfigured) {
          console.info('[Solis Architecture] Active Repository: SupabaseDataService (PostgreSQL + RLS)');
          ServiceContainer.setService(new SupabaseDataService(), 'supabase');
        } else if (dataLayerMode === 'supabase' && !isConfigured) {
          console.warn(
            '[Solis Architecture] VITE_DATA_LAYER is set to "supabase" but valid keys are missing in .env. Falling back to MockDataService for local development.'
          );
          ServiceContainer.setService(new MockDataService(), 'mock');
        } else {
          console.info('[Solis Architecture] Active Repository: MockDataService (In-Memory Development Mode)');
          ServiceContainer.setService(new MockDataService(), 'mock');
        }
      }
    }
  }

  public static getService(): IDataService {
    ServiceContainer.initIfNeeded();
    return ServiceContainer.instance!;
  }

  public static setService(service: IDataService, mode: 'supabase' | 'mock'): void {
    if (ServiceContainer.activeUnsubscribe) {
      ServiceContainer.activeUnsubscribe();
      ServiceContainer.activeUnsubscribe = null;
    }
    ServiceContainer.instance = service;
    ServiceContainer.mode = mode;

    ServiceContainer.activeUnsubscribe = service.subscribe((channel?: DataEntityChannel) => {
      ServiceContainer.dispatch(channel);
    });

    ServiceContainer.dispatch();
  }

  public static switchToMock(snapshot?: GuestWorkspaceSnapshot | null): void {
    console.info('[Solis Architecture] Switching active repository to MockDataService (Offline / Inactivity Fallback)');
    // When a guest workspace snapshot is provided (e.g. a failed real auth
    // attempt returning the visitor to guest mode), the mock repository is
    // restored with it instead of fresh demo seeds, so no local work is lost.
    ServiceContainer.setService(new MockDataService(snapshot ?? undefined), 'mock');
  }

  /**
   * Snapshot of the guest workspace held by the ACTIVE MockDataService
   * (plan §1.3). Must be called BEFORE switching the container to Supabase —
   * the snapshot is the only handle on the guest's local work. Returns null
   * when the active service is not the mock provider.
   */
  public static snapshotMockWorkspace(): GuestWorkspaceSnapshot | null {
    ServiceContainer.initIfNeeded();
    if (ServiceContainer.instance instanceof MockDataService) {
      return ServiceContainer.instance.getGuestWorkspaceSnapshot();
    }
    return null;
  }

  public static switchToSupabase(): void {
    if (isSupabaseConfigured()) {
      console.info('[Solis Architecture] Switching active repository to SupabaseDataService (Cloud PostgreSQL)');
      ServiceContainer.setService(new SupabaseDataService(), 'supabase');
    }
  }

  /**
   * Plan §6.1 scoped entity pub/sub: pages pass the entity channels they
   * render (e.g. HabitsPage → ['habits']) and are only woken by mutations on
   * those channels. Subscribing without channels receives every event.
   */
  public static subscribe(listener: () => void, channels?: DataEntityChannel[]): () => void {
    ServiceContainer.initIfNeeded();
    const entry = { fn: listener, channels };
    ServiceContainer.subscribers.add(entry);
    return () => {
      ServiceContainer.subscribers.delete(entry);
    };
  }

  /**
   * Manual channel notification on the public contract (plan §6.1). Routes
   * through the active provider so its query cache invalidates before any
   * follow-up read triggered by the subscribers.
   */
  public static notifySubscribers(channel: DataEntityChannel): void {
    ServiceContainer.initIfNeeded();
    ServiceContainer.instance!.notifySubscribers(channel);
  }

  private static dispatch(channel?: DataEntityChannel): void {
    for (const entry of ServiceContainer.subscribers) {
      if (!matchesChannelFilter(entry.channels, channel)) continue;
      try {
        entry.fn();
      } catch (err) {
        console.error('[ServiceContainer] Error notifying subscriber:', err);
      }
    }
  }
}

// Transparent delegating proxy to allow dynamic runtime switching without breaking references
export const dataService: IDataService = {
  get auth() { return ServiceContainer.getService().auth; },
  get tasks() { return ServiceContainer.getService().tasks; },
  get study() { return ServiceContainer.getService().study; },
  get notes() { return ServiceContainer.getService().notes; },
  get focus() { return ServiceContainer.getService().focus; },
  get habits() { return ServiceContainer.getService().habits; },
  get goals() { return ServiceContainer.getService().goals; },
  get analytics() { return ServiceContainer.getService().analytics; },
  get flashcards() { return ServiceContainer.getService().flashcards; },
  get reviews() { return ServiceContainer.getService().reviews; },
  get routines() { return ServiceContainer.getService().routines; },
  get resources() { return ServiceContainer.getService().resources; },
  get reflections() { return ServiceContainer.getService().reflections; },
  get rooms() { return ServiceContainer.getService().rooms; },
  get pacts() { return ServiceContainer.getService().pacts; },
  subscribe(listener: () => void, channels?: DataEntityChannel[]) {
    return ServiceContainer.subscribe(listener, channels);
  },
  notifySubscribers(channel: DataEntityChannel) {
    ServiceContainer.notifySubscribers(channel);
  }
};

export { ServiceContainer };
export default dataService;
