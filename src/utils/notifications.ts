/**
 * Solis Notification & Reminder Engine
 * Handles browser notification permissions, quiet hours, and scheduling.
 */

export interface NotificationPreferences {
  studyReminders: boolean;
  focusReminders: boolean;
  habitReminders: boolean;
  goalReminders: boolean;
  timeBlockReminders: boolean;
  hourReviewReminders: boolean;
  roomAlerts: boolean;
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
  timeBlockReminders: true,
  hourReviewReminders: true,
  roomAlerts: true,
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

/**
 * Gentle acoustic notification chime using Web Audio API (zero external assets)
 */
export function playNotificationChime(type: 'start' | 'transition' | 'chime' = 'chime'): void {
  try {
    if (typeof window === 'undefined') return;
    const prefs = loadNotificationPreferences();
    if (!prefs.soundEnabled) return;

    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    if (type === 'start') {
      // Ascending gentle fifth (440Hz -> 660Hz)
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.exponentialRampToValueAtTime(660, now + 0.35);
      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.2, now + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.7);
    } else if (type === 'transition') {
      // Reflective double-tone (523Hz C5)
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, now);
      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.25, now + 0.06);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.2);
    } else {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, now); // D5
      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.18, now + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.6);
    }

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 1.3);
  } catch {
    // AudioContext blocked or not allowed yet
  }
}

export function sendBrowserNotification(
  title: string,
  options?: NotificationOptions,
  fallbackChimeType?: 'start' | 'transition' | 'chime'
): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  const prefs = loadNotificationPreferences();
  if (prefs.quietHoursEnabled && isWithinQuietHours(new Date(), prefs.quietHoursStart, prefs.quietHoursEnd)) {
    return false; // Suppressed during quiet hours
  }

  if (prefs.soundEnabled && fallbackChimeType) {
    playNotificationChime(fallbackChimeType);
  }

  if ('Notification' in window && Notification.permission === 'granted') {
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

export function notifyTimeBlockStart(
  blockTitle: string,
  durationMinutes = 60,
  onFallback?: (msg: string) => void
): boolean {
  const prefs = loadNotificationPreferences();
  if (!prefs.timeBlockReminders) return false;
  if (prefs.quietHoursEnabled && isWithinQuietHours(new Date(), prefs.quietHoursStart, prefs.quietHoursEnd)) {
    return false;
  }

  const sent = sendBrowserNotification(
    `Starting Planned Block: ${blockTitle}`,
    {
      body: `Your scheduled ${durationMinutes}m focus window is starting now. Enter the flow.`,
      tag: 'time-block-start'
    },
    'start'
  );

  if (!sent && onFallback) {
    onFallback(`Starting block: ${blockTitle} (${durationMinutes}m)`);
  }
  return sent;
}

export function notifyHourReviewPrompt(
  hour: number,
  blockTitle?: string,
  onFallback?: (msg: string) => void
): boolean {
  const prefs = loadNotificationPreferences();
  if (!prefs.hourReviewReminders) return false;
  if (prefs.quietHoursEnabled && isWithinQuietHours(new Date(), prefs.quietHoursStart, prefs.quietHoursEnd)) {
    return false;
  }

  const formattedHour = `${hour % 12 === 0 ? 12 : hour % 12}:00 ${hour >= 12 ? 'PM' : 'AM'}`;
  const sent = sendBrowserNotification(
    `Hour Complete (${formattedHour})`,
    {
      body: blockTitle
        ? `What did you get done for "${blockTitle}"? Take 30 seconds to capture progress.`
        : 'The hour has concluded. Reflect on what was accomplished and plan what is next.',
      tag: 'hour-review'
    },
    'transition'
  );

  if (!sent && onFallback) {
    onFallback(`Hour complete: Reflect on ${blockTitle || 'your progress'}`);
  }
  return sent;
}

export function notifyStudyRoomEvent(
  title: string,
  body: string,
  onFallback?: (msg: string) => void
): boolean {
  const prefs = loadNotificationPreferences();
  if (!prefs.roomAlerts) return false;
  if (prefs.quietHoursEnabled && isWithinQuietHours(new Date(), prefs.quietHoursStart, prefs.quietHoursEnd)) {
    return false;
  }

  const sent = sendBrowserNotification(
    title,
    { body, tag: 'study-room-event' },
    'chime'
  );

  if (!sent && onFallback) {
    onFallback(`${title} — ${body}`);
  }
  return sent;
}

