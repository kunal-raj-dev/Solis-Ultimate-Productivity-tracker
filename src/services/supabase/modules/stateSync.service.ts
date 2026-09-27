import { IStateSyncService } from '../../api.interface';
import { StateSyncItem, StateSyncKeyClass } from '../../../types/stateSync';
import { mapStateSyncItem } from '../supabaseMappers';
import { SupabaseServiceContext } from './types';

/**
 * V2 Phase 1 (C2) — Supabase implementation of user-scoped state continuity.
 * Last-write-wins by updated_at: a put carrying an older timestamp than the
 * stored item is refused (the stored, newer payload is returned), so a
 * lagging device can never clobber a newer write from another device.
 */
export class SupabaseStateSyncService implements IStateSyncService {
  constructor(private ctx: SupabaseServiceContext) {}

  getAll = async (): Promise<StateSyncItem[]> => {
    const userId = await this.ctx.getUserId();
    const { data, error } = await this.ctx.client
      .from('state_sync_items')
      .select('*')
      .eq('user_id', userId);
    if (error) throw error;
    return (data || []).map((row: any) => mapStateSyncItem(row));
  };

  get = async (key: string): Promise<StateSyncItem | null> => {
    const userId = await this.ctx.getUserId();
    const { data, error } = await this.ctx.client
      .from('state_sync_items')
      .select('*')
      .eq('user_id', userId)
      .eq('key', key)
      .maybeSingle();
    if (error) throw error;
    return data ? mapStateSyncItem(data) : null;
  };

  put = async (
    key: string,
    keyClass: StateSyncKeyClass,
    payload: unknown
  ): Promise<StateSyncItem> => {
    const userId = await this.ctx.getUserId();
    const now = new Date().toISOString();

    const existing = await this.get(key);
    if (existing && existing.updatedAt > now) {
      // A newer write from another device already landed; keep it (LWW).
      return existing;
    }

    const { data, error } = await this.ctx.client
      .from('state_sync_items')
      .upsert(
        {
          user_id: userId,
          key,
          key_class: keyClass,
          payload: payload ?? null,
          device_origin: detectDeviceOrigin(),
          updated_at: now
        },
        { onConflict: 'user_id,key' }
      )
      .select()
      .single();

    if (error) throw error;
    this.ctx.notify();
    return mapStateSyncItem(data);
  };

  remove = async (key: string): Promise<boolean> => {
    const userId = await this.ctx.getUserId();
    const { data, error } = await this.ctx.client
      .from('state_sync_items')
      .delete()
      .eq('user_id', userId)
      .eq('key', key)
      .select('id');
    if (error) throw error;
    return (data || []).length > 0;
  };
}

function detectDeviceOrigin(): string {
  if (typeof navigator === 'undefined') return 'unknown';
  const ua = navigator.userAgent || '';
  if (/iPhone|iPad|iPod/i.test(ua)) return 'mobile-ios';
  if (/Android/i.test(ua)) return 'mobile-android';
  if (/Edg\//i.test(ua)) return 'web-edge';
  if (/Chrome/i.test(ua)) return 'web-chrome';
  if (/Firefox/i.test(ua)) return 'web-firefox';
  if (/Safari/i.test(ua)) return 'web-safari';
  return 'web';
}
