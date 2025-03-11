'use client';

import { User } from '@supabase/supabase-js';
import NavLink from './NavLink';
import AuthButtons from './AuthButtons';

interface MobileMenuProps {
  navItems: Array<{ name: string; href: string; public: boolean }>;
  user: User | null;
  pathname: string | null;
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
      <div className="space-y-1 pb-4 pt-3 px-2">
        {navItems.map((item) => (
          <NavLink
            key={item.name}
            href={item.href}
            active={pathname === item.href}
            onClick={onItemClick}
            className="block px-3 py-2.5 text-base font-medium rounded-lg transition-all duration-200 hover:bg-white/10 dark:hover:bg-dark-bg-accent/20 hover:text-brand-primary dark:hover:text-brand-light"
            activeClassName="bg-white/10 dark:bg-dark-bg-accent/20 text-brand-primary dark:text-brand-light font-semibold"
          >
            {item.name}
          </NavLink>
        ))}
      </div>
      <div className="border-t border-white/10 dark:border-white/5 pb-4 pt-4">
        <div className="px-5">
          <AuthButtons user={user} onSignOut={onSignOut} mobile />
        </div>
      </div>
    </div>
  );
} 