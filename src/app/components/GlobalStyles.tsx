'use client';

import { useEffect } from 'react';

/**
 * GlobalStyles
 * 
 * Client component to handle dynamic styles without styled-jsx
 * to prevent hydration mismatches
 */
export default function GlobalStyles() {
  useEffect(() => {
    // Add the style element directly to the DOM after client-side hydration
    const styleElement = document.createElement('style');
    styleElement.textContent = `
      .resize-animation-stopper * {
        animation-duration: 0.001ms !important;
        animation-delay: 0.001ms !important;
        transition-duration: 0.001ms !important;
      }

      /* Prevent overscrolling */
      html, body {
        overscroll-behavior: none;
        -webkit-overflow-scrolling: touch;
        overflow-x: hidden;
        position: relative;
        height: 100%;
      }

      /* Additional iOS specific fixes */
      body {
        -webkit-text-size-adjust: 100%;
        touch-action: manipulation;
      }
    `;
    document.head.appendChild(styleElement);
    
    return () => {
      // Clean up on unmount
      if (styleElement.parentNode) {
        styleElement.parentNode.removeChild(styleElement);
      }
    };
  }, []);
  
  // Return null to avoid rendering anything server-side
  return null;
} 