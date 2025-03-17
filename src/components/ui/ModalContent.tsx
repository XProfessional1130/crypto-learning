'use client';

import { ReactNode } from 'react';
import { X } from 'lucide-react';
import { motion } from 'framer-motion';

interface ModalContentProps {
  title: string;
  children: ReactNode;
  onClose: () => void;
  size?: 'sm' | 'md' | 'lg';
  showCloseButton?: boolean;
}

export default function ModalContent({
  title,
  children,
  onClose,
  size = 'md',
  showCloseButton = true,
}: ModalContentProps) {
  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
  };

  return (
    <motion.div
      className={`${sizeClasses[size]} w-full rounded-xl bg-glass-white dark:bg-glass-dark shadow-glass border border-white/20 dark:border-white/10 backdrop-blur-md`}
      initial={{ scale: 0.95, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.95, opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      {/* Subtle inner glow effect */}
      <div className="absolute inset-0 rounded-xl overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent dark:from-white/5 dark:to-transparent"></div>
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/30 dark:via-white/20 to-transparent"></div>
      </div>
      
      <div className="relative p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">{title}</h2>
          {showCloseButton && (
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white transition-colors"
            >
              <X size={24} />
            </button>
          )}
        </div>
        
        <div>
          {children}
        </div>
      </div>
    </motion.div>
  );
} 