import { useState, useEffect } from 'react';
import { useWatchlist, WatchlistItem } from '@/lib/hooks/useWatchlist';
import { CoinData } from '@/types/portfolio';
import WatchlistItemDetailModal from './WatchlistItemDetailModal';
import AddToWatchlistModal from './AddToWatchlistModal';
import { formatCryptoPrice, formatPercentage } from '@/lib/utils/format';
import Image from 'next/image';

export default function WatchlistComponent() {
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
  const [forceRefresh, setForceRefresh] = useState(0);

  // Force refresh the watchlist when component mounts and after adding a coin
  useEffect(() => {
    refreshWatchlist();
  }, [refreshWatchlist, forceRefresh]);

  // Handler for when a coin is added to ensure UI updates
  const handleCoinAdded = () => {
    console.log("Coin added to watchlist, refreshing...");
    // Increment to trigger the useEffect and force a refresh
    setForceRefresh(prev => prev + 1);
  };

  // Handler for opening the item detail modal
  const handleItemClick = (item: WatchlistItem) => {
    setSelectedItem(item);
    setIsDetailModalOpen(true);
  };
  
  // Handler for closing the item detail modal
  const handleDetailModalClose = () => {
    setIsDetailModalOpen(false);
    setSelectedItem(null);
    // Also refresh the watchlist when modal closes
    setForceRefresh(prev => prev + 1);
  };

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
          onClick={() => setForceRefresh(prev => prev + 1)}
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
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
        <div className="text-center py-10">
          <p className="text-gray-500 dark:text-gray-400 mb-4">Your watchlist is empty</p>
          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Add your first coin
          </button>
        </div>
      ) : (
        <div className="space-y-4 w-full">
          {watchlist.map((item) => {
            const targetPercentage = getTargetPercentage(item);
            const isTargetHigher = item.priceTarget ? item.priceTarget > item.price : false;
            const progressPercentage = item.priceTarget 
              ? calculateProgressPercentage(item.price, item.priceTarget)
              : 0;
            
            return (
              <div 
                key={item.id}
                onClick={() => handleItemClick(item)}
                className="bg-gray-50 dark:bg-gray-750 rounded-lg p-4 cursor-pointer hover:shadow-md transition-all border border-gray-100 dark:border-gray-700 w-full flex flex-col md:flex-row md:items-center gap-4"
              >
                <div className="flex items-center flex-shrink-0">
                  <div className="w-10 h-10 rounded-full bg-white dark:bg-gray-700 flex items-center justify-center mr-3 overflow-hidden border border-gray-200 dark:border-gray-600">
                    <div className="w-full h-full flex items-center justify-center text-gray-700 dark:text-gray-200 font-bold">
                      {item.symbol.substring(0, 3)}
                    </div>
                  </div>
                  <div>
                    <div className="text-lg font-bold">{item.symbol}</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">{item.name}</div>
                  </div>
                </div>
                
                <div className="flex-grow flex flex-col md:flex-row md:items-center gap-4 w-full">
                  <div className="md:flex-1 flex flex-row justify-between md:justify-start md:gap-8">
                    <div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">Current:</div>
                      <div className="text-lg font-medium">{formatCryptoPrice(item.price)}</div>
                    </div>
                    
                    {item.priceTarget && (
                      <div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">Target:</div>
                        <div className="text-lg font-medium">{formatCryptoPrice(item.priceTarget)}</div>
                      </div>
                    )}
                  </div>
                  
                  {item.priceTarget && (
                    <div className="md:flex-1 flex flex-col">
                      <div className="flex justify-between items-center">
                        <div className="text-sm text-gray-500 dark:text-gray-400">Progress to target</div>
                        <div className={`text-sm font-bold ${
                          isTargetHigher ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                        }`}>
                          {Math.round(progressPercentage)}%
                        </div>
                      </div>
                      
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden mt-1.5">
                        <div 
                          className={`h-3 rounded-full ${isTargetHigher ? 'bg-green-500' : 'bg-red-500'}`}
                          style={{ width: `${progressPercentage}%` }}
                        ></div>
                      </div>
                    </div>
                  )}
                  
                  <div className="md:w-auto flex justify-end">
                    <span className={`text-sm font-medium px-3 py-1.5 rounded-full ${
                      isTargetHigher
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' 
                        : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                    }`}>
                      {formatPercentage(Math.abs(targetPercentage))} {isTargetHigher ? 'upside' : 'downside'}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal for adding coins */}
      <AddToWatchlistModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onCoinAdded={handleCoinAdded}
      />

      {/* Modal for viewing/editing watchlist item details */}
      <WatchlistItemDetailModal
        isOpen={isDetailModalOpen}
        onClose={handleDetailModalClose}
        item={selectedItem}
      />
    </div>
  );
} 