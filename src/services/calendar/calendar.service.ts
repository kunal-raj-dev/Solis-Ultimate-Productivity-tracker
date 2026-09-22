/**
 * Solis - External Calendar Service
 * Part 3: Autonomous Connected OS & Integration Layer
 */

import {
  CalendarProvider,
  ExternalCalendarEvent,
  CalendarIntegrationConfig,
  DailyAvailableTimeReport
} from '../../types/calendar';
import { calculateAvailableTime, AnyTimeBlock } from '../../utils/calendar/availableTime';
import { StudyPlanItem } from '../../types/study';
import { getISODateString } from '../../utils/date';

const STORAGE_KEY_CONFIG = 'solis_calendar_config';
const STORAGE_KEY_EVENTS = 'solis_calendar_events';

export class CalendarService {
  private config: CalendarIntegrationConfig;
  private cachedEvents: ExternalCalendarEvent[] = [];
  private listeners: Array<() => void> = [];

  constructor() {
    this.config = this.loadConfig();
    this.cachedEvents = this.loadEvents();
  }

  private loadConfig(): CalendarIntegrationConfig {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_CONFIG);
      if (raw) return JSON.parse(raw);
    } catch (e) {
      // Fallback to default disconnected state
    }

    return {
      id: 'default_google_cal',
      provider: 'google',
      accountEmail: '',
      connectedAt: '',
      status: 'disconnected',
      syncFrequencyMinutes: 15,
      autoImportEvents: true,
      exportSolisBlocks: false,
      selectedCalendars: ['Primary Academic / Work']
    };
  }

  private saveConfig(config: CalendarIntegrationConfig) {
    this.config = config;
    try {
      localStorage.setItem(STORAGE_KEY_CONFIG, JSON.stringify(config));
    } catch (e) {}
    this.notify();
  }

  private loadEvents(): ExternalCalendarEvent[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_EVENTS);
      if (raw) return JSON.parse(raw);
    } catch (e) {}
    return this.getDefaultSimulatedEvents();
  }

  private saveEvents(events: ExternalCalendarEvent[]) {
    this.cachedEvents = events;
    try {
      localStorage.setItem(STORAGE_KEY_EVENTS, JSON.stringify(events));
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

  public getConfig(): CalendarIntegrationConfig {
    return { ...this.config };
  }

  public getEvents(): ExternalCalendarEvent[] {
    return [...this.cachedEvents];
  }

  /**
   * Connects to calendar provider (simulated or configured REST token)
   */
  public async connectCalendar(email: string, provider: CalendarProvider = 'google'): Promise<CalendarIntegrationConfig> {
    const updated: CalendarIntegrationConfig = {
      ...this.config,
      provider,
      accountEmail: email.trim(),
      connectedAt: new Date().toISOString(),
      lastSyncedAt: new Date().toISOString(),
      status: 'synced',
      errorMessage: undefined
    };

    // Ensure we have fresh events populated for today and upcoming week
    const events = this.getDefaultSimulatedEvents();
    this.saveEvents(events);
    this.saveConfig(updated);
    return updated;
  }

  public async disconnectCalendar(): Promise<void> {
    const updated: CalendarIntegrationConfig = {
      ...this.config,
      accountEmail: '',
      connectedAt: '',
      status: 'disconnected',
      errorMessage: undefined
    };
    this.saveConfig(updated);
  }

  public async syncNow(): Promise<ExternalCalendarEvent[]> {
    if (this.config.status === 'disconnected') {
      return [];
    }

    this.saveConfig({ ...this.config, status: 'syncing' });

    // Simulate network sync latency safely
    await new Promise((resolve) => setTimeout(resolve, 350));

    const refreshed = this.getDefaultSimulatedEvents();
    this.saveEvents(refreshed);

    this.saveConfig({
      ...this.config,
      status: 'synced',
      lastSyncedAt: new Date().toISOString()
    });

    return refreshed;
  }

  public getAvailableTimeReport(
    date: string = getISODateString(new Date()),
    solisBlocks: AnyTimeBlock[] = [],
    studyPlans: StudyPlanItem[] = []
  ): DailyAvailableTimeReport {
    return calculateAvailableTime({
      date,
      externalEvents: this.cachedEvents,
      solisBlocks,
      studyPlans
    });
  }

  /**
   * Generates a standard RFC 5545 iCalendar (.ics) string for exporting Solis blocks
   */
  public exportSolisBlocksToICS(blocks: AnyTimeBlock[], title: string = 'Solis Study Plan'): string {
    const lines = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Solis OS//Solis Study OS//EN',
      `X-WR-CALNAME:${title}`,
      'CALSCALE:GREGORIAN'
    ];

    for (const b of blocks) {
      let startStr = '';
      let endStr = '';
      const bTitle = ('taskTitle' in b ? b.taskTitle : (b as any).title) || 'Solis Focus Block';

      if ('startTime' in b && typeof (b as any).startTime === 'string') {
        startStr = (b as any).startTime;
        endStr = (b as any).endTime || '';
      } else if ('startHour' in b && typeof (b as any).startHour === 'number') {
        const h = (b as any).startHour;
        const m = (b as any).startMinute || 0;
        startStr = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
        const endTotal = h * 60 + m + (b.durationMinutes || 60);
        endStr = `${String(Math.floor(endTotal / 60)).padStart(2, '0')}:${String(endTotal % 60).padStart(2, '0')}`;
      }

      if (!startStr || !endStr) continue;
      const cleanDate = (b.date || getISODateString(new Date())).replace(/-/g, '');
      const cleanStart = startStr.replace(/:/g, '') + '00';
      const cleanEnd = endStr.replace(/:/g, '') + '00';

      lines.push(
        'BEGIN:VEVENT',
        `UID:solis-${b.id}@solis.space`,
        `DTSTAMP:${cleanDate}T000000Z`,
        `DTSTART:${cleanDate}T${cleanStart}`,
        `DTEND:${cleanDate}T${cleanEnd}`,
        `SUMMARY:${bTitle}`,
        `DESCRIPTION:Exported from Solis Operating System`,
        'STATUS:CONFIRMED',
        'END:VEVENT'
      );
    }

    lines.push('END:VCALENDAR');
    return lines.join('\r\n');
  }

  /**
   * Generates realistic academic & personal commitments relative to today's date
   */
  private getDefaultSimulatedEvents(): ExternalCalendarEvent[] {
    const today = getISODateString(new Date());

    return [
      {
        id: 'cal_ext_1',
        provider: 'google',
        externalId: 'ext_lecture_operating_systems',
        calendarName: 'University Lectures',
        calendarColor: 'lavender',
        title: 'CS 401: Distributed Systems Lecture',
        description: 'Consensus protocols, Paxos vs Raft, state machine safety',
        startTime: `${today}T09:00:00`,
        endTime: `${today}T10:15:00`,
        allDay: false,
        isBusy: true,
        location: 'Hall B / Zoom'
      },
      {
        id: 'cal_ext_2',
        provider: 'google',
        externalId: 'ext_team_sync',
        calendarName: 'Work & Projects',
        calendarColor: 'amber',
        title: 'Lab Sprint Standup & Architecture Sync',
        startTime: `${today}T13:30:00`,
        endTime: `${today}T14:15:00`,
        allDay: false,
        isBusy: true
      },
      {
        id: 'cal_ext_3',
        provider: 'google',
        externalId: 'ext_office_hours',
        calendarName: 'University Lectures',
        calendarColor: 'lavender',
        title: 'Office Hours: Algorithm Complexity Discussion',
        startTime: `${today}T16:00:00`,
        endTime: `${today}T17:00:00`,
        allDay: false,
        isBusy: true,
        location: 'Prof. Miller Office'
      }
    ];
  }
}

export const calendarService = new CalendarService();
