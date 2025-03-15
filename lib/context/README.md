# Context Providers

This directory contains React Context API providers that are used to manage state across the application.

## DataCacheProvider (`data-cache-context.tsx`)

The `DataCacheProvider` implements a comprehensive caching system for all cryptocurrency data with the following features:

### Features

- **Unified data cache**: All cryptocurrency data (prices, market data, coin info) is cached in one place
- **localStorage persistence**: Data is persisted across page reloads
- **15-minute automatic refresh**: Data is refreshed every 15 minutes automatically
- **On-demand refresh**: Manual refresh capability via `refreshData()` function
- **Fail-safe mechanism**: Falls back to cached data when API calls fail
- **Cache invalidation**: Only fetches fresh data when cache is expired or forced
- **Lazy loading**: Individual coin data is fetched only when needed and then cached

### Usage

Wrap your application with the provider (already done in `app/layout.tsx`):

```jsx
<DataCacheProvider>
  <YourApp />
</DataCacheProvider>
```

Access the cached data in any component:

```jsx
import { useDataCache } from '@/lib/context/data-cache-context';

function YourComponent() {
  const { 
    btcPrice, 
    ethPrice, 
    globalData, 
    getCoinData,
    getMultipleCoinsData,
    isLoading, 
    isRefreshing, 
    lastUpdated,
    refreshData
  } = useDataCache();
  
  // Example: Fetch a specific coin
  useEffect(() => {
    async function loadCoinData() {
      const solanaData = await getCoinData('5426'); // Solana's ID
      console.log('Solana price:', solanaData?.priceUsd);
    }
    
    loadCoinData();
  }, [getCoinData]);
  
  return (
    <div>
      <p>Bitcoin: ${btcPrice}</p>
      <button onClick={refreshData}>Refresh</button>
      {lastUpdated && <p>Last updated: {lastUpdated.toLocaleTimeString()}</p>}
    </div>
  );
}
```

### Cache Structure

Data is stored in localStorage with the following keys:

- `lc_data_cache_btcPrice`: Bitcoin price
- `lc_data_cache_ethPrice`: Ethereum price  
- `lc_data_cache_globalData`: Global market data
- `lc_data_cache_coinData`: Individual coin data

Each cached item includes the data and a timestamp:

```js
{
  data: [actual data],
  timestamp: [timestamp when cached]
}
```

### Portfolio Integration

The portfolio data now uses the DataCacheProvider for all coin price data. This ensures consistency across the application and reduces the number of API calls.

Example of using DataCacheProvider with the portfolio service:

```jsx
import { useDataCache } from '@/lib/context/data-cache-context';
import { processTeamPortfolioWithCache } from '@/lib/services/team-portfolio';
import supabase from '@/lib/services/supabase-client';

function PortfolioComponent() {
  const [portfolio, setPortfolio] = useState(null);
  const { getMultipleCoinsData } = useDataCache();
  
  useEffect(() => {
    async function loadPortfolio() {
      const { data: portfolioItems } = await supabase.from('team_portfolio').select('*');
      const processedPortfolio = await processTeamPortfolioWithCache(portfolioItems, getMultipleCoinsData);
      setPortfolio(processedPortfolio);
    }
    
    loadPortfolio();
  }, [getMultipleCoinsData]);
  
  // Render portfolio...
}
```

## Other Providers

- **TeamDataProvider**: Manages team portfolio and watchlist data (also uses DataCacheProvider for coin prices)
- **AuthProvider**: Handles authentication state
- **ThemeProvider**: Manages light/dark theme preferences 