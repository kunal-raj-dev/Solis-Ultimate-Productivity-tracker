import { IPresenceService } from '../../api.interface';
import { PeerPresence, PeerCheerEmoji } from '../../../types/presence';
import { SupabaseServiceContext } from './types';

export class SupabasePresenceService implements IPresenceService {
  private _ghostMode: boolean = false;
  private _presenceSubscribers: Array<(peers: PeerPresence[]) => void> = [];
  private _peers: PeerPresence[] = [
    {
      userId: 'usr_peer_elena',
      displayName: 'Elena Rostova',
      avatarSeed: 'elena',
      currentSubject: 'Cell Biology',
      activity: 'deep_work',
      elapsedMinutes: 42,
      lastHeartbeat: new Date().toISOString(),
      cheersReceived: []
    },
    {
      userId: 'usr_peer_marcus',
      displayName: 'Marcus Chen',
      avatarSeed: 'marcus',
      currentSubject: 'Organic Chemistry',
      activity: 'spaced_recall',
      elapsedMinutes: 25,
      lastHeartbeat: new Date().toISOString(),
      cheersReceived: []
    },
    {
      userId: 'usr_peer_maya',
      displayName: 'Maya Patel',
      avatarSeed: 'maya',
      currentSubject: 'Microeconomics',
      activity: 'reading',
      elapsedMinutes: 58,
      lastHeartbeat: new Date().toISOString(),
      cheersReceived: []
    },
    {
      userId: 'usr_peer_jordan',
      displayName: 'Jordan Miller',
      avatarSeed: 'jordan',
      currentSubject: 'Linear Algebra',
      activity: 'deep_work',
      elapsedMinutes: 18,
      lastHeartbeat: new Date().toISOString(),
      cheersReceived: []
    }
  ];

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
    let myId = 'usr_current_scholar';
    try {
      const res = await Promise.resolve(this.ctx.getUserId()).catch(() => null);
      if (res) myId = res;
    } catch {
      // offline
    }

    return JSON.parse(
      JSON.stringify(
        this._peers.filter((p) => {
          if (p.isGhostMode) return false;
          if (this._ghostMode && (p.userId === myId || p.userId === 'usr_current_scholar' || p.userId === 'usr_mock_scholar')) return false;
          return true;
        })
      )
    );
  };

  updateMyPresence = async (presence: Partial<PeerPresence>): Promise<void> => {
    let myId = 'usr_current_scholar';
    try {
      const res = await Promise.resolve(this.ctx.getUserId()).catch(() => null);
      if (res) myId = res;
    } catch {
      // Guest or offline
    }

    const existingIndex = this._peers.findIndex((p) => p.userId === myId);
    const updated: PeerPresence = {
      userId: myId,
      displayName: 'You (Studying)',
      avatarSeed: 'me',
      currentSubject: presence.currentSubject || 'General Study',
      activity: presence.activity || 'deep_work',
      elapsedMinutes: presence.elapsedMinutes || 1,
      isGhostMode: this._ghostMode,
      lastHeartbeat: new Date().toISOString(),
      cheersReceived: existingIndex >= 0 ? this._peers[existingIndex].cheersReceived : [],
      ...presence
    };

    if (this._ghostMode) {
      if (existingIndex >= 0) {
        this._peers.splice(existingIndex, 1);
      }
    } else {
      if (existingIndex >= 0) {
        this._peers[existingIndex] = updated;
      } else {
        this._peers.unshift(updated);
      }
    }

    this.ctx.notify();
    this._presenceSubscribers.forEach((cb) => cb(JSON.parse(JSON.stringify(this._peers))));
  };

  sendCheer = async (toUserId: string, emoji: PeerCheerEmoji): Promise<void> => {
    const peer = this._peers.find((p) => p.userId === toUserId);
    if (peer) {
      if (!peer.cheersReceived) peer.cheersReceived = [];
      peer.cheersReceived.push({
        id: `cheer_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        fromUserId: 'usr_me',
        fromDisplayName: 'You',
        emoji,
        sentAt: new Date().toISOString()
      });
      this.ctx.notify();
      this._presenceSubscribers.forEach((cb) => cb(JSON.parse(JSON.stringify(this._peers))));
    }
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

    let myId = 'usr_current_scholar';
    try {
      const res = await Promise.resolve(this.ctx.getUserId()).catch(() => null);
      if (res) myId = res;
    } catch {
      // offline
    }

    if (isGhost) {
      this._peers = this._peers.filter((p) => p.userId !== myId && p.userId !== 'usr_current_scholar' && p.userId !== 'usr_mock_scholar');
    }

    this.ctx.notify();
    this._presenceSubscribers.forEach((cb) => cb(JSON.parse(JSON.stringify(this._peers))));
  };

  getGhostMode = async (): Promise<boolean> => {
    return this._ghostMode;
  };

  subscribeToPresence = (callback: (peers: PeerPresence[]) => void): () => void => {
    this._presenceSubscribers.push(callback);
    callback(JSON.parse(JSON.stringify(this._peers)));
    return () => {
      this._presenceSubscribers = this._presenceSubscribers.filter((cb) => cb !== callback);
    };
  };
}
