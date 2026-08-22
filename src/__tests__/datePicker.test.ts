import { describe, it, expect } from 'vitest';
import { getISODateString, addDays, formatFriendlyDate } from '../utils/date';

describe('Custom DatePicker & TimePicker Architecture', () => {
  it('correctly computes ISO date strings for today and offsets', () => {
    const today = new Date();
    const todayStr = getISODateString(today);
    expect(todayStr).toMatch(/^\d{4}-\d{2}-\d{2}$/);

    const tomorrow = addDays(today, 1);
    const tomorrowStr = getISODateString(tomorrow);
    expect(tomorrowStr).not.toBe(todayStr);
  });

  it('formats friendly date titles accurately for presets', () => {
    const todayStr = getISODateString(new Date());
    expect(formatFriendlyDate(todayStr)).toBe('Today');

    const tomorrowStr = getISODateString(addDays(new Date(), 1));
    expect(formatFriendlyDate(tomorrowStr)).toBe('Tomorrow');
  });

  it('validates 24-hour time format strings', () => {
    const validTimes = ['09:00', '12:30', '18:45', '23:59', '00:00'];
    const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;

    validTimes.forEach((t) => {
      expect(timeRegex.test(t)).toBe(true);
    });
  });
});
