import { useState } from 'react';
import { CoinData } from '@/types/portfolio';
import ModalContent from '../modals/ModalContent';
import { useCoinSearch } from '@/lib/hooks/useCoinSearch';

interface TeamAddCoinModalProps {
  onClose: () => void;
  onCoinAdded?: (coin: CoinData, amount: number) => Promise<void>;
}

export default function TeamAddCoinModal({ onClose, onCoinAdded }: TeamAddCoinModalProps) {
  // Use our new search hook for live search
  const { query, results, isLoading, error, setQuery } = useCoinSearch();
  
  const [selectedCoin, setSelectedCoin] = useState<CoinData | null>(null);
  const [amount, setAmount] = useState<number>(0);
  const [isAdding, setIsAdding] = useState(false);
  
  // Show "no results" message when search has results but they're empty
  // This is needed because the useCoinSearch hook will show top coins when query is empty
  const showNoResults = query.length >= 2 && !isLoading && results.length === 0;
  
  const handleSelectCoin = (coin: CoinData) => {
    setSelectedCoin(coin);
    setAmount(0); // Reset amount when selecting a new coin
  };
  
  const handleAddCoin = async () => {
    if (!selectedCoin || !onCoinAdded) return;
    
    setIsAdding(true);
    
    try {
      await onCoinAdded(selectedCoin, amount);
      // Reset form after successful add
      setSelectedCoin(null);
      setAmount(0);
      setQuery('');
    } catch (error) {
      console.error('Error adding coin:', error);
    } finally {
      setIsAdding(false);
    }
  };
  
  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
  };
  
  return (
    <ModalContent title="Add New Asset" onClose={onClose}>
      <div className="space-y-6">
        {!selectedCoin ? (
          <>
            {/* Search coins section */}
            <div className="space-y-4">
              <div className="flex items-center rounded-md border border-gray-300 dark:border-gray-600 focus-within:border-teal-500 focus-within:ring-1 focus-within:ring-teal-500">
                <input
                  type="text"
                  value={query}
                  onChange={handleSearchChange}
                  placeholder="Search cryptocurrency..."
                  className="flex-1 px-4 py-2 bg-white dark:bg-gray-700 dark:text-white focus:outline-none rounded-md"
                  autoFocus
                />
                {isLoading && (
                  <div className="px-3 flex items-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-teal-500"></div>
                  </div>
                )}
              </div>
              
              {error && (
                <div className="p-3 bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-md">
                  {error}
                </div>
              )}
              
              {showNoResults && (
                <div className="p-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md">
                  No cryptocurrencies found. Try a different search term.
                </div>
              )}
              
              {/* Display search results */}
              {results.length > 0 && (
                <div className="border border-gray-200 dark:border-gray-600 rounded-md overflow-hidden">
                  <div className="bg-gray-50 dark:bg-gray-700/50 p-2 border-b border-gray-200 dark:border-gray-600 font-medium text-sm text-gray-500 dark:text-gray-400">
                    {query.trim() ? 'Search results:' : 'Popular cryptocurrencies:'}
                  </div>
                  <div className="max-h-60 overflow-y-auto">
                    {results.map((coin) => (
                      <div
                        key={coin.id}
                        onClick={() => handleSelectCoin(coin)}
                        className="flex items-center space-x-3 p-3 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer border-b border-gray-100 dark:border-gray-700 last:border-b-0 justify-between"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 flex-shrink-0 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center overflow-hidden">
                            <img
                              src={`https://s2.coinmarketcap.com/static/img/coins/64x64/${coin.id}.png`}
                              alt={coin.symbol}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                                (target.parentElement as HTMLElement).textContent = coin.symbol.substring(0, 3);
                              }}
                            />
                          </div>
                          <div>
                            <div className="font-medium">{coin.name}</div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">{coin.symbol}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">${coin.priceUsd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })}</div>
                          <div className={`text-xs ${coin.priceChange24h >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                            {coin.priceChange24h >= 0 ? '+' : ''}{coin.priceChange24h.toFixed(2)}%
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </>
        ) : (
          <>
            {/* Coin selected, show amount input form */}
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center overflow-hidden">
                <img
                  src={`https://s2.coinmarketcap.com/static/img/coins/64x64/${selectedCoin.id}.png`}
                  alt={selectedCoin.symbol}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    (target.parentElement as HTMLElement).textContent = selectedCoin.symbol.substring(0, 3);
                  }}
                />
              </div>
              <div>
                <div className="font-medium text-lg">{selectedCoin.name}</div>
                <div className="text-gray-500 dark:text-gray-400">{selectedCoin.symbol}</div>
              </div>
              <button
                onClick={() => setSelectedCoin(null)}
                className="ml-auto text-sm text-teal-600 hover:text-teal-700 dark:text-teal-400"
              >
                Change
              </button>
            </div>
            
            <div className="space-y-3">
              <div className="font-medium">Enter amount:</div>
              <input
                type="number"
                value={amount === 0 ? '' : amount}
                onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                placeholder="Enter amount..."
                min="0"
                step="0.000001"
                className="w-full p-2 border border-gray-200 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 focus:ring-2 focus:ring-teal-500"
              />
            </div>
            
            <div className="pt-4 flex space-x-3">
              <button
                onClick={onClose}
                className="px-4 py-2 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              
              <button
                onClick={handleAddCoin}
                disabled={isAdding || amount <= 0}
                className="px-4 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isAdding ? 'Adding...' : 'Add Asset'}
              </button>
            </div>
          </>
        )}
      </div>
    </ModalContent>
  );
} 