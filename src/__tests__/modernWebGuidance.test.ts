import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

describe('Modern Web Guidance & Frontend Design Compliance Suite', () => {
  const rootDir = path.resolve(__dirname, '..');

  it('verifies typography and reset modern text-wrapping standards', () => {
    const resetCss = fs.readFileSync(path.join(rootDir, 'styles', 'reset.css'), 'utf-8');
    const typographyCss = fs.readFileSync(path.join(rootDir, 'styles', 'typography.css'), 'utf-8');

    // Headings have text-wrap: balance
    expect(resetCss).toContain('text-wrap: balance');
    expect(typographyCss).toContain('text-wrap: balance');

    // Body copy has text-wrap: pretty
    expect(resetCss).toContain('text-wrap: pretty');
    expect(typographyCss).toContain('text-wrap: pretty');
  });

  it('verifies standardized modern scrollbar rules with progressive fallback', () => {
    const resetCss = fs.readFileSync(path.join(rootDir, 'styles', 'reset.css'), 'utf-8');

    // Standard properties
    expect(resetCss).toContain('scrollbar-width: thin');
    expect(resetCss).toContain('scrollbar-color: var(--scrollbar-thumb) var(--scrollbar-track)');

    // Fallback for browsers without standard scrollbar-color
    expect(resetCss).toContain('@supports not (scrollbar-color: auto)');
    expect(resetCss).toContain('::-webkit-scrollbar');
  });

  it('verifies soft edge content fade masking per Modern Web Guidance', () => {
    const componentsCss = fs.readFileSync(path.join(rootDir, 'styles', 'components.css'), 'utf-8');

    expect(componentsCss).toContain('.scroll-fade-y');
    expect(componentsCss).toContain('-webkit-mask-image: linear-gradient(to bottom, black 85%, transparent 100%)');
    expect(componentsCss).toContain('mask-image: linear-gradient(to bottom, black 85%, transparent 100%)');
  });

  it('verifies off-screen rendering deferral for Core Web Vitals (INP/LCP)', () => {
    const componentsCss = fs.readFileSync(path.join(rootDir, 'styles', 'components.css'), 'utf-8');
    const landingCss = fs.readFileSync(path.join(rootDir, 'features', 'landing', 'LandingPage.css'), 'utf-8');

    // Intrinsic size utility
    expect(componentsCss).toContain('content-visibility: auto');
    expect(componentsCss).toContain('contain-intrinsic-size: auto none auto 500px');

    // Lower landing sections deferred
    expect(landingCss).toContain('.solis-contrast-section');
    expect(landingCss).toContain('.solis-bento-section');
    expect(landingCss).toContain('.solis-testimonials-section');
    expect(landingCss).toContain('.solis-faq-section');
    expect(landingCss).toContain('.solis-launch-sanctuary');
  });

  it('verifies container queries (size-aware styling) on modular components', () => {
    const cardCss = fs.readFileSync(path.join(rootDir, 'components', 'ui', 'Card', 'Card.css'), 'utf-8');
    const dashboardCss = fs.readFileSync(path.join(rootDir, 'features', 'dashboard', 'DashboardPage.css'), 'utf-8');

    // Card container type and queries
    expect(cardCss).toContain('container-type: inline-size');
    expect(cardCss).toContain('@container (min-width: 560px)');
    expect(cardCss).toContain('@container (max-width: 320px)');

    // Dashboard panel & solar hero container types
    expect(dashboardCss).toContain('container-type: inline-size');
  });

  it('verifies frontend design principles: zero generic AI cliches and strict typography pairing', () => {
    const typographyCss = fs.readFileSync(path.join(rootDir, 'styles', 'typography.css'), 'utf-8');
    const tokensCss = fs.readFileSync(path.join(rootDir, 'styles', 'tokens.css'), 'utf-8');

    // Intentional font pairing: Newsreader (Editorial Serif) + Plus Jakarta Sans + JetBrains Mono
    expect(typographyCss).toContain("'Newsreader'");
    expect(typographyCss).toContain("'Plus Jakarta Sans'");
    expect(typographyCss).toContain("'JetBrains Mono'");

    // Restrained circadian palette (Zero fluorescent neon)
    expect(tokensCss).not.toContain('#00FF00');
    expect(tokensCss).not.toContain('#00ffff');
    expect(tokensCss).toContain('--color-coral-500: #E65A41');
    expect(tokensCss).toContain('--color-amber-500: #C28224');
    expect(tokensCss).toContain('--color-sage-500: #3E7250');
  });
});
