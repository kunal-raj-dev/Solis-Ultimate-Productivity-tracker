import { describe, it, expect, beforeEach } from 'vitest';
import { dataService } from '../services/dataService';
import { PeerCheerEmoji } from '../types/presence';

describe('Feature 3.3: Ambient Peer Presence System', () => {
  beforeEach(async () => {
    // Reset ghost mode
    await dataService.presence.setGhostMode(false);
  });

  it('fetches live study peers successfully', async () => {
    const peers = await dataService.presence.getLivePeers();
    expect(peers.length).toBeGreaterThanOrEqual(3);
    const peerNames = peers.map((p) => p.displayName);
    expect(peerNames).toContain('Elena Rostova');
    expect(peerNames).toContain('Marcus Chen');
  });

  it('updates caller study presence and broadcasts to peer list', async () => {
    await dataService.presence.updateMyPresence({
      currentSubject: 'Neurology Diagnostics',
      activity: 'deep_work',
      elapsedMinutes: 35
    });

    const peers = await dataService.presence.getLivePeers();
    const myPresence = peers.find((p) => p.currentSubject === 'Neurology Diagnostics');
    expect(myPresence).toBeDefined();
    expect(myPresence?.elapsedMinutes).toBe(35);
    expect(myPresence?.activity).toBe('deep_work');
  });

  it('sends quiet non-disruptive emoji cheer to a peer', async () => {
    const peers = await dataService.presence.getLivePeers();
    const targetPeer = peers.find((p) => p.displayName === 'Elena Rostova');
    expect(targetPeer).toBeDefined();

    const cheerEmoji: PeerCheerEmoji = '🔥';
    await dataService.presence.sendCheer(targetPeer!.userId, cheerEmoji);

    const updatedPeers = await dataService.presence.getLivePeers();
    const updatedTarget = updatedPeers.find((p) => p.userId === targetPeer!.userId);
    expect(updatedTarget?.cheersReceived?.length).toBeGreaterThan(0);
    const lastCheer = updatedTarget?.cheersReceived?.[updatedTarget.cheersReceived.length - 1];
    expect(lastCheer?.emoji).toBe('🔥');
  });

  it('enforces complete focus privacy in Ghost Mode', async () => {
    // 1. First make sure presence is registered
    await dataService.presence.updateMyPresence({
      currentSubject: 'Quantum Mechanics',
      elapsedMinutes: 20
    });

    let peers = await dataService.presence.getLivePeers();
    expect(peers.some((p) => p.currentSubject === 'Quantum Mechanics')).toBe(true);

    // 2. Enable Ghost Mode
    await dataService.presence.setGhostMode(true);
    const isGhost = await dataService.presence.getGhostMode();
    expect(isGhost).toBe(true);

    // 3. Current user must not appear in live peers list
    peers = await dataService.presence.getLivePeers();
    expect(peers.some((p) => p.currentSubject === 'Quantum Mechanics')).toBe(false);

    // 4. Disable Ghost Mode
    await dataService.presence.setGhostMode(false);
    expect(await dataService.presence.getGhostMode()).toBe(false);
  });

  it('notifies subscribers reactively upon presence changes', async () => {
    let notifiedPeersCount = 0;
    const unsubscribe = dataService.presence.subscribeToPresence((peers) => {
      notifiedPeersCount = peers.length;
    });

    expect(notifiedPeersCount).toBeGreaterThan(0);

    await dataService.presence.updateMyPresence({
      currentSubject: 'Microbial Ecology',
      elapsedMinutes: 45
    });

    expect(notifiedPeersCount).toBeGreaterThan(0);
    unsubscribe();
  });
});
