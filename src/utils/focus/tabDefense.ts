export interface TabDefenseConfig {
  enabled: boolean;
  blockedDomains: string[];
  autoLogDriftOnTabLeave: boolean;
}

export interface TabDriftEvent {
  id: string;
  leftAtMs: number;
  returnedAtMs: number;
  awayDurationSeconds: number;
}

export interface DeclarativeNetRequestRule {
  id: number;
  priority: number;
  action: {
    type: 'redirect';
    redirect: {
      url: string;
    };
  };
  condition: {
    urlFilter: string;
    resourceTypes: string[];
  };
}

export const DEFAULT_BLOCKED_DOMAINS: string[] = [
  'youtube.com',
  'reddit.com',
  'x.com',
  'twitter.com',
  'instagram.com',
  'tiktok.com',
  'netflix.com',
  'twitch.tv'
];

const TAB_DEFENSE_STORAGE_KEY = 'solis_tab_defense_config_v1';

/**
 * Normalizes a raw URL or domain entry (e.g., "https://www.youtube.com/watch?v=123")
 * into a canonical root domain ("youtube.com").
 */
export function normalizeDomainPattern(rawInput: string): string {
  const trimmed = rawInput.trim().toLowerCase();
  if (!trimmed) return '';

  const withoutProtocol = trimmed.replace(/^[a-z]+:\/\//i, '');
  const hostOnly = withoutProtocol.split('/')[0].split('?')[0].split('#')[0];
  const withoutPort = hostOnly.split(':')[0];
  const withoutWww = withoutPort.replace(/^www\./i, '');

  if (!/^[a-z0-9.-]+\.[a-z]{2,}$/i.test(withoutWww)) {
    return '';
  }
  return withoutWww;
}

/**
 * Checks whether a candidate URL or hostname matches any domain in the blocked list.
 */
export function isUrlBlockedByDefense(
  candidateUrlOrHost: string,
  blockedDomains: string[]
): { blocked: boolean; matchedDomain?: string } {
  const normalizedHost = normalizeDomainPattern(candidateUrlOrHost);
  if (!normalizedHost) return { blocked: false };

  for (const rawDomain of blockedDomains) {
    const cleanDomain = normalizeDomainPattern(rawDomain);
    if (!cleanDomain) continue;
    if (
      normalizedHost === cleanDomain ||
      normalizedHost.endsWith(`.${cleanDomain}`)
    ) {
      return { blocked: true, matchedDomain: cleanDomain };
    }
  }

  return { blocked: false };
}

/**
 * Loads Tab Defense configuration from localStorage with deterministic defaults.
 */
export function loadTabDefenseConfig(): TabDefenseConfig {
  try {
    const raw = localStorage.getItem(TAB_DEFENSE_STORAGE_KEY);
    if (!raw) {
      return {
        enabled: true,
        blockedDomains: [...DEFAULT_BLOCKED_DOMAINS],
        autoLogDriftOnTabLeave: true
      };
    }
    const parsed = JSON.parse(raw);
    return {
      enabled: typeof parsed.enabled === 'boolean' ? parsed.enabled : true,
      blockedDomains: Array.isArray(parsed.blockedDomains)
        ? parsed.blockedDomains.map(normalizeDomainPattern).filter(Boolean)
        : [...DEFAULT_BLOCKED_DOMAINS],
      autoLogDriftOnTabLeave:
        typeof parsed.autoLogDriftOnTabLeave === 'boolean'
          ? parsed.autoLogDriftOnTabLeave
          : true
    };
  } catch {
    return {
      enabled: true,
      blockedDomains: [...DEFAULT_BLOCKED_DOMAINS],
      autoLogDriftOnTabLeave: true
    };
  }
}

/**
 * Saves Tab Defense configuration to localStorage.
 */
export function saveTabDefenseConfig(config: TabDefenseConfig): void {
  try {
    const sanitized: TabDefenseConfig = {
      enabled: Boolean(config.enabled),
      blockedDomains: Array.from(
        new Set(config.blockedDomains.map(normalizeDomainPattern).filter(Boolean))
      ),
      autoLogDriftOnTabLeave: Boolean(config.autoLogDriftOnTabLeave)
    };
    localStorage.setItem(TAB_DEFENSE_STORAGE_KEY, JSON.stringify(sanitized));
  } catch {
    // Ignore storage quota errors in restricted environments
  }
}

/**
 * Generates Chrome Extension Manifest V3 `declarativeNetRequest` rules
 * that gently redirect distraction sites back to the Solis Focus Sanctuary.
 */
export function generateDeclarativeNetRequestRules(
  blockedDomains: string[],
  redirectUrl = 'http://localhost:5173/app/focus?shield=intercepted'
): DeclarativeNetRequestRule[] {
  const uniqueDomains = Array.from(
    new Set(blockedDomains.map(normalizeDomainPattern).filter(Boolean))
  );

  return uniqueDomains.map((domain, index) => ({
    id: index + 1,
    priority: 1,
    action: {
      type: 'redirect',
      redirect: {
        url: redirectUrl
      }
    },
    condition: {
      urlFilter: `||${domain}^`,
      resourceTypes: ['main_frame']
    }
  }));
}

/**
 * Generates the companion Chrome Extension Manifest V3 JSON payload.
 */
export function generateChromeExtensionManifest(): Record<string, unknown> {
  return {
    manifest_version: 3,
    name: 'Solis Focus Sanctuary — Tab Defense Companion',
    version: '1.0.0',
    description:
      'Calm, non-punitive distraction shield that protects deep work sessions in Solis Study OS.',
    permissions: ['declarativeNetRequest', 'storage', 'tabs'],
    host_permissions: ['<all_urls>'],
    declarative_net_request: {
      rule_resources: [
        {
          id: 'solis_focus_shield_rules',
          enabled: true,
          path: 'rules.json'
        }
      ]
    }
  };
}

/**
 * Summarizes tab drift telemetry during an active focus session.
 */
export function summarizeTabDriftEvents(events: TabDriftEvent[]): {
  totalDriftCount: number;
  totalAwaySeconds: number;
  longestAwaySeconds: number;
  focusPurityPercent: number;
} {
  if (events.length === 0) {
    return {
      totalDriftCount: 0,
      totalAwaySeconds: 0,
      longestAwaySeconds: 0,
      focusPurityPercent: 100
    };
  }

  let totalAwaySeconds = 0;
  let longestAwaySeconds = 0;

  for (const ev of events) {
    const dur = Math.max(0, Math.round(ev.awayDurationSeconds));
    totalAwaySeconds += dur;
    if (dur > longestAwaySeconds) {
      longestAwaySeconds = dur;
    }
  }

  // Each drift event or minute away gently reduces purity score without punitive zeroing
  const penalty = events.length * 4 + Math.floor(totalAwaySeconds / 30) * 2;
  const focusPurityPercent = Math.max(0, Math.min(100, 100 - penalty));

  return {
    totalDriftCount: events.length,
    totalAwaySeconds,
    longestAwaySeconds,
    focusPurityPercent
  };
}
