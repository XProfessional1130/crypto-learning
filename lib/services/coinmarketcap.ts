import { CoinData } from '@/types/portfolio';

// Enhanced cache settings with longer TTLs for better performance
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes for regular data
const GLOBAL_CACHE_TTL = 2 * 60 * 60 * 1000; // 2 hours for global data
const TOP_COINS_CACHE_TTL = 60 * 60 * 1000; // 1 hour for top coins

// Cache structure - use localStorage for persistence between page loads
const priceCache = new Map<string, { data: CoinData; timestamp: number }>();
let globalDataCache: { data: GlobalData; timestamp: number } | null = null;
let topCoinsCache: { data: CoinData[]; timestamp: number } | null = null;
let searchResultsCache = new Map<string, { data: CoinData[]; timestamp: number }>();

// Initialize from localStorage if available
if (typeof window !== 'undefined') {
  try {
    const storedGlobalData = localStorage.getItem('lc_global_data');
    if (storedGlobalData) {
      globalDataCache = JSON.parse(storedGlobalData);
    }
    
    const storedTopCoins = localStorage.getItem('lc_top_coins');
    if (storedTopCoins) {
      topCoinsCache = JSON.parse(storedTopCoins);
    }
  } catch (e) {
    console.error('Error loading cache from localStorage:', e);
  }
}

// Singleton pattern
let isInitialized = false;
let isInitializing = false;
let initializationPromise: Promise<void> | null = null;

// Queue for batching coin requests
type QueuedRequest = {
  coinId: string;
  resolve: (data: CoinData | null) => void;
  reject: (error: Error) => void;
};
const requestQueue: QueuedRequest[] = [];
let processingQueue = false;
const BATCH_SIZE = 50; // CMC allows up to 100 at once, increased from 25
const QUEUE_PROCESS_DELAY = 300; // Reduced delay to 300ms for better responsiveness

// Define global data type
export interface GlobalData {
  btcDominance: number;
  ethDominance: number;
  totalMarketCap: number;
  totalVolume24h: number;
}

// Helper function to check if cache is valid
const isCacheValid = (timestamp: number, ttl = CACHE_TTL): boolean => {
  return Date.now() - timestamp < ttl;
};

// Helper to get base URL based on environment
const getBaseUrl = (): string => {
  // In production, use actual host
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  return baseUrl;
};

// Save cache data to localStorage
const persistCacheToStorage = () => {
  if (typeof window === 'undefined') return;
  
  try {
    if (globalDataCache) {
      localStorage.setItem('lc_global_data', JSON.stringify(globalDataCache));
    }
    
    if (topCoinsCache) {
      localStorage.setItem('lc_top_coins', JSON.stringify(topCoinsCache));
    }
  } catch (e) {
    console.error('Error saving cache to localStorage:', e);
  }
};

/**
 * Initialize the service by prefetching top coins and global data
 * Call this at app startup
 */
export async function initCoinDataService(): Promise<void> {
  // Only run this on the client side
  if (typeof window === 'undefined') {
    console.log('Skipping coin data service initialization - running on server');
    return;
  }

  // If already initialized or initializing, return existing promise
  if (isInitialized) {
    return;
  }
  
  if (isInitializing && initializationPromise) {
    return initializationPromise;
  }

  isInitializing = true;
  initializationPromise = new Promise<void>(async (resolve) => {
    try {
      console.log('Initializing coin data service...');
      
      // Use cached data if valid before making network requests
      const needTopCoins = !topCoinsCache || !isCacheValid(topCoinsCache.timestamp, TOP_COINS_CACHE_TTL);
      const needGlobalData = !globalDataCache || !isCacheValid(globalDataCache.timestamp, GLOBAL_CACHE_TTL);
      
      // Only fetch what we need
      const fetchPromises = [];
      
      if (needTopCoins) {
        fetchPromises.push(prefetchTopCoins().catch(err => {
          console.error('Error prefetching top coins, continuing anyway:', err);
          return []; // Return empty array to prevent Promise.all from failing
        }));
      }
      
      if (needGlobalData) {
        fetchPromises.push(getGlobalData().catch(err => {
          console.error('Error fetching global data, continuing anyway:', err);
          return null; // Return null to prevent Promise.all from failing
        }));
      }
      
      // Only run Promise.all if we have promises to run
      if (fetchPromises.length > 0) {
        await Promise.all(fetchPromises);
      }
      
      isInitialized = true;
      console.log('Coin data service initialized');
      resolve();
    } catch (error) {
      console.error('Error initializing coin data service:', error);
      resolve(); // We still resolve to prevent breaking the app
    } finally {
      isInitializing = false;
    }
  });
  
  return initializationPromise;
}

