import { describe, it, expect } from 'vitest';
import {
  normalizeDomainPattern,
  isUrlBlockedByDefense,
  generateDeclarativeNetRequestRules,
  generateChromeExtensionManifest,
  summarizeTabDriftEvents,
  DEFAULT_BLOCKED_DOMAINS
} from '../tabDefense';

describe('Feature 4.2: Companion Chrome Extension & Focus Mode Tab Defense', () => {
  it('normalizes URLs and domain strings into canonical root domains', () => {
    expect(normalizeDomainPattern('https://www.YouTube.com/watch?v=abc')).toBe('youtube.com');
    expect(normalizeDomainPattern('http://old.reddit.com/r/compsci')).toBe('old.reddit.com');
    expect(normalizeDomainPattern('  x.com  ')).toBe('x.com');
    expect(normalizeDomainPattern('not-a-domain')).toBe('');
  });

  it('matches exact and subdomain URLs against the blocked distraction domain list', () => {
    const match1 = isUrlBlockedByDefense('https://www.youtube.com/shorts/123', DEFAULT_BLOCKED_DOMAINS);
    expect(match1.blocked).toBe(true);
    expect(match1.matchedDomain).toBe('youtube.com');

    const match2 = isUrlBlockedByDefense('https://m.reddit.com/r/askscience', DEFAULT_BLOCKED_DOMAINS);
    expect(match2.blocked).toBe(true);
    expect(match2.matchedDomain).toBe('reddit.com');

    const safeMatch = isUrlBlockedByDefense('https://scholar.google.com/scholar', DEFAULT_BLOCKED_DOMAINS);
    expect(safeMatch.blocked).toBe(false);
  });

  it('generates valid Manifest V3 declarativeNetRequest redirect rules and manifest', () => {
    const rules = generateDeclarativeNetRequestRules(
      ['youtube.com', 'https://www.reddit.com', 'youtube.com'],
      'https://solis.study/app/focus?shield=intercepted'
    );

    expect(rules).toHaveLength(2);
    expect(rules[0].condition.urlFilter).toBe('||youtube.com^');
    expect(rules[0].action.redirect.url).toBe('https://solis.study/app/focus?shield=intercepted');

    const manifest = generateChromeExtensionManifest();
    expect(manifest.manifest_version).toBe(3);
    expect(manifest.permissions).toContain('declarativeNetRequest');
  });

  it('summarizes tab drift events and calculates non-punitive focus purity score', () => {
    const cleanSummary = summarizeTabDriftEvents([]);
    expect(cleanSummary.focusPurityPercent).toBe(100);
    expect(cleanSummary.totalDriftCount).toBe(0);

    const driftedSummary = summarizeTabDriftEvents([
      { id: 'd1', leftAtMs: 1000, returnedAtMs: 16000, awayDurationSeconds: 15 },
      { id: 'd2', leftAtMs: 30000, returnedAtMs: 75000, awayDurationSeconds: 45 }
    ]);
    expect(driftedSummary.totalDriftCount).toBe(2);
    expect(driftedSummary.totalAwaySeconds).toBe(60);
    expect(driftedSummary.longestAwaySeconds).toBe(45);
    expect(driftedSummary.focusPurityPercent).toBe(88);
  });
});
