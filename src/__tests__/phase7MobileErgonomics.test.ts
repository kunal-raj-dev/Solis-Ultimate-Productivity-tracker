/**
 * Phase 7 test suite — Mobile Ergonomics & Responsive Refactor (plan §7.1–7.3).
 *
 * Covers:
 *  - §7.1  Mobile 7-day rolling habit matrix + vertical Agenda List (TimeBlockGrid)
 *  - §7.2  Dedicated 5-tab mobile bottom navigation + 48px touch targets
 *  - §7.3  OpenDyslexic / Atkinson Hyperlegible fonts + low-stimulation sepia theme
 */
import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { MOBILE_NAVIGATION } from '../constants/navigation';
import { MobileNav } from '../components/layout/MobileNav/MobileNav';
import { ThemeProvider, useTheme } from '../context/ThemeContext';

describe('Phase 7 — Mobile Ergonomics & Responsive Refactor', () => {
  const rootDir = path.resolve(__dirname, '../..');
  const read = (rel: string) => fs.readFileSync(path.join(rootDir, rel), 'utf8');

  describe('7.1 — Mobile 7-day rolling habit matrix & vertical Agenda List', () => {
    it('collapses the habit matrix to a 7-day rolling window on viewports < 768px', () => {
      const content = read('src/features/habits/HabitsPage.tsx');

      // Mobile detection uses the canonical breakpoint hook (max-width: 767px).
      expect(content).toMatch(/import \{ useIsMobile \} from '\.\.\/\.\.\/hooks\/useMediaQuery'/);
      expect(content).toMatch(/const isMobileViewport = useIsMobile\(\)/);

      // The window shrinks to 7 days on mobile and stays 14 days on desktop.
      expect(content).toMatch(/getPastNDaysISO\(isMobileViewport \? 7 : 14\)/);
      expect(content).toMatch(/isMobileViewport \? '7-Day' : '14-Day'\} Consistency Horizon/);
    });

    it('fits the 7 mobile matrix columns into a 375px viewport with 44px touch floor', () => {
      const content = read('src/features/habits/HabitsPage.css');
      const mobileBlock = content.match(/@media \(max-width: 767px\) \{[\s\S]*?\n\}/);
      expect(mobileBlock).not.toBeNull();
      expect(mobileBlock![0]).toMatch(/\.solis-habits-week-matrix \{[^}]*gap:\s*4px;/s);
      expect(mobileBlock![0]).toMatch(/\.solis-habit-day-btn \{[^}]*min-height:\s*44px;/s);
      // master.md §17.4: the 44px floor applies to width too, not just height.
      expect(mobileBlock![0]).toMatch(/\.solis-habit-day-btn \{[^}]*min-width:\s*44px;/s);
      expect(mobileBlock![0]).toMatch(/flex:\s*1 1 0/);
    });

    it('keeps TimeBlockGrid a vertical chronological list and stacks it into an agenda on mobile', () => {
      const tsx = read('src/components/features/Planning/TimeBlockGrid.tsx');
      // Single chronological list container (desktop and mobile presentation).
      expect(tsx).toContain('solis-timeblock-list');
      expect(tsx).toContain('role="list"');
      expect(tsx).toContain('role="listitem"');
      expect(tsx).not.toMatch(/grid-template-columns/);

      const css = read('src/components/features/Planning/TimeBlockGrid.css');
      const mobileBlock = css.match(/@media \(max-width: 767px\) \{[\s\S]*?\n\}/);
      expect(mobileBlock).not.toBeNull();
      expect(mobileBlock![0]).toMatch(/\.solis-timeblock-card \{[^}]*flex-wrap:\s*wrap;/s);
      expect(mobileBlock![0]).toMatch(/\.solis-timeblock-card__content \{[^}]*flex-basis:\s*100%;/s);
    });
  });

  describe('7.2 — Dedicated 5-tab mobile bottom navigation & 48px touch targets', () => {
    it('defines exactly the five plan tabs in plan order', () => {
      expect(MOBILE_NAVIGATION.map((t) => t.id)).toEqual([
        'dashboard',
        'focus',
        'study',
        'tasks',
        'analytics'
      ]);
      expect(MOBILE_NAVIGATION.map((t) => t.path)).toEqual([
        '/app/dashboard',
        '/app/focus',
        '/app/study',
        '/app/tasks',
        '/app/analytics'
      ]);
      expect(MOBILE_NAVIGATION.map((t) => t.label)).toEqual([
        'Today',
        'Focus',
        'Subjects',
        'Tasks',
        'Progress'
      ]);
    });

    it('renders the canonical MobileNav from the 5-tab constant with no More sheet', () => {
      expect(MobileNav).toBeDefined();
      const content = read('src/components/layout/MobileNav/MobileNav.tsx');
      expect(content).toMatch(/MOBILE_NAVIGATION\.map/);
      expect(content).not.toContain('MobileMoreSheet');
      expect(content).not.toContain('MoreHorizontal');

      // The retired More sheet is deleted outright (master.md §9.4 amendment).
      expect(fs.existsSync(path.join(rootDir, 'src/components/layout/MobileNav/MobileMoreSheet.tsx'))).toBe(false);
      expect(fs.existsSync(path.join(rootDir, 'src/components/layout/MobileNav/MobileMoreSheet.css'))).toBe(false);

      // AppLayout still mounts the bottom bar outside the Focus route.
      const layout = read('src/layouts/AppLayout.tsx');
      expect(layout).toMatch(/<MobileNav \/>/);
    });

    it('enforces 48px minimum touch targets on mobile nav items and recall rating buttons', () => {
      const navCss = read('src/components/layout/MobileNav/MobileNav.css');
      const navItemRule = navCss.match(/\.solis-mobile-nav__item \{[^}]+\}/);
      expect(navItemRule).not.toBeNull();
      expect(navItemRule![0]).toMatch(/min-height:\s*48px;/);
      expect(navItemRule![0]).toMatch(/min-width:\s*48px;/);

      // Rating buttons (Again / Hard / Good / Easy) live in the recall modal
      // opened by SpacedReviewsSanctuary; the floor holds on every viewport.
      const recallCss = read('src/components/features/Flashcards/FlashcardReviewModal.css');
      const baseRule = recallCss.match(/\.solis-recall-btn \{[^}]+\}/);
      expect(baseRule).not.toBeNull();
      expect(baseRule![0]).toMatch(/min-height:\s*48px;/);
      expect(baseRule![0]).toMatch(/min-width:\s*48px;/);

      // SpacedReviewsSanctuary action buttons carry the 44px touch-target
      // utility (master.md §17.4) — plan §7.2's named file for touch targets.
      const sanctuary = read('src/features/study/components/SpacedReviewsSanctuary.tsx');
      expect(sanctuary.match(/className="min-touch-target"/g)?.length).toBeGreaterThanOrEqual(4);
    });
  });

  describe('7.3 — OpenDyslexic / Atkinson Hyperlegible fonts & low-stimulation sepia theme', () => {
    it('declares self-hosted @font-face rules for both hyper-legible typefaces', () => {
      const themes = read('src/styles/themes.css');
      expect(themes.match(/@font-face \{/g)?.length).toBe(4);
      expect(themes).toMatch(/font-family:\s*'OpenDyslexic';/);
      expect(themes).toMatch(/font-family:\s*'Atkinson Hyperlegible';/);
      expect(themes).toMatch(/url\('\.\.\/assets\/fonts\/OpenDyslexic-Regular\.woff2'\)/);
      expect(themes).toMatch(/url\('\.\.\/assets\/fonts\/OpenDyslexic-Bold\.woff2'\)/);
      expect(themes).toMatch(/url\('\.\.\/assets\/fonts\/AtkinsonHyperlegible-Regular\.woff2'\)/);
      expect(themes).toMatch(/url\('\.\.\/assets\/fonts\/AtkinsonHyperlegible-Bold\.woff2'\)/);

      // The bundled font binaries must actually exist (no fake loading states).
      for (const file of [
        'src/assets/fonts/OpenDyslexic-Regular.woff2',
        'src/assets/fonts/OpenDyslexic-Bold.woff2',
        'src/assets/fonts/AtkinsonHyperlegible-Regular.woff2',
        'src/assets/fonts/AtkinsonHyperlegible-Bold.woff2'
      ]) {
        const buf = fs.readFileSync(path.join(rootDir, file));
        expect(buf.subarray(0, 4).toString('ascii')).toBe('wOF2');
      }
    });

    it('registers the stylesheet entry point and the data-font readable modes', () => {
      const indexCss = read('src/styles/index.css');
      expect(indexCss).toContain("@import './themes.css';");

      const themes = read('src/styles/themes.css');
      expect(themes).toMatch(/\[data-font='opendyslexic'\] \{[\s\S]*?--font-interface:\s*'OpenDyslexic'/s);
      expect(themes).toMatch(/\[data-font='atkinson'\] \{[\s\S]*?--font-interface:\s*'Atkinson Hyperlegible'/s);
      // Timers keep tabular monospaced numerals (master.md §12.2).
      expect(themes).not.toMatch(/\[data-font[^\]]*\] \{[^}]*--font-mono/s);
    });

    it('adds the sepia low-stimulation palette with zero saturated blue/red alerts', () => {
      const tokens = read('src/styles/tokens.css');
      const sepiaBlock = tokens.match(/\[data-theme="sepia"\] \{[\s\S]*?\n\}/);
      expect(sepiaBlock).not.toBeNull();
      const sepia = sepiaBlock![0];

      // Warm monochrome status colors (olive / ochre / muted brick / taupe).
      expect(sepia).toMatch(/--status-error:\s*#8C4A32;/);
      expect(sepia).toMatch(/--status-info:\s*#7D6B52;/);
      expect(sepia).toMatch(/--status-success:\s*#6E6F3F;/);
      expect(sepia).toMatch(/--status-warning:\s*#9A7420;/);

      // Raw brand scales components consume directly are remapped too.
      expect(sepia).toMatch(/--color-coral-500:\s*#A9714B;/);
      expect(sepia).toMatch(/--color-lavender-500:\s*#7D6B52;/);
      expect(sepia).toMatch(/--color-sage-500:\s*#6E6F3F;/);
      expect(sepia).toMatch(/--color-rose-500:\s*#A9654F;/);

      // No saturated blue or red alert/semantic tones inside the sepia block.
      expect(sepia).not.toMatch(/#(C83234|E11D48|E85555|5E688E|7F8BB4|E05A3E|E65A41|C84B31)/i);

      // Circadian tinting must not override the sepia canvas.
      expect(tokens).toMatch(
        /html\[data-circadian="dawn"\]:not\(\[data-theme="dark"\]\):not\(\[data-theme="sepia"\]\)/
      );
    });

    it('resolves the sepia theme in ThemeContext and persists the readable font choice', () => {
      const context = read('src/context/ThemeContext.tsx');
      expect(context).toMatch(/if \(saved === 'sepia'\) return 'sepia';/);
      expect(context).toMatch(/activeTheme === 'light' \|\| activeTheme === 'sepia'/);
      expect(context).toMatch(/root\.setAttribute\('data-theme', 'sepia'\)/);
      expect(context).toMatch(/solis_user_preferences/);
      expect(context).toMatch(/data-font/);
      // ThemeProvider + useTheme surface stays intact.
      expect(ThemeProvider).toBeDefined();
      expect(useTheme).toBeDefined();
    });

    it('exposes sepia and hyper-legible font toggles in SettingsPage', () => {
      const settings = read('src/features/settings/SettingsPage.tsx');
      expect(settings).toMatch(/onClick=\{\(\) => setTheme\('sepia'\)\}/);
      expect(settings).toMatch(/onClick=\{\(\) => setReadableFont\('opendyslexic'\)\}/);
      expect(settings).toMatch(/onClick=\{\(\) => setReadableFont\('atkinson'\)\}/);
      expect(settings).toMatch(/onClick=\{\(\) => setReadableFont\('default'\)\}/);
      // A general Save must not clobber the readable-font choice.
      expect(settings).toMatch(/JSON\.stringify\(\{ \.\.\.nextPreferences, readableFont \}\)/);
    });
  });
});
