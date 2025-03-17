'use client';

import { useEffect, useRef } from 'react';
import { initCoinDataService, isCoinDataServiceInitialized } from '@/lib/api/coinmarketcap';
import { useDataCache } from '@/lib/providers/data-cache-provider';

/**
 * DataPrefetcher component that initializes data services on app load
 * This is the PRIMARY component for initializing all data services.
 * This component should be included only once, in the root layout.
 * 
 * UPDATED: Now primarily uses DataCache which gets data from Supabase
 * OPTIMIZED: Faster initialization, prioritized data loading
 */
export default function DataPrefetcher() {
  const { refreshData } = useDataCache();
  const hasInitializedRef = useRef(false);
  const isInitializingRef = useRef(false);
  const refreshTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const verbose = process.env.NODE_ENV === 'development';

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
    };
  }, []);
    
  useEffect(() => {
    // Important: Only run initialization once
    if (hasInitializedRef.current || isInitializingRef.current) {
      if (verbose) {
        console.log('DataPrefetcher: Already initialized or initializing, skipping');
      }
      return;
    }
    
    // Mark as initializing immediately to prevent concurrent attempts
    isInitializingRef.current = true;
    
    // Check for existing initialization by other components
    if (typeof window !== 'undefined' && window.__DATA_SERVICE_INITIALIZED__) {
      if (verbose) {
        console.log('DataPrefetcher: Data services already initialized by another component');
      }
      hasInitializedRef.current = true;
      isInitializingRef.current = false;
      return;
    }
    
    // Set initialization flag now to prevent other components from trying
    if (typeof window !== 'undefined') {
      window.__DATA_SERVICE_INITIALIZING__ = true;
    }
    
    // Initialize data with a longer delay to avoid race conditions
    refreshTimeoutRef.current = setTimeout(async () => {
      try {
        if (verbose) {
          console.log('DataPrefetcher: Initializing data services...');
        }
        
        await refreshData();
        
        if (verbose) {
          console.log('DataPrefetcher: Successfully initialized data services');
        }
        
        // Mark as successfully initialized
        if (typeof window !== 'undefined') {
          window.__DATA_SERVICE_INITIALIZED__ = true;
          window.__DATA_SERVICE_INITIALIZING__ = false;
        }
        
        hasInitializedRef.current = true;
      } catch (error) {
        console.error('Error in DataPrefetcher initialization:', error);
        
        // Try fallback initialization
        try {
          if (!isCoinDataServiceInitialized()) {
            await initCoinDataService();
            if (verbose) {
              console.log('DataPrefetcher: Used fallback initialization');
            }
          }
        } catch (fallbackError) {
          console.error('Fallback initialization also failed:', fallbackError);
        }
        
        // Still mark as initialized to prevent further attempts
        if (typeof window !== 'undefined') {
          window.__DATA_SERVICE_INITIALIZED__ = true;
          window.__DATA_SERVICE_INITIALIZING__ = false;
        }
        
        hasInitializedRef.current = true;
      } finally {
        isInitializingRef.current = false;
      }
    }, 500); // Longer delay to avoid race conditions
    
  }, [refreshData, verbose]);

  // This component doesn't render anything
  return null;
}

// Define this global property
declare global {
  interface Window {
    __DATA_SERVICE_INITIALIZING__?: boolean;
    __DATA_SERVICE_INITIALIZED__?: boolean;
  }
} 