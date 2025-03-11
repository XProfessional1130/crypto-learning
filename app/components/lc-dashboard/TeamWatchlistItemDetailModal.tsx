import { useState, useEffect } from 'react';
import { useTeamWatchlist } from '@/lib/hooks/useTeamWatchlist';
import { WatchlistItem } from '@/lib/hooks/useWatchlist';

interface TeamWatchlistItemDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: WatchlistItem | null;
  onUpdatePriceTarget?: (priceTarget: number) => Promise<void>;
  onRemove?: () => Promise<void>;
}

export default function TeamWatchlistItemDetailModal({ 
  isOpen, 
  onClose, 
  item, 
  onUpdatePriceTarget, 
  onRemove 
}: TeamWatchlistItemDetailModalProps) {
  const { updatePriceTarget, removeFromWatchlist, getTargetPercentage } = useTeamWatchlist();
  const [priceTarget, setPriceTarget] = useState<number>(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [tab, setTab] = useState<'details' | 'edit'>('details');
  const [localItem, setLocalItem] = useState<WatchlistItem | null>(item);

  // Update price target and local item when item changes
  useEffect(() => {
    if (item) {
      setPriceTarget(item.priceTarget || 0);
      setLocalItem(item);
    }
  }, [item]);
  
  // Calculate progress percentage toward target (for progress bar)
  const calculateProgressPercentage = (currentPrice: number, targetPrice: number): number => {
    if (!targetPrice || currentPrice === targetPrice) return 100;
    
    // If target is higher than current (we want price to go up)
    if (targetPrice > currentPrice) {
      // Calculate how far we've moved toward the target
      return Math.min(100, Math.max(0, (currentPrice / targetPrice) * 100));
    } 
    // If target is lower than current (we want price to go down)
    else {
      // Calculate how far we've moved toward the target (reverse direction)
      return Math.min(100, Math.max(0, (targetPrice / currentPrice) * 100));
    }
  };
  
  const handleUpdateTarget = async () => {
    if (!item || priceTarget <= 0) return;
    
    setIsProcessing(true);
    try {
      if (onUpdatePriceTarget) {
        await onUpdatePriceTarget(priceTarget);
      } else if (item) {
        await updatePriceTarget(item.id, priceTarget);
      }
      
      // Close modal after successful update
      onClose();
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
      } else if (item) {
        await removeFromWatchlist(item.id);
      }
      
      // Close modal after successful removal
      onClose();
    } catch (error) {
      console.error('Error removing item from watchlist:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  // Format crypto price for display
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
  
  // Format large number (market cap, volume)
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

  if (!isOpen || !localItem) return null;
  
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 bg-black/50" onClick={onClose}></div>
      
      <div className="relative min-h-screen flex items-center justify-center p-4">
        <div className="relative bg-white rounded-lg w-full max-w-md p-6 shadow-xl">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-900">
              {tab === 'details' ? localItem.name : 'Edit Price Target'}
            </h2>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" clipRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"></path>
              </svg>
            </button>
          </div>
          
          <div className="mb-4">
            <div className="flex space-x-2 border-b border-gray-200">
              <button
                className={`px-4 py-2 ${tab === 'details' ? 'border-b-2 border-indigo-500 text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
                onClick={() => setTab('details')}
              >
                Details
              </button>
              <button
                className={`px-4 py-2 ${tab === 'edit' ? 'border-b-2 border-indigo-500 text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
                onClick={() => setTab('edit')}
              >
                Edit Target
              </button>
            </div>
          </div>
          
          {tab === 'details' ? (
            <div>
              <div className="bg-gray-50 p-4 rounded-lg mb-4">
                <div className="flex items-center">
                  <div className="h-10 w-10 flex-shrink-0 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center">
                    <img
                      src={`https://s2.coinmarketcap.com/static/img/coins/64x64/${localItem.coinId}.png`}
                      alt={localItem.symbol}
                      className="h-10 w-10 object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        const parent = target.parentElement;
                        if (parent) {
                          parent.innerHTML = localItem.symbol.substring(0, 3);
                          parent.classList.add('flex', 'items-center', 'justify-center', 'bg-gray-200', 'text-gray-600', 'font-bold');
                        }
                      }}
                    />
                  </div>
                  <div className="ml-4 flex-1">
                    <div className="font-medium">{localItem.name}</div>
                    <div className="text-xs text-gray-500 uppercase">{localItem.symbol}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">{formatCryptoPrice(localItem.price)}</div>
                    <div className={localItem.change24h >= 0 ? 'text-xs text-green-600' : 'text-xs text-red-600'}>
                      {localItem.change24h >= 0 ? '+' : ''}{localItem.change24h.toFixed(2)}%
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-700">Market Info</h3>
                  <div className="mt-2 grid grid-cols-2 gap-4">
                    <div className="border rounded p-3">
                      <div className="text-xs text-gray-500">Market Cap</div>
                      <div className="mt-1 font-medium">
                        <a 
                          href={`https://coinmarketcap.com/currencies/${localItem.name.toLowerCase().replace(/\s+/g, '-')}`} 
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-indigo-600 hover:underline"
                        >
                          View on CMC
                        </a>
                      </div>
                    </div>
                    <div className="border rounded p-3">
                      <div className="text-xs text-gray-500">Price Chart</div>
                      <div className="mt-1 font-medium">
                        <a 
                          href={`https://www.tradingview.com/symbols/${localItem.symbol}USD`} 
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-indigo-600 hover:underline"
                        >
                          View Chart
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
                
                {localItem.priceTarget && localItem.priceTarget > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-700">Price Target</h3>
                    <div className="mt-2 border rounded p-3">
                      <div className="flex justify-between mb-1">
                        <div className="text-xs text-gray-500">Target</div>
                        <div className="text-xs font-medium">
                          {formatCryptoPrice(localItem.priceTarget)}
                        </div>
                      </div>
                      
                      <div className="flex justify-between mb-2">
                        <div className="text-xs text-gray-500">Current</div>
                        <div className="text-xs font-medium">
                          {formatCryptoPrice(localItem.price)}
                        </div>
                      </div>
                      
                      <div className="w-full bg-gray-200 rounded-full h-1.5 mb-2">
                        <div
                          className={`h-1.5 rounded-full ${localItem.priceTarget > localItem.price ? 'bg-green-500' : 'bg-red-500'}`}
                          style={{ width: `${calculateProgressPercentage(localItem.price, localItem.priceTarget)}%` }}
                        ></div>
                      </div>
                      
                      <div className="text-xs text-right">
                        <span className={getTargetPercentage(localItem) >= 0 ? 'text-green-600' : 'text-red-600'}>
                          {getTargetPercentage(localItem) >= 0 ? '+' : ''}
                          {getTargetPercentage(localItem).toFixed(2)}% from current
                        </span>
                      </div>
                    </div>
                  </div>
                )}
                
                <div className="pt-4 flex space-x-3">
                  <button
                    type="button"
                    onClick={() => setTab('edit')}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Edit Target
                  </button>
                  <button
                    type="button"
                    onClick={handleRemoveItem}
                    disabled={isProcessing}
                    className="flex-1 px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                  >
                    {isProcessing ? 'Removing...' : 'Remove'}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Price Target</label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 sm:text-sm">$</span>
                  </div>
                  <input
                    type="number"
                    value={priceTarget || ''}
                    onChange={(e) => setPriceTarget(parseFloat(e.target.value) || 0)}
                    placeholder="Enter target price"
                    className="block w-full pl-7 pr-12 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                
                <p className="mt-2 text-sm text-gray-500">
                  Current price: {formatCryptoPrice(localItem.price)}
                </p>
                
                {priceTarget > 0 && (
                  <p className="mt-1 text-sm">
                    <span className={priceTarget > localItem.price ? 'text-green-600' : 'text-red-600'}>
                      {priceTarget > localItem.price 
                        ? `+${((priceTarget / localItem.price - 1) * 100).toFixed(2)}%` 
                        : `-${((1 - priceTarget / localItem.price) * 100).toFixed(2)}%`} from current price
                    </span>
                  </p>
                )}
              </div>
              
              <div className="mt-6 flex space-x-3">
                <button
                  type="button"
                  onClick={() => setTab('details')}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleUpdateTarget}
                  disabled={isProcessing || priceTarget <= 0}
                  className="flex-1 px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  {isProcessing ? 'Updating...' : 'Update Target'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}