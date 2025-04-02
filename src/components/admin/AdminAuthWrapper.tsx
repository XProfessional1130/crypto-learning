'use client';

import { ReactNode, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/providers/auth-provider';
import { Loader2 } from 'lucide-react';

interface AdminAuthWrapperProps {
  children: ReactNode;
}

export function AdminAuthWrapper({ children }: AdminAuthWrapperProps) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    // Check if the user is loaded and authenticated
    if (!loading) {
      if (user) {
        // Here you could also check for admin role if you have role-based permission
        setAuthorized(true);
      } else {
        // Redirect to login if not authenticated
        router.push(`/auth/signin?redirect=${encodeURIComponent('/admin-platform')}`);
      }
    }
  }, [user, loading, router]);

  // Show loading state while checking authentication
  if (loading || !authorized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-brand-primary mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading admin platform...</p>
        </div>
      </div>
    );
  }

  // Render children if authenticated
  return <>{children}</>;
} 