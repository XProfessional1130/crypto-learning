'use client';

import { Suspense, memo, useState, useEffect } from 'react';
import PortfolioDashboard from '@/app/components/dashboard/PortfolioDashboard';

// Memoize the PortfolioDashboard component to prevent unnecessary re-renders
const MemoizedPortfolioDashboard = memo(PortfolioDashboard);

/**
 * Dashboard page - shows the user's portfolio and watchlist
 */
export default function DashboardPage() {
  // Removed the hasTimedOut state and timeout as it causes an unnecessary re-render
  // This was causing the page to refresh around 5-7 seconds after loading

  return (
    <main className="flex min-h-screen flex-col p-4 md:p-8">
      <Suspense fallback={<DashboardSkeleton />}>
        <MemoizedPortfolioDashboard />
      </Suspense>
    </main>
  );
}

function DashboardSkeleton() {
  return (
    <div className="w-full max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div className="h-8 w-40 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
        <div className="h-8 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
      </div>
      
      {/* Stats Cards Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse"></div>
        <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse"></div>
      </div>
      
      {/* Content Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 h-96 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse"></div>
        <div className="h-96 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse"></div>
      </div>
    </div>
  );
} 