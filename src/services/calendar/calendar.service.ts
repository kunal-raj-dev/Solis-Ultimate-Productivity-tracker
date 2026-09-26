/**
 * Solis — Calendar Integration Service (F-101)
 *
 * Manages external .ics / webcal calendar subscription feeds, handles
 * periodic background sync, caches parsed events locally in localStorage,
 * and harmonizes external busy blocks with Solis's Available-Time Engine.
 */

import { ExternalCalendarEvent } from '../../types/calendar';
import { parseIcsCalendar } from '../../utils/calendar/icsParser';

export interface CalendarFeed {
  id: string;
  name: string;
  url: string;
  color: string;
  enabled: boolean;
  lastSyncedAt?: string;
  syncStatus: 'idle' | 'syncing' | 'synced' | 'error';
  errorMessage?: string;
  eventCount: number;
}

const FEEDS_STORAGE_KEY = 'solis_calendar_feeds';
const CACHE_STORAGE_KEY = 'solis_calendar_events_cache';

const DEFAULT_FEED_COLORS = [
  '#E65A41', // Coral
  '#4E8752', // Sage
  '#D97706', // Amber
  '#8B5CF6', // Lavender
  '#0284C7', // Sky Blue
  '#0D9488'  // Teal
];

class CalendarService {
  private feeds: CalendarFeed[] = [];
  private eventsCache: Map<string, ExternalCalendarEvent[]> = new Map(); // feedId -> events
  private subscribers: Set<() => void> = new Set();

  constructor() {
    this.loadState();
  }

  private loadState(): void {
    if (typeof window === 'undefined') return;

    try {
      const storedFeeds = localStorage.getItem(FEEDS_STORAGE_KEY);
      if (storedFeeds) {
        this.feeds = JSON.parse(storedFeeds);
      }

      const storedCache = localStorage.getItem(CACHE_STORAGE_KEY);
      if (storedCache) {
        const parsed: Record<string, ExternalCalendarEvent[]> = JSON.parse(storedCache);
        for (const [k, v] of Object.entries(parsed)) {
          this.eventsCache.set(k, v);
        }
      }
    } catch (e) {
      console.warn('[CalendarService] Failed to load cached feeds from localStorage:', e);
    }
  }

  private saveState(): void {
    if (typeof window === 'undefined') return;

    try {
      localStorage.setItem(FEEDS_STORAGE_KEY, JSON.stringify(this.feeds));
      const cacheObj: Record<string, ExternalCalendarEvent[]> = {};
      for (const [k, v] of this.eventsCache.entries()) {
        cacheObj[k] = v;
      }
      localStorage.setItem(CACHE_STORAGE_KEY, JSON.stringify(cacheObj));
    } catch (e) {
      console.warn('[CalendarService] Failed to persist feeds to localStorage:', e);
    }
  }

  public subscribe(listener: () => void): () => void {
    this.subscribers.add(listener);
    return () => {
      this.subscribers.delete(listener);
    };
  }

  private notify(): void {
    for (const listener of this.subscribers) {
      try {
        listener();
      } catch (err) {
        console.error('[CalendarService] Listener error:', err);
      }
    }
  }

  public getFeeds(): CalendarFeed[] {
    return [...this.feeds];
  }

  public getFeedById(id: string): CalendarFeed | null {
    return this.feeds.find((f) => f.id === id) || null;
  }

