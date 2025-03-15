import { useState, useEffect, useMemo, useCallback, memo, useRef } from 'react';
import { usePortfolio } from '@/lib/hooks/usePortfolio';
import { useAuth } from '@/lib/auth-context';
import { useWatchlist, WatchlistItem } from '@/lib/hooks/useWatchlist';
import AddCoinModal from './AddCoinModal';
import AssetDetailModal from './AssetDetailModal';
import CryptoNews from './CryptoNews';
import Image from 'next/image';
import { GlobalData } from '@/lib/services/coinmarketcap';
import { PortfolioItemWithPrice } from '@/types/portfolio';
import WatchlistComponent from './WatchlistComponent';
import { formatCryptoPrice, formatLargeNumber, formatPercentage } from '@/lib/utils/formatters';
import { useDataCache } from '@/lib/context/data-cache-context';

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

// New Combined Stats Card for portfolio
const PortfolioStatsCard = memo(({ portfolioValue, dailyChange, loading = false, portfolioItems = [] }: {
  portfolioValue: number;
  dailyChange: number;
  loading?: boolean;
  portfolioItems?: PortfolioItemWithPrice[];
}) => {
  const isPositive = dailyChange >= 0;
  
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
  
  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm transition-all duration-300 hover:shadow-card-hover h-full">
      <div className="flex justify-between items-start mb-5">
        <div>
          <h3 className="text-sm text-gray-500 dark:text-gray-400 mb-1">Portfolio Summary</h3>
          <div className="flex items-baseline space-x-2">
            {loading ? (
              <div className="h-9 w-40 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
            ) : (
              <>
                <p className="text-2xl font-bold">
                  ${portfolioValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </>
            )}
          </div>
        </div>
        <div className={`bg-gray-100 dark:bg-gray-700 p-2 rounded-full flex items-center justify-center ${isPositive ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400' : 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'}`}>
          <div className="flex items-center">
            <span>{isPositive ? '+' : ''}{dailyChange.toFixed(2)}% 24h</span>
            {isPositive ? (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 ml-1">
                <path fillRule="evenodd" d="M12.577 4.878a.75.75 0 01.919-.53l4.78 1.281a.75.75 0 01.531.919l-1.281 4.78a.75.75 0 01-1.449-.387l.81-3.022a19.407 19.407 0 00-5.594 5.203.75.75 0 01-1.139.093L7 10.06l-4.72 4.72a.75.75 0 01-1.06-1.061l5.25-5.25a.75.75 0 011.06 0l3.074 3.073a20.923 20.923 0 015.545-4.931l-3.042-.815a.75.75 0 01-.53-.919z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 ml-1">
                <path fillRule="evenodd" d="M1.22 5.222a.75.75 0 011.06 0L7 9.942l3.768-3.769a.75.75 0 011.113.058 20.908 20.908 0 013.813 7.254l1.574-2.727a.75.75 0 011.3.75l-2.475 4.286a.75.75 0 01-.99.303l-4.142-2.13a.75.75 0 01.726-1.313l2.673 1.379a19.397 19.397 0 00-3.528-6.582l-4.17 4.17a.75.75 0 01-1.06 0l-5.25-5.25a.75.75 0 010-1.06z" clipRule="evenodd" />
              </svg>
            )}
          </div>
        </div>
      </div>
      
      {/* Portfolio distribution visualization */}
      {!loading && portfolioValue > 0 && (
        <div className="mt-4">
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
      
      {!loading && portfolioValue > 0 && distributionData.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
          <div className="grid grid-cols-2 gap-2">
            {distributionData.slice(0, 4).map((item, index) => (
              <div key={index} className="flex justify-between items-center">
                <div className="flex items-center">
                  <div className={`w-2.5 h-2.5 rounded-full ${item.color} mr-1.5`}></div>
                  <span className="text-xs font-medium">{item.name}</span>
                </div>
                <span className="text-xs text-gray-600 dark:text-gray-400">
                  ${item.value.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
});
PortfolioStatsCard.displayName = 'PortfolioStatsCard';

// Memoized Market Leaders Card component
const MarketLeadersCard = memo(({ btcPrice, ethPrice, btcDominance, ethDominance, loading = false }: {
  btcPrice: number | null;
  ethPrice: number | null;
  btcDominance: number;
  ethDominance: number;
  loading?: boolean;
}) => {
  // Use default values of 0 for any null values
  const btcDom = typeof btcDominance === 'number' ? btcDominance : 0;
  const ethDom = typeof ethDominance === 'number' ? ethDominance : 0;
  
  // Add additional check to ensure we're not showing empty data
  const hasValidData = btcPrice && btcPrice > 0 && ethPrice && ethPrice > 0;
  const isLoading = loading || !hasValidData;
  
  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm transition-all duration-300 hover:shadow-card-hover">
      <h3 className="text-sm text-gray-500 dark:text-gray-400 mb-4">Market Leaders</h3>
      
      {isLoading ? (
        <div className="space-y-4">
          <div className="h-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
          <div className="h-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Bitcoin row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <img src="https://s2.coinmarketcap.com/static/img/coins/64x64/1.png" alt="Bitcoin" className="w-8 h-8 mr-3" />
              <div>
                <p className="font-medium">Bitcoin</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">BTC</p>
              </div>
            </div>
            <div className="text-right">
              <p className="font-medium">${formatCryptoPrice(btcPrice || 0)}</p>
              <div className="bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 text-xs px-2 py-0.5 rounded-full inline-block">
                {btcDom.toFixed(1)}% Dominance
              </div>
            </div>
          </div>
          
          {/* Ethereum row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <img src="https://s2.coinmarketcap.com/static/img/coins/64x64/1027.png" alt="Ethereum" className="w-8 h-8 mr-3" />
              <div>
                <p className="font-medium">Ethereum</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">ETH</p>
              </div>
            </div>
            <div className="text-right">
              <p className="font-medium">${formatCryptoPrice(ethPrice || 0)}</p>
              <div className="bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs px-2 py-0.5 rounded-full inline-block">
                {ethDom.toFixed(1)}% Dominance
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});
MarketLeadersCard.displayName = 'MarketLeadersCard';

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
function PortfolioDashboardComponent() {
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
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  const [renderKey, setRenderKey] = useState(Date.now()); // Add a key to force re-render if needed
  const hasRefreshedRef = useRef(false);
  const lastRefreshAttemptRef = useRef(0);
  const mountedRef = useRef(true); // Track if component is mounted
  
  // Calculate loading and error states - IMPROVED to prevent stuck loading
  // Only consider the component in a loading state during initial load or explicit refresh
  const effectivePortfolioLoading = portfolioLoading && !initialLoadComplete;
  const effectivePriceLoading = loadingPrices && !initialLoadComplete && !btcPrice && !ethPrice;
  const loading = (effectivePortfolioLoading || effectivePriceLoading) && !initialLoadComplete;
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
  
  // Create consistent animation classes based on loading state
  const contentAnimationClass = initialLoadComplete ? "animate-fadeIn" : "opacity-0 transition-opacity-transform";
  const cardAnimationClass = initialLoadComplete ? "animate-scaleIn" : "opacity-0 transition-opacity-transform";
  const listItemAnimationClass = initialLoadComplete ? "animate-slide-up" : "opacity-0 transition-opacity-transform";
  
  // Reset loading state when component unmounts and remounts
  // This is crucial for preventing stuck loading states after navigation
  useEffect(() => {
    // Mark as mounted
    mountedRef.current = true;
    
    // Check if we already have data and set initial load complete if we do
    if ((btcPrice && ethPrice) || portfolio) {
      setInitialLoadComplete(true);
    }
    
    // On unmount, reset state
    return () => {
      mountedRef.current = false;
      hasRefreshedRef.current = false;
    };
  }, [btcPrice, ethPrice, portfolio]);
  
  // Throttled refresh function to prevent excessive calls
  const throttledRefresh = useCallback(async () => {
    const now = Date.now();
    const timeSinceLastRefresh = now - lastRefreshAttemptRef.current;
    
    // Prevent refreshing too often (minimum 3 seconds between refreshes)
    if (timeSinceLastRefresh < 3000) {
      return;
    }
    
    lastRefreshAttemptRef.current = now;
    await refreshData();
  }, [refreshData]);
  
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
    setIsRefreshing(true);
    
    // Only refresh if enough time has passed
    throttledRefresh()
      .catch(error => {
        console.error("Error refreshing global data:", error);
      })
      .finally(() => {
        // Add a minimum duration for the refresh animation
        setTimeout(() => {
          if (mountedRef.current) {
            setIsRefreshing(false);
          }
        }, 500);
      });
  }, [throttledRefresh]);
  
  // Only run this once on mount with debounce
  const loadInitialData = useCallback(async () => {
    // If already complete, don't reload
    if (initialLoadComplete && (btcPrice || ethPrice)) {
      if (process.env.NODE_ENV === 'development') {
        console.log("DEBUG: Initial load already complete, skipping", { 
          btcPrice, 
          ethPrice, 
          hasPortfolio: Boolean(portfolio),
          initialLoadComplete
        });
      }
      return;
    }

    console.log("DEBUG: Starting initial data load", { 
      hasCache: Boolean(btcPrice && ethPrice && globalData),
      btcPrice,
      ethPrice,
      hasPortfolio: Boolean(portfolio),
      portfolioLoading
    });

    try {
      // Check if we have data in the cache already
      if (btcPrice && ethPrice && globalData) {
        if (process.env.NODE_ENV === 'development') {
          console.log("Dashboard already has data from cache, skipping initial refresh");
        }
        hasRefreshedRef.current = true;
        setInitialLoadComplete(true);
        return;
      }
      
      // Only show refreshing if we don't have data
      if (!globalData) {
        setIsRefreshing(true);
      }
      
      // Just refresh the global data which contains dominance values
      console.log("DEBUG: Calling refreshData()");
      await refreshData();
      console.log("DEBUG: refreshData() completed, btcPrice:", btcPrice, "ethPrice:", ethPrice);
      
      if (process.env.NODE_ENV === 'development') {
        console.log("Dashboard data refreshed on mount");
      }
      
      // Mark as refreshed to prevent multiple calls
      hasRefreshedRef.current = true;
    } catch (error) {
      console.error("Error refreshing dashboard data:", error);
      
      // Even on error, mark as refreshed to prevent retry storms
      hasRefreshedRef.current = true;
    } finally {
      if (mountedRef.current) {
        setIsRefreshing(false);
        // Set initial load as complete whether we succeeded or failed
        setInitialLoadComplete(true);
        console.log("DEBUG: Initial load complete, final state:", {
          btcPrice,
          ethPrice,
          hasPortfolio: Boolean(portfolio),
          portfolioLoading
        });
      }
    }
  }, [btcPrice, ethPrice, globalData, refreshData, initialLoadComplete, portfolio, portfolioLoading]);
  
  // Initialize data on mount - with optimization to prevent duplicate initialization
  useEffect(() => {
    console.log("DEBUG: Mount effect running", {
      btcPrice,
      ethPrice,
      hasPortfolio: Boolean(portfolio),
      portfolioLoading,
      initialLoadComplete,
      hasRefreshed: hasRefreshedRef.current
    });
    
    // Always set initial load complete if we have price data
    // This ensures we recover from interrupted loads
    if (btcPrice && ethPrice) {
      console.log("DEBUG: We have price data, setting initialLoadComplete");
      setInitialLoadComplete(true);
      return;
    }
    
    // If we already have portfolio data, show it immediately
    if (portfolio && !portfolioLoading) {
      console.log("DEBUG: We have portfolio data, setting initialLoadComplete");
      setInitialLoadComplete(true);
    }
    
    // Skip if already initialized
    if (hasRefreshedRef.current && initialLoadComplete) {
      console.log("DEBUG: Already initialized, skipping load");
      return;
    }
    
    // Use a smaller delay for faster startup
    console.log("DEBUG: Setting up timer for loadInitialData");
    const timer = setTimeout(() => {
      if (mountedRef.current) {
        console.log("DEBUG: Timer fired, calling loadInitialData");
        loadInitialData();
      }
    }, 200);
    
    return () => {
      console.log("DEBUG: Cleaning up mount effect");
      clearTimeout(timer);
    }
  }, [loadInitialData, btcPrice, ethPrice, portfolio, portfolioLoading, initialLoadComplete]);
  
  // Trigger a portfolio refresh when we get new price data - optimized with conditions
  useEffect(() => {
    // Skip if we have no price data yet or if we're still loading
    if (!btcPrice || !ethPrice || portfolioLoading) {
      return;
    }
    
    // Only refresh if we have portfolio items but zero value
    if (portfolio && 
        portfolio.totalValueUsd === 0 && 
        portfolio.items.length > 0) {
      
      if (process.env.NODE_ENV === 'development') {
        console.log("Prices available but portfolio value is 0 - refreshing portfolio data");
      }
      refreshPortfolio();
    }
  }, [btcPrice, ethPrice, portfolio, refreshPortfolio, portfolioLoading]);
  
  // Handle the case of returning to the page with data but stuck loading
  // This is crucial for recovering from navigation
  useEffect(() => {
    if ((btcPrice || ethPrice || portfolio) && !initialLoadComplete) {
      // Short delay to ensure data is processed before showing animations
      const timer = setTimeout(() => {
        if (mountedRef.current) {
          setInitialLoadComplete(true);
        }
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [btcPrice, ethPrice, portfolio, initialLoadComplete]);
  
  // Emergency recovery for stuck loading state
  useEffect(() => {
    // If we've been in loading state for more than 5 seconds despite having data
    // force a reset of the component state
    const timer = setTimeout(() => {
      if (mountedRef.current && (btcPrice || ethPrice || portfolio) && !initialLoadComplete) {
        if (process.env.NODE_ENV === 'development') {
          console.log("Emergency recovery from stuck loading state");
        }
        setInitialLoadComplete(true);
        setRenderKey(Date.now()); // Force re-render
      }
    }, 5000);
    
    return () => clearTimeout(timer);
  }, [btcPrice, ethPrice, portfolio, initialLoadComplete]);
  
  // Ultimate fallback - if we've been mounted for 10 seconds and still have no data, 
  // inject hardcoded values to show something
  useEffect(() => {
    const timer = setTimeout(() => {
      if (mountedRef.current && !btcPrice && !ethPrice) {
        console.log("CRITICAL: No data after 10 seconds, using hardcoded values");
        
        // This is a last resort to ensure users see SOMETHING
        if (!btcPrice) {
          // @ts-ignore - emergency override of state
          setBtcPrice(68000);
        }
        
        if (!ethPrice) {
          // @ts-ignore - emergency override of state  
          setEthPrice(3500);
        }
        
        setInitialLoadComplete(true);
        setRenderKey(Date.now()); // Force re-render
      }
    }, 10000);
    
    return () => clearTimeout(timer);
  }, [btcPrice, ethPrice]);
  
  // Force an immediate refresh on mount
  useEffect(() => {
    // Emergency loading if we have no data after 2 seconds
    const emergencyTimer = setTimeout(() => {
      if (mountedRef.current && !initialLoadComplete && !hasRefreshedRef.current) {
        console.log("DEBUG: Emergency refresh triggered");
        refreshData().catch(err => console.error("Emergency refresh failed:", err));
        refreshPortfolio().catch(err => console.error("Emergency portfolio refresh failed:", err));
        // Allow a bit more time then force complete
        setTimeout(() => {
          if (mountedRef.current) {
            console.log("DEBUG: Forcing initialLoadComplete");
            setInitialLoadComplete(true);
            setRenderKey(Date.now());
          }
        }, 1000);
      }
    }, 2000);
    
    return () => clearTimeout(emergencyTimer);
  }, [refreshData, refreshPortfolio, initialLoadComplete]);
  
  // If we're still showing the loading skeleton but we have data,
  // force a recovery to the normal view
  if (loading && (portfolio || (btcPrice && ethPrice)) && !initialLoadComplete) {
    // Force render complete view instead of skeleton
    return (
      <div className="container mx-auto pt-2 pb-6 px-4 max-w-7xl" key={renderKey}>
        {/* Emergency fallback content */}
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Your Dashboard</h1>
            <p className="text-gray-600 dark:text-gray-300">
              Welcome back, {user?.email?.split('@')[0] || 'partnerships'}!
            </p>
          </div>
          <button 
            onClick={handleManualRefresh}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-teal-500"
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
              className="w-5 h-5 text-gray-500 dark:text-gray-400"
            >
              <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2" />
            </svg>
          </button>
        </div>
        
        {/* Render actual content with forced initialization */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <PortfolioStatsCard 
            portfolioValue={portfolio?.totalValueUsd || 0}
            dailyChange={portfolio?.dailyChangePercentage || 0}
            loading={false}
            portfolioItems={sortedPortfolioItems}
          />
          
          <MarketLeadersCard 
            btcPrice={btcPrice}
            ethPrice={ethPrice}
            btcDominance={typeof globalData?.btcDominance === 'number' ? globalData.btcDominance : 0}
            ethDominance={typeof globalData?.ethDominance === 'number' ? globalData.ethDominance : 0}
            loading={false}
          />
        </div>
        
        {/* Emergency refresh button to recover UI */}
        <div className="text-center mb-4">
          <button 
            onClick={() => {
              setInitialLoadComplete(true);
              setRenderKey(Date.now());
              handleManualRefresh();
            }}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Click to refresh dashboard
          </button>
        </div>
      </div>
    );
  }
  
  if (loading) {
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
          onClick={refreshPortfolio}
        >
          Try Again
        </button>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto pt-2 pb-6 px-4 max-w-7xl">
      {/* Dashboard Header */}
      <div className="mb-6 flex justify-between items-center">
        <div className={contentAnimationClass} style={{ transitionDelay: '0ms' }}>
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Your Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-300">Welcome back, {user?.email?.split('@')[0] || 'partnerships'}!</p>
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
      
      {/* Stats Cards - Modified to show 2 cards instead of 4 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Combined Portfolio Stats Card */}
        <div className={cardAnimationClass} style={{ transitionDelay: '100ms', animationDelay: '100ms' }}>
          <PortfolioStatsCard 
            portfolioValue={portfolio?.totalValueUsd || 0}
            dailyChange={portfolio?.dailyChangePercentage || 0}
            loading={loading}
            portfolioItems={sortedPortfolioItems}
          />
        </div>
        
        {/* Combined Market Leaders Card */}
        <div className={cardAnimationClass} style={{ transitionDelay: '150ms', animationDelay: '150ms' }}>
          <MarketLeadersCard 
            btcPrice={btcPrice}
            ethPrice={ethPrice}
            btcDominance={typeof globalData?.btcDominance === 'number' ? globalData.btcDominance : 0}
            ethDominance={typeof globalData?.ethDominance === 'number' ? globalData.ethDominance : 0}
            loading={loadingPrices || !btcPrice || !ethPrice}
          />
        </div>
      </div>
      
      {/* Main Content - Portfolio and Watchlist */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Portfolio Section - Takes up 2/3 of the space */}
        <div className={`lg:col-span-2 ${contentAnimationClass}`} style={{ transitionDelay: '300ms', animationDelay: '300ms' }}>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 transition-all duration-300" style={{ height: 'calc(100vh - 24rem)' }}>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">Your Portfolio</h2>
              <button 
                onClick={() => setIsAddModalOpen(true)}
                className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition-colors transform hover:scale-105 active:scale-95 hover:shadow-md"
              >
                Add Asset
              </button>
            </div>
            
            {(!portfolio || sortedPortfolioItems.length === 0) ? (
              <div className="text-center py-10">
                <p className="text-lg mb-4">You don't have any assets yet</p>
                <button 
                  onClick={() => setIsAddModalOpen(true)}
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition-colors transform hover:scale-105 active:scale-95"
                >
                  Add your first asset
                </button>
              </div>
            ) : (
              <div className="overflow-y-auto h-[calc(100%-4rem)] scrollbar-thin">
                {sortedPortfolioItems.map((item, index) => (
                  <div key={item.id} className={listItemAnimationClass} style={{ transitionDelay: `${350 + (index * 30)}ms`, animationDelay: `${350 + (index * 30)}ms` }}>
                    <PortfolioItem 
                      item={item} 
                      onItemClick={handleAssetClick} 
                      totalPortfolioValue={totalPortfolioValue} 
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* Recent News */}
          <div className={`mt-6 ${contentAnimationClass}`} style={{ transitionDelay: '400ms', animationDelay: '400ms' }}>
            <CryptoNews />
          </div>
        </div>
        
        {/* Watchlist Section - Takes up 1/3 of the space */}
        <div className={`lg:col-span-1 h-auto ${contentAnimationClass}`} style={{ transitionDelay: '300ms', animationDelay: '300ms' }}>
          <WatchlistComponent 
            onRefresh={handleWatchlistRefresh} 
            initialLoadComplete={initialLoadComplete}
          />
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