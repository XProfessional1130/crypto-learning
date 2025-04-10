import { CoinData } from '@/types/portfolio';
import { 
  getBtcPriceFromSupabase, 
  getEthPriceFromSupabase, 
  getGlobalDataFromSupabase,
  fetchCoinDataFromSupabase
} from './supabase-crypto';

// Singleton pattern for service initialization
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
  
  // Fear & Greed Index
  fearGreedValue?: number;
  fearGreedClassification?: string;
  fearGreedTimestamp?: string;
  
  // On-chain activity
  activeAddressesCount?: number;
  activeAddressesChange24h?: number;
  activeAddressesTimestamp?: string;
  
  // Whale transactions
  largeTransactionsCount?: number;
  largeTransactionsChange24h?: number;
  largeTransactionsTimestamp?: string;
  
  // Additional market metrics
  altcoinDominance?: number;
  totalCryptocurrencies?: number;
  totalExchanges?: number;
}

// Helper to handle API response and error handling
const fetchWithErrorHandling = async (url: string) => {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`Error fetching from ${url}:`, error);
    throw error;
  }
};

// Add initialization tracking
let isServiceInitialized = false;
let isServiceInitializing = false;

/**
 * Initialize the service by prefetching global data
 * Call this at app startup
 * 
 * UPDATED: Now uses Supabase data sources instead of direct API calls
 */
export async function initCoinDataService(): Promise<void> {
  // Prevent multiple initializations and concurrent initializations
  if (isServiceInitialized) {
    console.log('Coin data service already initialized, skipping...');
    return;
  }

  if (isServiceInitializing) {
    console.log('Coin data service initialization already in progress, skipping duplicate call');
    return;
  }
  
  isServiceInitializing = true;
  console.log('Initializing coin data service (using Supabase)...');
  
  try {
    // Prefetch basic market data to initialize the service
    console.log('Prefetching basic market data from Supabase...');
    
    // Use a Promise.allSettled to handle any potential API errors gracefully
    const [globalDataResult, btcDataResult, ethDataResult] = await Promise.allSettled([
      // Now use Supabase data sources
      getGlobalDataFromSupabase().catch(err => {
        console.warn('Error prefetching global data from Supabase:', err);
        return null;
      }),
      getBtcPriceFromSupabase().catch(err => {
        console.warn('Error prefetching BTC data from Supabase:', err);
        return null;
      }),
      getEthPriceFromSupabase().catch(err => {
        console.warn('Error prefetching ETH data from Supabase:', err);
        return null;
      })
    ]);
    
    // Process global data result
    let globalData = null;
    if (globalDataResult.status === 'fulfilled' && globalDataResult.value) {
      globalData = globalDataResult.value;
      console.log('Global data prefetched from Supabase:', globalData);
    } else {
      console.warn('Global data could not be prefetched from Supabase');
    }
    
    // Process BTC price result
    let btcPrice = 0;
    if (btcDataResult.status === 'fulfilled' && btcDataResult.value && btcDataResult.value > 0) {
      btcPrice = btcDataResult.value;
    }
    console.log('BTC price from Supabase:', btcPrice);
    
    // Process ETH price result
    let ethPrice = 0;
    if (ethDataResult.status === 'fulfilled' && ethDataResult.value && ethDataResult.value > 0) {
      ethPrice = ethDataResult.value;
    }
    console.log('ETH price from Supabase:', ethPrice);
    
    // Set service initialized flag only if we got valid data
    if (btcPrice > 0 || ethPrice > 0 || globalData) {
      console.log('Coin data service initialized with Supabase data');
      isServiceInitialized = true;
    } else {
      console.warn('Supabase data prefetch did not yield valid data');
    }
  } catch (error) {
    console.error('Error initializing coin data service with Supabase:', error);
  } finally {
    isServiceInitializing = false;
  }
}

/**
 * Check if the service is initialized
 */
