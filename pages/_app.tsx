import type { AppProps } from 'next/app';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { AuthProvider } from '@/lib/auth-context';
import '../styles/globals.css';

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter();
  const [serviceInitialized, setServiceInitialized] = useState(false);

  useEffect(() => {
    // Initialize the coin data service using a safer pattern
    const initCoinService = async () => {
      if (serviceInitialized) return;
      
      try {
        // Dynamic import to avoid breaking if the module doesn't exist
        const module = await import('@/lib/services/coinmarketcap');
        
        if (module && typeof module.initCoinDataService === 'function') {
          console.log('Initializing coin data service from _app.tsx...');
          await module.initCoinDataService();
          console.log('Coin data service initialized from app startup');
          setServiceInitialized(true);
        }
      } catch (err) {
        console.error('Failed to import or initialize coin data service:', err);
      }
    };
    
    initCoinService();
  }, [router, serviceInitialized]);

  // Return the component without wrapping in AuthProvider
  // This avoids duplicate auth contexts
  return <Component {...pageProps} />;
} 