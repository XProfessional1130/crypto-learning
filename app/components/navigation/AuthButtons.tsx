'use client';

import { User } from '@supabase/supabase-js';
import Link from 'next/link';
import Button from '../ui/Button';
import AccountButton from './AccountButton';

interface AuthButtonsProps {
  user: User | null;
  onSignOut: () => Promise<void>;
  mobile?: boolean;
}

export default function AuthButtons({ user, onSignOut, mobile = false }: AuthButtonsProps) {
  if (user) {
    return <AccountButton user={user} onSignOut={onSignOut} mobile={mobile} />;
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