/**
 * Prefetch the top 200 coins from CMC
 * This will be used for search results and portfolio data
 */
export async function prefetchTopCoins(): Promise<CoinData[]> {
  // Check if we have a valid cache
  if (topCoinsCache && isCacheValid(topCoinsCache.timestamp, TOP_COINS_CACHE_TTL)) {
    return topCoinsCache.data;
  }
  
  try {
    // Fetch top 200 coins instead of default 100
    const response = await fetch(`${getBaseUrl()}/api/coin-list?limit=200`, {
      // Add cache control headers
      headers: {
        'Cache-Control': 'public, max-age=1800' // 30 minutes
      }
    });
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    const result = await response.json();
    
    if (!result.success || !result.data) {
      console.error('API returned error:', result.error);
      return [];
    }
    
    // Update both the top coins cache and individual price caches
    topCoinsCache = {
      data: result.data,
      timestamp: Date.now()
    };
    
    // Also add each coin to the individual price cache
    result.data.forEach((coin: CoinData) => {
      priceCache.set(coin.id, {
        data: coin,
        timestamp: Date.now()
      });
    });
    
    // Persist to localStorage
    persistCacheToStorage();
    
    return result.data;
  } catch (error) {
    console.error('Error prefetching top coins:', error);
    // Return cached data even if expired as fallback
    return topCoinsCache?.data || [];
  }
}

/**
 * Search for coins using cached top coins first, then fallback to API
 */
export async function searchCoins(query: string): Promise<CoinData[]> {
  if (!query.trim()) {
    return [];
  }

  const queryLower = query.toLowerCase().trim();
  
  // Check search cache first
  const cachedSearch = searchResultsCache.get(queryLower);
  if (cachedSearch && isCacheValid(cachedSearch.timestamp)) {
    return cachedSearch.data;
  }
  
  try {
    // First try to search in our prefetched top coins
    if (topCoinsCache) {
      const filteredCoins = topCoinsCache.data.filter(coin => 
        coin.name.toLowerCase().includes(queryLower) ||
        coin.symbol.toLowerCase().includes(queryLower) ||
        (coin.slug && coin.slug.toLowerCase().includes(queryLower))
      );
      
      if (filteredCoins.length > 0) {
        // Cache this search result
        searchResultsCache.set(queryLower, {
          data: filteredCoins,
          timestamp: Date.now()
        });
        return filteredCoins;
      }
    }
    
    // If no results in cache or cache miss, then call the API
    console.log(`Searching for coins with query: ${query}`);
    
    // Use our internal API endpoint
    const response = await fetch(`${getBaseUrl()}/api/coin-search?query=${encodeURIComponent(query)}`, {
      headers: {
        'Cache-Control': 'public, max-age=900' // 15 minutes
      }
    });
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    const result = await response.json();
    
    if (!result.success || !result.data) {
      console.error('API returned error:', result.error);
      return [];
    }
    
    // Cache this search result
    searchResultsCache.set(queryLower, {
      data: result.data,
      timestamp: Date.now()
    });
    
    return result.data;
  } catch (error) {
    console.error('Error searching coins:', error);
    return [];
  }
}

