import { useState } from 'react';
import { useWatchlist, WatchlistItem } from '@/lib/hooks/useWatchlist';
import { CoinData } from '@/types/portfolio';
import WatchlistItemDetailModal from './WatchlistItemDetailModal';
import AddToWatchlistModal from './AddToWatchlistModal';

// Format cryptocurrency prices adaptively based on their value
const formatCryptoPrice = (price: number): string => {
  if (!price) return '$---';

  if (price >= 1) {
    return `$${Math.round(price).toLocaleString()}`;
  } else if (price >= 0.01) {
    return `$${price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  } else if (price >= 0.0001) {
    return `$${price.toLocaleString(undefined, { minimumFractionDigits: 4, maximumFractionDigits: 4 })}`;
  } else {
    return `< $0.0001`;
  }
};

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
          className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
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
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead>
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Coin</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Current Price</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">24h Change</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Target Price</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Target %</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {watchlist.map((item) => {
                const targetPercentage = getTargetPercentage(item);
                return (
                  <tr 
                    key={item.id}
                    onClick={() => handleItemClick(item)}
                    className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors"
                  >
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="flex items-center">
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
                          <div className="text-sm text-gray-500 dark:text-gray-400">{item.name}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-right font-medium">
                      {formatCryptoPrice(item.price)}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-right">
                      <span className={`inline-block px-2 py-1 rounded-full text-sm font-medium ${
                        item.change24h >= 0 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' 
                          : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                      }`}>
                        {item.change24h >= 0 ? '+' : ''}{item.change24h.toFixed(2)}%
                      </span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-right font-medium">
                      {item.priceTarget ? formatCryptoPrice(item.priceTarget) : '—'}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-right">
                      {item.priceTarget ? (
                        <span className={`inline-block px-2 py-1 rounded-full text-sm font-medium ${
                          targetPercentage >= 0 
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' 
                            : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                        }`}>
                          {targetPercentage >= 0 ? '+' : ''}{targetPercentage.toFixed(2)}%
                        </span>
                      ) : '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
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