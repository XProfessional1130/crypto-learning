import { useState, useEffect, useMemo, useCallback, memo, useRef } from 'react';
import { usePortfolio } from '@/hooks/dashboard/usePortfolio';
import { useAuth } from '@/lib/providers/auth-provider';
import { useWatchlist } from '@/hooks/dashboard/useWatchlist';
import WatchlistComponent from './WatchlistComponent';
import CryptoNews from './CryptoNews';
import { useDataCache } from '@/lib/providers/data-cache-provider';
import { TrendingUp, TrendingDown } from 'lucide-react';
import AddCoinModal from './AddCoinModal';
import AssetDetailModal from './AssetDetailModal';
import Image from 'next/image';
import { GlobalData } from '@/lib/api/coinmarketcap';
import { PortfolioItemWithPrice } from '@/types/portfolio';
import { formatCryptoPrice, formatLargeNumber, formatPercentage } from '@/lib/utils/formatters';

// Memoized Stats Card component
const StatsCard = memo(({ title, value, icon = null, dominance = null, loading = false, valueClassName = '', changeInfo = null, showChangeIcon = false }: {
  title: string;
  value: string;
  icon?: React.ReactNode;
  dominance?: number | null;
  loading?: boolean;
  valueClassName?: string;
  changeInfo?: {
    value: number;
    isPositive: boolean;
    label?: string;
  } | null;
  showChangeIcon?: boolean;
}) => {
  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm transition-all duration-300 hover:shadow-card-hover transform hover:-translate-y-1">
      <div className="flex items-center mb-2">
        {icon && <div className="mr-2">{icon}</div>}
        <p className="text-sm text-gray-500 dark:text-gray-400">{title}</p>
      </div>
      
      {loading ? (
        <div className="flex items-center h-9">
          <div className="animate-pulse bg-gray-200 dark:bg-gray-700 h-8 w-24 rounded"></div>
        </div>
      ) : (
        <>
          <div className="flex items-center">
            <p className={`text-3xl font-bold ${valueClassName}`}>
              {value}
            </p>
            {changeInfo && showChangeIcon && (
              <div className={`ml-2 ${changeInfo.isPositive ? 'text-green-500' : 'text-red-500'}`}>
                {changeInfo.isPositive ? (
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                    <path fillRule="evenodd" d="M10 17a.75.75 0 01-.75-.75V5.612L5.29 9.77a.75.75 0 01-1.08-1.04l5.25-5.5a.75.75 0 011.08 0l5.25 5.5a.75.75 0 11-1.08 1.04l-3.96-4.158V16.25A.75.75 0 0110 17z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                    <path fillRule="evenodd" d="M10 3a.75.75 0 01.75.75v10.638l3.96-4.158a.75.75 0 111.08 1.04l-5.25 5.5a.75.75 0 01-1.08 0l-5.25-5.5a.75.75 0 111.08-1.04l3.96 4.158V3.75A.75.75 0 0110 3z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
            )}
          </div>
          {changeInfo && (
            <div className="mt-2">
              <div className={`${changeInfo.isPositive ? 'text-green-500' : 'text-red-500'} text-sm flex items-center`}>
                <span className="font-medium">
                  {changeInfo.isPositive ? '+' : ''}{changeInfo.value.toFixed(2)}%
                </span>
                {changeInfo.label && (
                  <span className="ml-1 text-gray-500 dark:text-gray-400">
                    {changeInfo.label}
                  </span>
                )}
              </div>
            </div>
          )}
          {dominance !== null && (
            <div className="mt-2 flex items-center">
              <div className={`${title.includes('Bitcoin') ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400' : 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'} text-xs px-2 py-0.5 rounded-full flex items-center`}>
                <span className="font-medium">
                  {dominance ? dominance.toFixed(1) : '---'}% Dominance
                </span>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
});
StatsCard.displayName = 'StatsCard';

// Modified component for better portfolio stats visualization
function PortfolioStatsCard({ 
  portfolioValue, 
  dailyChange, 
  loading = false,
  portfolioItems = []
}: { 
  portfolioValue: number, 
  dailyChange: number,
  loading?: boolean,
  portfolioItems: PortfolioItemWithPrice[]
}) {
  // Calculate the distribution percentages based on actual portfolio data
  const distributionData = useMemo(() => {
    if (!portfolioItems.length || portfolioValue <= 0) return [];
    
    // Get top assets to show individually (top 4)
    const topCount = 4;
    const sortedItems = [...portfolioItems].sort((a, b) => b.valueUsd - a.valueUsd);
    
    // Calculate top assets
    const topAssets = sortedItems.slice(0, topCount).map(item => ({
      name: item.coinSymbol,
      value: item.valueUsd,
      percentage: (item.valueUsd / portfolioValue) * 100,
      color: getColorForAsset(item.coinSymbol)
    }));
    
    // Calculate "Others" if there are more than topCount assets
    if (sortedItems.length > topCount) {
      const othersValue = sortedItems
        .slice(topCount)
        .reduce((sum, item) => sum + item.valueUsd, 0);
      
      const othersPercentage = (othersValue / portfolioValue) * 100;
      
      if (othersPercentage > 0) {
        topAssets.push({
          name: "Others",
          value: othersValue,
          percentage: othersPercentage,
          color: "bg-gray-400"
        });
      }
    }
    
    return topAssets;
  }, [portfolioItems, portfolioValue]);
  
  // Helper function to get color based on asset symbol
  function getColorForAsset(symbol: string): string {
    const colors = {
      BTC: 'bg-orange-500',
      ETH: 'bg-blue-500',
      default1: 'bg-teal-500',
      default2: 'bg-purple-500',
      default3: 'bg-pink-500',
      default4: 'bg-indigo-500'
    };
    
    if (symbol === 'BTC') return colors.BTC;
    if (symbol === 'ETH') return colors.ETH;
    
    // Return a default color based on the first character of the symbol
    const charCode = symbol.charCodeAt(0) % 4;
    return [colors.default1, colors.default2, colors.default3, colors.default4][charCode];
  }
  
  const isPositive = dailyChange >= 0;
  
  return (
    <div className="bg-white dark:bg-gradient-to-br dark:from-slate-800 dark:to-slate-900 rounded-xl shadow-md dark:shadow-lg border border-gray-200 dark:border-slate-700/50 p-5 transition-all duration-300 relative overflow-hidden">
      <div className="flex justify-between items-start mb-5 relative z-10">
        <div>
          <h3 className="text-sm text-gray-500 dark:text-gray-400 mb-1">Portfolio Summary</h3>
          <div className="flex items-baseline space-x-2">
            {loading ? (
              <div className="h-9 w-40 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
            ) : (
              <>
                <p className="text-2xl font-bold text-gray-800 dark:text-white">
                  ${portfolioValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
                <div className={`flex items-center ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
                  {isPositive ? (
                    <TrendingUp className="h-4 w-4 mr-1" />
                  ) : (
                    <TrendingDown className="h-4 w-4 mr-1" />
                  )}
                  <span className="text-sm">{isPositive ? '+' : ''}{dailyChange.toFixed(2)}%</span>
                </div>
              </>
            )}
          </div>
        </div>
        <div className={`bg-gray-100 dark:bg-gray-700 p-2 rounded-full flex items-center justify-center ${isPositive ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400' : 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'}`}>
          {isPositive ? (
            <TrendingUp className="h-5 w-5" />
          ) : (
            <TrendingDown className="h-5 w-5" />
          )}
        </div>
      </div>

      {!loading && portfolioValue > 0 && (
        <div className="mt-4 relative z-10">
          <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-2">
            <span>Portfolio Distribution</span>
          </div>
          
          {/* Distribution bar */}
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            {distributionData.length > 0 ? (
              <div className="flex h-full">
                {distributionData.map((item, index) => (
                  <div 
                    key={index} 
                    className={`h-full ${item.color}`} 
                    style={{ width: `${item.percentage}%` }}
                  ></div>
                ))}
              </div>
            ) : (
              <div className="flex h-full">
                <div className="bg-gray-300 dark:bg-gray-600 h-full w-full"></div>
              </div>
            )}
          </div>
          
          {/* Legend */}
          {distributionData.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {distributionData.map((item, index) => (
                <div key={index} className="flex items-center">
                  <div className={`w-3 h-3 rounded-full ${item.color} mr-1.5`}></div>
                  <span className="text-xs text-gray-600 dark:text-gray-400">
                    {item.name} ({item.percentage.toFixed(1)}%)
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      
      {/* Decorative Elements */}
      <div className="absolute -bottom-8 -right-8 w-32 h-32 rounded-full bg-emerald-500/5 dark:bg-emerald-500/10 blur-xl"></div>
      <div className="absolute -top-8 -left-8 w-24 h-24 rounded-full bg-blue-500/5 dark:bg-blue-500/10 blur-xl"></div>
    </div>
  );
}

// Enhanced market leaders card
function MarketLeadersCard({ 
  btcPrice, 
  ethPrice, 
  btcDominance,
  ethDominance,
  loading = false 
}: { 
  btcPrice: number | null, 
  ethPrice: number | null,
  btcDominance: number,
  ethDominance: number,
  loading?: boolean
}) {
  // Calculate combined dominance
  const combinedDominance = btcDominance + ethDominance;

  return (
    <div className="bg-white dark:bg-gradient-to-br dark:from-slate-800 dark:to-slate-900 rounded-xl shadow-md dark:shadow-lg border border-gray-200 dark:border-slate-700/50 p-5 transition-all duration-300 relative overflow-hidden h-full flex flex-col">
      <h3 className="text-sm text-gray-500 dark:text-gray-400 mb-5">Market Leaders</h3>
      
      <div className="grid grid-cols-2 gap-5 relative z-10 flex-grow">
        {/* Bitcoin Price */}
        <div className="space-y-1">
          <div className="flex items-center">
            <div className="w-5 h-5 bg-orange-500 rounded-full mr-2 flex items-center justify-center text-white text-xs font-bold">B</div>
            <span className="text-sm text-gray-600 dark:text-gray-300">Bitcoin</span>
          </div>
          {loading ? (
            <div className="h-7 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-24"></div>
          ) : (
            <div className="flex flex-col">
              <span className="text-lg font-semibold text-gray-800 dark:text-white">
                ${btcPrice?.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              </span>
              {btcDominance > 0 && (
                <span className="text-xs text-amber-600 dark:text-amber-400">
                  {btcDominance.toFixed(1)}% dominance
                </span>
              )}
            </div>
          )}
        </div>
        
        {/* Ethereum Price */}
        <div className="space-y-1">
          <div className="flex items-center">
            <div className="w-5 h-5 bg-blue-500 rounded-full mr-2 flex items-center justify-center text-white text-xs font-bold">E</div>
            <span className="text-sm text-gray-600 dark:text-gray-300">Ethereum</span>
          </div>
          {loading ? (
            <div className="h-7 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-24"></div>
          ) : (
            <div className="flex flex-col">
              <span className="text-lg font-semibold text-gray-800 dark:text-white">
                ${ethPrice?.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              </span>
              {ethDominance > 0 && (
                <span className="text-xs text-blue-600 dark:text-blue-400">
                  {ethDominance.toFixed(1)}% dominance
                </span>
              )}
            </div>
          )}
        </div>
      </div>
      
      {/* Combined dominance indicator */}
      {!loading && combinedDominance > 0 && (
        <p className="text-xs text-gray-500 dark:text-gray-400 text-left mt-auto pt-2 relative z-10">
          Combined market dominance: {combinedDominance.toFixed(1)}%
        </p>
      )}
      
      {/* Decorative Elements */}
      <div className="absolute -bottom-10 -left-10 w-40 h-40 rounded-full bg-orange-500/5 dark:bg-orange-500/10 blur-xl"></div>
      <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-blue-500/5 dark:bg-blue-500/10 blur-xl"></div>
    </div>
  );
}

// Memoized Portfolio Item component
const PortfolioItem = memo(({ item, onItemClick, totalPortfolioValue }: {
  item: PortfolioItemWithPrice;
  onItemClick: (item: PortfolioItemWithPrice) => void;
  totalPortfolioValue: number;
}) => {
  // Calculate percentage of total portfolio
  const portfolioPercentage = totalPortfolioValue > 0 
    ? (item.valueUsd / totalPortfolioValue) * 100 
    : 0;

  return (
    <div
      onClick={() => onItemClick(item)}
      className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700/70 transition-all duration-200 cursor-pointer transform hover:translate-x-1"
    >
      <div className="flex items-center">
        <div className="w-8 h-8 mr-3 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-xs font-bold overflow-hidden">
          <img
            src={`https://s2.coinmarketcap.com/static/img/coins/64x64/${item.coinId}.png`}
            alt={item.coinSymbol}
            className="w-full h-full object-cover"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
              const parent = target.parentElement;
              if (parent) {
                parent.innerHTML = item.coinSymbol.substring(0, 3);
              }
            }}
          />
        </div>
        <div>
          <p className="font-medium">{item.coinName}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">{item.coinSymbol}</p>
        </div>
      </div>
      <div className="text-right">
        <p className="font-medium">${item.valueUsd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
        <div className="flex items-center justify-end space-x-2">
          <p className={`text-sm ${item.priceChange24h >= 0 ? 'text-green-500' : 'text-red-500'}`}>
            {item.priceChange24h >= 0 ? '+' : ''}{item.priceChange24h.toFixed(2)}%
          </p>
          <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
            <svg className="w-3.5 h-3.5 mr-0.5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12,2L4,6.5v11L12,22l8-4.5v-11L12,2z M12,4.311l6,3.375v8.627l-6,3.375l-6-3.375V7.686L12,4.311z" />
              <path d="M12,6.5L7,9.25v5.5L12,17.5l5-2.75v-5.5L12,6.5z M12,8.122l3,1.65v3.456l-3,1.65l-3-1.65V9.772L12,8.122z" />
            </svg>
            {portfolioPercentage.toFixed(1)}%
          </div>
        </div>
      </div>
    </div>
  );
});
PortfolioItem.displayName = 'PortfolioItem';

// Create a memoized component for the PortfolioDashboard
function PortfolioDashboardComponent({ forceShow = false }: { forceShow?: boolean }) {
  const { 
    portfolio, 
    loading: portfolioLoading, 
    error: portfolioError, 
    preferredCurrency,
    changeCurrency,
    refreshPortfolio 
  } = usePortfolio();
  
  const {
    watchlist,
    loading: watchlistLoading,
    error: watchlistError,
    refreshWatchlist
  } = useWatchlist();

  // Use the shared data cache for market data
  const { 
    btcPrice, 
    ethPrice, 
    globalData, 
    isLoading: loadingPrices,
    refreshData
  } = useDataCache();
  
  const { user } = useAuth();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<PortfolioItemWithPrice | null>(null);
  const [isAssetDetailModalOpen, setIsAssetDetailModalOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const mountedRef = useRef(true); // Track if component is mounted
  const hasInitializedRef = useRef(false); // Track initial data load
  
  // Simplify loading logic - forceShow overrides all loading states
  const loading = forceShow ? false : (portfolioLoading || loadingPrices);
  const error = portfolioError || watchlistError;
  
  // Create a sorted version of the portfolio items
  const sortedPortfolioItems = useMemo(() => {
    if (!portfolio || !portfolio.items) return [];
    // Return a new sorted array by valueUsd (descending)
    return [...portfolio.items].sort((a, b) => b.valueUsd - a.valueUsd);
  }, [portfolio]);
  
  // Memoize the total portfolio value calculation
  const totalPortfolioValue = useMemo(() => {
    return portfolio?.totalValueUsd || 0;
  }, [portfolio]);
  
  // Simplified useEffect for component initialization and cleanup
  useEffect(() => {
    mountedRef.current = true;

    // Handle initial data loading (only once per component lifecycle)
    if (!hasInitializedRef.current) {
      hasInitializedRef.current = true;
      
      // Check what data we need to refresh, but don't refresh unnecessarily
      const needsDataRefresh = !btcPrice || !ethPrice;
      const needsPortfolioRefresh = !portfolio || !portfolio.items || portfolio.items.length === 0;
      const needsWatchlistRefresh = !watchlist || watchlist.length === 0;
      
      // Check for a recent refresh in sessionStorage to prevent unnecessary refreshes
      if (typeof window !== 'undefined') {
        const lastFetchTime = parseInt(sessionStorage.getItem('portfolio_dashboard_last_fetch') || '0', 10);
        const currentTime = Date.now();
        const timeSinceLastFetch = currentTime - lastFetchTime;
        
        // Only refresh if it's been more than 5 minutes (or if we have no cached timestamp)
        if (timeSinceLastFetch > 5 * 60 * 1000 || lastFetchTime === 0) {
          // Only refresh data if we actually need to
          if (needsDataRefresh || needsPortfolioRefresh || needsWatchlistRefresh) {
            console.log('Refreshing portfolio dashboard data');
            // Use Promise.all to batch all requests together for efficiency
            Promise.all([
              needsDataRefresh ? refreshData().catch((err: unknown) => console.error("Data refresh error:", err)) : Promise.resolve(),
              needsPortfolioRefresh ? refreshPortfolio(false).catch((err: unknown) => console.error("Portfolio refresh error:", err)) : Promise.resolve(),
              needsWatchlistRefresh ? refreshWatchlist(false).catch((err: unknown) => console.error("Watchlist refresh error:", err)) : Promise.resolve()
            ]);
            
            // Store the current timestamp in sessionStorage
            sessionStorage.setItem('portfolio_dashboard_last_fetch', currentTime.toString());
          }
        } else {
          console.log('Skipping portfolio dashboard refresh, last fetch was', Math.round(timeSinceLastFetch/1000), 'seconds ago');
        }
      } else {
        // If no window object (SSR), just refresh the data if needed
        if (needsDataRefresh || needsPortfolioRefresh || needsWatchlistRefresh) {
          // Use Promise.all to batch all requests together for efficiency
          Promise.all([
            needsDataRefresh ? refreshData().catch((err: unknown) => console.error("Data refresh error:", err)) : Promise.resolve(),
            needsPortfolioRefresh ? refreshPortfolio(false).catch((err: unknown) => console.error("Portfolio refresh error:", err)) : Promise.resolve(),
            needsWatchlistRefresh ? refreshWatchlist(false).catch((err: unknown) => console.error("Watchlist refresh error:", err)) : Promise.resolve()
          ]);
        }
      }
    }
    
    // Cleanup on unmount
    return () => {
      mountedRef.current = false;
    };
  }, [btcPrice, ethPrice, portfolio, watchlist, refreshData, refreshPortfolio, refreshWatchlist]);
  
  // Throttled refresh function to prevent excessive calls
  const throttledRefresh = useCallback(async () => {
    if (isRefreshing) return;
    
    setIsRefreshing(true);
    try {
      await refreshData();
      await refreshPortfolio(false);
    } catch (error) {
      console.error("Error refreshing data:", error);
    } finally {
      // Add a minimum duration for the refresh animation
      setTimeout(() => {
        if (mountedRef.current) {
          setIsRefreshing(false);
        }
      }, 500);
    }
  }, [refreshData, refreshPortfolio, isRefreshing]);
  
  // Handler for when a coin is added to ensure UI updates
  const handleCoinAdded = useCallback(() => {
    refreshPortfolio();
  }, [refreshPortfolio]);

  // Handler for when a watchlist item is added
  const handleWatchlistRefresh = useCallback(() => {
    refreshWatchlist();
  }, [refreshWatchlist]);

  // Handler for opening the asset detail modal
  const handleAssetClick = useCallback((asset: PortfolioItemWithPrice) => {
    setSelectedAsset(asset);
    setIsAssetDetailModalOpen(true);
  }, []);
  
  // Handler for closing the asset detail modal
  const handleAssetDetailModalClose = useCallback(() => {
    setIsAssetDetailModalOpen(false);
    setSelectedAsset(null);
    // Refresh the portfolio data to ensure UI is updated
    refreshPortfolio();
  }, [refreshPortfolio]);
  
  // Manual refresh function with visual feedback
  const handleManualRefresh = useCallback(() => {
    throttledRefresh();
  }, [throttledRefresh]);
  
  // Fetch watchlist data
  const getWatchlist = async () => {
    try {
      refreshWatchlist(true);
    } catch (err: unknown) {
      console.error('Failed to fetch watchlist:', err);
    }
  };
  
  if (loading && !forceShow) {
    return (
      <div className="max-w-7xl mx-auto py-6 px-4">
        {/* Skeleton Loading UI */}
        <div className="mb-6">
          <div className="h-8 w-48 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
          <div className="h-4 w-72 bg-gray-200 dark:bg-gray-700 rounded mt-2 animate-pulse"></div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm animate-pulse">
              <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
              <div className="h-8 w-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
            </div>
          ))}
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 animate-pulse">
            <div className="flex justify-between items-center mb-6">
              <div className="h-6 w-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
              <div className="h-8 w-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
            </div>
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex justify-between items-center py-3 border-b border-gray-100 dark:border-gray-700">
                <div className="flex items-center">
                  <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 mr-3"></div>
                  <div>
                    <div className="h-4 w-20 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
                    <div className="h-3 w-12 bg-gray-200 dark:bg-gray-700 rounded"></div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="h-4 w-16 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
                  <div className="h-3 w-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
                </div>
              </div>
            ))}
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 h-64 animate-pulse">
            <div className="h-6 w-24 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center py-2 border-b border-gray-100 dark:border-gray-700">
                <div className="w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-700 mr-2"></div>
                <div className="h-4 w-full bg-gray-200 dark:bg-gray-700 rounded"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="text-center py-10">
        <p className="text-red-500">{error}</p>
        <button 
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          onClick={() => refreshPortfolio(true)}
        >
          Try Again
        </button>
      </div>
    );
  }
  
  return (
    <div className="w-full">
      {/* Stats Cards Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Combined Portfolio Stats Card */}
        <div>
          <PortfolioStatsCard 
            portfolioValue={portfolio?.totalValueUsd || 0}
            dailyChange={portfolio?.dailyChangePercentage || 0}
            loading={loading && !forceShow}
            portfolioItems={sortedPortfolioItems}
          />
        </div>
        
        {/* Combined Market Leaders Card */}
        <div>
          <MarketLeadersCard 
            btcPrice={btcPrice}
            ethPrice={ethPrice}
            btcDominance={typeof globalData?.btcDominance === 'number' ? globalData.btcDominance : 0}
            ethDominance={typeof globalData?.ethDominance === 'number' ? globalData.ethDominance : 0}
            loading={loading && !forceShow}
          />
        </div>
      </div>
      
      {/* Main Content - Portfolio and Watchlist */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Portfolio Section - Takes up 2/3 of the space */}
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-gradient-to-br dark:from-slate-800 dark:to-slate-900 rounded-xl shadow-md dark:shadow-lg border border-gray-200 dark:border-slate-700/50 p-5 relative overflow-hidden" style={{ minHeight: 'calc(100vh - 24rem)' }}>
            {/* Portfolio Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 pb-3 border-b border-gray-200 dark:border-slate-700/50 relative z-10">
              <h2 className="text-xl font-bold text-gray-800 dark:text-white tracking-tight flex items-center">
                <div className="w-2 h-8 bg-emerald-500 rounded-full mr-2"></div>
                Your Portfolio
              </h2>
              <div className="flex items-center mt-2 sm:mt-0">
                <button 
                  onClick={() => setIsAddModalOpen(true)}
                  className="text-white bg-teal-600 hover:bg-teal-700 px-4 py-2 rounded-lg"
                >
                  Add Asset
                </button>
                <div className="flex items-center ml-3 bg-gray-100/80 dark:bg-slate-800/80 px-3 py-1.5 rounded-full border border-gray-200 dark:border-slate-700/50 backdrop-blur-sm">
                  <span className="text-xs text-gray-600 dark:text-slate-300 flex items-center">
                    <span>Assets:</span>
                    <span className="ml-1.5 font-medium text-gray-800 dark:text-white">
                      {sortedPortfolioItems.length || 0}
                    </span>
                  </span>
                </div>
              </div>
            </div>

            {(!portfolio || sortedPortfolioItems.length === 0) ? (
              <div className="text-center py-10 relative z-10">
                <p className="text-lg mb-4 text-gray-600 dark:text-gray-300">You don't have any assets yet</p>
                <button 
                  onClick={() => setIsAddModalOpen(true)}
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg"
                >
                  Add your first asset
                </button>
              </div>
            ) : (
              <div className="overflow-y-auto h-[calc(100vh-32rem)] scrollbar-thin relative z-10">
                {sortedPortfolioItems.map((item) => (
                  <div key={item.id}>
                    <PortfolioItem 
                      item={item} 
                      onItemClick={handleAssetClick} 
                      totalPortfolioValue={totalPortfolioValue} 
                    />
                  </div>
                ))}
              </div>
            )}
            
            {/* Decorative Elements */}
            <div className="absolute -bottom-8 -left-8 w-32 h-32 rounded-full bg-emerald-500/5 dark:bg-emerald-500/10 blur-xl"></div>
            <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-blue-500/5 dark:bg-blue-500/10 blur-xl"></div>
          </div>
          
          {/* Recent News */}
          <div className="mt-6">
            <CryptoNews />
          </div>
        </div>

        {/* Watchlist Section - Takes up 1/3 of the space */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-gradient-to-br dark:from-slate-800 dark:to-slate-900 rounded-xl shadow-md dark:shadow-lg border border-gray-200 dark:border-slate-700/50 p-5 relative overflow-hidden" style={{ minHeight: 'calc(100vh - 24rem)' }}>
            {/* Watchlist Header */}
            <div className="flex flex-row justify-between items-center mb-4 pb-3 border-b border-gray-200 dark:border-slate-700/50 relative z-10">
              <h2 className="text-xl font-bold text-gray-800 dark:text-white tracking-tight flex items-center">
                <div className="w-2 h-8 bg-violet-500 rounded-full mr-2"></div>
                Watchlist
              </h2>
              <div className="flex items-center">
                <button 
                  onClick={() => document.dispatchEvent(new CustomEvent('lc:open-add-to-watchlist'))}
                  className="text-white bg-teal-600 hover:bg-teal-700 p-2 rounded-full w-7 h-7 flex items-center justify-center mr-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                </button>
                <div className="flex items-center bg-gray-100/80 dark:bg-slate-800/80 px-3 py-1.5 rounded-full border border-gray-200 dark:border-slate-700/50 backdrop-blur-sm">
                  <span className="text-xs text-gray-600 dark:text-slate-300">
                    {watchlist?.length || 0} assets
                  </span>
                </div>
              </div>
            </div>

            <div className="relative z-10 overflow-y-auto h-[calc(100vh-32rem)] scrollbar-thin">
              <WatchlistComponent 
                onRefresh={getWatchlist} 
                hideControls={true}
                className="border-none shadow-none bg-transparent p-0"
              />
            </div>
            
            {/* Decorative Elements */}
            <div className="absolute -bottom-8 -right-8 w-32 h-32 rounded-full bg-violet-500/5 dark:bg-violet-500/10 blur-xl"></div>
            <div className="absolute -top-8 -left-8 w-24 h-24 rounded-full bg-indigo-500/5 dark:bg-indigo-500/10 blur-xl"></div>
          </div>
        </div>
      </div>

      {/* Add Coin Modal */}
      {isAddModalOpen && (
        <AddCoinModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onCoinAdded={handleCoinAdded}
        />
      )}
      
      {/* Asset Detail Modal */}
      {isAssetDetailModalOpen && selectedAsset && (
        <AssetDetailModal
          isOpen={isAssetDetailModalOpen}
          onClose={handleAssetDetailModalClose}
          asset={selectedAsset}
        />
      )}
    </div>
  );
}

// Export the memoized component
export default memo(PortfolioDashboardComponent); 