'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { usePathname } from 'next/navigation';
import { useTheme } from '@/lib/theme-context';
import { NAV_ITEMS } from '@/lib/config/navigation';
import MobileMenu from './MobileMenu';
import DesktopMenu from './DesktopMenu';
import ThemeLogo from '../ThemeLogo';
import { logger } from '@/lib/utils/logger';

/**
 * NavigationContainer - Main navigation container component
 * Handles state management and layout for the navigation
 */
export default function NavigationContainer() {
  // State management
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  
  // Hooks
  const { user, loading } = useAuth();
  const { theme } = useTheme();
  const pathname = usePathname();
  
  // Get visible nav items based on auth state
  const visibleNavItems = NAV_ITEMS.filter(item => item.public || user);

  // Mark as mounted to enable client-side behaviors
  useEffect(() => {
    setMounted(true);
  }, []);

  // Handle scroll events only after mounting to avoid hydration issues
  useEffect(() => {
    if (!mounted) return;
    
    // Use requestAnimationFrame to debounce scroll events for better performance
    let rafId: number;
    
    const handleScroll = () => {
      // Cancel any pending animation frame
      if (rafId) {
        cancelAnimationFrame(rafId);
      }
      
      // Schedule new animation frame
      rafId = requestAnimationFrame(() => {
        setIsScrolled(window.scrollY > 10);
      });
    };
    
    // Add scroll listener
    window.addEventListener('scroll', handleScroll);
    
    // Initial check
    handleScroll();
    
    // Clean up
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (rafId) {
        cancelAnimationFrame(rafId);
      }
    };
  }, [mounted]);

  // Toggle mobile menu
  const toggleMobileMenu = () => {
    setMobileMenuOpen(prev => !prev);
    logger.debug('Mobile menu toggled', { isOpen: !mobileMenuOpen });
  };

  return (
    <nav
      className={`fixed top-0 z-50 w-full transition-all duration-300 ${
        isScrolled
          ? 'bg-light-bg-card/80 backdrop-blur dark:bg-dark-bg-card/80'
          : 'bg-transparent'
      }`}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        {/* Logo */}
        <div className="flex items-center">
          <ThemeLogo className="h-8 w-auto" />
        </div>

        {/* Desktop navigation */}
        <DesktopMenu 
          navItems={visibleNavItems} 
          pathname={pathname} 
          user={user} 
          loading={loading} 
        />

        {/* Mobile navigation */}
        <MobileMenu 
          isOpen={mobileMenuOpen}
          toggle={toggleMobileMenu}
          navItems={visibleNavItems}
          pathname={pathname}
          user={user}
          loading={loading}
        />
      </div>
    </nav>
  );
} 