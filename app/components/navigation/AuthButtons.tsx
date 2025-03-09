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
      <div className={mobile ? 'space-y-2' : 'flex items-center space-x-4'}>
        <span className="text-sm text-light-text-secondary dark:text-dark-text-secondary">
          {user.email}
        </span>
        <Button
          variant="ghost"
          size={mobile ? "md" : "sm"}
          onClick={onSignOut}
          className={mobile ? 'w-full justify-start' : ''}
        >
          Sign out
        </Button>
      </div>
    );
  }

  return (
    <div className={mobile ? 'space-y-2' : 'flex items-center space-x-4'}>
      <Button
        href="/auth/signin"
        variant="ghost"
        size={mobile ? "md" : "sm"}
        className={mobile ? 'w-full justify-start' : ''}
      >
        Sign in
      </Button>
      <Button
        href="/auth/signin"
        variant="glass"
        size={mobile ? "md" : "sm"}
        className={mobile ? 'w-full justify-start' : ''}
      >
        Sign up
      </Button>
    </div>
  );
} 