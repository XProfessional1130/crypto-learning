'use client';

import { useEffect, useState } from 'react';

/**
 * A client component that initializes the coin data service
 * This is deprecated and only kept for backward compatibility.
 * New code should use the DataPrefetcher component in app/layout.tsx instead.
 */
export default function CoinDataInitializer() {
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    // Only run once
    if (initialized) return;
    
    // Mark as initialized immediately to prevent multiple effect runs
    setInitialized(true);
    
    const initService = async () => {
      // Set a global flag to prevent double initialization with DataPrefetcher
      if (typeof window !== 'undefined') {
        if (window.__DATA_SERVICE_INITIALIZING__ || window.__DATA_SERVICE_INITIALIZED__) {
          console.log('CoinDataInitializer: Initialization already handled elsewhere, skipping');
          return;
        }
        window.__DATA_SERVICE_INITIALIZING__ = true;
      }
      
      try {
        // Dynamic import to safely load the module only on client-side
        const module = await import('@/lib/services/coinmarketcap');
        
        if (module && typeof module.initCoinDataService === 'function') {
          if (!module.isCoinDataServiceInitialized()) {
            console.log('Initializing coin data service from app/components/CoinDataInitializer.tsx...');
            await module.initCoinDataService();
            console.log('Coin data service initialized from app router');
            
            if (typeof window !== 'undefined') {
              window.__DATA_SERVICE_INITIALIZED__ = true;
              window.__DATA_SERVICE_INITIALIZING__ = false;
            }
          } else {
            console.log('CoinDataInitializer: Coin data service already initialized, skipping');
          }
        } else {
          console.warn('Coin data service module loaded but initCoinDataService function not found');
        }
      } catch (err) {
        console.error('Could not initialize coin data service:', err);
        if (typeof window !== 'undefined') {
          window.__DATA_SERVICE_INITIALIZING__ = false;
        }
      }
    };

    initService();
  }, [initialized]);
  
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