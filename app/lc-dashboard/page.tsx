'use client';

import { useState, useEffect, useMemo, Suspense } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useTeamPortfolio } from '@/lib/hooks/useTeamPortfolio';
import { useTeamWatchlist } from '@/lib/hooks/useTeamWatchlist';
import { getBtcPrice, getEthPrice, getGlobalData, GlobalData } from '@/lib/services/coinmarketcap';
import dynamic from 'next/dynamic';
import { ReactNode } from 'react';
import { TrendingUp, TrendingDown, Activity, DollarSign, AlertCircle } from 'lucide-react';

// Dynamically import heavy components
const TeamPortfolio = dynamic(() => import('../components/lc-dashboard/TeamPortfolio'), {
  loading: () => <PortfolioLoadingSkeleton />
});
const TeamWatchlist = dynamic(() => import('../components/lc-dashboard/TeamWatchlist'), {
  loading: () => <WatchlistLoadingSkeleton />
});

// Loading skeletons for better UX during component loading
const PortfolioLoadingSkeleton = () => (
  <div className="animate-pulse space-y-4">
    <div className="h-8 bg-gray-200 rounded w-1/3"></div>
    <div className="h-4 bg-gray-200 rounded w-2/3"></div>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="bg-gray-100 p-6 rounded-lg">
          <div className="h-6 bg-gray-200 rounded w-1/2 mb-3"></div>
          <div className="h-10 bg-gray-200 rounded w-3/4"></div>
        </div>
      ))}
    </div>
    <div className="mt-6">
      <div className="h-10 bg-gray-200 rounded w-full mb-4"></div>
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex justify-between items-center p-3 border-b border-gray-100">
          <div className="h-6 bg-gray-200 rounded w-1/4"></div>
          <div className="h-6 bg-gray-200 rounded w-1/5"></div>
          <div className="h-6 bg-gray-200 rounded w-1/6"></div>
        </div>
      ))}
    </div>
  </div>
);

const WatchlistLoadingSkeleton = () => (
  <div className="animate-pulse space-y-4">
    <div className="h-8 bg-gray-200 rounded w-1/3"></div>
    <div className="h-4 bg-gray-200 rounded w-2/3"></div>
    <div className="mt-6">
      <div className="h-10 bg-gray-200 rounded w-full mb-4"></div>
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex justify-between items-center p-3 border-b border-gray-100">
          <div className="h-6 bg-gray-200 rounded w-1/4"></div>
          <div className="h-6 bg-gray-200 rounded w-1/5"></div>
          <div className="h-6 bg-gray-200 rounded w-1/6"></div>
          <div className="h-6 bg-gray-200 rounded w-1/6"></div>
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
    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm">
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
            <span className={`text-sm font-semibold px-2 py-1 rounded-full ${
              sentiment === "Greed" || sentiment === "Extreme Greed" 
                ? "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400" 
                : sentiment === "Neutral" 
                  ? "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400"
                  : "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400"
            }`}>
              {sentiment}
            </span>
          </div>
          <div className="relative h-3 w-full rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
            <div 
              className={`absolute left-0 top-0 h-full ${colorClass}`} 
              style={{ width: `${fearGreedValue}%` }}
            ></div>
          </div>
          <p className="mt-3 text-xs text-gray-600 dark:text-gray-300">
            Market sentiment indicates caution as investors show signs of greed. Consider reviewing portfolio allocations.
          </p>
        </>
      )}
    </div>
  );
};

// On-Chain Activity Card Component
const OnChainActivityCard = ({ loading = false }) => {
  // Placeholder data - would come from API
  const onChainMetrics = [
    { name: "BTC Active Addresses", value: "+12%", trend: "up" },
    { name: "ETH Gas Price", value: "-8%", trend: "down" },
    { name: "Exchange BTC Reserves", value: "-2.3%", trend: "up" }
  ];

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm">
      <div className="flex items-center mb-3">
        <Activity className="w-5 h-5 mr-2 text-gray-500 dark:text-gray-400" />
        <p className="text-sm text-gray-500 dark:text-gray-400">On-Chain Activity</p>
      </div>
      
      {loading ? (
        <div className="animate-pulse space-y-3">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
        </div>
      ) : (
        <div className="space-y-3">
          {onChainMetrics.map((metric, index) => (
            <div key={index} className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-300">{metric.name}</span>
              <span className={`text-sm font-medium ${
                metric.trend === "up" 
                  ? "text-green-500" 
                  : "text-red-500"
              }`}>
                {metric.trend === "up" ? 
                  <span className="flex items-center">
                    {metric.value} 
                    <TrendingUp className="w-3 h-3 ml-1" />
                  </span> : 
                  <span className="flex items-center">
                    {metric.value}
                    <TrendingDown className="w-3 h-3 ml-1" />
                  </span>
                }
              </span>
            </div>
          ))}
          <p className="mt-2 text-xs text-gray-600 dark:text-gray-300 pt-2 border-t border-gray-100 dark:border-gray-700">
            Decreasing exchange reserves suggest accumulation phase is ongoing.
          </p>
        </div>
      )}
    </div>
  );
};

