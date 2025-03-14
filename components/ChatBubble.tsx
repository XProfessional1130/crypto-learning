'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/lib/theme-context';
import Image from 'next/image';
import styles from './chat.module.css';

interface ChatBubbleProps {
  onClick: () => void;
  unreadMessages?: number;
  showPulse?: boolean;
}

export default function ChatBubble({ onClick, unreadMessages = 0, showPulse = false }: ChatBubbleProps) {
  const { theme } = useTheme();
  const isDarkMode = theme === 'dark';
  const [isMobile, setIsMobile] = useState(false);
  
  // Check if the screen is mobile
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkIfMobile();
    window.addEventListener('resize', checkIfMobile);
    
    return () => {
      window.removeEventListener('resize', checkIfMobile);
    };
  }, []);

  return (
    <motion.div
      className="fixed z-50"
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
      style={{
        bottom: isMobile ? '1.25rem' : '2rem',
        right: isMobile ? '1.25rem' : '2rem',
      }}
    >
      <motion.button
        onClick={onClick}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="relative flex items-center justify-center rounded-full shadow-lg transition-all duration-300 cursor-pointer overflow-hidden"
        style={{
          width: isMobile ? '56px' : '64px',
          height: isMobile ? '56px' : '64px',
          backdropFilter: 'blur(12px)',
          background: isDarkMode 
            ? 'rgba(30, 30, 40, 0.8)' 
            : 'rgba(255, 255, 255, 0.9)',
          boxShadow: isDarkMode 
            ? '0 8px 32px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.05)' 
            : '0 8px 32px rgba(0, 0, 0, 0.1), 0 0 0 1px rgba(0, 0, 0, 0.02)'
        }}
      >
        {/* Chat icon */}
        <motion.div
          animate={{ 
            y: showPulse ? [0, -3, 0] : 0 
          }}
          transition={{ 
            repeat: showPulse ? Infinity : 0, 
            duration: 1.5,
            repeatType: "reverse"
          }}
        >
          <Image 
            src="/images/avatars/tobo-avatar.svg"
            alt="Chat"
            width={isMobile ? 32 : 38}
            height={isMobile ? 32 : 38}
            className="transition-transform duration-300"
          />
        </motion.div>
        
        {/* Unread indicator */}
        <AnimatePresence>
          {unreadMessages > 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.5 }}
              className="absolute -top-1 -right-1 bg-brand-primary text-white text-xs font-bold rounded-full flex items-center justify-center"
              style={{
                minWidth: '22px',
                height: '22px',
                padding: '0 6px',
                boxShadow: '0 2px 6px rgba(0, 0, 0, 0.2)'
              }}
            >
              {unreadMessages}
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Pulse effect */}
        <AnimatePresence>
          {showPulse && (
            <>
              <motion.div
                className="absolute inset-0 rounded-full"
                initial={{ opacity: 0.7, scale: 1 }}
                animate={{ 
                  opacity: 0,
                  scale: 1.5,
                }}
                exit={{ opacity: 0 }}
                transition={{ 
                  repeat: Infinity,
                  duration: 1.5,
                  ease: "easeOut" 
                }}
                style={{
                  background: 'radial-gradient(circle, rgba(77,181,176,0.2) 0%, rgba(77,181,176,0) 70%)',
                  zIndex: -1
                }}
              />
              <motion.div
                className="absolute inset-0 rounded-full"
                initial={{ opacity: 0.5, scale: 1 }}
                animate={{ 
                  opacity: 0,
                  scale: 1.8,
                }}
                exit={{ opacity: 0 }}
                transition={{ 
                  repeat: Infinity,
                  duration: 2,
                  delay: 0.3,
                  ease: "easeOut" 
                }}
                style={{
                  background: 'radial-gradient(circle, rgba(77,181,176,0.15) 0%, rgba(77,181,176,0) 70%)',
                  zIndex: -2
                }}
              />
            </>
          )}
        </AnimatePresence>
      </motion.button>
    </motion.div>
  );
} 