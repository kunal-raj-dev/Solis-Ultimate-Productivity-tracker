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
  private static instance: IDataService;

  public static getService(): IDataService {
    if (!ServiceContainer.instance) {
      const dataLayerMode = import.meta.env.VITE_DATA_LAYER;
      const isConfigured = isSupabaseConfigured();

      if (import.meta.env.PROD) {
        if (!isConfigured) {
          throw new Error(
            'FATAL: Supabase configuration missing in production environment. VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY must be provided.'
          );
        }
        ServiceContainer.instance = new SupabaseDataService();
      } else {
        // Development / Testing Environment
        if (dataLayerMode === 'supabase' && isConfigured) {
          console.info('[Solis Architecture] Active Repository: SupabaseDataService (PostgreSQL + RLS)');
          ServiceContainer.instance = new SupabaseDataService();
        } else if (dataLayerMode === 'supabase' && !isConfigured) {
          console.warn(
            '[Solis Architecture] VITE_DATA_LAYER is set to "supabase" but valid keys are missing in .env. Falling back to MockDataService for local development.'
          );
          ServiceContainer.instance = new MockDataService();
        } else {
          console.info('[Solis Architecture] Active Repository: MockDataService (In-Memory Development Mode)');
          ServiceContainer.instance = new MockDataService();
        }
      }
    }
    return ServiceContainer.instance;
  }
}

export const dataService = ServiceContainer.getService();
export default dataService;
