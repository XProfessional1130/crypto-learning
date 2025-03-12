'use client';

import { useEffect } from 'react';

/**
 * AppEnhancer
 * 
 * Client component that adds app-like behaviors and enhancements
 * Handles user experience improvements like disabling text selection
 * and preventing unwanted behaviors
 */
export default function AppEnhancer() {
  useEffect(() => {
    // Prevent zoom on focus of inputs on iOS
    const viewportMeta = document.querySelector('meta[name="viewport"]');
    if (viewportMeta) {
      viewportMeta.setAttribute(
        'content',
        'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no'
      );
    }
    
    // Prevent default behaviors for app-like experience
    document.addEventListener('contextmenu', (e) => {
      // Allow context menu in text areas and inputs
      const target = e.target as HTMLElement;
      if (target?.tagName === 'TEXTAREA' || target?.tagName === 'INPUT') {
        return;
      }
      e.preventDefault();
    });
    
    // Prevent image dragging
    document.addEventListener('dragstart', (e) => {
      if (e.target instanceof HTMLImageElement) {
        e.preventDefault();
      }
    });
    
    // Add class to disable animations during window resize for performance
    let resizeTimer: NodeJS.Timeout;
    const handleResize = () => {
      document.body.classList.add('resize-animation-stopper');
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        document.body.classList.remove('resize-animation-stopper');
      }, 400);
    };
    
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('contextmenu', (e) => e.preventDefault());
      document.removeEventListener('dragstart', (e) => {
        if (e.target instanceof HTMLImageElement) e.preventDefault();
      });
    };
  }, []);
  
  return null;
} 