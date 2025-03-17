'use client';

import { useEffect } from 'react';

/**
 * AppEnhancer
 * 
 * Client component that adds app-like behaviors and enhancements
 * Optimized for mobile performance with better event handling
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
    const handleContextMenu = (e: MouseEvent) => {
      // Allow context menu in text areas and inputs
      const target = e.target as HTMLElement;
      if (target?.tagName === 'TEXTAREA' || target?.tagName === 'INPUT') {
        return;
      }
      e.preventDefault();
    };
    
    // Prevent image dragging
    const handleDragStart = (e: DragEvent) => {
      if (e.target instanceof HTMLImageElement) {
        e.preventDefault();
      }
    };
    
    // Use requestAnimationFrame for debounced resize handler
    // This provides much better performance, especially on mobile
    let rafId: number;
    let resizeTimer: NodeJS.Timeout;
    
    const handleResize = () => {
      // Cancel any pending animation frame
      if (rafId) {
        cancelAnimationFrame(rafId);
      }
      
      // Schedule the resize handler in the next animation frame
      rafId = requestAnimationFrame(() => {
        // Add class to disable animations during resize for better performance
        document.body.classList.add('resize-animation-stopper');
        
        // Clear previous timeout
        clearTimeout(resizeTimer);
        
        // Set new timeout with debounce
        resizeTimer = setTimeout(() => {
          document.body.classList.remove('resize-animation-stopper');
        }, 400);
      });
    };
    
    // Add event listeners with passive option for better mobile performance
    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('dragstart', handleDragStart);
    window.addEventListener('resize', handleResize, { passive: true });
    
    // Add touch event handling optimizations
    document.addEventListener('touchstart', () => {}, { passive: true });
    document.addEventListener('touchmove', () => {}, { passive: true });
    
    // Clean up all event listeners and timers on unmount
    return () => {
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('dragstart', handleDragStart);
      document.removeEventListener('touchstart', () => {});
      document.removeEventListener('touchmove', () => {});
      
      if (rafId) {
        cancelAnimationFrame(rafId);
      }
      clearTimeout(resizeTimer);
    };
  }, []);
  
  return null;
} 