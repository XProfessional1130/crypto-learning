'use client';

import { User } from '@supabase/supabase-js';
import NavLink from './NavLink';
import AuthButtons from './AuthButtons';

interface MobileMenuProps {
  navItems: Array<{ name: string; href: string; public: boolean }>;
  user: User | null;
  pathname: string;
  onSignOut: () => Promise<void>;
  onItemClick: () => void;
}

export default function MobileMenu({
  navItems,
  user,
  pathname,
  onSignOut,
  onItemClick,
}: MobileMenuProps) {
  return (
    <div className="sm:hidden animate-fade-in">
      <div className="space-y-1 pb-3 pt-2">
        {navItems.map((item) => (
          <NavLink
            key={item.name}
            href={item.href}
            active={pathname === item.href}
            onClick={onItemClick}
          >
            {item.name}
          </NavLink>
        ))}
      </div>
      <div className="border-t border-white/10 dark:border-dark-bg-accent/20 pb-3 pt-4">
        <div className="px-4">
          <AuthButtons user={user} onSignOut={onSignOut} mobile />
        </div>
      </div>
    </div>
  );
} 