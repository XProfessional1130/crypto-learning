'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function AuthCodeHandler() {
  const router = useRouter();

  useEffect(() => {
    const handleAuth = async () => {
      // Handle URL code parameter (from magic link)
      const params = new URLSearchParams(window.location.search);
      
      if (params.has('code')) {
        const code = params.get('code');
        console.log('Authentication code detected, redirecting to callback page...');
        
        // Redirect to the callback page with the code
        const callbackUrl = `${window.location.origin}/auth/callback?code=${code}`;
        router.push(callbackUrl);
        return;
      }
      
      // Handle hash fragment (from magic link alternative flow)
      const hash = window.location.hash;
      if (hash && hash.includes('access_token')) {
        console.log('Access token detected in URL hash, redirecting to callback...');
        
        // Redirect to the callback page with the hash
        // This ensures the callback page handles all auth flows
        router.push(`/auth/callback${hash}`);
      }
    };
    
    handleAuth();
  }, [router]);

  // This component doesn't render anything
  return null;
} 