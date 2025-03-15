'use client';

import { Suspense, useState, useEffect } from 'react';
import { lazyLoad } from '@/lib/utils/lazyLoad';
import LoadingSpinner from '@/components/LoadingSpinner';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';

// Lazy load the PortfolioDashboard component
const PortfolioDashboard = lazyLoad(
  () => import('@/app/components/dashboard/PortfolioDashboard'),
  {
    fallback: (
      <div className="h-full min-h-[500px] w-full flex items-center justify-center">
        <LoadingSpinner size="large" text="Loading portfolio data..." />
      </div>
    )
  }
);

export default function Dashboard() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [showContent, setShowContent] = useState(false);
  
  // Add a short delay before showing content for smoother transitions
  useEffect(() => {
    if (!loading && user) {
      const timer = setTimeout(() => {
        setShowContent(true);
      }, 300);
      
      return () => clearTimeout(timer);
    }
  }, [loading, user]);

  if (loading) {
    return (
      <div className="flex min-h-[calc(100vh-16rem)] items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300 animate-pulse">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    router.push('/auth/signin');
    return null;
  }

  return (
    <main className={`container mx-auto px-4 py-8 transition-opacity-transform duration-600 ${showContent ? 'opacity-100' : 'opacity-0'}`}>
      <Suspense fallback={
        <div className="flex min-h-[calc(100vh-16rem)] items-center justify-center">
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
            <p className="text-gray-600 dark:text-gray-300 animate-pulse">Loading dashboard data...</p>
          </div>
        </div>
      }>
        <PortfolioDashboard />
      </Suspense>
    </main>
  );
} 