'use client';

import { useState, useEffect, useMemo, Suspense, useCallback } from 'react';
import { useTeamData } from '@/lib/context/team-data-context';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { ReactNode } from 'react';
import { TrendingUp, TrendingDown, Activity, DollarSign, AlertCircle } from 'lucide-react';
import { useAuthRedirect } from '@/lib/hooks/useAuthRedirect';
import { useDataCache } from '@/lib/context/data-cache-context';
import type { GlobalData } from '@/lib/services/coinmarketcap';
import DashboardLayout from '@/app/components/dashboard/DashboardLayout';
import { 
  DataCard,
  SectionLoader,
  ErrorDisplay
} from '@/app/components/dashboard/DashboardUI';
import MarketOverview from '@/app/components/dashboard/MarketOverview';

// Loading skeletons for better UX during component loading
const PortfolioLoadingSkeleton = () => (
  <div className="animate-pulse space-y-4">
    <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="bg-gray-100 dark:bg-gray-800 p-6 rounded-lg">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-3"></div>
          <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
        </div>
      ))}
    </div>
    <div className="mt-6">
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
);

const WatchlistLoadingSkeleton = () => (
  <div className="animate-pulse space-y-4">
    <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
    <div className="mt-6">
      <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-full mb-4"></div>
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex justify-between items-center p-3 border-b border-gray-100 dark:border-gray-700">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/5"></div>
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/6"></div>
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/6"></div>
        </div>
      ))}
    </div>
  </div>
);

// Dynamically import heavy components with proper loading skeletons
const TeamPortfolio = dynamic(() => import('../components/lc-dashboard/TeamPortfolio'), {
  loading: () => <PortfolioLoadingSkeleton />,
  ssr: false // Disable SSR for these components to prevent double initialization
});

const TeamWatchlist = dynamic(() => import('../components/lc-dashboard/TeamWatchlist'), {
  loading: () => <WatchlistLoadingSkeleton />,
  ssr: false // Disable SSR for these components to prevent double initialization
});

// Fear & Greed Index Card Component
const FearGreedCard = ({ loading = false }) => {
  // Placeholder data - would come from API
  const fearGreedValue = 63;
  const sentiment = "Greed";
  const sentimentColors = {
    "Extreme Fear": "bg-red-500",
    "Fear": "bg-orange-500",
    "Neutral": "bg-yellow-500",
    "Greed": "bg-green-500",
    "Extreme Greed": "bg-emerald-500"
  };
  const colorClass = sentimentColors[sentiment];

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm transition-all duration-300 hover:shadow-card-hover transform hover:-translate-y-1">
      <div className="flex items-center mb-3">
        <AlertCircle className="w-5 h-5 mr-2 text-gray-500 dark:text-gray-400" />
        <p className="text-sm text-gray-500 dark:text-gray-400">Fear & Greed Index</p>
      </div>
      
      {loading ? (
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-24 mb-3"></div>
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
        </div>
      ) : (
        <>
          <div className="flex justify-between items-center mb-2">
            <span className="text-3xl font-bold">{fearGreedValue}</span>
            {/* Conditional rendering of spans */}
            {sentiment === "Greed" || sentiment === "Extreme Greed" ? (
              <span className="text-sm font-semibold px-2 py-1 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400">
                {sentiment}
              </span>
            ) : sentiment === "Neutral" ? (
              <span className="text-sm font-semibold px-2 py-1 rounded-full bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400">
                {sentiment}
              </span>
            ) : (
              <span className="text-sm font-semibold px-2 py-1 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400">
                {sentiment}
              </span>
            )}
          </div>
          
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 mb-2">
            <div 
              className={`h-2.5 rounded-full ${colorClass}`} 
              style={{ width: `${fearGreedValue}%` }}
            ></div>
          </div>
          
          <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
            <span>Extreme Fear</span>
            <span>Extreme Greed</span>
          </div>
        </>
      )}
    </div>
  );
};

// On-chain Activity Card Component
const OnChainActivityCard = ({ loading = false }) => {
  // Placeholder data - would come from API
  const activeAddresses = "1.2M";
  const changePercentage = 5.3;
  const isPositiveChange = changePercentage > 0;

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm transition-all duration-300 hover:shadow-card-hover transform hover:-translate-y-1">
      <div className="flex items-center mb-3">
        <Activity className="w-5 h-5 mr-2 text-gray-500 dark:text-gray-400" />
        <p className="text-sm text-gray-500 dark:text-gray-400">On-chain Activity</p>
      </div>
      
      {loading ? (
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-24 mb-3"></div>
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
        </div>
      ) : (
        <>
          <div className="flex justify-between items-center">
            <span className="text-3xl font-bold">{activeAddresses}</span>
            <span className={`flex items-center text-sm font-semibold px-2 py-1 rounded-full ${
              isPositiveChange 
                ? "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400" 
                : "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400"
            }`}>
              {isPositiveChange ? <TrendingUp className="h-3.5 w-3.5 mr-1" /> : <TrendingDown className="h-3.5 w-3.5 mr-1" />}
              {Math.abs(changePercentage)}%
            </span>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Active addresses in the last 24h</p>
        </>
      )}
    </div>
  );
};

