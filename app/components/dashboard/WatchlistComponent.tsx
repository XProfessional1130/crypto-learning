import React, { useState, useEffect, useCallback, memo } from 'react';
import { useWatchlist, WatchlistItem } from '@/lib/hooks/useWatchlist';
import { CoinData } from '@/types/portfolio';
import WatchlistItemDetailModal from './WatchlistItemDetailModal';
import AddToWatchlistModal from './AddToWatchlistModal';
import { cn } from '@/lib/utils/classnames';
import { calculateProgressPercentage, formatCryptoPrice, formatLargeNumber, formatPercentage } from '@/lib/utils/formatters';
import Image from 'next/image';
import { Skeleton } from '../ui/skeleton';

// Define props interface for WatchlistComponent
interface WatchlistComponentProps {
  onRefresh?: () => void;
  initialLoadComplete?: boolean;
}

// Memoized WatchlistItemCard component
const WatchlistItemCard = memo(({ 
  item, 
  progressPercentage, 
  targetPercentage, 
  isTargetHigher, 
  onClick 
}: {
  item: WatchlistItem;
  progressPercentage: number;
  targetPercentage: number;
  isTargetHigher: boolean;
  onClick: (item: WatchlistItem) => void;
}) => {
  return (
    <div 
      onClick={() => onClick(item)}
      className="bg-white dark:bg-gray-800 rounded-lg p-3 shadow-sm cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-300 border border-gray-200 dark:border-gray-700 w-full hover:shadow-card-hover transform hover:-translate-y-1"
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center">
          <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center mr-2 text-xs font-bold overflow-hidden">
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
            <div className="font-medium">{item.symbol}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">{item.name}</div>
          </div>
        </div>

        <div className="flex items-end gap-3">
          <div className="text-right">
            <div className="text-xs text-gray-500 dark:text-gray-400">Current</div>
            <div className="font-medium">{formatCryptoPrice(item.price)}</div>
          </div>
          
          {item.priceTarget && (
            <div className="text-right">
              <div className="text-xs text-gray-500 dark:text-gray-400">Target</div>
              <div className="font-medium">{formatCryptoPrice(item.priceTarget)}</div>
            </div>
          )}
        </div>
      </div>
      
      {item.priceTarget && (
        <div>
          <div className="flex justify-between items-center mb-1">
            <div className="text-xs text-gray-500 dark:text-gray-400">
              Progress to target
            </div>
            <div className={`text-xs font-medium ${
              isTargetHigher ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
            }`}>
              {Math.round(progressPercentage)}%
            </div>
          </div>
          
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
            <div 
              className={`h-2 rounded-full ${isTargetHigher ? 'bg-green-500' : 'bg-red-500'}`}
              style={{ width: `${progressPercentage}%` }}
            ></div>
          </div>
          
          <div className="flex justify-end mt-1">
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
              isTargetHigher
                ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400' 
                : 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
            }`}>
              {formatPercentage(Math.abs(targetPercentage))} {isTargetHigher ? 'upside' : 'downside'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
});
WatchlistItemCard.displayName = 'WatchlistItemCard';

// Create a memoized WatchlistItemSkeleton component for better loading UX
const WatchlistItemSkeleton = memo(() => {
  return (
    <div className="animate-pulse flex items-center justify-between p-3 border-b border-gray-100 dark:border-gray-700">
      <div className="flex items-center gap-3">
        <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
        <div className="space-y-2">
          <div className="h-4 w-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
          <div className="h-3 w-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
      <div className="space-y-2">
        <div className="h-4 w-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
        <div className="h-3 w-12 bg-gray-200 dark:bg-gray-700 rounded"></div>
      </div>
    </div>
  );
});
WatchlistItemSkeleton.displayName = 'WatchlistItemSkeleton';

const WatchlistComponent = ({ onRefresh, initialLoadComplete = false }: WatchlistComponentProps) => {
  const {
    watchlist,
    loading,
    error,
    getTargetPercentage,
    refreshWatchlist
  } = useWatchlist();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<WatchlistItem | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Create consistent animation classes based on loading state
  const contentAnimationClass = initialLoadComplete ? "animate-fadeIn" : "opacity-0 transition-opacity-transform";
  const itemAnimationClass = initialLoadComplete ? "animate-slide-up" : "opacity-0 transition-opacity-transform";
  
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

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 flex flex-col" style={{ height: 'calc(100vh - 24rem)' }}>
        <div className="flex justify-between items-center mb-6">
          <div className="h-6 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
          <div className="h-8 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
        </div>
        
        <div className="space-y-4 w-full">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="bg-white dark:bg-gray-800 rounded-lg p-3 shadow-sm border border-gray-200 dark:border-gray-700 w-full animate-pulse">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700"></div>
                  <div>
                    <div className="h-4 w-16 bg-gray-200 dark:bg-gray-700 rounded mb-1"></div>
                    <div className="h-3 w-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
                  </div>
                </div>
                <div className="flex items-end gap-3">
                  <div className="text-right">
                    <div className="h-3 w-12 bg-gray-200 dark:bg-gray-700 rounded mb-1"></div>
                    <div className="h-4 w-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
                  </div>
                </div>
              </div>
              <div className="h-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full mt-2"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-10">
        <p className="text-red-500">{error}</p>
        <button 
          className="mt-4 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
          onClick={() => refreshWatchlist(true)}
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 flex flex-col ${contentAnimationClass}`} style={{ height: 'calc(100vh - 24rem)' }}>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold">Watchlist</h2>
        <div className="flex space-x-2">
          <button 
            onClick={handleManualRefresh}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-teal-500"
            aria-label="Refresh watchlist"
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
          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition-colors transform hover:scale-105 active:scale-95 hover:shadow-md"
          >
            Add Coin
          </button>
        </div>
      </div>

      {watchlist.length === 0 ? (
        <div className="text-center py-10 flex-grow">
          <p className="text-lg mb-4">Your watchlist is empty</p>
          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition-colors transform hover:scale-105 active:scale-95"
          >
            Add your first coin
          </button>
        </div>
      ) : (
        <div className="overflow-y-auto h-[calc(100%-4rem)] space-y-4 w-full pr-1 scrollbar-thin">
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
                />
              </div>
            );
          })}
        </div>
      )}

      {/* Modal for adding coins - Only render when open */}
      {addCoinModal}

      {/* Modal for viewing/editing watchlist item details - Only render when open */}
      {isDetailModalOpen && selectedItem && (
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