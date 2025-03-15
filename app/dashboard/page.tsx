'use client';

import { Suspense } from 'react';
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

  if (loading) {
    return (
      <div className="flex min-h-[calc(100vh-16rem)] items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!user) {
    router.push('/auth/signin');
    return null;
  }

  return (
    <main className="container mx-auto px-4 py-8 animate-fadeIn">
      <Suspense fallback={<LoadingSpinner size="large" text="Loading dashboard..." />}>
        <PortfolioDashboard />
      </Suspense>
    </main>
  );
} 