/**
 * Plan §6.1 — Scoped Entity Pub/Sub Event Bus
 *
 * Verifies that a mutation only wakes subscribers holding its entity channel,
 * unfiltered subscribers still receive everything, and the public
 * `notifySubscribers(channel)` hook routes through the active provider with
 * cache invalidation semantics preserved.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { MockDataService } from '../services/mock/mockService';
import { matchesChannelFilter, DataEntityChannel } from '../services/api.interface';
import { dataService, ServiceContainer } from '../services/dataService';

describe('matchesChannelFilter (shared dispatch predicate)', () => {
  it('delivers a global event (no channel) to scoped and unfiltered subscribers', () => {
    expect(matchesChannelFilter(['habits'], undefined)).toBe(true);
    expect(matchesChannelFilter(undefined, undefined)).toBe(true);
  });

  it("delivers an 'all' event to every subscriber", () => {
    expect(matchesChannelFilter(['habits'], 'all')).toBe(true);
    expect(matchesChannelFilter(undefined, 'all')).toBe(true);
    expect(matchesChannelFilter(['all'], 'notes')).toBe(true);
  });

  it('delivers a scoped event only to unfiltered or matching subscribers', () => {
    expect(matchesChannelFilter(['habits'], 'habits')).toBe(true);
    expect(matchesChannelFilter(['tasks', 'habits'], 'habits')).toBe(true);
    expect(matchesChannelFilter(['habits'], 'notes')).toBe(false);
    expect(matchesChannelFilter(undefined, 'habits')).toBe(true);
  });
});

describe('MockDataService channel-scoped notifications (plan §6.1)', () => {
  let service: MockDataService;

  beforeEach(() => {
    service = new MockDataService();
  });

  it('notifies a habits-scoped subscriber on habit mutations', async () => {
    const received: DataEntityChannel[] = [];
    const unsubscribe = service.subscribe((channel) => {
      received.push(channel!);
    }, ['habits']);

    await service.habits.toggleHabitToday('hab_1');

    expect(received.length).toBeGreaterThan(0);
    expect(received.every((c) => c === 'habits')).toBe(true);
    unsubscribe();
  });

  it('does not wake a habits-scoped subscriber when a note mutates', async () => {
    let habitChannelEvents = 0;
    const unsubscribe = service.subscribe(() => {
      habitChannelEvents++;
    }, ['habits']);

    await service.notes.createNote({ title: 'Scoped pub/sub probe note' });

    expect(habitChannelEvents).toBe(0);
    unsubscribe();
  });

  it('still wakes unfiltered subscribers on every mutation', async () => {
    let events = 0;
    const unsubscribe = service.subscribe(() => {
      events++;
    });

    await service.notes.createNote({ title: 'Unfiltered subscriber probe' });
    await service.habits.toggleHabitToday('hab_1');

    expect(events).toBeGreaterThanOrEqual(2);
    unsubscribe();
  });

  it('notifySubscribers(channel) reaches scoped subscribers without a mutation', async () => {
    let events = 0;
    const unsubscribe = service.subscribe(() => {
      events++;
    }, ['focus']);

    service.notifySubscribers('focus');
    expect(events).toBe(1);

    service.notifySubscribers('goals');
    expect(events).toBe(1);

    unsubscribe();
  });

  it('delivers the emitting channel to unfiltered provider listeners', async () => {
    const received: DataEntityChannel[] = [];
    const unsubscribe = service.subscribe((channel) => {
      received.push(channel!);
    });

    await service.notes.createNote({ title: 'Channel delivery probe' });
    await service.habits.toggleHabitToday('hab_1');

    expect(received).toContain('notes');
    expect(received).toContain('habits');
    unsubscribe();
  });
});

describe('ServiceContainer channel dispatch via dataService proxy (plan §6.1)', () => {
  beforeEach(() => {
    // Pin the container to the in-memory provider so the dispatch routing is
    // exercised without a live Supabase session.
    ServiceContainer.switchToMock();
  });

  it('routes channel events to dataService subscribers holding the channel', async () => {
    const received: string[] = [];
    const unsubscribe = dataService.subscribe(() => {
      received.push('habits-listener');
    }, ['habits']);

    const notesListenerEvents: string[] = [];
    const unsubscribeNotes = dataService.subscribe(() => {
      notesListenerEvents.push('notes-listener');
    }, ['notes']);

    // A habit mutation reaches the habits subscriber, not the notes one.
    await dataService.habits.toggleHabitToday('hab_1');
    expect(received.length).toBeGreaterThan(0);
    expect(notesListenerEvents.length).toBe(0);

    // A note mutation reaches the notes subscriber, not the habits one.
    await dataService.notes.createNote({ title: 'Container dispatch probe' });
    expect(notesListenerEvents.length).toBeGreaterThan(0);
    const notesCountAfterNote = notesListenerEvents.length;
    const habitsCountAfterNote = received.length;
    await dataService.notes.createNote({ title: 'Container dispatch probe 2' });
    expect(notesListenerEvents.length).toBeGreaterThan(notesCountAfterNote);
    expect(received.length).toBe(habitsCountAfterNote);

    unsubscribe();
    unsubscribeNotes();
  });

  it('exposes notifySubscribers(channel) on the public data service', async () => {
    let events = 0;
    const unsubscribe = dataService.subscribe(() => {
      events++;
    }, ['goals']);

    dataService.notifySubscribers('goals');
    expect(events).toBe(1);

    dataService.notifySubscribers('habits');
    expect(events).toBe(1);

    unsubscribe();
  });
});
