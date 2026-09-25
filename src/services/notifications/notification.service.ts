/**
 * Solis - Smart Notification Service
 * Part 3: Autonomous Connected OS & Real-Time Notification Engine
 *
 * Single canonical notification store & dispatch path (master.md §6 "Notification Services"):
 * - Preferences: `solis_smart_notification_prefs`
 * - Inbox: `solis_notifications_inbox_v1` (one-time migrated from `solis_notifications_list`)
 * - Browser notifications, quiet hours and the fallback chime (via hapticsEngine) all flow
 *   through this service; the former duplicate `src/utils/notifications.ts` store
 *   (`solis_notification_preferences`) is migrated once and removed.
 */

import {
  SolisNotification,
  SmartNotificationPreferences,
  NotificationChimeType
} from '../../types/notification';
import { hapticsEngine } from '../../utils/focus/hapticsEngine';

const STORAGE_KEY_NOTIFS = 'solis_notifications_inbox_v1';
const STORAGE_KEY_NOTIFS_LEGACY = 'solis_notifications_list';
const STORAGE_KEY_PREFS = 'solis_smart_notification_prefs';
const STORAGE_KEY_PREFS_LEGACY = 'solis_notification_preferences';

export const DEFAULT_SMART_NOTIFICATION_PREFERENCES: SmartNotificationPreferences = {
  enabled: true,
  webPushEnabled: false,
  quietHoursEnabled: true,
  quietHoursStart: '22:00',
  quietHoursEnd: '07:00',
  categories: {
    task: true,
    study: true,
    room: true,
    calendar: true,
    habit: true,
    intelligence: true
  },
  minimumPriority: 'normal',
  studyReminders: true,
  focusReminders: true,
  habitReminders: true,
  goalReminders: false,
  timeBlockReminders: true,
  hourReviewReminders: true,
  roomAlerts: true,
  soundEnabled: true
};

/**
 * Pure quiet-hours calculation (HH:mm 24h strings, supports overnight windows).
 * Kept as a standalone export so callers can evaluate arbitrary windows
 * (e.g. Settings previews) without mutating service preferences.
 */
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

// Reminder-toggle fields inherited from the former duplicate preferences store.
const LEGACY_BOOLEAN_FIELDS = [
  'quietHoursEnabled',
  'studyReminders',
  'focusReminders',
  'habitReminders',
  'goalReminders',
  'timeBlockReminders',
  'hourReviewReminders',
  'roomAlerts',
  'soundEnabled'
] as const;

/**
 * Map a record from the retired `solis_notification_preferences` store onto
 * SmartNotificationPreferences. Values are mapped 1:1 (zero data loss); fields the
 * legacy store never had keep the service defaults.
 */
function mapLegacyPreferences(legacy: Record<string, unknown>): SmartNotificationPreferences {
  const prefs: SmartNotificationPreferences = { ...DEFAULT_SMART_NOTIFICATION_PREFERENCES };

  for (const field of LEGACY_BOOLEAN_FIELDS) {
    const value = legacy[field];
    if (typeof value === 'boolean') {
      prefs[field] = value;
    }
  }
  if (typeof legacy.quietHoursStart === 'string') {
    prefs.quietHoursStart = legacy.quietHoursStart;
  }
  if (typeof legacy.quietHoursEnd === 'string') {
    prefs.quietHoursEnd = legacy.quietHoursEnd;
  }
  return prefs;
}

export class NotificationService {
  private notifications: SolisNotification[] = [];
  private preferences: SmartNotificationPreferences;
  private listeners: Array<() => void> = [];

  constructor() {
    this.preferences = this.loadPreferences();
    this.notifications = this.loadNotifications();
  }

