import { SupabaseClient } from '@supabase/supabase-js';
import { IDataService } from '../../api.interface';

export interface SupabaseServiceContext {
  client: SupabaseClient;
  getUserId: () => Promise<string>;
  notify: () => void;
  getServices: () => IDataService;
}
