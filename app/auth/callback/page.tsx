'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function AuthCallback() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Handle both hash-based and PKCE flow authentication
        // With PKCE flow, Supabase will handle the token exchange automatically
        const { data, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('Session error:', sessionError);
          setError(sessionError.message);
        } else if (data?.session) {
          console.log('Authentication successful');
          // Redirect to dashboard on successful login
          router.push('/dashboard');
        } else {
          // If we don't have a session yet, try to exchange the code for a session
          // Important for PKCE flow
          const params = new URLSearchParams(window.location.search);
          if (params.has('code')) {
            // We have a code from PKCE flow
            const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(params.get('code') || '');
            
            if (exchangeError) {
              console.error('Code exchange error:', exchangeError);
              setError(exchangeError.message);
            } else {
              // Successful exchange, redirect to dashboard
              router.push('/dashboard');
            }
          } else {
            // No code in URL, check if there's a hash with access token (old flow)
            const hash = window.location.hash;
            
            if (hash && hash.includes('access_token')) {
              // Old flow with hash
              const { error: hashError } = await supabase.auth.getSession();
              
              if (hashError) {
                setError(hashError.message);
              } else {
                // Redirect to dashboard on successful login
                router.push('/dashboard');
              }
            } else {
              setError('No authentication code or token found');
            }
          }
        }
      } catch (err: any) {
        console.error('Auth callback error:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    handleAuthCallback();
  }, [router]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8 bg-white p-8 rounded-lg shadow-md text-center">
        <h1 className="text-2xl font-bold">Authenticating...</h1>
        
        {loading ? (
          <div className="mt-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mx-auto"></div>
            <p className="mt-4 text-gray-600">Completing your sign in...</p>
          </div>
        ) : error ? (
          <div className="mt-4">
            <p className="text-red-600">Error: {error}</p>
            <button
              onClick={() => router.push('/auth/signin')}
              className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Back to Sign In
            </button>
          </div>
        ) : (
          <div className="mt-4">
            <p className="text-green-600">Success! Redirecting you to the dashboard...</p>
          </div>
        )}
      </div>
    </div>
  );
} 