import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { ThemeMode } from '../types/common';

interface ThemeContextValue {
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<ThemeMode>(() => {
    try {
      const saved = localStorage.getItem('solis-theme') as ThemeMode;
      if (saved === 'dark') return 'dark';
      if (saved === 'light') return 'light';
      if (saved === 'system') return 'system';
      return 'dark'; // Default to Deep Charcoal (Night) for new users
    } catch {
      return 'dark';
    }
  });

  const [isDark, setIsDark] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('solis-theme') as ThemeMode;
      if (saved === 'dark') return true;
      if (saved === 'light') return false;
      if (saved === 'system' && typeof window !== 'undefined' && window.matchMedia) {
        return window.matchMedia('(prefers-color-scheme: dark)').matches;
      }
      return true; // Default to Deep Charcoal (Night)
    } catch {
      return true;
    }
  });

  const applyTheme = useCallback((activeTheme: ThemeMode) => {
    const root = document.documentElement;
    let resolvedDark = false;

    if (activeTheme === 'dark') {
      resolvedDark = true;
    } else if (activeTheme === 'light') {
      resolvedDark = false;
    } else {
      resolvedDark = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    }

    setIsDark(resolvedDark);

    if (resolvedDark) {
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
      metaThemeColor.setAttribute('content', resolvedDark ? '#141211' : '#FAF8F5');
    }
  }, []);

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

  const toggleTheme = () => {
    setThemeState((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme, isDark }}>
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
