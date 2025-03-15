import { useMemo, useState } from 'react';
import { useTeamPortfolio } from '@/lib/hooks/useTeamPortfolio';
import { PortfolioItemWithPrice } from '@/types/portfolio';
import { CoinData } from '@/types/portfolio';
import { PlusCircle, Edit2, Trash2 } from 'lucide-react';
import TeamAddCoinModal from './TeamAddCoinModal';
import TeamAssetDetailModal from './TeamAssetDetailModal';
import { GlobalData } from '@/lib/services/coinmarketcap';
import { formatLargeNumber, formatPercentage } from '@/lib/utils/formatters';

// Local formatCryptoPrice function
const formatCryptoPrice = (price: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(price);
};

// Memoized Portfolio Item component
const PortfolioItem = ({ item, onItemClick, totalPortfolioValue, isAdmin }: {
  item: PortfolioItemWithPrice;
  onItemClick: (item: PortfolioItemWithPrice) => void;
  totalPortfolioValue: number;
  isAdmin: boolean;
}) => {
  // Calculate percentage of total portfolio
  const portfolioPercentage = totalPortfolioValue > 0 
    ? (item.valueUsd / totalPortfolioValue) * 100 
    : 0;

  return (
    <div
      onClick={() => isAdmin && onItemClick(item)}
      className={`flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-700 ${isAdmin ? 'hover:bg-gray-100 dark:hover:bg-gray-700/70 cursor-pointer' : ''} transition-colors`}
    >
      <div className="flex items-center">
        <div className="w-8 h-8 mr-3 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-xs font-bold overflow-hidden">
          <img
            src={`https://s2.coinmarketcap.com/static/img/coins/64x64/${item.coinId}.png`}
            alt={item.coinSymbol}
            className="w-full h-full object-cover"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
              const parent = target.parentElement;
              if (parent) {
                parent.innerHTML = item.coinSymbol.substring(0, 3);
                parent.classList.add('flex', 'items-center', 'justify-center', 'bg-gray-200', 'dark:bg-gray-600', 'text-gray-600', 'dark:text-gray-300', 'font-bold');
              }
            }}
          />
        </div>
        <div>
          <p className="font-medium text-gray-900 dark:text-white">{item.coinName}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">{item.coinSymbol}</p>
        </div>
      </div>
      <div className="text-right">
        <p className="font-medium">${item.valueUsd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
        <div className="flex items-center justify-end space-x-2">
          <p className={`text-sm ${item.priceChange24h >= 0 ? 'text-green-500' : 'text-red-500'}`}>
            {item.priceChange24h >= 0 ? '+' : ''}{item.priceChange24h.toFixed(2)}%
          </p>
          <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
            <svg className="w-3.5 h-3.5 mr-0.5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12,2L4,6.5v11L12,22l8-4.5v-11L12,2z M12,4.311l6,3.375v8.627l-6,3.375l-6-3.375V7.686L12,4.311z" />
              <path d="M12,6.5L7,9.25v5.5L12,17.5l5-2.75v-5.5L12,6.5z M12,8.122l3,1.65v3.456l-3,1.65l-3-1.65V9.772L12,8.122z" />
            </svg>
            {portfolioPercentage.toFixed(1)}%
          </div>
        </div>
      </div>
    </div>
  );
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

  // The delete handler wrapped to match the expected interface (no arguments)
  const handleDelete = async () => {
    if (!selectedAsset) return { success: false };
    
    try {
      await removeCoin(selectedAsset.id);
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
          <div key={i} className="h-16 animate-pulse rounded bg-gray-200 dark:bg-gray-700"></div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg bg-red-50 dark:bg-red-900/20 p-4 text-red-600 dark:text-red-400">
        <p>Error loading portfolio data. Please try again later.</p>
        <button 
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          onClick={() => refreshPortfolio(true)}
        >
          Try Again
        </button>
      </div>
    );
  }

  if (!portfolio || portfolio.items.length === 0) {
    return (
      <div className="rounded-lg bg-blue-50 dark:bg-blue-900/20 p-4 text-blue-600 dark:text-blue-400">
        <p className="mb-2 font-semibold">No assets in the team portfolio yet.</p>
        {isAdmin ? (
          <div className="mt-4">
            <button 
              onClick={() => setShowAddCoinModal(true)}
              className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition-colors flex items-center"
            >
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Asset to Team Portfolio
            </button>
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
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-gray-800 dark:text-white">Team Portfolio</h2>
        {isAdmin && (
          <button 
            onClick={() => setShowAddCoinModal(true)}
            className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition-colors flex items-center"
          >
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Asset
          </button>
        )}
      </div>
      
      <div className="overflow-y-auto h-[calc(100vh-32rem)] scrollbar-thin">
        {sortedPortfolioItems.map((item) => (
          <PortfolioItem 
            key={item.id} 
            item={item} 
            onItemClick={handleSelectAsset} 
            totalPortfolioValue={portfolio.totalValueUsd} 
            isAdmin={isAdmin}
          />
        ))}
      </div>

      <div className="mt-6 bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
        <h3 className="text-sm font-medium text-blue-800 dark:text-blue-300">Portfolio Analysis</h3>
        <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
          This portfolio represents the collective recommendations of our expert analysts. Assets are carefully selected based on thorough research, technical analysis, and fundamental value propositions.
        </p>
      </div>

      {/* Add Coin Modal */}
      {showAddCoinModal && (
        <TeamAddCoinModal
          isOpen={showAddCoinModal}
          onClose={() => setShowAddCoinModal(false)}
          onCoinAdded={handleAddCoin}
        />
      )}
      
      {/* Asset Detail Modal */}
      {showAssetDetailModal && selectedAsset && (
        <TeamAssetDetailModal
          isOpen={showAssetDetailModal}
          onClose={() => setShowAssetDetailModal(false)}
          asset={selectedAsset}
          onUpdate={(amount) => handleUpdateAmount(selectedAsset.id, amount)}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
} 