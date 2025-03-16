import { useState } from 'react';
import { CoinData } from '@/types/portfolio';
import { useWatchlist } from '@/lib/hooks/useWatchlist';
import { searchCoins } from '@/lib/services/coinmarketcap';
import { formatCryptoPrice, formatPercentage } from '@/lib/utils/format';
import { ModalSkeleton, FormInputSkeleton, AssetItemSkeleton } from '../ui/ModalSkeleton';
import ErrorDisplay from '@/components/ErrorDisplay';

interface AddToWatchlistModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCoinAdded?: () => void;
}

export default function AddToWatchlistModal({ isOpen, onClose, onCoinAdded }: AddToWatchlistModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<CoinData[]>([]);
  const [selectedCoin, setSelectedCoin] = useState<CoinData | null>(null);
  const [priceTarget, setPriceTarget] = useState<number>(0);
  const [isSearching, setIsSearching] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [noResults, setNoResults] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  
  const { addToWatchlist, isInWatchlist, refreshWatchlist } = useWatchlist();
  
  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    setSearchError(null);
    setNoResults(false);
    setSearchResults([]);
    
    try {
      console.log('Searching for coins with query:', searchQuery);
      const results = await searchCoins(searchQuery);
      console.log(`Found ${results.length} results`);
      
      setSearchResults(results);
      
      if (results.length === 0) {
        setNoResults(true);
      }
    } catch (error) {
      console.error('Search error:', error);
      setSearchError('Failed to search for coins. Please try again.');
    } finally {
      setIsSearching(false);
    }
  };
  
  const handleSelectCoin = (coin: CoinData) => {
    setSelectedCoin(coin);
    // Set default price target 20% above current price
    setPriceTarget(parseFloat((coin.priceUsd * 1.2).toFixed(coin.priceUsd < 1 ? 6 : 2)));
    setSearchResults([]);
    setSearchQuery('');
  };
  
  const handleAddCoin = async () => {
    if (!selectedCoin || priceTarget <= 0) return;
    
    setIsAdding(true);
    try {
      // Add to watchlist - this will update the UI directly without triggering refreshes
      await addToWatchlist(selectedCoin, priceTarget);
      
      // Force refresh to ensure UI updates, bypassing rate limits
      await refreshWatchlist(true);
      
      // Call the onCoinAdded callback if provided
      if (onCoinAdded) {
        onCoinAdded();
      }
      
      // Reset form and close modal
      resetForm();
      onClose();
    } catch (error) {
      console.error('Error adding coin to watchlist:', error);
    } finally {
      setIsAdding(false);
    }
  };
  
  const resetForm = () => {
    setSearchQuery('');
    setSearchResults([]);
    setSelectedCoin(null);
    setPriceTarget(0);
    setSearchError(null);
    setNoResults(false);
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 bg-black/50" onClick={onClose}></div>
      
      <div className="relative min-h-screen flex items-center justify-center p-4">
        <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full">
          <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold">Add Coin to Watchlist</h2>
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
                contentItems={8}
                footerHeight={40}
              />
            ) : (
              <>
                {!selectedCoin ? (
                  <>
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Search for a coin
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                          placeholder="Search by name or symbol (e.g. Bitcoin, BTC)"
                          className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        />
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                          {isSearching ? (
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
                          ) : (
                            <button onClick={handleSearch} type="button">
                              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                              </svg>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {searchResults.length > 0 && (
                      <div className="mt-4 max-h-[300px] overflow-y-auto">
                        {searchResults.map((coin) => (
                          <button
                            key={coin.id}
                            onClick={() => handleSelectCoin(coin)}
                            className="w-full p-3 flex items-center hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors border-b border-gray-100 dark:border-gray-800"
                          >
                            <div className="flex items-center flex-1">
                              <div className="relative">
                                <img 
                                  src={coin.logoUrl || `https://s2.coinmarketcap.com/static/img/coins/64x64/${coin.id}.png`} 
                                  alt={coin.symbol} 
                                  className="w-8 h-8 mr-3 rounded-full"
                                  onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    target.src = 'https://via.placeholder.com/32';
                                  }}
                                />
                              </div>
                              
                              <div className="text-left">
                                <div className="font-medium">{coin.symbol}</div>
                                <div className="text-sm text-gray-500 dark:text-gray-400">{coin.name}</div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div>
                                ${coin.priceUsd.toLocaleString(undefined, { 
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 6 
                                })}
                              </div>
                              <div className={`text-xs ${coin.priceChange24h >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                {coin.priceChange24h >= 0 ? '+' : ''}{coin.priceChange24h.toFixed(2)}%
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                    
                    {noResults && searchQuery && !isSearching && (
                      <div className="mt-4 p-4 text-center text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700 rounded-lg">
                        No coins found matching "{searchQuery}"
                      </div>
                    )}
                    
                    {searchError && (
                      <div className="mt-4 p-4 text-center text-red-500 border border-red-200 dark:border-red-800 rounded-lg">
                        {searchError}
                      </div>
                    )}
                    
                    {isSearching && (
                      <div className="mt-4 p-4 text-center">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mb-2"></div>
                        <p>Searching...</p>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <div className="flex items-center mb-6">
                      <img 
                        src={selectedCoin.logoUrl || `https://s2.coinmarketcap.com/static/img/coins/64x64/${selectedCoin.id}.png`} 
                        alt={selectedCoin.symbol} 
                        className="w-8 h-8 mr-3 rounded-full"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://via.placeholder.com/32';
                        }}
                      />
                      <div>
                        <div className="font-bold">{selectedCoin.symbol}</div>
                        <div className="text-gray-500 dark:text-gray-400">{selectedCoin.name}</div>
                      </div>
                      <div className="ml-auto font-medium">
                        ${selectedCoin.priceUsd.toLocaleString(undefined, { 
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 6 
                        })}
                      </div>
                    </div>
                    
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Price Target
                      </label>
                      <input
                        type="number"
                        value={priceTarget || ''}
                        onChange={(e) => setPriceTarget(e.target.value ? parseFloat(e.target.value) : 0)}
                        min={0.000001}
                        step={selectedCoin.priceUsd < 1 ? 0.000001 : 0.01}
                        placeholder="Enter target price"
                        className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      />
                    </div>
                    
                    {priceTarget > 0 && (
                      <div className="mt-2 font-medium">
                        Target: ${priceTarget.toLocaleString(undefined, { 
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 6
                        })}
                      </div>
                    )}
                  </>
                )}
              </>
            )}
          </div>
          
          <div className="flex justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
            {selectedCoin ? (
              <>
                <button
                  onClick={() => setSelectedCoin(null)}
                  className="px-4 py-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={handleAddCoin}
                  disabled={priceTarget <= 0 || isAdding}
                  className={`px-4 py-2 bg-blue-500 text-white rounded-lg transition-colors ${
                    priceTarget <= 0 || isAdding ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-600'
                  }`}
                >
                  {isAdding ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Adding...
                    </div>
                  ) : (
                    'Add to Watchlist'
                  )}
                </button>
              </>
            ) : (
              <button
                onClick={onClose}
                className="px-4 py-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                Cancel
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 