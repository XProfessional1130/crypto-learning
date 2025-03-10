import { useState, useEffect } from 'react';
import { usePortfolio } from '@/lib/hooks/usePortfolio';
import { useAuth } from '@/lib/auth-context';
import { useWatchlist } from '@/lib/hooks/useWatchlist';
import AddCoinModal from './AddCoinModal';
import CryptoNews from './CryptoNews';

// Define watchlist item type
interface WatchlistItem {
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  icon: string; // Symbol short code for icon (e.g., SOL, LINK)
}

export default function PortfolioDashboard() {
  const { 
    portfolio, 
    loading: portfolioLoading, 
    error: portfolioError, 
    preferredCurrency,
    changeCurrency,
    refreshPortfolio 
  } = usePortfolio();
  
  const {
    watchlist,
    loading: watchlistLoading,
    error: watchlistError
  } = useWatchlist();
  
  const { user } = useAuth();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [btcPrice, setBtcPrice] = useState(41235);
  const [ethPrice, setEthPrice] = useState(2243);
  
  // Handler for when a coin is added to ensure UI updates
  const handleCoinAdded = () => {
    console.log("Coin added, refreshing portfolio...");
    refreshPortfolio();
  };
  
  // Fetch BTC and ETH prices
  useEffect(() => {
    // In a real implementation, fetch actual prices from an API
    // For now, using static values from the screenshot
    const fetchPrices = async () => {
      try {
        // Mock API call - would be replaced with actual API call
        setBtcPrice(41235);
        setEthPrice(2243);
      } catch (error) {
        console.error('Error fetching crypto prices:', error);
      }
    };
    
    fetchPrices();
    
    // Set up refresh interval (5 minutes)
    const intervalId = setInterval(fetchPrices, 5 * 60 * 1000);
    
    return () => clearInterval(intervalId);
  }, []);
  
  const loading = portfolioLoading || watchlistLoading;
  const error = portfolioError || watchlistError;
  
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="text-center py-10">
        <p className="text-red-500">{error}</p>
        <button 
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          onClick={refreshPortfolio}
        >
          Try Again
        </button>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto py-6 px-4 max-w-7xl">
      {/* Dashboard Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Your Dashboard</h1>
        <p className="text-gray-600 dark:text-gray-300">Welcome back, {user?.email?.split('@')[0] || 'partnerships'}!</p>
      </div>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Portfolio Value Card */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Portfolio Value</p>
          <p className="text-3xl font-bold">
            ${portfolio?.totalValueUsd.toLocaleString(undefined, { 
              minimumFractionDigits: 2, 
              maximumFractionDigits: 2 
            }) || '0.00'}
          </p>
        </div>
        
        {/* 24h Change Card */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">24h Change</p>
          <p className={`text-3xl font-bold ${
            (portfolio?.dailyChangePercentage || 0) >= 0 ? 'text-green-500' : 'text-red-500'
          }`}>
            {(portfolio?.dailyChangePercentage || 0) >= 0 ? '+' : ''}
            {(portfolio?.dailyChangePercentage || 0).toFixed(2)}%
          </p>
        </div>
        
        {/* Bitcoin Price Card */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Bitcoin Price</p>
          <p className="text-3xl font-bold">${btcPrice.toLocaleString()}</p>
        </div>
        
        {/* Ethereum Price Card */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Ethereum Price</p>
          <p className="text-3xl font-bold">${ethPrice.toLocaleString()}</p>
        </div>
      </div>
      
      {/* Main Content - Portfolio and Watchlist */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Portfolio Section - Takes up 2/3 of the space */}
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">Your Portfolio</h2>
              <button 
                onClick={() => setIsAddModalOpen(true)}
                className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition-colors"
              >
                Add Asset
              </button>
            </div>
            
            {(!portfolio || portfolio.items.length === 0) ? (
              <div className="text-center py-10">
                <p className="text-lg mb-4">Your portfolio is empty</p>
                <button 
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition-colors"
                  onClick={() => setIsAddModalOpen(true)}
                >
                  Add Your First Coin
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="text-left text-gray-500 dark:text-gray-400 text-sm uppercase">
                      <th className="pb-3">Asset</th>
                      <th className="pb-3 text-right">Amount</th>
                      <th className="pb-3 text-right">Value</th>
                      <th className="pb-3 text-right">24h Change</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {portfolio.items.map(item => (
                      <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="py-4">
                          <div className="flex items-center">
                            <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center mr-3 text-xs font-bold">
                              {item.coinSymbol.substring(0, 3)}
                            </div>
                            <div>
                              <div className="font-medium">{item.coinSymbol}</div>
                              <div className="text-sm text-gray-500 dark:text-gray-400">{item.coinName}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 text-right">
                          {item.amount.toLocaleString(undefined, { maximumFractionDigits: 6 })}
                        </td>
                        <td className="py-4 text-right">
                          ${item.valueUsd.toLocaleString(undefined, { 
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2 
                          })}
                        </td>
                        <td className={`py-4 text-right ${
                          item.priceChange24h >= 0 ? 'text-green-500' : 'text-red-500'
                        }`}>
                          {item.priceChange24h >= 0 ? '+' : ''}{item.priceChange24h.toFixed(1)}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
        
        {/* Watchlist Section - Takes up 1/3 of the space */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">Your Watchlist</h2>
            </div>
            
            <div className="space-y-4">
              {watchlist.length === 0 ? (
                <div className="text-center py-6 text-gray-500 dark:text-gray-400">
                  <p>Your watchlist is empty</p>
                </div>
              ) : (
                watchlist.map((coin) => (
                  <div key={coin.id} className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 text-xs font-bold ${
                        coin.symbol === 'SOL' ? 'bg-purple-100 text-purple-600' :
                        coin.symbol === 'LINK' ? 'bg-blue-100 text-blue-600' :
                        coin.symbol === 'AVAX' ? 'bg-green-100 text-green-600' :
                        'bg-red-100 text-red-600'
                      }`}>
                        {coin.icon}
                      </div>
                      <span>{coin.name}</span>
                    </div>
                    <div className="text-right">
                      <div>${coin.price.toLocaleString()}</div>
                      <div className={`text-sm ${
                        coin.change24h >= 0 ? 'text-green-500' : 'text-red-500'
                      }`}>
                        {coin.change24h >= 0 ? '+' : ''}{coin.change24h.toFixed(1)}%
                      </div>
                    </div>
                  </div>
                ))
              )}
              
              <button className="w-full mt-4 py-2 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                Edit Watchlist
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Latest Crypto News Section */}
      <div className="mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
          <CryptoNews />
        </div>
      </div>
      
      {/* Add Coin Modal */}
      <AddCoinModal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)}
        onCoinAdded={handleCoinAdded}
      />
    </div>
  );
} 