/**
 * Solis - Smart Notification Service
 * Part 3: Autonomous Connected OS & Real-Time Notification Engine
 */

import {
  SolisNotification,
  SmartNotificationPreferences
} from '../../types/notification';

const STORAGE_KEY_NOTIFS = 'solis_notifications_list';
const STORAGE_KEY_PREFS = 'solis_smart_notification_prefs';

export class NotificationService {
  private notifications: SolisNotification[] = [];
  private preferences: SmartNotificationPreferences;
  private listeners: Array<() => void> = [];

  constructor() {
    this.preferences = this.loadPreferences();
    this.notifications = this.loadNotifications();
  }

  private loadPreferences(): SmartNotificationPreferences {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_PREFS);
      if (raw) return JSON.parse(raw);
    } catch (e) {}

    return {
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
      minimumPriority: 'normal'
    };
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
      const raw = localStorage.getItem(STORAGE_KEY_NOTIFS);
      if (raw) return JSON.parse(raw);
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
    const currentMins = date.getHours() * 60 + date.getMinutes();

    const [sh, sm] = this.preferences.quietHoursStart.split(':').map(Number);
    const [eh, em] = this.preferences.quietHoursEnd.split(':').map(Number);

    const startMins = (sh || 0) * 60 + (sm || 0);
    const endMins = (eh || 0) * 60 + (em || 0);

    if (startMins > endMins) {
      // Overnight (e.g. 22:00 to 07:00)
      return currentMins >= startMins || currentMins < endMins;
    }

    return currentMins >= startMins && currentMins < endMins;
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
      this.preferences.webPushEnabled &&
      typeof window !== 'undefined' &&
      'Notification' in window &&
      Notification.permission === 'granted'
    ) {
      try {
        new Notification(newNotif.title, {
          body: newNotif.message,
          icon: '/favicon.ico'
        });
      } catch (e) {}
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
