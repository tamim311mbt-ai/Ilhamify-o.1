import { useCallback, useEffect, useState } from 'react';

export type AppThemeMode = 'light' | 'dark';

const THEME_STORAGE_KEY = 'ilhamify_theme_v1';

function readSavedTheme(): AppThemeMode | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(THEME_STORAGE_KEY);
    if (raw === 'dark' || raw === 'light') return raw;
  } catch {
    // স্টোরেজ অ্যাক্সেস না থাকলে উপেক্ষা করুন
  }
  return null;
}

function getSystemTheme(): AppThemeMode {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return 'light';
  }
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function applyThemeToDocument(mode: AppThemeMode) {
  if (typeof document === 'undefined') return;
  const isDark = mode === 'dark';
  document.documentElement.classList.toggle('dark', isDark);
  document.documentElement.style.colorScheme = mode;

  const metaThemeColor = document.querySelector('meta[name="theme-color"]');
  if (metaThemeColor) {
    metaThemeColor.setAttribute('content', isDark ? '#0D1515' : '#4E7272');
  }
}

export function useTheme() {
  const [theme, setTheme] = useState<AppThemeMode>(() => readSavedTheme() ?? getSystemTheme());

  useEffect(() => {
    applyThemeToDocument(theme);
  }, [theme]);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const handleSystemChange = (e: MediaQueryListEvent) => {
      if (readSavedTheme() !== null) return;
      setTheme(e.matches ? 'dark' : 'light');
    };

    mediaQuery.addEventListener('change', handleSystemChange);
    return () => mediaQuery.removeEventListener('change', handleSystemChange);
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => {
      const next: AppThemeMode = prev === 'dark' ? 'light' : 'dark';
      try {
        localStorage.setItem(THEME_STORAGE_KEY, next);
      } catch {
        // স্টোরেজ ত্রুটি উপেক্ষা করুন
      }
      return next;
    });
  }, []);

  return {
    theme,
    isDark: theme === 'dark',
    toggleTheme,
  };
}
