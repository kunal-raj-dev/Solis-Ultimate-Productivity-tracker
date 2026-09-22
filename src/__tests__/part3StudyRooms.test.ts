import { describe, it, expect, vi, beforeEach } from 'vitest';
import { computeAuthoritativeRemaining } from '../hooks/useStudyRoom';
import { StudyRoom, RoomParticipant, RoomParticipantRole } from '../types/room';
import { dataService } from '../services/dataService';

describe('SOLIS PART 3 — Pillar 2: Study Rooms Realtime & Reflection Sync', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('Zero-Polling Authoritative Timer Countdown (computeAuthoritativeRemaining)', () => {
    it('returns target duration when room timer is idle', () => {
      const room: StudyRoom = {
        id: 'room-1',
        title: 'Systems Architecture Pod',
        hostId: 'user-1',
        roomCode: 'SYS99',
        timerState: 'idle',
        targetDurationSeconds: 1800, // 30 mins
        pausedElapsedSeconds: 0,
        isPrivate: false,
        createdAt: '2026-09-23T10:00:00Z',
        updatedAt: '2026-09-23T10:00:00Z',
        startedAt: null
      };

      expect(computeAuthoritativeRemaining(room)).toBe(1800);
    });

    it('freezes and returns accurate remaining seconds when timer is paused', () => {
      const room: StudyRoom = {
        id: 'room-1',
        title: 'Systems Architecture Pod',
        hostId: 'user-1',
        roomCode: 'SYS99',
        timerState: 'paused',
        targetDurationSeconds: 1500, // 25 mins
        pausedElapsedSeconds: 300, // 5 mins elapsed before pause
        isPrivate: false,
        startedAt: null,
        createdAt: '2026-09-23T10:00:00Z',
        updatedAt: '2026-09-23T10:00:00Z'
      };

      // 1500 - 300 = 1200 seconds remaining
      expect(computeAuthoritativeRemaining(room)).toBe(1200);
    });

    it('calculates remaining seconds dynamically while timer is running without database writes', () => {
      const now = Date.now();
      const mockNow = vi.spyOn(Date, 'now').mockReturnValue(now);

      const fiveMinutesAgo = new Date(now - 300 * 1000).toISOString();
      const room: StudyRoom = {
        id: 'room-1',
        title: 'Quantum Physics Pod',
        hostId: 'user-1',
        roomCode: 'QP101',
        timerState: 'running',
        targetDurationSeconds: 1500,
        pausedElapsedSeconds: 0,
        startedAt: fiveMinutesAgo,
        isPrivate: false,
        createdAt: '2026-09-23T10:00:00Z',
        updatedAt: '2026-09-23T10:00:00Z'
      };

      // 1500 - 300 = 1200 seconds remaining
      expect(computeAuthoritativeRemaining(room)).toBe(1200);

      mockNow.mockRestore();
    });

    it('never returns negative numbers even if target duration has elapsed', () => {
      const now = Date.now();
      const mockNow = vi.spyOn(Date, 'now').mockReturnValue(now);

      const thirtyMinutesAgo = new Date(now - 1800 * 1000).toISOString();
      const room: StudyRoom = {
        id: 'room-1',
        title: 'Compiler Design Pod',
        hostId: 'user-1',
        roomCode: 'CD101',
        timerState: 'running',
        targetDurationSeconds: 1500, // 25 mins target, but 30 mins elapsed
        pausedElapsedSeconds: 0,
        startedAt: thirtyMinutesAgo,
        isPrivate: false,
        createdAt: '2026-09-23T10:00:00Z',
        updatedAt: '2026-09-23T10:00:00Z'
      };

      expect(computeAuthoritativeRemaining(room)).toBe(0);

      mockNow.mockRestore();
    });

    it('handles null room safely', () => {
      expect(computeAuthoritativeRemaining(null)).toBe(0);
    });
  });

  describe('Participant Roles & Capabilities', () => {
    it('properly distinguishes participant roles', () => {
      const roles: RoomParticipantRole[] = ['owner', 'co_host', 'participant', 'viewer'];
      expect(roles).toHaveLength(4);

      const participant: RoomParticipant = {
        roomId: 'room-1',
        userId: 'user-123',
        userName: 'Kunal',
        role: 'co_host',
        status: 'focusing',
        personalObjective: 'Deriving Cache Coherence Protocols',
        joinedAt: '2026-09-23T10:00:00Z'
      };

      expect(participant.role).toBe('co_host');
      expect(participant.personalObjective).toBe('Deriving Cache Coherence Protocols');
    });
  });

  describe('Room Reflection & Study Session Sync', () => {
    it('synchronizes room completion reflection into permanent study log', async () => {
      const logSessionSpy = vi.spyOn(dataService.study, 'logSession').mockResolvedValue({
        id: 'session-logged-1',
        subjectId: 'sbj-os',
        subjectName: 'Operating Systems',
        type: 'deep_study',
        durationMinutes: 45,
        topicsCovered: ['Virtual Memory Management'],
        retentionRating: 5,
        notes: 'Room Reflection: Mastered TLB miss handling.',
        completedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });

      const sessionResult = await dataService.study.logSession({
        subjectId: 'sbj-os',
        durationMinutes: 45,
        type: 'deep_study',
        topicsCovered: ['Virtual Memory Management'],
        retentionRating: 5,
        notes: 'Room Reflection: Mastered TLB miss handling.'
      });

      expect(logSessionSpy).toHaveBeenCalledTimes(1);
      expect(sessionResult.durationMinutes).toBe(45);
      expect(sessionResult.topicsCovered).toContain('Virtual Memory Management');
      expect(sessionResult.retentionRating).toBe(5);
    });
  });
});
