import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

describe('Milestone 1 Empirical Stress Test Suite (Challenger 1)', () => {
  const rootDir = path.resolve(__dirname, '../..');
  const indexHtmlPath = path.join(rootDir, 'index.html');
  const tokensCssPath = path.join(rootDir, 'src/styles/tokens.css');
  const typographyCssPath = path.join(rootDir, 'src/styles/typography.css');
  const sectionHeaderCssPath = path.join(rootDir, 'src/components/layout/SectionHeader/SectionHeader.css');
  const cardCssPath = path.join(rootDir, 'src/components/ui/Card/Card.css');
  const themeContextPath = path.join(rootDir, 'src/context/ThemeContext.tsx');
  const atmosphericOrbPath = path.join(rootDir, 'src/components/parallax/AtmosphericOrb.tsx');
  const atmosphereCanvasPath = path.join(rootDir, 'src/components/layout/AtmosphereCanvas/AtmosphereCanvas.tsx');
  const atmosphereCanvasCssPath = path.join(rootDir, 'src/components/layout/AtmosphereCanvas/AtmosphereCanvas.css');

  describe('1. Theme Colors & Token Discipline', () => {
    it('declares #0E0C0B as Deep Obsidian night canvas ground in tokens.css', () => {
      const content = fs.readFileSync(tokensCssPath, 'utf8');
      expect(content).toMatch(/--color-charcoal-900:\s*#0E0C0B;/);
      // Dark mode canvas token
      expect(content).toMatch(/\[data-theme="dark"\],\s*\.dark\s*\{[^}]*--bg-canvas:\s*#0E0C0B;/s);
    });

    it('declares #FAF8F5 as Warm Ivory day canvas ground in tokens.css', () => {
      const content = fs.readFileSync(tokensCssPath, 'utf8');
      expect(content).toMatch(/--color-ivory-100:\s*#FAF8F5;/);
      expect(content).toMatch(/--bg-canvas:\s*#FAF8F5;/);
    });

    it('declares #E65A41 as core coral deliberate accent in tokens.css', () => {
      const content = fs.readFileSync(tokensCssPath, 'utf8');
      expect(content).toMatch(/--color-coral-500:\s*#E65A41;/);
    });

    it('enforces 0.06 hairline dividers in Day and Night modes', () => {
      const content = fs.readFileSync(tokensCssPath, 'utf8');
      // Day mode hairline
      expect(content).toMatch(/--border-hairline:\s*rgba\(26,\s*24,\s*22,\s*0\.06\);/);
      // Night mode hairline
      expect(content).toMatch(/--border-hairline:\s*rgba\(255,\s*255,\s*255,\s*0\.06\);/);
    });

    it('verifies static meta theme-color tag in index.html is #0E0C0B', () => {
      const html = fs.readFileSync(indexHtmlPath, 'utf8');
      expect(html).toMatch(/<meta\s+name="theme-color"\s+content="#0E0C0B"\s*\/>/);
    });

    it('verifies zero occurrences of old night canvas #141211 in index.html or ThemeContext.tsx', () => {
      const html = fs.readFileSync(indexHtmlPath, 'utf8');
      const themeCtx = fs.readFileSync(themeContextPath, 'utf8');
      expect(html).not.toContain('#141211');
      expect(themeCtx).not.toContain('#141211');
    });
  });

  describe('2. DOM Hydration & Theme Synchronization Stress Testing', () => {
    // Extract inline script from index.html
    const html = fs.readFileSync(indexHtmlPath, 'utf8');
    const scriptMatch = html.match(/<script>\s*(\(function\(\)[\s\S]*?\}\)\(\);)\s*<\/script>/);
    const inlineScriptCode = scriptMatch ? scriptMatch[1] : null;

    it('contains the inline zero-FOUC hydration script in index.html', () => {
      expect(inlineScriptCode).not.toBeNull();
    });

    // Test matrix of saved themes and system preferences
    const testCases: Array<{
      savedTheme: string | null;
      systemPrefersDark: boolean;
      expectedDark: boolean;
      expectedMeta: string;
    }> = [
      { savedTheme: 'dark', systemPrefersDark: false, expectedDark: true, expectedMeta: '#0E0C0B' },
      { savedTheme: 'dark', systemPrefersDark: true, expectedDark: true, expectedMeta: '#0E0C0B' },
      { savedTheme: 'light', systemPrefersDark: false, expectedDark: false, expectedMeta: '#FAF8F5' },
      { savedTheme: 'light', systemPrefersDark: true, expectedDark: false, expectedMeta: '#FAF8F5' },
      { savedTheme: 'system', systemPrefersDark: true, expectedDark: true, expectedMeta: '#0E0C0B' },
      { savedTheme: 'system', systemPrefersDark: false, expectedDark: false, expectedMeta: '#FAF8F5' },
      // Edge cases: null / missing / corrupted storage values
      { savedTheme: null, systemPrefersDark: false, expectedDark: true, expectedMeta: '#0E0C0B' },
      { savedTheme: null, systemPrefersDark: true, expectedDark: true, expectedMeta: '#0E0C0B' },
      { savedTheme: '', systemPrefersDark: false, expectedDark: true, expectedMeta: '#0E0C0B' },
      { savedTheme: 'invalid-string', systemPrefersDark: false, expectedDark: true, expectedMeta: '#0E0C0B' },
      { savedTheme: '{}', systemPrefersDark: false, expectedDark: true, expectedMeta: '#0E0C0B' },
    ];

    testCases.forEach(({ savedTheme, systemPrefersDark, expectedDark, expectedMeta }, index) => {
      it(`evaluates hydration script correctly for case #${index + 1}: saved="${savedTheme}", systemDark=${systemPrefersDark}`, () => {
        // Build mock DOM environment
        const classes = new Set<string>();
        const attributes: Record<string, string> = {};
        const metaAttrs: Record<string, string> = { name: 'theme-color', content: '#0E0C0B' };

        const mockRoot = {
          classList: {
            add: (c: string) => classes.add(c),
            remove: (c: string) => classes.delete(c),
            contains: (c: string) => classes.has(c)
          },
          setAttribute: (k: string, v: string) => { attributes[k] = v; },
          getAttribute: (k: string) => attributes[k] ?? null,
          style: { colorScheme: '' }
        };

        const mockMeta = {
          setAttribute: (k: string, v: string) => { metaAttrs[k] = v; },
          getAttribute: (k: string) => metaAttrs[k] ?? null
        };

        const mockDoc = {
          documentElement: mockRoot,
          querySelector: (sel: string) => (sel === 'meta[name="theme-color"]' ? mockMeta : null)
        };

        const mockLocal = {
          getItem: (k: string) => (k === 'solis-theme' ? savedTheme : null)
        };

        const mockWindow = {
          matchMedia: (query: string) => ({
            matches: query.includes('prefers-color-scheme: dark') ? systemPrefersDark : false
          })
        };

        // Execute hydration function with sandboxed context
        const runner = new Function(
          'document',
          'localStorage',
          'window',
          inlineScriptCode!
        );

        runner(mockDoc, mockLocal, mockWindow);

        if (expectedDark) {
          expect(mockRoot.classList.contains('dark')).toBe(true);
          expect(mockRoot.getAttribute('data-theme')).toBe('dark');
          expect(mockRoot.style.colorScheme).toBe('dark');
          expect(mockMeta.getAttribute('content')).toBe(expectedMeta);
        } else {
          expect(mockRoot.classList.contains('dark')).toBe(false);
          expect(mockRoot.getAttribute('data-theme')).toBe('light');
          expect(mockRoot.style.colorScheme).toBe('light');
          expect(mockMeta.getAttribute('content')).toBe(expectedMeta);
        }
      });
    });

    it('ensures hydration script gracefully catches exceptions if localStorage throws (e.g. SecurityError in iframe / private mode)', () => {
      const classes = new Set<string>();
      const attributes: Record<string, string> = {};
      const metaAttrs: Record<string, string> = { name: 'theme-color', content: '#0E0C0B' };

      const mockRoot = {
        classList: {
          add: (c: string) => classes.add(c),
          remove: (c: string) => classes.delete(c),
          contains: (c: string) => classes.has(c)
        },
        setAttribute: (k: string, v: string) => { attributes[k] = v; },
        getAttribute: (k: string) => attributes[k] ?? null,
        style: { colorScheme: '' }
      };

      const mockMeta = {
        setAttribute: (k: string, v: string) => { metaAttrs[k] = v; },
        getAttribute: (k: string) => metaAttrs[k] ?? null
      };

      const mockDoc = {
        documentElement: mockRoot,
        querySelector: () => mockMeta
      };

      const throwingLocal = {
        getItem: () => {
          throw new Error('SecurityError: localStorage access is denied');
        }
      };

      const runner = new Function(
        'document',
        'localStorage',
        'window',
        inlineScriptCode!
      );

      // Should not throw
      expect(() => runner(mockDoc, throwingLocal, {})).not.toThrow();
    });
  });

  describe('3. Anti-AI-Slop: Gradient Blobs & Neon Glow Removal', () => {
    it('AtmosphericOrb component renders null (deactivated)', () => {
      const content = fs.readFileSync(atmosphericOrbPath, 'utf8');
      expect(content).toMatch(/return null;/);
    });

    it('AtmosphereCanvas.tsx renders clean canvas without orb elements', () => {
      const tsxContent = fs.readFileSync(atmosphereCanvasPath, 'utf8');
      expect(tsxContent).not.toContain('solis-atmosphere-orb');
    });

    it('AtmosphereCanvas.css contains no floating blurred orb definitions', () => {
      const cssContent = fs.readFileSync(atmosphereCanvasCssPath, 'utf8');
      expect(cssContent).not.toContain('.solis-atmosphere-orb');
      expect(cssContent).not.toContain('filter: blur');
    });

    it('verifies timeline active bullet in TasksPage.css has no neon box-shadow', () => {
      const cssContent = fs.readFileSync(path.join(rootDir, 'src/features/tasks/TasksPage.css'), 'utf8');
      // Match .solis-timeline-bullet--active definition
      const match = cssContent.match(/\.solis-timeline-bullet--active\s*\{([^}]+)\}/);
      expect(match).not.toBeNull();
      const body = match![1];
      expect(body).not.toContain('box-shadow');
      expect(body).not.toContain('filter');
    });

    it('verifies task urgent priority indicator has no neon box-shadow', () => {
      const cssContent = fs.readFileSync(path.join(rootDir, 'src/features/tasks/components/TaskRow.css'), 'utf8');
      const match = cssContent.match(/\.solis-task-priority-indicator--urgent\s*\{([^}]+)\}/);
      expect(match).not.toBeNull();
      const body = match![1];
      expect(body).not.toContain('box-shadow');
    });

    it('verifies room presence indicators have no neon box-shadow', () => {
      const cssContent = fs.readFileSync(path.join(rootDir, 'src/features/rooms/ActiveRoomView.css'), 'utf8');
      const matchFocus = cssContent.match(/\.solis-presence-dot--focusing\s*\{([^}]+)\}/);
      expect(matchFocus).not.toBeNull();
      expect(matchFocus![1]).not.toContain('box-shadow');

      const matchBreak = cssContent.match(/\.solis-presence-dot--break\s*\{([^}]+)\}/);
      expect(matchBreak).not.toBeNull();
      expect(matchBreak![1]).not.toContain('box-shadow');
    });
  });

  describe('4. Operational Typography & Sans-Serif Invariants', () => {
    it('enforces Plus Jakarta Sans (var(--font-interface)) and tight tracking on SectionHeader title', () => {
      const content = fs.readFileSync(sectionHeaderCssPath, 'utf8');
      const match = content.match(/\.solis-section-header__title\s*\{([^}]+)\}/);
      expect(match).not.toBeNull();
      const body = match![1];
      expect(body).toMatch(/font-family:\s*var\(--font-interface\);/);
      expect(body).toMatch(/letter-spacing:\s*var\(--tracking-tight\);/);
      expect(body).not.toContain('--font-display');
    });

    it('enforces Plus Jakarta Sans (var(--font-interface)) and tight tracking on Card title', () => {
      const content = fs.readFileSync(cardCssPath, 'utf8');
      const match = content.match(/\.solis-card-title\s*\{([^}]+)\}/);
      expect(match).not.toBeNull();
      const body = match![1];
      expect(body).toMatch(/font-family:\s*var\(--font-interface\);/);
      expect(body).toMatch(/letter-spacing:\s*var\(--tracking-tight\);/);
      expect(body).not.toContain('--font-display');
    });

    it('declares tight negative tracking (-0.025em) in typography.css', () => {
      const content = fs.readFileSync(typographyCssPath, 'utf8');
      expect(content).toMatch(/--tracking-tight:\s*-0\.025em;/);
      expect(content).toMatch(/--tracking-operational:\s*-0\.025em;/);
    });

    it('operational headings in typography.css use var(--font-interface) with tight tracking', () => {
      const content = fs.readFileSync(typographyCssPath, 'utf8');
      const opHeadingMatch = content.match(/\.text-heading-op\s*\{([^}]+)\}/);
      expect(opHeadingMatch).not.toBeNull();
      expect(opHeadingMatch![1]).toMatch(/font-family:\s*var\(--font-interface\);/);
      expect(opHeadingMatch![1]).toMatch(/letter-spacing:\s*var\(--tracking-tight\);/);

      const h2Match = content.match(/\.text-heading-2\s*\{([^}]+)\}/);
      expect(h2Match).not.toBeNull();
      expect(h2Match![1]).toMatch(/font-family:\s*var\(--font-interface\);/);
      expect(h2Match![1]).toMatch(/letter-spacing:\s*var\(--tracking-tight\);/);

      const h3Match = content.match(/\.text-heading-3\s*\{([^}]+)\}/);
      expect(h3Match).not.toBeNull();
      expect(h3Match![1]).toMatch(/font-family:\s*var\(--font-interface\);/);
      expect(h3Match![1]).toMatch(/letter-spacing:\s*var\(--tracking-tight\);/);
    });

    it('enforces tabular-nums on .text-metric utility', () => {
      const content = fs.readFileSync(typographyCssPath, 'utf8');
      const match = content.match(/\.text-metric\s*\{([^}]+)\}/);
      expect(match).not.toBeNull();
      const body = match![1];
      expect(body).toMatch(/font-variant-numeric:\s*tabular-nums;/);
      expect(body).toMatch(/font-feature-settings:\s*'tnum'\s*1;/);
    });

    it('enforces tabular-nums on TimeBlockGrid stats value', () => {
      const content = fs.readFileSync(path.join(rootDir, 'src/components/features/Planning/TimeBlockGrid.css'), 'utf8');
      const match = content.match(/\.solis-timeblock-stat-value\s*\{([^}]+)\}/);
      expect(match).not.toBeNull();
      const body = match![1];
      expect(body).toMatch(/font-variant-numeric:\s*tabular-nums;/);
      expect(body).toMatch(/font-feature-settings:\s*'tnum'\s*1;/);
    });

    it('enforces tabular-nums on TasksPage hourly stats value', () => {
      const content = fs.readFileSync(path.join(rootDir, 'src/features/tasks/TasksPage.css'), 'utf8');
      const match = content.match(/\.solis-hourly-stat-val\s*\{([^}]+)\}/);
      expect(match).not.toBeNull();
      const body = match![1];
      expect(body).toMatch(/font-variant-numeric:\s*tabular-nums;/);
      expect(body).toMatch(/font-feature-settings:\s*'tnum'\s*1;/);
    });
  });
});
