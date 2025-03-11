import { useState } from 'react';
import { CoinData } from '@/types/portfolio';
import { useTeamWatchlist } from '@/lib/hooks/useTeamWatchlist';
import { searchCoins } from '@/lib/services/coinmarketcap';

interface TeamAddToWatchlistModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCoinAdded?: (coin: CoinData, priceTarget?: number) => Promise<any>;
}

export default function TeamAddToWatchlistModal({ isOpen, onClose, onCoinAdded }: TeamAddToWatchlistModalProps) {
  console.log('TeamAddToWatchlistModal rendered with isOpen:', isOpen);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<CoinData[]>([]);
  const [selectedCoin, setSelectedCoin] = useState<CoinData | null>(null);
  const [priceTarget, setPriceTarget] = useState<number>(0);
  const [isSearching, setIsSearching] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [noResults, setNoResults] = useState(false);
  
  const { isInWatchlist } = useTeamWatchlist();
  
  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    console.log('handleSearch called with query:', searchQuery);
    setIsSearching(true);
    setSearchError(null);
    setNoResults(false);
    setSearchResults([]);
    
    try {
      console.log('Calling searchCoins API');
      const results = await searchCoins(searchQuery);
      console.log(`Found ${results.length} results:`, results);
      
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
    if (!selectedCoin) return;
    
    console.log('handleAddCoin called with coin:', selectedCoin);
    console.log('Price target:', priceTarget > 0 ? priceTarget : undefined);
    
    setIsAdding(true);
    try {
      // Call the onCoinAdded callback if provided
      if (onCoinAdded) {
        console.log('Calling onCoinAdded callback');
        await onCoinAdded(selectedCoin, priceTarget > 0 ? priceTarget : undefined);
        console.log('onCoinAdded callback completed successfully');
      } else {
        console.warn('onCoinAdded callback is not provided');
      }
      
      // Reset form and close modal
      resetForm();
      onClose();
    } catch (error) {
      console.error('Error adding coin to team watchlist:', error);
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
  
  // Add an onSubmit handler for the search form
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSearch();
  };
  
  if (!isOpen) {
    console.log('TeamAddToWatchlistModal returning null because isOpen is false');
    return null;
  }

  console.log('TeamAddToWatchlistModal rendering content');
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 bg-black/50" onClick={onClose}></div>
      
      <div className="relative min-h-screen flex items-center justify-center p-4">
        <div className="relative bg-white rounded-lg w-full max-w-md p-6 shadow-xl">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-900">
              {selectedCoin ? 'Add to Team Watchlist' : 'Search for Crypto'}
            </h2>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" clipRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"></path>
              </svg>
            </button>
          </div>
          
          {!selectedCoin ? (
            <div>
              <form onSubmit={handleSearchSubmit} className="mb-4">
                <div className="flex items-center rounded-md border border-gray-300 focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500 overflow-hidden">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by name or symbol..."
                    className="flex-1 px-4 py-2 focus:outline-none"
                  />
                  <button 
                    type="submit"
                    className="bg-indigo-600 text-white px-4 py-2 hover:bg-indigo-700 border-none"
                    disabled={isSearching || !searchQuery.trim()}
                  >
                    {isSearching ? 'Searching...' : 'Search'}
                  </button>
                </div>
              </form>
              
              {searchError && (
                <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-md">
                  {searchError}
                </div>
              )}
              
              {noResults && (
                <div className="mb-4 p-3 bg-yellow-50 text-yellow-600 rounded-md">
                  No results found for "{searchQuery}"
                </div>
              )}
              
              {isSearching && (
                <div className="flex justify-center items-center py-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
                </div>
              )}
              
              {searchResults.length > 0 && (
                <div className="mt-4 max-h-[50vh] overflow-y-auto">
                  <p className="text-sm text-gray-500 mb-2">Select a cryptocurrency:</p>
                  <div className="divide-y divide-gray-100">
                    {searchResults.map((coin) => {
                      const alreadyInWatchlist = isInWatchlist(coin.id.toString());
                      return (
                        <div
                          key={coin.id}
                          className={`p-3 cursor-pointer hover:bg-gray-50 flex items-center justify-between ${
                            alreadyInWatchlist ? 'opacity-50' : ''
                          }`}
                          onClick={() => {
                            if (!alreadyInWatchlist) {
                              handleSelectCoin(coin);
                            }
                          }}
                        >
                          <div className="flex items-center">
                            <div className="w-8 h-8 mr-3 flex-shrink-0 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center">
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
                                    parent.classList.add('flex', 'items-center', 'justify-center', 'bg-gray-200', 'text-gray-600', 'font-bold');
                                  }
                                }}
                              />
                            </div>
                            <div>
                              <div className="font-medium">{coin.name}</div>
                              <div className="text-sm text-gray-500">{coin.symbol}</div>
                            </div>
                          </div>
                          {alreadyInWatchlist && (
                            <span className="text-xs bg-gray-200 text-gray-600 py-1 px-2 rounded-full">
                              Already in watchlist
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div>
              <div className="bg-gray-50 p-4 rounded-lg mb-4">
                <div className="flex items-center">
                  <div className="w-10 h-10 mr-3 flex-shrink-0 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center">
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
                          parent.classList.add('flex', 'items-center', 'justify-center', 'bg-gray-200', 'text-gray-600', 'font-bold');
                        }
                      }}
                    />
                  </div>
                  <div>
                    <div className="font-medium">{selectedCoin.name}</div>
                    <div className="text-xs text-gray-500">{selectedCoin.symbol}</div>
                  </div>
                  <div className="ml-auto">
                    <div className="font-medium">${selectedCoin.priceUsd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })}</div>
                    <div className={selectedCoin.priceChange24h >= 0 ? 'text-xs text-green-600' : 'text-xs text-red-600'}>
                      {selectedCoin.priceChange24h >= 0 ? '+' : ''}{selectedCoin.priceChange24h.toFixed(2)}%
                    </div>
                  </div>
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Price Target (optional)</label>
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
                <p className="mt-1 text-xs text-gray-500">
                  Leave empty if you don't want to set a price target.
                </p>
              </div>

              <div className="mt-6 flex space-x-3">
                <button 
                  type="button" 
                  onClick={() => setSelectedCoin(null)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Back
                </button>
                <button 
                  type="button" 
                  onClick={handleAddCoin}
                  disabled={isAdding}
                  className="flex-1 px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  {isAdding ? 'Adding...' : 'Add to Watchlist'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 