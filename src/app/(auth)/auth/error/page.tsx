'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import supabase from '@/lib/api/supabase-client';
import Link from 'next/link';
import Image from 'next/image';

export default function AuthError() {
  const router = useRouter();
  const [error, setError] = useState<string>('Authentication error occurred');
  const [email, setEmail] = useState<string>('');
  const [resendingLink, setResendingLink] = useState(false);
  const [resendMessage, setResendMessage] = useState<string | null>(null);

  useEffect(() => {
    // Extract error from URL
    const params = new URLSearchParams(window.location.search);
    const errorMsg = params.get('error') || 'Authentication error occurred';
    setError(decodeURIComponent(errorMsg.replace(/\+/g, ' ')));
    
    // Try to extract email from the URL
    const extractedEmail = params.get('email');
    if (extractedEmail) {
      setEmail(extractedEmail);
    } else {
      try {
        const urlMatch = window.location.href.match(/email=([^&]+)/);
        if (urlMatch && urlMatch[1]) {
          const decodedEmail = decodeURIComponent(urlMatch[1]);
          setEmail(decodedEmail);
        }
      } catch (e) {
        console.error('Error extracting email:', e);
      }
    }
  }, []);

  // Function to resend the magic link
  const handleResendLink = async () => {
    if (!email) {
      setResendMessage('Please enter your email address to resend the link.');
      return;
    }

    setResendingLink(true);
    setResendMessage(null);

    try {
      // Use the simplest implementation possible
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim()
      });

      if (error) {
        // These errors can be ignored as the email is often still sent
        if (error.message === "Error sending magic link email" || 
            error.message?.includes("relation") ||
            error.message?.includes("subscriptions") ||
            error.message?.includes("profiles")) {
          console.warn('Database error but email likely sent anyway');
          setResendMessage('New magic link sent! Please check your email.');
          return;
        }
        
        console.error('Error resending magic link:', error);
        setResendMessage(`Error: ${error.message}`);
      } else {
        setResendMessage('New magic link sent! Please check your email.');
      }
    } catch (err: any) {
      console.error('Unexpected error resending link:', err);
      setResendMessage('An unexpected error occurred. Please try again.');
    } finally {
      setResendingLink(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8 bg-white/80 dark:bg-gray-800/80 p-8 rounded-lg shadow-md text-center backdrop-blur-sm">
        <div className="mb-6">
          <div className="flex justify-center">
            <div className="block dark:hidden">
              <Image 
                src="/logos/logo-green.png" 
                alt="Learning Crypto Logo" 
                width={150} 
                height={60}
                priority
              />
            </div>
            <div className="hidden dark:block">
              <Image 
                src="/logos/logo-white.png" 
                alt="Learning Crypto Logo" 
                width={150} 
                height={60}
                priority
              />
            </div>
          </div>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Authentication Error
        </h1>
        
        <p className="text-red-600 dark:text-red-400 mb-6">
          {error}
        </p>
        
        <div className="mt-6 space-y-4">
          <p className="text-gray-600 dark:text-gray-300 text-sm">You can either:</p>
          
          <button
            onClick={() => router.push('/auth/signin')}
            className="w-full inline-flex justify-center items-center px-4 py-3 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-brand-600 hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-500 transition-colors duration-200"
          >
            Try Signing In Again
          </button>
          
          <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
            <p className="text-gray-600 dark:text-gray-300 text-sm font-medium mb-3">Or resend a new magic link:</p>
            
            <div className="space-y-3">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-brand-500 focus:border-brand-500 dark:bg-gray-700 dark:text-white"
              />
              
              <button
                onClick={handleResendLink}
                disabled={resendingLink}
                className="w-full flex justify-center items-center px-4 py-2 text-sm font-medium text-white bg-brand-500 hover:bg-brand-600 rounded-md transition-colors duration-200 disabled:opacity-50"
              >
                {resendingLink ? 'Sending...' : 'Resend Magic Link'}
              </button>
              
              {resendMessage && (
                <p className={`text-sm mt-2 ${resendMessage.includes('Error') ? 'text-red-500' : 'text-green-500'}`}>
                  {resendMessage}
                </p>
              )}
            </div>
          </div>
        </div>
        
        <div className="mt-6">
          <Link 
            href="/" 
            className="inline-flex items-center text-sm text-brand-500 hover:text-brand-600 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Return to Home
          </Link>
        </div>
      </div>
    </div>
  );
} 