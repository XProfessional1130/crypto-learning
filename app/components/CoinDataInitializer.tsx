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
    
    const initService = async () => {
      // Check if already being initialized by DataPrefetcher
      if (typeof window !== 'undefined' && window.__DATA_SERVICE_INITIALIZING__) {
        console.log('CoinDataInitializer: Initialization already handled by DataPrefetcher, skipping');
        setInitialized(true);
        return;
      }
      
      try {
        // Dynamic import to safely load the module only on client-side
        const module = await import('@/lib/services/coinmarketcap');
        
        if (module && typeof module.initCoinDataService === 'function') {
          if (!module.isCoinDataServiceInitialized()) {
            console.log('Initializing coin data service from app/components/CoinDataInitializer.tsx...');
            await module.initCoinDataService();
            console.log('Coin data service initialized from app router');
          } else {
            console.log('CoinDataInitializer: Coin data service already initialized, skipping');
          }
          setInitialized(true);
        } else {
          console.warn('Coin data service module loaded but initCoinDataService function not found');
        }
      } catch (err) {
        console.error('Could not initialize coin data service:', err);
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
  }
} 