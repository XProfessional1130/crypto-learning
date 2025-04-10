import { useState, useEffect } from 'react';
import { useWatchlist } from '@/hooks/dashboard/useWatchlist';
import { WatchlistItem } from '@/lib/api/team-watchlist';
import { formatCryptoPrice, formatPercentage } from '@/lib/utils/format';
import { ModalSkeleton } from '@/components/ui/ModalSkeleton';
import ErrorDisplay from '@/components/ui/ErrorDisplay';
import { logger } from '@/lib/utils/logger';

interface WatchlistItemDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: WatchlistItem | null;
  onRefresh?: () => void;
}

export default function WatchlistItemDetailModal({ isOpen, onClose, item, onRefresh }: WatchlistItemDetailModalProps) {
  const { updatePriceTarget, removeFromWatchlist, getTargetPercentage, refreshWatchlist } = useWatchlist();
  const [priceTarget, setPriceTarget] = useState<number>(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [tab, setTab] = useState<'details' | 'edit'>('details');
  const [localItem, setLocalItem] = useState<WatchlistItem | null>(item);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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
    setError(null);
    
    try {
      logger.debug('Updating price target', { itemId: item.id, target: priceTarget });
      await updatePriceTarget(item.id, priceTarget);
      
      // Force refresh to ensure UI updates, bypassing rate limits
      await refreshWatchlist(true);
      
      // Update local state
      if (localItem) {
        setLocalItem({
          ...localItem,
          priceTarget
        });
      }
      
      // Switch back to details tab
      setTab('details');
      
      // Call the onRefresh callback if provided
      if (onRefresh) {
        onRefresh();
      }
    } catch (err) {
      logger.error('Error updating price target', { error: err, itemId: item.id });
      setError('Failed to update price target. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };
  
  const handleRemoveItem = async () => {
    if (!item) return;
    
    setIsProcessing(true);
    setError(null);
    
    try {
      logger.debug('Removing item from watchlist', { itemId: item.id });
      await removeFromWatchlist(item.id);
      
      // Call the onRefresh callback if provided
      if (onRefresh) {
        onRefresh();
      }
      
      // Close the modal
      onClose();
    } catch (err) {
      logger.error('Error removing item from watchlist', { error: err, itemId: item.id });
      setError('Failed to remove item from watchlist. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };
  
  if (!isOpen) return null;
  
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
            <h2 className="text-xl font-semibold">Watchlist Asset Details</h2>
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
            ) : !localItem ? (
              <div className="text-center py-6">
                <p className="text-gray-500 dark:text-gray-400">Item information not available</p>
              </div>
            ) : (
              <>
                {/* Header with Asset Info */}
                <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700">
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
                                  {Math.round(progressPercentage)}%
                                </div>
                              </div>
                              
                              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                                <div 
                                  className={`h-2 rounded-full ${isTargetHigher ? 'bg-green-500' : 'bg-red-500'}`}
                                  style={{ width: `${progressPercentage}%` }}
                                ></div>
                              </div>
                              
                              <div className="flex justify-end mt-3">
                                <span className={`text-sm font-medium px-2 py-0.5 rounded-full ${
                                  isTargetHigher
                                    ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400' 
                                    : 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
                                }`}>
                                  {formatPercentage(Math.abs(targetPercentage))} {isTargetHigher ? 'upside' : 'downside'}
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
                          This will permanently remove {localItem.name} from your watchlist.
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
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 