  public async addFeed(input: {
    name: string;
    url: string;
    color?: string;
    autoSync?: boolean;
  }): Promise<CalendarFeed> {
    const rawUrl = input.url.trim();
    // Normalize webcal:// to https://
    const normalizedUrl = rawUrl.replace(/^webcal:\/\//i, 'https://');

    const color =
      input.color ||
      DEFAULT_FEED_COLORS[this.feeds.length % DEFAULT_FEED_COLORS.length];

    const feed: CalendarFeed = {
      id: `feed_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      name: input.name.trim() || 'Subscribed Calendar',
      url: normalizedUrl,
      color,
      enabled: true,
      syncStatus: 'idle',
      eventCount: 0
    };

    this.feeds.push(feed);
    this.saveState();
    this.notify();

    if (input.autoSync !== false) {
      await this.syncFeed(feed.id).catch(() => {});
    }

    return { ...feed };
  }

  public updateFeed(id: string, updates: Partial<CalendarFeed>): CalendarFeed | null {
    const feed = this.feeds.find((f) => f.id === id);
    if (!feed) return null;

    if (updates.name !== undefined) feed.name = updates.name.trim();
    if (updates.color !== undefined) feed.color = updates.color;
    if (updates.url !== undefined) {
      feed.url = updates.url.trim().replace(/^webcal:\/\//i, 'https://');
    }
    if (updates.enabled !== undefined) feed.enabled = updates.enabled;

    this.saveState();
    this.notify();
    return { ...feed };
  }

  public deleteFeed(id: string): boolean {
    const idx = this.feeds.findIndex((f) => f.id === id);
    if (idx === -1) return false;

    this.feeds.splice(idx, 1);
    this.eventsCache.delete(id);
    this.saveState();
    this.notify();
    return true;
  }

  public toggleFeed(id: string, enabled?: boolean): CalendarFeed | null {
    const feed = this.feeds.find((f) => f.id === id);
    if (!feed) return null;

    feed.enabled = enabled !== undefined ? enabled : !feed.enabled;
    this.saveState();
    this.notify();
    return { ...feed };
  }

  /**
   * Imports raw .ics text (from file upload or manual paste)
   */
  public importIcsString(
    name: string,
    icsText: string,
    color?: string
  ): { feed: CalendarFeed; events: ExternalCalendarEvent[] } {
    const colorVal = color || DEFAULT_FEED_COLORS[this.feeds.length % DEFAULT_FEED_COLORS.length];
    const feedId = `imported_${Date.now()}`;

    const parsedEvents = parseIcsCalendar(icsText, {
      calendarName: name,
      calendarColor: colorVal,
      provider: 'ical_feed'
    });

    const feed: CalendarFeed = {
      id: feedId,
      name: name || 'Imported Calendar',
      url: 'local://manual_import',
      color: colorVal,
      enabled: true,
      lastSyncedAt: new Date().toISOString(),
      syncStatus: 'synced',
      eventCount: parsedEvents.length
    };

    this.feeds.push(feed);
    this.eventsCache.set(feedId, parsedEvents);
    this.saveState();
    this.notify();

    return { feed, events: parsedEvents };
  }

  /**
   * Syncs a single external feed by URL.
   */
  public async syncFeed(feedId: string): Promise<ExternalCalendarEvent[]> {
    const feed = this.feeds.find((f) => f.id === feedId);
    if (!feed) throw new Error(`Feed not found: ${feedId}`);

    // If manual import, return cached
    if (feed.url.startsWith('local://')) {
      return this.eventsCache.get(feedId) || [];
    }

    feed.syncStatus = 'syncing';
    feed.errorMessage = undefined;
    this.notify();

    try {
      // Direct fetch with fallback
      let icsContent = '';
      try {
        const res = await fetch(feed.url, {
          headers: { Accept: 'text/calendar, text/plain, */*' }
        });
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        }
        icsContent = await res.text();
      } catch (networkErr: unknown) {
        // In browser environments, CORS can block direct fetches from 3rd party feeds.
        // Provide clear diagnostic advice.
        const errMsg = networkErr instanceof Error ? networkErr.message : String(networkErr);
        throw new Error(`CORS/Network error accessing feed URL. Details: ${errMsg}`);
      }

      const events = parseIcsCalendar(icsContent, {
        calendarName: feed.name,
        calendarColor: feed.color,
        provider: 'ical_feed'
      });

      this.eventsCache.set(feedId, events);
      feed.syncStatus = 'synced';
      feed.lastSyncedAt = new Date().toISOString();
      feed.eventCount = events.length;
      this.saveState();
      this.notify();

      return events;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown synchronization error';
      feed.syncStatus = 'error';
      feed.errorMessage = message;
      this.saveState();
      this.notify();
      throw err;
    }
  }

  /**
   * Syncs all enabled external feeds.
   */
  public async syncAllFeeds(): Promise<ExternalCalendarEvent[]> {
    const enabledFeeds = this.feeds.filter((f) => f.enabled && !f.url.startsWith('local://'));
    await Promise.allSettled(
      enabledFeeds.map((feed) => this.syncFeed(feed.id))
    );

    const allEvents = this.getAllEvents();
    return allEvents;
  }

  /**
   * Returns all events from enabled feeds.
   * If dateKey (YYYY-MM-DD) is provided, filters for that specific date.
   */
  public getAllEvents(dateKey?: string): ExternalCalendarEvent[] {
    const enabledFeedIds = new Set(
      this.feeds.filter((f) => f.enabled).map((f) => f.id)
    );

    const events: ExternalCalendarEvent[] = [];
    for (const [feedId, feedEvents] of this.eventsCache.entries()) {
      if (!enabledFeedIds.has(feedId)) continue;
      events.push(...feedEvents);
    }

    if (!dateKey) {
      return events.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
    }

    // Filter by local date key (YYYY-MM-DD)
    return events.filter((e) => {
      const startKey = e.startTime.slice(0, 10);
      const endKey = e.endTime.slice(0, 10);
      return dateKey >= startKey && dateKey <= endKey;
    }).sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
  }
}

export const calendarService = new CalendarService();
