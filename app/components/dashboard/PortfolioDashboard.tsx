import { useState, useEffect, useMemo, useCallback, memo } from 'react';
import { usePortfolio } from '@/lib/hooks/usePortfolio';
import { useAuth } from '@/lib/auth-context';
import { useWatchlist, WatchlistItem } from '@/lib/hooks/useWatchlist';
import AddCoinModal from './AddCoinModal';
import AssetDetailModal from './AssetDetailModal';
import CryptoNews from './CryptoNews';
import Image from 'next/image';
import { getBtcPrice, getEthPrice, getGlobalData, GlobalData } from '@/lib/services/coinmarketcap';
import { PortfolioItemWithPrice } from '@/types/portfolio';
import WatchlistComponent from './WatchlistComponent';
import { formatCryptoPrice, formatLargeNumber, formatPercentage } from '@/lib/utils/formatters';

// Memoized Stats Card component
const StatsCard = memo(({ title, value, icon = null, dominance = null, loading = false, valueClassName = '' }: {
  title: string;
  value: string;
  icon?: React.ReactNode;
  dominance?: number | null;
  loading?: boolean;
  valueClassName?: string;
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
          <p className={`text-3xl font-bold ${valueClassName}`}>
            {value}
          </p>
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
  
  const { user } = useAuth();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<PortfolioItemWithPrice | null>(null);
  const [isAssetDetailModalOpen, setIsAssetDetailModalOpen] = useState(false);
  const [btcPrice, setBtcPrice] = useState<number | null>(null);
  const [ethPrice, setEthPrice] = useState<number | null>(null);
  const [globalData, setGlobalData] = useState<GlobalData | null>(null);
  const [loadingPrices, setLoadingPrices] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Handler for when a coin is added to ensure UI updates
  const handleCoinAdded = useCallback(() => {
    console.log("Coin added, refreshing portfolio...");
    refreshPortfolio();
  }, [refreshPortfolio]);

  // Handler for when a watchlist item is added
  const handleWatchlistRefresh = useCallback(() => {
    console.log("Refreshing watchlist...");
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
    
    Promise.all([
      refreshPortfolio(),
      refreshWatchlist()
    ]).finally(() => {
      // Add a minimum duration for the refresh animation
      setTimeout(() => setIsRefreshing(false), 500);
    });
  }, [refreshPortfolio, refreshWatchlist]);
  
  // Fetch BTC and ETH prices and global data with optimized loading
  useEffect(() => {
    const fetchData = async () => {
      // Only show loading indicator if we don't have any data yet
      if (!btcPrice || !ethPrice || !globalData) {
        setLoadingPrices(true);
      }
      
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
        setLoadingPrices(false);
      }
    };
    
    // Initial fetch
    fetchData();
    
    // Set up refresh interval (5 minutes)
    const intervalId = setInterval(fetchData, 5 * 60 * 1000);
    
    return () => clearInterval(intervalId);
  }, []); // Empty dependency array as we want this to run once on mount
  
  const loading = portfolioLoading || watchlistLoading;
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
    <div className="container mx-auto py-6 px-4 max-w-7xl">
      {/* Dashboard Header */}
      <div className="mb-6 flex justify-between items-center">
        <div className="animate-fadeIn">
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Your Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-300">Welcome back, {user?.email?.split('@')[0] || 'partnerships'}!</p>
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
            className={`w-5 h-5 text-gray-500 dark:text-gray-400 ${isRefreshing ? 'animate-refresh-spin' : ''}`}
          >
            <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2" />
          </svg>
        </button>
      </div>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Portfolio Value Card */}
        <div className="animate-scaleIn" style={{ animationDelay: '0ms' }}>
          <StatsCard 
            title="Portfolio Value" 
            value={`$${portfolio?.totalValueUsd.toLocaleString(undefined, { 
              minimumFractionDigits: 2, 
              maximumFractionDigits: 2 
            }) || '0.00'}`}
          />
        </div>
        
        {/* 24h Change Card */}
        <div className="animate-scaleIn" style={{ animationDelay: '50ms' }}>
          <StatsCard 
            title="24h Change"
            value={`${(portfolio?.dailyChangePercentage || 0) >= 0 ? '+' : ''}${(portfolio?.dailyChangePercentage || 0).toFixed(2)}%`}
            valueClassName={(portfolio?.dailyChangePercentage || 0) >= 0 ? 'text-green-500' : 'text-red-500'}
          />
        </div>
        
        {/* Bitcoin Price Card */}
        <div className="animate-scaleIn" style={{ animationDelay: '100ms' }}>
          <StatsCard 
            title="Bitcoin Price"
            value={formatCryptoPrice(btcPrice || 0)}
            icon={<img src="https://s2.coinmarketcap.com/static/img/coins/64x64/1.png" alt="Bitcoin" className="w-5 h-5" />}
            dominance={globalData?.btcDominance}
            loading={loadingPrices}
          />
        </div>
        
        {/* Ethereum Price Card */}
        <div className="animate-scaleIn" style={{ animationDelay: '150ms' }}>
          <StatsCard 
            title="Ethereum Price"
            value={formatCryptoPrice(ethPrice || 0)}
            icon={<img src="https://s2.coinmarketcap.com/static/img/coins/64x64/1027.png" alt="Ethereum" className="w-5 h-5" />}
            dominance={globalData?.ethDominance}
            loading={loadingPrices}
          />
        </div>
      </div>
      
      {/* Main Content - Portfolio and Watchlist */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Portfolio Section - Takes up 2/3 of the space */}
        <div className="lg:col-span-2 animate-fadeIn" style={{ animationDelay: '200ms' }}>
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
              <div className="text-center py-10 animate-fadeIn">
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
                  <div key={item.id} className="animate-slide-up" style={{ animationDelay: `${index * 30}ms` }}>
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
          <div className="mt-6 animate-fadeIn" style={{ animationDelay: '250ms' }}>
            <CryptoNews />
          </div>
        </div>
        
        {/* Watchlist Section - Takes up 1/3 of the space */}
        <div className="lg:col-span-1 h-auto animate-fadeIn" style={{ animationDelay: '300ms' }}>
          <WatchlistComponent onRefresh={handleWatchlistRefresh} />
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