// Whale Tracking Card Component
const WhaleTrackingCard = ({ loading = false }) => {
  // Placeholder data - would come from API
  const largeTransactions = "3,251";
  const changePercentage = -2.7;
  const isPositiveChange = changePercentage > 0;

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm transition-all duration-300 hover:shadow-card-hover transform hover:-translate-y-1">
      <div className="flex items-center mb-3">
        <DollarSign className="w-5 h-5 mr-2 text-gray-500 dark:text-gray-400" />
        <p className="text-sm text-gray-500 dark:text-gray-400">Whale Transactions</p>
      </div>
      
      {loading ? (
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-24 mb-3"></div>
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
        </div>
      ) : (
        <>
          <div className="flex justify-between items-center">
            <span className="text-3xl font-bold">{largeTransactions}</span>
            <span className={`flex items-center text-sm font-semibold px-2 py-1 rounded-full ${
              isPositiveChange 
                ? "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400" 
                : "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400"
            }`}>
              {isPositiveChange ? <TrendingUp className="h-3.5 w-3.5 mr-1" /> : <TrendingDown className="h-3.5 w-3.5 mr-1" />}
              {Math.abs(changePercentage)}%
            </span>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Large transactions ({'>'}$100K) in the past 24h</p>
        </>
      )}
    </div>
  );
};

