/**
 * app-enhancements.ts
 * 
 * Collection of utility functions to enhance the application's user experience
 * and provide a more native-like feel.
 */

/**
 * Prevents the default context menu in specified elements
 * @param selector - CSS selector for elements to disable context menu
 * @param exceptions - CSS selector for elements where context menu should still work
 */
export function preventContextMenu(selector: string = 'body', exceptions: string = '.allow-context-menu') {
  if (typeof window === 'undefined') return;
  
  document.addEventListener('contextmenu', (e) => {
    const target = e.target as HTMLElement;
    // Allow context menu if the element or its parent has the exception class
    if (target?.closest?.(exceptions)) return;
    
    // Block context menu if the element matches the selector
    if (target?.closest?.(selector)) {
      e.preventDefault();
      return false;
    }
  });
}

/**
 * Prevents image dragging across the application
 */
export function preventImageDrag() {
  if (typeof window === 'undefined') return;
  
  document.addEventListener('dragstart', (e) => {
    if (e.target instanceof HTMLImageElement) {
      e.preventDefault();
    }
  });
}

/**
 * Prevents iOS-style double-tap zoom
 * By adding a quick touchend handler that prevents
 * default when taps are close together
 */
export function preventDoubleTapZoom() {
  if (typeof window === 'undefined') return;
  
  let lastTapTime = 0;
  const DOUBLE_TAP_THRESHOLD = 300; // milliseconds
  
  document.addEventListener('touchend', (e) => {
    const currentTime = new Date().getTime();
    const tapLength = currentTime - lastTapTime;
    
    if (tapLength < DOUBLE_TAP_THRESHOLD && tapLength > 0) {
      e.preventDefault();
    }
    
    lastTapTime = currentTime;
  });
}

/**
 * Prevents bounce scrolling effect on iOS/macOS
 */
export function preventBounceScroll() {
  if (typeof window === 'undefined') return;
  
  document.body.style.overscrollBehavior = 'none';
  
  // For iOS Safari which doesn't support overscroll-behavior
  document.addEventListener('touchmove', (e) => {
    // Allow scrolling within scrollable elements
    if (isScrollable(e.target as HTMLElement)) return;
    
    // Prevent pull-to-refresh
    if (document.documentElement.scrollTop === 0 && document.documentElement.scrollLeft === 0) {
      e.preventDefault();
    }
  }, { passive: false });
}

/**
 * Checks if an element is scrollable
 */
function isScrollable(element: HTMLElement | null): boolean {
  while (element) {
    if (element === document.body) return true;
    
    const style = window.getComputedStyle(element);
    const overflowY = style.getPropertyValue('overflow-y');
    const overflowX = style.getPropertyValue('overflow-x');
    
    if (
      overflowY === 'scroll' || 
      overflowY === 'auto' || 
      overflowX === 'scroll' || 
      overflowX === 'auto'
    ) {
      const hasVerticalScroll = element.scrollHeight > element.clientHeight;
      const hasHorizontalScroll = element.scrollWidth > element.clientWidth;
      if (hasVerticalScroll || hasHorizontalScroll) return true;
    }
    
    element = element.parentElement;
  }
  
  return false;
}

/**
 * Sets custom scrollbar styles for WebKit browsers
 */
export function setCustomScrollbarStyles() {
  if (typeof window === 'undefined') return;
  
  const style = document.createElement('style');
  style.textContent = `
    ::-webkit-scrollbar {
      width: 6px;
      height: 6px;
    }
    ::-webkit-scrollbar-track {
      background: transparent;
    }
    ::-webkit-scrollbar-thumb {
      background-color: rgba(203, 213, 225, 0.4);
      border-radius: 9999px;
    }
    ::-webkit-scrollbar-thumb:hover {
      background-color: rgba(148, 163, 184, 0.6);
    }
    @media (prefers-color-scheme: dark) {
      ::-webkit-scrollbar-thumb {
        background-color: rgba(71, 85, 105, 0.4);
      }
      ::-webkit-scrollbar-thumb:hover {
        background-color: rgba(100, 116, 139, 0.6);
      }
    }
  `;
  document.head.appendChild(style);
}

/**
 * Function to initialize all app enhancements
 */
export function initAppEnhancements() {
  preventContextMenu();
  preventImageDrag();
  preventDoubleTapZoom();
  preventBounceScroll();
  setCustomScrollbarStyles();
}

// Export a react hook version for component-level usage
export function useAppEnhancements() {
  if (typeof window === 'undefined') return;
  
  // Only run once on client side
  if ((window as any).__APP_ENHANCEMENTS_INITIALIZED__) return;
  (window as any).__APP_ENHANCEMENTS_INITIALIZED__ = true;
  
  initAppEnhancements();
} 