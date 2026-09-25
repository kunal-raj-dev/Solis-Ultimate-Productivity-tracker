/**
 * Solis - Notification Infrastructure Types
 * Part 3: Autonomous Connected OS & Smart Notification Engine
 */

export type NotificationCategory = 'task' | 'study' | 'room' | 'calendar' | 'habit' | 'intelligence';

export type NotificationPriority = 'urgent' | 'high' | 'normal' | 'low';

/**
 * Acoustic chime variants for notification fallbacks.
 * Synthesis lives exclusively in `src/utils/focus/hapticsEngine.ts` (master.md §6 audio row).
 */
export type NotificationChimeType = 'start' | 'transition' | 'chime';

export interface SolisNotification {
  id: string;
  category: NotificationCategory;
  priority: NotificationPriority;
  title: string;
  message: string;
  createdAt: string; // ISO 8601 string
  read: boolean;
  actionUrl?: string;
  actionLabel?: string;
  entityId?: string;
  expiresAt?: string;
}

export interface SmartNotificationPreferences {
  enabled: boolean;
  webPushEnabled: boolean;
  quietHoursEnabled: boolean;
  quietHoursStart: string; // HH:mm (e.g. "22:00")
  quietHoursEnd: string;   // HH:mm (e.g. "07:00")
  categories: {
    task: boolean;
    study: boolean;
    room: boolean;
    calendar: boolean;
    habit: boolean;
    intelligence: boolean;
  };
  minimumPriority: NotificationPriority;
  // Reminder toggles absorbed from the former duplicate `solis_notification_preferences` store.
  studyReminders: boolean;
  focusReminders: boolean;
  habitReminders: boolean;
  goalReminders: boolean;
  timeBlockReminders: boolean;
  hourReviewReminders: boolean;
  roomAlerts: boolean;
  // Audible chime for notification fallbacks.
  soundEnabled: boolean;
}
