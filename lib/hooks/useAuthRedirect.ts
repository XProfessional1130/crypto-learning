import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';

/**
 * A simple hook to handle auth-related redirects and loading states for dashboard pages
 */
export function useAuthRedirect() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [showContent, setShowContent] = useState(false);

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/signin');
    }
  }, [user, authLoading, router]);

  // Add a short delay before showing content for smoother transitions
  useEffect(() => {
    if (!authLoading && user) {
      const timer = setTimeout(() => {
        setShowContent(true);
      }, 300);
      
      return () => clearTimeout(timer);
    }
  }, [authLoading, user]);

  return {
    user,
    authLoading,
    showContent,
    isAuthenticated: !!user
  };
} 