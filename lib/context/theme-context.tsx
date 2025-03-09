'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { ThemeService, type Theme } from '@/lib/services/theme';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => ThemeService.getStoredTheme());

  useEffect(() => {
    // Apply initial theme
    ThemeService.setTheme(theme);

    // Watch for system theme changes
    if (theme === 'system') {
      return ThemeService.watchSystemTheme((isDark) => {
        const root = window.document.documentElement;
        root.classList.remove('light', 'dark');
        root.classList.add(isDark ? 'dark' : 'light');
      });
    }
  }, [theme]);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    ThemeService.setTheme(newTheme);
  };

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
} 