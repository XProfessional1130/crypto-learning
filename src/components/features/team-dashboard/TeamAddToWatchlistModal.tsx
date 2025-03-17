import { useState, useCallback } from 'react';
import { CoinData } from '@/types/portfolio';
import ModalContent from '../modals/ModalContent';
import { useCoinSearch } from '@/hooks/useCoinSearch';

interface TeamAddToWatchlistModalProps {
  onClose: () => void;
  onCoinAdded?: (coin: CoinData, priceTarget?: number) => Promise<any>;
  isInWatchlist?: (coinId: string) => boolean;
}

export default function TeamAddToWatchlistModal({ 
  onClose, 
  onCoinAdded,
  isInWatchlist 
}: TeamAddToWatchlistModalProps) {
  
  // Use our new search hook for live search
  const { query, results, isLoading, error, setQuery } = useCoinSearch();
  
  const [selectedCoin, setSelectedCoin] = useState<CoinData | null>(null);
  const [priceTarget, setPriceTarget] = useState<number>(0);
  const [isAdding, setIsAdding] = useState(false);
  const [noResults, setNoResults] = useState(false);
  
  // Show "no results" message when search has results but they're empty
  // This is needed because the useCoinSearch hook will show top coins when query is empty
  const showNoResults = query.length >= 2 && !isLoading && results.length === 0;
  
  const handleSelectCoin = useCallback((coin: CoinData) => {
    setSelectedCoin(coin);
    // Set default price target 20% above current price
    setPriceTarget(parseFloat((coin.priceUsd * 1.2).toFixed(coin.priceUsd < 1 ? 6 : 2)));
  }, []);
  
  const handleAddCoin = useCallback(async () => {
    if (!selectedCoin) return;
    
    setIsAdding(true);
    try {
      // Call the onCoinAdded callback if provided
      if (onCoinAdded) {
        await onCoinAdded(selectedCoin, priceTarget > 0 ? priceTarget : undefined);
      }
    } catch (error) {
      console.error('Error adding coin to team watchlist:', error);
    } finally {
      setIsAdding(false);
    }
  }, [selectedCoin, priceTarget, onCoinAdded]);
  
  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    if (e.target.value.length === 0) {
      setNoResults(false);
    }
  };

  return (
    <ModalContent title={selectedCoin ? 'Add to Team Watchlist' : 'Search for Crypto'} onClose={onClose}>
      {!selectedCoin ? (
        <div>
          <div className="mb-4">
            <div className="flex items-center rounded-md border border-gray-300 dark:border-gray-600 focus-within:border-teal-500 focus-within:ring-1 focus-within:ring-teal-500 overflow-hidden">
              <input
                type="text"
                value={query}
                onChange={handleSearchChange}
                placeholder="Search by name or symbol..."
                className="flex-1 px-4 py-2 bg-white dark:bg-gray-700 dark:text-white focus:outline-none"
                autoFocus
              />
              {isLoading && (
                <div className="px-3 flex items-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-teal-500"></div>
                </div>
              )}
            </div>
          </div>
          
          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-md">
              {error}
            </div>
          )}
          
          {showNoResults && (
            <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400 rounded-md">
              No results found for "{query}"
            </div>
          )}
          
          {results.length > 0 && (
            <div className="mt-4 max-h-[50vh] overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg">
              <div className="bg-gray-50 dark:bg-gray-700 p-2 border-b border-gray-200 dark:border-gray-700 sticky top-0">
                <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                  {query.trim() ? 'Search results:' : 'Popular cryptocurrencies:'}
                </p>
              </div>
              <div className="divide-y divide-gray-100 dark:divide-gray-700">
                {results.map((coin) => {
                  const alreadyInWatchlist = isInWatchlist ? isInWatchlist(coin.id.toString()) : false;
                  return (
                    <div
                      key={coin.id}
                      className={`p-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center justify-between transition-colors ${
                        alreadyInWatchlist ? 'opacity-50' : ''
                      }`}
                      onClick={() => {
                        if (!alreadyInWatchlist) {
                          handleSelectCoin(coin);
                        }
                      }}
                    >
                      <div className="flex items-center">
                        <div className="w-8 h-8 mr-3 flex-shrink-0 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-600 flex items-center justify-center">
                          <img
                            src={`https://s2.coinmarketcap.com/static/img/coins/64x64/${coin.id}.png`}
                            alt={coin.symbol}
                            className="h-8 w-8 object-cover"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                              const parent = target.parentElement;
                              if (parent) {
                                parent.innerHTML = coin.symbol.substring(0, 3);
                                parent.classList.add('flex', 'items-center', 'justify-center', 'bg-gray-200', 'dark:bg-gray-600', 'text-gray-600', 'dark:text-gray-300', 'font-bold');
                              }
                            }}
                          />
                        </div>
                        <div>
                          <div className="font-medium text-gray-800 dark:text-white">{coin.name}</div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">{coin.symbol}</div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="text-right">
                          <div className="font-medium">${coin.priceUsd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })}</div>
                          <div className={`text-xs ${coin.priceChange24h >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                            {coin.priceChange24h >= 0 ? '+' : ''}{coin.priceChange24h.toFixed(2)}%
                          </div>
                        </div>
                        {alreadyInWatchlist && (
                          <span className="text-xs bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-300 py-1 px-2 rounded-full">
                            In watchlist
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-10 h-10 mr-3 flex-shrink-0 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                  <img
                    src={`https://s2.coinmarketcap.com/static/img/coins/64x64/${selectedCoin.id}.png`}
                    alt={selectedCoin.symbol}
                    className="h-10 w-10 object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      const parent = target.parentElement;
                      if (parent) {
                        parent.innerHTML = selectedCoin.symbol.substring(0, 3);
                        parent.classList.add('flex', 'items-center', 'justify-center', 'bg-gray-200', 'dark:bg-gray-600', 'text-gray-600', 'dark:text-gray-300', 'font-bold');
                      }
                    }}
                  />
                </div>
                <div>
                  <div className="font-medium text-gray-800 dark:text-white">{selectedCoin.name}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">{selectedCoin.symbol}</div>
                </div>
              </div>
              <div>
                <div className="font-medium text-right">${selectedCoin.priceUsd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })}</div>
                <div className={`text-xs text-right ${selectedCoin.priceChange24h >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                  {selectedCoin.priceChange24h >= 0 ? '+' : ''}{selectedCoin.priceChange24h.toFixed(2)}%
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Price Target (optional)</label>
            <div className="relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-500 dark:text-gray-400 sm:text-sm">$</span>
              </div>
              <input
                type="number"
                value={priceTarget || ''}
                onChange={(e) => setPriceTarget(parseFloat(e.target.value) || 0)}
                placeholder="Enter target price"
                className="block w-full pl-7 pr-3 py-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-teal-500 focus:border-teal-500"
              />
            </div>
            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
              Setting a price target helps track potential profit opportunities.
            </p>
          </div>
          
          <div className="flex space-x-3">
            <button
              onClick={() => {
                setSelectedCoin(null);
              }}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Back to Search
            </button>
            <button
              onClick={handleAddCoin}
              disabled={isAdding}
              className="flex-1 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isAdding ? 'Adding...' : 'Add to Watchlist'}
            </button>
          </div>
        </div>
      )}
    </ModalContent>
  );
} 