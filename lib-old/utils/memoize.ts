import React from 'react';

/**
 * memoize - Utility for memoizing React components with proper typing
 * Wraps React.memo with optional custom comparison function
 */
export function memoize<P extends object>(
  Component: React.ComponentType<P>,
  propsAreEqual?: (prevProps: Readonly<P>, nextProps: Readonly<P>) => boolean
): React.MemoExoticComponent<React.ComponentType<P>> {
  return React.memo(Component, propsAreEqual);
}

/**
 * createDeepEqualityFn - Creates a deep equality comparison function for props
 * Useful for memoizing components with complex props
 * @param keys - Optional array of keys to compare (if not provided, all keys are compared)
 */
export function createDeepEqualityFn<T extends object>(keys?: (keyof T)[]) {
  return (prevProps: Readonly<T>, nextProps: Readonly<T>): boolean => {
    // If keys are provided, only compare those keys
    if (keys) {
      return keys.every(key => {
        return deepEqual(prevProps[key], nextProps[key]);
      });
    }
    
    // Otherwise compare all keys
    const allKeys = new Set([...Object.keys(prevProps), ...Object.keys(nextProps)]);
    
    return Array.from(allKeys).every(key => {
      return deepEqual(prevProps[key as keyof T], nextProps[key as keyof T]);
    });
  };
}

/**
 * deepEqual - Deep equality comparison for objects
 * Compares objects recursively for equality
 */
function deepEqual(obj1: any, obj2: any): boolean {
  // Handle primitive types
  if (obj1 === obj2) return true;
  
  // Handle null/undefined
  if (obj1 == null || obj2 == null) return obj1 === obj2;
  
  // Handle different types
  if (typeof obj1 !== typeof obj2) return false;
  
  // Handle dates
  if (obj1 instanceof Date && obj2 instanceof Date) {
    return obj1.getTime() === obj2.getTime();
  }
  
  // Handle arrays
  if (Array.isArray(obj1) && Array.isArray(obj2)) {
    if (obj1.length !== obj2.length) return false;
    return obj1.every((item, index) => deepEqual(item, obj2[index]));
  }
  
  // Handle objects
  if (typeof obj1 === 'object' && typeof obj2 === 'object') {
    const keys1 = Object.keys(obj1);
    const keys2 = Object.keys(obj2);
    
    if (keys1.length !== keys2.length) return false;
    
    return keys1.every(key => {
      return (
        Object.prototype.hasOwnProperty.call(obj2, key) &&
        deepEqual(obj1[key], obj2[key])
      );
    });
  }
  
  // Handle other types
  return false;
} 