/**
 * Process the queue of coin data requests in batches
 */
async function processQueue(): Promise<void> {
  if (processingQueue || requestQueue.length === 0) return;
  
  processingQueue = true;
  
  try {
    // Take up to BATCH_SIZE requests from the queue
    const batch = requestQueue.splice(0, BATCH_SIZE);
    const coinIds = batch.map(req => req.coinId);
    
    console.log(`Processing batch of ${batch.length} coin requests`);
    
    // Build the URL with all coin IDs
    const idsParam = coinIds.join(',');
    const response = await fetch(`${getBaseUrl()}/api/coin-data-batch?ids=${idsParam}`, {
      headers: {
        'Cache-Control': 'public, max-age=1800' // 30 minutes
      }
    });
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to fetch coin data');
    }
    
    // Update cache and resolve promises
    for (const req of batch) {
      const coinData = result.data[req.coinId] || null;
      
      if (coinData) {
        // Update cache
        priceCache.set(req.coinId, {
          data: coinData,
          timestamp: Date.now()
        });
        
        // Resolve promise
        req.resolve(coinData);
      } else {
        req.resolve(null);
      }
    }
  } catch (error) {
    console.error('Error processing coin data batch:', error);
    
    // Reject all requests in the batch
    const batch = requestQueue.splice(0, BATCH_SIZE);
    for (const req of batch) {
      req.reject(error as Error);
    }
  } finally {
    processingQueue = false;
    
    // Process next batch if there are more requests
    if (requestQueue.length > 0) {
      setTimeout(processQueue, QUEUE_PROCESS_DELAY);
    }
  }
}

/**
 * Get data for a single coin by ID
 * Uses caching and batching for efficiency
 */
export async function getCoinData(coinId: string | number): Promise<CoinData | null> {
  const id = String(coinId);
  
  // Try to serve from cache first if valid
  const cached = priceCache.get(id);
  if (cached && isCacheValid(cached.timestamp)) {
    return cached.data;
  }
  
  // Check if coin data is in top coins cache
  if (topCoinsCache && isCacheValid(topCoinsCache.timestamp, TOP_COINS_CACHE_TTL)) {
    const fromTopCoins = topCoinsCache.data.find(coin => String(coin.id) === id);
    if (fromTopCoins) {
      // Update the individual cache
      priceCache.set(id, {
        data: fromTopCoins,
        timestamp: Date.now()
      });
      return fromTopCoins;
    }
  }
  
  // If not in cache or cache invalid, add to queue for batched fetch
  return new Promise((resolve, reject) => {
    requestQueue.push({ coinId: id, resolve, reject });
    
    // Start processing queue if not already processing
    if (!processingQueue) {
      setTimeout(processQueue, QUEUE_PROCESS_DELAY);
    }
  });
}

/**
 * Get data for multiple coins by ID
 * Uses caching and batching for efficiency
 */
export async function getMultipleCoinsData(coinIds: (string | number)[]): Promise<Record<string, CoinData>> {
  if (!coinIds.length) return {};
  
  const ids = coinIds.map(id => String(id));
  const result: Record<string, CoinData> = {};
  const idsToFetch: string[] = [];
  
  // First, try to serve from cache
  for (const id of ids) {
    const cached = priceCache.get(id);
    if (cached && isCacheValid(cached.timestamp)) {
      result[id] = cached.data;
    } else {
      // Check if in top coins cache
      let found = false;
      if (topCoinsCache && isCacheValid(topCoinsCache.timestamp, TOP_COINS_CACHE_TTL)) {
        const fromTopCoins = topCoinsCache.data.find(coin => String(coin.id) === id);
        if (fromTopCoins) {
          // Update individual cache
          priceCache.set(id, {
            data: fromTopCoins,
            timestamp: Date.now()
          });
          result[id] = fromTopCoins;
          found = true;
        }
      }
      
      if (!found) {
        idsToFetch.push(id);
      }
    }
  }
  
  // If all data was in cache, return immediately
  if (idsToFetch.length === 0) {
    return result;
  }
  
  // For ids not in cache, fetch in batch
  const fetchPromises = idsToFetch.map(id => 
    getCoinData(id)
      .then(data => {
        if (data) {
          result[id] = data;
        }
        return data;
      })
      .catch(err => {
        console.error(`Error fetching data for coin ${id}:`, err);
        return null;
      })
  );
  
  await Promise.all(fetchPromises);
  
  return result;
}

