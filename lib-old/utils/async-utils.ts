/**
 * Utility functions for handling async operations
 */

/**
 * A type representing the result of an async operation
 */
export type AsyncResult<T> = {
  data: T | null;
  error: Error | null;
  success: boolean;
};

/**
 * Safely executes an async function and returns a structured result
 * This helps avoid try/catch blocks throughout the codebase
 * 
 * @param asyncFn - The async function to execute
 * @returns A structured result with data, error, and success flag
 */
export async function safeAsync<T>(asyncFn: () => Promise<T>): Promise<AsyncResult<T>> {
  try {
    const data = await asyncFn();
    return {
      data,
      error: null,
      success: true
    };
  } catch (error) {
    console.error('Error in safeAsync:', error);
    return {
      data: null,
      error: error instanceof Error ? error : new Error(String(error)),
      success: false
    };
  }
}

/**
 * Debounces a function to prevent rapid successive calls
 * 
 * @param fn - The function to debounce
 * @param delay - Delay in milliseconds
 * @returns A debounced version of the function
 */
export function debounce<T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout | null = null;
  
  return function(...args: Parameters<T>): void {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    
    timeoutId = setTimeout(() => {
      fn(...args);
      timeoutId = null;
    }, delay);
  };
}

/**
 * Throttles a function to limit how often it can be called
 * 
 * @param fn - The function to throttle
 * @param limit - Minimum time between calls in milliseconds
 * @returns A throttled version of the function
 */
export function throttle<T extends (...args: any[]) => any>(
  fn: T,
  limit: number
): (...args: Parameters<T>) => void {
  let lastCall = 0;
  let timeoutId: NodeJS.Timeout | null = null;
  
  return function(...args: Parameters<T>): void {
    const now = Date.now();
    const timeSinceLastCall = now - lastCall;
    
    if (timeSinceLastCall >= limit) {
      // If enough time has passed, call immediately
      lastCall = now;
      fn(...args);
    } else if (!timeoutId) {
      // Otherwise, schedule a call after the remaining time
      const remaining = limit - timeSinceLastCall;
      timeoutId = setTimeout(() => {
        lastCall = Date.now();
        timeoutId = null;
        fn(...args);
      }, remaining);
    }
  };
} 