  private loadPreferences(): SmartNotificationPreferences {
    this.migrateLegacyPreferences();

    try {
      const raw = localStorage.getItem(STORAGE_KEY_PREFS);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') {
          // Merge over defaults so stores written before a field existed stay complete.
          return {
            ...DEFAULT_SMART_NOTIFICATION_PREFERENCES,
            ...parsed,
            categories: {
              ...DEFAULT_SMART_NOTIFICATION_PREFERENCES.categories,
              ...(parsed.categories ?? {})
            }
          };
        }
      }
    } catch (e) {}

    return { ...DEFAULT_SMART_NOTIFICATION_PREFERENCES };
  }

  /**
   * One-time migration of the retired duplicate store (`solis_notification_preferences`):
   * when the canonical key is absent its values are mapped onto
   * SmartNotificationPreferences and written to the canonical key; when the canonical
   * key already exists, only fields it has never written are filled in from the legacy
   * store. Either way the legacy key is then removed.
   */
  private migrateLegacyPreferences(): void {
    try {
      const legacyRaw = localStorage.getItem(STORAGE_KEY_PREFS_LEGACY);
      if (legacyRaw === null) return;

      const canonicalRaw = localStorage.getItem(STORAGE_KEY_PREFS);

      if (canonicalRaw === null) {
        const legacy = JSON.parse(legacyRaw);
        if (legacy && typeof legacy === 'object') {
          localStorage.setItem(
            STORAGE_KEY_PREFS,
            JSON.stringify(mapLegacyPreferences(legacy))
          );
        }
      } else {
        const canonical = JSON.parse(canonicalRaw);
        const legacy = JSON.parse(legacyRaw);
        if (canonical && typeof canonical === 'object' && legacy && typeof legacy === 'object') {
          // Canonical is authoritative; adopt only legacy-only fields it is missing.
          localStorage.setItem(
            STORAGE_KEY_PREFS,
            JSON.stringify({ ...mapLegacyPreferences(legacy), ...canonical })
          );
        }
      }

      localStorage.removeItem(STORAGE_KEY_PREFS_LEGACY);
    } catch (e) {
      // Unreadable legacy store: leave it untouched and retry on next boot.
    }
  }

  private savePreferences(prefs: SmartNotificationPreferences) {
    this.preferences = prefs;
    try {
      localStorage.setItem(STORAGE_KEY_PREFS, JSON.stringify(prefs));
    } catch (e) {}
    this.notify();
  }

  private loadNotifications(): SolisNotification[] {
    try {
      let raw = localStorage.getItem(STORAGE_KEY_NOTIFS);

      const legacyRaw = localStorage.getItem(STORAGE_KEY_NOTIFS_LEGACY);
      if (legacyRaw !== null) {
        // One-time migration: move legacy inbox items to the canonical key.
        if (raw === null) {
          try {
            const legacyItems = JSON.parse(legacyRaw);
            if (Array.isArray(legacyItems)) {
              raw = JSON.stringify(legacyItems);
              localStorage.setItem(STORAGE_KEY_NOTIFS, raw);
            }
          } catch (e) {}
        }
        localStorage.removeItem(STORAGE_KEY_NOTIFS_LEGACY);
      }

      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {}
    return this.getDefaultNotifications();
  }

  private saveNotifications(notifs: SolisNotification[]) {
    this.notifications = notifs;
    try {
      localStorage.setItem(STORAGE_KEY_NOTIFS, JSON.stringify(notifs));
    } catch (e) {}
    this.notify();
  }

  private notify() {
    this.listeners.forEach((cb) => {
      try { cb(); } catch (e) {}
    });
  }

  public subscribe(cb: () => void): () => void {
    this.listeners.push(cb);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== cb);
    };
  }

  public getPreferences(): SmartNotificationPreferences {
    return { ...this.preferences };
  }

  public updatePreferences(partial: Partial<SmartNotificationPreferences>) {
    this.savePreferences({ ...this.preferences, ...partial });
  }

  public getNotifications(): SolisNotification[] {
    return [...this.notifications];
  }

  public getUnreadCount(): number {
    return this.notifications.filter((n) => !n.read).length;
  }

  public markAsRead(id: string) {
    const updated = this.notifications.map((n) =>
      n.id === id ? { ...n, read: true } : n
    );
    this.saveNotifications(updated);
  }

  public markAllAsRead() {
    const updated = this.notifications.map((n) => ({ ...n, read: true }));
    this.saveNotifications(updated);
  }

  public clearAll() {
    this.saveNotifications([]);
  }

  public deleteNotification(id: string) {
    const updated = this.notifications.filter((n) => n.id !== id);
    this.saveNotifications(updated);
  }

  public isInQuietHours(date: Date = new Date()): boolean {
    if (!this.preferences.quietHoursEnabled) return false;
    return isWithinQuietHours(
      date,
      this.preferences.quietHoursStart,
      this.preferences.quietHoursEnd
    );
  }

  public dispatch(
    payload: Omit<SolisNotification, 'id' | 'createdAt' | 'read'>,
    options?: { skipBrowserNotification?: boolean }
  ): SolisNotification | null {
    if (!this.preferences.enabled) return null;
    if (!this.preferences.categories[payload.category]) return null;

    const isQuiet = this.isInQuietHours();

    // Deduplication: prevent identical unread notification within 5 minutes
    const fiveMinsAgo = Date.now() - 5 * 60 * 1000;
    const isDuplicate = this.notifications.some(
      (n) =>
        !n.read &&
        n.title === payload.title &&
        n.message === payload.message &&
        n.category === payload.category &&
        new Date(n.createdAt).getTime() > fiveMinsAgo
    );
    if (isDuplicate) return null;

    const newNotif: SolisNotification = {
      ...payload,
      id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      createdAt: new Date().toISOString(),
      read: false
    };

    const updated = [newNotif, ...this.notifications].slice(0, 50); // Keep max 50
    this.saveNotifications(updated);

    // Trigger Browser Web Notification if permission granted and not muted by quiet hours
    if (
      !options?.skipBrowserNotification &&
      (!isQuiet || payload.priority === 'urgent') &&
      this.preferences.webPushEnabled
    ) {
      this.sendBrowserNotification(newNotif.title, { body: newNotif.message });
    }

    return newNotif;
  }

  public async requestBrowserPermission(): Promise<boolean> {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      const granted = permission === 'granted';
      if (granted) {
        this.updatePreferences({ webPushEnabled: true });
      }
      return granted;
    } catch (e) {
      return false;
    }
  }

  /**
   * Single direct browser-notification sending path (permission-gated).
   * Used by dispatch() and the domain reminder methods below.
   */
  private sendBrowserNotification(title: string, options?: NotificationOptions): boolean {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return false;
    }
    if (Notification.permission !== 'granted') {
      return false;
    }
    try {
      new Notification(title, {
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        ...options
      });
      return true;
    } catch (e) {
      return false;
    }
  }

  /**
   * Audible + visible delivery for domain reminders: plays the fallback chime
   * through the canonical hapticsEngine audio path, then attempts the browser
   * notification. Returns whether the browser notification was delivered.
   */
  private deliverBrowserAlert(
    title: string,
    body: string,
    tag: string,
    chimeType: NotificationChimeType
  ): boolean {
    if (this.preferences.soundEnabled) {
      hapticsEngine.playNotificationChime(chimeType);
    }
    return this.sendBrowserNotification(title, { body, tag });
  }

  public notifyTimeBlockStart(
    blockTitle: string,
    durationMinutes = 60,
    onFallback?: (msg: string) => void
  ): boolean {
    if (!this.preferences.timeBlockReminders) return false;
    if (this.isInQuietHours()) return false;

    try {
      this.dispatch({
        category: 'task',
        priority: 'high',
        title: `Starting Planned Block: ${blockTitle}`,
        message: `Your scheduled ${durationMinutes}m focus window is starting now. Enter the flow.`,
        actionUrl: '/app/tasks',
        actionLabel: 'Open Timeline'
      }, { skipBrowserNotification: true });
    } catch {}

    const sent = this.deliverBrowserAlert(
      `Starting Planned Block: ${blockTitle}`,
      `Your scheduled ${durationMinutes}m focus window is starting now. Enter the flow.`,
      'time-block-start',
      'start'
    );

    if (!sent && onFallback) {
      onFallback(`Starting block: ${blockTitle} (${durationMinutes}m)`);
    }
    return sent;
  }

  public notifyHourReviewPrompt(
    hour: number,
    blockTitle?: string,
    onFallback?: (msg: string) => void
  ): boolean {
    if (!this.preferences.hourReviewReminders) return false;
    if (this.isInQuietHours()) return false;

    const formattedHour = `${hour % 12 === 0 ? 12 : hour % 12}:00 ${hour >= 12 ? 'PM' : 'AM'}`;

    try {
      this.dispatch({
        category: 'task',
        priority: 'normal',
        title: `Hour Complete (${formattedHour})`,
        message: blockTitle
          ? `What did you get done for "${blockTitle}"? Take 30 seconds to capture progress.`
          : 'The hour has concluded. Reflect on what was accomplished and plan what is next.',
        actionUrl: '/app/tasks',
        actionLabel: 'Log Hour Review'
      }, { skipBrowserNotification: true });
    } catch {}

    const sent = this.deliverBrowserAlert(
      `Hour Complete (${formattedHour})`,
      blockTitle
        ? `What did you get done for "${blockTitle}"? Take 30 seconds to capture progress.`
        : 'The hour has concluded. Reflect on what was accomplished and plan what is next.',
      'hour-review',
      'transition'
    );

    if (!sent && onFallback) {
      onFallback(`Hour complete: Reflect on ${blockTitle || 'your progress'}`);
    }
    return sent;
  }

  public notifyStudyRoomEvent(
    title: string,
    body: string,
    onFallback?: (msg: string) => void
  ): boolean {
    if (!this.preferences.roomAlerts) return false;
    if (this.isInQuietHours()) return false;

    try {
      this.dispatch({
        category: 'room',
        priority: 'normal',
        title,
        message: body,
        actionUrl: '/app/rooms',
        actionLabel: 'Enter Room'
      }, { skipBrowserNotification: true });
    } catch {}

    const sent = this.deliverBrowserAlert(title, body, 'study-room-event', 'chime');

    if (!sent && onFallback) {
      onFallback(`${title} — ${body}`);
    }
    return sent;
  }

  private getDefaultNotifications(): SolisNotification[] {
    const now = new Date();
    return [
      {
        id: 'notif_welcome_os',
        category: 'intelligence',
        priority: 'high',
        title: 'Solis Connected OS Active',
        message: 'External calendar integration, collaborative Study Rooms, and available time intelligence are ready.',
        createdAt: new Date(now.getTime() - 1000 * 60 * 15).toISOString(),
        read: false,
        actionUrl: '/app/dashboard',
        actionLabel: 'View Horizon'
      },
      {
        id: 'notif_spaced_review',
        category: 'study',
        priority: 'normal',
        title: 'Daily Knowledge Recall Ready',
        message: 'A foundational concept from your notes has decayed to retention risk. Review it before recall drops.',
        createdAt: new Date(now.getTime() - 1000 * 60 * 45).toISOString(),
        read: false,
        actionUrl: '/app/notes',
        actionLabel: 'Review Note'
      }
    ];
  }
}

export const notificationService = new NotificationService();
