'use client';

import { useState, useEffect } from 'react';

interface UseMobileDetectionResult {
  isMobile: boolean;
  handleTouchStart: (e: TouchEvent) => void;
  handleTouchMove: (e: TouchEvent) => void;
  handleTouchEnd: () => void;
}

export function useMobileDetection(): UseMobileDetectionResult {
  const [isMobile, setIsMobile] = useState(false);
  const [touchStartX, setTouchStartX] = useState(0);

  useEffect(() => {
    const checkIfMobile = () => {
      const isMobileDevice = window.innerWidth <= 768;
      setIsMobile(isMobileDevice);
    };
    
    checkIfMobile();
    window.addEventListener('resize', checkIfMobile);
    
    return () => {
      window.removeEventListener('resize', checkIfMobile);
    };
  }, []);

  const handleTouchStart = (e: TouchEvent) => {
    setTouchStartX(e.touches[0].clientX);
  };

  const handleTouchMove = (e: TouchEvent) => {
    if (!isMobile) return;
    
    const touchEndX = e.touches[0].clientX;
    const diff = touchStartX - touchEndX;
    
    // If swiping from right edge (within 20px) and moving left
    if (touchStartX > window.innerWidth - 20 && diff > 50) {
      // Trigger chat open
      if (typeof window !== 'undefined' && (window as any).openChat) {
        (window as any).openChat();
      }
    }
  };

  const handleTouchEnd = () => {
    setTouchStartX(0);
  };

  return {
    isMobile,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
  };
} 