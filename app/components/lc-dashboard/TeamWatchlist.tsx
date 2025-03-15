import { useMemo, useState, memo } from 'react';
import { WatchlistItem } from '@/lib/hooks/useWatchlist';
import { GlobalData } from '@/lib/services/coinmarketcap';
import { useTeamData } from '@/lib/context/team-data-context';
import { CoinData } from '@/types/portfolio';
import { PlusCircle, Edit2, Trash } from 'lucide-react';
import TeamAddToWatchlistModal from './TeamAddToWatchlistModal';
import TeamWatchlistItemDetailModal from './TeamWatchlistItemDetailModal';
import { formatCryptoPrice, formatLargeNumber, formatPercentage } from '@/lib/utils/formatters';

interface TeamWatchlistProps {
  watchlist: WatchlistItem[];
  loading: boolean;
  error: string | null;
  isDataLoading: boolean;
  globalData: GlobalData | null;
  getTargetPercentage: (item: WatchlistItem) => number;
}

function TeamWatchlistComponent({
  watchlist,
  loading,
  error,
  isDataLoading,
  globalData,
  getTargetPercentage
}: TeamWatchlistProps) {
  const { isAdmin, addToWatchlist, updatePriceTarget, removeFromWatchlist, refreshWatchlist, isInWatchlist } = useTeamData();
  const [showAddToWatchlistModal, setShowAddToWatchlistModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<WatchlistItem | null>(null);
  const [showItemDetailModal, setShowItemDetailModal] = useState(false);

  // Create a sorted version of the watchlist items by market cap
  const sortedWatchlistItems = useMemo(() => {
    if (!watchlist || watchlist.length === 0) return [];
    
    // Return a new sorted array by price (descending)
    // In a real app, you might want to sort by market cap, but we use price here as a simple metric
    return [...watchlist].sort((a, b) => b.price - a.price);
  }, [watchlist]);

  // Handle add coin to watchlist
  const handleAddToWatchlist = async (coin: CoinData, priceTarget?: number) => {
    try {
      const result = await addToWatchlist(coin, priceTarget);
      
      // Only close modal and refresh if the operation was successful
      if (result && result.success) {
        setShowAddToWatchlistModal(false);
        await refreshWatchlist(true);
      } else {
        console.error('Failed to add coin to watchlist:', (result as { message?: string })?.message || 'Unknown error');
      }
    } catch (error) {
      console.error('Error adding coin to team watchlist:', error);
    }
  };

  // Handle opening item detail modal for editing
  const handleSelectItem = (item: WatchlistItem) => {
    setSelectedItem(item);
    setShowItemDetailModal(true);
  };

  if (loading || isDataLoading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-16 animate-pulse rounded bg-gray-200 dark:bg-gray-700"></div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg bg-red-50 dark:bg-red-900/20 p-4 text-red-600 dark:text-red-400">
        Error loading watchlist data. Please try again later.
      </div>
    );
  }

  if (!watchlist || watchlist.length === 0) {
    return (
      <div>
        <div className="rounded-lg bg-blue-50 dark:bg-blue-900/20 p-4 text-blue-600 dark:text-blue-400">
          <p className="mb-2 font-semibold">No assets in the team watchlist yet.</p>
          {isAdmin ? (
            <div className="mt-4">
              <button 
                onClick={() => setShowAddToWatchlistModal(true)}
                className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition-colors flex items-center"
              >
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Asset to Team Watchlist
              </button>
            </div>
          ) : (
            <p className="text-sm">
              The team watchlist is managed by the admin. Currently, no assets have been added.
            </p>
          )}
        </div>
        
        {/* TeamAddToWatchlistModal is now rendered only once at the bottom of the component */}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-4">
        {isAdmin && (
          <button 
            onClick={() => setShowAddToWatchlistModal(true)}
            className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition-colors flex items-center"
          >
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Asset
          </button>
        )}
      </div>
      
      <div className="overflow-y-auto h-[calc(100vh-32rem)] scrollbar-thin">
        {sortedWatchlistItems.map((item: WatchlistItem) => {
          const targetPercentage = getTargetPercentage(item);
          return (
            <div 
              key={item.id}
              onClick={isAdmin ? () => handleSelectItem(item) : undefined}
              className={`flex justify-between items-center p-4 border-b border-gray-100 dark:border-gray-700 ${isAdmin ? 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-750' : ''}`}
            >
              <div className="flex items-center">
                <div className="h-10 w-10 flex-shrink-0 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                  <img
                    src={`https://s2.coinmarketcap.com/static/img/coins/64x64/${item.coinId}.png`}
                    alt={item.symbol}
                    className="h-10 w-10 object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      const parent = target.parentElement;
                      if (parent) {
                        parent.innerHTML = item.symbol.substring(0, 3);
                        parent.classList.add('flex', 'items-center', 'justify-center', 'bg-gray-200', 'dark:bg-gray-600', 'text-gray-600', 'dark:text-gray-300', 'font-bold');
                      }
                    }}
                  />
                </div>
                <div className="ml-4">
                  <div className="font-medium text-gray-900 dark:text-white">{item.name}</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">{item.symbol}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-medium">{formatCryptoPrice(item.price)}</div>
                <div className="flex items-center justify-end space-x-2">
                  <div className={item.change24h >= 0 ? 'text-green-500' : 'text-red-500'}>
                    {item.change24h >= 0 ? '+' : ''}{item.change24h.toFixed(2)}%
                  </div>
                  {item.priceTarget && (
                    <div className={`text-xs px-2 py-0.5 rounded-full ${targetPercentage >= 0 ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400' : 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'}`}>
                      Target: {formatCryptoPrice(item.priceTarget)}
                    </div>
                  )}
                  {isAdmin && (
                    <div className="ml-2 flex space-x-1" onClick={(e) => e.stopPropagation()}>
                      <button 
                        className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectItem(item);
                        }}
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button 
                        className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300"
                        onClick={async (e) => {
                          e.stopPropagation();
                          if (window.confirm(`Remove ${item.name} from the team watchlist?`)) {
                            await removeFromWatchlist(item.id);
                            refreshWatchlist(true);
                          }
                        }}
                      >
                        <Trash className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg mt-6">
        <h3 className="text-sm font-medium text-blue-800 dark:text-blue-300">Watchlist Analysis</h3>
        <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
          Our team is closely monitoring these assets for potential investment opportunities. We perform thorough technical and fundamental analysis before adding any asset to our watchlist.
        </p>
      </div>

      {/* Add To Watchlist Modal - Single instance for the entire component */}
      <TeamAddToWatchlistModal
        isOpen={showAddToWatchlistModal}
        onClose={() => setShowAddToWatchlistModal(false)}
        onCoinAdded={handleAddToWatchlist}
      />

      {/* Item Detail Modal - Only shown when admin clicks on an item */}
      {showItemDetailModal && selectedItem && (
        <TeamWatchlistItemDetailModal
          item={selectedItem}
          isOpen={showItemDetailModal}
          onClose={() => setShowItemDetailModal(false)}
          onUpdatePriceTarget={async (newTarget) => {
            await updatePriceTarget(selectedItem.id, newTarget);
            setShowItemDetailModal(false);
            refreshWatchlist(true);
          }}
          onRemove={async () => {
            await removeFromWatchlist(selectedItem.id);
            setShowItemDetailModal(false);
            refreshWatchlist(true);
          }}
        />
      )}
    </div>
  );
}

// Create a memoized version with custom comparison
const TeamWatchlist = memo(
  TeamWatchlistComponent,
  (prevProps, nextProps) => {
    // Re-render only if relevant props change
    return (
      prevProps.loading === nextProps.loading &&
      prevProps.error === nextProps.error &&
      prevProps.isDataLoading === nextProps.isDataLoading &&
      prevProps.watchlist === nextProps.watchlist
    );
  }
);

export default TeamWatchlist; 