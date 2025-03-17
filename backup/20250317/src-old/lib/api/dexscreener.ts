/**
 * DexScreener API Service
 * 
 * Note: This is a stub implementation as we're moving to CoinMarketCap.
 * Kept for backward compatibility with existing code.
 */

import axios from 'axios';
import { CoinData } from '@/types/portfolio';

const CACHE_TTL = 15 * 60 * 1000; // 15 minutes
const priceCache = new Map<string, { data: CoinData; timestamp: number }>();

// Helper function to check if cache is valid
const isCacheValid = (timestamp: number): boolean => {
  return Date.now() - timestamp < CACHE_TTL;
};

// Base URL for DexScreener API
const DEXSCREENER_API_URL = 'https://api.dexscreener.com/latest';

/**
 * Search tokens by query string
 * @param query Search query (token name, symbol, or address)
 * @returns Search results
 */
export async function searchTokens(query: string) {
  try {
    // Note: This is a simplified version as we're moving to CoinMarketCap
    console.warn('Using deprecated DexScreener service, please migrate to CoinMarketCap');
    
    const response = await axios.get(`${DEXSCREENER_API_URL}/dex/search`, {
      params: { q: query }
    });
    
    return {
      success: true,
      data: response.data,
      message: 'Success'
    };
  } catch (error) {
    console.error('Error searching tokens on DexScreener:', error);
    return {
      success: false,
      data: null,
      message: 'Failed to search tokens'
    };
  }
}

/**
 * Get token details by address
 * @param address Token contract address
 * @returns Token details
 */
export async function getTokenDetails(address: string) {
  try {
    // Note: This is a simplified version as we're moving to CoinMarketCap
    console.warn('Using deprecated DexScreener service, please migrate to CoinMarketCap');
    
    const response = await axios.get(`${DEXSCREENER_API_URL}/dex/tokens/${address}`);
    
    return {
      success: true,
      data: response.data,
      message: 'Success'
    };
  } catch (error) {
    console.error('Error getting token details from DexScreener:', error);
    return {
      success: false,
      data: null,
      message: 'Failed to get token details'
    };
  }
}

// Helper function to get BTC price
export async function getBtcPrice(): Promise<number> {
  try {
    const btcData = await getCoinData('0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599'); // WBTC address
    return btcData?.priceUsd || 0;
  } catch (error) {
    console.error('Error fetching BTC price:', error);
    return 0;
  }
}

export async function searchCoins(query: string): Promise<CoinData[]> {
  if (!query.trim()) {
    return [];
  }
  
  try {
    console.log(`Searching for coins with query: ${query}`);
    const response = await fetch(`https://api.dexscreener.com/latest/dex/search?q=${encodeURIComponent(query)}`, {
      headers: {
        'Accept': 'application/json',
      },
      cache: 'no-store'
    });
    
    if (!response.ok) {
      throw new Error(`Network response was not ok: ${response.status}`);
    }
    
    const data = await response.json();
    console.log(`Found ${data.pairs?.length || 0} pairs from DexScreener`);
    
    if (!data.pairs || !Array.isArray(data.pairs) || data.pairs.length === 0) {
      return [];
    }
    
    const btcPrice = await getBtcPrice();
    
    // Map results, with basic validation
    const results = data.pairs.slice(0, 20).map((pair: any) => {
      if (!pair || !pair.baseToken) return null;
      
      const priceUsd = parseFloat(pair.priceUsd) || 0;
      return {
        id: pair.baseToken.address,
        symbol: pair.baseToken.symbol,
        name: pair.baseToken.name || pair.baseToken.symbol,
        priceUsd,
        priceBtc: btcPrice > 0 ? priceUsd / btcPrice : 0,
        priceChange24h: parseFloat(pair.priceChange?.h24) || 0,
        marketCap: parseFloat(pair.liquidity?.usd) || 0,
        logoUrl: pair.baseToken.logoURI
      };
    }).filter(Boolean) as CoinData[];
    
    console.log(`Returning ${results.length} formatted results`);
    return results;
  } catch (error) {
    console.error('Error searching coins:', error);
    return [];
  }
}

export async function getCoinData(coinId: string): Promise<CoinData | null> {
  // Check cache first
  const cachedData = priceCache.get(coinId);
  if (cachedData && isCacheValid(cachedData.timestamp)) {
    return cachedData.data;
  }
  
  try {
    const response = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${coinId}`);
    if (!response.ok) throw new Error('Network response was not ok');
    
    const data = await response.json();
    const btcPrice = await getBtcPrice();
    
    if (!data.pairs || data.pairs.length === 0) {
      return null;
    }
    
    const pair = data.pairs[0];
    const priceUsd = parseFloat(pair.priceUsd) || 0;
    
    const coinData: CoinData = {
      id: coinId,
      symbol: pair.baseToken.symbol,
      name: pair.baseToken.name || pair.baseToken.symbol,
      priceUsd,
      priceBtc: btcPrice > 0 ? priceUsd / btcPrice : 0,
      priceChange24h: parseFloat(pair.priceChange.h24) || 0,
      marketCap: parseFloat(pair.liquidity?.usd) || 0,
      logoUrl: pair.baseToken.logoURI
    };
    
    // Update cache
    priceCache.set(coinId, {
      data: coinData,
      timestamp: Date.now()
    });
    
    return coinData;
  } catch (error) {
    console.error('Error fetching coin data:', error);
    return null;
  }
}

export async function getMultipleCoinsData(coinIds: string[]): Promise<Record<string, CoinData>> {
  const result: Record<string, CoinData> = {};
  const fetchPromises: Promise<void>[] = [];
  
  for (const coinId of coinIds) {
    fetchPromises.push(
      getCoinData(coinId).then(data => {
        if (data) result[coinId] = data;
      })
    );
  }
  
  await Promise.all(fetchPromises);
  return result;
} 