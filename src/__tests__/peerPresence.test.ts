import { describe, it, expect, beforeEach } from 'vitest';
import { dataService } from '../services/dataService';
import { PeerCheerEmoji } from '../types/presence';

/**
 * Phase 0 (V2) integrity rewrite: the ambient presence service must never
 * report simulated peers. Until real cross-room presence backing ships
 * (Phase 2 rooms work), the honest contract is: zero peers, ghost-mode
 * preference persists, subscribers are notified with the true (empty) list.
 */
describe('Phase 0 integrity: Ambient Peer Presence is honest', () => {
  beforeEach(async () => {
    // Reset ghost mode
    await dataService.presence.setGhostMode(false);
  });

  it('never reports simulated peers in production mode', async () => {
    const peers = await dataService.presence.getLivePeers();
    expect(peers).toHaveLength(0);
    const knownFakeNames = ['Elena Rostova', 'Marcus Chen', 'Maya Patel', 'Jordan Miller'];
    for (const name of knownFakeNames) {
      expect(peers.map((p) => p.displayName)).not.toContain(name);
    }
  });

  it('updateMyPresence does not fabricate a peer entry', async () => {
    await dataService.presence.updateMyPresence({
      currentSubject: 'Neurology Diagnostics',
      activity: 'deep_work',
      elapsedMinutes: 35
    });

    const peers = await dataService.presence.getLivePeers();
    expect(peers).toHaveLength(0);
  });

  it('sendCheer without real peers is a safe no-op', async () => {
    const cheerEmoji: PeerCheerEmoji = '🔥';
    await expect(dataService.presence.sendCheer('usr_does_not_exist', cheerEmoji)).resolves.toBeUndefined();
    const peers = await dataService.presence.getLivePeers();
    expect(peers).toHaveLength(0);
  });

  it('ghost-mode preference persists and is honored', async () => {
    await dataService.presence.setGhostMode(true);
    expect(await dataService.presence.getGhostMode()).toBe(true);

    // Ghost mode never reintroduces peers either way
    const peersWhileGhost = await dataService.presence.getLivePeers();
    expect(peersWhileGhost).toHaveLength(0);

    await dataService.presence.setGhostMode(false);
    expect(await dataService.presence.getGhostMode()).toBe(false);
    expect(await dataService.presence.getLivePeers()).toHaveLength(0);
  });

  it('notifies subscribers reactively with the true (empty) peer list', async () => {
    let notifiedPeersCount = -1;
    const unsubscribe = dataService.presence.subscribeToPresence((peers) => {
      notifiedPeersCount = peers.length;
    });

    // Initial synchronous notification is honest
    expect(notifiedPeersCount).toBe(0);

    await dataService.presence.updateMyPresence({
      currentSubject: 'Microbial Ecology',
      elapsedMinutes: 45
    });

    expect(notifiedPeersCount).toBe(0);
    unsubscribe();
  });
});
