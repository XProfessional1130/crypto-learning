'use client';

import { useState, useEffect, useMemo, Suspense, useCallback } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useTeamData } from '@/lib/context/team-data-context';
import { getBtcPrice, getEthPrice, getGlobalData, GlobalData } from '@/lib/services/coinmarketcap';
import dynamic from 'next/dynamic';
import { ReactNode } from 'react';
import { TrendingUp, TrendingDown, Activity, DollarSign, AlertCircle } from 'lucide-react';

// Dynamically import heavy components with proper loading skeletons
const TeamPortfolio = dynamic(() => import('../components/lc-dashboard/TeamPortfolio'), {
  loading: () => <PortfolioLoadingSkeleton />,
  ssr: false // Disable SSR for these components to prevent double initialization
});

const TeamWatchlist = dynamic(() => import('../components/lc-dashboard/TeamWatchlist'), {
  loading: () => <WatchlistLoadingSkeleton />,
  ssr: false // Disable SSR for these components to prevent double initialization
});

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
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Large transactions (>$100K) in the past 24h</p>
        </>
      )}
    </div>
  );
};

// Market Overview Component
const MarketOverviewCard = ({ 
  loading = false, 
  btcPrice, 
  ethPrice, 
  globalData 
}: { 
  loading?: boolean; 
  btcPrice: number | null;
  ethPrice: number | null;
  globalData: GlobalData | null;
}) => {
  // Format crypto prices with appropriate number of decimals
  const formatCryptoPrice = (price: number): string => {
    if (price >= 1000) {
      return `$${price.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
    } else if (price >= 1) {
      return `$${price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    } else {
      return `$${price.toLocaleString(undefined, { minimumSignificantDigits: 2, maximumSignificantDigits: 4 })}`;
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm transition-all duration-300 hover:shadow-card-hover transform hover:-translate-y-1">
      <div className="flex items-center mb-3">
        <TrendingUp className="w-5 h-5 mr-2 text-gray-500 dark:text-gray-400" />
        <p className="text-sm text-gray-500 dark:text-gray-400">Market Overview</p>
      </div>
      
      {loading ? (
        <div className="animate-pulse space-y-3">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-28"></div>
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-36"></div>
        </div>
      ) : (
        <>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500 dark:text-gray-400">Market Cap:</span>
              <span className="font-semibold">
                ${globalData?.totalMarketCap ? (globalData.totalMarketCap / 1e12).toFixed(2) : '---'}T
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500 dark:text-gray-400">24h Volume:</span>
              <span className="font-semibold">
                ${globalData?.totalVolume24h ? (globalData.totalVolume24h / 1e9).toFixed(2) : '---'}B
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500 dark:text-gray-400">BTC:</span>
              <span className="font-semibold">
                {btcPrice ? formatCryptoPrice(btcPrice) : '---'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500 dark:text-gray-400">ETH:</span>
              <span className="font-semibold">
                {ethPrice ? formatCryptoPrice(ethPrice) : '---'}
              </span>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default function LCDashboard() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [btcPrice, setBtcPrice] = useState<number | null>(null);
  const [ethPrice, setEthPrice] = useState<number | null>(null);
  const [globalData, setGlobalData] = useState<GlobalData | null>(null);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  const [showContent, setShowContent] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

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
  
  // Calculate loading states
  const loading = isLoading || portfolioLoading || watchlistLoading;
  const error = portfolioError || watchlistError;
  
  // Create consistent animation classes based on loading state
  const contentAnimationClass = initialLoadComplete ? "animate-fadeIn" : "opacity-0 transition-opacity-transform";
  const cardAnimationClass = initialLoadComplete ? "animate-scaleIn" : "opacity-0 transition-opacity-transform";
  const listItemAnimationClass = initialLoadComplete ? "animate-slide-up" : "opacity-0 transition-opacity-transform";
  
  // Check authentication once
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/signin');
    }
  }, [user, authLoading, router]);
  
  // Add a smooth transition for the main content
  useEffect(() => {
    if (!authLoading && user) {
      const timer = setTimeout(() => {
        setShowContent(true);
      }, 300);
      
      return () => clearTimeout(timer);
    }
  }, [authLoading, user]);

  // After first data load is complete, trigger main content visibility
  useEffect(() => {
    if (!loading && !error) {
      // Short delay to ensure data is processed before showing animations
      const timer = setTimeout(() => {
        setInitialLoadComplete(true);
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [loading, error]);

  // Fetch price data in a single effect
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch prices and global data in parallel
        const [btcPriceData, ethPriceData, globalMarketData] = await Promise.all([
          getBtcPrice(),
          getEthPrice(),
          getGlobalData()
        ]);
        
        setBtcPrice(btcPriceData);
        setEthPrice(ethPriceData);
        setGlobalData(globalMarketData);
      } catch (error) {
        console.error('Error fetching crypto data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    if (user) {
      fetchData();
      
      // Set up refresh interval (5 minutes)
      const intervalId = setInterval(fetchData, 5 * 60 * 1000);
      return () => clearInterval(intervalId);
    }
  }, [user]);
  
  // Manual refresh function with visual feedback
  const handleManualRefresh = useCallback(() => {
    setIsRefreshing(true);
    
    Promise.all([
      refreshPortfolio(),
      refreshWatchlist(),
      getBtcPrice().then(setBtcPrice),
      getEthPrice().then(setEthPrice),
      getGlobalData().then(setGlobalData)
    ]).finally(() => {
      // Add a minimum duration for the refresh animation
      setTimeout(() => setIsRefreshing(false), 500);
    });
  }, [refreshPortfolio, refreshWatchlist]);

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
      <div className="mb-6 flex justify-between items-center">
        <div className={contentAnimationClass} style={{ transitionDelay: '0ms' }}>
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white">LC Team Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-300">Welcome to the Learning Crypto team dashboard!</p>
        </div>
        
        <button 
          onClick={handleManualRefresh}
          className={`p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-teal-500 ${contentAnimationClass}`}
          style={{ transitionDelay: '50ms' }}
          aria-label="Refresh dashboard"
        >
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2"
            strokeLinecap="round" 
            strokeLinejoin="round" 
            className={`w-5 h-5 text-gray-500 dark:text-gray-400 ${isRefreshing ? 'animate-refresh-spin' : ''}`}
          >
            <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2" />
          </svg>
        </button>
      </div>
      
      {/* Market Analysis Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className={cardAnimationClass} style={{ transitionDelay: '100ms', animationDelay: '100ms' }}>
          <FearGreedCard loading={isLoading} />
        </div>
        <div className={cardAnimationClass} style={{ transitionDelay: '150ms', animationDelay: '150ms' }}>
          <OnChainActivityCard loading={isLoading} />
        </div>
        <div className={cardAnimationClass} style={{ transitionDelay: '200ms', animationDelay: '200ms' }}>
          <WhaleTrackingCard loading={isLoading} />
        </div>
        <div className={cardAnimationClass} style={{ transitionDelay: '250ms', animationDelay: '250ms' }}>
          <MarketOverviewCard 
            loading={isLoading} 
            btcPrice={btcPrice} 
            ethPrice={ethPrice} 
            globalData={globalData}
          />
        </div>
      </div>
      
      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Team Portfolio Section - Takes up 2/3 of the space */}
        <div className={`lg:col-span-2 ${contentAnimationClass}`} style={{ transitionDelay: '300ms', animationDelay: '300ms' }}>
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
        <div className={`lg:col-span-1 ${contentAnimationClass}`} style={{ transitionDelay: '300ms', animationDelay: '300ms' }}>
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