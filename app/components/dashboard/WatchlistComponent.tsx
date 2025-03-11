import { useState, useEffect, useCallback, memo } from 'react';
import { useWatchlist, WatchlistItem } from '@/lib/hooks/useWatchlist';
import { CoinData } from '@/types/portfolio';
import WatchlistItemDetailModal from './WatchlistItemDetailModal';
import AddToWatchlistModal from './AddToWatchlistModal';
import { formatCryptoPrice, formatPercentage } from '@/lib/utils/format';
import Image from 'next/image';

// Define props interface for WatchlistComponent
interface WatchlistComponentProps {
  onRefresh?: () => void;
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
      className="bg-white dark:bg-gray-800 rounded-lg p-3 shadow-sm cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-all border border-gray-200 dark:border-gray-700 w-full"
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

// Calculate progress percentage toward target (for progress bar)
const calculateProgressPercentage = (currentPrice: number, targetPrice: number): number => {
  if (!targetPrice || currentPrice === targetPrice) return 100;
  
  // If target is higher than current (we want price to go up)
  if (targetPrice > currentPrice) {
    // Calculate how far we've moved toward the target
    return Math.min(100, Math.max(0, (currentPrice / targetPrice) * 100));
  } 
  // If target is lower than current (we want price to go down)
  else {
    // Calculate how far we've moved toward the target (reverse direction)
    return Math.min(100, Math.max(0, (targetPrice / currentPrice) * 100));
  }
};

const WatchlistComponent = ({ onRefresh }: WatchlistComponentProps) => {
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
  
  // Only load once on mount, with no dependencies to prevent reruns
  useEffect(() => {
    // Initial data load
    refreshWatchlist();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array to ensure it only runs once

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
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 dark:border-blue-500"></div>
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
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 flex flex-col" style={{ height: 'calc(100vh - 24rem)' }}>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold">Watchlist</h2>
        <button 
          onClick={() => setIsAddModalOpen(true)}
          className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition-colors"
        >
          Add Coin
        </button>
      </div>

      {watchlist.length === 0 ? (
        <div className="text-center py-10 flex-grow">
          <p className="text-lg mb-4">Your watchlist is empty</p>
          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition-colors"
          >
            Add your first coin
          </button>
        </div>
      ) : (
        <div className="overflow-y-auto h-[calc(100%-4rem)] space-y-4 w-full pr-1 scrollbar-thin">
          {watchlist.map((item) => {
            const targetPercentage = getTargetPercentage(item);
            const isTargetHigher = item.priceTarget ? item.priceTarget > item.price : false;
            const progressPercentage = item.priceTarget 
              ? calculateProgressPercentage(item.price, item.priceTarget)
              : 0;
            
            return (
              <WatchlistItemCard
                key={item.id}
                item={item}
                progressPercentage={progressPercentage}
                targetPercentage={targetPercentage}
                isTargetHigher={isTargetHigher}
                onClick={handleItemClick}
              />
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