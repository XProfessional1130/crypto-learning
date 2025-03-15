import { memo } from 'react';
import { formatCryptoPrice } from '@/lib/utils/formatters';

// Memoized Market Leaders Card component 
interface MarketLeadersCardProps {
  btcPrice: number | null;
  ethPrice: number | null;
  btcDominance: number;
  ethDominance: number;
  loading?: boolean;
}

const MarketLeadersCard = memo(({ 
  btcPrice, 
  ethPrice, 
  btcDominance, 
  ethDominance, 
  loading = false 
}: MarketLeadersCardProps) => {
  // Use default values of 0 for any null values
  const btcDom = typeof btcDominance === 'number' ? btcDominance : 0;
  const ethDom = typeof ethDominance === 'number' ? ethDominance : 0;
  
  // Add additional check to ensure we're not showing empty data
  const hasValidData = btcPrice && btcPrice > 0 && ethPrice && ethPrice > 0;
  const isLoading = loading || !hasValidData;
  
  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm transition-all duration-300 hover:shadow-card-hover border border-gray-100 dark:border-gray-700">
      <h3 className="text-sm text-gray-500 dark:text-gray-400 mb-4">Market Leaders</h3>
      
      {isLoading ? (
        <div className="space-y-4">
          {/* Bitcoin row skeleton - explicitly set dark mode colors */}
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-8 h-8 mr-3 rounded-full bg-gray-200 dark:bg-gray-700"></div>
              <div>
                <div className="h-4 w-16 bg-gray-200 dark:bg-gray-700 rounded mb-1"></div>
                <div className="h-3 w-12 bg-gray-200 dark:bg-gray-700 rounded"></div>
              </div>
            </div>
            <div className="text-right">
              <div className="h-4 w-16 bg-gray-200 dark:bg-gray-700 rounded mb-1"></div>
              <div className="h-3 w-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
            </div>
          </div>
          
          {/* Ethereum row skeleton - explicitly set dark mode colors */}
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-8 h-8 mr-3 rounded-full bg-gray-200 dark:bg-gray-700"></div>
              <div>
                <div className="h-4 w-16 bg-gray-200 dark:bg-gray-700 rounded mb-1"></div>
                <div className="h-3 w-12 bg-gray-200 dark:bg-gray-700 rounded"></div>
              </div>
            </div>
            <div className="text-right">
              <div className="h-4 w-16 bg-gray-200 dark:bg-gray-700 rounded mb-1"></div>
              <div className="h-3 w-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Bitcoin row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <img src="https://s2.coinmarketcap.com/static/img/coins/64x64/1.png" alt="Bitcoin" className="w-8 h-8 mr-3" />
              <div>
                <p className="font-medium">Bitcoin</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">BTC</p>
              </div>
            </div>
            <div className="text-right">
              <p className="font-medium">${formatCryptoPrice(btcPrice || 0)}</p>
              <div className="bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 text-xs px-2 py-0.5 rounded-full inline-block">
                {btcDom.toFixed(1)}% Dominance
              </div>
            </div>
          </div>
          
          {/* Ethereum row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <img src="https://s2.coinmarketcap.com/static/img/coins/64x64/1027.png" alt="Ethereum" className="w-8 h-8 mr-3" />
              <div>
                <p className="font-medium">Ethereum</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">ETH</p>
              </div>
            </div>
            <div className="text-right">
              <p className="font-medium">${formatCryptoPrice(ethPrice || 0)}</p>
              <div className="bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs px-2 py-0.5 rounded-full inline-block">
                {ethDom.toFixed(1)}% Dominance
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

MarketLeadersCard.displayName = 'MarketLeadersCard';

export default MarketLeadersCard; 