import { useMemo, useState } from 'react';
import { PortfolioItemWithPrice, CoinData } from '@/types/portfolio';
import { GlobalData } from '@/lib/services/coinmarketcap';
import { useTeamPortfolio } from '@/lib/hooks/useTeamPortfolio';
import { PlusCircle, Edit2, Trash } from 'lucide-react';
import TeamAddCoinModal from './TeamAddCoinModal';
import TeamAssetDetailModal from './TeamAssetDetailModal';

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
  const { isAdmin, addCoin, updateAmount, removeCoin, refreshPortfolio } = useTeamPortfolio();
  const [showAddCoinModal, setShowAddCoinModal] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<PortfolioItemWithPrice | null>(null);
  const [showAssetDetailModal, setShowAssetDetailModal] = useState(false);

  // Create a sorted version of the portfolio items
  const sortedPortfolioItems = useMemo(() => {
    if (!portfolio || !portfolio.items) return [];
    
    // Return a new sorted array by valueUsd (descending)
    return [...portfolio.items].sort((a, b) => b.valueUsd - a.valueUsd);
  }, [portfolio]);

  // Handle add coin to portfolio
  const handleAddCoin = async (coin: CoinData, amount: number) => {
    try {
      await addCoin(coin, amount);
      setShowAddCoinModal(false);
      refreshPortfolio(true);
    } catch (error) {
      console.error('Error adding coin to team portfolio:', error);
    }
  };

  // Handle opening asset detail modal for editing
  const handleSelectAsset = (asset: PortfolioItemWithPrice) => {
    setSelectedAsset(asset);
    setShowAssetDetailModal(true);
  };

  // Custom handlers for TeamPortfolio asset operations
  const handleUpdateAmount = async (assetId: string, newAmount: number) => {
    try {
      await updateAmount(assetId, newAmount);
      setShowAssetDetailModal(false);
      refreshPortfolio(true);
      return { success: true };
    } catch (error) {
      console.error('Error updating asset amount:', error);
      return { success: false };
    }
  };

  const handleDeleteAsset = async (assetId: string) => {
    try {
      await removeCoin(assetId);
      setShowAssetDetailModal(false);
      refreshPortfolio(true);
      return { success: true };
    } catch (error) {
      console.error('Error removing asset:', error);
      return { success: false };
    }
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
        Error loading portfolio data. Please try again later.
      </div>
    );
  }

  if (!portfolio || portfolio.items.length === 0) {
    return (
      <div className="rounded-lg bg-blue-50 p-4 text-blue-600">
        <p className="mb-2 font-semibold">No assets in the team portfolio yet.</p>
        {isAdmin ? (
          <div className="mt-4">
            <button 
              onClick={() => setShowAddCoinModal(true)}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded flex items-center"
            >
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Asset to Team Portfolio
            </button>
            {showAddCoinModal && (
              <TeamAddCoinModal
                isOpen={showAddCoinModal}
                onClose={() => setShowAddCoinModal(false)}
                onCoinAdded={handleAddCoin}
              />
            )}
          </div>
        ) : (
          <p className="text-sm">
            The team portfolio is managed by the admin. Currently, no assets have been added.
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
            onClick={() => setShowAddCoinModal(true)}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded flex items-center"
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
                Allocation
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Current Price
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                24h Change
              </th>
              {isAdmin && (
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {sortedPortfolioItems.map((item: PortfolioItemWithPrice) => (
              <tr key={item.id} className={isAdmin ? "cursor-pointer hover:bg-gray-50" : ""} onClick={isAdmin ? () => handleSelectAsset(item) : undefined}>
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
                {isAdmin && (
                  <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium" onClick={(e) => e.stopPropagation()}>
                    <button 
                      className="text-indigo-600 hover:text-indigo-900 mr-3"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelectAsset(item);
                      }}
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button 
                      className="text-red-600 hover:text-red-900"
                      onClick={async (e) => {
                        e.stopPropagation();
                        if (window.confirm(`Remove ${item.coinName} from the team portfolio?`)) {
                          await removeCoin(item.id);
                          refreshPortfolio(true);
                        }
                      }}
                    >
                      <Trash className="h-4 w-4" />
                    </button>
                  </td>
                )}
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

      {/* Add Coin Modal - Only shown when admin clicks Add Asset button */}
      {showAddCoinModal && (
        <TeamAddCoinModal
          isOpen={showAddCoinModal}
          onClose={() => setShowAddCoinModal(false)}
          onCoinAdded={handleAddCoin}
        />
      )}

      {/* Asset Detail Modal - Only shown when admin clicks on an asset */}
      {showAssetDetailModal && selectedAsset && (
        <TeamAssetDetailModal
          isOpen={showAssetDetailModal}
          onClose={() => setShowAssetDetailModal(false)}
          asset={selectedAsset}
          onUpdate={(amount) => handleUpdateAmount(selectedAsset.id, amount)}
          onDelete={() => handleDeleteAsset(selectedAsset.id)}
        />
      )}
    </div>
  );
} 