/**
 * Get the current Bitcoin price in USD
 */
export async function getBtcPrice(): Promise<number> {
  try {
    // Try to get from cache first
    if (topCoinsCache && isCacheValid(topCoinsCache.timestamp, CACHE_TTL)) {
      const btc = topCoinsCache.data.find(coin => coin.symbol === 'BTC');
      if (btc && btc.priceUsd) {
        return btc.priceUsd;
      }
    }
    
    const coinData = await getCoinData('1'); // Bitcoin is always ID 1
    return coinData?.priceUsd || 0;
  } catch (error) {
    console.error('Error getting BTC price:', error);
    return 0;
  }
}

/**
 * Get the current Ethereum price in USD
 */
export async function getEthPrice(): Promise<number> {
  try {
    // Try to get from cache first
    if (topCoinsCache && isCacheValid(topCoinsCache.timestamp, CACHE_TTL)) {
      const eth = topCoinsCache.data.find(coin => coin.symbol === 'ETH');
      if (eth && eth.priceUsd) {
        return eth.priceUsd;
      }
    }
    
    const coinData = await getCoinData('1027'); // Ethereum is always ID 1027
    return coinData?.priceUsd || 0;
  } catch (error) {
    console.error('Error getting ETH price:', error);
    return 0;
  }
}

/**
 * Get global crypto market data
 */
export async function getGlobalData(): Promise<GlobalData | null> {
  // Check if we have valid cached data
  if (globalDataCache && isCacheValid(globalDataCache.timestamp, GLOBAL_CACHE_TTL)) {
    return globalDataCache.data;
  }
  
  try {
    const response = await fetch(`${getBaseUrl()}/api/global-data`, {
      headers: {
        'Cache-Control': 'public, max-age=3600' // 1 hour
      }
    });
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    const result = await response.json();
    
    if (!result.success || !result.data) {
      throw new Error(result.error || 'Failed to fetch global data');
    }
    
    const globalData: GlobalData = {
      btcDominance: result.data.btc_dominance || 0,
      ethDominance: result.data.eth_dominance || 0,
      totalMarketCap: result.data.total_market_cap || 0,
      totalVolume24h: result.data.total_volume_24h || 0
    };
    
    // Update cache
    globalDataCache = {
      data: globalData,
      timestamp: Date.now()
    };
    
    // Persist to localStorage
    persistCacheToStorage();
    
    return globalData;
  } catch (error) {
    console.error('Error getting global data:', error);
    
    // Return cached data even if expired as a fallback
    if (globalDataCache) {
      return globalDataCache.data;
    }
    
    return null;
  }
}

/**
 * Clean up expired items from caches to free memory
 * This is called automatically on a regular basis
 */
export function cleanupCaches(): void {
  const now = Date.now();
  
  // Clean up price cache
  Array.from(priceCache.entries()).forEach(([key, value]) => {
    if (now - value.timestamp > CACHE_TTL * 2) {
      priceCache.delete(key);
    }
  });
  
  // Clean up search cache
  Array.from(searchResultsCache.entries()).forEach(([key, value]) => {
    if (now - value.timestamp > CACHE_TTL * 2) {
      searchResultsCache.delete(key);
    }
  });
  
  console.log('Cleaned up expired cache entries');
} 