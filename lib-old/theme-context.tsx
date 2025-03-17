'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

// Create context with default values to prevent undefined context errors
const ThemeContext = createContext<ThemeContextType>({
  theme: 'light',
  setTheme: () => {},
  toggleTheme: () => {},
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>('light');
  const [mounted, setMounted] = useState(false);

  // Initial setup - check for system preference
  useEffect(() => {
    // This runs on client-side only
    try {
      const storedTheme = localStorage.getItem('theme') as Theme | null;
      
      if (storedTheme && (storedTheme === 'dark' || storedTheme === 'light')) {
        setTheme(storedTheme);
      } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        setTheme('dark');
      }
    } catch (e) {
      // Handle any localStorage errors safely
      console.error('Error accessing localStorage:', e);
    }
    
    setMounted(true);
  }, []);

  // Update localStorage and apply theme class when theme changes
  useEffect(() => {
    if (!mounted) return;
    
    try {
      // Save to localStorage
      localStorage.setItem('theme', theme);
      
      // Ensure we're on the client side
      if (typeof document !== 'undefined') {
        // Apply the theme by adding/removing the class
        const htmlElement = document.documentElement;
        
        // Force immediate class change by removing first then adding
        htmlElement.classList.remove('dark');
        htmlElement.classList.remove('light');
        
        if (theme === 'dark') {
          htmlElement.classList.add('dark');
        } else {
          htmlElement.classList.add('light'); // Also explicitly add light class
        }
        
        // Force a repaint by applying a style change
        document.body.style.cssText = "transition: background-color 0.2s ease-in-out;";
        
        // Reset it after a short delay
        setTimeout(() => {
          document.body.style.cssText = "";
        }, 50);
        
        console.log('Theme applied:', theme, 'DOM class list:', htmlElement.classList.contains('dark') ? 'dark' : 'light');
      }
    } catch (e) {
      console.error('Error applying theme:', e);
    }
  }, [theme, mounted]);

  const toggleTheme = () => {
    console.log('Toggle theme clicked! Current theme:', theme);
    setTheme(prevTheme => {
      const newTheme = prevTheme === 'light' ? 'dark' : 'light';
      console.log('New theme will be:', newTheme);
      return newTheme;
    });
  };

  // Always wrap children with the context provider, regardless of mounted state
  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
} 