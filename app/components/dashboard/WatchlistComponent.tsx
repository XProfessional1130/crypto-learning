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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {watchlist.map((item) => {
            const targetPercentage = getTargetPercentage(item);
            const isTargetHigher = item.priceTarget ? item.priceTarget > item.price : false;
            
            return (
              <div 
                key={item.id}
                onClick={() => handleItemClick(item)}
                className="bg-gray-50 dark:bg-gray-750 rounded-lg p-4 cursor-pointer hover:shadow-md transition-all border border-gray-100 dark:border-gray-700"
              >
                <div className="flex items-center mb-3">
                  <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center mr-3 overflow-hidden">
                    <img 
                      src={`https://s2.coinmarketcap.com/static/img/coins/64x64/${item.id}.png`}
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
                    <div className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[120px]">{item.name}</div>
                  </div>
                </div>
                
                <div className="flex justify-between items-baseline mb-1">
                  <div className="text-sm text-gray-500 dark:text-gray-400">Current:</div>
                  <div className="font-medium">{formatCryptoPrice(item.price)}</div>
                </div>
                
                {item.priceTarget && (
                  <>
                    <div className="flex justify-between items-baseline mb-1">
                      <div className="text-sm text-gray-500 dark:text-gray-400">Target:</div>
                      <div className="font-medium">{formatCryptoPrice(item.priceTarget)}</div>
                    </div>
                    
                    <div className="mt-2 w-full bg-gray-200 dark:bg-gray-600 rounded-full h-1.5">
                      <div 
                        className={`h-1.5 rounded-full ${isTargetHigher ? 'bg-green-500' : 'bg-red-500'}`}
                        style={{ width: `${Math.min(Math.abs(targetPercentage), 100)}%` }}
                      ></div>
                    </div>
                    
                    <div className="flex justify-end mt-1">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                        isTargetHigher
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' 
                          : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                      }`}>
                        {formatPercentage(targetPercentage)}
                      </span>
                    </div>
                  </>
                )}
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