'use client';

import { useTheme } from '@/lib/theme-context';

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      className="relative rounded-full p-2 bg-gray-200/40 dark:bg-white/5 text-gray-600 dark:text-dark-text-secondary hover:bg-gray-200/60 dark:hover:bg-white/10 focus:outline-none transition-all duration-300 border border-gray-300/50 dark:border-white/5"
      onClick={toggleTheme}
    >
      <div className="absolute inset-0 rounded-full bg-gradient-to-br from-brand-200/0 to-brand-300/0 hover:from-brand-200/10 hover:to-brand-300/5 dark:hover:from-brand-700/10 dark:hover:to-brand-800/5 transition-colors duration-300"></div>
      
      <span className="sr-only">Toggle theme</span>
      {theme === 'dark' ? (
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z"
          />
        </svg>
      ) : (
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z"
          />
        </svg>
      )}
    </button>
  );
} 