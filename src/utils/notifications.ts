/**
 * Solis Notification & Reminder Engine
 * Handles browser notification permissions, quiet hours, and scheduling.
 */

export interface NotificationPreferences {
  studyReminders: boolean;
  focusReminders: boolean;
  habitReminders: boolean;
  goalReminders: boolean;
  quietHoursEnabled: boolean;
  quietHoursStart: string; // HH:mm (e.g. "22:00")
  quietHoursEnd: string;   // HH:mm (e.g. "07:00")
  soundEnabled: boolean;
}

export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  studyReminders: true,
  focusReminders: true,
  habitReminders: true,
  goalReminders: false,
  quietHoursEnabled: true,
  quietHoursStart: '22:00',
  quietHoursEnd: '07:00',
  soundEnabled: true
};

const STORAGE_KEY = 'solis_notification_preferences';

export function loadNotificationPreferences(): NotificationPreferences {
  if (typeof window === 'undefined') return DEFAULT_NOTIFICATION_PREFERENCES;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_NOTIFICATION_PREFERENCES;
    return { ...DEFAULT_NOTIFICATION_PREFERENCES, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_NOTIFICATION_PREFERENCES;
  }
}

export function saveNotificationPreferences(prefs: NotificationPreferences): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  } catch {
    // ignore
  }
}

export function isWithinQuietHours(
  currentTime: Date,
  startTimeStr: string,
  endTimeStr: string
): boolean {
  const currentMinutes = currentTime.getHours() * 60 + currentTime.getMinutes();

  const [startH, startM] = startTimeStr.split(':').map((n) => parseInt(n, 10) || 0);
  const [endH, endM] = endTimeStr.split(':').map((n) => parseInt(n, 10) || 0);

  const startMinutes = startH * 60 + startM;
  const endMinutes = endH * 60 + endM;

  if (startMinutes <= endMinutes) {
    // Normal range (e.g. 09:00 to 17:00)
    return currentMinutes >= startMinutes && currentMinutes < endMinutes;
  } else {
    // Overnight range (e.g. 22:00 to 07:00)
    return currentMinutes >= startMinutes || currentMinutes < endMinutes;
  }
}

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'denied';
  }
  if (Notification.permission === 'granted') {
    return 'granted';
  }
  try {
    return await Notification.requestPermission();
  } catch {
    return 'denied';
  }
}

export function sendBrowserNotification(
  title: string,
  options?: NotificationOptions
): boolean {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return false;
  }

  const prefs = loadNotificationPreferences();
  if (prefs.quietHoursEnabled && isWithinQuietHours(new Date(), prefs.quietHoursStart, prefs.quietHoursEnd)) {
    return false; // Suppressed during quiet hours
  }

  if (Notification.permission === 'granted') {
    try {
      new Notification(title, {
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        ...options
      });
      return true;
    } catch {
      return false;
    }
  }

  return false;
}
