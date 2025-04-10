'use client';

import { useState, useEffect, useMemo, Suspense, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { useAuthRedirect } from '@/hooks/auth/useAuthRedirect';
import { useDataCache } from '@/lib/providers/data-cache-provider';
import PortfolioDashboard from '@/components/features/dashboard/PortfolioDashboard';
import DashboardLayout from '@/components/features/dashboard/DashboardLayout';
import PaidMembersOnly from '@/components/auth/PaidMembersOnly';

// Create consistent loading skeleton that matches the lc-dashboard style
function DashboardSkeleton() {
  return (
    <div className="w-full max-w-7xl mx-auto space-y-6">
      {/* Header Skeleton */}
      <div className="mb-2">
        <div className="h-8 w-64 bg-gray-200 dark:bg-gray-700 rounded-md"></div>
        <div className="h-4 w-40 mt-2 bg-gray-200 dark:bg-gray-700 rounded-md"></div>
      </div>
      
      {/* Market Card Skeleton */}
      <div className="bg-white dark:bg-gradient-to-br dark:from-slate-800 dark:to-slate-900 rounded-xl shadow-md dark:shadow-lg border border-gray-200 dark:border-slate-700/50 p-5">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i}>
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-2"></div>
              <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Content Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Portfolio Section */}
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-gradient-to-br dark:from-slate-800 dark:to-slate-900 rounded-xl shadow-md dark:shadow-lg border border-gray-200 dark:border-slate-700/50 p-5" style={{ minHeight: 'calc(100vh - 24rem)' }}>
            <div className="flex justify-between items-center mb-4 pb-3 border-b border-gray-200 dark:border-slate-700/50">
              <div className="h-8 w-48 bg-gray-200 dark:bg-gray-700 rounded"></div>
              <div className="h-8 w-28 bg-gray-200 dark:bg-gray-700 rounded"></div>
            </div>
            <div className="space-y-4">
              <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-full mb-4"></div>
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex justify-between items-center p-3 border-b border-gray-100 dark:border-gray-700">
                  <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
                  <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/5"></div>
                  <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/6"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        {/* Watchlist Section */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-gradient-to-br dark:from-slate-800 dark:to-slate-900 rounded-xl shadow-md dark:shadow-lg border border-gray-200 dark:border-slate-700/50 p-5" style={{ minHeight: 'calc(100vh - 24rem)' }}>
            <div className="flex justify-between items-center mb-4 pb-3 border-b border-gray-200 dark:border-slate-700/50">
              <div className="h-8 w-36 bg-gray-200 dark:bg-gray-700 rounded"></div>
              <div className="h-8 w-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
            </div>
            <div className="space-y-4">
              <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-full mb-4"></div>
              {[...Array(4)].map((_, i) => (
                <div key={i} className="flex justify-between items-center p-3 border-b border-gray-100 dark:border-gray-700">
                  <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
                  <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/5"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Dashboard page - shows the user's portfolio and watchlist
 * Now restricted to paid members only
 */
export default function DashboardPage() {
  const { user, authLoading } = useAuthRedirect();
  const router = useRouter();
  
  // Use our shared data cache for market data
  const { 
    btcPrice, 
    ethPrice, 
    globalData
  } = useDataCache();
  
  // Get the user's first name or email username for the welcome message
  const getUserDisplayName = () => {
    if (!user) return 'there';
    if (user.email) {
      // Extract the username part from the email (before the @)
      const emailName = user.email.split('@')[0];
      // Capitalize the first letter
      return emailName.charAt(0).toUpperCase() + emailName.slice(1);
    }
    return 'there';
  };
  
  // No conditional rendering here - directly render the content
  return (
    <PaidMembersOnly>
      <DashboardLayout showTitle={false}>
        <div className="w-full">
          {/* Page Header with Welcome Message */}
          <div className="mb-6">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-white">
              Your Dashboard
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mt-1">
              Welcome back, {getUserDisplayName()}!
            </p>
          </div>
          
          {/* Always render the actual dashboard component and pass forceShow */}
          <PortfolioDashboard forceShow={true} />
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-3">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Welcome to Learning Crypto!</h2>
              <p className="mb-4">
                This is your premium dashboard where you can manage your account and access your advanced features.
              </p>
            </div>
          </div>
        </div>
      </DashboardLayout>
    </PaidMembersOnly>
  );
} 