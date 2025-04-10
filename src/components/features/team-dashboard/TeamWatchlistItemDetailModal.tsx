import { useState, useEffect } from 'react';
import { WatchlistItem } from '@/lib/api/team-watchlist';
import ModalContent from '../modals/ModalContent';

interface TeamWatchlistItemDetailModalProps {
  onClose: () => void;
  item: WatchlistItem | null;
  onUpdatePriceTarget?: (priceTarget: number) => Promise<void>;
  onRemove?: () => Promise<void>;
  getTargetPercentage?: (item: WatchlistItem) => number;
}

export default function TeamWatchlistItemDetailModal({ 
  onClose, 
  item, 
  onUpdatePriceTarget, 
  onRemove,
  getTargetPercentage 
}: TeamWatchlistItemDetailModalProps) {
  const [priceTarget, setPriceTarget] = useState<number>(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [tab, setTab] = useState<'details' | 'edit'>('details');
  const [localItem, setLocalItem] = useState<WatchlistItem | null>(item);

  useEffect(() => {
    if (item) {
      setPriceTarget(item.priceTarget || 0);
      setLocalItem(item);
    }
  }, [item]);
  
  const calculateProgressPercentage = (currentPrice: number, targetPrice: number): number => {
    if (!targetPrice || currentPrice === targetPrice) return 100;
    
    if (targetPrice > currentPrice) {
      return Math.min(100, Math.max(0, (currentPrice / targetPrice) * 100));
    } 
    else {
      return Math.min(100, Math.max(0, (targetPrice / currentPrice) * 100));
    }
  };
  
  const handleUpdateTarget = async () => {
    if (!item || priceTarget <= 0) return;
    
    setIsProcessing(true);
    try {
      if (onUpdatePriceTarget) {
        await onUpdatePriceTarget(priceTarget);
      }
    } catch (error) {
      console.error('Error updating price target:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRemoveItem = async () => {
    if (!item) return;
    
    setIsProcessing(true);
    try {
      if (onRemove) {
        await onRemove();
      }
    } catch (error) {
      console.error('Error removing item from watchlist:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const formatCryptoPrice = (price: number): string => {
    if (!price) return '$---';
  
    if (price >= 1) {
      return `$${Math.round(price).toLocaleString()}`;
    } else if (price >= 0.01) {
      return `$${price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    } else if (price >= 0.0001) {
      return `$${price.toLocaleString(undefined, { minimumFractionDigits: 4, maximumFractionDigits: 4 })}`;
    } else {
      return `< $0.0001`;
    }
  };
  
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

  const calculateTargetPercentage = (item: WatchlistItem): number => {
    if (getTargetPercentage) {
      return getTargetPercentage(item);
    }
    
    if (!item || !item.priceTarget || !item.price) return 0;
    return ((item.priceTarget - item.price) / item.price) * 100;
  };

  if (!localItem) return null;
  
  // Calculate if target is higher than current price
  const isTargetHigher = localItem.priceTarget && localItem.priceTarget > localItem.price;
  const targetPercentage = calculateTargetPercentage(localItem);

  return (
    <ModalContent title="Watchlist Asset Details" onClose={onClose}>
      {/* Header with Asset Info */}
      <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700 mb-4">
        <div className="flex items-center">
          <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center mr-3 overflow-hidden">
            <img 
              src={`https://s2.coinmarketcap.com/static/img/coins/64x64/${localItem.coinId}.png`}
              alt={localItem.symbol}
              className="w-full h-full object-cover"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                const parent = target.parentElement;
                if (parent) {
                  parent.innerHTML = localItem.symbol.substring(0, 3);
                }
              }}
            />
          </div>
          <div>
            <h2 className="text-lg font-semibold">{localItem.name} <span className="text-gray-500 text-sm">({localItem.symbol})</span></h2>
            <div className={`text-sm ${
              localItem.change24h >= 0 
                ? 'text-green-600 dark:text-green-400' 
                : 'text-red-600 dark:text-red-400'
            }`}>
              {formatCryptoPrice(localItem.price)} <span>{localItem.change24h >= 0 ? '+' : ''}{localItem.change24h.toFixed(2)}% (24h)</span>
            </div>
          </div>
        </div>
      </div>
                
      {/* Tabs Navigation */}
      <div className="flex border-b border-gray-200 dark:border-gray-700">
        <button
          className={`flex-1 py-3 text-center ${
            tab === 'details' 
              ? 'text-teal-600 dark:text-teal-400 border-b-2 border-teal-600 dark:border-teal-400' 
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
          onClick={() => setTab('details')}
        >
          Details
        </button>
        <button
          className={`flex-1 py-3 text-center ${
            tab === 'edit' 
              ? 'text-teal-600 dark:text-teal-400 border-b-2 border-teal-600 dark:border-teal-400' 
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
          onClick={() => setTab('edit')}
        >
          Edit/Remove
        </button>
      </div>
                
      {/* Content Based on Tab */}
      <div className="p-4 space-y-4">
        {tab === 'details' ? (
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Current Price</h3>
                <div className="text-xl font-bold">
                  {formatCryptoPrice(localItem.price)}
                </div>
              </div>
              
              {localItem.priceTarget && (
                <>
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Target Price</h3>
                    <div className="text-xl font-bold">
                      {formatCryptoPrice(localItem.priceTarget)}
                    </div>
                  </div>
                  
                  <div className="mt-4">
                    <div className="flex justify-between items-center mb-2">
                      <div className="text-xs text-gray-500 dark:text-gray-400">Progress to target</div>
                      <div className={`text-sm font-medium ${
                        isTargetHigher ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                      }`}>
                        {Math.round(calculateProgressPercentage(localItem.price, localItem.priceTarget))}%
                      </div>
                    </div>
                    
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                      <div 
                        className={`h-2 rounded-full ${isTargetHigher ? 'bg-green-500' : 'bg-red-500'}`}
                        style={{ width: `${calculateProgressPercentage(localItem.price, localItem.priceTarget)}%` }}
                      ></div>
                    </div>
                    
                    <div className="flex justify-end mt-3">
                      <span className={`text-sm font-medium px-2 py-0.5 rounded-full ${
                        isTargetHigher
                          ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400' 
                          : 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
                      }`}>
                        {Math.abs(targetPercentage).toFixed(2)}% {isTargetHigher ? 'upside' : 'downside'}
                      </span>
                    </div>
                  </div>
                </>
              )}
            </div>
            
            <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">Added on</span>
                <span className="font-medium">
                  {localItem.createdAt 
                    ? new Date(localItem.createdAt).toLocaleDateString() 
                    : 'Unknown date'}
                </span>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <a 
                href={`https://coinmarketcap.com/currencies/${localItem.name.toLowerCase().replace(/\s+/g, '-')}`} 
                target="_blank"
                rel="noopener noreferrer"
                className="text-center p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors"
              >
                <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">View on</div>
                <div className="font-medium text-teal-600 dark:text-teal-400">CoinMarketCap</div>
              </a>
              <a 
                href={`https://www.tradingview.com/symbols/${localItem.symbol}USD`} 
                target="_blank"
                rel="noopener noreferrer"
                className="text-center p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors"
              >
                <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">View</div>
                <div className="font-medium text-teal-600 dark:text-teal-400">Price Chart</div>
              </a>
            </div>
            
            <button
              onClick={() => setTab('edit')}
              className="w-full py-2 text-teal-600 hover:text-teal-700 border border-teal-600 hover:border-teal-700 rounded-lg transition-colors"
            >
              {localItem.priceTarget ? 'Update Price Target' : 'Set Price Target'}
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Set Price Target</h3>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 sm:text-sm">$</span>
                </div>
                <input
                  type="number"
                  min="0"
                  step="0.00000001"
                  value={priceTarget || ''}
                  onChange={(e) => setPriceTarget(parseFloat(e.target.value) || 0)}
                  className="pl-7 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-teal-500 focus:ring-teal-500"
                  placeholder="Enter price target"
                />
              </div>
              <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                Current price: {formatCryptoPrice(localItem.price)}
              </p>
              
              <div className="mt-4 flex justify-end">
                <button
                  onClick={handleUpdateTarget}
                  disabled={isProcessing || priceTarget <= 0}
                  className={`px-4 py-2 rounded-lg ${
                    isProcessing || priceTarget <= 0
                      ? 'bg-gray-300 dark:bg-gray-600 cursor-not-allowed'
                      : 'bg-teal-600 hover:bg-teal-700 text-white'
                  } ml-2`}
                >
                  {isProcessing ? 'Updating...' : 'Update Target'}
                </button>
              </div>
            </div>
            
            <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4 border border-red-200 dark:border-red-700/30">
              <h3 className="text-sm font-medium text-red-800 dark:text-red-300 mb-2">Remove from Watchlist</h3>
              <p className="text-xs text-red-600 dark:text-red-400 mb-4">
                This will permanently remove {localItem.name} from the team watchlist.
              </p>
              <div className="flex justify-end">
                <button
                  onClick={handleRemoveItem}
                  disabled={isProcessing}
                  className={`px-4 py-2 rounded-lg ${
                    isProcessing
                      ? 'bg-gray-300 dark:bg-gray-600 cursor-not-allowed'
                      : 'bg-red-600 hover:bg-red-700 text-white'
                  }`}
                >
                  {isProcessing ? 'Removing...' : 'Remove'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </ModalContent>
  );
}