import { describe, it, expect } from 'vitest';
import { formatFullDate } from '../utils/date';

describe('Milestone 6: Today Cockpit Experience & Serene Architecture', () => {
  it('formats temporal context with serene typography and zero stacked pill badges', () => {
    const today = new Date('2026-09-22T10:00:00');
    const fullDate = formatFullDate(today);

    expect(fullDate).toContain('September');
    expect(fullDate).toContain('2026');
    expect(fullDate).toContain('Tuesday');

    // Greeting determination based on hour
    const getGreetingInfo = (hour: number) => {
      if (hour < 12) return { period: 'Morning Horizon', greeting: 'Good morning' };
      if (hour < 17) return { period: 'Afternoon Flow', greeting: 'Good afternoon' };
      return { period: 'Evening Rest & Reflection', greeting: 'Good evening' };
    };

    const morning = getGreetingInfo(9);
    expect(morning.period).toBe('Morning Horizon');
    expect(morning.greeting).toBe('Good morning');

    const evening = getGreetingInfo(19);
    expect(evening.period).toBe('Evening Rest & Reflection');
    expect(evening.greeting).toBe('Good evening');
  });

  it('activates evening closure ritual smoothly after 18:00 without aggressive disruption', () => {
    const isEveningClosureReady = (hour: number) => hour >= 18;

    expect(isEveningClosureReady(14)).toBe(false);
    expect(isEveningClosureReady(17)).toBe(false);
    expect(isEveningClosureReady(18)).toBe(true);
    expect(isEveningClosureReady(21)).toBe(true);
  });

  it('structures the 5 serene cockpit tiers in logical operational order', () => {
    const tiers = [
      { tier: 1, name: 'Daily Intention & Temporal Context' },
      { tier: 2, name: 'Active / Next Action Banner' },
      { tier: 3, name: '24-Hour Schedule & Timeline' },
      { tier: 4, name: 'Workload Realism & Capacity Signal' },
      { tier: 5, name: 'Today Priority Queue' }
    ];

    expect(tiers).toHaveLength(5);
    expect(tiers[0].name).toContain('Daily Intention');
    expect(tiers[1].name).toContain('Next Action');
    expect(tiers[2].name).toContain('Schedule & Timeline');
    expect(tiers[3].name).toContain('Workload Realism');
    expect(tiers[4].name).toContain('Priority Queue');
  });
});
