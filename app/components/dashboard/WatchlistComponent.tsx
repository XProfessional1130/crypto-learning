import { useState } from 'react';
import { useWatchlist, WatchlistItem } from '@/lib/hooks/useWatchlist';
import { CoinData } from '@/types/portfolio';
import WatchlistItemDetailModal from './WatchlistItemDetailModal';
import AddToWatchlistModal from './AddToWatchlistModal';
import { formatCryptoPrice, formatPercentage } from '@/lib/utils/format';

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

  // Handler for when a coin is added to ensure UI updates
  const handleCoinAdded = () => {
    console.log("Coin added to watchlist, refreshing...");
    refreshWatchlist();
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
    refreshWatchlist();
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
          onClick={refreshWatchlist}
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
                className="bg-gray-50 dark:bg-gray-750 rounded-lg p-5 cursor-pointer hover:shadow-md transition-all border border-gray-100 dark:border-gray-700"
              >
                <div className="flex items-center mb-4">
                  <div className="flex-shrink-0 h-12 w-12 relative mr-3">
                    <img 
                      src={`https://s2.coinmarketcap.com/static/img/coins/64x64/${item.id}.png`}
                      alt={item.symbol}
                      className="rounded-full bg-white p-0.5 border border-gray-200 dark:border-gray-600 w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        const parent = target.parentElement;
                        if (parent) {
                          parent.innerHTML = `<div class="w-full h-full rounded-full flex items-center justify-center bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 font-bold">${item.symbol.substring(0, 3)}</div>`;
                        }
                      }}
                    />
                  </div>
                  <div>
                    <div className="text-lg font-bold">{item.symbol}</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-[160px]">{item.name}</div>
                  </div>
                </div>
                
                <div className="space-y-3 mt-3">
                  <div className="flex justify-between items-baseline">
                    <div className="text-sm text-gray-500 dark:text-gray-400">Current:</div>
                    <div className="text-lg font-medium">{formatCryptoPrice(item.price)}</div>
                  </div>
                  
                  {item.priceTarget && (
                    <div className="flex justify-between items-baseline">
                      <div className="text-sm text-gray-500 dark:text-gray-400">Target:</div>
                      <div className="text-lg font-medium">{formatCryptoPrice(item.priceTarget)}</div>
                    </div>
                  )}
                  
                  {item.priceTarget && (
                    <div className="mt-3">
                      <div className="flex justify-between items-center mb-1.5">
                        <div className="text-xs text-gray-500 dark:text-gray-400">Progress to target</div>
                        <div className={`text-xs font-bold ${
                          isTargetHigher ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                        }`}>
                          {Math.round(progressPercentage)}%
                        </div>
                      </div>
                      
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 overflow-hidden">
                        <div 
                          className={`h-2.5 rounded-full ${isTargetHigher ? 'bg-green-500' : 'bg-red-500'}`}
                          style={{ width: `${progressPercentage}%` }}
                        ></div>
                      </div>
                      
                      <div className="flex justify-end mt-2">
                        <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                          isTargetHigher
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' 
                            : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                        }`}>
                          {formatPercentage(Math.abs(targetPercentage))} {isTargetHigher ? 'upside' : 'downside'}
                        </span>
                      </div>
                    </div>
                  )}
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