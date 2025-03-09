'use client';

import { useTheme } from '@/lib/theme-context';
import { MoonIcon, SunIcon } from './icons';
import { useEffect, useState } from 'react';

export default function ThemeToggle() {
  const { theme, toggleTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  
  // Make sure we have access to the DOM before rendering icons
  useEffect(() => {
    setMounted(true);
  }, []);

  // Handle the click event with a more forceful approach
  const handleToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    
    // Get the current theme from context and log
    console.log('ThemeToggle clicked, current theme from context:', theme);
    
    // Toggle theme through context only - let the context handle all DOM updates
    toggleTheme();
  };

  // Always render the button, but only show the appropriate icon once mounted
  return (
    <button
      onClick={handleToggle}
      className="flex items-center justify-center p-2 rounded-full transition-colors duration-200 hover:bg-gray-100 dark:hover:bg-gray-800"
      aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`}
    >
      {!mounted ? (
        <div className="h-5 w-5" />
      ) : theme === 'dark' ? (
        <SunIcon className="h-5 w-5 text-yellow-400" />
      ) : (
        <MoonIcon className="h-5 w-5 text-slate-700" />
      )}
    </button>
  );
} 