import { describe, it, expect } from 'vitest';
import {
  APP_NAVIGATION,
  MOBILE_NAVIGATION,
  MARKETING_NAVIGATION,
  isFocusRoute,
  isAuthRoute,
  isMarketingRoute
} from '../constants/navigation';

describe('Global Navigation & Route Intelligence Architecture', () => {
  it('defines the approved core navigation groups with zero omissions', () => {
    const sectionIds = APP_NAVIGATION.map((s) => s.id);
    expect(sectionIds).toContain('today');
    expect(sectionIds).toContain('knowledge');
    expect(sectionIds).toContain('horizons');
    expect(sectionIds).toContain('system');
  });

  it('contains all required destinations in Today group', () => {
    const todaySection = APP_NAVIGATION.find((s) => s.id === 'today');
    expect(todaySection).toBeDefined();
    const itemIds = todaySection?.items.map((i) => i.id);
    expect(itemIds).toEqual(['dashboard', 'tasks', 'study', 'focus']);
  });

  it('correctly maps mobile navigation to primary destinations', () => {
    const mobileIds = MOBILE_NAVIGATION.map((m) => m.id);
    expect(mobileIds).toEqual(['dashboard', 'tasks', 'study', 'focus', 'notes']);
  });

  it('correctly identifies Focus sanctuary routes for chrome isolation', () => {
    expect(isFocusRoute('/app/focus')).toBe(true);
    expect(isFocusRoute('/app/focus/custom')).toBe(true);
    expect(isFocusRoute('/app/dashboard')).toBe(false);
    expect(isFocusRoute('/app/study')).toBe(false);
    expect(isFocusRoute('/app/notes')).toBe(false);
  });

  it('correctly identifies Auth and Marketing routes', () => {
    expect(isAuthRoute('/auth/login')).toBe(true);
    expect(isAuthRoute('/auth/signup')).toBe(true);
    expect(isAuthRoute('/app/dashboard')).toBe(false);

    expect(isMarketingRoute('/')).toBe(true);
    expect(isMarketingRoute('/#experience')).toBe(true);
    expect(isMarketingRoute('/app/dashboard')).toBe(false);
  });

  it('contains marketing anchors for the landing page', () => {
    const labels = MARKETING_NAVIGATION.map((m) => m.label);
    expect(labels).toContain('Philosophy');
    expect(labels).toContain('Experience');
    expect(labels).toContain('Sanctuary');
    expect(labels).toContain('Manifesto');
  });
});
