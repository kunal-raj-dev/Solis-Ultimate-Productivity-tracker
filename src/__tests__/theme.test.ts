import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ThemeMode } from '../types/common';

interface MockClassList {
  classes: Set<string>;
  add: (cls: string) => void;
  remove: (cls: string) => void;
  contains: (cls: string) => boolean;
}

interface MockElement {
  attributes: Record<string, string>;
  style: { colorScheme: string };
  classList: MockClassList;
  setAttribute: (k: string, v: string) => void;
  getAttribute: (k: string) => string | null;
  removeAttribute: (k: string) => void;
}

function createMockElement(): MockElement {
  const classes = new Set<string>();
  const attributes: Record<string, string> = {};
  return {
    attributes,
    style: { colorScheme: '' },
    classList: {
      classes,
      add: (cls) => classes.add(cls),
      remove: (cls) => classes.delete(cls),
      contains: (cls) => classes.has(cls)
    },
    setAttribute: (k, v) => {
      attributes[k] = v;
    },
    getAttribute: (k) => attributes[k] ?? null,
    removeAttribute: (k) => {
      delete attributes[k];
    }
  };
}

// In-memory mock storage
const mockStore: Record<string, string> = {};
const mockLocalStorage = {
  getItem: (key: string) => mockStore[key] ?? null,
  setItem: (key: string, value: string) => {
    mockStore[key] = String(value);
  },
  removeItem: (key: string) => {
    delete mockStore[key];
  },
  clear: () => {
    Object.keys(mockStore).forEach((k) => delete mockStore[k]);
  }
};

// Pure Theme Synchronization Engine tested independently
function applyThemeEngine(
  activeTheme: ThemeMode,
  rootElement: MockElement,
  metaElement: MockElement,
  systemPrefersDark = false,
  storage = mockLocalStorage
): { isDark: boolean; theme: ThemeMode } {
  let resolvedDark = false;

  if (activeTheme === 'dark') {
    resolvedDark = true;
  } else if (activeTheme === 'light') {
    resolvedDark = false;
  } else {
    resolvedDark = systemPrefersDark;
  }

  if (resolvedDark) {
    rootElement.classList.add('dark');
    rootElement.setAttribute('data-theme', 'dark');
    rootElement.style.colorScheme = 'dark';
    metaElement.setAttribute('content', '#141211');
  } else {
    rootElement.classList.remove('dark');
    rootElement.setAttribute('data-theme', 'light');
    rootElement.style.colorScheme = 'light';
    metaElement.setAttribute('content', '#FAF8F5');
  }

  try {
    storage.setItem('solis-theme', activeTheme);
  } catch {
    // ignore
  }

  return { isDark: resolvedDark, theme: activeTheme };
}

describe('Solis Theme System & Night Mode Semantic Synchronization', () => {
  let root: MockElement;
  let meta: MockElement;

  beforeEach(() => {
    mockLocalStorage.clear();
    root = createMockElement();
    meta = createMockElement();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('correctly applies light theme (Warm Ivory) to DOM attributes', () => {
    const state = applyThemeEngine('light', root, meta);
    expect(state.theme).toBe('light');
    expect(state.isDark).toBe(false);
    expect(root.classList.contains('dark')).toBe(false);
    expect(root.getAttribute('data-theme')).toBe('light');
    expect(root.style.colorScheme).toBe('light');
    expect(meta.getAttribute('content')).toBe('#FAF8F5');
    expect(mockLocalStorage.getItem('solis-theme')).toBe('light');
  });

  it('correctly applies dark theme (Deep Charcoal) to DOM attributes', () => {
    const state = applyThemeEngine('dark', root, meta);
    expect(state.theme).toBe('dark');
    expect(state.isDark).toBe(true);
    expect(root.classList.contains('dark')).toBe(true);
    expect(root.getAttribute('data-theme')).toBe('dark');
    expect(root.style.colorScheme).toBe('dark');
    expect(meta.getAttribute('content')).toBe('#141211');
    expect(mockLocalStorage.getItem('solis-theme')).toBe('dark');
  });

  it('resolves system mode based on OS dark mode preference', () => {
    const stateDark = applyThemeEngine('system', root, meta, true);
    expect(stateDark.theme).toBe('system');
    expect(stateDark.isDark).toBe(true);
    expect(root.classList.contains('dark')).toBe(true);
    expect(root.getAttribute('data-theme')).toBe('dark');

    const stateLight = applyThemeEngine('system', root, meta, false);
    expect(stateLight.theme).toBe('system');
    expect(stateLight.isDark).toBe(false);
    expect(root.classList.contains('dark')).toBe(false);
    expect(root.getAttribute('data-theme')).toBe('light');
  });

  it('verifies seamless toggle transition without state corruption', () => {
    applyThemeEngine('light', root, meta);
    expect(root.getAttribute('data-theme')).toBe('light');

    applyThemeEngine('dark', root, meta);
    expect(root.getAttribute('data-theme')).toBe('dark');

    applyThemeEngine('light', root, meta);
    expect(root.getAttribute('data-theme')).toBe('light');
  });
});
