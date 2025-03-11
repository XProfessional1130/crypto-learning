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
    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm">
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
      className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors cursor-pointer"
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

export default function PortfolioDashboard() {
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
  
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
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
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Your Dashboard</h1>
        <p className="text-gray-600 dark:text-gray-300">Welcome back, {user?.email?.split('@')[0] || 'partnerships'}!</p>
      </div>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Portfolio Value Card */}
        <StatsCard 
          title="Portfolio Value" 
          value={`$${portfolio?.totalValueUsd.toLocaleString(undefined, { 
            minimumFractionDigits: 2, 
            maximumFractionDigits: 2 
          }) || '0.00'}`}
        />
        
        {/* 24h Change Card */}
        <StatsCard 
          title="24h Change"
          value={`${(portfolio?.dailyChangePercentage || 0) >= 0 ? '+' : ''}${(portfolio?.dailyChangePercentage || 0).toFixed(2)}%`}
          valueClassName={(portfolio?.dailyChangePercentage || 0) >= 0 ? 'text-green-500' : 'text-red-500'}
        />
        
        {/* Bitcoin Price Card */}
        <StatsCard 
          title="Bitcoin Price"
          value={formatCryptoPrice(btcPrice || 0)}
          icon={<img src="https://s2.coinmarketcap.com/static/img/coins/64x64/1.png" alt="Bitcoin" className="w-5 h-5" />}
          dominance={globalData?.btcDominance}
          loading={loadingPrices}
        />
        
        {/* Ethereum Price Card */}
        <StatsCard 
          title="Ethereum Price"
          value={formatCryptoPrice(ethPrice || 0)}
          icon={<img src="https://s2.coinmarketcap.com/static/img/coins/64x64/1027.png" alt="Ethereum" className="w-5 h-5" />}
          dominance={globalData?.ethDominance}
          loading={loadingPrices}
        />
      </div>
      
      {/* Main Content - Portfolio and Watchlist */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Portfolio Section - Takes up 2/3 of the space */}
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6" style={{ height: 'calc(100vh - 24rem)' }}>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">Your Portfolio</h2>
              <button 
                onClick={() => setIsAddModalOpen(true)}
                className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition-colors"
              >
                Add Asset
              </button>
            </div>
            
            {(!portfolio || sortedPortfolioItems.length === 0) ? (
              <div className="text-center py-10">
                <p className="text-lg mb-4">You don't have any assets yet</p>
                <button 
                  onClick={() => setIsAddModalOpen(true)}
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition-colors"
                >
                  Add your first asset
                </button>
              </div>
            ) : (
              <div className="overflow-y-auto h-[calc(100%-4rem)] scrollbar-thin">
                {sortedPortfolioItems.map((item) => (
                  <PortfolioItem 
                    key={item.id} 
                    item={item} 
                    onItemClick={handleAssetClick} 
                    totalPortfolioValue={portfolio?.totalValueUsd || 0} 
                  />
                ))}
              </div>
            )}
          </div>
          
          {/* Recent News */}
          <div className="mt-6">
            <CryptoNews />
          </div>
        </div>
        
        {/* Watchlist Section - Takes up 1/3 of the space */}
        <div className="lg:col-span-1 h-auto">
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