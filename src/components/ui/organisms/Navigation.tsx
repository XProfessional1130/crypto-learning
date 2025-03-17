'use client';

import Link from 'next/link';
import { useNavigation } from '@/hooks/useNavigation';
import NavLink from '../atoms/NavLink';
import ThemeToggle from '../atoms/ThemeToggle';
import Button from '../atoms/Button';

export default function Navigation() {
  const {
    user,
    pathname,
    visibleNavItems,
    mobileMenuOpen,
    handleSignOut,
    toggleMobileMenu,
    closeMobileMenu,
  } = useNavigation();

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
            {user ? (
              <Button
                variant="secondary"
                size="sm"
                onClick={handleSignOut}
              >
                Sign Out
              </Button>
            ) : (
              <Button
                variant="primary"
                size="sm"
                onClick={() => window.location.href = '/auth'}
              >
                Sign In
              </Button>
            )}
          </div>
          
          <div className="-mr-2 flex items-center space-x-2 sm:hidden">
            <ThemeToggle />
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleMobileMenu}
              aria-expanded={mobileMenuOpen}
            >
              <span className="sr-only">Open main menu</span>
              {!mobileMenuOpen ? (
                <svg className="block h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                </svg>
              ) : (
                <svg className="block h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="sm:hidden">
          <div className="space-y-1 pb-3 pt-2">
            {visibleNavItems.map((item) => (
              <NavLink
                key={item.name}
                href={item.href}
                active={pathname === item.href}
                className="block border-l-4 py-2 pl-3 pr-4"
                onClick={closeMobileMenu}
              >
                {item.name}
              </NavLink>
            ))}
          </div>
          <div className="border-t border-white/10 pb-3 pt-4">
            {user ? (
              <Button
                variant="secondary"
                size="sm"
                onClick={handleSignOut}
                className="block w-full"
              >
                Sign Out
              </Button>
            ) : (
              <Button
                variant="primary"
                size="sm"
                onClick={() => window.location.href = '/auth'}
                className="block w-full"
              >
                Sign In
              </Button>
            )}
          </div>
        </div>
      )}
    </nav>
  );
} 