import type { AppProps } from 'next/app';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AuthProvider } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import '@/styles/globals.css';

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter();

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
  }, [router]);

  return (
    <AuthProvider>
      <Component {...pageProps} />
    </AuthProvider>
  );
} 