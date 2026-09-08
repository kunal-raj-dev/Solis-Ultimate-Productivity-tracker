import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MockDataService } from '../services/mock/mockService';
import { computeAuthoritativeRemaining } from '../hooks/useStudyRoom';
import { StudyRoom } from '../types/room';

describe('Solis Study Rooms & Real-Time Engine (Phase 2)', () => {
  let service: MockDataService;

  beforeEach(() => {
    service = new MockDataService();
  });

  describe('Authoritative Epoch Timer Mathematical Model', () => {
    it('returns total target seconds when room timer is idle', () => {
      const room: StudyRoom = {
        id: 'room_test',
        hostId: 'host_1',
        title: 'Quantum Computing Pod',
        timerState: 'idle',
        targetDurationSeconds: 1500,
        startedAt: null,
        pausedElapsedSeconds: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      expect(computeAuthoritativeRemaining(room)).toBe(1500);
    });

    it('returns target minus paused elapsed seconds when room timer is paused', () => {
      const room: StudyRoom = {
        id: 'room_test',
        hostId: 'host_1',
        title: 'Linear Algebra Pod',
        timerState: 'paused',
        targetDurationSeconds: 1500,
        startedAt: null,
        pausedElapsedSeconds: 300,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      expect(computeAuthoritativeRemaining(room)).toBe(1200);
    });

    it('calculates remaining seconds authoritatively from startedAt epoch timestamp when running', () => {
      const now = Date.now();
      const startedAt = new Date(now - 120 * 1000).toISOString(); // 120s ago

      const room: StudyRoom = {
        id: 'room_test',
        hostId: 'host_1',
        title: 'Compiler Design Sprint',
        timerState: 'running',
        targetDurationSeconds: 1500,
        startedAt,
        pausedElapsedSeconds: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const remaining = computeAuthoritativeRemaining(room);
      expect(remaining).toBeGreaterThanOrEqual(1379);
      expect(remaining).toBeLessThanOrEqual(1381);
    });

    it('accounts for prior paused elapsed time alongside current running delta', () => {
      const now = Date.now();
      const startedAt = new Date(now - 60 * 1000).toISOString(); // 60s in current run

      const room: StudyRoom = {
        id: 'room_test',
        hostId: 'host_1',
        title: 'Systems Pod',
        timerState: 'running',
        targetDurationSeconds: 1500,
        startedAt,
        pausedElapsedSeconds: 240, // 240s in previous run
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const remaining = computeAuthoritativeRemaining(room);
      // Expected remaining: 1500 - 240 - 60 = 1200s
      expect(remaining).toBeGreaterThanOrEqual(1199);
      expect(remaining).toBeLessThanOrEqual(1201);
    });

    it('strictly clamps remaining time to 0 when elapsed time surpasses target duration', () => {
      const now = Date.now();
      const startedAt = new Date(now - 2000 * 1000).toISOString(); // 2000s ago for a 1500s session

      const room: StudyRoom = {
        id: 'room_test',
        hostId: 'host_1',
        title: 'Overtime Sprint',
        timerState: 'running',
        targetDurationSeconds: 1500,
        startedAt,
        pausedElapsedSeconds: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      expect(computeAuthoritativeRemaining(room)).toBe(0);
    });
  });

  describe('Study Room Lifecycle & Service Operations', () => {
    it('lists existing rooms with active participant counts', async () => {
      const rooms = await service.rooms.getRooms();
      expect(rooms.length).toBeGreaterThanOrEqual(2);
      expect(rooms[0]).toHaveProperty('id');
      expect(rooms[0]).toHaveProperty('title');
      expect(rooms[0]).toHaveProperty('timerState');
      expect(rooms[0]).toHaveProperty('participantsCount');
      expect(rooms[0].participantsCount).toBeGreaterThan(0);
    });

    it('creates a new study room and registers the creator as initial participant', async () => {
      const newRoom = await service.rooms.createRoom({
        title: 'Distributed Consensus Sanctuary',
        targetDurationSeconds: 3000
      });

      expect(newRoom.id).toBeDefined();
      expect(newRoom.title).toBe('Distributed Consensus Sanctuary');
      expect(newRoom.targetDurationSeconds).toBe(3000);
      expect(newRoom.timerState).toBe('idle');
      expect(newRoom.pausedElapsedSeconds).toBe(0);

      const participants = await service.rooms.getParticipants(newRoom.id);
      expect(participants.length).toBe(1);
      expect(participants[0].userId).toBe(newRoom.hostId);
      expect(participants[0].status).toBe('focusing');
    });

    it('updates timer state from idle to running and back to paused authoritatively', async () => {
      const room = await service.rooms.createRoom({
        title: 'Autonomous AI Pod',
        targetDurationSeconds: 1500
      });

      // Start timer
      const startedRoom = await service.rooms.updateTimerState(room.id, 'running');
      expect(startedRoom.timerState).toBe('running');
      expect(startedRoom.startedAt).not.toBeNull();
      expect(startedRoom.pausedElapsedSeconds).toBe(0);

      // Fast forward fake clock 10 seconds and pause
      const runningStartMs = new Date(startedRoom.startedAt!).getTime();
      const fakeNow = runningStartMs + 10000;
      vi.spyOn(Date, 'now').mockReturnValue(fakeNow);

      const pausedRoom = await service.rooms.updateTimerState(room.id, 'paused');
      expect(pausedRoom.timerState).toBe('paused');
      expect(pausedRoom.startedAt).toBeNull();
      expect(pausedRoom.pausedElapsedSeconds).toBe(10);

      // Restore clock
      vi.restoreAllMocks();

      // Reset timer
      const resetRoom = await service.rooms.updateTimerState(room.id, 'idle', 1800);
      expect(resetRoom.timerState).toBe('idle');
      expect(resetRoom.startedAt).toBeNull();
      expect(resetRoom.pausedElapsedSeconds).toBe(0);
      expect(resetRoom.targetDurationSeconds).toBe(1800);
    });

    it('allows participants to join, update status, and leave', async () => {
      const room = await service.rooms.createRoom({
        title: 'Peer Review Pod'
      });

      // Join room
      const participant = await service.rooms.joinRoom(room.id, 'break');
      expect(participant.status).toBe('break');

      // Update status to focusing
      const updated = await service.rooms.updateParticipantStatus(room.id, 'focusing');
      expect(updated.status).toBe('focusing');

      // Leave room
      const left = await service.rooms.leaveRoom(room.id);
      expect(left).toBe(true);

      const remainingParts = await service.rooms.getParticipants(room.id);
      expect(remainingParts.some((p) => p.userId === participant.userId)).toBe(false);
    });

    it('supports sending and fetching room messages', async () => {
      const room = await service.rooms.createRoom({
        title: 'Chat Test Pod'
      });

      const msg = await service.rooms.sendMessage(room.id, 'Welcome to the focus sprint everyone!');
      expect(msg.id).toBeDefined();
      expect(msg.content).toBe('Welcome to the focus sprint everyone!');
      expect(msg.roomId).toBe(room.id);

      const allMsgs = await service.rooms.getMessages(room.id);
      expect(allMsgs.some((m) => m.id === msg.id)).toBe(true);
    });

    it('deletes a room and cascades removal of participants and messages', async () => {
      const room = await service.rooms.createRoom({
        title: 'Ephemeral Pod'
      });
      await service.rooms.sendMessage(room.id, 'Ephemeral message');

      const deleted = await service.rooms.deleteRoom(room.id);
      expect(deleted).toBe(true);

      const fetched = await service.rooms.getRoom(room.id);
      expect(fetched).toBeNull();

      const messages = await service.rooms.getMessages(room.id);
      expect(messages.length).toBe(0);
    });
  });
});
