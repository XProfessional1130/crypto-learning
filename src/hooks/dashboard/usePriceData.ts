import { useState, useEffect, useCallback, useRef } from 'react';
import { CoinData } from '@/types/portfolio';
import { getMultipleCoinsData } from '@/lib/api/coinmarketcap';
import { logger } from '@/lib/utils/logger';

// Cache settings
const REFRESH_COOLDOWN = 30000; // 30 seconds between API requests
const PRICE_CACHE_DURATION = 2 * 60 * 1000; // 2 minutes for price data

// Global cache to share data between hook instances
const globalCache: {
  priceData: { [coinId: string]: { data: CoinData, timestamp: number } }
} = {
  priceData: {}
};

/**
 * Hook to fetch and manage coin price data
 * Handles fetching prices from API and caching
 */
export function usePriceData() {
  // State management
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  // Refs for tracking async operations
  const isMounted = useRef(true);
  const lastFetchTime = useRef<number>(0);
  
  // Check if we're under rate limit cooling period
  const isUnderCooldown = useCallback(() => {
    const now = Date.now();
    return (now - lastFetchTime.current) < REFRESH_COOLDOWN;
  }, []);
  
  // Check if price data for a coin is cached and fresh
  const isPriceCached = useCallback((coinId: string) => {
    const cachedData = globalCache.priceData[coinId];
    if (!cachedData) return false;
    
    const now = Date.now();
    return (now - cachedData.timestamp) < PRICE_CACHE_DURATION;
  }, []);
  
  // Get cached price data for a coin
  const getCachedPrice = useCallback((coinId: string): CoinData | null => {
    const cachedData = globalCache.priceData[coinId];
    if (!cachedData) return null;
    
    return cachedData.data;
  }, []);
  
  // Fetch price data for multiple coins
  const fetchPrices = useCallback(async (coinIds: string[], bypassCooldown = false): Promise<Map<string, CoinData>> => {
    // Check if we're under cooldown period and not bypassing
    if (isUnderCooldown() && !bypassCooldown) {
      logger.debug('Price fetch cooldown active, using cached data');
      
      // Return cached data for the requested coins
      const cachedResults = new Map<string, CoinData>();
      
      coinIds.forEach(coinId => {
        const cachedData = getCachedPrice(coinId);
        if (cachedData) {
          cachedResults.set(coinId, cachedData);
        }
      });
      
      return cachedResults;
    }
    
    // Filter out coins that are already cached with fresh data
    const coinsToFetch = coinIds.filter(coinId => !isPriceCached(coinId));
    
    if (coinsToFetch.length === 0) {
      logger.debug('All coin prices are cached, using cached data');
      
      // Return cached data for all requested coins
      const cachedResults = new Map<string, CoinData>();
      
      coinIds.forEach(coinId => {
        const cachedData = getCachedPrice(coinId);
        if (cachedData) {
          cachedResults.set(coinId, cachedData);
        }
      });
      
      return cachedResults;
    }
    
    // Start loading state if we're fetching data
    setIsLoading(true);
    setError(null);
    
    try {
      logger.debug('Fetching coin prices from API', { coinsToFetch });
      
      // Update the last fetch time
      lastFetchTime.current = Date.now();
      
      // Fetch data from API
      const freshData = await getMultipleCoinsData(coinsToFetch);
      
      if (isMounted.current) {
        // Combine fresh and cached data
        const results = new Map<string, CoinData>();
        
        // First add fresh data and update cache
        freshData.forEach(coin => {
          results.set(coin.id, coin);
          
          // Update cache
          globalCache.priceData[coin.id] = {
            data: coin,
            timestamp: Date.now()
          };
        });
        
        // Add cached data for coins that weren't fetched
        coinIds.forEach(coinId => {
          if (!results.has(coinId)) {
            const cachedData = getCachedPrice(coinId);
            if (cachedData) {
              results.set(coinId, cachedData);
            }
          }
        });
        
        return results;
      }
      
      return new Map();
    } catch (err) {
      logger.error('Error fetching coin prices', { error: err });
      if (isMounted.current) {
        setError(err instanceof Error ? err : new Error('Failed to fetch coin prices'));
      }
      return new Map();
    } finally {
      if (isMounted.current) {
        setIsLoading(false);
      }
    }
  }, [isUnderCooldown, isPriceCached, getCachedPrice]);
  
  // Clean up on unmount
  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);
  
  return {
    fetchPrices,
    getCachedPrice,
    isPriceCached,
    isLoading,
    error
  };
} 