'use client';

import { useEffect, useState, useRef } from 'react';
import { useDataCache } from '@/lib/providers/data-cache-provider';

/**
 * A client component that initializes the coin data service
 * This is deprecated and only kept for backward compatibility.
 * New code should use the DataPrefetcher component in app/layout.tsx instead.
 * 
 * UPDATED: Now uses DataCache (Supabase) instead of direct CMC API calls.
 */
export default function CoinDataInitializer() {
  const [initialized, setInitialized] = useState(false);
  const { refreshData } = useDataCache();
  const initTriedRef = useRef(false);
  const verbose = process.env.NODE_ENV === 'development';

  useEffect(() => {
    // Only run once
    if (initialized || initTriedRef.current) return;
    
    // Mark as tried immediately to prevent multiple effect runs
    initTriedRef.current = true;
    
    const initService = async () => {
      // Set a global flag to prevent double initialization with DataPrefetcher
      if (typeof window !== 'undefined') {
        if (window.__DATA_SERVICE_INITIALIZING__ || window.__DATA_SERVICE_INITIALIZED__) {
          if (verbose) {
            console.log('CoinDataInitializer: Initialization already handled elsewhere, skipping');
          }
          return;
        }
        window.__DATA_SERVICE_INITIALIZING__ = true;
      }
      
      try {
        // Prefer using DataCache for initializing data - it uses Supabase
        if (verbose) {
          console.log('CoinDataInitializer: Using DataCache (via Supabase) instead of direct API calls');
        }
        await refreshData();
        if (verbose) {
          console.log('Coin data service initialized from app router (using Supabase)');
        }
        
        if (typeof window !== 'undefined') {
          window.__DATA_SERVICE_INITIALIZED__ = true;
          window.__DATA_SERVICE_INITIALIZING__ = false;
        }
        
        // Mark as initialized to prevent duplicate initialization attempts
        setInitialized(true);
      } catch (err) {
        console.error('Could not initialize data via DataCache:', err);
        
        // Fallback to legacy initialization only if DataCache fails
        try {
          // Dynamic import to safely load the module only on client-side
          const module = await import('@/lib/api/coinmarketcap');
          
          if (module && typeof module.initCoinDataService === 'function') {
            if (!module.isCoinDataServiceInitialized()) {
              if (verbose) {
                console.log('Fallback: Initializing legacy coin data service...');
              }
              await module.initCoinDataService();
              if (verbose) {
                console.log('Legacy coin data service initialized from app router');
              }
              
              if (typeof window !== 'undefined') {
                window.__DATA_SERVICE_INITIALIZED__ = true;
                window.__DATA_SERVICE_INITIALIZING__ = false;
              }
            } else {
              if (verbose) {
                console.log('CoinDataInitializer: Coin data service already initialized, skipping');
              }
            }
          } else {
            console.warn('Coin data service module loaded but initCoinDataService function not found');
          }
          
          // Mark as initialized even with fallback
          setInitialized(true);
        } catch (fallbackErr) {
          console.error('Could not initialize coin data service (fallback):', fallbackErr);
          if (typeof window !== 'undefined') {
            window.__DATA_SERVICE_INITIALIZING__ = false;
          }
        }
      }
    };

    // Defer initialization to avoid blocking initial render
    const timer = setTimeout(initService, 500);
    return () => clearTimeout(timer);
  }, [initialized, refreshData, verbose]);
  
  // This component doesn't render anything
  return null;
}

// Make sure TypeScript knows about the global property
declare global {
  interface Window {
    __DATA_SERVICE_INITIALIZING__?: boolean;
    __DATA_SERVICE_INITIALIZED__?: boolean;
  }
} 