'use client';

import { User } from '@supabase/supabase-js';
import Link from 'next/link';
import Button from '../ui/Button';

interface AuthButtonsProps {
  user: User | null;
  onSignOut: () => Promise<void>;
  mobile?: boolean;
}

export default function AuthButtons({ user, onSignOut, mobile = false }: AuthButtonsProps) {
  if (user) {
    return (
      <div className={mobile ? 'space-y-2' : 'flex items-center space-x-3'}>
        {!mobile && (
          <span className="text-xs text-gray-600 dark:text-dark-text-secondary px-2 py-1 rounded-md bg-gray-200/40 dark:bg-white/5 border border-gray-300/50 dark:border-white/5">
            {user.email?.split('@')[0]}
          </span>
        )}
        <Button
          variant="glass"
          size={mobile ? "md" : "sm"}
          onClick={onSignOut}
          className={`${mobile ? 'w-full justify-start' : ''} bg-gray-200/40 dark:bg-white/5 border-gray-300/50 dark:border-white/5 hover:bg-gray-200/60 dark:hover:bg-white/10`}
        >
          Sign out
        </Button>
      </div>
    );
  }

  return (
    <div className={mobile ? 'space-y-2' : 'flex items-center space-x-3'}>
      <Button
        href="/auth/signin"
        variant="glass"
        size={mobile ? "md" : "sm"}
        className={`${mobile ? 'w-full justify-start' : ''} bg-gray-200/40 dark:bg-white/5 border-gray-300/50 dark:border-white/5 hover:bg-gray-200/60 dark:hover:bg-white/10`}
      >
        Sign in
      </Button>
      <Button
        href="/auth/signin"
        variant="primary"
        size={mobile ? "md" : "sm"}
        className={`${mobile ? 'w-full justify-start' : ''} shadow-sm shadow-brand-300/30 dark:shadow-brand-700/20`}
      >
        Sign up
      </Button>
    </div>
  );
} 