'use client';

import { useEffect, useState } from 'react';

/**
 * A client component that initializes the coin data service
 * This is separate from the main layout to avoid SSR issues
 */
export default function CoinDataInitializer() {
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    // Only run once
    if (initialized) return;
    
    const initService = async () => {
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