export default function LCDashboard() {
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
  
  // Use the unified team data context instead of separate hooks
  const { 
    portfolio, 
    portfolioLoading,
    portfolioError,
    watchlist,
    watchlistLoading,
    watchlistError,
    getTargetPercentage,
    refreshPortfolio,
    refreshWatchlist
  } = useTeamData();
  
  // Create consistent animation classes based on loading state - initialize to true to avoid flicker
  const [initialLoadComplete, setInitialLoadComplete] = useState(true);
  
  // Track if content has been shown - once shown, never go back to loading
  const [hasShownContent, setHasShownContent] = useState(false);
  
  // Effect to track if content has been shown
  useEffect(() => {
    if (!marketDataLoading && !portfolioLoading && !watchlistLoading && 
        (portfolio || btcPrice || ethPrice || watchlist)) {
      setHasShownContent(true);
    }
  }, [marketDataLoading, portfolioLoading, watchlistLoading, 
      portfolio, btcPrice, ethPrice, watchlist]);
  
  // Ensure we exit loading state after a reasonable timeout
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setHasTimedOut(true);
      setInitialLoadComplete(true);
      setHasShownContent(true);
    }, 5000); // Reduced to 5 seconds
    
    return () => clearTimeout(timeoutId);
  }, []);

  // Force immediate data prefetch on first render to avoid white flash in widgets
  useEffect(() => {
    // This runs only once and immediately prefetches all data
    const fetchAllData = async () => {
      try {
        if (!btcPrice || !ethPrice || !globalData) {
          console.log('Prefetching market data');
          refreshData().catch(err => console.error('Error prefetching market data:', err));
        }
        
        if (!portfolio) {
          console.log('Prefetching portfolio data');
          refreshPortfolio().catch(err => console.error('Error prefetching portfolio data:', err));
        }
        
        if (!watchlist) {
          console.log('Prefetching watchlist data');
          refreshWatchlist().catch(err => console.error('Error prefetching watchlist data:', err));
        }
      } catch (error) {
        console.error('Error during prefetch:', error);
      }
    };
    
    fetchAllData();
  }, []); // Empty dependency array means this runs once on mount
  
  // Simplify loading state logic - never go back to loading once content shown
  const isLoading = hasTimedOut || hasShownContent ? false : 
                   (marketDataLoading || portfolioLoading || watchlistLoading);
  
  // Manual refresh function with visual feedback - simplified to prevent additional re-renders
  const handleManualRefresh = useCallback(() => {
    const refreshPromises = [
      refreshPortfolio(),
      refreshWatchlist(),
      refreshData()
    ];
    
    Promise.all(refreshPromises).catch(error => {
      console.error("Error during manual refresh:", error);
    });
  }, [refreshPortfolio, refreshWatchlist, refreshData]);

  // Show loading state while auth is being checked
  if (authLoading || !user) {
    return (
      <div className="flex min-h-[calc(100vh-16rem)] items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300 animate-pulse">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`container mx-auto py-6 px-4 max-w-7xl transition-opacity-transform duration-600 ${showContent ? 'opacity-100' : 'opacity-0'}`}>
      {/* Dashboard Header */}
      <div className="w-full flex flex-col md:flex-row md:items-center md:justify-between mb-4">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-3 md:mb-0">Team Dashboard</h1>
        <div className="flex items-center space-x-2">
          <button
            onClick={handleManualRefresh}
            disabled={isRefreshing}
            className={`px-3 py-1.5 rounded-lg bg-blue-500 hover:bg-blue-600 text-white transition-colors flex items-center ${isRefreshing ? 'opacity-70 cursor-not-allowed' : ''}`}
          >
            <svg className={`w-4 h-4 mr-1.5 ${isRefreshing ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
            </svg>
            {isRefreshing ? 'Refreshing...' : 'Refresh Data'}
          </button>
          {lastUpdated && (
            <span className="text-xs text-gray-500 dark:text-gray-400">
              Last updated: {lastUpdated.toLocaleTimeString()}
            </span>
          )}
        </div>
      </div>
      
      {/* Market Analysis Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className={initialLoadComplete ? "animate-scaleIn" : "opacity-0 transition-opacity-transform"} style={{ transitionDelay: '100ms', animationDelay: '100ms' }}>
          <FearGreedCard loading={isLoading} />
        </div>
        
        {/* Make sure all cards use dark theme appropriate skeletons */}
        <div className={initialLoadComplete ? "animate-scaleIn" : "opacity-0 transition-opacity-transform"} style={{ transitionDelay: '150ms', animationDelay: '150ms' }}>
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 transition-all duration-300 hover:shadow-card-hover">
            <h3 className="text-sm text-gray-500 dark:text-gray-400 mb-4">Market Cap</h3>
            {isLoading ? (
              <div className="h-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
            ) : (
              <div className="space-y-2">
                <p className="text-2xl font-bold">${globalData?.totalMarketCap ? (globalData.totalMarketCap / 1e12).toFixed(2) : '0'}T</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Global cryptocurrency market cap</p>
              </div>
            )}
          </div>
        </div>
        <div className={initialLoadComplete ? "animate-scaleIn" : "opacity-0 transition-opacity-transform"} style={{ transitionDelay: '200ms', animationDelay: '200ms' }}>
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 transition-all duration-300 hover:shadow-card-hover">
            <h3 className="text-sm text-gray-500 dark:text-gray-400 mb-4">BTC Dominance</h3>
            {isLoading ? (
              <div className="h-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
            ) : (
              <div className="space-y-2">
                <p className="text-2xl font-bold">{globalData?.btcDominance?.toFixed(1) || '0'}%</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Percentage of market cap</p>
              </div>
            )}
          </div>
        </div>
        <div className={initialLoadComplete ? "animate-scaleIn" : "opacity-0 transition-opacity-transform"} style={{ transitionDelay: '250ms', animationDelay: '250ms' }}>
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 transition-all duration-300 hover:shadow-card-hover">
            <h3 className="text-sm text-gray-500 dark:text-gray-400 mb-4">24h Volume</h3>
            {isLoading ? (
              <div className="h-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
            ) : (
              <div className="space-y-2">
                <p className="text-2xl font-bold">${globalData?.totalVolume24h ? (globalData.totalVolume24h / 1e9).toFixed(2) : '0'}B</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total trading volume in 24h</p>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Team Portfolio Section - Takes up 2/3 of the space */}
        <div className={`lg:col-span-2 ${initialLoadComplete ? "animate-slide-up" : "opacity-0 transition-opacity-transform"}`} style={{ transitionDelay: '300ms', animationDelay: '300ms' }}>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 transition-all duration-300" style={{ minHeight: 'calc(100vh - 24rem)' }}>
            {/* Render without Suspense to prevent duplicate initialization */}
            {portfolioLoading ? (
              <PortfolioLoadingSkeleton />
            ) : (
              <TeamPortfolio 
                portfolio={portfolio}
                loading={portfolioLoading}
                error={portfolioError}
                isDataLoading={isLoading}
                btcPrice={btcPrice}
                ethPrice={ethPrice}
                globalData={globalData}
              />
            )}
          </div>
        </div>
        
        {/* Team Watchlist Section - Takes up 1/3 of the space */}
        <div className={`lg:col-span-1 ${initialLoadComplete ? "animate-slide-up" : "opacity-0 transition-opacity-transform"}`} style={{ transitionDelay: '300ms', animationDelay: '300ms' }}>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 transition-all duration-300" style={{ minHeight: 'calc(100vh - 24rem)' }}>
            <h2 className="text-xl font-bold mb-4">Altcoin Watchlist</h2>
            {/* Render without Suspense to prevent duplicate initialization */}
            {watchlistLoading ? (
              <WatchlistLoadingSkeleton />
            ) : (
              <TeamWatchlist 
                watchlist={watchlist}
                loading={watchlistLoading}
                error={watchlistError}
                isDataLoading={isLoading}
                globalData={globalData}
                getTargetPercentage={getTargetPercentage}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 