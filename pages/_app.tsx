import type { AppProps } from 'next/app';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { AuthProvider } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import '../styles/globals.css';

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter();
  const [serviceInitialized, setServiceInitialized] = useState(false);

  useEffect(() => {
    // Handle access_token in URL hash for root path redirects
    if (typeof window !== 'undefined') {
      const hash = window.location.hash;
      if (hash && hash.includes('access_token')) {
        console.log('Found access_token in URL hash, processing authentication');
        
        // Let Supabase handle the hash (configured with detectSessionInUrl: true)
        supabase.auth.getSession().then(({ data: { session }}) => {
          if (session) {
            console.log('Successfully authenticated from hash parameters');
            // Redirect to dashboard after successful auth
            router.push('/dashboard');
          }
        });
      }
    }

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

  // Return the existing component structure
  // This is a placeholder - you should keep the existing structure
  return (
    <AuthProvider>
      <Component {...pageProps} />
    </AuthProvider>
  );
} 