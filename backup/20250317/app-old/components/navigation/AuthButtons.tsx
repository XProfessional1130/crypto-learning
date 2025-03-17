'use client';

import { User } from '@supabase/supabase-js';
import Link from 'next/link';
import Button from '../ui/Button';
import AccountButton from './AccountButton';
import { motion } from 'framer-motion';

interface AuthButtonsProps {
  user: User | null;
  onSignOut: () => Promise<void>;
  mobile?: boolean;
}

export default function AuthButtons({ user, onSignOut, mobile = false }: AuthButtonsProps) {
  if (user) {
    return <AccountButton user={user} onSignOut={onSignOut} mobile={mobile} />;
  }

  const containerClass = mobile 
    ? 'space-y-3' 
    : 'flex items-center space-x-3';

  const buttonClasses = mobile 
    ? 'w-full justify-center py-3 text-base font-medium' 
    : '';

  return (
    <motion.div 
      className={containerClass}
      initial={false}
    >
      <Button
        href="/auth/signin"
        variant="glass"
        size={mobile ? "md" : "sm"}
        className={`${buttonClasses} bg-gray-200/30 dark:bg-white/5 border-gray-300/30 dark:border-white/5 hover:bg-gray-200/50 dark:hover:bg-white/10 transition-all duration-300`}
      >
        Sign in
      </Button>
      <Button
        href="/auth/signin"
        variant="primary"
        size={mobile ? "md" : "sm"}
        className={`${buttonClasses} shadow-sm shadow-brand-300/30 dark:shadow-brand-700/20 transition-all duration-300`}
      >
        Sign up
      </Button>
    </motion.div>
  );
} 