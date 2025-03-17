'use client';

import { useState } from 'react';
import { User } from '@supabase/supabase-js';
import Button from '../ui/Button';
import AccountModal from '../modals/AccountModal';
import { motion } from 'framer-motion';

interface AccountButtonProps {
  user: User | null;
  onSignOut: () => Promise<void>;
  mobile?: boolean;
}

export default function AccountButton({ user, onSignOut, mobile = false }: AccountButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  if (!user) return null;

  const buttonClasses = mobile
    ? 'w-full py-3 justify-center text-base font-medium'
    : '';

  return (
    <>
      <motion.div
        whileHover={{ scale: mobile ? 1 : 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <Button
          variant="glass"
          size={mobile ? "md" : "sm"}
          onClick={() => setIsModalOpen(true)}
          className={`
            ${buttonClasses} 
            bg-gray-200/30 dark:bg-white/5 
            border-gray-300/30 dark:border-white/5 
            hover:bg-gray-200/50 dark:hover:bg-white/10
            transition-all duration-300
            flex items-center space-x-2
          `}
        >
          <div className="flex items-center justify-center">
            <div className="w-6 h-6 bg-brand-400 dark:bg-brand-600 rounded-full flex items-center justify-center text-white text-xs mr-2 shadow-sm">
              {user.email?.charAt(0).toUpperCase() || 'U'}
            </div>
            <span className="truncate max-w-[120px]">{user.email?.split('@')[0]}</span>
          </div>
        </Button>
      </motion.div>

      <AccountModal
        user={user}
        onSignOut={onSignOut}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
} 