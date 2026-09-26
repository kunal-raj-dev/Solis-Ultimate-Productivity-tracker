import { SupabaseClient } from '@supabase/supabase-js';
import { IDataService, DataEntityChannel } from '../../api.interface';

export interface SupabaseServiceContext {
  client: SupabaseClient;
  getUserId: () => Promise<string>;
  /**
   * Mutation-completion notification (plan §6.1). Each domain module receives
   * a context bound to its own entity channel, so a habit toggle only wakes
   * subscribers of the 'habits' channel instead of every mounted page.
   */
  notify: (channel?: DataEntityChannel) => void;
  getServices: () => IDataService;
}
