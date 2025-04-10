import { useMemo, useState, memo } from 'react';
import { WatchlistItem } from '@/lib/api/team-watchlist';
import { GlobalData } from '@/lib/api/coinmarketcap';
import { useTeamData } from '@/lib/providers/team-data-provider';
import { CoinData } from '@/types/portfolio';
import { PlusCircle, Edit2, Trash } from 'lucide-react';
import TeamAddToWatchlistModal from './TeamAddToWatchlistModal';
import TeamWatchlistItemDetailModal from './TeamWatchlistItemDetailModal';
import { formatCryptoPrice, formatLargeNumber, formatPercentage } from '@/lib/utils/formatters';
import { useModal } from '@/lib/providers/modal-provider';

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
  // Retrieve all needed functions from context at the top level
  const { isAdmin, addToWatchlist, updatePriceTarget, removeFromWatchlist, refreshWatchlist, isInWatchlist } = useTeamData();
  const [selectedItem, setSelectedItem] = useState<WatchlistItem | null>(null);
  const { openModal, closeModal } = useModal();

  // Create a sorted version of the watchlist items by market cap
  const sortedWatchlistItems = useMemo(() => {
    if (!watchlist || watchlist.length === 0) return [];
    
    // Return a new sorted array by price (descending)
    // In a real app, you might want to sort by market cap, but we use price here as a simple metric
    return [...watchlist].sort((a, b) => b.price - a.price);
  }, [watchlist]);

  // Handle opening add to watchlist modal
  const handleOpenAddToWatchlistModal = () => {
    openModal(
      <TeamAddToWatchlistModal
        onClose={closeModal}
        isInWatchlist={isInWatchlist}
        onCoinAdded={async (coin, priceTarget) => {
          try {
            const result = await addToWatchlist(coin, priceTarget);
            if (result && result.success) {
              closeModal();
              await refreshWatchlist(true);
            }
            return result;
          } catch (error) {
            console.error('Error adding coin to team watchlist:', error);
            return { success: false };
          }
        }}
      />
    );
  };

  // Handle opening item detail modal for editing
  const handleSelectItem = (item: WatchlistItem) => {
    setSelectedItem(item);
    
    openModal(
      <TeamWatchlistItemDetailModal
        onClose={closeModal}
        item={item}
        getTargetPercentage={getTargetPercentage}
        onUpdatePriceTarget={async (newTarget) => {
          try {
            await updatePriceTarget(item.id, newTarget);
            closeModal();
            await refreshWatchlist(true);
            return;
          } catch (error) {
            console.error('Error updating price target:', error);
          }
        }}
        onRemove={async () => {
          try {
            await removeFromWatchlist(item.id);
            closeModal();
            await refreshWatchlist(true);
            return;
          } catch (error) {
            console.error('Error removing item from watchlist:', error);
          }
        }}
      />
    );
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
            <p className="text-sm mt-2">
              Click the '+' button in the header to add assets to the team watchlist.
            </p>
          ) : (
            <p className="text-sm">
              The team watchlist is managed by the admin. Currently, no assets have been added.
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="overflow-y-auto h-[calc(100vh-32rem)] scrollbar-thin">
        {sortedWatchlistItems.map((item: WatchlistItem) => {
          const targetPercentage = getTargetPercentage(item);
          return (
            <div 
              key={item.id}
              onClick={isAdmin ? () => handleSelectItem(item) : undefined}
              className={`flex justify-between items-center p-4 border-b border-gray-100 dark:border-gray-700 ${isAdmin ? 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/80' : ''}`}
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