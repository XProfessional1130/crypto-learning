'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/api/supabase';

export default function AuthCallback() {
  const router = useRouter();
  const [message, setMessage] = useState<string>('Verifying your login...');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Handle auth state change
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth state changed:', event, !!session);
      
      if (event === 'SIGNED_IN' && session) {
        // Successfully signed in
        setMessage('Successfully logged in! Redirecting...');
        router.push('/dashboard');
      }
    });

    // First check if we already have a session
    const checkExistingSession = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error checking session:', error);
          setError('Error checking session: ' + error.message);
          return;
        }
        
        if (data?.session) {
          console.log('Session found, redirecting...');
          setMessage('Session found! Redirecting...');
          router.push('/dashboard');
          return;
        }
        
        // No session yet, wait for the auth state change
        setMessage('Waiting for authentication...');
        
        // After 3 seconds without a session, show options
        setTimeout(() => {
          setMessage('Authentication taking longer than expected.');
          setError('If you\'ve already clicked the magic link, try the buttons below.');
        }, 3000);
      } catch (e) {
        console.error('Error in auth callback:', e);
        setError('Unexpected error during authentication.');
      }
    };

    checkExistingSession();

    return () => {
      // Clean up subscription when component unmounts
      subscription.unsubscribe();
    };
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="p-8 max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg text-center">
        <h2 className="text-2xl font-semibold text-gray-800 dark:text-white mb-2">Authentication</h2>
        
        <p className="text-gray-600 dark:text-gray-300 mb-4">{message}</p>
        
        {!error && (
          <div className="flex justify-center mb-6">
            <div className="animate-spin h-6 w-6 border-2 border-blue-500 rounded-full border-t-transparent"></div>
          </div>
        )}
        
        {error && (
          <div className="mb-6 p-4 bg-red-100 text-red-700 rounded-lg">
            <p>{error}</p>
          </div>
        )}
        
        <div className="space-y-3">
          <button 
            onClick={async () => {
              const { data } = await supabase.auth.getSession();
              if (data?.session) {
                router.push('/dashboard');
              } else {
                setError('No active session found. Please try signing in again.');
              }
            }}
            className="w-full py-2 px-4 bg-blue-500 hover:bg-blue-600 text-white rounded transition-colors"
          >
            Try Again
          </button>
          
          <button 
            onClick={() => router.push('/dashboard')}
            className="w-full py-2 px-4 bg-green-500 hover:bg-green-600 text-white rounded transition-colors"
          >
            Go to Dashboard
          </button>
          
          <button 
            onClick={() => router.push('/auth/signin')}
            className="w-full py-2 px-4 border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
          >
            Back to Sign In
          </button>
        </div>
      </div>
    </div>
  );
} 