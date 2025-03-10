import { CoinData } from '@/types/portfolio';

// Cache settings
const CACHE_TTL = 15 * 60 * 1000; // 15 minutes
const priceCache = new Map<string, { data: CoinData; timestamp: number }>();
let globalDataCache: { data: GlobalData; timestamp: number } | null = null;

// Define global data type
export interface GlobalData {
  btcDominance: number;
  ethDominance: number;
  totalMarketCap: number;
  totalVolume24h: number;
}

// Helper function to check if cache is valid
const isCacheValid = (timestamp: number): boolean => {
  return Date.now() - timestamp < CACHE_TTL;
};

// Helper to get base URL based on environment
const getBaseUrl = (): string => {
  // In production, use actual host
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  return baseUrl;
};

/**
 * Search for coins using our internal API endpoint that connects to CoinMarketCap
 */
export async function searchCoins(query: string): Promise<CoinData[]> {
  if (!query.trim()) {
    return [];
  }

  try {
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
    
    return result.data;
  } catch (error) {
    console.error('Error searching coins:', error);
    return [];
  }
}

/**
 * Get data for a specific coin by ID using our internal API endpoint
 */
export async function getCoinData(coinId: string | number): Promise<CoinData | null> {
  // Ensure coinId is a string
  const coinIdString = String(coinId);
  
  // Check cache first
  const cachedData = priceCache.get(coinIdString);
  if (cachedData && isCacheValid(cachedData.timestamp)) {
    return cachedData.data;
  }
  
  try {
    // Use our internal API endpoint
    const response = await fetch(`${getBaseUrl()}/api/coin-data?id=${coinIdString}`);
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    const result = await response.json();
    
    if (!result.success || !result.data) {
      console.error('API returned error:', result.error);
      return null;
    }
    
    // Update cache
    priceCache.set(coinIdString, {
      data: result.data,
      timestamp: Date.now()
    });
    
    return result.data;
  } catch (error) {
    console.error('Error fetching coin data:', error);
    return null;
  }
}

/**
 * Get data for multiple coins by ID
 */
export async function getMultipleCoinsData(coinIds: (string | number)[]): Promise<Record<string, CoinData>> {
  if (coinIds.length === 0) {
    return {};
  }
  
  const result: Record<string, CoinData> = {};
  const fetchPromises: Promise<void>[] = [];
  
  for (const coinId of coinIds) {
    // Ensure we're using string IDs consistently
    const coinIdString = String(coinId);
    
    fetchPromises.push(
      getCoinData(coinIdString).then(data => {
        if (data) result[coinIdString] = data;
      })
    );
  }
  
  await Promise.all(fetchPromises);
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
  // Check cache first
  if (globalDataCache && isCacheValid(globalDataCache.timestamp)) {
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
    
    // Update cache
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