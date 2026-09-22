import { describe, it, expect, beforeEach } from 'vitest';
import { MockDataService } from '../services/mock/mockService';
import { CreateRoomPayload, RoomReflection } from '../types/room';

describe('Solis Collaborative Study Sanctuaries Evolution', () => {
  let service: MockDataService;

  beforeEach(() => {
    service = new MockDataService();
  });

  it('creates study sanctuary with 6-character roomCode, shared objective and modality', async () => {
    const payload: CreateRoomPayload = {
      title: 'Distributed Systems Mastery Pod',
      targetDurationSeconds: 2700,
      breakDurationSeconds: 300,
      sessionType: 'deep_focus',
      sharedObjective: 'Complete Paxos and Raft invariant proofs',
      isPrivate: false
    };

    const room = await service.rooms.createRoom(payload);

    expect(room.id).toBeDefined();
    expect(room.title).toBe(payload.title);
    expect(room.roomCode).toBeDefined();
    expect(room.roomCode?.length).toBe(6);
    expect(room.sessionType).toBe('deep_focus');
    expect(room.sharedObjective).toBe('Complete Paxos and Raft invariant proofs');
    expect(room.breakDurationSeconds).toBe(300);
    expect(room.isBreak).toBe(false);
  });

  it('retrieves room by 6-character roomCode case-insensitively', async () => {
    const created = await service.rooms.createRoom({
      title: 'Organic Chemistry Pod',
      targetDurationSeconds: 1500,
      roomCode: 'ORG456'
    });

    // Lookup with exact code
    const foundExact = await service.rooms.getRoomByCode('ORG456');
    expect(foundExact).not.toBeNull();
    expect(foundExact?.id).toBe(created.id);

    // Lookup with lowercase code
    const foundLower = await service.rooms.getRoomByCode('org456');
    expect(foundLower).not.toBeNull();
    expect(foundLower?.id).toBe(created.id);

    // Non-existent code returns null
    const notFound = await service.rooms.getRoomByCode('NON999');
    expect(notFound).toBeNull();
  });

  it('manages synchronized intermission break state transitions', async () => {
    const room = await service.rooms.createRoom({
      title: 'Full-Stack Architecture Pod',
      targetDurationSeconds: 3000,
      breakDurationSeconds: 600
    });

    // Start break
    const onBreak = await service.rooms.startBreak(room.id, 600);
    expect(onBreak.isBreak).toBe(true);
    expect(onBreak.breakDurationSeconds).toBe(600);
    expect(onBreak.timerState).toBe('paused');

    // End break
    const resumed = await service.rooms.endBreak(room.id);
    expect(resumed.isBreak).toBe(false);
  });

  it('records and queries timeline events and peer reactions', async () => {
    const room = await service.rooms.createRoom({
      title: 'Competitive Programming Sanctuary'
    });

    const ev1 = await service.rooms.sendRoomEvent(
      room.id,
      'session_start',
      'Host kicked off 45m deep focus sprint'
    );
    const ev2 = await service.rooms.sendRoomEvent(
      room.id,
      'reaction',
      '🔥'
    );
    const ev3 = await service.rooms.sendRoomEvent(
      room.id,
      'objective_achieved',
      'Solved Segment Tree with Lazy Propagation'
    );

    expect(ev1.id).toBeDefined();
    expect(ev1.eventType).toBe('session_start');
    expect(ev2.eventType).toBe('reaction');
    expect(ev2.message).toBe('🔥');

    const events = await service.rooms.getRoomEvents(room.id);
    expect(events.length).toBeGreaterThanOrEqual(3);
    expect(events.some((e) => e.id === ev1.id)).toBe(true);
    expect(events.some((e) => e.id === ev2.id)).toBe(true);
    expect(events.some((e) => e.id === ev3.id)).toBe(true);
  });

  it('saves end-of-session reflection and automatically logs a StudySession', async () => {
    const room = await service.rooms.createRoom({
      title: 'Machine Learning Theory Pod',
      targetDurationSeconds: 3600
    });

    const reflectionPayload: Partial<RoomReflection> = {
      roomId: room.id,
      roomTitle: room.title,
      durationSeconds: 3600,
      objectiveAchieved: true,
      reflectionText: 'Mastered backpropagation calculus and computation graphs.',
      nextStep: 'Implement transformer multi-head self-attention from scratch.',
      retentionRating: 5
    };

    const saved = await service.rooms.saveRoomReflection(reflectionPayload);

    expect(saved.id).toBeDefined();
    expect(saved.roomTitle).toBe('Machine Learning Theory Pod');
    expect(saved.reflectionText).toContain('backpropagation');
    expect(saved.retentionRating).toBe(5);

    // Verify room reflection history
    const history = await service.rooms.getUserRoomHistory();
    expect(history.length).toBeGreaterThanOrEqual(1);
    expect(history.some((r) => r.id === saved.id)).toBe(true);

    // Verify auto-sync to study service sessions
    const recentSessions = await service.study.getRecentSessions();
    expect(recentSessions.length).toBeGreaterThanOrEqual(1);
    expect(recentSessions.some((s) => s.subjectName === 'Machine Learning Theory Pod')).toBe(true);
  });
});
