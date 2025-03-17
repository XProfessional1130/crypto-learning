export type Theme = 'light' | 'dark' | 'system';

export class ThemeService {
  private static THEME_KEY = 'lc-theme';

  static getSystemTheme(): Theme {
    if (typeof window === 'undefined') return 'system';
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  static getStoredTheme(): Theme {
    if (typeof window === 'undefined') return 'system';
    return (localStorage.getItem(this.THEME_KEY) as Theme) || 'system';
  }

  static setTheme(theme: Theme): void {
    if (typeof window === 'undefined') return;

    const root = window.document.documentElement;
    const isDark = theme === 'dark' || (theme === 'system' && this.getSystemTheme() === 'dark');

    root.classList.remove('light', 'dark');
    root.classList.add(isDark ? 'dark' : 'light');

    if (theme === 'system') {
      localStorage.removeItem(this.THEME_KEY);
    } else {
      localStorage.setItem(this.THEME_KEY, theme);
    }
  }

  static watchSystemTheme(callback: (isDark: boolean) => void): () => void {
    if (typeof window === 'undefined') return () => {};

    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e: MediaQueryListEvent) => callback(e.matches);
    
    media.addEventListener('change', handler);
    return () => media.removeEventListener('change', handler);
  }
} 