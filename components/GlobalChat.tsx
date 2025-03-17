'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import ChatBubble from './ChatBubble';
import ChatModal from './ChatModal';
import { usePathname } from 'next/navigation';

export default function GlobalChat() {
  const { user, loading } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showPulse, setShowPulse] = useState(false);
  
  // Show pulse effect periodically to attract attention
  useEffect(() => {
    if (!isModalOpen) {
      // Show pulse every 5 minutes if the user hasn't opened the chat
      const pulseInterval = setInterval(() => {
        setShowPulse(true);
        setTimeout(() => setShowPulse(false), 3000); // Pulse for 3 seconds
      }, 300000); // 5 minutes

      // Show initial pulse 10 seconds after loading
      const initialPulseTimeout = setTimeout(() => {
        setShowPulse(true);
        setTimeout(() => setShowPulse(false), 3000);
      }, 10000);

      return () => {
        clearInterval(pulseInterval);
        clearTimeout(initialPulseTimeout);
      };
    }
  }, [isModalOpen]);
  
  // Handle closing the chat modal
  const handleCloseModal = () => {
    setIsModalOpen(false);
    
    // Trigger the edge indicator to reappear with fade-in effect
    // Use setTimeout to ensure this happens after modal transition completes
    setTimeout(() => {
      if (typeof window !== 'undefined' && (window as any).showChatEdgeIndicator) {
        (window as any).showChatEdgeIndicator();
      }
    }, 500); // Wait for modal transition to complete
  };
  
  // If user is not logged in or still loading, don't show chat
  if (loading || !user) {
    return null;
  }
  
  return (
    <>
      <ChatBubble 
        onClick={() => setIsModalOpen(true)} 
        unreadMessages={unreadCount}
        showPulse={showPulse}
      />
      
      <ChatModal 
        isOpen={isModalOpen} 
        onClose={handleCloseModal} 
      />
    </>
  );
} 