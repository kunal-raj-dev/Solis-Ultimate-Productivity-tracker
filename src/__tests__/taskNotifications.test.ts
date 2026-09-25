import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  NotificationService,
  isWithinQuietHours,
  DEFAULT_SMART_NOTIFICATION_PREFERENCES
} from '../services/notifications/notification.service';
import { hapticsEngine } from '../utils/focus/hapticsEngine';

let mockStore: Record<string, string> = {};

const mockLocalStorage = {
  getItem: (key: string) => mockStore[key] || null,
  setItem: (key: string, value: string) => {
    mockStore[key] = String(value);
  },
  removeItem: (key: string) => {
    delete mockStore[key];
  },
  clear: () => {
    mockStore = {};
  }
};

describe('Solis Notification, Audio Chime & Quiet Hours Engine', () => {
  beforeEach(() => {
    mockLocalStorage.clear();
    // @ts-ignore
    global.window = { localStorage: mockLocalStorage } as any;
    // @ts-ignore
    global.localStorage = mockLocalStorage as any;
    vi.restoreAllMocks();
  });

  it('loads default notification preferences when localStorage is empty', () => {
    const service = new NotificationService();
    const prefs = service.getPreferences();
    expect(prefs.timeBlockReminders).toBe(true);
    expect(prefs.hourReviewReminders).toBe(true);
    expect(prefs.roomAlerts).toBe(true);
    expect(prefs.soundEnabled).toBe(true);
    expect(prefs.quietHoursEnabled).toBe(true);
    expect(prefs.quietHoursStart).toBe('22:00');
    expect(prefs.quietHoursEnd).toBe('07:00');
  });

  it('persists and retrieves updated notification preferences', () => {
    const service = new NotificationService();
    service.updatePreferences({
      ...DEFAULT_SMART_NOTIFICATION_PREFERENCES,
      soundEnabled: false,
      quietHoursStart: '23:00',
      quietHoursEnd: '06:00'
    });

    const reloaded = new NotificationService();
    const loaded = reloaded.getPreferences();

    expect(loaded.soundEnabled).toBe(false);
    expect(loaded.quietHoursStart).toBe('23:00');
    expect(loaded.quietHoursEnd).toBe('06:00');
  });

  describe('isWithinQuietHours calculation', () => {
    it('correctly calculates overnight quiet hours (22:00 to 07:00)', () => {
      // 23:30 is in quiet hours
      const lateNight = new Date(2026, 8, 22, 23, 30);
      expect(isWithinQuietHours(lateNight, '22:00', '07:00')).toBe(true);

      // 03:15 is in quiet hours
      const earlyMorning = new Date(2026, 8, 22, 3, 15);
      expect(isWithinQuietHours(earlyMorning, '22:00', '07:00')).toBe(true);

      // 14:00 is outside quiet hours
      const midDay = new Date(2026, 8, 22, 14, 0);
      expect(isWithinQuietHours(midDay, '22:00', '07:00')).toBe(false);

      // 08:00 is outside quiet hours
      const morning = new Date(2026, 8, 22, 8, 0);
      expect(isWithinQuietHours(morning, '22:00', '07:00')).toBe(false);
    });

    it('correctly calculates same-day quiet hours (e.g. 13:00 to 15:00 siesta)', () => {
      const during = new Date(2026, 8, 22, 14, 30);
      expect(isWithinQuietHours(during, '13:00', '15:00')).toBe(true);

      const before = new Date(2026, 8, 22, 11, 0);
      expect(isWithinQuietHours(before, '13:00', '15:00')).toBe(false);

      const after = new Date(2026, 8, 22, 16, 0);
      expect(isWithinQuietHours(after, '13:00', '15:00')).toBe(false);
    });
  });

  describe('Acoustic Audio Chime Synthesis', () => {
    it('safely handles missing Web Audio API in Node/test environments without crashing', () => {
      expect(() => {
        hapticsEngine.playNotificationChime('start');
        hapticsEngine.playNotificationChime('transition');
        hapticsEngine.playNotificationChime('chime');
      }).not.toThrow();
    });

    it('synthesizes gentle sine waves when AudioContext is mocked', () => {
      const mockOscillator = {
        type: 'sine',
        frequency: { setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() },
        connect: vi.fn(),
        start: vi.fn(),
        stop: vi.fn()
      };

      const mockGain = {
        gain: {
          setValueAtTime: vi.fn(),
          exponentialRampToValueAtTime: vi.fn(),
          linearRampToValueAtTime: vi.fn()
        },
        connect: vi.fn()
      };

      const mockAudioContext = {
        currentTime: 0,
        destination: {},
        createOscillator: vi.fn().mockReturnValue(mockOscillator),
        createGain: vi.fn().mockReturnValue(mockGain)
      };

      // Mock window.AudioContext
      (window as any).AudioContext = vi.fn().mockImplementation(() => mockAudioContext);

      expect(() => hapticsEngine.playNotificationChime('start')).not.toThrow();
      expect(mockAudioContext.createOscillator).toHaveBeenCalled();
      expect(mockAudioContext.createGain).toHaveBeenCalled();
      expect(mockOscillator.start).toHaveBeenCalled();

      delete (window as any).AudioContext;
    });
  });

  describe('Time Block Reminders & Fallback Dispatch', () => {
    it('triggers fallback notice when browser notifications are not granted', () => {
      const service = new NotificationService();
      service.updatePreferences({
        ...DEFAULT_SMART_NOTIFICATION_PREFERENCES,
        quietHoursEnabled: false
      });
      const fallbackSpy = vi.fn();

      service.notifyTimeBlockStart('Distributed Consensus Proof', 45, fallbackSpy);

      // In jsdom without Notification.permission = 'granted', fallbackNotice is invoked
      expect(fallbackSpy).toHaveBeenCalled();
      expect(fallbackSpy.mock.calls[0][0]).toContain('Distributed Consensus Proof');
    });

    it('triggers hour review prompt fallback notice', () => {
      const service = new NotificationService();
      service.updatePreferences({
        ...DEFAULT_SMART_NOTIFICATION_PREFERENCES,
        quietHoursEnabled: false
      });
      const fallbackSpy = vi.fn();

      service.notifyHourReviewPrompt(14, 'Distributed Consensus Proof', fallbackSpy);

      expect(fallbackSpy).toHaveBeenCalled();
      expect(fallbackSpy.mock.calls[0][0]).toContain('Hour complete');
    });

    it('respects quiet hours when quiet hours are enabled', () => {
      // Set current time into quiet hours
      const now = new Date();
      const startH = String((now.getHours() - 1 + 24) % 24).padStart(2, '0');
      const endH = String((now.getHours() + 1) % 24).padStart(2, '0');

      const service = new NotificationService();
      service.updatePreferences({
        ...DEFAULT_SMART_NOTIFICATION_PREFERENCES,
        quietHoursEnabled: true,
        quietHoursStart: `${startH}:00`,
        quietHoursEnd: `${endH}:00`
      });

      const fallbackSpy = vi.fn();
      service.notifyTimeBlockStart('Quiet Study Task', 30, fallbackSpy);

      // During quiet hours, no notification should be dispatched
      expect(fallbackSpy).not.toHaveBeenCalled();
    });
  });

  describe('Storage Migration & Key Consolidation', () => {
    it('migrates the legacy inbox (solis_notifications_list) into solis_notifications_inbox_v1', () => {
      mockStore['solis_notifications_list'] = JSON.stringify([
        {
          id: 'legacy_inbox_item',
          category: 'task',
          priority: 'normal',
          title: 'Legacy Inbox Item',
          message: 'Migrated from the retired solis_notifications_list key.',
          createdAt: new Date('2026-01-01T09:00:00').toISOString(),
          read: true
        }
      ]);

      const service = new NotificationService();

      expect(service.getNotifications()).toHaveLength(1);
      expect(service.getNotifications()[0].id).toBe('legacy_inbox_item');
      expect(mockStore['solis_notifications_inbox_v1']).toBeDefined();
      expect(mockStore['solis_notifications_list']).toBeUndefined();
    });

    it('maps the duplicate preferences store (solis_notification_preferences) into the canonical prefs store', () => {
      mockStore['solis_notification_preferences'] = JSON.stringify({
        studyReminders: false,
        soundEnabled: false,
        timeBlockReminders: false,
        quietHoursStart: '23:30',
        quietHoursEnd: '06:30'
      });

      const service = new NotificationService();
      const prefs = service.getPreferences();

      // Legacy values mapped 1:1 into SmartNotificationPreferences
      expect(prefs.studyReminders).toBe(false);
      expect(prefs.soundEnabled).toBe(false);
      expect(prefs.timeBlockReminders).toBe(false);
      expect(prefs.quietHoursStart).toBe('23:30');
      expect(prefs.quietHoursEnd).toBe('06:30');
      // Fields the legacy store never had keep canonical defaults
      expect(prefs.enabled).toBe(true);
      expect(prefs.categories.study).toBe(true);
      // Persisted under the canonical key; legacy key removed
      expect(JSON.parse(mockStore['solis_smart_notification_prefs']).studyReminders).toBe(false);
      expect(mockStore['solis_notification_preferences']).toBeUndefined();
    });
  });
});
