import { useState } from 'react';
import { CoinData } from '@/types/portfolio';
import { usePortfolio } from '@/lib/hooks/usePortfolio';
import { searchCoins } from '@/lib/services/coinmarketcap';
import { ModalSkeleton } from '../ui/ModalSkeleton';
import ErrorDisplay from '@/components/ErrorDisplay';
import { logger } from '@/lib/utils/logger';

interface AddCoinModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCoinAdded?: () => void;
}

export default function AddCoinModal({ isOpen, onClose, onCoinAdded }: AddCoinModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<CoinData[]>([]);
  const [selectedCoin, setSelectedCoin] = useState<CoinData | null>(null);
  const [amount, setAmount] = useState<number>(0);
  const [isSearching, setIsSearching] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [noResults, setNoResults] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  
  const { addCoin, refreshPortfolio } = usePortfolio();
  
  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    setSearchError(null);
    setNoResults(false);
    setSearchResults([]);
    
    try {
      logger.debug('Searching for coins', { query: searchQuery });
      // Use the imported searchCoins function directly from our new service
      const results = await searchCoins(searchQuery);
      logger.debug('Search results received', { count: results.length });
      
      setSearchResults(results);
      
      if (results.length === 0) {
        setNoResults(true);
      }
    } catch (err) {
      logger.error('Search error', { error: err });
      setSearchError('Failed to search for coins. Please try again.');
    } finally {
      setIsSearching(false);
    }
  };
  
  const handleSelectCoin = (coin: CoinData) => {
    setSelectedCoin(coin);
    setAmount(0);
    setSearchResults([]);
    setSearchQuery('');
  };
  
  const handleAddCoin = async () => {
    if (!selectedCoin || amount <= 0) return;
    
    setIsAdding(true);
    setError(null);
    
    try {
      logger.debug('Adding coin to portfolio', { coin: selectedCoin.symbol, amount });
      await addCoin(selectedCoin.id, amount);
      
      // Force refresh to ensure UI updates
      await refreshPortfolio();
      
      // Call the onCoinAdded callback if provided
      if (onCoinAdded) {
        onCoinAdded();
      }
      
      // Reset form and close modal
      resetForm();
      onClose();
    } catch (err) {
      logger.error('Error adding coin to portfolio', { error: err, coin: selectedCoin.symbol });
      setError('Failed to add coin to portfolio. Please try again.');
    } finally {
      setIsAdding(false);
    }
  };
  
  const resetForm = () => {
    setSearchQuery('');
    setSearchResults([]);
    setSelectedCoin(null);
    setAmount(0);
    setSearchError(null);
    setNoResults(false);
    setError(null);
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 bg-black/50" onClick={onClose}></div>
      
      <div className="relative min-h-screen flex items-center justify-center p-4">
        <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full">
          <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold">Add Coin to Portfolio</h2>
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
                                  src={coin.logoUrl} 
                                  alt={coin.symbol} 
                                  className="w-8 h-8 mr-3 rounded-full bg-gray-100"
                                  onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    target.src = 'https://via.placeholder.com/32';
                                    target.style.display = 'none';
                                    target.parentElement?.classList.add('bg-gray-200', 'dark:bg-gray-700', 'w-8', 'h-8', 'rounded-full', 'flex', 'items-center', 'justify-center', 'text-xs', 'font-bold');
                                    target.parentElement!.innerHTML = `<span>${coin.symbol.substring(0, 2)}</span>`;
                                  }}
                                />
                                
                                {coin.cmcRank && (
                                  <div className="absolute bottom-0 right-0 w-4 h-4 rounded-full bg-white dark:bg-gray-800 flex items-center justify-center text-[8px] font-bold border border-gray-200 dark:border-gray-700 overflow-hidden text-blue-500">
                                    #{coin.cmcRank}
                                  </div>
                                )}
                              </div>
                              
                              <div className="text-left">
                                <div className="font-medium flex items-center">
                                  {coin.symbol}
                                  <svg className="ml-1 w-3 h-3 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                  </svg>
                                </div>
                                <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center">
                                  <span className="truncate max-w-[150px]">{coin.name}</span>
                                  {coin.marketCap > 0 && (
                                    <span className="ml-1 text-xs text-gray-400">
                                      (${coin.marketCap > 1000000000 
                                        ? `${(coin.marketCap/1000000000).toFixed(1)}B` 
                                        : coin.marketCap > 1000000 
                                          ? `${(coin.marketCap/1000000).toFixed(1)}M` 
                                          : coin.marketCap > 1000 
                                            ? `${(coin.marketCap/1000).toFixed(1)}K` 
                                            : coin.marketCap.toFixed(0)})
                                    </span>
                                  )}
                                </div>
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
                        src={selectedCoin.logoUrl} 
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
                      <div className="mt-2 font-medium">
                        Value: ${(amount * selectedCoin.priceUsd).toLocaleString(undefined, { 
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2 
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
                  disabled={amount <= 0 || isAdding}
                  className={`px-4 py-2 bg-blue-500 text-white rounded-lg transition-colors ${
                    amount <= 0 || isAdding ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-600'
                  }`}
                >
                  {isAdding ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Adding...
                    </div>
                  ) : (
                    'Add to Portfolio'
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