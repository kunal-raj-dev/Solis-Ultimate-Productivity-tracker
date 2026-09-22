import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  loadNotificationPreferences,
  saveNotificationPreferences,
  isWithinQuietHours,
  DEFAULT_NOTIFICATION_PREFERENCES,
  playNotificationChime,
  notifyTimeBlockStart,
  notifyHourReviewPrompt
} from '../utils/notifications';

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
    const prefs = loadNotificationPreferences();
    expect(prefs.timeBlockReminders).toBe(true);
    expect(prefs.hourReviewReminders).toBe(true);
    expect(prefs.roomAlerts).toBe(true);
    expect(prefs.soundEnabled).toBe(true);
    expect(prefs.quietHoursEnabled).toBe(true);
    expect(prefs.quietHoursStart).toBe('22:00');
    expect(prefs.quietHoursEnd).toBe('07:00');
  });

  it('persists and retrieves updated notification preferences', () => {
    const updated = {
      ...DEFAULT_NOTIFICATION_PREFERENCES,
      soundEnabled: false,
      quietHoursStart: '23:00',
      quietHoursEnd: '06:00'
    };

    saveNotificationPreferences(updated);
    const loaded = loadNotificationPreferences();

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
        playNotificationChime('start');
        playNotificationChime('transition');
        playNotificationChime('chime');
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

      expect(() => playNotificationChime('start')).not.toThrow();
      expect(mockAudioContext.createOscillator).toHaveBeenCalled();
      expect(mockAudioContext.createGain).toHaveBeenCalled();
      expect(mockOscillator.start).toHaveBeenCalled();

      delete (window as any).AudioContext;
    });
  });

  describe('Time Block Reminders & Fallback Dispatch', () => {
    it('triggers fallback notice when browser notifications are not granted', () => {
      saveNotificationPreferences({
        ...DEFAULT_NOTIFICATION_PREFERENCES,
        quietHoursEnabled: false
      });
      const fallbackSpy = vi.fn();

      notifyTimeBlockStart('Distributed Consensus Proof', 45, fallbackSpy);

      // In jsdom without Notification.permission = 'granted', fallbackNotice is invoked
      expect(fallbackSpy).toHaveBeenCalled();
      expect(fallbackSpy.mock.calls[0][0]).toContain('Distributed Consensus Proof');
    });

    it('triggers hour review prompt fallback notice', () => {
      saveNotificationPreferences({
        ...DEFAULT_NOTIFICATION_PREFERENCES,
        quietHoursEnabled: false
      });
      const fallbackSpy = vi.fn();

      notifyHourReviewPrompt(14, 'Distributed Consensus Proof', fallbackSpy);

      expect(fallbackSpy).toHaveBeenCalled();
      expect(fallbackSpy.mock.calls[0][0]).toContain('Hour complete');
    });

    it('respects quiet hours when quiet hours are enabled', () => {
      // Set current time into quiet hours
      const now = new Date();
      const startH = String((now.getHours() - 1 + 24) % 24).padStart(2, '0');
      const endH = String((now.getHours() + 1) % 24).padStart(2, '0');

      saveNotificationPreferences({
        ...DEFAULT_NOTIFICATION_PREFERENCES,
        quietHoursEnabled: true,
        quietHoursStart: `${startH}:00`,
        quietHoursEnd: `${endH}:00`
      });

      const fallbackSpy = vi.fn();
      notifyTimeBlockStart('Quiet Study Task', 30, fallbackSpy);

      // During quiet hours, no notification should be dispatched
      expect(fallbackSpy).not.toHaveBeenCalled();
    });
  });
});
