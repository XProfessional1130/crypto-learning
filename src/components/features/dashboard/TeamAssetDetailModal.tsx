import { useState, useEffect } from 'react';
import { PortfolioItemWithPrice } from '@/types/portfolio';
import ModalContent from '@/components/ui/ModalContent';

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

interface TeamAssetDetailModalProps {
  onClose: () => void;
  asset: PortfolioItemWithPrice | null;
  onUpdate?: (amount: number) => Promise<{success: boolean}>;
  onDelete?: () => Promise<{success: boolean}>;
}

export default function TeamAssetDetailModal({ 
  onClose, 
  asset,
  onUpdate,
  onDelete
}: TeamAssetDetailModalProps) {
  const [localAsset, setLocalAsset] = useState<PortfolioItemWithPrice | null>(null);
  const [newAmount, setNewAmount] = useState<number>(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  // Update local state when asset prop changes
  useEffect(() => {
    if (asset) {
      setLocalAsset(asset);
      setNewAmount(asset.amount);
    }
  }, [asset]);
  
  const handleUpdateAmount = async () => {
    if (!localAsset || !onUpdate) return;
    
    setIsProcessing(true);
    try {
      const result = await onUpdate(newAmount);
      
      if (result.success) {
        // Update only the local state to avoid a full refetch
        setLocalAsset(prev => prev ? { ...prev, amount: newAmount } : null);
        setIsEditing(false);
      }
    } catch (error) {
      console.error('Error updating asset:', error);
    } finally {
      setIsProcessing(false);
    }
  };
  
  const handleDeleteAsset = async () => {
    if (!onDelete) return;
    
    setIsProcessing(true);
    try {
      const result = await onDelete();
      
      if (result.success) {
        onClose();
      }
    } catch (error) {
      console.error('Error removing asset:', error);
    } finally {
      setIsProcessing(false);
    }
  };
  
  if (!localAsset) return null;
  
  return (
    <ModalContent title={localAsset.coinName} onClose={onClose}>
      <div className="space-y-6">
        {/* Asset Header with Icon and Price */}
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center overflow-hidden">
            <img
              src={`https://s2.coinmarketcap.com/static/img/coins/64x64/${localAsset.coinId}.png`}
              alt={localAsset.coinSymbol}
              className="w-full h-full object-cover"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                (target.parentElement as HTMLElement).textContent = localAsset.coinSymbol.substring(0, 3);
              }}
            />
          </div>
          <div>
            <div className="text-2xl font-bold">{formatCryptoPrice(localAsset.priceUsd)}</div>
            <div className={`text-sm ${localAsset.priceChange24h >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {localAsset.priceChange24h >= 0 ? '↑' : '↓'} {Math.abs(localAsset.priceChange24h).toFixed(2)}% (24h)
            </div>
          </div>
        </div>
        
        {/* Asset Details Table */}
        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg overflow-hidden border border-gray-100 dark:border-gray-700">
          <div className="grid grid-cols-2 gap-2 p-4">
            <div className="space-y-1">
              <div className="text-sm text-gray-500 dark:text-gray-400">Symbol</div>
              <div className="font-medium">{localAsset.coinSymbol}</div>
            </div>
            
            <div className="space-y-1">
              <div className="text-sm text-gray-500 dark:text-gray-400">Market Cap</div>
              <div className="font-medium">{formatMarketCap(localAsset.marketCap)}</div>
            </div>
            
            <div className="space-y-1 col-span-2">
              <div className="text-sm text-gray-500 dark:text-gray-400">Your Holdings</div>
              {isEditing ? (
                <div className="flex items-center space-x-2">
                  <input
                    type="number"
                    value={newAmount === 0 ? '' : newAmount}
                    onChange={(e) => setNewAmount(parseFloat(e.target.value) || 0)}
                    placeholder="Enter amount..."
                    min="0"
                    step="0.000001"
                    className="w-full p-2 border border-gray-200 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              ) : (
                <div className="font-medium">{localAsset.amount.toLocaleString(undefined, { maximumFractionDigits: 8 })} {localAsset.coinSymbol}</div>
              )}
            </div>
            
            <div className="space-y-1 col-span-2">
              <div className="text-sm text-gray-500 dark:text-gray-400">Value</div>
              <div className="font-medium">
                ${localAsset.valueUsd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>
          </div>
        </div>
        
        {/* Action Buttons */}
        {!showDeleteConfirm ? (
          <div className="flex space-x-3">
            {isEditing ? (
              <>
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setNewAmount(localAsset.amount); // Reset to original
                  }}
                  className="flex-1 px-4 py-2 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdateAmount}
                  disabled={isProcessing || newAmount <= 0 || newAmount === localAsset.amount || !onUpdate}
                  className="flex-1 px-4 py-2 bg-brand-500 text-white rounded-md hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isProcessing ? 'Saving...' : 'Save Amount'}
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="flex-1 px-4 py-2 border border-red-300 dark:border-red-700 text-red-600 dark:text-red-400 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20"
                  disabled={!onDelete}
                >
                  Delete
                </button>
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex-1 px-4 py-2 bg-brand-500 text-white rounded-md hover:bg-brand-600"
                  disabled={!onUpdate}
                >
                  Edit Amount
                </button>
              </>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="p-3 bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-md">
              Are you sure you want to delete this asset from the portfolio?
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 px-4 py-2 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAsset}
                disabled={isProcessing || !onDelete}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isProcessing ? 'Deleting...' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        )}
      </div>
    </ModalContent>
  );
} 