'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { usePathname } from 'next/navigation';
import NavLink from './navigation/NavLink';
import AuthButtons from './navigation/AuthButtons';
import ThemeToggle from './ThemeToggle';
import ThemeLogo from './ThemeLogo';
import { supabase } from '@/lib/supabase';

// Navigation items - moved outside component to avoid recreation on each render
const navItems = [
  { name: 'Home', href: '/', public: true },
  { name: 'Dashboard', href: '/dashboard', public: false },
  { name: 'Hub', href: '/lc-dashboard', public: false },
  { name: 'Chat', href: '/chat', public: false },
  { name: 'Resources', href: '/resources', public: true },
  { name: 'Discounts', href: '/discounts', public: true },
  { name: 'About', href: '/about', public: true },
];

export default function Navigation() {
  // Always initialize with the same state values on both server and client
  const { user, signOut } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();

  // Mark as mounted to enable client-side behaviors
  useEffect(() => {
    setMounted(true);
  }, []);

  // Get visible nav items based on auth state
  const visibleNavItems = navItems.filter(item => item.public || user);

  // Handle scroll events only after mounting to avoid hydration issues
  useEffect(() => {
    if (!mounted) return;
    
    // Use requestAnimationFrame to debounce scroll events for better performance
    let rafId: number;
    let lastScrollY = window.scrollY;
    
    const handleScroll = () => {
      // Cancel any pending animation frame
      if (rafId) {
        cancelAnimationFrame(rafId);
      }
      
      // Schedule the scroll check in the next animation frame
      rafId = requestAnimationFrame(() => {
        const currentScrollY = window.scrollY;
        const isScrolled = currentScrollY > 20;
        
        // Only update state if scroll position crossed our threshold
        if ((currentScrollY > 20 && lastScrollY <= 20) || 
            (currentScrollY <= 20 && lastScrollY > 20)) {
          setScrolled(isScrolled);
        }
        
        lastScrollY = currentScrollY;
      });
    };

    // Initial scroll position check
    handleScroll();
    
    // Use passive event listener to prevent blocking the main thread
    window.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (rafId) {
        cancelAnimationFrame(rafId);
      }
    };
  }, [scrolled, mounted]);

  const handleSignOut = useCallback(async () => {
    try {
      // Direct call to supabase signOut for more reliability
      await supabase.auth.signOut();
      
      // Force reload to homepage - this ensures sign out works even if context is having issues
      console.log("Signing out and forcing page reload");
      window.location.href = '/';
    } catch (err) {
      console.error("Unexpected error during sign out:", err);
      
      // Fallback - attempt force reload even if error
      window.location.href = '/';
    }
  }, []);

  const toggleMobileMenu = useCallback(() => {
    setMobileMenuOpen(prev => !prev);
  }, []);

  return (
    <nav 
      className={`fixed inset-x-0 top-0 z-40 transition-all duration-500 ${
        scrolled 
          ? 'backdrop-blur-xl bg-white/15 dark:bg-black/20 border-b border-gray-300/40 dark:border-white/10 shadow-lg' 
          : 'backdrop-blur-md bg-white/10 dark:bg-black/10 border-b border-gray-300/20 dark:border-transparent'
      }`}
    >
      {/* Glassmorphic effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className={`absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-gray-400/50 dark:via-white/20 to-transparent transition-opacity duration-500 ${scrolled ? 'opacity-100' : 'opacity-30'}`}></div>
        <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-gray-400/40 dark:via-white/10 to-transparent"></div>
        
        {/* Glow spots - fixed for mobile */}
        <div className="absolute -top-20 -left-20 w-40 h-40 bg-brand-300/10 dark:bg-brand-500/20 rounded-full blur-3xl"></div>
        <div className="absolute -top-10 right-20 w-30 h-30 bg-blue-300/5 dark:bg-blue-500/10 rounded-full blur-3xl"></div>
      </div>
      
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative">
        <div className="flex h-16 items-center justify-between">
          {/* Logo and brand section */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center group">
              <div className="relative">
                <div className="absolute -inset-2 bg-gradient-to-br from-brand-200/20 to-brand-300/5 dark:from-brand-600/20 dark:to-brand-800/5 rounded-full blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <ThemeLogo width={140} height={36} />
              </div>
            </Link>
          </div>

          {/* Desktop navigation */}
          <div className="hidden md:flex md:items-center md:space-x-1 px-2 py-1 rounded-full bg-white/10 dark:bg-white/5 backdrop-blur-md border border-gray-300/30 dark:border-white/5 shadow-sm">
            {visibleNavItems.map((item) => (
              <NavLink 
                key={item.name}
                href={item.href}
                active={pathname === item.href}
                className="px-3 py-1.5 text-sm font-medium rounded-full hover:bg-gray-200/40 dark:hover:bg-white/5 flex items-center"
                activeClassName="text-brand-primary dark:text-brand-light font-medium"
              >
                {item.name}
              </NavLink>
            ))}
          </div>

          {/* Right side controls */}
          <div className="flex items-center space-x-3">
            <ThemeToggle />
            
            {/* Auth buttons for desktop */}
            <div className="hidden md:block">
              <AuthButtons user={user} onSignOut={handleSignOut} />
            </div>
            
            {/* Mobile menu button */}
            <button
              type="button"
              className="inline-flex md:hidden items-center justify-center rounded-full p-2 text-light-text-secondary dark:text-dark-text-secondary hover:bg-white/20 dark:hover:bg-white/10 focus:outline-none backdrop-blur-sm border border-gray-300/30 dark:border-white/10 transition-all duration-200 active:scale-95"
              onClick={toggleMobileMenu}
              aria-expanded={mobileMenuOpen}
            >
              <span className="sr-only">Open main menu</span>
              <svg 
                className="h-5 w-5" 
                fill="none" 
                viewBox="0 0 24 24" 
                strokeWidth={1.5} 
                stroke="currentColor"
                aria-hidden="true"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  d={mobileMenuOpen 
                    ? "M6 18L18 6M6 6l12 12" 
                    : "M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
                  } 
                />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu - always rendered but visibility controlled by CSS */}
      <div className={`md:hidden ${mobileMenuOpen ? 'block' : 'hidden'} animate-fade-in mobile-nav-menu`}>
        <div className="backdrop-blur-xl bg-white/75 dark:bg-black/75 border-t border-gray-300/40 dark:border-white/5 px-2 pb-3 pt-2 shadow-lg">
          <div className="space-y-1">
            {visibleNavItems.map((item) => (
              <NavLink
                key={item.name}
                href={item.href}
                active={pathname === item.href}
                onClick={() => {
                  setMobileMenuOpen(false);
                }}
                className="mobile-nav-link block w-full px-3 py-2.5 text-base font-medium rounded-lg hover:bg-gray-200/40 dark:hover:bg-white/5"
                activeClassName="text-brand-primary dark:text-brand-light font-medium bg-gray-200/40 dark:bg-white/5"
              >
                {item.name}
              </NavLink>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-gray-300/30 dark:border-white/5">
            <AuthButtons user={user} onSignOut={handleSignOut} mobile />
          </div>
        </div>
      </div>
    </nav>
  );
} 