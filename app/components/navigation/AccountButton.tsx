'use client';

import { useState } from 'react';
import { User } from '@supabase/supabase-js';
import Button from '../ui/Button';
import AccountModal from '../modals/AccountModal';

interface AccountButtonProps {
  user: User | null;
  onSignOut: () => Promise<void>;
  mobile?: boolean;
}

export default function AccountButton({ user, onSignOut, mobile = false }: AccountButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  if (!user) return null;

  return (
    <>
      <Button
        variant="glass"
        size={mobile ? "md" : "sm"}
        onClick={() => setIsModalOpen(true)}
        className={`
          ${mobile ? 'w-full' : ''} 
          bg-gray-200/40 dark:bg-white/5 
          border-gray-300/50 dark:border-white/5 
          hover:bg-gray-200/60 dark:hover:bg-white/10
          flex items-center space-x-2
        `}
      >
        <div className="flex items-center">
          <div className="w-5 h-5 bg-brand-400 dark:bg-brand-600 rounded-full flex items-center justify-center text-white text-xs mr-2">
            {user.email?.charAt(0).toUpperCase() || 'U'}
          </div>
          <span>{user.email?.split('@')[0]}</span>
        </div>
      </Button>

      <AccountModal
        user={user}
        onSignOut={onSignOut}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
} 