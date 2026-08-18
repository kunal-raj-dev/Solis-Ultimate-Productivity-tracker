/**
 * Solis - Centralized Date and Time Engineering Suite
 * Provides deterministic date boundaries, comparisons, and formatting.
 */

export function getISODateString(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function addDays(date: Date = new Date(), days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

export function startOfDay(date: Date = new Date()): Date {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
}

export function endOfDay(date: Date = new Date()): Date {
  const result = new Date(date);
  result.setHours(23, 59, 59, 999);
  return result;
}

export function isToday(dateInput?: string | Date): boolean {
  if (!dateInput) return false;
  const target = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  if (isNaN(target.getTime())) return false;

  const today = new Date();
  return (
    target.getFullYear() === today.getFullYear() &&
    target.getMonth() === today.getMonth() &&
    target.getDate() === today.getDate()
  );
}

export function isPast(dateInput?: string | Date): boolean {
  if (!dateInput) return false;
  const target = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  if (isNaN(target.getTime())) return false;

  const todayStart = startOfDay(new Date());
  return target.getTime() < todayStart.getTime();
}

export function isFuture(dateInput?: string | Date): boolean {
  if (!dateInput) return false;
  const target = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  if (isNaN(target.getTime())) return false;

  const todayEnd = endOfDay(new Date());
  return target.getTime() > todayEnd.getTime();
}

export function isThisWeek(dateInput?: string | Date): boolean {
  if (!dateInput) return false;
  const target = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  if (isNaN(target.getTime())) return false;

  const now = new Date();
  const startOfWeek = new Date(now);
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Monday as first day
  startOfWeek.setDate(diff);
  startOfWeek.setHours(0, 0, 0, 0);

  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(endOfWeek.getDate() + 7);

  return target.getTime() >= startOfWeek.getTime() && target.getTime() < endOfWeek.getTime();
}

export function getDaysDifference(d1: Date, d2: Date): number {
  const utc1 = Date.UTC(d1.getFullYear(), d1.getMonth(), d1.getDate());
  const utc2 = Date.UTC(d2.getFullYear(), d2.getMonth(), d2.getDate());
  return Math.floor((utc2 - utc1) / (1000 * 60 * 60 * 24));
}

export function getTimeOfDayGreeting(userName = 'Kunal'): {
  greeting: string;
  period: string;
  suggestion: string;
} {
  const hour = new Date().getHours();

  if (hour >= 5 && hour < 12) {
    return {
      greeting: `Good morning, ${userName}`,
      period: 'Morning Flow',
      suggestion: 'A quiet morning window is optimal for your highest cognitive demand tasks.'
    };
  } else if (hour >= 12 && hour < 17) {
    return {
      greeting: `Good afternoon, ${userName}`,
      period: 'Midday Momentum',
      suggestion: 'Maintain momentum with deliberate focus blocks and scheduled short intervals.'
    };
  } else if (hour >= 17 && hour < 22) {
    return {
      greeting: `Good evening, ${userName}`,
      period: 'Evening Reflection',
      suggestion: 'Consolidate today’s learning, review active recall cards, and prepare tomorrow’s intentions.'
    };
  } else {
    return {
      greeting: `Quiet hours, ${userName}`,
      period: 'Late Resonance',
      suggestion: 'Rest and mental consolidation are the vital foundation for tomorrow’s breakthroughs.'
    };
  }
}

export function formatFriendlyDate(dateString?: string): string {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '';

  if (isToday(date)) return 'Today';

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  if (
    date.getFullYear() === yesterday.getFullYear() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getDate() === yesterday.getDate()
  ) {
    return 'Yesterday';
  }

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  if (
    date.getFullYear() === tomorrow.getFullYear() &&
    date.getMonth() === tomorrow.getMonth() &&
    date.getDate() === tomorrow.getDate()
  ) {
    return 'Tomorrow';
  }

  return new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric'
  }).format(date);
}

export function formatFullDate(date: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  }).format(date);
}

export function getPastNDaysISO(count = 7): string[] {
  const result: string[] = [];
  const today = new Date();
  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    result.push(getISODateString(d));
  }
  return result;
}
