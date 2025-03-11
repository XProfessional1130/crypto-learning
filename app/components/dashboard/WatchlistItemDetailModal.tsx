import { useState, useEffect } from 'react';
import { useWatchlist, WatchlistItem } from '@/lib/hooks/useWatchlist';
import { formatCryptoPrice, formatPercentage } from '@/lib/utils/format';

interface WatchlistItemDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: WatchlistItem | null;
}

export default function WatchlistItemDetailModal({ isOpen, onClose, item }: WatchlistItemDetailModalProps) {
  const { updatePriceTarget, removeFromWatchlist, getTargetPercentage } = useWatchlist();
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
      await updatePriceTarget(item.id, priceTarget);
      
      // Update the local item state with the new price target
      if (localItem) {
        setLocalItem({
          ...localItem,
          priceTarget: priceTarget
        });
      }
      
      setTab('details');
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
      await removeFromWatchlist(item.id);
      onClose();
    } catch (error) {
      console.error('Error removing item from watchlist:', error);
    } finally {
      setIsProcessing(false);
    }
  };
  
  if (!isOpen || !localItem) return null;
  
  // Calculate target percentage
  const targetPercentage = localItem.priceTarget 
    ? ((localItem.priceTarget - localItem.price) / localItem.price) * 100
    : 0;
  
  // Check if target is higher than current price
  const isTargetHigher = localItem.priceTarget ? localItem.priceTarget > localItem.price : false;
  
  // Calculate progress percentage
  const progressPercentage = localItem.priceTarget 
    ? calculateProgressPercentage(localItem.price, localItem.priceTarget)
    : 0;
  
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 bg-black/50" onClick={onClose}></div>
      
      <div className="relative min-h-screen flex items-center justify-center p-4">
        <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full">
          <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <div className="flex-shrink-0 h-12 w-12 relative mr-3">
                <img 
                  src={`https://s2.coinmarketcap.com/static/img/coins/64x64/${localItem.id}.png`}
                  alt={localItem.symbol}
                  className="rounded-full bg-white p-0.5 border border-gray-200 dark:border-gray-600 w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    const parent = target.parentElement;
                    if (parent) {
                      parent.innerHTML = `<div class="w-full h-full rounded-full flex items-center justify-center bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 font-bold">${localItem.symbol.substring(0, 3)}</div>`;
                    }
                  }}
                />
              </div>
              <h2 className="text-xl font-semibold">{localItem.name} ({localItem.symbol})</h2>
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
          
          {/* Content */}
          <div className="p-6">
            {tab === 'details' ? (
              <div className="space-y-6">
                <div className="bg-gray-50 dark:bg-gray-750 rounded-lg p-5 border border-gray-100 dark:border-gray-700">
                  <div className="flex justify-between items-baseline mb-3">
                    <div className="text-sm text-gray-500 dark:text-gray-400">Current Price</div>
                    <div className="text-2xl font-bold">
                      {formatCryptoPrice(localItem.price)}
                    </div>
                  </div>
                  
                  {localItem.priceTarget && (
                    <>
                      <div className="flex justify-between items-baseline mb-3">
                        <div className="text-sm text-gray-500 dark:text-gray-400">Target Price</div>
                        <div className="text-2xl font-bold">
                          {formatCryptoPrice(localItem.priceTarget)}
                        </div>
                      </div>
                      
                      <div className="mt-4">
                        <div className="flex justify-between items-center mb-2">
                          <div className="text-sm text-gray-500 dark:text-gray-400">Progress to target</div>
                          <div className={`text-sm font-bold ${
                            isTargetHigher ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                          }`}>
                            {Math.round(progressPercentage)}%
                          </div>
                        </div>
                        
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
                          <div 
                            className={`h-3 rounded-full ${isTargetHigher ? 'bg-green-500' : 'bg-red-500'}`}
                            style={{ width: `${progressPercentage}%` }}
                          ></div>
                        </div>
                        
                        <div className="flex justify-end mt-3">
                          <span className={`text-sm font-medium px-2 py-1 rounded-full ${
                            isTargetHigher
                              ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' 
                              : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                          }`}>
                            {formatPercentage(Math.abs(targetPercentage))} {isTargetHigher ? 'upside' : 'downside'}
                          </span>
                        </div>
                      </div>
                    </>
                  )}
                </div>
                
                <div className="p-4 border border-gray-100 dark:border-gray-700 rounded-lg">
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">Added on</span>
                    <span className="font-medium">
                      {localItem.createdAt 
                        ? new Date(localItem.createdAt).toLocaleDateString() 
                        : 'Unknown date'}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Price Target
                  </label>
                  <input
                    type="number"
                    value={priceTarget || ''}
                    onChange={(e) => {
                      const value = e.target.value;
                      setPriceTarget(value ? parseFloat(value) : 0);
                    }}
                    min={0.000001}
                    step={localItem.price < 1 ? 0.000001 : 0.01}
                    placeholder="Enter target price"
                    className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>
                
                {priceTarget > 0 && (
                  <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="text-sm text-gray-600 dark:text-gray-300 mb-3">Target Analysis</div>
                    
                    <div className="flex justify-between items-center mb-2">
                      <div>Current price:</div>
                      <div className="font-medium">{formatCryptoPrice(localItem.price)}</div>
                    </div>
                    
                    <div className="flex justify-between items-center mb-3">
                      <div>Target price:</div>
                      <div className="font-medium">{formatCryptoPrice(priceTarget)}</div>
                    </div>
                    
                    {priceTarget !== localItem.price && (
                      <>
                        <div className="flex justify-between items-center mb-2">
                          <div className="text-sm">Progress to target</div>
                          <div className={`text-sm font-bold ${
                            priceTarget > localItem.price ? 'text-green-500' : 'text-red-500'
                          }`}>
                            {Math.round(calculateProgressPercentage(localItem.price, priceTarget))}%
                          </div>
                        </div>
                        
                        <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-3 overflow-hidden">
                          <div 
                            className={`h-3 rounded-full ${priceTarget > localItem.price ? 'bg-green-500' : 'bg-red-500'}`}
                            style={{ width: `${calculateProgressPercentage(localItem.price, priceTarget)}%` }}
                          ></div>
                        </div>
                        
                        <div className="flex justify-end mt-3">
                          <span className={`text-sm font-medium px-2 py-1 rounded-full ${
                            priceTarget > localItem.price ? 'text-green-500' : 'text-red-500'
                          }`}>
                            {formatPercentage(Math.abs(((priceTarget - localItem.price) / localItem.price) * 100))} 
                            {priceTarget > localItem.price ? ' upside' : ' downside'}
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                )}
                
                <div className="flex gap-3">
                  <button
                    onClick={handleUpdateTarget}
                    disabled={priceTarget <= 0 || isProcessing}
                    className={`flex-1 py-2 bg-teal-500 text-white rounded-lg transition-colors ${
                      priceTarget <= 0 || isProcessing ? 'opacity-50 cursor-not-allowed' : 'hover:bg-teal-600'
                    }`}
                  >
                    {isProcessing ? 'Updating...' : 'Update Target'}
                  </button>
                  
                  <button
                    onClick={handleRemoveItem}
                    disabled={isProcessing}
                    className={`flex-1 py-2 bg-red-500 text-white rounded-lg transition-colors ${
                      isProcessing ? 'opacity-50 cursor-not-allowed' : 'hover:bg-red-600'
                    }`}
                  >
                    {isProcessing ? 'Removing...' : 'Remove Coin'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 