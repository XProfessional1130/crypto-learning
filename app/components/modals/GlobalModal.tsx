'use client';

import { useEffect } from 'react';
import { useModal } from '@/lib/context/modal-context';
import { motion, AnimatePresence } from 'framer-motion';

export default function GlobalModal() {
  const { isOpen, content, closeModal } = useModal();

  // Close modal when escape key is pressed
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) closeModal();
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, closeModal]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop with glass effect */}
          <motion.div
            className="fixed inset-0 z-40 backdrop-blur-xl bg-white/15 dark:bg-black/20 shadow-lg"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={closeModal}
            aria-hidden="true"
          />
          
          {/* Modal */}
          <motion.div 
            className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div 
              className="relative max-w-lg w-full pointer-events-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {content}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
} 