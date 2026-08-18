import { describe, it, expect } from 'vitest';
import {
  isWithinQuietHours,
  loadNotificationPreferences,
  DEFAULT_NOTIFICATION_PREFERENCES
} from '../utils/notifications';

describe('Solis Resilience & Notification Suite', () => {
  it('identifies daytime within standard daytime range', () => {
    // 14:30 (2:30 PM) is not between 22:00 and 07:00
    const afternoon = new Date('2026-08-17T14:30:00');
    expect(isWithinQuietHours(afternoon, '22:00', '07:00')).toBe(false);
  });

  it('identifies midnight within overnight quiet hours range', () => {
    // 23:30 (11:30 PM) is within 22:00 to 07:00
    const midnight = new Date('2026-08-17T23:30:00');
    expect(isWithinQuietHours(midnight, '22:00', '07:00')).toBe(true);

    // 04:15 (4:15 AM) is within 22:00 to 07:00
    const earlyMorning = new Date('2026-08-17T04:15:00');
    expect(isWithinQuietHours(earlyMorning, '22:00', '07:00')).toBe(true);
  });

  it('handles same-day quiet hours range correctly', () => {
    // 13:00 is within 12:00 to 14:00
    const midday = new Date('2026-08-17T13:00:00');
    expect(isWithinQuietHours(midday, '12:00', '14:00')).toBe(true);

    // 15:00 is outside 12:00 to 14:00
    const afternoon = new Date('2026-08-17T15:00:00');
    expect(isWithinQuietHours(afternoon, '12:00', '14:00')).toBe(false);
  });

  it('provides default notification preferences safely', () => {
    const prefs = loadNotificationPreferences();
    expect(prefs).toBeDefined();
    expect(prefs.studyReminders).toBe(DEFAULT_NOTIFICATION_PREFERENCES.studyReminders);
    expect(prefs.quietHoursEnabled).toBe(true);
  });
});
