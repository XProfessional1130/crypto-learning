'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { usePathname } from 'next/navigation';
import NavLink from './navigation/NavLink';
import MobileMenu from './navigation/MobileMenu';
import AuthButtons from './navigation/AuthButtons';
import ThemeToggle from './ThemeToggle';
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
  const pathname = usePathname();

  // Get visible nav items based on auth state
  const visibleNavItems = navItems.filter(item => item.public || user);

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
    <nav className="glass animate-blur-in border-b border-white/10 dark:border-dark-bg-accent/20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 justify-between">
          <div className="flex">
            <div className="flex flex-shrink-0 items-center">
              <Link href="/" className="text-xl font-bold text-gradient">
                LearningCrypto
              </Link>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              {visibleNavItems.map((item) => (
                <NavLink 
                  key={item.name}
                  href={item.href}
                  active={pathname === item.href}
                >
                  {item.name}
                </NavLink>
              ))}
            </div>
          </div>
          
          <div className="hidden sm:ml-6 sm:flex sm:items-center space-x-4">
            <ThemeToggle />
            <AuthButtons user={user} onSignOut={handleSignOut} />
          </div>
          
          <div className="-mr-2 flex items-center space-x-2 sm:hidden">
            <ThemeToggle />
            {/* Mobile menu button */}
            <button
              type="button"
              className="inline-flex items-center justify-center rounded-md p-2 nav-link hover:bg-white/10 dark:hover:bg-dark-bg-accent/30 focus:outline-none focus:ring-2 focus:ring-brand-primary"
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

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <MobileMenu 
          navItems={visibleNavItems} 
          user={user}
          pathname={pathname} 
          onSignOut={handleSignOut} 
          onItemClick={() => setMobileMenuOpen(false)} 
        />
      )}
    </nav>
  );
} 