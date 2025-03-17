import { memo } from 'react';
import { GlobalData } from '@/lib/api/coinmarketcap';
import { StatsCard } from './DashboardUI';
import { formatCryptoPrice } from './DashboardUI';
import { TrendingUp, TrendingDown, Activity, DollarSign } from 'lucide-react';
import { useDataCache } from '@/lib/providers/data-cache-provider';

interface MarketOverviewProps {
  loading?: boolean;
  btcPrice?: number | null;
  ethPrice?: number | null;
  globalData?: GlobalData | null;
  showDetailedView?: boolean;
  useDataFromCache?: boolean;
  compact?: boolean;
}

// Format large numbers with abbreviations
const formatLargeNumber = (num: number): string => {
  if (num >= 1e12) {
    return `$${(num / 1e12).toFixed(2)}T`;
  } else if (num >= 1e9) {
    return `$${(num / 1e9).toFixed(2)}B`;
  } else if (num >= 1e6) {
    return `$${(num / 1e6).toFixed(2)}M`;
  } else if (num >= 1e3) {
    return `$${(num / 1e3).toFixed(2)}K`;
  }
  return `$${num.toFixed(2)}`;
};

// Extended GlobalData with additional properties for our UI
interface ExtendedGlobalData extends GlobalData {
  btc_change_24h?: number;
  eth_change_24h?: number;
  market_cap_change_24h?: number;
  volume_change_24h?: number;
  active_cryptocurrencies?: number;
}

// Memoized to prevent unnecessary re-renders
const MarketOverview = memo(({
  loading: propLoading,
  btcPrice: propBtcPrice,
  ethPrice: propEthPrice,
  globalData: propGlobalData,
  showDetailedView = false,
  useDataFromCache = false,
  compact = false
}: MarketOverviewProps) => {
  // Use data from cache if requested, otherwise use props
  const cache = useDataFromCache ? useDataCache() : null;
  
  // Determine which data source to use
  const btcPrice = useDataFromCache ? cache?.btcPrice : propBtcPrice;
  const ethPrice = useDataFromCache ? cache?.ethPrice : propEthPrice;
  const globalData = useDataFromCache ? cache?.globalData : propGlobalData;
  const loading = useDataFromCache ? (cache?.isLoading || false) : (propLoading || false);
  
  // Cast to extended type for UI (these properties might come from API but aren't in the type)
  const extendedData = globalData as ExtendedGlobalData | null;
  
  // Default values for changes if not available
  const btcChange = extendedData?.btc_change_24h ?? 0;
  const ethChange = extendedData?.eth_change_24h ?? 0;
  const marketCapChange = extendedData?.market_cap_change_24h ?? 0;
  const volumeChange = extendedData?.volume_change_24h ?? 0;
  
  // Determine the grid layout class based on the compact prop and container size
  const gridClass = compact
    ? "grid grid-cols-2 gap-2 text-sm" // More compact layout for widgets
    : "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8"; // Original layout for full-width display
  
  return (
    <div className={gridClass}>
      {/* Bitcoin Price Card */}
      <StatsCard
        title="Bitcoin Price"
        value={btcPrice ? formatCryptoPrice(btcPrice) : 'N/A'}
        loading={loading}
        icon={<img src="/assets/icons/btc.svg" alt="BTC" className="w-5 h-5" />}
        changeInfo={{
          value: btcChange,
          isPositive: btcChange > 0,
          label: '24h'
        }}
        showChangeIcon={true}
        compact={compact}
      />
      
      {/* Ethereum Price Card */}
      <StatsCard
        title="Ethereum Price"
        value={ethPrice ? formatCryptoPrice(ethPrice) : 'N/A'}
        loading={loading}
        icon={<img src="/assets/icons/eth.svg" alt="ETH" className="w-5 h-5" />}
        changeInfo={{
          value: ethChange,
          isPositive: ethChange > 0,
          label: '24h'
        }}
        showChangeIcon={true}
        compact={compact}
      />
      
      {/* Only show these cards if not in compact mode or if we want all cards regardless */}
      {(!compact || showDetailedView) && (
        <>
          {/* Market Cap Card */}
          <StatsCard
            title="Global Market Cap"
            value={globalData ? formatLargeNumber(globalData.totalMarketCap) : 'N/A'}
            loading={loading}
            icon={<DollarSign className="w-5 h-5 text-gray-500 dark:text-gray-400" />}
            changeInfo={{
              value: marketCapChange,
              isPositive: marketCapChange > 0,
              label: '24h'
            }}
            showChangeIcon={true}
            compact={compact}
          />
          
          {/* 24h Volume Card */}
          <StatsCard
            title="24h Trading Volume"
            value={globalData ? formatLargeNumber(globalData.totalVolume24h) : 'N/A'}
            loading={loading}
            icon={<Activity className="w-5 h-5 text-gray-500 dark:text-gray-400" />}
            changeInfo={{
              value: volumeChange,
              isPositive: volumeChange > 0
            }}
            showChangeIcon={true}
            compact={compact}
          />
        </>
      )}
      
      {/* Detailed view adds more market stats if showDetailedView is true */}
      {showDetailedView && globalData && (
        <>
          {/* Market Trend Card */}
          <StatsCard
            title="Market Trend"
            value={marketCapChange > 0 ? "Bullish" : "Bearish"}
            valueClassName={marketCapChange > 0 ? "text-green-500" : "text-red-500"}
            icon={marketCapChange > 0 ? 
              <TrendingUp className="w-5 h-5 text-green-500" /> : 
              <TrendingDown className="w-5 h-5 text-red-500" />
            }
            compact={compact}
          />
          
          {/* BTC Dominance Card */}
          <StatsCard
            title="BTC Dominance"
            value={`${globalData.btcDominance.toFixed(2)}%`}
            icon={<img src="/assets/icons/btc.svg" alt="BTC" className="w-5 h-5" />}
            dominance={globalData.btcDominance}
            compact={compact}
          />
          
          {/* ETH Dominance Card */}
          <StatsCard
            title="ETH Dominance"
            value={`${globalData.ethDominance.toFixed(2)}%`}
            icon={<img src="/assets/icons/eth.svg" alt="ETH" className="w-5 h-5" />}
            dominance={globalData.ethDominance}
            compact={compact}
          />
          
          {/* Active Cryptocurrencies Card */}
          <StatsCard
            title="Active Cryptocurrencies"
            value={(extendedData?.active_cryptocurrencies || 0).toLocaleString()}
            icon={<svg className="w-5 h-5 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
            </svg>}
            compact={compact}
          />
        </>
      )}
    </div>
  );
});

MarketOverview.displayName = 'MarketOverview';

export default MarketOverview; 