'use client';

import { useEffect } from 'react';
import { initCoinDataService, isCoinDataServiceInitialized } from '@/lib/services/coinmarketcap';

/**
 * DataPrefetcher component that initializes data services on app load
 * This helps improve performance by prefetching commonly used data
 */
export default function DataPrefetcher() {
  useEffect(() => {
    // Initialize the coin data service
    const initializeData = async () => {
      try {
        if (!isCoinDataServiceInitialized()) {
          console.log('DataPrefetcher: Initializing coin data service...');
          await initCoinDataService();
          console.log('DataPrefetcher: Data services initialized');
        } else {
          console.log('DataPrefetcher: Data services already initialized, skipping');
        }
      } catch (error) {
        console.error('Error initializing data services:', error);
      }
    };

    // Wait until after hydration to run data initialization
    if (typeof window !== 'undefined') {
      // Use requestIdleCallback if available for better performance
      if ('requestIdleCallback' in window) {
        (window as any).requestIdleCallback(() => {
          initializeData();
        });
      } else {
        // Fallback to setTimeout
        setTimeout(initializeData, 200);
      }
    }

    return () => {
      // No cleanup needed
    };
  }, []);

  // This component doesn't render anything
  return null;
} 