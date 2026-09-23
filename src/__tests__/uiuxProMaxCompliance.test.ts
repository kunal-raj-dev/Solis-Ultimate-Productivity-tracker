import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

describe('UI/UX Pro Max Architecture & Compliance Suite', () => {
  const rootDir = path.resolve(__dirname, '../..');

  describe('Design System Persistence & Hierarchy', () => {
    it('persists Master Design System and page overrides', () => {
      const masterPath = path.join(rootDir, 'design-system/solis/MASTER.md');
      const landingPath = path.join(rootDir, 'design-system/solis/pages/landing.md');
      const dashboardPath = path.join(rootDir, 'design-system/solis/pages/dashboard.md');
      const focusPath = path.join(rootDir, 'design-system/solis/pages/focus.md');

      expect(fs.existsSync(masterPath)).toBe(true);
      expect(fs.existsSync(landingPath)).toBe(true);
      expect(fs.existsSync(dashboardPath)).toBe(true);
      expect(fs.existsSync(focusPath)).toBe(true);

      const masterContent = fs.readFileSync(masterPath, 'utf-8');
      expect(masterContent).toContain('The Archival Circadian Monograph');
      expect(masterContent).toContain('EB Garamond');
      expect(masterContent).toContain('Fira Code');
      expect(masterContent).toContain('WCAG 2.2 AA');
    });
  });

  describe('Touch & Pointer Discipline (Priority 2)', () => {
    it('enforces touch-action: manipulation to eliminate 300ms tap delay', () => {
      const resetCss = fs.readFileSync(path.join(rootDir, 'src/styles/reset.css'), 'utf-8');
      expect(resetCss).toContain('touch-action: manipulation');
      expect(resetCss).toContain('-webkit-tap-highlight-color: transparent');
    });

    it('enforces 44px min tap targets for coarse pointer devices', () => {
      const componentsCss = fs.readFileSync(path.join(rootDir, 'src/styles/components.css'), 'utf-8');
      expect(componentsCss).toContain('@media (pointer: coarse)');
      expect(componentsCss).toContain('min-height: var(--min-touch-target, 44px)');
      expect(componentsCss).toContain('min-width: var(--min-touch-target, 44px)');
    });
  });

  describe('Accessibility & Motion Safety (Priority 1 & 7)', () => {
    it('strictly honors prefers-reduced-motion with instant transitions', () => {
      const animCss = fs.readFileSync(path.join(rootDir, 'src/styles/animations.css'), 'utf-8');
      expect(animCss).toContain('@media (prefers-reduced-motion: reduce)');
      expect(animCss).toContain('animation-duration: 0.01ms !important');
    });

    it('validates Button accessibility contract', () => {
      const buttonSrc = fs.readFileSync(path.join(rootDir, 'src/components/ui/Button/Button.tsx'), 'utf-8');
      expect(buttonSrc).toContain("aria-busy={isLoading ? 'true' : undefined}");
      expect(buttonSrc).toContain("aria-disabled={disabled || isLoading ? 'true' : undefined}");
      expect(buttonSrc).toContain("data-cursor");
    });

    it('validates Input accessibility and live error contract', () => {
      const inputSrc = fs.readFileSync(path.join(rootDir, 'src/components/ui/Input/Input.tsx'), 'utf-8');
      expect(inputSrc).toContain("aria-invalid={error ? 'true' : undefined}");
      expect(inputSrc).toContain("aria-describedby=");
      expect(inputSrc).toContain("role={error ? 'alert' : undefined}");
      expect(inputSrc).toContain("aria-live={error ? 'polite' : undefined}");
    });
    it('validates Card keyboard accessibility and cursor contract', () => {
      const cardSrc = fs.readFileSync(path.join(rootDir, 'src/components/ui/Card/Card.tsx'), 'utf-8');
      expect(cardSrc).toContain("data-cursor={isInteractive ? (dataCursor || 'examine') : dataCursor}");
      expect(cardSrc).toContain("role={role || (isInteractive ? 'button' : undefined)}");
      expect(cardSrc).toContain("tabIndex={tabIndex !== undefined ? tabIndex : (isInteractive ? 0 : undefined)}");
      expect(cardSrc).toContain('handleKeyDown');
    });

    it('enforces editorial typography in EmptyState', () => {
      const emptyCss = fs.readFileSync(path.join(rootDir, 'src/components/feedback/EmptyState/EmptyState.css'), 'utf-8');
      expect(emptyCss).toContain('font-family: var(--font-display)');
      expect(emptyCss).toContain('var(--accent-terracotta)');
    });

    it('verifies zero raw emoji icons in FocusPage primary actions', () => {
      const focusSrc = fs.readFileSync(path.join(rootDir, 'src/features/focus/FocusPage.tsx'), 'utf-8');
      expect(focusSrc).not.toContain('🌿');
      expect(focusSrc).toContain('<Wind size={15} />');
    });
  });

  describe('Tabular Data & Telemetry Alignment (Priority 10)', () => {
    it('ensures design tokens define tabular numbers for telemetry metrics', () => {
      const typoCss = fs.readFileSync(path.join(rootDir, 'src/styles/typography.css'), 'utf-8');
      expect(typoCss).toContain('tabular-nums');
      expect(typoCss).toContain('--font-mono');
    });
  });
});
