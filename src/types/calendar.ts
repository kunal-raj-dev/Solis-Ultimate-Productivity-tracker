/**
 * Solis - External Calendar & Scheduling Types
 * Part 3: Autonomous Connected OS & Available-Time Engine
 */

export type CalendarProvider = 'google' | 'outlook' | 'apple' | 'ical_feed' | 'local_sim';

export type CalendarSyncStatus =
  | 'disconnected'
  | 'connecting'
  | 'syncing'
  | 'synced'
  | 'error'
  | 'reauth_required';

export interface ExternalCalendarEvent {
  id: string;
  provider: CalendarProvider;
  externalId: string;
  calendarName: string;
  calendarColor?: string;
  title: string;
  description?: string;
  startTime: string; // ISO 8601 string
  endTime: string;   // ISO 8601 string
  allDay: boolean;
  isBusy: boolean;
  location?: string;
  url?: string;
}

export interface CalendarIntegrationConfig {
  id: string;
  provider: CalendarProvider;
  accountEmail: string;
  connectedAt: string;
  lastSyncedAt?: string;
  status: CalendarSyncStatus;
  syncFrequencyMinutes: number;
  autoImportEvents: boolean;
  exportSolisBlocks: boolean;
  selectedCalendars: string[];
  errorMessage?: string;
}

export interface AvailableTimeBlock {
  startTime: string; // HH:mm
  endTime: string;   // HH:mm
  durationMinutes: number;
  isOptimalForFocus: boolean; // >= 45m continuous free block
}

export interface DailyAvailableTimeReport {
  date: string;
  dayStartHour: number; // e.g., 8 (8:00 AM)
  dayEndHour: number;   // e.g., 22 (10:00 PM)
  totalAvailableMinutes: number;
  externalCommitmentsMinutes: number;
  plannedSolisMinutes: number;
  unallocatedFreeMinutes: number;
  availableSlots: AvailableTimeBlock[];
  conflicts: CalendarConflictAlert[];
}

export interface CalendarConflictAlert {
  id: string;
  type: 'solis_vs_external' | 'overlapping_external';
  severity: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  externalEventTitle: string;
  externalStartTime: string;
  externalEndTime: string;
  solisPlanId?: string;
  solisPlanTitle?: string;
  suggestedAction: {
    type: 'replan_solis' | 'move_slot' | 'shorten_duration' | 'dismiss';
    label: string;
    proposedStartTime?: string;
    proposedEndTime?: string;
  };
}
