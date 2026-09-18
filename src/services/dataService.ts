import { IDataService } from './api.interface';
import { MockDataService } from './mock/mockService';
import { SupabaseDataService } from './supabase/supabaseService';
import { isSupabaseConfigured } from './supabase/supabaseClient';

/**
 * Service Layer Factory
 * Enforces production safety: Never silently fall back to mock data in production.
 * In development, provides explicit control via VITE_DATA_LAYER ('supabase' | 'mock').
 */
class ServiceContainer {
  private static instance: IDataService | null = null;
  private static mode: 'supabase' | 'mock' = 'mock';
  private static subscribers: Set<() => void> = new Set();
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

    ServiceContainer.activeUnsubscribe = service.subscribe(() => {
      ServiceContainer.notifySubscribers();
    });

    ServiceContainer.notifySubscribers();
  }

  public static switchToMock(): void {
    console.info('[Solis Architecture] Switching active repository to MockDataService (Offline / Inactivity Fallback)');
    ServiceContainer.setService(new MockDataService(), 'mock');
  }

  public static switchToSupabase(): void {
    if (isSupabaseConfigured()) {
      console.info('[Solis Architecture] Switching active repository to SupabaseDataService (Cloud PostgreSQL)');
      ServiceContainer.setService(new SupabaseDataService(), 'supabase');
    }
  }

  public static subscribe(listener: () => void): () => void {
    ServiceContainer.initIfNeeded();
    ServiceContainer.subscribers.add(listener);
    return () => {
      ServiceContainer.subscribers.delete(listener);
    };
  }

  private static notifySubscribers(): void {
    for (const sub of ServiceContainer.subscribers) {
      try {
        sub();
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
  subscribe(listener: () => void) {
    return ServiceContainer.subscribe(listener);
  }
};

export { ServiceContainer };
export default dataService;
