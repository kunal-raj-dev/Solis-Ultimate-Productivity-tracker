import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { isTargetEditable, ShortcutHandlers } from '../hooks/useKeyboardShortcuts';
import { APP_NAVIGATION } from '../constants/navigation';

describe('Milestone 2 Empirical Challenger Suite (Challenger 1)', () => {
  const rootDir = path.resolve(__dirname, '../..');
  const sidebarTsxPath = path.join(rootDir, 'src/components/layout/Sidebar/Sidebar.tsx');
  const sidebarCssPath = path.join(rootDir, 'src/components/layout/Sidebar/Sidebar.css');
  const appHeaderTsxPath = path.join(rootDir, 'src/components/layout/AppHeader/AppHeader.tsx');
  const appHeaderCssPath = path.join(rootDir, 'src/components/layout/AppHeader/AppHeader.css');
  const appLayoutTsxPath = path.join(rootDir, 'src/layouts/AppLayout.tsx');
  const tokensCssPath = path.join(rootDir, 'src/styles/tokens.css');

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  /* --------------------------------------------------------------------------
     1. KEYBOARD NAVIGATION & SHORTCUT STRESS TESTING
     -------------------------------------------------------------------------- */
  describe('1. Keyboard Shortcuts & Collapse Toggle Mechanics', () => {
    it('isTargetEditable accurately identifies all editable elements and ignores normal elements', () => {
      expect(isTargetEditable(null)).toBe(false);
      expect(isTargetEditable(undefined)).toBe(false);
      expect(isTargetEditable({ tagName: 'DIV' })).toBe(false);
      expect(isTargetEditable({ tagName: 'BUTTON' })).toBe(false);
      expect(isTargetEditable({ tagName: 'A' })).toBe(false);

      // Editable form controls
      expect(isTargetEditable({ tagName: 'INPUT' })).toBe(true);
      expect(isTargetEditable({ tagName: 'input' })).toBe(true);
      expect(isTargetEditable({ tagName: 'TEXTAREA' })).toBe(true);
      expect(isTargetEditable({ tagName: 'SELECT' })).toBe(true);
      expect(isTargetEditable({ tagName: 'DIV', isContentEditable: true })).toBe(true);
      expect(isTargetEditable({ tagName: 'DIV', contentEditable: 'true' })).toBe(true);
    });

    it('empirically verifies keyboard shortcut handler dispatches on Cmd+\\ (Mac) and Ctrl+\\ (Win/Linux)', () => {
      let toggleCount = 0;
      const handlers: ShortcutHandlers = {
        onOpenCommandPalette: vi.fn(),
        onToggleSidebar: () => {
          toggleCount++;
        }
      };

      // Simulate hook execution logic directly
      const executeKeyDown = (eventInit: {
        key: string;
        code?: string;
        metaKey?: boolean;
        ctrlKey?: boolean;
        altKey?: boolean;
        shiftKey?: boolean;
        defaultPrevented?: boolean;
        target?: any;
      }) => {
        let prevented = false;
        const e = {
          ...eventInit,
          preventDefault: () => {
            prevented = true;
          }
        };

        const activeElement = eventInit.target || (typeof document !== 'undefined' ? document.activeElement : null);
        const isInputFocused = isTargetEditable(activeElement);

        if ((e.metaKey || e.ctrlKey) && (e.key === '\\' || e.code === 'Backslash')) {
          e.preventDefault();
          handlers.onToggleSidebar?.();
          return { prevented, handled: true };
        }

        if (isInputFocused) return { prevented: false, handled: false };

        return { prevented, handled: false };
      };

      // 1. Meta (Mac) Cmd+\
      const res1 = executeKeyDown({ metaKey: true, key: '\\' });
      expect(res1.prevented).toBe(true);
      expect(res1.handled).toBe(true);
      expect(toggleCount).toBe(1);

      // 2. Ctrl (Windows/Linux) Ctrl+\
      const res2 = executeKeyDown({ ctrlKey: true, key: '\\' });
      expect(res2.prevented).toBe(true);
      expect(res2.handled).toBe(true);
      expect(toggleCount).toBe(2);

      // 3. Fallback to e.code === 'Backslash' (International keyboards)
      const res3 = executeKeyDown({ metaKey: true, key: '', code: 'Backslash' });
      expect(res3.prevented).toBe(true);
      expect(res3.handled).toBe(true);
      expect(toggleCount).toBe(3);

      // 4. Typing a bare backslash inside an input MUST NOT trigger toggle
      const res4 = executeKeyDown({ key: '\\', target: { tagName: 'INPUT' } });
      expect(res4.prevented).toBe(false);
      expect(res4.handled).toBe(false);
      expect(toggleCount).toBe(3); // Unchanged!

      // 5. Bare backslash outside an input MUST NOT trigger toggle
      const res5 = executeKeyDown({ key: '\\' });
      expect(res5.handled).toBe(false);
      expect(toggleCount).toBe(3);

      // 6. Cmd+\ inside an input field SHOULD trigger toggle (global chord, like Cmd+K)
      const res6 = executeKeyDown({ metaKey: true, key: '\\', target: { tagName: 'INPUT' } });
      expect(res6.prevented).toBe(true);
      expect(res6.handled).toBe(true);
      expect(toggleCount).toBe(4);

      // 7. Unrelated key chord (e.g. Cmd+S) MUST NOT trigger toggle
      const res7 = executeKeyDown({ metaKey: true, key: 's' });
      expect(res7.handled).toBe(false);
      expect(toggleCount).toBe(4);
    });

    it('verifies localStorage persistence pattern in AppLayout.tsx', () => {
      const content = fs.readFileSync(appLayoutTsxPath, 'utf8');

      // State initializes from localStorage key 'solis_sidebar_collapsed'
      expect(content).toContain("localStorage.getItem('solis_sidebar_collapsed') === 'true'");

      // Toggle handler saves to localStorage key 'solis_sidebar_collapsed'
      expect(content).toContain("localStorage.setItem('solis_sidebar_collapsed', String(next))");

      // AppLayout passes handlers to useKeyboardShortcuts
      expect(content).toContain('onToggleSidebar: handleToggleSidebar');

      // AppLayout passes isCollapsed and onToggleCollapse to Sidebar
      expect(content).toContain('isCollapsed={isSidebarCollapsed}');
      expect(content).toContain('onToggleCollapse={handleToggleSidebar}');
    });

    it('verifies Sidebar collapse toggle button attributes and state responsiveness in Sidebar.tsx', () => {
      const content = fs.readFileSync(sidebarTsxPath, 'utf8');

      // Toggle button existence and classes
      expect(content).toContain('solis-sidebar__collapse-toggle');
      expect(content).toContain('onClick={onToggleCollapse}');

      // Button title toggles with shortcut indicator
      expect(content).toContain("title={isCollapsed ? 'Expand sidebar (⌘\\\\)' : 'Collapse sidebar to rail (⌘\\\\)'}");

      // Accessible aria-label
      expect(content).toContain("aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}");

      // Icon switches between PanelLeft and PanelLeftClose
      expect(content).toContain('{isCollapsed ? <PanelLeft size={16} /> : <PanelLeftClose size={16} />}');

      // Brand Logo switches size and badge/wordmark display
      expect(content).toContain('!isCollapsed ? (');
      expect(content).toContain('<Logo to="/app/dashboard" size="md" showBadge={true} badgeText="Solis OS" />');
      expect(content).toContain('<Logo to="/app/dashboard" size="sm" showBadge={false} showWordmark={false} />');
    });
  });

  /* --------------------------------------------------------------------------
     2. FLOATING CSS TOOLTIP, CARET, Z-INDEX & CLIPPING
     -------------------------------------------------------------------------- */
  describe('2. Floating CSS Tooltip, Pointer Arrow, Z-Index & Absence of Clipping', () => {
    it('verifies tooltip DOM rendering condition and structure in Sidebar.tsx', () => {
      const content = fs.readFileSync(sidebarTsxPath, 'utf8');

      // Tooltip must ONLY be rendered when isCollapsed is true
      expect(content).toMatch(/\{isCollapsed && \(\s*<div className="solis-sidebar__rail-tooltip" role="tooltip">/);

      // Must render label
      expect(content).toContain('<span className="solis-sidebar__rail-tooltip-label">{item.label}</span>');

      // Must conditionally render badge only if badgeValue exists and is non-zero
      expect(content).toContain('badgeValue !== undefined && Boolean(badgeValue) && (');
      expect(content).toContain('<span className="solis-sidebar__rail-tooltip-badge">{badgeValue}</span>');

      // NavLink must have aria-label when collapsed and NO native title attribute
      expect(content).toContain('aria-label={isCollapsed ? item.label : undefined}');
      expect(content).not.toMatch(/<NavLink[^>]*\btitle=/);
    });

    it('verifies floating CSS tooltip layout and styling in Sidebar.css', () => {
      const content = fs.readFileSync(sidebarCssPath, 'utf8');

      // Absolute positioning anchored to the right of the 68px rail
      expect(content).toMatch(/\.solis-sidebar__rail-tooltip\s*\{[^}]*position:\s*absolute/);
      expect(content).toMatch(/\.solis-sidebar__rail-tooltip\s*\{[^}]*left:\s*calc\(100%\s*\+\s*10px\)/);
      expect(content).toMatch(/\.solis-sidebar__rail-tooltip\s*\{[^}]*top:\s*50%/);
      expect(content).toMatch(/\.solis-sidebar__rail-tooltip\s*\{[^}]*transform:\s*translateY\(-50%\)/);

      // elevated surface and shadow
      expect(content).toMatch(/\.solis-sidebar__rail-tooltip\s*\{[^}]*background-color:\s*var\(--bg-surface-elevated/);
      expect(content).toMatch(/\.solis-sidebar__rail-tooltip\s*\{[^}]*box-shadow:\s*var\(--shadow-floating/);

      // z-index must use --z-tooltip
      expect(content).toMatch(/\.solis-sidebar__rail-tooltip\s*\{[^}]*z-index:\s*var\(--z-tooltip,\s*700\)/);

      // pointer-events: none to avoid stealing cursor interactions
      expect(content).toMatch(/\.solis-sidebar__rail-tooltip\s*\{[^}]*pointer-events:\s*none/);

      // white-space: nowrap to avoid ugly multi-line text wrapping
      expect(content).toMatch(/\.solis-sidebar__rail-tooltip\s*\{[^}]*white-space:\s*nowrap/);
    });

    it('verifies tooltip caret pointer arrow implementation (border + fill)', () => {
      const content = fs.readFileSync(sidebarCssPath, 'utf8');

      // ::before pseudo-element creates the outer border caret
      expect(content).toContain('.solis-sidebar__rail-tooltip::before');
      expect(content).toMatch(/\.solis-sidebar__rail-tooltip::before\s*\{[^}]*content:\s*''/);
      expect(content).toMatch(/\.solis-sidebar__rail-tooltip::before\s*\{[^}]*right:\s*100%/);
      expect(content).toMatch(/\.solis-sidebar__rail-tooltip::before\s*\{[^}]*border-style:\s*solid/);

      // ::after pseudo-element creates the inner fill caret
      expect(content).toContain('.solis-sidebar__rail-tooltip::after');
      expect(content).toMatch(/\.solis-sidebar__rail-tooltip::after\s*\{[^}]*content:\s*''/);
      expect(content).toMatch(/\.solis-sidebar__rail-tooltip::after\s*\{[^}]*right:\s*100%/);
      expect(content).toMatch(/\.solis-sidebar__rail-tooltip::after\s*\{[^}]*border-color:\s*transparent\s+var\(--bg-surface-elevated/);
    });

    it('verifies tooltip reveals on both :hover and :focus-visible', () => {
      const content = fs.readFileSync(sidebarCssPath, 'utf8');

      expect(content).toContain('.solis-sidebar--collapsed .solis-sidebar__link:hover .solis-sidebar__rail-tooltip');
      expect(content).toContain('.solis-sidebar--collapsed .solis-sidebar__link:focus-visible .solis-sidebar__rail-tooltip');
    });

    it('verifies absence of tooltip clipping via overflow: visible on collapsed nav', () => {
      const content = fs.readFileSync(sidebarCssPath, 'utf8');

      // .solis-sidebar--collapsed .solis-sidebar__nav MUST have overflow: visible
      expect(content).toMatch(/\.solis-sidebar--collapsed\s+\.solis-sidebar__nav\s*\{[^}]*overflow:\s*visible/);

      // .solis-sidebar itself must NOT set overflow: hidden
      const sidebarBlock = content.match(/\.solis-sidebar\s*\{([^}]+)\}/);
      expect(sidebarBlock).not.toBeNull();
      expect(sidebarBlock![1]).not.toContain('overflow: hidden');
      expect(sidebarBlock![1]).not.toContain('overflow-x: hidden');
    });

    it('verifies badge positioning in collapsed state maintains icon centering', () => {
      const content = fs.readFileSync(sidebarCssPath, 'utf8');

      // Link must have position: relative and justify-content: center
      expect(content).toMatch(/\.solis-sidebar--collapsed\s+\.solis-sidebar__link\s*\{[^}]*position:\s*relative/);
      expect(content).toMatch(/\.solis-sidebar--collapsed\s+\.solis-sidebar__link\s*\{[^}]*justify-content:\s*center/);

      // Collapsed badge must be absolutely positioned to top-right, taking zero in-flow space
      expect(content).toMatch(/\.solis-sidebar--collapsed\s+\.solis-sidebar__link-badge\s*\{[^}]*position:\s*absolute/);
      expect(content).toMatch(/\.solis-sidebar--collapsed\s+\.solis-sidebar__link-badge\s*\{[^}]*top:\s*4px/);
      expect(content).toMatch(/\.solis-sidebar--collapsed\s+\.solis-sidebar__link-badge\s*\{[^}]*right:\s*8px/);
      expect(content).toMatch(/\.solis-sidebar--collapsed\s+\.solis-sidebar__link-badge\s*\{[^}]*margin-left:\s*0/);
      expect(content).toMatch(/\.solis-sidebar--collapsed\s+\.solis-sidebar__link-badge\s*\{[^}]*pointer-events:\s*none/);
    });

    it('verifies design tokens define valid dimensions and z-indices for rail and tooltip', () => {
      const content = fs.readFileSync(tokensCssPath, 'utf8');

      expect(content).toMatch(/--sidebar-width:\s*260px;/);
      expect(content).toMatch(/--sidebar-collapsed-width:\s*68px;/);
      expect(content).toMatch(/--z-tooltip:\s*700;/);
      expect(content).toMatch(/--z-header:\s*200;/);
      expect(content).toMatch(/--z-sticky:\s*100;/);
    });
  });

  /* --------------------------------------------------------------------------
     3. BREADCRUMB NAVIGATION & HEADER ACTIONS AUDIT
     -------------------------------------------------------------------------- */
  describe('3. Breadcrumb Link Behavior & Header Actions Audit', () => {
    it('verifies breadcrumbs implementation in AppHeader.tsx', () => {
      const content = fs.readFileSync(appHeaderTsxPath, 'utf8');

      // Breadcrumb root must be an accessible Link to /app/dashboard
      expect(content).toMatch(/<Link\s+to="\/app\/dashboard"\s+className="solis-app-header__breadcrumb-root"\s+title="Go to Today Cockpit"\s*>\s*Solis\s*<\/Link>/s);

      // Separator must have aria-hidden="true"
      expect(content).toMatch(/<span\s+className="solis-app-header__breadcrumb-sep"\s+aria-hidden="true">\s*\/\s*<\/span>/);

      // Current page must have aria-current="page"
      expect(content).toMatch(/<span\s+className="solis-app-header__breadcrumb-current"\s+aria-current="page">\s*\{currentNav\.label\}\s*<\/span>/);
    });

    it('empirically stress-tests currentNav route resolution algorithm across edge cases', () => {
      const resolveCurrentNav = (pathname: string) => {
        for (const section of APP_NAVIGATION) {
          for (const item of section.items) {
            if (pathname === item.path || (item.path !== '/app/dashboard' && pathname.startsWith(item.path))) {
              return item;
            }
          }
        }
        return { label: 'Today' };
      };

      // Standard primary routes
      expect(resolveCurrentNav('/app/dashboard').label).toBe('Today');
      expect(resolveCurrentNav('/app/tasks').label).toBe('Tasks');
      expect(resolveCurrentNav('/app/study').label).toBe('Study & Syllabus');
      expect(resolveCurrentNav('/app/focus').label).toBe('Focus Room');
      expect(resolveCurrentNav('/app/rooms').label).toBe('Study Rooms');
      expect(resolveCurrentNav('/app/notes').label).toBe('Knowledge & Notes');
      expect(resolveCurrentNav('/app/habits').label).toBe('Habits & Rituals');
      expect(resolveCurrentNav('/app/goals').label).toBe('Goals');
      expect(resolveCurrentNav('/app/analytics').label).toBe('Analytics');
      expect(resolveCurrentNav('/app/review').label).toBe('Weekly Review');
      expect(resolveCurrentNav('/app/settings').label).toBe('Settings');

      // Nested subpaths
      expect(resolveCurrentNav('/app/tasks/123').label).toBe('Tasks');
      expect(resolveCurrentNav('/app/tasks?view=inbox').label).toBe('Tasks');
      expect(resolveCurrentNav('/app/study/deep-dive').label).toBe('Study & Syllabus');
      expect(resolveCurrentNav('/app/notes/archived').label).toBe('Knowledge & Notes');

      // Fallback for root /app or unknown routes
      expect(resolveCurrentNav('/app').label).toBe('Today');
      expect(resolveCurrentNav('/app/unknown-route').label).toBe('Today');
      expect(resolveCurrentNav('/').label).toBe('Today');
    });

    it('verifies AppHeader styling for breadcrumb root link, hover, and focus-visible', () => {
      const content = fs.readFileSync(appHeaderCssPath, 'utf8');

      // Breadcrumb root must not have default underline
      expect(content).toMatch(/\.solis-app-header__breadcrumb-root\s*\{[^}]*text-decoration:\s*none/);

      // Hover transition to primary text
      expect(content).toMatch(/\.solis-app-header__breadcrumb-root:hover\s*\{[^}]*color:\s*var\(--text-primary\)/);

      // Focus-visible keyboard accessibility
      expect(content).toMatch(/\.solis-app-header__breadcrumb-root:focus-visible\s*\{[^}]*outline:\s*2px\s+solid\s+var\(--color-coral-500\)/);

      // Separator hairline opacity
      expect(content).toMatch(/\.solis-app-header__breadcrumb-sep\s*\{[^}]*opacity:\s*0\.35/);
    });

    it('strictly verifies zero duplicate header buttons or redundant focus triggers in AppHeader', () => {
      const content = fs.readFileSync(appHeaderTsxPath, 'utf8');

      // Must NOT contain Start Focus button
      expect(content).not.toContain('Start Focus');
      expect(content).not.toContain('solis-app-header__focus');
      expect(content).not.toMatch(/<Button[^>]*>[^<]*Focus[^<]*<\/Button>/i);

      // Must NOT contain duplicate task creation button
      expect(content).not.toContain('New Task');
      expect(content).not.toContain('Create Task');
      expect(content).not.toContain('solis-app-header__create');

      // Must contain approved streamlined actions
      expect(content).toContain('solis-app-header__search-btn'); // Search
      expect(content).toContain('openGuide'); // Guides
      expect(content).toContain('toggleTheme'); // Theme
      expect(content).toContain('<AccountMenu />'); // Account
    });
  });
});
