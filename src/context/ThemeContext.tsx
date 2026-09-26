import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { ThemeMode } from '../types/common';

export type DensityMode = 'comfortable' | 'compact';

/**
 * Plan §7.3 — hyper-legible readable type mode applied via `data-font` on
 * the root element and resolved in themes.css. `default` keeps the canonical
 * Newsreader / Plus Jakarta Sans pairing.
 */
export type ReadableFont = 'default' | 'opendyslexic' | 'atkinson';

const READABLE_FONTS: ReadableFont[] = ['default', 'opendyslexic', 'atkinson'];

const SEPIA_CANVAS = '#F1E9D8';

/** Reads the readable-font choice from the sanctioned `solis_user_preferences` JSON. */
function readStoredReadableFont(): ReadableFont {
  try {
    const raw = localStorage.getItem('solis_user_preferences');
    if (!raw) return 'default';
    const parsed = JSON.parse(raw);
    const font = parsed?.readableFont;
    return READABLE_FONTS.includes(font) ? (font as ReadableFont) : 'default';
  } catch {
    return 'default';
  }
}

/** Merges the readable-font choice back into the `solis_user_preferences` JSON. */
function persistReadableFont(font: ReadableFont) {
  try {
    const raw = localStorage.getItem('solis_user_preferences');
    const prefs = raw ? JSON.parse(raw) : {};
    localStorage.setItem('solis_user_preferences', JSON.stringify({ ...prefs, readableFont: font }));
  } catch {
    // Storage unavailable — non-fatal; the choice still applies for this visit.
  }
}

interface ThemeContextValue {
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
  isDark: boolean;
  density: DensityMode;
  setDensity: (density: DensityMode) => void;
  readableFont: ReadableFont;
  setReadableFont: (font: ReadableFont) => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<ThemeMode>(() => {
    try {
      const saved = localStorage.getItem('solis-theme') as ThemeMode;
      if (saved === 'dark') return 'dark';
      if (saved === 'light') return 'light';
      if (saved === 'sepia') return 'sepia';
      if (saved === 'system') return 'system';
      return 'dark'; // Default to Deep Charcoal (Night) for new users
    } catch {
      return 'dark';
    }
  });

  const [density, setDensityState] = useState<DensityMode>(() => {
    try {
      const saved = localStorage.getItem('solis_density') as DensityMode;
      return saved === 'compact' ? 'compact' : 'comfortable';
    } catch {
      return 'comfortable';
    }
  });

  const [readableFont, setReadableFontState] = useState<ReadableFont>(readStoredReadableFont);

  const [isDark, setIsDark] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('solis-theme') as ThemeMode;
      if (saved === 'dark') return true;
      if (saved === 'light' || saved === 'sepia') return false;
      if (saved === 'system' && typeof window !== 'undefined' && window.matchMedia) {
        return window.matchMedia('(prefers-color-scheme: dark)').matches;
      }
      return true; // Default to Deep Charcoal (Night)
    } catch {
      return true;
    }
  });

  const applyDensity = useCallback((mode: DensityMode) => {
    const root = document.documentElement;
    root.setAttribute('data-density', mode);
  }, []);

  const applyReadableFont = useCallback((font: ReadableFont) => {
    const root = document.documentElement;
    if (font === 'default') {
      root.removeAttribute('data-font');
    } else {
      root.setAttribute('data-font', font);
    }
  }, []);

  const applyTheme = useCallback((activeTheme: ThemeMode) => {
    const root = document.documentElement;
    let resolvedDark = false;

    if (activeTheme === 'dark') {
      resolvedDark = true;
    } else if (activeTheme === 'light' || activeTheme === 'sepia') {
      resolvedDark = false;
    } else {
      resolvedDark = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    }

    setIsDark(resolvedDark);

    if (activeTheme === 'sepia') {
      // Plan §7.3: low-stimulation sepia reading theme (warm monochrome).
      root.classList.remove('dark');
      root.setAttribute('data-theme', 'sepia');
      root.style.colorScheme = 'light';
    } else if (resolvedDark) {
      root.classList.add('dark');
      root.setAttribute('data-theme', 'dark');
      root.style.colorScheme = 'dark';
    } else {
      root.classList.remove('dark');
      root.setAttribute('data-theme', 'light');
      root.style.colorScheme = 'light';
    }

    // Update meta theme-color tag
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      const metaColor = activeTheme === 'sepia'
        ? SEPIA_CANVAS
        : resolvedDark
          ? '#0E0C0B'
          : '#FAF8F5';
      metaThemeColor.setAttribute('content', metaColor);
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('solis_density', density);
    } catch {
      // ignore
    }
    applyDensity(density);
  }, [density, applyDensity]);

  useEffect(() => {
    applyReadableFont(readableFont);
    persistReadableFont(readableFont);
  }, [readableFont, applyReadableFont]);

  useEffect(() => {
    try {
      localStorage.setItem('solis-theme', theme);
    } catch {
      // ignore storage access errors
    }
    applyTheme(theme);

    if (theme === 'system' && typeof window !== 'undefined' && window.matchMedia) {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = () => {
        applyTheme('system');
      };
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, [theme, applyTheme]);

  const setTheme = (newTheme: ThemeMode) => {
    setThemeState(newTheme);
  };

  const setDensity = (newDensity: DensityMode) => {
    setDensityState(newDensity);
  };

  const setReadableFont = (font: ReadableFont) => {
    setReadableFontState(font);
  };

  const toggleTheme = () => {
    setThemeState((prev) => {
      const isCurrentlyDark = prev === 'dark' || (prev === 'system' && isDark);
      return isCurrentlyDark ? 'light' : 'dark';
    });
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme, isDark, density, setDensity, readableFont, setReadableFont }}>
      {children}
    </ThemeContext.Provider>
  );
};

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
