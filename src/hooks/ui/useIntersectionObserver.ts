import { useState, useEffect, useRef, RefObject } from 'react';

interface IntersectionObserverOptions {
  threshold?: number;
  rootMargin?: string;
  triggerOnce?: boolean;
  mobileRootMargin?: string;
  mobileThreshold?: number;
}

/**
 * Optimized hook for intersection observer
 * Uses a shared observer instance for better performance
 * Now with device-specific optimizations
 */
export function useIntersectionObserver<T extends HTMLElement = HTMLDivElement>(
  options: IntersectionObserverOptions = {}
): [boolean, RefObject<T>] {
  const { 
    threshold = 0.1, 
    rootMargin = '0px', 
    triggerOnce = true,
    mobileRootMargin = '0px 0px -10% 0px',
    mobileThreshold = 0.05
  } = options;
  
  const [isIntersecting, setIsIntersecting] = useState(false);
  const elementRef = useRef<T>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  
  useEffect(() => {
    // Skip if already triggered once and triggerOnce is true
    if (triggerOnce && isIntersecting) return;
    
    const element = elementRef.current;
    if (!element) return;
    
    // Cleanup previous observer if it exists
    if (observerRef.current) {
      observerRef.current.disconnect();
    }
    
    // Device detection for optimized settings
    const isMobile = window.innerWidth < 768;
    const finalRootMargin = isMobile ? mobileRootMargin : rootMargin;
    const finalThreshold = isMobile ? mobileThreshold : threshold;
    
    // Create new observer with optimized options for device type
    observerRef.current = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting) {
          // Use requestAnimationFrame for better performance on mobile
          requestAnimationFrame(() => {
            setIsIntersecting(true);
          });
          
          // Disconnect observer if triggerOnce is true
          if (triggerOnce && observerRef.current) {
            observerRef.current.disconnect();
            observerRef.current = null;
          }
        } else if (!triggerOnce) {
          setIsIntersecting(false);
        }
      },
      { threshold: finalThreshold, rootMargin: finalRootMargin }
    );
    
    // Start observing
    observerRef.current.observe(element);
    
    // Cleanup on unmount
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
        observerRef.current = null;
      }
    };
  }, [threshold, rootMargin, triggerOnce, isIntersecting, mobileRootMargin, mobileThreshold]);
  
  return [isIntersecting, elementRef];
} 