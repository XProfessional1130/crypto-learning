'use client';

import { useState, useEffect, useMemo, Suspense, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { useAuthRedirect } from '@/hooks/useAuthRedirect';
import { useDataCache } from '@/lib/providers/data-cache-provider';
import PortfolioDashboard from '@/components/dashboard/PortfolioDashboard';
import DashboardLayout from '@/components/dashboard/DashboardLayout';

// Create consistent loading skeleton that matches the lc-dashboard style
function DashboardSkeleton() {
  return (
    <div className="w-full max-w-7xl mx-auto space-y-6">
      {/* Header Skeleton */}
      <div className="mb-2">
        <div className="h-8 w-64 bg-gray-200 dark:bg-gray-700 rounded-md animate-pulse"></div>
        <div className="h-4 w-40 mt-2 bg-gray-200 dark:bg-gray-700 rounded-md animate-pulse"></div>
      </div>
      
      {/* Market Card Skeleton */}
      <div className="bg-white dark:bg-gradient-to-br dark:from-slate-800 dark:to-slate-900 rounded-xl shadow-md dark:shadow-lg border border-gray-200 dark:border-slate-700/50 p-5 transition-all duration-300">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="animate-pulse">
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
          <div className="bg-white dark:bg-gradient-to-br dark:from-slate-800 dark:to-slate-900 rounded-xl shadow-md dark:shadow-lg border border-gray-200 dark:border-slate-700/50 p-5 transition-all duration-300" style={{ minHeight: 'calc(100vh - 24rem)' }}>
            <div className="flex justify-between items-center mb-4 pb-3 border-b border-gray-200 dark:border-slate-700/50">
              <div className="h-8 w-48 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
              <div className="h-8 w-28 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
            </div>
            <div className="animate-pulse space-y-4">
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
          <div className="bg-white dark:bg-gradient-to-br dark:from-slate-800 dark:to-slate-900 rounded-xl shadow-md dark:shadow-lg border border-gray-200 dark:border-slate-700/50 p-5 transition-all duration-300" style={{ minHeight: 'calc(100vh - 24rem)' }}>
            <div className="flex justify-between items-center mb-4 pb-3 border-b border-gray-200 dark:border-slate-700/50">
              <div className="h-8 w-36 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
              <div className="h-8 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
            </div>
            <div className="animate-pulse space-y-4">
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
 */
export default function DashboardPage() {
  const { user, authLoading, showContent } = useAuthRedirect();
  const router = useRouter();
  
  // Add a fail-safe timeout to ensure we eventually exit the loading state
  const [hasTimedOut, setHasTimedOut] = useState(false);
  
  // Use our shared data cache for market data
  const { 
    btcPrice, 
    ethPrice, 
    globalData, 
    isLoading: marketDataLoading,
    isRefreshing,
    refreshData,
    lastUpdated
  } = useDataCache();
  
  // Create consistent animation classes based on loading state - initialize to true to avoid flicker
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  
  // Track if content has been shown - once shown, never go back to loading
  const [hasShownContent, setHasShownContent] = useState(false);
  
  // Loading and error handling
  const isLoading = !hasShownContent && (authLoading || marketDataLoading);
  
  // Ensure we eventually exit the loading state if it's taking too long
  useEffect(() => {
    const timer = setTimeout(() => setHasTimedOut(true), 7000);
    return () => clearTimeout(timer);
  }, []);
  
  // Once loaded, update the animation state
  useEffect(() => {
    let mounted = true;
    if (!isLoading || hasTimedOut) {
      // Small delay to ensure smoother transitions
      const timer = setTimeout(() => {
        if (mounted) {
          setInitialLoadComplete(true);
          setHasShownContent(true);
        }
      }, 200);
      return () => {
        mounted = false;
        clearTimeout(timer);
      };
    }
    return () => { mounted = false; };
  }, [isLoading, hasTimedOut]);
  
  // Determine if we should show content or loading state
  const shouldShowContent = showContent || hasTimedOut;
  
  // Animation classes based on state
  const cardAnimationClass = initialLoadComplete ? "animate-scaleIn" : "opacity-0 transition-opacity-transform";
  const contentAnimationClass = initialLoadComplete ? "animate-slide-up" : "opacity-0 transition-opacity-transform";
  
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
  
  return (
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
        
        {/* Main Content */}
        {isLoading && !shouldShowContent ? (
          <DashboardSkeleton />
        ) : (
          <Suspense fallback={<DashboardSkeleton />}>
            <PortfolioDashboard />
          </Suspense>
        )}
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-3">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Welcome to Learning Crypto!</h2>
            <p className="mb-4">
              This is your dashboard where you can manage your account and access your learning resources.
            </p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
} 