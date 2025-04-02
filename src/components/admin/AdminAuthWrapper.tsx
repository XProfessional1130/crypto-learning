'use client';

import { ReactNode, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/providers/auth-provider';
import { Loader2 } from 'lucide-react';
import { AuthService } from '@/lib/api/auth';

interface AdminAuthWrapperProps {
  children: ReactNode;
}

export function AdminAuthWrapper({ children }: AdminAuthWrapperProps) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);
  const [isCheckingAdmin, setIsCheckingAdmin] = useState(true);

  useEffect(() => {
    async function checkAdminStatus() {
      if (!user) return;
      
      setIsCheckingAdmin(true);
      try {
        const isAdmin = await AuthService.isAdmin();
        setAuthorized(isAdmin);
        
        if (!isAdmin) {
          // Redirect to unauthorized page if not an admin
          router.push('/unauthorized');
        }
      } catch (error) {
        console.error('Error checking admin status:', error);
        setAuthorized(false);
        router.push('/error?message=Authentication%20failed');
      } finally {
        setIsCheckingAdmin(false);
      }
    }

    // Check if the user is loaded and authenticated
    if (!loading) {
      if (user) {
        checkAdminStatus();
      } else {
        // Redirect to login if not authenticated
        router.push(`/auth/signin?redirect=${encodeURIComponent('/admin-platform')}`);
        setIsCheckingAdmin(false);
      }
    }
  }, [user, loading, router]);

  // Show loading state while checking authentication
  if (loading || isCheckingAdmin || !authorized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-brand-primary mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading admin platform...</p>
        </div>
      </div>
    );
  }

  // Render children if authenticated and authorized
  return <>{children}</>;
} 