/**
 * Plan §6.2 — Study Room Host Failover
 *
 * Verifies the deterministic host-failover rule on the canonical data
 * service: when the host is no longer among the room participants, the
 * oldest remaining participant (earliest joinedAt) is auto-promoted, and
 * the operation is a no-op when the host is still present.
 */
import { describe, it, expect } from 'vitest';
import { MockDataService } from '../services/mock/mockService';
import { RoomParticipant, StudyRoom } from '../types/room';

describe('MockDataService.rooms.promoteNextHost (plan §6.2 host failover)', () => {
  it('is a no-op while the host is still among the participants', async () => {
    const service = new MockDataService();
    const room: StudyRoom = await service.rooms.createRoom({ title: 'Still Hosted Pod' });

    const result = await service.rooms.promoteNextHost(room.id);

    expect(result).toBeNull();
    const unchanged = await service.rooms.getRoom(room.id);
    expect(unchanged?.hostId).toBe(room.hostId);
  });

  it('auto-promotes the oldest remaining participant after the host leaves', async () => {
    const service = new MockDataService();
    const room: StudyRoom = await service.rooms.createRoom({ title: 'Failover Pod' });

    // Simulate a hosted session: the mock caller (usr_001) is a non-host
    // participant, the original host has departed (their row is gone), and
    // the hostId still points at them until failover runs. (Demo rooms and
    // participants beyond the current user are seeded directly — the service
    // API only joins the active user.)
    const internals = service as unknown as {
      _rooms: StudyRoom[];
      _roomParticipants: RoomParticipant[];
    };
    const departedHost = internals._rooms.find((r) => r.id === room.id)!;
    departedHost.hostId = 'user_departed_host';
    departedHost.hostName = 'Departed Host';
    internals._roomParticipants = internals._roomParticipants.filter(
      (p) => p.roomId !== room.id
    );
    internals._roomParticipants.push(
      {
        roomId: room.id,
        userId: 'user_remaining_a',
        userName: 'Arya Remaining',
        userEmail: 'arya@solis.space',
        status: 'focusing',
        joinedAt: '2026-09-26T09:00:00.000Z'
      },
      {
        roomId: room.id,
        userId: 'user_remaining_b',
        userName: 'Bran Remaining',
        userEmail: 'bran@solis.space',
        status: 'focusing',
        joinedAt: '2026-09-26T10:00:00.000Z'
      },
      {
        roomId: room.id,
        userId: 'usr_001',
        userName: 'Kunal',
        userEmail: 'kunal@solis.space',
        status: 'focusing',
        joinedAt: '2026-09-26T11:00:00.000Z'
      }
    );

    const promoted = await service.rooms.promoteNextHost(room.id);

    expect(promoted).not.toBeNull();
    expect(promoted?.hostId).toBe('user_remaining_a');
    expect(promoted?.hostName).toBe('Arya Remaining');

    const persisted = await service.rooms.getRoom(room.id);
    expect(persisted?.hostId).toBe('user_remaining_a');
  });

  it('is idempotent once a new host is in place', async () => {
    const service = new MockDataService();
    const room: StudyRoom = await service.rooms.createRoom({ title: 'Idempotent Pod' });

    const internals = service as unknown as {
      _rooms: StudyRoom[];
      _roomParticipants: RoomParticipant[];
    };
    const departedHost = internals._rooms.find((r) => r.id === room.id)!;
    departedHost.hostId = 'user_departed_host';
    internals._roomParticipants = internals._roomParticipants.filter(
      (p) => p.roomId !== room.id
    );
    internals._roomParticipants.push(
      {
        roomId: room.id,
        userId: 'user_remaining_solo',
        userName: 'Solo Remaining',
        userEmail: 'solo@solis.space',
        status: 'focusing',
        joinedAt: '2026-09-26T09:30:00.000Z'
      },
      {
        roomId: room.id,
        userId: 'usr_001',
        userName: 'Kunal',
        userEmail: 'kunal@solis.space',
        status: 'focusing',
        joinedAt: '2026-09-26T12:00:00.000Z'
      }
    );

    const first = await service.rooms.promoteNextHost(room.id);
    expect(first?.hostId).toBe('user_remaining_solo');

    const second = await service.rooms.promoteNextHost(room.id);
    expect(second).toBeNull();
  });

  it('returns null when the caller is not a participant of the room', async () => {
    const service = new MockDataService();
    const room: StudyRoom = await service.rooms.createRoom({ title: 'Outsider Pod' });
    const hostId = room.hostId;
    const internals = service as unknown as { _roomParticipants: RoomParticipant[] };
    // Host departs but the current mock user was never a participant.
    internals._roomParticipants = internals._roomParticipants.filter(
      (p) => !(p.roomId === room.id && p.userId === hostId)
    );
    internals._roomParticipants.push({
      roomId: room.id,
      userId: 'user_remaining_a',
      userName: 'Arya Remaining',
      userEmail: 'arya@solis.space',
      status: 'focusing',
      joinedAt: '2026-09-26T09:00:00.000Z'
    });

    const result = await service.rooms.promoteNextHost(room.id);

    expect(result).toBeNull();
    const unchanged = await service.rooms.getRoom(room.id);
    expect(unchanged?.hostId).toBe(hostId);
  });

  it('returns null for an empty room or an unknown room', async () => {
    const service = new MockDataService();
    const room: StudyRoom = await service.rooms.createRoom({ title: 'Empty Pod' });
    const hostId = room.hostId;
    const internals = service as unknown as { _roomParticipants: RoomParticipant[] };
    internals._roomParticipants = internals._roomParticipants.filter(
      (p) => !(p.roomId === room.id && p.userId === hostId)
    );

    expect(await service.rooms.promoteNextHost(room.id)).toBeNull();
    expect(await service.rooms.promoteNextHost('room_does_not_exist')).toBeNull();
  });
});
