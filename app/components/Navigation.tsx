'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { usePathname } from 'next/navigation';
import NavLink from './navigation/NavLink';
import MobileMenu from './navigation/MobileMenu';
import AuthButtons from './navigation/AuthButtons';
import ThemeToggle from './ThemeToggle';
import ThemeLogo from './ThemeLogo';
import { supabase } from '@/lib/supabase';

// Navigation items - moved outside component to avoid recreation on each render
const navItems = [
  { name: 'Home', href: '/', public: true },
  { name: 'Dashboard', href: '/dashboard', public: false },
  { name: 'LC Dashboard', href: '/lc-dashboard', public: false },
  { name: 'Chat', href: '/chat', public: false },
  { name: 'Resources', href: '/resources', public: true },
  { name: 'Discounts', href: '/discounts', public: true },
  { name: 'About', href: '/about', public: true },
];

export default function Navigation() {
  const { user, signOut } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();

  // Get visible nav items based on auth state
  const visibleNavItems = navItems.filter(item => item.public || user);

  useEffect(() => {
    // Add scroll event listener to handle navbar appearance
    const handleScroll = () => {
      const isScrolled = window.scrollY > 20;
      if (isScrolled !== scrolled) {
        setScrolled(isScrolled);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [scrolled]);

  const handleSignOut = async () => {
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
  };

  return (
    <nav 
      className={`fixed inset-x-0 top-0 z-40 transition-all duration-500 ${
        scrolled 
          ? 'backdrop-blur-xl bg-white/20 dark:bg-dark-bg-primary/25 border-b border-white/20 dark:border-white/5 shadow-lg animate-none' 
          : 'backdrop-blur-md bg-white/5 dark:bg-dark-bg-primary/10 border-b border-transparent animate-blur-in'
      }`}
    >
      {/* Light reflections and effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className={`absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/30 dark:via-white/10 to-transparent transition-opacity duration-500 ${scrolled ? 'opacity-100' : 'opacity-0'}`}></div>
        <div className="absolute left-0 right-0 bottom-0 h-[1px] bg-gradient-to-r from-transparent via-brand-200/30 dark:via-brand-700/20 to-transparent opacity-50"></div>
        <div className="absolute top-0 right-0 w-[40%] h-[50%] bg-gradient-to-br from-white/5 dark:from-white/3 to-transparent rounded-bl-full opacity-50"></div>
      </div>
      
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative">
        <div className="flex h-20 justify-between items-center">
          <div className="flex items-center">
            <div className="flex flex-shrink-0 items-center relative">
              {/* Logo glow effect */}
              <div className="absolute -inset-3 bg-brand-300/10 dark:bg-brand-700/20 rounded-full blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              
              {/* Animated logo */}
              <div className="relative group">
                <div className="absolute -inset-2 bg-gradient-to-br from-brand-200/20 to-brand-300/5 dark:from-brand-700/10 dark:to-brand-800/5 rounded-full blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <ThemeLogo width={180} height={40} />
              </div>
            </div>
            
            <div className="hidden sm:ml-10 sm:flex sm:space-x-2">
              {visibleNavItems.map((item) => (
                <NavLink 
                  key={item.name}
                  href={item.href}
                  active={pathname === item.href}
                  className="px-4 py-2 text-sm font-medium transition-all duration-300 mx-1 rounded-full hover:text-brand-primary dark:hover:text-brand-light hover:bg-white/10 dark:hover:bg-dark-bg-accent/10"
                  activeClassName="text-brand-primary dark:text-brand-light font-semibold bg-white/10 dark:bg-dark-bg-accent/10"
                >
                  <span className="relative">
                    {item.name}
                    {pathname === item.href && (
                      <span className="absolute -bottom-1 left-0 right-0 h-[2px] bg-gradient-to-r from-brand-primary to-brand-light rounded-full"></span>
                    )}
                  </span>
                </NavLink>
              ))}
            </div>
          </div>
          
          <div className="hidden sm:ml-6 sm:flex sm:items-center space-x-5">
            <div className="relative p-1 rounded-full transition-all duration-300 group">
              <div className="absolute inset-0 bg-white/0 group-hover:bg-white/5 dark:group-hover:bg-dark-bg-accent/10 rounded-full transition-colors duration-300"></div>
              <ThemeToggle />
            </div>
            
            <div className="relative">
              <div className="absolute -inset-3 rounded-full bg-gradient-to-r from-brand-200/0 to-brand-300/0 dark:from-brand-700/0 dark:to-brand-800/0 hover:from-brand-200/10 hover:to-brand-300/5 dark:hover:from-brand-700/10 dark:hover:to-brand-800/5 blur-md transition-colors duration-300"></div>
              <AuthButtons user={user} onSignOut={handleSignOut} />
            </div>
          </div>
          
          <div className="-mr-2 flex items-center space-x-2 sm:hidden">
            <div className="relative p-1 rounded-full transition-all duration-300 hover:bg-white/5 dark:hover:bg-dark-bg-accent/10">
              <ThemeToggle />
            </div>
            {/* Mobile menu button with enhanced styling */}
            <button
              type="button"
              className="relative inline-flex items-center justify-center rounded-full p-2 text-light-text-secondary dark:text-dark-text-secondary hover:bg-white/10 dark:hover:bg-dark-bg-accent/30 hover:text-brand-primary dark:hover:text-brand-light focus:outline-none transition-all duration-300"
              aria-expanded="false"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <span className="sr-only">Open main menu</span>
              {/* Icon when menu is closed */}
              {!mobileMenuOpen ? (
                <svg className="block h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                </svg>
              ) : (
                <svg className="block h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Enhanced mobile menu with smooth transitions */}
      <div 
        className={`sm:hidden transition-all duration-500 overflow-hidden ${
          mobileMenuOpen ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        {mobileMenuOpen && (
          <MobileMenu 
            navItems={visibleNavItems} 
            user={user}
            pathname={pathname} 
            onSignOut={handleSignOut} 
            onItemClick={() => setMobileMenuOpen(false)} 
          />
        )}
      </div>
    </nav>
  );
} 