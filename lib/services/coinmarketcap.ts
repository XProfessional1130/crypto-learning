import { CoinData } from '@/types/portfolio';

// Enhanced cache settings
const CACHE_TTL = 15 * 60 * 1000; // 15 minutes
const GLOBAL_CACHE_TTL = 60 * 60 * 1000; // 1 hour for global data
const TOP_COINS_CACHE_TTL = 30 * 60 * 1000; // 30 minutes for top coins

// Cache structure
const priceCache = new Map<string, { data: CoinData; timestamp: number }>();
let globalDataCache: { data: GlobalData; timestamp: number } | null = null;
let topCoinsCache: { data: CoinData[]; timestamp: number } | null = null;
let searchResultsCache = new Map<string, { data: CoinData[]; timestamp: number }>();

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
const BATCH_SIZE = 25; // CMC allows up to 100 at once, but we'll be conservative
const QUEUE_PROCESS_DELAY = 500; // ms to wait for batching requests

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
    console.log('Coin data service already initialized');
    return;
  }
  
  if (isInitializing && initializationPromise) {
    console.log('Coin data service initialization already in progress');
    return initializationPromise;
  }

  isInitializing = true;
  initializationPromise = new Promise<void>(async (resolve) => {
    try {
      console.log('Initializing coin data service...');
      
      // Prefetch top 100 coins in parallel with global data
      try {
        await Promise.all([
          prefetchTopCoins().catch(err => {
            console.error('Error prefetching top coins, continuing anyway:', err);
            return []; // Return empty array to prevent Promise.all from failing
          }),
          getGlobalData().catch(err => {
            console.error('Error fetching global data, continuing anyway:', err);
            return null; // Return null to prevent Promise.all from failing
          }),
        ]);
        isInitialized = true;
        console.log('Coin data service initialized');
      } catch (parallelError) {
        console.error('Error running parallel initialization, continuing anyway:', parallelError);
      }
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
    const response = await fetch(`${getBaseUrl()}/api/coin-list?limit=200`);
    
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
    
    return result.data;
  } catch (error) {
    console.error('Error prefetching top coins:', error);
    return [];
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
    if (topCoinsCache && isCacheValid(topCoinsCache.timestamp, TOP_COINS_CACHE_TTL)) {
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
    const response = await fetch(`${getBaseUrl()}/api/coin-search?query=${encodeURIComponent(query)}`);
    
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
    
    console.log(`Processing batch of ${batch.length} coin requests: ${coinIds.join(', ')}`);
    
    // Build the URL with all coin IDs
    const idsParam = coinIds.join(',');
    const response = await fetch(`${getBaseUrl()}/api/coin-data-batch?ids=${idsParam}`);
    
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
        req.resolve(coinData);
      } else {
        req.resolve(null);
      }
    }
  } catch (error) {
    console.error('Error processing coin data batch:', error);
    // Reject all requests in the current batch
    const failedBatch = requestQueue.splice(0, BATCH_SIZE);
    failedBatch.forEach(req => req.reject(error as Error));
  } finally {
    processingQueue = false;
    
    // Process next batch if there are more requests
    if (requestQueue.length > 0) {
      setTimeout(processQueue, 100); // Small delay before next batch
    }
  }
}

/**
 * Get data for a specific coin by ID using our internal API endpoint
 * This adds the request to a queue for batch processing
 */
export async function getCoinData(coinId: string | number): Promise<CoinData | null> {
  // Ensure coinId is a string
  const coinIdString = String(coinId);
  
  // Check cache first
  const cachedData = priceCache.get(coinIdString);
  if (cachedData && isCacheValid(cachedData.timestamp)) {
    return cachedData.data;
  }
  
  // Check if the coin is in our top coins cache
  if (topCoinsCache && isCacheValid(topCoinsCache.timestamp, TOP_COINS_CACHE_TTL)) {
    const cachedCoin = topCoinsCache.data.find(coin => coin.id === coinIdString);
    if (cachedCoin) {
      // Update individual cache too
      priceCache.set(coinIdString, {
        data: cachedCoin,
        timestamp: Date.now()
      });
      return cachedCoin;
    }
  }
  
  // Return a promise that will be resolved when the batch is processed
  return new Promise((resolve, reject) => {
    // Add to queue
    requestQueue.push({
      coinId: coinIdString,
      resolve,
      reject
    });
    
    // Start processing the queue after a delay (allows for batching)
    if (!processingQueue) {
      setTimeout(processQueue, QUEUE_PROCESS_DELAY);
    }
  });
}

/**
 * Get data for multiple coins by ID
 * This optimizes to use batch processing
 */
