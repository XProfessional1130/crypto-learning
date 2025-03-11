import { useMemo, useState } from 'react';
import { WatchlistItem } from '@/lib/hooks/useWatchlist';
import { GlobalData } from '@/lib/services/coinmarketcap';
import { useTeamWatchlist } from '@/lib/hooks/useTeamWatchlist';
import { CoinData } from '@/types/portfolio';
import { PlusCircle, Edit2, Trash } from 'lucide-react';
import TeamAddToWatchlistModal from './TeamAddToWatchlistModal';
import TeamWatchlistItemDetailModal from './TeamWatchlistItemDetailModal';

// Function to format cryptocurrency prices adaptively based on their value
const formatCryptoPrice = (price: number): string => {
  if (!price) return '$---';

  if (price >= 1) {
    // For prices $1 and above: round to whole number
    return `$${Math.round(price).toLocaleString()}`;
  } else if (price >= 0.01) {
    // For prices between $0.01 and $1: show 2 decimal places
    return `$${price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  } else if (price >= 0.0001) {
    // For prices between $0.0001 and $0.01: show 4 decimal places
    return `$${price.toLocaleString(undefined, { minimumFractionDigits: 4, maximumFractionDigits: 4 })}`;
  } else {
    // For extremely low prices: show as "< $0.0001"
    return `< $0.0001`;
  }
};

// Function to format large numbers (like market cap and volume)
const formatLargeNumber = (num: number): string => {
  if (!num) return '$---';
  
  if (num >= 1_000_000_000) {
    return `$${(num / 1_000_000_000).toFixed(1)}B`;
  } else if (num >= 1_000_000) {
    return `$${(num / 1_000_000).toFixed(1)}M`;
  } else if (num >= 1_000) {
    return `$${(num / 1_000).toFixed(1)}K`;
  } else {
    return `$${num.toFixed(0)}`;
  }
};

interface TeamWatchlistProps {
  watchlist: WatchlistItem[];
  loading: boolean;
  error: string | null;
  isDataLoading: boolean;
  globalData: GlobalData | null;
  getTargetPercentage: (item: WatchlistItem) => number;
}

export default function TeamWatchlist({
  watchlist,
  loading,
  error,
  isDataLoading,
  globalData,
  getTargetPercentage
}: TeamWatchlistProps) {
  const { isAdmin, addToWatchlist, updatePriceTarget, removeFromWatchlist, refreshWatchlist } = useTeamWatchlist();
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
    console.log('handleAddToWatchlist called with coin:', coin);
    console.log('Price target:', priceTarget);
    console.log('isAdmin value:', isAdmin);
    
    try {
      console.log('Calling addToWatchlist service');
      const result = await addToWatchlist(coin, priceTarget);
      console.log('addToWatchlist service result:', result);
      
      // Only close modal and refresh if the operation was successful
      if (result && result.success) {
        console.log('Closing modal and refreshing watchlist');
        setShowAddToWatchlistModal(false);
        await refreshWatchlist(true);
        console.log('Watchlist refreshed');
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
          <div key={i} className="h-16 animate-pulse rounded bg-gray-200"></div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg bg-red-50 p-4 text-red-600">
        Error loading watchlist data. Please try again later.
      </div>
    );
  }

  if (!watchlist || watchlist.length === 0) {
    return (
      <div className="rounded-lg bg-blue-50 p-4 text-blue-600">
        <p className="mb-2 font-semibold">No assets in the team watchlist yet.</p>
        {isAdmin ? (
          <div className="mt-4">
            <button 
              onClick={() => {
                console.log('Empty state Add Asset button clicked');
                setShowAddToWatchlistModal(true);
                console.log('showAddToWatchlistModal set to:', true);
              }}
              className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 flex items-center"
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
    );
  }

  return (
    <div className="space-y-6">
      {isAdmin && (
        <div className="flex justify-end mb-4">
          <button 
            onClick={() => {
              console.log('Add Asset button clicked');
              setShowAddToWatchlistModal(true);
              console.log('showAddToWatchlistModal set to:', true);
            }}
            className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 flex items-center"
          >
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Asset
          </button>
        </div>
      )}
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Asset
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Current Price
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                24h Change
              </th>
              {/* Only show price targets column if any coins have a price target */}
              {watchlist.some(item => item.priceTarget) && (
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Price Target
                </th>
              )}
              {isAdmin && (
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {sortedWatchlistItems.map((item: WatchlistItem) => {
              const targetPercentage = getTargetPercentage(item);
              return (
                <tr key={item.id} className={isAdmin ? "cursor-pointer hover:bg-gray-50" : ""} onClick={isAdmin ? () => handleSelectItem(item) : undefined}>
                  <td className="whitespace-nowrap px-6 py-4">
                    <div className="flex items-center">
                      <div className="h-10 w-10 flex-shrink-0 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center">
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
                              parent.classList.add('flex', 'items-center', 'justify-center', 'bg-gray-200', 'text-gray-600', 'font-bold');
                            }
                          }}
                        />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{item.name}</div>
                        <div className="text-sm text-gray-500">{item.symbol}</div>
                      </div>
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                    {formatCryptoPrice(item.price)}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm">
                    <span className={item.change24h >= 0 ? 'text-green-600' : 'text-red-600'}>
                      {item.change24h >= 0 ? '+' : ''}{item.change24h.toFixed(2)}%
                    </span>
                  </td>
                  {/* Only show price targets column if any coins have a price target */}
                  {watchlist.some(item => item.priceTarget) && (
                    <td className="whitespace-nowrap px-6 py-4 text-sm">
                      {item.priceTarget ? (
                        <div>
                          <div>{formatCryptoPrice(item.priceTarget)}</div>
                          <div className={targetPercentage >= 0 ? 'text-green-600 text-xs' : 'text-red-600 text-xs'}>
                            {targetPercentage >= 0 ? '+' : ''}{targetPercentage.toFixed(2)}% from current
                          </div>
                        </div>
                      ) : (
                        <span className="text-gray-400">--</span>
                      )}
                    </td>
                  )}
                  {isAdmin && (
                    <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium" onClick={(e) => e.stopPropagation()}>
                      <button 
                        className="text-indigo-600 hover:text-indigo-900 mr-3"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectItem(item);
                        }}
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button 
                        className="text-red-600 hover:text-red-900"
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
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="bg-indigo-50 p-4 rounded-lg mt-6">
        <h3 className="text-lg font-medium text-indigo-800">Watchlist Analysis</h3>
        <p className="text-indigo-600 mt-1">
          Our team is closely monitoring these assets for potential investment opportunities. We perform thorough technical and fundamental analysis before adding any asset to our watchlist.
        </p>
      </div>

      {/* Add To Watchlist Modal - always render but control visibility with isOpen */}
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