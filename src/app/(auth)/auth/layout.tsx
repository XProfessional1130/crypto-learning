'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Handle hash errors on auth pages
    const hash = window.location.hash;
    if (hash && hash.includes('error')) {
      // Extract error from hash
      const hashParams = new URLSearchParams(hash.substring(1));
      const errorDesc = hashParams.get('error_description') || 'Authentication error';
      const errorType = hashParams.get('error') || '';
      const errorCode = hashParams.get('error_code') || '';
      
      console.log('Auth error in hash:', { errorType, errorDesc, errorCode });
      
      // Redirect to sign-in with error
      if (pathname !== '/auth/signin') {
        router.replace(`/auth/signin?error=${encodeURIComponent(errorType)}&message=${encodeURIComponent(errorDesc)}`);
      }
    }
  }, [pathname, router]);

  return <>{children}</>;
} 