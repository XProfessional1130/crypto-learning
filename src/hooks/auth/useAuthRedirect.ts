import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/providers/auth-provider';
import { useRouter } from 'next/navigation';

/**
 * A simple hook to handle auth-related redirects and loading states for dashboard pages
 */
export function useAuthRedirect() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [showContent, setShowContent] = useState(true); // Start with true to avoid flicker

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/signin');
    } else if (!authLoading && user) {
      setShowContent(true);
    }
  }, [user, authLoading, router]);

  return {
    user,
    authLoading,
    showContent,
    isAuthenticated: !!user
  };
} 