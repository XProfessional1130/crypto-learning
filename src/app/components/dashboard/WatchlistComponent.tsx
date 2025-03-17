import React, { useState, useEffect, useCallback, memo } from 'react';
import { useWatchlist, WatchlistItem } from '@/hooks/useWatchlist';
import { CoinData } from '@/types/portfolio';
import WatchlistItemDetailModal from './WatchlistItemDetailModal';
import AddToWatchlistModal from './AddToWatchlistModal';
import { calculateProgressPercentage, formatCryptoPrice, formatLargeNumber, formatPercentage } from '@/lib/utils/formatters';
import Image from 'next/image';
import { Skeleton } from '../ui/skeleton';
import { useDataCache } from '@/lib/providers/data-cache-provider';

// Simple utility to combine class names
const cn = (...classes: (string | boolean | undefined)[]) => {
  return classes.filter(Boolean).join(' ');
};

// Define props interface for WatchlistComponent
interface WatchlistComponentProps {
  onRefresh?: () => void;
  initialLoadComplete?: boolean;
  hideControls?: boolean;
  className?: string;
}

// Memoized WatchlistItemCard component
const WatchlistItemCard = memo(({ 
  item, 
  progressPercentage, 
  targetPercentage, 
  isTargetHigher, 
  onClick,
  isFirst = false
}: {
  item: WatchlistItem;
  progressPercentage: number;
  targetPercentage: number;
  isTargetHigher: boolean;
  onClick: (item: WatchlistItem) => void;
  isFirst?: boolean;
}) => {
  return (
    <div 
      onClick={() => onClick(item)}
      className={`px-3 py-3 cursor-pointer hover:bg-gray-50/40 dark:hover:bg-gray-700/40 transition-all duration-200 border-b border-gray-100 dark:border-gray-700/50 w-full group ${isFirst ? 'border-t border-t-gray-100 dark:border-t-gray-700/50' : ''}`}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center">
          <div className="w-7 h-7 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center mr-2 text-xs font-bold overflow-hidden">
            <img 
              src={`https://s2.coinmarketcap.com/static/img/coins/64x64/${item.coinId}.png`}
              alt={item.symbol}
              className="w-full h-full object-cover"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                const parent = target.parentElement;
                if (parent) {
                  parent.innerHTML = item.symbol.substring(0, 3);
                }
              }}
            />
          </div>
          <div>
            <div className="font-medium text-gray-800 dark:text-gray-100 flex items-center">
              {item.symbol}
              <span className="opacity-0 group-hover:opacity-100 ml-2 transition-opacity text-xs text-teal-600 dark:text-teal-400">
                View details
              </span>
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">{item.name}</div>
          </div>
        </div>

        <div className="flex flex-col items-end">
          <div className="font-medium text-gray-800 dark:text-white">
            {formatCryptoPrice(item.price)}
          </div>
          
          {item.priceTarget && (
            <div className={`text-xs ${
              isTargetHigher ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
            }`}>
              Target: {formatCryptoPrice(item.priceTarget)}
            </div>
          )}
        </div>
      </div>
      
      {item.priceTarget && (
        <div className="pl-9"> {/* Align with the text after the icon */}
          <div className="w-full bg-gray-100 dark:bg-gray-700/50 rounded-full h-1.5 overflow-hidden mt-1">
            <div 
              className={`h-1.5 rounded-full ${isTargetHigher ? 'bg-green-500/70' : 'bg-red-500/70'}`}
              style={{ width: `${progressPercentage}%` }}
            ></div>
          </div>
          
          <div className="flex justify-between mt-1 text-xs">
            <span className="text-gray-500 dark:text-gray-400">
              {Math.round(progressPercentage)}% of target
            </span>
            <span className={`font-medium ${
              isTargetHigher
                ? 'text-green-600 dark:text-green-400' 
                : 'text-red-600 dark:text-red-400'
            }`}>
              {formatPercentage(Math.abs(targetPercentage))} {isTargetHigher ? '↑' : '↓'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
});
WatchlistItemCard.displayName = 'WatchlistItemCard';

// Create a memoized WatchlistItemSkeleton component for better loading UX
const WatchlistItemSkeleton = () => (
  <div className="px-3 py-3 border-b border-gray-100 dark:border-gray-700/50 animate-pulse">
    <div className="flex items-center justify-between mb-2">
      <div className="flex items-center">
        <div className="w-7 h-7 rounded-full bg-gray-200 dark:bg-gray-700 mr-2"></div>
        <div>
          <div className="h-4 w-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
          <div className="h-3 w-24 bg-gray-100 dark:bg-gray-800 rounded mt-1"></div>
        </div>
      </div>
      <div className="flex flex-col items-end">
        <div className="h-4 w-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
        <div className="h-3 w-16 bg-gray-100 dark:bg-gray-800 rounded mt-1"></div>
      </div>
    </div>
  </div>
);

const WatchlistComponent = ({ 
  onRefresh, 
  initialLoadComplete = false,
  hideControls = false,
  className = ''
}: WatchlistComponentProps) => {
  const {
    watchlist,
    loading: watchlistLoading,
    error: watchlistError,
    getTargetPercentage,
    refreshWatchlist
  } = useWatchlist();

  const { getMultipleCoinsData } = useDataCache();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<WatchlistItem | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isDataLoading, setIsDataLoading] = useState(false);
  const [coinDataMap, setCoinDataMap] = useState<Record<string, CoinData>>({});
  
  // Create consistent animation classes based on loading state
  const contentAnimationClass = initialLoadComplete ? "animate-fadeIn" : "opacity-0 transition-opacity-transform";
  const itemAnimationClass = initialLoadComplete ? "animate-slide-up" : "opacity-0 transition-opacity-transform";
  
  // Listen for custom events to open the add modal
  useEffect(() => {
    const handleOpenAddModal = () => {
      setIsAddModalOpen(true);
    };
    
    window.addEventListener('dashboard:add-to-watchlist', handleOpenAddModal);
    
    return () => {
      window.removeEventListener('dashboard:add-to-watchlist', handleOpenAddModal);
    };
  }, []);

  // Only load once on mount, with no dependencies to prevent reruns
  useEffect(() => {
    // Initial data load
    refreshWatchlist();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array to ensure it only runs once

  // Handler for manual refresh with visual feedback
  const handleManualRefresh = useCallback(() => {
    setIsRefreshing(true);
    
    refreshWatchlist(true)
      .finally(() => {
        // Add a minimum duration for the refresh animation
        setTimeout(() => setIsRefreshing(false), 500);
      });
    
    // Also call the parent's onRefresh if provided
    if (onRefresh) {
      onRefresh();
    }
  }, [refreshWatchlist, onRefresh]);

  // Handler for when a coin is added to ensure UI updates
  const handleCoinAdded = useCallback(() => {
    // Call refreshWatchlist to update the UI, bypassing rate limits
    refreshWatchlist(true);
    
    // Also call the parent's onRefresh if provided
    if (onRefresh) {
      onRefresh();
    }
  }, [refreshWatchlist, onRefresh]);

  // Handler for opening the item detail modal
  const handleItemClick = useCallback((item: WatchlistItem) => {
    setSelectedItem(item);
    setIsDetailModalOpen(true);
  }, []);
  
  // Handler for closing the item detail modal
  const handleDetailModalClose = useCallback(() => {
    setIsDetailModalOpen(false);
    setSelectedItem(null);
    // Force a refresh to ensure UI updates when the modal closes
    refreshWatchlist(true);
  }, [refreshWatchlist]);
  
  // Modal for adding coins - Only render when open
  const addCoinModal = isAddModalOpen ? (
    <AddToWatchlistModal
      isOpen={isAddModalOpen}
      onClose={() => {
        setIsAddModalOpen(false);
      }}
      onCoinAdded={handleCoinAdded}
    />
  ) : null;

  // Load coin data for watchlist items - Modified to load immediately
  useEffect(() => {
    // Load watchlist data immediately on mount, regardless of initialLoadComplete
    if (!watchlistLoading && watchlist?.length > 0) {
      console.log("Loading watchlist coin data, items:", watchlist.length);
      
      // Extract coin IDs from watchlist
      const coinIds = watchlist.map(item => item.coinId.toString());
      
      // Fetch all coin data at once
      setIsDataLoading(true);
      getMultipleCoinsData(coinIds)
        .then(data => {
          console.log(`Got data for ${Object.keys(data).length}/${coinIds.length} watchlist coins`);
          setCoinDataMap(data);
        })
        .catch(error => {
          console.error("Error fetching watchlist coin data:", error);
        })
        .finally(() => {
          setIsDataLoading(false);
        });
    } else if (!watchlistLoading && !watchlist?.length) {
      console.log("No watchlist items to load");
      // No watchlist items, so no loading needed
      setIsDataLoading(false);
    }
  }, [watchlist, watchlistLoading, getMultipleCoinsData]);

  if (watchlistLoading) {
    return (
      <div className={cn("flex flex-col", className)} style={{ height: hideControls ? 'auto' : 'calc(100vh - 24rem)' }}>
        {!hideControls && (
          <div className="flex justify-between items-center mb-6">
            <div className="h-6 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
            <div className="h-8 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
          </div>
        )}
        
        <div className="space-y-1 w-full">
          {[...Array(5)].map((_, i) => (
            <WatchlistItemSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (watchlistError) {
    return (
      <div className="text-center p-6">
        <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30 mb-4">
          <p className="text-red-600 dark:text-red-400">{watchlistError}</p>
        </div>
        <button 
          className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition-colors transform hover:scale-105"
          onClick={() => refreshWatchlist(true)}
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className={cn(
      "relative h-full flex flex-col", 
      className
    )}>
      {watchlistLoading ? (
        <div className="flex-1 flex flex-col p-3 space-y-3">
          {[...Array(3)].map((_, i) => (
            <WatchlistItemSkeleton key={i} />
          ))}
        </div>
      ) : watchlistError ? (
        <div className="flex-1 flex flex-col items-center justify-center p-6">
          <div className="w-16 h-16 mb-4 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8 text-red-500">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
              <line x1="12" y1="9" x2="12" y2="13"></line>
              <line x1="12" y1="17" x2="12.01" y2="17"></line>
            </svg>
          </div>
          <p className="text-lg mb-2 font-medium text-gray-800 dark:text-white">Error loading watchlist</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 text-center">
            An error occurred while loading your watchlist
          </p>
          <button 
            onClick={() => refreshWatchlist()}
            className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition-colors"
          >
            Refresh watchlist
          </button>
        </div>
      ) : (
        <>
          {!hideControls && (
            <div className="flex justify-between items-center mb-4 p-3 border-b border-gray-100 dark:border-gray-700">
              <h2 className="font-semibold text-lg text-gray-800 dark:text-white">
                Your Watchlist
              </h2>
              <button 
                onClick={() => setIsAddModalOpen(true)}
                className="text-teal-600 hover:text-teal-700 dark:text-teal-400 dark:hover:text-teal-300"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                  <line x1="12" y1="5" x2="12" y2="19"></line>
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
              </button>
            </div>
          )}

          {watchlist.length === 0 ? (
            <div className="flex flex-col items-center justify-center flex-grow py-8">
              <div className="w-20 h-20 mb-4 rounded-full bg-violet-100 dark:bg-violet-900/20 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-10 h-10 text-violet-500">
                  <path d="M2.5 18.5A9 9 0 1 1 16.5 18.5M16.5 18.5L21.5 13.5M16.5 18.5L21.5 23.5" />
                </svg>
              </div>
              <p className="text-lg mb-2 font-medium text-gray-800 dark:text-white">Watchlist is empty</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 text-center max-w-xs">
                Add cryptocurrencies to your watchlist to track their prices and set price targets
              </p>
              {!hideControls && (
                <button 
                  onClick={() => setIsAddModalOpen(true)}
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition-colors transform hover:scale-105 active:scale-95"
                >
                  Add your first coin
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-y-auto flex-1 w-full scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent">
              <div>
                {watchlist.map((item, index) => {
                  const targetPercentage = getTargetPercentage(item);
                  const isTargetHigher = item.priceTarget ? item.priceTarget > item.price : false;
                  const progressPercentage = item.priceTarget 
                    ? calculateProgressPercentage(item.price, item.priceTarget)
                    : 0;
                  
                  return (
                    <div 
                      key={item.id} 
                      className={itemAnimationClass} 
                      style={{ transitionDelay: `${index * 30}ms`, animationDelay: `${index * 30}ms` }}
                    >
                      <WatchlistItemCard
                        item={item}
                        progressPercentage={progressPercentage}
                        targetPercentage={targetPercentage}
                        isTargetHigher={isTargetHigher}
                        onClick={handleItemClick}
                        isFirst={index === 0}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}
      
      {isAddModalOpen && (
        <AddToWatchlistModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onCoinAdded={handleCoinAdded}
        />
      )}

      {selectedItem && (
        <WatchlistItemDetailModal
          isOpen={isDetailModalOpen}
          onClose={handleDetailModalClose}
          item={selectedItem}
          onRefresh={onRefresh}
        />
      )}
    </div>
  );
};

export default WatchlistComponent; 