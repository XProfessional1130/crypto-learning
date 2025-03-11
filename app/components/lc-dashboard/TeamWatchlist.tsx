import { useMemo } from 'react';
import { WatchlistItem } from '@/lib/hooks/useWatchlist';
import { GlobalData } from '@/lib/services/coinmarketcap';

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
  // Create a sorted version of the watchlist items by market cap
  const sortedWatchlistItems = useMemo(() => {
    if (!watchlist || watchlist.length === 0) return [];
    
    // Return a new sorted array by price (descending)
    // In a real app, you might want to sort by market cap, but we use price here as a simple metric
    return [...watchlist].sort((a, b) => b.price - a.price);
  }, [watchlist]);

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
        <p className="text-sm">
          The team watchlist is managed through the user with email set in NEXT_PUBLIC_TEAM_ADMIN_EMAIL. 
          That user needs to add assets to their watchlist through the regular dashboard.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
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
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {sortedWatchlistItems.map((item: WatchlistItem) => {
              const targetPercentage = getTargetPercentage(item);
              return (
                <tr key={item.id}>
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
    </div>
  );
} 