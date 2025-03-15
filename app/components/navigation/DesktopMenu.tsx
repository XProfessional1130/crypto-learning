'use client';

import { User } from '@supabase/supabase-js';
import NavLink from './NavLink';
import AuthButtons from './AuthButtons';
import ThemeToggle from '../ThemeToggle';
import { NavItem } from '@/types/components/navigation';
import { useAuth } from '@/lib/auth-context';
import { useCallback } from 'react';

interface DesktopMenuProps {
  navItems: NavItem[];
  pathname: string | null;
  user: User | null;
  loading: boolean;
}

/**
 * DesktopMenu - Handles desktop navigation display
 * Shows navigation links and auth buttons on desktop devices
 */
export default function DesktopMenu({ navItems, pathname, user, loading }: DesktopMenuProps) {
  const { signOut: authSignOut } = useAuth();
  
  // Create a wrapper function with the expected return type
  const handleSignOut = useCallback(async (): Promise<void> => {
    await authSignOut();
    // Function explicitly returns void
  }, [authSignOut]);
  
  return (
    <div className="hidden items-center md:flex">
      {/* Desktop navigation links */}
      <div className="hidden space-x-4 md:flex">
        {navItems.map((item) => (
          <NavLink 
            key={item.href} 
            href={item.href} 
            active={pathname === item.href}
          >
            {item.name}
          </NavLink>
        ))}
      </div>
      
      {/* Theme toggle */}
      <div className="ml-4">
        <ThemeToggle />
      </div>
      
      {/* Auth buttons */}
      <div className="ml-4">
        <AuthButtons user={user} onSignOut={handleSignOut} />
      </div>
    </div>
  );
} 