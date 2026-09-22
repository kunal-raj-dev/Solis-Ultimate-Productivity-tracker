import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NotificationService } from '../services/notifications/notification.service';

const mockLocalStorage = {
  store: {} as Record<string, string>,
  getItem: (key: string) => mockLocalStorage.store[key] || null,
  setItem: (key: string, value: string) => { mockLocalStorage.store[key] = String(value); },
  removeItem: (key: string) => { delete mockLocalStorage.store[key]; },
  clear: () => { mockLocalStorage.store = {}; }
};
vi.stubGlobal('localStorage', mockLocalStorage);

describe('SOLIS PART 3 — Pillar 3: Smart Notification Infrastructure', () => {
  let service: NotificationService;

  beforeEach(() => {
    mockLocalStorage.clear();
    service = new NotificationService();
  });

  describe('Preferences Management', () => {
    it('initializes with thoughtful default notification preferences', () => {
      const prefs = service.getPreferences();
      expect(prefs.enabled).toBe(true);
      expect(prefs.quietHoursEnabled).toBe(true);
      expect(prefs.quietHoursStart).toBe('22:00');
      expect(prefs.quietHoursEnd).toBe('07:00');
      expect(prefs.categories.study).toBe(true);
      expect(prefs.categories.calendar).toBe(true);
    });

    it('updates and persists preferences', () => {
      service.updatePreferences({
        quietHoursStart: '23:00',
        categories: {
          task: true,
          study: true,
          room: false,
          calendar: false,
          habit: true,
          intelligence: true
        }
      });

      const updated = service.getPreferences();
      expect(updated.quietHoursStart).toBe('23:00');
      expect(updated.categories.room).toBe(false);
      expect(updated.categories.calendar).toBe(false);
    });
  });

  describe('Quiet Hours & Urgency Evaluation', () => {
    it('suppresses normal priority notifications during quiet hours', () => {
      service.updatePreferences({
        quietHoursEnabled: true,
        quietHoursStart: '22:00',
        quietHoursEnd: '07:00'
      });

      // 23:30 is within quiet hours
      const isQuietNight = service.isInQuietHours(new Date('2026-09-23T23:30:00'));
      expect(isQuietNight).toBe(true);

      // 03:00 is within quiet hours
      const isQuietEarly = service.isInQuietHours(new Date('2026-09-23T03:00:00'));
      expect(isQuietEarly).toBe(true);

      // 14:00 is outside quiet hours
      const isQuietDay = service.isInQuietHours(new Date('2026-09-23T14:00:00'));
      expect(isQuietDay).toBe(false);
    });

    it('handles inverted quiet hours spanning daytime if configured', () => {
      service.updatePreferences({
        quietHoursEnabled: true,
        quietHoursStart: '08:00',
        quietHoursEnd: '12:00'
      });

      expect(service.isInQuietHours(new Date('2026-09-23T10:00:00'))).toBe(true);
      expect(service.isInQuietHours(new Date('2026-09-23T15:00:00'))).toBe(false);
    });
  });

  describe('Notification Dispatch & Category Filtering', () => {
    it('dispatches notifications and notifies subscribers', () => {
      const listener = vi.fn();
      const unsubscribe = service.subscribe(listener);

      const notif = service.dispatch({
        title: 'Review Debt Due',
        message: 'You have 4 flashcards due for review.',
        category: 'study',
        priority: 'normal'
      });

      expect(notif).not.toBeNull();
      expect(listener).toHaveBeenCalled();
      expect(service.getUnreadCount()).toBeGreaterThan(0);

      unsubscribe();
    });

    it('rejects notifications when their category is disabled by user', () => {
      service.updatePreferences({
        categories: {
          task: true,
          study: true,
          room: false,
          calendar: false,
          habit: true,
          intelligence: true
        }
      });

      const notif = service.dispatch({
        title: 'Calendar Conflict Detected',
        message: 'External meeting clashes with your deep focus block.',
        category: 'calendar',
        priority: 'high'
      });

      expect(notif).toBeNull();
    });

    it('allows urgent notifications even when quiet hours are active', () => {
      service.updatePreferences({
        quietHoursEnabled: true,
        quietHoursStart: '00:00',
        quietHoursEnd: '23:59' // All day quiet
      });

      const urgentNotif = service.dispatch({
        title: 'Exam In 2 Hours',
        message: 'Final examination begins shortly.',
        category: 'study',
        priority: 'urgent'
      });

      expect(urgentNotif).not.toBeNull();
      expect(urgentNotif?.priority).toBe('urgent');
    });
  });

  describe('Read State & Clearing Queue', () => {
    it('marks individual notifications as read', () => {
      const notif = service.dispatch({
        title: 'Habit Reminder',
        message: 'Time for evening review.',
        category: 'habit',
        priority: 'normal'
      });

      expect(notif).not.toBeNull();
      const initialUnread = service.getUnreadCount();

      service.markAsRead(notif!.id);
      expect(service.getUnreadCount()).toBe(initialUnread - 1);
    });

    it('marks all notifications as read', () => {
      service.dispatch({ title: 'A', message: 'msg', category: 'task', priority: 'normal' });
      service.dispatch({ title: 'B', message: 'msg', category: 'study', priority: 'normal' });

      expect(service.getUnreadCount()).toBeGreaterThanOrEqual(2);

      service.markAllAsRead();
      expect(service.getUnreadCount()).toBe(0);
    });

    it('clears all notifications from memory and storage', () => {
      service.clearAll();
      expect(service.getNotifications()).toHaveLength(0);
      expect(service.getUnreadCount()).toBe(0);
    });
  });
});
