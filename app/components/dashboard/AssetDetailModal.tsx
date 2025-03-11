import { useState, useEffect } from 'react';
import { PortfolioItemWithPrice } from '@/types/portfolio';
import { usePortfolio } from '@/lib/hooks/usePortfolio';

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

// Function to format market cap with T/B/M suffixes
const formatMarketCap = (marketCap: number): string => {
  if (!marketCap) return '$---';
  
  if (marketCap >= 1_000_000_000_000) {
    return `$${(marketCap / 1_000_000_000_000).toFixed(2)}T`;
  } else if (marketCap >= 1_000_000_000) {
    return `$${(marketCap / 1_000_000_000).toFixed(2)}B`;
  } else if (marketCap >= 1_000_000) {
    return `$${(marketCap / 1_000_000).toFixed(2)}M`;
  } else {
    return `$${marketCap.toLocaleString()}`;
  }
};

interface AssetDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  asset: PortfolioItemWithPrice | null;
}

export default function AssetDetailModal({ isOpen, onClose, asset }: AssetDetailModalProps) {
  const { updateAmount, removeCoin, refreshPortfolio } = usePortfolio();
  const [amount, setAmount] = useState<number>(asset?.amount || 0);
  const [isEditing, setIsEditing] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [tab, setTab] = useState<'details' | 'edit'>('details');
  const [localAsset, setLocalAsset] = useState<PortfolioItemWithPrice | null>(asset);

  // Update amount and local asset when asset changes
  useEffect(() => {
    if (asset) {
      setAmount(asset.amount);
      setLocalAsset(asset);
    }
  }, [asset]);
  
  const handleUpdateAmount = async () => {
    if (!asset || amount <= 0) return;
    
    setIsProcessing(true);
    try {
      const result = await updateAmount(asset.id, amount);
      if (result.success) {
        // Update the local asset state with the new amount and calculated value
        if (localAsset) {
          const updatedAsset = {
            ...localAsset,
            amount: amount,
            valueUsd: amount * localAsset.priceUsd,
            valueBtc: amount * localAsset.priceBtc
          };
          setLocalAsset(updatedAsset);
        }
        
        // Refresh portfolio data in the background
        refreshPortfolio();
        
        setIsEditing(false);
        setTab('details');
      }
    } catch (error) {
      console.error('Error updating amount:', error);
    } finally {
      setIsProcessing(false);
    }
  };
  
  const handleDeleteAsset = async () => {
    if (!asset) return;
    
    setIsProcessing(true);
    try {
      const result = await removeCoin(asset.id);
      if (result.success) {
        onClose();
      }
    } catch (error) {
      console.error('Error removing asset:', error);
    } finally {
      setIsProcessing(false);
    }
  };
  
  if (!isOpen || !localAsset) return null;
  
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 bg-black/50" onClick={onClose}></div>
      
      <div className="relative min-h-screen flex items-center justify-center p-4">
        <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full">
          <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center mr-3 overflow-hidden">
                <img 
                  src={`https://s2.coinmarketcap.com/static/img/coins/64x64/${localAsset.coinId}.png`}
                  alt={localAsset.coinSymbol}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    const parent = target.parentElement;
                    if (parent) {
                      parent.innerHTML = localAsset.coinSymbol.substring(0, 3);
                    }
                  }}
                />
              </div>
              <h2 className="text-xl font-semibold">{localAsset.coinName} ({localAsset.coinSymbol})</h2>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          {/* Tabs */}
          <div className="flex border-b border-gray-200 dark:border-gray-700">
            <button
              className={`flex-1 py-3 text-center ${
                tab === 'details' 
                  ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400' 
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
              onClick={() => setTab('details')}
            >
              Details
            </button>
            <button
              className={`flex-1 py-3 text-center ${
                tab === 'edit' 
                  ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400' 
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
              onClick={() => setTab('edit')}
            >
              Edit/Remove
            </button>
          </div>
          
          {/* Content */}
          <div className="p-6">
            {tab === 'details' ? (
              <div className="space-y-4">
                <div>
                  <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Current Price</div>
                  <div className="text-2xl font-bold">
                    {formatCryptoPrice(localAsset.priceUsd)}
                  </div>
                  <div className={`text-sm font-medium ${
                    localAsset.priceChange24h >= 0 
                      ? 'text-green-600 dark:text-green-400' 
                      : 'text-red-600 dark:text-red-400'
                  }`}>
                    {localAsset.priceChange24h >= 0 ? '+' : ''}{localAsset.priceChange24h.toFixed(2)}% (24h)
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Amount</div>
                    <div className="text-lg font-medium">
                      {localAsset.amount.toLocaleString(undefined, { maximumFractionDigits: 6 })}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Value</div>
                    <div className="text-lg font-medium">
                      {formatCryptoPrice(localAsset.valueUsd)}
                    </div>
                  </div>
                </div>
                
                <div>
                  <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Portfolio %</div>
                  <div className="text-lg font-medium">{localAsset.percentage.toFixed(2)}%</div>
                </div>
                
                {localAsset.marketCap > 0 && (
                  <div>
                    <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Market Cap</div>
                    <div className="text-lg font-medium">
                      {formatMarketCap(localAsset.marketCap)}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Amount
                  </label>
                  <input
                    type="number"
                    value={amount || ''}
                    onChange={(e) => {
                      const value = e.target.value;
                      setAmount(value ? parseFloat(value) : 0);
                    }}
                    min={0.000001}
                    step={0.000001}
                    placeholder="Enter amount"
                    className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>
                
                {amount > 0 && (
                  <div className="text-sm">
                    Value: {formatCryptoPrice(amount * localAsset.priceUsd)}
                  </div>
                )}
                
                <div className="flex gap-3">
                  <button
                    onClick={handleUpdateAmount}
                    disabled={amount <= 0 || isProcessing}
                    className={`flex-1 py-2 bg-blue-500 text-white rounded-lg transition-colors ${
                      amount <= 0 || isProcessing ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-600'
                    }`}
                  >
                    {isProcessing ? 'Updating...' : 'Update Amount'}
                  </button>
                </div>
                
                <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4">
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                    Remove this asset from your portfolio?
                  </p>
                  <button
                    onClick={handleDeleteAsset}
                    disabled={isProcessing}
                    className={`w-full py-2 bg-red-500 text-white rounded-lg transition-colors ${
                      isProcessing ? 'opacity-50 cursor-not-allowed' : 'hover:bg-red-600'
                    }`}
                  >
                    {isProcessing ? 'Processing...' : 'Delete Asset'}
                  </button>
                </div>
              </div>
            )}
          </div>
          
          <div className="flex justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 