export function isCoinDataServiceInitialized(): boolean {
  return isServiceInitialized;
}

/**
 * Get Bitcoin price in USD
 */
export async function getBtcPrice(): Promise<number> {
  try {
    const data = await fetchCoinData('1'); // Bitcoin's ID is 1
    return data?.priceUsd || 0;
  } catch (error) {
    console.error('Error fetching BTC price:', error);
    return 0;
  }
}

/**
 * Get Ethereum price in USD
 */
export async function getEthPrice(): Promise<number> {
  try {
    const data = await fetchCoinData('1027'); // Ethereum's ID is 1027
    return data?.priceUsd || 0;
  } catch (error) {
    console.error('Error fetching ETH price:', error);
    return 0;
  }
}

/**
 * Get global market data
 */
export async function getGlobalData(): Promise<GlobalData> {
  try {
    console.log('Fetching global market data...');
    const response = await fetch('/api/global-data');
    
    if (!response.ok) {
      console.error(`Error fetching global data: ${response.status} ${response.statusText}`);
      throw new Error(`Error fetching global data: ${response.status}`);
    }
    
    const responseData = await response.json();
    
    if (!responseData.success || !responseData.data) {
      console.error('Failed to get global market data, API returned:', responseData);
      throw new Error('Failed to get global market data');
    }
    
    // Process the global data and ensure values are numbers
    // Use safe Number conversion and provide defaults of 0
    const globalData: GlobalData = {
      btcDominance: parseFloat(responseData.data.btcDominance) || 0,
      ethDominance: parseFloat(responseData.data.ethDominance) || 0,
      totalMarketCap: parseFloat(responseData.data.totalMarketCap) || 0,
      totalVolume24h: parseFloat(responseData.data.totalVolume24h) || 0
    };
    
    // Validate that all properties have valid number values
    if (isNaN(globalData.btcDominance)) globalData.btcDominance = 0;
    if (isNaN(globalData.ethDominance)) globalData.ethDominance = 0;
    if (isNaN(globalData.totalMarketCap)) globalData.totalMarketCap = 0;
    if (isNaN(globalData.totalVolume24h)) globalData.totalVolume24h = 0;
    
    // Log successful data retrieval to help with debugging
    console.log('Global market data successfully fetched:', {
      btcDominance: globalData.btcDominance,
      ethDominance: globalData.ethDominance
    });
    
    return globalData;
  } catch (error) {
    console.error('Error fetching global market data:', error);
    // Return default values when the API call fails
    return {
      btcDominance: 0,
      ethDominance: 0,
      totalMarketCap: 0,
      totalVolume24h: 0
    };
  }
}

/**
 * Fetch data for a single coin by ID from API
 * This is the underlying fetch function that should be used by the DataCacheProvider
 */
export async function fetchCoinData(coinId: string): Promise<CoinData | null> {
  try {
    const response = await fetch(`/api/coin-data?id=${coinId}`);
    
    if (!response.ok) {
      throw new Error(`Error fetching coin data: ${response.status}`);
    }
    
    const responseData = await response.json();
    
    if (!responseData.success || !responseData.data) {
      throw new Error(`Failed to get data for coin ${coinId}`);
    }
    
    const data = responseData.data;
    
    // Process the coin data
    const coinData: CoinData = {
      id: String(data.id),
      name: data.name,
      symbol: data.symbol,
      priceUsd: data.priceUsd || 0,
      priceBtc: data.priceBtc || 0,
      priceChange24h: data.priceChange24h || 0,
      marketCap: data.marketCap || 0,
      volume24h: data.liquidity || 0,
      logoUrl: data.logoUrl || `https://s2.coinmarketcap.com/static/img/coins/64x64/${data.id}.png`
    };
    
    return coinData;
  } catch (error) {
    console.error(`Error fetching data for coin ${coinId}:`, error);
    return null;
  }
}

/**
 * Fetch data for multiple coins by ID from API
 * This is the underlying fetch function that should be used by the DataCacheProvider
 */
