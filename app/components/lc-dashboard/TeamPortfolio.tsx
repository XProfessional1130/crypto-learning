import { useMemo } from 'react';
import { PortfolioItemWithPrice } from '@/types/portfolio';
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

interface TeamPortfolioProps {
  portfolio: {
    totalValueUsd: number;
    totalValueBtc: number;
    dailyChangePercentage: number;
    dailyChangeUsd: number;
    dailyChangeBtc: number;
    items: PortfolioItemWithPrice[];
  } | null;
  loading: boolean;
  error: string | null;
  isDataLoading: boolean;
  btcPrice: number | null;
  ethPrice: number | null;
  globalData: GlobalData | null;
}

export default function TeamPortfolio({
  portfolio,
  loading,
  error,
  isDataLoading,
  btcPrice,
  ethPrice,
  globalData
}: TeamPortfolioProps) {
  // Create a sorted version of the portfolio items
  const sortedPortfolioItems = useMemo(() => {
    if (!portfolio || !portfolio.items) return [];
    
    // Return a new sorted array by valueUsd (descending)
    return [...portfolio.items].sort((a, b) => b.valueUsd - a.valueUsd);
  }, [portfolio]);

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
        Error loading portfolio data. Please try again later.
      </div>
    );
  }

  if (!portfolio || portfolio.items.length === 0) {
    return (
      <div className="rounded-lg bg-blue-50 p-4 text-blue-600">
        <p className="mb-2 font-semibold">No assets in the team portfolio yet.</p>
        <p className="text-sm">
          The team portfolio is managed through the user with email set in NEXT_PUBLIC_TEAM_ADMIN_EMAIL. 
          That user needs to add assets to their portfolio through the regular dashboard.
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
                Allocation
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Current Price
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                24h Change
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {sortedPortfolioItems.map((item: PortfolioItemWithPrice) => (
              <tr key={item.id}>
                <td className="whitespace-nowrap px-6 py-4">
                  <div className="flex items-center">
                    <div className="h-10 w-10 flex-shrink-0 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center">
                      <img
                        src={`https://s2.coinmarketcap.com/static/img/coins/64x64/${item.coinId}.png`}
                        alt={item.coinSymbol}
                        className="h-10 w-10 object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          const parent = target.parentElement;
                          if (parent) {
                            parent.innerHTML = item.coinSymbol.substring(0, 3);
                            parent.classList.add('flex', 'items-center', 'justify-center', 'bg-gray-200', 'text-gray-600', 'font-bold');
                          }
                        }}
                      />
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">{item.coinName}</div>
                      <div className="text-sm text-gray-500">{item.coinSymbol}</div>
                    </div>
                  </div>
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                  {item.percentage.toFixed(1)}%
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                  {formatCryptoPrice(item.priceUsd)}
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm">
                  <span className={item.priceChange24h >= 0 ? 'text-green-600' : 'text-red-600'}>
                    {item.priceChange24h >= 0 ? '+' : ''}{item.priceChange24h.toFixed(2)}%
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="bg-indigo-50 p-4 rounded-lg mt-6">
        <h3 className="text-lg font-medium text-indigo-800">Portfolio Analysis</h3>
        <p className="text-indigo-600 mt-1">
          Our team is currently overweight on Bitcoin and Solana due to strong technical signals and increasing institutional adoption. We expect a market correction in Q3 but remain bullish on the long-term outlook.
        </p>
      </div>
    </div>
  );
} 