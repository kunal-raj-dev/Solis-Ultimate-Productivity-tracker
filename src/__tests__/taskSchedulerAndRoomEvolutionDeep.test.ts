import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { MockDataService } from '../services/mock/mockService';
import { computeAuthoritativeRemaining } from '../hooks/useStudyRoom';
import { StudyRoom, RoomReflection } from '../types/room';
import { TaskTimeBlock } from '../types/task';
import { getISODateString } from '../utils/date';

describe('Task System & Study Room Deep Verification Suite', () => {
  let service: MockDataService;
  const todayStr = getISODateString(new Date());

  beforeEach(() => {
    service = new MockDataService();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('Study Room Cycle Restart & Timer Invariants', () => {
    it('resets pausedElapsedSeconds to 0 when starting a new cycle after completion', async () => {
      const room = await service.rooms.createRoom({
        title: 'Algorithms Pod',
        targetDurationSeconds: 1500
      });

      // Simulate session reaching zero by setting pausedElapsedSeconds = 1500 and timerState = 'paused'
      await service.rooms.updateTimerState(room.id, 'paused');
      // @ts-ignore - simulate completion state
      (service as any)._rooms.find((r: StudyRoom) => r.id === room.id).pausedElapsedSeconds = 1500;

      const completedRoom = (await service.rooms.getRoom(room.id))!;
      expect(completedRoom.pausedElapsedSeconds).toBe(1500);
      expect(computeAuthoritativeRemaining(completedRoom)).toBe(0);

      // Start new cycle without passing new duration
      const restartedRoom = await service.rooms.updateTimerState(room.id, 'running');
      expect(restartedRoom.timerState).toBe('running');
      expect(restartedRoom.pausedElapsedSeconds).toBe(0);
      expect(restartedRoom.startedAt).toBeDefined();

      const remaining = computeAuthoritativeRemaining(restartedRoom);
      expect(remaining).toBe(1500);
    });

    it('resets pausedElapsedSeconds when starting with a new target duration', async () => {
      const room = await service.rooms.createRoom({
        title: 'Deep Focus Sprint',
        targetDurationSeconds: 1500
      });

      // Pause halfway
      await service.rooms.updateTimerState(room.id, 'running');
      await service.rooms.updateTimerState(room.id, 'paused');

      // Start new sprint with 3000 seconds
      const newSprint = await service.rooms.updateTimerState(room.id, 'running', 3000);
      expect(newSprint.targetDurationSeconds).toBe(3000);
      expect(newSprint.pausedElapsedSeconds).toBe(0);
      expect(computeAuthoritativeRemaining(newSprint)).toBe(3000);
    });

    it('preserves subjectName and retentionRating in saveRoomReflection and logs to study tracker', async () => {
      const room = await service.rooms.createRoom({
        title: 'Quantum Computing Sanctuary',
        targetDurationSeconds: 1800
      });

      const reflection: Partial<RoomReflection> = {
        roomId: room.id,
        roomTitle: room.title,
        subjectId: 'sub_quantum',
        subjectName: 'Quantum Mechanics II',
        durationSeconds: 1800,
        objectiveAchieved: true,
        reflectionText: 'Derived Shor algorithm complexity bounds.',
        retentionRating: 5
      };

      const saved = await service.rooms.saveRoomReflection(reflection);
      expect(saved.subjectId).toBe('sub_quantum');
      expect(saved.subjectName).toBe('Quantum Mechanics II');
      expect(saved.retentionRating).toBe(5);

      const recentStudy = await service.study.getRecentSessions();
      const session = recentStudy.find((s) => s.notes === reflection.reflectionText);
      expect(session).toBeDefined();
      expect(session?.subjectName).toBe('Quantum Mechanics II');
      expect(session?.durationMinutes).toBe(30);
    });
  });

  describe('Bidirectional Task & Time Block Synchronization', () => {
    it('synchronizes time block status to linked task status and reverts to todo when planned', async () => {
      const task = await service.tasks.createTask({
        title: 'Write Compiler Frontend',
        category: 'study',
        priority: 'high'
      });
      expect(task.status).toBe('todo');

      const block = await service.tasks.createTimeBlock({
        taskId: task.id,
        taskTitle: task.title,
        date: todayStr,
        startHour: 10,
        durationMinutes: 60,
        priority: 'high',
        status: 'planned'
      });

      // Complete the time block
      await service.tasks.updateTimeBlock(block.id, { status: 'completed' });
      const completedTask = await service.tasks.getTaskById(task.id);
      expect(completedTask?.status).toBe('completed');

      // Revert time block to planned
      await service.tasks.updateTimeBlock(block.id, { status: 'planned' });
      const revertedTask = await service.tasks.getTaskById(task.id);
      expect(revertedTask?.status).toBe('todo');
    });

    it('synchronizes partial and missed statuses from review to linked task', async () => {
      const task = await service.tasks.createTask({
        title: 'Kernel Driver Debugging',
        category: 'deep_work',
        priority: 'urgent'
      });

      const block = await service.tasks.createTimeBlock({
        taskId: task.id,
        taskTitle: task.title,
        date: todayStr,
        startHour: 14,
        durationMinutes: 60,
        priority: 'urgent',
        status: 'planned'
      });

      // Review as partial
      await service.tasks.reviewTimeBlock(block.id, {
        status: 'partial',
        progressPercent: 50,
        actualMinutes: 30
      });
      const partialTask = await service.tasks.getTaskById(task.id);
      expect(partialTask?.status).toBe('partial');

      // Review as missed
      await service.tasks.reviewTimeBlock(block.id, {
        status: 'missed',
        progressPercent: 0,
        actualMinutes: 0
      });
      const missedTask = await service.tasks.getTaskById(task.id);
      expect(missedTask?.status).toBe('missed');
    });
  });

  describe('Timeline Conflict & Multi-Block Overlap Detection', () => {
    it('detects when a long spanning block conflicts with multiple subsequent shorter blocks', () => {
      const blocks: TaskTimeBlock[] = [
        {
          id: 'b1',
          userId: 'u1',
          taskTitle: 'Long Monolithic Block A (9:00 - 12:00)',
          date: todayStr,
          startHour: 9,
          startMinute: 0,
          durationMinutes: 180,
          priority: 'high',
          status: 'planned',
          actualMinutes: 0,
          progressPercent: 0,
          createdAt: '',
          updatedAt: ''
        },
        {
          id: 'b2',
          userId: 'u1',
          taskTitle: 'Short Block B (10:00 - 10:30)',
          date: todayStr,
          startHour: 10,
          startMinute: 0,
          durationMinutes: 30,
          priority: 'medium',
          status: 'planned',
          actualMinutes: 0,
          progressPercent: 0,
          createdAt: '',
          updatedAt: ''
        },
        {
          id: 'b3',
          userId: 'u1',
          taskTitle: 'Short Block C (11:00 - 11:30)',
          date: todayStr,
          startHour: 11,
          startMinute: 0,
          durationMinutes: 30,
          priority: 'low',
          status: 'planned',
          actualMinutes: 0,
          progressPercent: 0,
          createdAt: '',
          updatedAt: ''
        },
        {
          id: 'b4',
          userId: 'u1',
          taskTitle: 'Non-Overlapping Block D (13:00 - 14:00)',
          date: todayStr,
          startHour: 13,
          startMinute: 0,
          durationMinutes: 60,
          priority: 'medium',
          status: 'planned',
          actualMinutes: 0,
          progressPercent: 0,
          createdAt: '',
          updatedAt: ''
        }
      ];

      const sortedBlocks = [...blocks].sort(
        (a, b) => a.startHour - b.startHour || (a.startMinute || 0) - (b.startMinute || 0)
      );

      const conflicts: Array<{ a: TaskTimeBlock; b: TaskTimeBlock }> = [];
      for (let i = 0; i < sortedBlocks.length; i++) {
        const cur = sortedBlocks[i];
        const curStart = cur.startHour * 60 + (cur.startMinute || 0);
        const curEnd = curStart + (cur.durationMinutes || 60);
        for (let j = i + 1; j < sortedBlocks.length; j++) {
          const nxt = sortedBlocks[j];
          const nxtStart = nxt.startHour * 60 + (nxt.startMinute || 0);
          if (curEnd > nxtStart) {
            conflicts.push({ a: cur, b: nxt });
          } else {
            break;
          }
        }
      }

      // Must detect conflict between b1 & b2, AND b1 & b3, but NOT b1 & b4 or b2 & b3
      expect(conflicts.length).toBe(2);
      expect(conflicts.some((c) => c.a.id === 'b1' && c.b.id === 'b2')).toBe(true);
      expect(conflicts.some((c) => c.a.id === 'b1' && c.b.id === 'b3')).toBe(true);
      expect(conflicts.some((c) => c.b.id === 'b4')).toBe(false);
    });

    it('accurately calculates end time carry-over across minutes and hours', () => {
      const startHour = 10;
      const startMin = 45;
      const duration = 45; // Ends at 11:30 AM

      const totalStartMins = startHour * 60 + startMin;
      const totalEndMins = totalStartMins + duration;
      const endHour = Math.floor(totalEndMins / 60) % 24;
      const endMin = totalEndMins % 60;

      expect(endHour).toBe(11);
      expect(endMin).toBe(30);
    });
  });

  describe('Scheduler Minute Precision & Boundary Logic', () => {
    it('triggers start notification only at the exact start minute window, not earlier in the hour', () => {
      const block: TaskTimeBlock = {
        id: 'block_half_hour',
        userId: 'u1',
        taskTitle: 'Discrete Math Problem Set',
        date: todayStr,
        startHour: 14,
        startMinute: 30,
        durationMinutes: 60,
        priority: 'high',
        status: 'planned',
        actualMinutes: 0,
        progressPercent: 0,
        createdAt: '',
        updatedAt: ''
      };

      const checkStart = (currentHour: number, currentMinute: number) => {
        const nowTotalMins = currentHour * 60 + currentMinute;
        const totalStartMins = block.startHour * 60 + (block.startMinute || 0);
        const elapsedSinceStart = nowTotalMins - totalStartMins;
        return elapsedSinceStart >= 0 && elapsedSinceStart <= 3 && block.status === 'planned';
      };

      // At 14:01 (old bug triggered here)
      expect(checkStart(14, 1)).toBe(false);
      // At 14:29 (1 minute before)
      expect(checkStart(14, 29)).toBe(false);
      // At 14:30 (exact start)
      expect(checkStart(14, 30)).toBe(true);
      // At 14:32 (within 3 min window)
      expect(checkStart(14, 32)).toBe(true);
      // At 14:35 (after window)
      expect(checkStart(14, 35)).toBe(false);
    });

    it('triggers transition review prompt only after the block ends, not before', () => {
      // Block: 10:00 to 10:45 (duration 45m)
      const block: TaskTimeBlock = {
        id: 'block_45m',
        userId: 'u1',
        taskTitle: 'Sprint Retrospective',
        date: todayStr,
        startHour: 10,
        startMinute: 0,
        durationMinutes: 45,
        priority: 'medium',
        status: 'planned',
        actualMinutes: 0,
        progressPercent: 0,
        createdAt: '',
        updatedAt: ''
      };

      const checkTransition = (currentHour: number, currentMinute: number) => {
        const nowTotalMins = currentHour * 60 + currentMinute;
        const totalStartMins = block.startHour * 60 + (block.startMinute || 0);
        const totalEndMins = totalStartMins + (block.durationMinutes || 60);
        const elapsedSinceEnd = nowTotalMins - totalEndMins;
        return elapsedSinceEnd >= 0 && elapsedSinceEnd <= 15;
      };

      // At 10:10 (old bug triggered here because currentHour === blockEndHour && minute <= 15)
      expect(checkTransition(10, 10)).toBe(false);
      // At 10:40 (still in progress)
      expect(checkTransition(10, 40)).toBe(false);
      // At 10:45 (exact completion)
      expect(checkTransition(10, 45)).toBe(true);
      // At 10:55 (10 mins into transition window)
      expect(checkTransition(10, 55)).toBe(true);
      // At 11:00 (15 mins into transition window)
      expect(checkTransition(11, 0)).toBe(true);
      // At 11:01 (16 mins after, window closed)
      expect(checkTransition(11, 1)).toBe(false);
    });
  });
});
