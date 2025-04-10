import { ReactNode, useState, useEffect } from 'react';
import { useAuth } from '@/lib/providers/auth-provider';
import { useRouter } from 'next/navigation';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

interface DashboardLayoutProps {
  children: ReactNode;
  title?: string;
  showTitle?: boolean;
}

export default function DashboardLayout({ children, title = "Dashboard", showTitle = true }: DashboardLayoutProps) {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  
  // Check authentication and redirect if needed
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/signin');
    }
  }, [user, authLoading, router]);

  // Loading state
  if (authLoading) {
    return (
      <div className="flex min-h-[calc(100vh-16rem)] items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  // Redirect case (handled by the effect, this is a fallback)
  if (!user) {
    return null;
  }

  return (
    <main className="container mx-auto px-4 py-8">
      {showTitle && <h1 className="text-3xl font-bold mb-6">{title}</h1>}
      {children}
    </main>
  );
} 