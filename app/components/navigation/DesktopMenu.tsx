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
  isScrolled?: boolean;
}

/**
 * DesktopMenu - Handles desktop navigation display
 * Shows navigation links and auth buttons on desktop devices
 */
export default function DesktopMenu({ navItems, pathname, user, loading, isScrolled = false }: DesktopMenuProps) {
  const { signOut: authSignOut } = useAuth();
  
  // Create a wrapper function with the expected return type
  const handleSignOut = useCallback(async (): Promise<void> => {
    await authSignOut();
    // Function explicitly returns void
  }, [authSignOut]);
  
  return (
    <div className="hidden md:flex items-center justify-center">
      {/* Desktop navigation links - centered */}
      <div className="hidden md:flex space-x-8">
        {navItems.map((item) => (
          <NavLink 
            key={item.href} 
            href={item.href} 
            active={pathname === item.href}
            isScrolled={isScrolled}
          >
            {item.name}
          </NavLink>
        ))}
      </div>
      
      {/* Theme toggle and auth buttons are now moved to the right side in NavigationContainer */}
    </div>
  );
} 