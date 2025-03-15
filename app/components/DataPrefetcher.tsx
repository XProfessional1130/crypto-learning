'use client';

import { useEffect, useRef } from 'react';
import { initCoinDataService, isCoinDataServiceInitialized } from '@/lib/services/coinmarketcap';
import { useDataCache } from '@/lib/context/data-cache-context';

/**
 * DataPrefetcher component that initializes data services on app load
 * This is the PRIMARY component for initializing all data services.
 * This component should be included only once, in the root layout.
 * 
 * UPDATED: Now primarily uses DataCache which gets data from Supabase
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
      
      // Still attempt to refresh data from Supabase via DataCache
      refreshTimeoutRef.current = setTimeout(async () => {
        try {
          await refreshData();
          console.log('DataPrefetcher: Data successfully refreshed from Supabase via DataCache');
        } catch (err) {
          console.error('Error refreshing data:', err);
        }
      }, 1000);
      
      return;
    }
    
    // Initialize by using the DataCache for data refreshing (which uses Supabase)
    const initializeData = async () => {
      try {
        // Set global initialization flag
        if (typeof window !== 'undefined') {
          window.__DATA_SERVICE_INITIALIZING__ = true;
        }
        
        // Primary approach: Just use DataCache which uses Supabase
        console.log('DataPrefetcher: Using DataCache (via Supabase) as primary data source');
        
        try {
          // First try to refresh data using DataCache (Supabase)
          await refreshData();
          console.log('DataPrefetcher: Successfully loaded data from Supabase via DataCache');
          
          // Set global initialized flag
          if (typeof window !== 'undefined') {
            window.__DATA_SERVICE_INITIALIZED__ = true;
            window.__DATA_SERVICE_INITIALIZING__ = false;
          }
          
          // Set initialization flag to prevent multiple calls
          hasInitializedRef.current = true;
        } catch (dataError) {
          console.error('Error refreshing data via DataCache:', dataError);
          
          // Fallback: Initialize coin data service if DataCache fails
          if (!isCoinDataServiceInitialized()) {
            console.log('DataPrefetcher: DataCache failed, initializing legacy coin data service...');
            await initCoinDataService();
            console.log('DataPrefetcher: Legacy data service initialized');
            
            // Set global initialized flag
            if (typeof window !== 'undefined') {
              window.__DATA_SERVICE_INITIALIZED__ = true;
              window.__DATA_SERVICE_INITIALIZING__ = false;
            }
          }
          
          // Set initialization flag to prevent multiple calls
          hasInitializedRef.current = true;
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