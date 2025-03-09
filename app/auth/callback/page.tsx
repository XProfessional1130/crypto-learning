'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function AuthCallback() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const handleCallback = async () => {
      try {
        // First check for hash fragment with access_token
        const hash = window.location.hash;
        if (hash && hash.includes('access_token')) {
          console.log('Found access_token in hash, checking session...');
          
          // Let Supabase handle the hash
          const { data: { session }, error: sessionError } = await supabase.auth.getSession();
          
          if (sessionError) {
            console.error('Session error:', sessionError);
            setError(sessionError.message);
            setLoading(false);
            return;
          }
          
          if (session) {
            console.log('Session established from hash!');
            router.push('/dashboard');
            return;
          }
        }
        
        // If no hash or no session from hash, try code parameter
        const params = new URLSearchParams(window.location.search);
        const code = params.get('code');
        
        if (!code) {
          // If we have a hash but couldn't get a session, try one more time with getSession
          if (hash) {
            const { data } = await supabase.auth.getSession();
            if (data.session) {
              router.push('/dashboard');
              return;
            }
          }
          
          setError('No authentication code or token found');
          setLoading(false);
          return;
        }
        
        // Exchange the code for a session
        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
        
        if (exchangeError) {
          console.error('Code exchange error:', exchangeError);
          setError(exchangeError.message);
          setLoading(false);
          return;
        }
        
        console.log('Authentication successful');
        router.push('/dashboard');
      } catch (err: any) {
        console.error('Auth callback error:', err);
        setError(err.message);
        setLoading(false);
      }
    };

    handleCallback();
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