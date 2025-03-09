'use client';

import { User } from '@supabase/supabase-js';
import Link from 'next/link';
import Button from '../ui/Button';

interface AuthButtonsProps {
  user: User | null;
  onSignOut: () => Promise<void>;
}

export default function AuthButtons({ user, onSignOut }: AuthButtonsProps) {
  if (user) {
    return (
      <div className="flex items-center space-x-3">
        <span className="text-sm text-light-text-secondary dark:text-dark-text-secondary">
          {user.email?.split('@')[0]}
        </span>
        <Button onClick={onSignOut} variant="outline" size="sm">
          Sign out
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-4">
      <Link href="/auth/signin" className="text-sm font-medium text-light-text-secondary dark:text-dark-text-secondary hover:text-brand-primary">
        Sign in
      </Link>
      <Button href="/auth/signup" size="sm">
        Sign up
      </Button>
    </div>
  );
} 