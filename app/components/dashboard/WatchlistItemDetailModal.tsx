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
  
  const handleUpdateTarget = async () => {
    if (!item || priceTarget <= 0) return;
    
    setIsProcessing(true);
    try {
      updatePriceTarget(item.id, priceTarget);
      
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
      removeFromWatchlist(item.id);
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
  
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 bg-black/50" onClick={onClose}></div>
      
      <div className="relative min-h-screen flex items-center justify-center p-4">
        <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full">
          <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center mr-3 overflow-hidden">
                <img 
                  src={`https://s2.coinmarketcap.com/static/img/coins/64x64/${localItem.id}.png`}
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
              <div className="space-y-4">
                <div>
                  <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Current Price</div>
                  <div className="text-2xl font-bold">
                    {formatCryptoPrice(localItem.price)}
                  </div>
                  <div className={`text-sm font-medium ${
                    localItem.change24h >= 0 
                      ? 'text-green-600 dark:text-green-400' 
                      : 'text-red-600 dark:text-red-400'
                  }`}>
                    {formatPercentage(localItem.change24h)} (24h)
                  </div>
                </div>
                
                {localItem.priceTarget && (
                  <div className="mt-6">
                    <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Your Price Target</div>
                    <div className="text-2xl font-bold">
                      {formatCryptoPrice(localItem.priceTarget)}
                    </div>
                    <div className={`text-sm font-medium ${
                      targetPercentage >= 0 
                        ? 'text-green-600 dark:text-green-400' 
                        : 'text-red-600 dark:text-red-400'
                    }`}>
                      {formatPercentage(targetPercentage)} from current price
                    </div>
                  </div>
                )}
                
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
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
                  <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="text-sm text-gray-600 dark:text-gray-300 mb-1">Target Analysis</div>
                    <div className="flex justify-between items-center">
                      <div>Current price:</div>
                      <div className="font-medium">{formatCryptoPrice(localItem.price)}</div>
                    </div>
                    <div className="flex justify-between items-center mt-2 pt-2 border-t border-gray-200 dark:border-gray-600">
                      <div>Distance to target:</div>
                      <div className={`font-medium ${
                        priceTarget > localItem.price ? 'text-green-500' : 'text-red-500'
                      }`}>
                        {priceTarget > localItem.price ? '+' : ''}
                        {(((priceTarget - localItem.price) / localItem.price) * 100).toFixed(2)}%
                      </div>
                    </div>
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