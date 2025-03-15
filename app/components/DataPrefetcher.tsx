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

  useEffect(() => {
    // Only run this once
    if (hasInitializedRef.current) {
      return;
    }
    
    // Initialize the coin data service
    const initializeData = async () => {
      try {
        if (!isCoinDataServiceInitialized()) {
          console.log('DataPrefetcher: Initializing coin data service...');
          await initCoinDataService();
          console.log('DataPrefetcher: Data services initialized');
          
          // Set initialization flag to prevent multiple calls
          hasInitializedRef.current = true;
          
          // Refresh data after a small delay to ensure services are ready
          setTimeout(async () => {
            try {
              await refreshData();
              console.log('DataPrefetcher: Data successfully refreshed');
            } catch (err) {
              console.error('Error refreshing data after init:', err);
            }
          }, 1000);
        }
      } catch (error) {
        console.error('Error initializing data services:', error);
      }
    };

    // Initialize on component mount
    if (typeof window !== 'undefined') {
      setTimeout(initializeData, 100);
    }

    return () => {
      // No cleanup needed
    };
  }, [refreshData]);

  // This component doesn't render anything
  return null;
}

// Define this global property
declare global {
  interface Window {
    __DATA_SERVICE_INITIALIZING__?: boolean;
  }
} 