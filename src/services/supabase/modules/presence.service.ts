import { IPresenceService } from '../../api.interface';
import { PeerPresence, PeerCheerEmoji } from '../../../types/presence';
import { SupabaseServiceContext } from './types';

/**
 * Phase 0 (V2) integrity fix — formerly this service returned four hardcoded
 * fictional peers ("Elena Rostova", "Marcus Chen", …) as production data, which
 * violated the repository's own no-fake-integration rule and made the ambient
 * "Friends Studying Now" widget lie to every signed-in user.
 *
 * Until a real cross-room presence query exists (scheduled with the Phase-2
 * rooms work), this service reports the truth: there is no ambient peer
 * presence. The widget renders its genuine empty state. The ghost-mode
 * preference is kept — it becomes meaningful the moment real backing arrives.
 */
export class SupabasePresenceService implements IPresenceService {
  private _ghostMode: boolean = false;
  private _presenceSubscribers: Array<(peers: PeerPresence[]) => void> = [];

  constructor(private ctx: SupabaseServiceContext) {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        this._ghostMode = window.localStorage.getItem('solis_ghost_mode') === 'true';
      } catch {
        // ignore storage error
      }
    }
  }

  getLivePeers = async (): Promise<PeerPresence[]> => {
    // Honest by construction: no simulated peers, no synthetic activity.
    // Real ambient presence requires a cross-room participant query and is
    // tracked for the Phase-2 rooms milestone — until then, empty.
    return [];
  };

  updateMyPresence = async (presence: Partial<PeerPresence>): Promise<void> => {
    // Broadcasting one's own presence to peers needs the same real backing as
    // reading peers; today the only honest answer is that nothing is broadcast.
    // The call stays valid (it persists the ghost-mode flag) and notifies with
    // the true (empty) peer list so subscribers render honest state.
    this.ctx.notify();
    this._presenceSubscribers.forEach((cb) => cb([]));
    void presence;
  };

  sendCheer = async (toUserId: string, emoji: PeerCheerEmoji): Promise<void> => {
    // Without real peers there is no one to cheer; keep the contract, do
    // nothing, and let the UI's empty state prevent reaching this path.
    void toUserId;
    void emoji;
  };

  setGhostMode = async (isGhost: boolean): Promise<void> => {
    this._ghostMode = isGhost;
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem('solis_ghost_mode', isGhost ? 'true' : 'false');
      }
    } catch {
      // ignore
    }

    this.ctx.notify();
    this._presenceSubscribers.forEach((cb) => cb([]));
  };

  getGhostMode = async (): Promise<boolean> => {
    return this._ghostMode;
  };

  subscribeToPresence = (callback: (peers: PeerPresence[]) => void): () => void => {
    this._presenceSubscribers.push(callback);
    callback([]);
    return () => {
      this._presenceSubscribers = this._presenceSubscribers.filter((cb) => cb !== callback);
    };
  };
}
