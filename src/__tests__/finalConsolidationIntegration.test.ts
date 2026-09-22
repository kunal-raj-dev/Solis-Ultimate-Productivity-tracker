import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MockDataService } from '../services/mock/mockService';
import { NotificationService } from '../services/notifications/notification.service';
import { computeAuthoritativeRemaining } from '../hooks/useStudyRoom';
import { resolveStudySuggestionRoute } from '../utils/study/adaptivePlanner';
import { StudyRoom } from '../types/room';

const mockLocalStorage = {
  store: {} as Record<string, string>,
  getItem: (key: string) => mockLocalStorage.store[key] || null,
  setItem: (key: string, value: string) => { mockLocalStorage.store[key] = String(value); },
  removeItem: (key: string) => { delete mockLocalStorage.store[key]; },
  clear: () => { mockLocalStorage.store = {}; }
};
vi.stubGlobal('localStorage', mockLocalStorage);

describe('SOLIS FINAL CONSOLIDATION & INTEGRATION VERIFICATION', () => {
  describe('1. Bidirectional Task <-> Study Plan & Time Block Synchronization', () => {
    let mockService: MockDataService;

    beforeEach(() => {
      mockService = new MockDataService();
    });

    it('synchronizes task completion to linked study plan item and time blocks', async () => {
      // Create a subject
      const subject = await mockService.study.createSubject({
        name: 'Database Internals',
        color: 'coral'
      });

      // Create a study plan item
      const planItem = await mockService.study.createPlanItem({
        subjectId: subject.id,
        title: 'B-Tree Node Splitting',
        targetMinutes: 45
      });
      expect(planItem.completed).toBe(false);

      // Create a task linked to this plan item
      const task = await mockService.tasks.createTask({
        title: 'Implement B-Tree Node Splitting',
        category: 'study',
        planItemId: planItem.id,
        estimatedMinutes: 45
      });
      expect(task.planItemId).toBe(planItem.id);

      // Create a time block for this task
      const timeBlock = await mockService.tasks.createTimeBlock({
        taskId: task.id,
        taskTitle: task.title,
        date: '2026-09-23',
        startHour: 14,
        startMinute: 0,
        durationMinutes: 45,
        status: 'planned'
      });
      expect(timeBlock.status).toBe('planned');

      // Update task to completed
      await mockService.tasks.updateTask(task.id, {
        status: 'completed',
        completedMinutes: 45
      });

      // Verify study plan item completed flag updated
      const updatedPlan = await mockService.study.getTodayPlan();
      const matchedPlan = updatedPlan.find((p) => p.id === planItem.id);
      expect(matchedPlan?.completed).toBe(true);

      // Verify time block status and progress updated
      const updatedBlocks = await mockService.tasks.getTimeBlocks('2026-09-23');
      const matchedBlock = updatedBlocks.find((b) => b.id === timeBlock.id);
      expect(matchedBlock?.status).toBe('completed');
      expect(matchedBlock?.progressPercent).toBe(100);

      // Reopen task
      await mockService.tasks.updateTask(task.id, {
        status: 'in_progress'
      });

      const reopenedPlan = await mockService.study.getTodayPlan();
      const reopenedMatchedPlan = reopenedPlan.find((p) => p.id === planItem.id);
      expect(reopenedMatchedPlan?.completed).toBe(false);

      const reopenedBlocks = await mockService.tasks.getTimeBlocks('2026-09-23');
      const reopenedMatchedBlock = reopenedBlocks.find((b) => b.id === timeBlock.id);
      expect(reopenedMatchedBlock?.status).toBe('planned');
      expect(reopenedMatchedBlock?.progressPercent).toBe(0);
    });
  });

  describe('2. Notification Deduplication & Multi-Event Handling', () => {
    let notifService: NotificationService;

    beforeEach(() => {
      mockLocalStorage.clear();
      notifService = new NotificationService();
      notifService.clearAll();
    });

    it('deduplicates identical unread notifications within 5 minutes', () => {
      const first = notifService.dispatch({
        category: 'task',
        priority: 'high',
        title: 'Starting Planned Block: Physics Problem Set',
        message: 'Your scheduled 25m focus window is starting now. Enter the flow.'
      });
      expect(first).not.toBeNull();

      // Immediate identical dispatch should be dropped as duplicate
      const duplicate = notifService.dispatch({
        category: 'task',
        priority: 'high',
        title: 'Starting Planned Block: Physics Problem Set',
        message: 'Your scheduled 25m focus window is starting now. Enter the flow.'
      });
      expect(duplicate).toBeNull();
      expect(notifService.getNotifications()).toHaveLength(1);
    });

    it('allows different messages with the same title without dropping them', () => {
      const habit1 = notifService.dispatch({
        category: 'habit',
        priority: 'normal',
        title: 'Habit Reminder',
        message: 'Hydration: drink 500ml water.'
      });
      expect(habit1).not.toBeNull();

      // Different habit with same title should NOT be dropped
      const habit2 = notifService.dispatch({
        category: 'habit',
        priority: 'normal',
        title: 'Habit Reminder',
        message: 'Mindfulness: 5-minute breathing exercise.'
      });
      expect(habit2).not.toBeNull();
      expect(notifService.getNotifications()).toHaveLength(2);
    });
  });

  describe('3. Study Room Intermission Countdown & Authoritative Timer', () => {
    it('uses breakDurationSeconds when room is on intermission break', () => {
      const breakRoom: StudyRoom = {
        id: 'room-break-1',
        title: 'Break Room',
        hostId: 'usr-1',
        roomCode: 'BRK01',
        timerState: 'idle',
        targetDurationSeconds: 1500,
        breakDurationSeconds: 300,
        isBreak: true,
        pausedElapsedSeconds: 0,
        isPrivate: false,
        createdAt: '2026-09-23T10:00:00Z',
        updatedAt: '2026-09-23T10:00:00Z',
        startedAt: null
      };

      // Idle on break should show 300 seconds (5 minutes)
      expect(computeAuthoritativeRemaining(breakRoom)).toBe(300);

      // Running on break
      const now = Date.now();
      breakRoom.timerState = 'running';
      breakRoom.startedAt = new Date(now - 60000).toISOString(); // 60s elapsed
      expect(computeAuthoritativeRemaining(breakRoom)).toBe(240); // 300 - 60 = 240
    });
  });

  describe('4. Adaptive Study Recommendation Navigation Contract', () => {
    it('strictly satisfies route resolution contracts without extraneous query strings', () => {
      expect(resolveStudySuggestionRoute({ type: 'review_flashcards' })).toBe('/app/study');
      expect(resolveStudySuggestionRoute({ type: 'take_quiz' })).toBe('/app/study');
      expect(
        resolveStudySuggestionRoute({
          type: 'review_note',
          actionPayload: { noteId: 'note-abc' }
        })
      ).toBe('/app/notes?id=note-abc');
      expect(resolveStudySuggestionRoute({ type: 'review_note' })).toBe('/app/notes');
      expect(
        resolveStudySuggestionRoute({
          type: 'study_topic',
          actionPayload: { subjectId: 'sbj-123' }
        })
      ).toBe('/app/focus');
      expect(resolveStudySuggestionRoute({ type: 'unknown_type' as any })).toBe('/app/focus');
    });
  });
});
