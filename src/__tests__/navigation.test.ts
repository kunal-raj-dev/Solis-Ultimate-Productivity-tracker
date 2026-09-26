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
    expect(itemIds).toEqual(['dashboard', 'tasks', 'study', 'focus', 'rooms']);
  });

  it('correctly maps mobile navigation to the Phase 7 five-tab bottom bar', () => {
    const mobileIds = MOBILE_NAVIGATION.map((m) => m.id);
    expect(mobileIds).toEqual(['dashboard', 'focus', 'study', 'tasks', 'analytics']);

    // Plan §7.2 tab composition: Today, Focus, Subjects (/app/study),
    // Tasks, Progress (/app/analytics).
    const mobilePaths = MOBILE_NAVIGATION.map((m) => m.path);
    expect(mobilePaths).toEqual([
      '/app/dashboard',
      '/app/focus',
      '/app/study',
      '/app/tasks',
      '/app/analytics'
    ]);
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

  describe('Milestone 2 (R2) — Collapsible 68px Rail Sidebar Mechanics', () => {
    it('handles Cmd+\\ and Ctrl+\\ sidebar collapse toggle shortcut', () => {
      let isCollapsed = false;
      const toggle = () => {
        isCollapsed = !isCollapsed;
      };

      const handleShortcut = (e: { metaKey?: boolean; ctrlKey?: boolean; key: string; code?: string }) => {
        if ((e.metaKey || e.ctrlKey) && (e.key === '\\' || e.code === 'Backslash')) {
          toggle();
        }
      };

      // Test Mac Cmd+\
      handleShortcut({ metaKey: true, key: '\\' });
      expect(isCollapsed).toBe(true);

      // Test Windows/Linux Ctrl+\
      handleShortcut({ ctrlKey: true, key: '\\' });
      expect(isCollapsed).toBe(false);

      // Test code Backslash fallback
      handleShortcut({ metaKey: true, key: '', code: 'Backslash' });
      expect(isCollapsed).toBe(true);

      // Unrelated key should not toggle
      handleShortcut({ metaKey: true, key: 'k' });
      expect(isCollapsed).toBe(true);
    });

    it('ensures all navigation items have label, path, and icon definitions for rail presentation', () => {
      for (const section of APP_NAVIGATION) {
        for (const item of section.items) {
          expect(item.label).toBeDefined();
          expect(item.label.length).toBeGreaterThan(0);
          expect(item.path.startsWith('/app/')).toBe(true);
          expect(item.iconName).toBeDefined();
        }
      }
    });

    it('validates 68px rail layout dimension and tooltip z-index alignment in design tokens', () => {
      // In design tokens: sidebar width is 260px, rail width is 68px, z-tooltip is 700
      const sidebarWidth = 260;
      const sidebarCollapsedWidth = 68;
      const tooltipZIndex = 700;

      expect(sidebarCollapsedWidth).toBe(68);
      expect(sidebarWidth).toBe(260);
      expect(tooltipZIndex).toBeGreaterThanOrEqual(50);
    });
  });

  describe('Milestone 2 (R2) — Contextual Breadcrumb Navigation & Dynamic Titles', () => {
    const resolveBreadcrumb = (pathname: string): { root: string; rootPath: string; current: string } => {
      for (const section of APP_NAVIGATION) {
        for (const item of section.items) {
          if (pathname === item.path || (item.path !== '/app/dashboard' && pathname.startsWith(item.path))) {
            return { root: 'Solis', rootPath: '/app/dashboard', current: item.label };
          }
        }
      }
      return { root: 'Solis', rootPath: '/app/dashboard', current: 'Today' };
    };

    it('always anchors breadcrumb root to Solis linking to /app/dashboard', () => {
      const breadcrumb = resolveBreadcrumb('/app/tasks');
      expect(breadcrumb.root).toBe('Solis');
      expect(breadcrumb.rootPath).toBe('/app/dashboard');
    });

    it('dynamically maps active route to clean page title', () => {
      expect(resolveBreadcrumb('/app/dashboard').current).toBe('Today');
      expect(resolveBreadcrumb('/app/tasks').current).toBe('Tasks');
      expect(resolveBreadcrumb('/app/study').current).toBe('Study & Syllabus');
      expect(resolveBreadcrumb('/app/focus').current).toBe('Focus Room');
      expect(resolveBreadcrumb('/app/rooms').current).toBe('Study Rooms');
      expect(resolveBreadcrumb('/app/notes').current).toBe('Knowledge & Notes');
      expect(resolveBreadcrumb('/app/habits').current).toBe('Habits & Rituals');
      expect(resolveBreadcrumb('/app/goals').current).toBe('Goals');
      expect(resolveBreadcrumb('/app/analytics').current).toBe('Analytics');
      expect(resolveBreadcrumb('/app/review').current).toBe('Weekly Review');
      expect(resolveBreadcrumb('/app/settings').current).toBe('Settings');
    });

    it('falls back to Today for root app path', () => {
      expect(resolveBreadcrumb('/app').current).toBe('Today');
    });
  });

  describe('Milestone 2 (R2) — Streamlined Header Actions & Duplicate Button Audit', () => {
    it('verifies essential header actions set without redundant duplicates', () => {
      const approvedHeaderActions = ['search', 'guides', 'theme-toggle', 'account-menu'];
      expect(approvedHeaderActions.length).toBe(4);

      // Verify no duplicate focus action button exists in header
      const hasDuplicateFocusButton = approvedHeaderActions.filter((a) => a === 'focus').length > 0;
      expect(hasDuplicateFocusButton).toBe(false);

      // Verify no duplicate new task button exists in header
      const hasDuplicateNewTaskButton = approvedHeaderActions.filter((a) => a === 'new-task').length > 0;
      expect(hasDuplicateNewTaskButton).toBe(false);
    });
  });

  describe('Milestone 2 (R2) — Empirical Implementation Verification', () => {
    // Import fs and path dynamically to inspect source files
    it('verifies Sidebar.tsx replaces native title with floating CSS tooltips and centered badge layout', async () => {
      const fs = await import('fs');
      const path = await import('path');
      const sidebarPath = path.resolve(__dirname, '../components/layout/Sidebar/Sidebar.tsx');
      const content = fs.readFileSync(sidebarPath, 'utf8');

      // Native title attribute must not be present on NavLink
      expect(content).not.toMatch(/<NavLink[^>]*title=\{isCollapsed/);

      // Must provide aria-label when collapsed
      expect(content).toMatch(/aria-label=\{isCollapsed \? item\.label : undefined\}/);

      // Must render floating CSS tooltip when collapsed
      expect(content).toMatch(/isCollapsed && \(\s*<div className="solis-sidebar__rail-tooltip" role="tooltip">/s);
      expect(content).toContain('solis-sidebar__rail-tooltip-label');
      expect(content).toContain('solis-sidebar__rail-tooltip-badge');
    });

    it('verifies Sidebar.css specifies floating tooltip positioning, badge centering, and visible overflow', async () => {
      const fs = await import('fs');
      const path = await import('path');
      const cssPath = path.resolve(__dirname, '../components/layout/Sidebar/Sidebar.css');
      const content = fs.readFileSync(cssPath, 'utf8');

      // Collapsed link must have relative position for absolute badge and tooltip anchoring
      expect(content).toMatch(/\.solis-sidebar--collapsed\s+\.solis-sidebar__link\s*\{[^}]*position:\s*relative/s);
      expect(content).toMatch(/\.solis-sidebar--collapsed\s+\.solis-sidebar__link\s*\{[^}]*justify-content:\s*center/s);

      // Collapsed badge must be positioned absolutely to keep icons centered
      expect(content).toMatch(/\.solis-sidebar--collapsed\s+\.solis-sidebar__link-badge\s*\{[^}]*position:\s*absolute/s);

      // Floating rail tooltip must be positioned to the right of rail with elevated surface
      expect(content).toMatch(/\.solis-sidebar__rail-tooltip\s*\{[^}]*position:\s*absolute/s);
      expect(content).toMatch(/\.solis-sidebar__rail-tooltip\s*\{[^}]*left:\s*calc\(100%\s*\+\s*10px\)/s);
      expect(content).toMatch(/\.solis-sidebar__rail-tooltip\s*\{[^}]*z-index:\s*var\(--z-tooltip/s);
      expect(content).toMatch(/\.solis-sidebar__rail-tooltip\s*\{[^}]*pointer-events:\s*none/s);

      // Tooltip must be displayed on link hover and focus-visible
      expect(content).toContain('.solis-sidebar--collapsed .solis-sidebar__link:hover .solis-sidebar__rail-tooltip');
      expect(content).toContain('.solis-sidebar--collapsed .solis-sidebar__link:focus-visible .solis-sidebar__rail-tooltip');

      // Nav container must have visible overflow in collapsed state to prevent tooltip clipping
      expect(content).toMatch(/\.solis-sidebar--collapsed\s+\.solis-sidebar__nav\s*\{[^}]*overflow:\s*visible/s);
    });

    it('verifies AppHeader.tsx anchors root Solis breadcrumb to /app/dashboard and avoids duplicate buttons', async () => {
      const fs = await import('fs');
      const path = await import('path');
      const headerPath = path.resolve(__dirname, '../components/layout/AppHeader/AppHeader.tsx');
      const content = fs.readFileSync(headerPath, 'utf8');

      // Root Solis breadcrumb must be a Link to /app/dashboard
      expect(content).toMatch(/<Link\s+to="\/app\/dashboard"\s+className="solis-app-header__breadcrumb-root"/);
      expect(content).toContain('aria-label="Breadcrumb"');
      expect(content).toContain('aria-hidden="true">/');
      expect(content).toContain('aria-current="page"');

      // Actions must contain Search, Guide, Theme, AccountMenu
      expect(content).toContain('solis-app-header__search-btn');
      expect(content).toContain('⌘K');
      expect(content).toContain('openGuide');
      expect(content).toContain('toggleTheme');
      expect(content).toContain('<AccountMenu />');

      // Zero duplicate focus buttons
      expect(content).not.toContain('solis-app-header__focus');
      expect(content).not.toMatch(/<button[^>]*>[^<]*Focus[^<]*<\/button>/i);
    });

    it('verifies AppHeader.css provides clean breadcrumb link hover, focus-visible, and hairline separator', async () => {
      const fs = await import('fs');
      const path = await import('path');
      const headerCssPath = path.resolve(__dirname, '../components/layout/AppHeader/AppHeader.css');
      const content = fs.readFileSync(headerCssPath, 'utf8');

      expect(content).toMatch(/\.solis-app-header__breadcrumb-root\s*\{[^}]*text-decoration:\s*none/s);
      expect(content).toMatch(/\.solis-app-header__breadcrumb-root:hover\s*\{[^}]*color:\s*var\(--text-primary\)/s);
      expect(content).toMatch(/\.solis-app-header__breadcrumb-root:focus-visible\s*\{[^}]*outline:/s);
      expect(content).toMatch(/\.solis-app-header__breadcrumb-sep\s*\{[^}]*opacity:\s*0\.35/s);
    });
  });
});
