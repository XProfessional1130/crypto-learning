'use client';

import { useEffect, useRef } from 'react';
import { initCoinDataService, isCoinDataServiceInitialized } from '@/lib/services/coinmarketcap';
import { useDataCache } from '@/lib/context/data-cache-context';

/**
 * DataPrefetcher component that initializes data services on app load
 * This is the PRIMARY component for initializing all data services.
 * This component should be included only once, in the root layout.
 */
export default function DataPrefetcher() {
  const { refreshData } = useDataCache();
  const hasInitializedRef = useRef(false);
  const refreshTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Only run this once
    if (hasInitializedRef.current) {
      return;
    }

    // Cleanup function for the effect
    return () => {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
    };
  }, []);
    
  useEffect(() => {
    // Only run this once
    if (hasInitializedRef.current) {
      return;
    }
    
    // Check for existing initialization by other components
    if (typeof window !== 'undefined' && window.__DATA_SERVICE_INITIALIZED__) {
      console.log('DataPrefetcher: Data services already initialized by another component');
      hasInitializedRef.current = true;
      
      // Still attempt to refresh data
      refreshTimeoutRef.current = setTimeout(async () => {
        try {
          await refreshData();
          console.log('DataPrefetcher: Data successfully refreshed');
        } catch (err) {
          console.error('Error refreshing data:', err);
        }
      }, 1000);
      
      return;
    }
    
    // Initialize the coin data service
    const initializeData = async () => {
      try {
        // Set global initialization flag
        if (typeof window !== 'undefined') {
          window.__DATA_SERVICE_INITIALIZING__ = true;
        }
        
        if (!isCoinDataServiceInitialized()) {
          console.log('DataPrefetcher: Initializing coin data service...');
          await initCoinDataService();
          console.log('DataPrefetcher: Data services initialized');
          
          // Set global initialized flag
          if (typeof window !== 'undefined') {
            window.__DATA_SERVICE_INITIALIZED__ = true;
            window.__DATA_SERVICE_INITIALIZING__ = false;
          }
          
          // Set initialization flag to prevent multiple calls
          hasInitializedRef.current = true;
          
          // Refresh data after a small delay to ensure services are ready
          refreshTimeoutRef.current = setTimeout(async () => {
            try {
              await refreshData();
              console.log('DataPrefetcher: Data successfully refreshed');
            } catch (err) {
              console.error('Error refreshing data after init:', err);
            }
          }, 1500);
        } else {
          console.log('DataPrefetcher: Services already initialized, just refreshing data');
          
          // Set flags
          hasInitializedRef.current = true;
          if (typeof window !== 'undefined') {
            window.__DATA_SERVICE_INITIALIZED__ = true;
            window.__DATA_SERVICE_INITIALIZING__ = false;
          }
          
          // Just refresh data
          refreshTimeoutRef.current = setTimeout(async () => {
            try {
              await refreshData();
              console.log('DataPrefetcher: Data successfully refreshed');
            } catch (err) {
              console.error('Error refreshing data:', err);
            }
          }, 1000);
        }
      } catch (error) {
        console.error('Error initializing data services:', error);
        
        // Reset flag on error
        if (typeof window !== 'undefined') {
          window.__DATA_SERVICE_INITIALIZING__ = false;
        }
      }
    };

    // Initialize on component mount with a small delay
    if (typeof window !== 'undefined') {
      setTimeout(initializeData, 300);
    }
  }, [refreshData]);

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