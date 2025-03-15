'use client';

import { User } from '@supabase/supabase-js';
import { AnimatePresence, motion } from 'framer-motion';
import NavLink from './NavLink';
import AuthButtons from './AuthButtons';
import ThemeToggle from '../ThemeToggle';
import { NavItem } from '@/types/components/navigation';
import { useAuth } from '@/lib/auth-context';
import { useCallback } from 'react';

// Import the NAV_ITEMS directly since we need to know the type
import { NAV_ITEMS } from '@/lib/config/navigation';

// Use the type of NAV_ITEMS items
type NavItemType = typeof NAV_ITEMS[0];

interface MobileMenuProps {
  isOpen: boolean;
  toggle: () => void;
  navItems: NavItem[];
  pathname: string | null;
  user: User | null;
  loading: boolean;
}

/**
 * MobileMenu - Handles mobile navigation display
 * Shows/hides mobile navigation drawer with animation
 */
export default function MobileMenu({ 
  isOpen, 
  toggle, 
  navItems, 
  pathname, 
  user, 
  loading 
}: MobileMenuProps) {
  const { signOut: authSignOut } = useAuth();
  
  // Create a wrapper function with the expected return type
  const handleSignOut = useCallback(async (): Promise<void> => {
    await authSignOut();
    // Function explicitly returns void
  }, [authSignOut]);
  
  // Hamburger icon button
  const renderHamburger = () => (
    <button
      className="text-light-text-primary dark:text-dark-text-primary md:hidden"
      onClick={toggle}
      aria-label="Toggle mobile menu"
    >
      <svg
        className="h-6 w-6"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        {isOpen ? (
          <path d="M6 18L18 6M6 6l12 12" />
        ) : (
          <path d="M4 6h16M4 12h16M4 18h16" />
        )}
      </svg>
    </button>
  );

  return (
    <>
      {/* Mobile hamburger button */}
      <div className="flex items-center md:hidden">
        <div className="mr-2">
          <ThemeToggle />
        </div>
        {renderHamburger()}
      </div>

      {/* Mobile menu drawer */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="absolute left-0 right-0 top-16 bg-light-bg-card dark:bg-dark-bg-card md:hidden"
          >
            <div className="flex flex-col space-y-4 p-4">
              {navItems.map((item) => (
                <NavLink
                  key={item.href}
                  href={item.href}
                  active={pathname === item.href}
                  onClick={toggle}
                >
                  {item.name}
                </NavLink>
              ))}
              <div className="mt-4 border-t border-light-border dark:border-dark-border pt-4">
                <AuthButtons 
                  user={user} 
                  onSignOut={handleSignOut} 
                  mobile={true}
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
} 