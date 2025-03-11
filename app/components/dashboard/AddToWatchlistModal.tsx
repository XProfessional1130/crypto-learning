import { useState } from 'react';
import { CoinData } from '@/types/portfolio';
import { useWatchlist } from '@/lib/hooks/useWatchlist';
import { searchCoins } from '@/lib/services/coinmarketcap';
import { formatCryptoPrice, formatPercentage } from '@/lib/utils/format';

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
  
  const { addToWatchlist, isInWatchlist } = useWatchlist();
  
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
      addToWatchlist(selectedCoin, priceTarget);
      
      if (onCoinAdded) {
        onCoinAdded();
      }
      
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
                    {searchResults.map((coin) => {
                      const alreadyInWatchlist = isInWatchlist(coin.id);
                      return (
                        <button
                          key={coin.id}
                          onClick={() => handleSelectCoin(coin)}
                          className={`w-full p-3 flex items-center rounded-lg transition-colors border-b border-gray-100 dark:border-gray-800 ${
                            alreadyInWatchlist 
                              ? 'opacity-60 bg-gray-50 dark:bg-gray-700 cursor-not-allowed' 
                              : 'hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer'
                          }`}
                          disabled={alreadyInWatchlist}
                        >
                          <div className="flex items-center flex-1">
                            <div className="relative">
                              <img 
                                src={coin.logoUrl || `https://s2.coinmarketcap.com/static/img/coins/64x64/${coin.id}.png`} 
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
                                {alreadyInWatchlist && (
                                  <span className="ml-2 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-full">
                                    In Watchlist
                                  </span>
                                )}
                              </div>
                              <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center">
                                <span className="truncate max-w-[150px]">{coin.name}</span>
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div>
                              {formatCryptoPrice(coin.priceUsd)}
                            </div>
                            <div className={`text-xs ${coin.priceChange24h >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                              {formatPercentage(coin.priceChange24h)}
                            </div>
                          </div>
                        </button>
                      );
                    })}
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
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto mb-2"></div>
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
                    {formatCryptoPrice(selectedCoin.priceUsd)}
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
                    placeholder="Enter your price target"
                    className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>
                
                {priceTarget > 0 && (
                  <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg mb-4">
                    <div className="text-sm text-gray-600 dark:text-gray-300 mb-1">Target Analysis</div>
                    <div className="flex justify-between items-center">
                      <div>Current price:</div>
                      <div className="font-medium">{formatCryptoPrice(selectedCoin.priceUsd)}</div>
                    </div>
                    <div className="flex justify-between items-center">
                      <div>Target price:</div>
                      <div className="font-medium">{formatCryptoPrice(priceTarget)}</div>
                    </div>
                    <div className="flex justify-between items-center mt-2 pt-2 border-t border-gray-200 dark:border-gray-600">
                      <div>Distance to target:</div>
                      <div className={`font-medium ${
                        priceTarget > selectedCoin.priceUsd ? 'text-green-500' : 'text-red-500'
                      }`}>
                        {priceTarget > selectedCoin.priceUsd ? '+' : ''}
                        {(((priceTarget - selectedCoin.priceUsd) / selectedCoin.priceUsd) * 100).toFixed(2)}%
                      </div>
                    </div>
                  </div>
                )}
                
                <div className="flex space-x-3">
                  <button
                    onClick={() => {
                      setSelectedCoin(null);
                      setPriceTarget(0);
                    }}
                    className="flex-1 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition-colors hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleAddCoin}
                    disabled={!priceTarget || priceTarget <= 0 || isAdding}
                    className={`flex-1 py-2 bg-teal-600 text-white rounded-lg transition-colors ${
                      !priceTarget || priceTarget <= 0 || isAdding ? 'opacity-50 cursor-not-allowed' : 'hover:bg-teal-700'
                    }`}
                  >
                    {isAdding ? 'Adding...' : 'Add to Watchlist'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 