export async function getMultipleCoinsData(coinIds: (string | number)[]): Promise<Record<string, CoinData>> {
  if (coinIds.length === 0) {
    return {};
  }
  
  const result: Record<string, CoinData> = {};
  const missingCoinIds: string[] = [];
  
  // First check cache and top coins for all IDs
  for (const coinId of coinIds) {
    const coinIdString = String(coinId);
    
    // Check individual cache
    const cachedData = priceCache.get(coinIdString);
    if (cachedData && isCacheValid(cachedData.timestamp)) {
      result[coinIdString] = cachedData.data;
      continue;
    }
    
    // Check top coins cache
    if (topCoinsCache && isCacheValid(topCoinsCache.timestamp, TOP_COINS_CACHE_TTL)) {
      const cachedCoin = topCoinsCache.data.find(coin => coin.id === coinIdString);
      if (cachedCoin) {
        // Add to result and update individual cache
        result[coinIdString] = cachedCoin;
        priceCache.set(coinIdString, {
          data: cachedCoin,
          timestamp: Date.now()
        });
        continue;
      }
    }
    
    // If not found in any cache, add to list of coins to fetch
    missingCoinIds.push(coinIdString);
  }
  
  // If we still have coins to fetch, use batch API
  if (missingCoinIds.length > 0) {
    try {
      // Build parameters for batch request
      const idsParam = missingCoinIds.join(',');
      const response = await fetch(`${getBaseUrl()}/api/coin-data-batch?ids=${idsParam}`);
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      const apiResult = await response.json();
      
      if (!apiResult.success) {
        throw new Error(apiResult.error || 'Failed to fetch coin data');
      }
      
      // Add fetched coins to result and update cache
      for (const coinId of missingCoinIds) {
        if (apiResult.data[coinId]) {
          result[coinId] = apiResult.data[coinId];
          // Update cache
          priceCache.set(coinId, {
            data: apiResult.data[coinId],
            timestamp: Date.now()
          });
        }
      }
    } catch (error) {
      console.error('Error fetching multiple coins data:', error);
    }
  }
  
  return result;
}

/**
 * Helper to get BTC price
 */
export async function getBtcPrice(): Promise<number> {
  try {
    // Bitcoin is ID 1 on CMC - ensure it's treated as a string for consistency
    const btcData = await getCoinData('1');
    return btcData?.priceUsd || 0;
  } catch (error) {
    console.error('Error fetching BTC price:', error);
    return 0;
  }
}

/**
 * Helper to get ETH price
 */
export async function getEthPrice(): Promise<number> {
  try {
    // Ethereum is ID 1027 on CMC
    const ethData = await getCoinData('1027');
    return ethData?.priceUsd || 0;
  } catch (error) {
    console.error('Error fetching ETH price:', error);
    return 0;
  }
}

/**
 * Get global market data including BTC and ETH dominance
 */
export async function getGlobalData(): Promise<GlobalData | null> {
  // Check cache first with longer TTL
  if (globalDataCache && isCacheValid(globalDataCache.timestamp, GLOBAL_CACHE_TTL)) {
    return globalDataCache.data;
  }
  
  try {
    // Use our internal API endpoint
    const response = await fetch(`${getBaseUrl()}/api/global-data`);
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    const result = await response.json();
    
    if (!result.success || !result.data) {
      console.error('API returned error:', result.error);
      return null;
    }
    
    // Update cache with longer TTL
    globalDataCache = {
      data: result.data,
      timestamp: Date.now()
    };
    
    return result.data;
  } catch (error) {
    console.error('Error fetching global data:', error);
    return null;
  }
}

/**
 * Clear expired items from all caches
 * Call this periodically to prevent memory leaks
 */
export function cleanupCaches(): void {
  const now = Date.now();
  
  // Clean up price cache
  Array.from(priceCache.entries()).forEach(([key, value]) => {
    if (now - value.timestamp > CACHE_TTL) {
      priceCache.delete(key);
    }
  });
  
  // Clean up search results cache
  Array.from(searchResultsCache.entries()).forEach(([key, value]) => {
    if (now - value.timestamp > CACHE_TTL) {
      searchResultsCache.delete(key);
    }
  });
  
  // Reset global cache if expired
  if (globalDataCache && now - globalDataCache.timestamp > GLOBAL_CACHE_TTL) {
    globalDataCache = null;
  }
  
  // Reset top coins cache if expired
  if (topCoinsCache && now - topCoinsCache.timestamp > TOP_COINS_CACHE_TTL) {
    topCoinsCache = null;
  }
} 