'use client';

import Link from 'next/link';
import { User } from '@supabase/supabase-js';

interface NavItem {
  name: string;
  href: string;
  public: boolean;
}

interface MobileMenuProps {
  navItems: NavItem[];
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
  onItemClick
}: MobileMenuProps) {
  return (
    <div className="sm:hidden">
      <div className="space-y-1 pb-3 pt-2">
        {navItems.map((item) => (
          <Link
            key={item.name}
            href={item.href}
            className={`block border-l-4 py-2 pl-3 pr-4 text-base font-medium ${
              pathname === item.href
                ? 'border-brand-primary bg-brand-primary/10 text-brand-primary dark:bg-brand-primary/20 dark:text-brand-light'
                : 'border-transparent text-light-text-secondary dark:text-dark-text-secondary hover:border-light-bg-accent dark:hover:border-dark-bg-accent hover:bg-light-bg-accent/50 dark:hover:bg-dark-bg-accent/50 hover:text-light-text-primary dark:hover:text-dark-text-primary'
            }`}
            onClick={onItemClick}
          >
            {item.name}
          </Link>
        ))}
      </div>
      <div className="border-t border-light-bg-accent dark:border-dark-bg-accent pb-3 pt-4">
        <div className="space-y-1">
          {user ? (
            <>
              <div className="block px-4 py-2 text-base font-medium text-light-text-secondary dark:text-dark-text-secondary">
                {user.email}
              </div>
              <button
                onClick={() => {
                  onSignOut();
                  onItemClick();
                }}
                className="block w-full px-4 py-2 text-left text-base font-medium text-light-text-secondary dark:text-dark-text-secondary hover:bg-light-bg-accent/50 dark:hover:bg-dark-bg-accent/50 hover:text-light-text-primary dark:hover:text-dark-text-primary"
              >
                Sign out
              </button>
            </>
          ) : (
            <>
              <Link
                href="/auth/signin"
                className="block px-4 py-2 text-base font-medium text-light-text-secondary dark:text-dark-text-secondary hover:bg-light-bg-accent/50 dark:hover:bg-dark-bg-accent/50 hover:text-light-text-primary dark:hover:text-dark-text-primary"
                onClick={onItemClick}
              >
                Sign in
              </Link>
              <Link
                href="/auth/signup"
                className="block px-4 py-2 text-base font-medium text-light-text-secondary dark:text-dark-text-secondary hover:bg-light-bg-accent/50 dark:hover:bg-dark-bg-accent/50 hover:text-light-text-primary dark:hover:text-dark-text-primary"
                onClick={onItemClick}
              >
                Sign up
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
} 