// Whale Tracking Card Component
const WhaleTrackingCard = ({ loading = false }) => {
  // Placeholder data - would come from API
  const whaleTransactions = [
    { wallet: "0x7a2...3f1b", action: "Buy", asset: "BTC", amount: "235 BTC", valueUsd: "$9.7M" },
    { wallet: "0x3b4...9c7e", action: "Sell", asset: "ETH", amount: "1,250 ETH", valueUsd: "$2.8M" }
  ];

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm">
      <div className="flex items-center mb-3">
        <DollarSign className="w-5 h-5 mr-2 text-gray-500 dark:text-gray-400" />
        <p className="text-sm text-gray-500 dark:text-gray-400">Whale Tracking</p>
      </div>
      
      {loading ? (
        <div className="animate-pulse space-y-3">
          <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
          <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
        </div>
      ) : (
        <div className="space-y-3">
          {whaleTransactions.map((tx, index) => (
            <div key={index} className="flex items-center justify-between text-sm border-b border-gray-100 dark:border-gray-700 pb-2">
              <div className="flex items-center">
                <div className={`w-2 h-2 rounded-full mr-2 ${
                  tx.action === "Buy" ? "bg-green-500" : "bg-red-500"
                }`}></div>
                <span className="text-gray-600 dark:text-gray-300 mr-2">{tx.wallet}</span>
                <span className={`font-medium ${
                  tx.action === "Buy" ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
                }`}>
                  {tx.action}
                </span>
              </div>
              <div className="text-right">
                <div className="font-medium text-gray-800 dark:text-gray-200">{tx.amount}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">{tx.valueUsd}</div>
              </div>
            </div>
          ))}
          <p className="mt-2 text-xs text-gray-600 dark:text-gray-300">
            Significant BTC accumulation by whales suggests confidence in medium-term outlook.
          </p>
        </div>
      )}
    </div>
  );
};

// Market Overview Card Component
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
  // Some derived metrics - in real app would come from API
  const btcDominance = globalData?.btcDominance || 52.4;
  const totalMarketCap = globalData?.totalMarketCap || "1.89T";
  const vol24h = globalData?.totalVolume24h || "98.7B";
  
  const formatCryptoPrice = (price: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(price || 0);
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm">
      <div className="flex items-center mb-3">
        <TrendingUp className="w-5 h-5 mr-2 text-gray-500 dark:text-gray-400" />
        <p className="text-sm text-gray-500 dark:text-gray-400">Market Overview</p>
      </div>
      
      {loading ? (
        <div className="animate-pulse space-y-3">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Market Cap</div>
              <div className="text-sm font-medium">${totalMarketCap}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500 dark:text-gray-400">24h Volume</div>
              <div className="text-sm font-medium">${vol24h}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500 dark:text-gray-400">BTC Price</div>
              <div className="text-sm font-medium">{formatCryptoPrice(btcPrice || 0)}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500 dark:text-gray-400">ETH Price</div>
              <div className="text-sm font-medium">{formatCryptoPrice(ethPrice || 0)}</div>
            </div>
          </div>
          <div className="pt-2 border-t border-gray-100 dark:border-gray-700">
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-500 dark:text-gray-400">BTC Dominance</span>
              <span className="text-xs font-medium">{btcDominance.toFixed(1)}%</span>
            </div>
            <div className="mt-1 relative h-2 w-full rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
              <div 
                className="absolute left-0 top-0 h-full bg-orange-500" 
                style={{ width: `${btcDominance}%` }}
              ></div>
            </div>
          </div>
        </div>
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

  // Load team portfolio data
  const { portfolio, loading: portfolioLoading, error: portfolioError } = useTeamPortfolio();
  
  // Load team watchlist data
  const { 
    watchlist, 
    loading: watchlistLoading, 
    error: watchlistError,
    getTargetPercentage 
  } = useTeamWatchlist();

  // Check authentication once
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/signin');
    }
  }, [user, authLoading, router]);

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

  // Show loading state while auth is being checked
  if (authLoading || !user) {
    return (
      <div className="flex min-h-[calc(100vh-16rem)] items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 px-4 max-w-7xl">
      {/* Dashboard Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white">LC Team Dashboard</h1>
        <p className="text-gray-600 dark:text-gray-300">Welcome to the Learning Crypto team dashboard!</p>
      </div>
      
      {/* Market Analysis Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <FearGreedCard loading={isLoading} />
        <OnChainActivityCard loading={isLoading} />
        <WhaleTrackingCard loading={isLoading} />
        <MarketOverviewCard 
          loading={isLoading} 
          btcPrice={btcPrice} 
          ethPrice={ethPrice} 
          globalData={globalData}
        />
      </div>
      
      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Team Portfolio Section - Takes up 2/3 of the space */}
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6" style={{ minHeight: 'calc(100vh - 24rem)' }}>
            <Suspense fallback={<PortfolioLoadingSkeleton />}>
              <TeamPortfolio 
                portfolio={portfolio}
                loading={portfolioLoading}
                error={portfolioError}
                isDataLoading={isLoading}
                btcPrice={btcPrice}
                ethPrice={ethPrice}
                globalData={globalData}
              />
            </Suspense>
          </div>
        </div>
        
        {/* Team Watchlist Section - Takes up 1/3 of the space */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6" style={{ minHeight: 'calc(100vh - 24rem)' }}>
            <h2 className="text-xl font-bold mb-4">Altcoin Watchlist</h2>
            <Suspense fallback={<WatchlistLoadingSkeleton />}>
              <TeamWatchlist 
                watchlist={watchlist}
                loading={watchlistLoading}
                error={watchlistError}
                isDataLoading={isLoading}
                globalData={globalData}
                getTargetPercentage={getTargetPercentage}
              />
            </Suspense>
          </div>
        </div>
      </div>
    </div>
  );
} 