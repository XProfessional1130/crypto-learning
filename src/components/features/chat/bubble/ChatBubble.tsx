'use client';

import { useEffect, useState } from 'react';
import { useTheme } from '@/providers/theme-provider';
import { EdgeIndicator } from './EdgeIndicator';
import { FirstTimeHint } from './FirstTimeHint';
import { useMobileDetection } from './useMobileDetection';

interface ChatBubbleProps {
  onClick: () => void;
  unreadMessages?: number;
  showPulse?: boolean;
}

export default function ChatBubble({ onClick, unreadMessages = 0, showPulse = false }: ChatBubbleProps) {
  const { theme } = useTheme();
  const isDarkMode = theme === 'dark';
  const { isMobile, handleTouchStart, handleTouchMove, handleTouchEnd } = useMobileDetection();
  const [showEdgeIndicator, setShowEdgeIndicator] = useState(true);

  // Function to temporarily hide the edge indicator
  const hideEdgeIndicatorTemporarily = () => {
    setShowEdgeIndicator(false);
    setTimeout(() => {
      setShowEdgeIndicator(true);
    }, 5 * 60 * 1000);
  };

  // Function to make the edge indicator visible when chat is closed
  const showEdgeIndicatorWithFade = () => {
    if (!showEdgeIndicator) {
      setShowEdgeIndicator(true);
    }
  };

  // Expose the showEdgeIndicatorWithFade function to the window object
  useEffect(() => {
    if (isMobile && typeof window !== 'undefined') {
      (window as any).showChatEdgeIndicator = showEdgeIndicatorWithFade;
    }
    
    return () => {
      if (typeof window !== 'undefined') {
        delete (window as any).showChatEdgeIndicator;
      }
    };
  }, [isMobile, showEdgeIndicator]);

  // Set up touch event listeners
  useEffect(() => {
    if (!isMobile) return;

    document.addEventListener('touchstart', handleTouchStart);
    document.addEventListener('touchmove', handleTouchMove);
    document.addEventListener('touchend', handleTouchEnd);

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isMobile, handleTouchStart, handleTouchMove, handleTouchEnd]);

  return (
    <>
      {isMobile && showEdgeIndicator && (
        <EdgeIndicator
          onClick={onClick}
          onHide={hideEdgeIndicatorTemporarily}
        />
      )}
      <FirstTimeHint onDismiss={() => {}} />
    </>
  );
} 