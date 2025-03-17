'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/providers/auth-provider';
import { usePathname } from 'next/navigation';
import { useTheme } from '@/lib/providers/theme-provider';
import { NAV_ITEMS } from '@/lib/config/navigation';
import MobileMenu from './MobileMenu';
import DesktopMenu from './DesktopMenu';
import ThemeLogo from '../ThemeLogo';
import ThemeToggle from '../ThemeToggle';
import AuthButtons from './AuthButtons';
import { logger } from '@/lib/utils/logger';
import { useCallback } from 'react';

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
  
  // Get visible nav items based on auth state and filter out Home (logo handles home navigation)
  const visibleNavItems = NAV_ITEMS
    .filter(item => (item.public || user) && item.name !== 'Home');

  // Log navigation items when mobile menu opens
  useEffect(() => {
    if (mobileMenuOpen) {
      console.log('Navigation items:', visibleNavItems);
    }
  }, [mobileMenuOpen, visibleNavItems]);

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

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (!mounted) return;
    
    if (mobileMenuOpen) {
      // Lock scroll
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    
    // Clean up
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen, mounted]);

  // Toggle mobile menu
  const toggleMobileMenu = () => {
    setMobileMenuOpen(prev => !prev);
    logger.debug('Mobile menu toggled', { isOpen: !mobileMenuOpen });
  };

  // Handle sign out for auth buttons
  const { signOut: authSignOut } = useAuth();
  const handleSignOut = useCallback(async (): Promise<void> => {
    await authSignOut();
  }, [authSignOut]);

  // Make sure we always have some nav items even if filtering removes all
  const menuItems = visibleNavItems.length > 0 
    ? visibleNavItems 
    : NAV_ITEMS.filter(item => item.public === true && item.name !== 'Home');

  return (
    <nav
      className={`fixed top-0 w-full transition-all duration-300 ${
        isScrolled || mobileMenuOpen
          ? 'bg-light-bg-card/90 backdrop-blur-md dark:bg-dark-bg-card/90 shadow-sm'
          : 'bg-transparent'
      }`}
      style={{ position: 'fixed', height: '60px', zIndex: mobileMenuOpen ? 900 : 990 }}
    >
      <div className="mx-auto flex h-full max-w-7xl items-center px-4 sm:px-6 lg:px-8">
        {/* Container with centered items */}
        <div className="w-full flex items-center justify-between md:justify-center relative">
          {/* Logo - Absolute positioned on desktop for proper centering of nav items */}
          <div className="flex items-center md:absolute md:left-0">
            <ThemeLogo 
              width={100} 
              height={25}
              className="transition-all duration-300" 
            />
          </div>

          {/* Desktop navigation - Centered */}
          <DesktopMenu 
            navItems={menuItems} 
            pathname={pathname} 
            user={user} 
            loading={loading} 
            isScrolled={isScrolled}
          />

          {/* Right side section: Theme toggle, Auth buttons (desktop) & Mobile menu button */}
          <div className="md:absolute md:right-0 flex items-center">
            {/* Desktop theme toggle and auth buttons */}
            <div className="hidden md:flex items-center">
              <div className="mr-4">
                <ThemeToggle />
              </div>
              <AuthButtons user={user} onSignOut={handleSignOut} />
            </div>
            
            {/* Mobile navigation */}
            <MobileMenu 
              isOpen={mobileMenuOpen}
              toggle={toggleMobileMenu}
              navItems={menuItems}
              pathname={pathname}
              user={user}
              loading={loading}
              isScrolled={isScrolled}
            />
          </div>
        </div>
      </div>
    </nav>
  );
} 