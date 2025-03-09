'use client';

import { useTheme } from '@/lib/theme-context';
import { SunIcon, MoonIcon } from './icons/ThemeIcons';

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      className="rounded-full p-2 text-light-text-secondary dark:text-dark-text-secondary hover:bg-white/10 dark:hover:bg-dark-bg-accent/30 focus:outline-none focus:ring-2 focus:ring-brand-primary transition-all duration-200"
      onClick={toggleTheme}
    >
      <span className="sr-only">Toggle theme</span>
      {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
    </button>
  );
} 