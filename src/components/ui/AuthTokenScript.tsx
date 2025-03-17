'use client';

import { useEffect } from 'react';

/**
 * AuthTokenScript
 * 
 * Client component to handle auth token detection in URL hash
 * Using useEffect to run client-side code safely
 */
export default function AuthTokenScript() {
  useEffect(() => {
    // Check for URL hash with auth tokens
    const hash = window.location.hash;
    if (hash && hash.includes('access_token')) {
      console.log('Found access_token in URL hash (layout)');
    }
  }, []);
  
  // This component doesn't render anything
  return null;
} 