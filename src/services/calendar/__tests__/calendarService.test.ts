import { describe, it, expect, beforeEach, vi } from 'vitest';
import { calendarService } from '../calendar.service';

const mockLocalStorage = {
  store: {} as Record<string, string>,
  getItem: (key: string) => mockLocalStorage.store[key] || null,
  setItem: (key: string, value: string) => {
    mockLocalStorage.store[key] = String(value);
  },
  removeItem: (key: string) => {
    delete mockLocalStorage.store[key];
  },
  clear: () => {
    mockLocalStorage.store = {};
  }
};

vi.stubGlobal('localStorage', mockLocalStorage);

describe('CalendarService (F-101)', () => {
  beforeEach(() => {
    mockLocalStorage.clear();
    // Clear in-memory feeds
    const feeds = calendarService.getFeeds();
    for (const f of feeds) {
      calendarService.deleteFeed(f.id);
    }
  });

  it('adds and lists calendar feeds with webcal normalization', async () => {
    const feed = await calendarService.addFeed({
      name: 'Canvas Timetable',
      url: 'webcal://canvas.university.edu/feeds/calendar.ics',
      color: '#4E8752',
      autoSync: false
    });

    expect(feed.id).toBeDefined();
    expect(feed.name).toBe('Canvas Timetable');
    expect(feed.url).toBe('https://canvas.university.edu/feeds/calendar.ics');
    expect(feed.enabled).toBe(true);

    const all = calendarService.getFeeds();
    expect(all.length).toBe(1);
    expect(all[0].id).toBe(feed.id);
  });

  it('toggles and deletes calendar feeds', async () => {
    const feed = await calendarService.addFeed({
      name: 'Personal GCal',
      url: 'https://calendar.google.com/calendar/ical/me%40gmail.com/basic.ics',
      autoSync: false
    });

    calendarService.toggleFeed(feed.id, false);
    expect(calendarService.getFeedById(feed.id)?.enabled).toBe(false);

    calendarService.deleteFeed(feed.id);
    expect(calendarService.getFeedById(feed.id)).toBeNull();
    expect(calendarService.getFeeds().length).toBe(0);
  });

  it('imports raw .ics file or text directly and caches parsed events', () => {
    const sampleIcs = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Test//EN
BEGIN:VEVENT
UID:manual-101
DTSTART:20260924T100000Z
DTEND:20260924T113000Z
SUMMARY:Bioinformatics Seminar
TRANSP:OPAQUE
END:VEVENT
END:VCALENDAR`;

    const { feed, events } = calendarService.importIcsString('Department Seminars', sampleIcs, '#8B5CF6');

    expect(feed.name).toBe('Department Seminars');
    expect(feed.syncStatus).toBe('synced');
    expect(events.length).toBe(1);
    expect(events[0].title).toBe('Bioinformatics Seminar');
    expect(events[0].isBusy).toBe(true);

    // Retrieve via date filter
    const onDate = calendarService.getAllEvents('2026-09-24');
    expect(onDate.length).toBe(1);
    expect(onDate[0].title).toBe('Bioinformatics Seminar');

    // Different date yields 0
    const otherDate = calendarService.getAllEvents('2026-09-25');
    expect(otherDate.length).toBe(0);
  });
});