export async function fetchMultipleCoinsData(coinIds: string[]): Promise<Record<string, CoinData>> {
  if (!coinIds || coinIds.length === 0) {
    return {};
  }
  
  try {
    // Process in batches to prevent too many IDs in URL
    const results: Record<string, CoinData> = {};
    
    // Chunk the coin IDs
    for (let i = 0; i < coinIds.length; i += BATCH_SIZE) {
      const batch = coinIds.slice(i, i + BATCH_SIZE);
      const response = await fetch(`/api/coin-data-batch?ids=${batch.join(',')}`);
      
      if (!response.ok) {
        throw new Error(`Error fetching batch of coins: ${response.status}`);
      }
      
      const responseData = await response.json();
      
      if (!responseData.success || !responseData.data) {
        throw new Error('Failed to get data for coin batch');
      }
      
      const data = responseData.data;
      
      // Process each coin in the batch
      Object.keys(data).forEach((coinId) => {
        const coin = data[coinId];
        const coinData: CoinData = {
          id: String(coin.id),
          name: coin.name,
          symbol: coin.symbol,
          priceUsd: coin.priceUsd || 0,
          priceBtc: coin.priceBtc || 0,
          priceChange24h: coin.priceChange24h || 0,
          marketCap: coin.marketCap || 0,
          volume24h: coin.liquidity || 0,
          logoUrl: coin.logoUrl || `https://s2.coinmarketcap.com/static/img/coins/64x64/${coin.id}.png`
        };
        
        results[String(coin.id)] = coinData;
      });
    }
    
    return results;
  } catch (error) {
    console.error('Error fetching multiple coins data:', error);
    return {};
  }
}

/**
 * Search for coins by keyword
 */
export async function searchCoins(query: string): Promise<CoinData[]> {
  if (!query || query.trim().length < 2) {
    return [];
  }
  
  try {
    const response = await fetch(`/api/coin-search?query=${encodeURIComponent(query)}`);
    
    if (!response.ok) {
      throw new Error(`Error searching coins: ${response.status}`);
    }
    
    const responseData = await response.json();
    
    if (!responseData.success || !responseData.data) {
      throw new Error('Failed to search coins');
    }
    
    // Process search results
    return responseData.data.map((item: any) => ({
      id: String(item.id),
      name: item.name,
      symbol: item.symbol,
      priceUsd: item.priceUsd || 0,
      priceBtc: item.priceBtc || 0,
      priceChange24h: item.priceChange24h || 0,
      marketCap: item.marketCap || 0,
      volume24h: item.liquidity || 0,
      logoUrl: item.logoUrl || `https://s2.coinmarketcap.com/static/img/coins/64x64/${item.id}.png`
    }));
  } catch (error) {
    console.error('Error searching coins:', error);
    return [];
  }
}

/**
 * Get the top cryptocurrencies by market cap
 */
export async function getTopCoins(limit = 100): Promise<CoinData[]> {
  try {
    const response = await fetch(`/api/coin-list?limit=${limit}`);
    
    if (!response.ok) {
      throw new Error(`Error fetching top coins: ${response.status}`);
    }
    
    const responseData = await response.json();
    
    if (!responseData.success || !responseData.data) {
      throw new Error('Failed to get top coins');
    }
    
    // Process the top coins data
    return responseData.data.map((coin: any) => ({
      id: String(coin.id),
      name: coin.name,
      symbol: coin.symbol,
      priceUsd: coin.priceUsd || 0,
      priceBtc: coin.priceBtc || 0,
      priceChange24h: coin.priceChange24h || 0,
      marketCap: coin.marketCap || 0,
      volume24h: coin.liquidity || 0,
      logoUrl: coin.logoUrl || `https://s2.coinmarketcap.com/static/img/coins/64x64/${coin.id}.png`
    }));
  } catch (error) {
    console.error('Error fetching top coins:', error);
    return [];
  }
} 