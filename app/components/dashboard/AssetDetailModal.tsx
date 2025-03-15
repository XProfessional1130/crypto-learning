import { useState, useEffect } from 'react';
import { PortfolioItemWithPrice } from '@/types/portfolio';
import { usePortfolio } from '@/lib/hooks/usePortfolio';
import { ModalSkeleton } from '../ui/ModalSkeleton';
import ErrorDisplay from '@/components/ErrorDisplay';
import { logger } from '@/lib/utils/logger';

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
  const [localAsset, setLocalAsset] = useState<PortfolioItemWithPrice | null>(asset);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Update amount and local asset when asset changes
  useEffect(() => {
    if (asset) {
      setAmount(asset.amount);
      setLocalAsset(asset);
      setIsEditing(false);
    }
  }, [asset]);
  
  const handleUpdateAmount = async () => {
    if (!localAsset || amount <= 0) return;
    
    setIsProcessing(true);
    setError(null);
    
    try {
      await updateAmount(localAsset.id, amount);
      logger.info('Updated asset amount', { assetId: localAsset.id, newAmount: amount });
      
      // Update local state
      setLocalAsset({
        ...localAsset,
        amount: amount
      });
      
      // Exit editing mode
      setIsEditing(false);
      
      // Refresh portfolio data
      refreshPortfolio();
    } catch (err) {
      logger.error('Error updating asset amount', { error: err, assetId: localAsset.id });
      setError('Failed to update asset amount. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };
  
  const handleDeleteAsset = async () => {
    if (!localAsset) return;
    
    setIsProcessing(true);
    setError(null);
    
    try {
      await removeCoin(localAsset.id);
      logger.info('Removed asset from portfolio', { assetId: localAsset.id });
      
      // Close the modal
      onClose();
      
      // Refresh portfolio data
      refreshPortfolio();
    } catch (err) {
      logger.error('Error removing asset', { error: err, assetId: localAsset.id });
      setError('Failed to remove asset. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 bg-black/50" onClick={onClose}></div>
      
      <div className="relative min-h-screen flex items-center justify-center p-4">
        <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full">
          <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold">Asset Details</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <div className="p-6">
            {error && (
              <div className="mb-4">
                <ErrorDisplay 
                  message={error} 
                  onRetry={() => setError(null)} 
                />
              </div>
            )}

            {loading ? (
              <ModalSkeleton 
                headerHeight={30}
                contentItems={6}
                footerHeight={40}
              />
            ) : localAsset ? (
              <>
                {/* Header with Asset Info and Close Button */}
                <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700">
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
                    <div>
                      <h2 className="text-lg font-semibold">{localAsset.coinName} <span className="text-gray-500 text-sm">({localAsset.coinSymbol})</span></h2>
                      <div className={`text-sm ${
                        localAsset.priceChange24h >= 0 
                          ? 'text-green-600 dark:text-green-400' 
                          : 'text-red-600 dark:text-red-400'
                      }`}>
                        {formatCryptoPrice(localAsset.priceUsd)} <span>{localAsset.priceChange24h >= 0 ? '+' : ''}{localAsset.priceChange24h.toFixed(2)}% (24h)</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Market Info Section - Always visible, generic information */}
                <div className="px-4 py-3 bg-gray-50 dark:bg-gray-750 border-b border-gray-200 dark:border-gray-700">
                  <div className="grid grid-cols-2 gap-4">
                    {localAsset.marketCap > 0 && (
                      <div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">Market Cap</div>
                        <div className="text-sm font-medium">
                          {formatMarketCap(localAsset.marketCap)}
                        </div>
                      </div>
                    )}
                    <div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">Portfolio %</div>
                      <div className="text-sm font-medium">{localAsset.percentage.toFixed(2)}%</div>
                    </div>
                  </div>
                </div>
                
                {/* Content */}
                <div className="p-4 space-y-4">
                  {/* Your Holdings Section */}
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                    <div className="flex justify-between items-center mb-3">
                      <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Your Holdings</h3>
                      <button 
                        onClick={() => setIsEditing(!isEditing)}
                        className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                      >
                        {isEditing ? 'Cancel' : 'Edit'}
                      </button>
                    </div>
                    
                    {!isEditing ? (
                      /* Display Mode */
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">Amount</div>
                          <div className="text-base font-medium">
                            {localAsset.amount.toLocaleString(undefined, { maximumFractionDigits: 6 })}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">Value</div>
                          <div className="text-base font-medium">
                            {formatCryptoPrice(localAsset.valueUsd)}
                          </div>
                        </div>
                      </div>
                    ) : (
                      /* Edit Mode */
                      <div>
                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
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
                          className="w-full px-3 py-2 text-sm border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white mb-2"
                        />
                        
                        {amount > 0 && (
                          <div className="text-xs text-gray-600 dark:text-gray-400 mb-3">
                            Value: {formatCryptoPrice(amount * localAsset.priceUsd)}
                          </div>
                        )}
                        
                        <button
                          onClick={handleUpdateAmount}
                          disabled={amount <= 0 || isProcessing}
                          className={`w-full py-1.5 text-sm bg-blue-500 text-white rounded-lg transition-colors ${
                            amount <= 0 || isProcessing ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-600'
                          }`}
                        >
                          {isProcessing ? 'Updating...' : 'Update Amount'}
                        </button>
                      </div>
                    )}
                  </div>
                  
                  {/* Delete Asset Section */}
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
                      Remove this asset from your portfolio?
                    </p>
                    <button
                      onClick={handleDeleteAsset}
                      disabled={isProcessing}
                      className={`w-full py-1.5 text-sm bg-red-500 text-white rounded-lg transition-colors ${
                        isProcessing ? 'opacity-50 cursor-not-allowed' : 'hover:bg-red-600'
                      }`}
                    >
                      {isProcessing ? 'Processing...' : 'Delete Asset'}
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-6">
                <p className="text-gray-500 dark:text-gray-400">Asset information not available</p>
              </div>
            )}
          </div>
          
          {/* Footer */}
          <div className="flex justify-end p-3 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={onClose}
              className="px-4 py-1.5 text-sm text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 