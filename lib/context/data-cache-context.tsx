'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
// Import both the original CMC services and our new Supabase services
import { GlobalData, getBtcPrice, getEthPrice, getGlobalData, fetchCoinData, fetchMultipleCoinsData } from '@/lib/services/coinmarketcap';
import { 
  getBtcPriceFromSupabase, 
  getEthPriceFromSupabase, 
  getGlobalDataFromSupabase,
  fetchCoinDataFromSupabase,
  fetchMultipleCoinsDataFromSupabase
} from '@/lib/services/supabase-crypto';
import { CoinData } from '@/types/portfolio';

// Cache constants
const CACHE_DURATION = 15 * 60 * 1000; // 15 minutes in milliseconds
const STORAGE_KEY_PREFIX = 'lc_data_cache_';
const COIN_DATA_KEY = 'coinData';

// Types for the cached data
interface CachedItem<T> {
  data: T;
  timestamp: number;
}

interface DataCache {
  btcPrice: CachedItem<number> | null;
  ethPrice: CachedItem<number> | null;
  globalData: CachedItem<GlobalData> | null;
  coinData: CachedItem<Record<string, CoinData>> | null;
}

// Context interface
interface DataCacheContextType {
  // Market data
  btcPrice: number | null;
  ethPrice: number | null;
  globalData: GlobalData | null;
  
  // Coin data
  getCoinData: (coinId: string) => Promise<CoinData | null>;
  getMultipleCoinsData: (coinIds: string[]) => Promise<Record<string, CoinData>>;
  setCoinData: (coinId: string, data: CoinData) => void;
  setMultipleCoinsData: (coinsData: Record<string, CoinData>) => void;
  
  // State indicators
  isLoading: boolean;
  isRefreshing: boolean;
  lastUpdated: Date | null;
  
  // Actions
  refreshData: () => Promise<void>;
  clearCache: () => void;
}

// Create the context
const DataCacheContext = createContext<DataCacheContextType | null>(null);

// Create a hook for using the context
export function useDataCache() {
  const context = useContext(DataCacheContext);
  if (!context) {
    throw new Error('useDataCache must be used within a DataCacheProvider');
  }
  return context;
}

// Storage utility functions
const storage = {
  getItem<T>(key: string): CachedItem<T> | null {
    if (typeof window === 'undefined') return null;
    
    try {
      const item = localStorage.getItem(`${STORAGE_KEY_PREFIX}${key}`);
      return item ? JSON.parse(item) : null;
    } catch (error) {
      console.error(`Error retrieving ${key} from cache:`, error);
      return null;
    }
  },
  
  setItem<T>(key: string, data: T): void {
    if (typeof window === 'undefined') return;
    
    try {
      const cachedItem: CachedItem<T> = {
        data,
        timestamp: Date.now()
      };
      localStorage.setItem(`${STORAGE_KEY_PREFIX}${key}`, JSON.stringify(cachedItem));
    } catch (error) {
      console.error(`Error storing ${key} in cache:`, error);
    }
  },
  
  removeItem(key: string): void {
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.removeItem(`${STORAGE_KEY_PREFIX}${key}`);
    } catch (error) {
      console.error(`Error removing ${key} from cache:`, error);
    }
  },
  
  isCacheValid<T>(cachedItem: CachedItem<T> | null): boolean {
    if (!cachedItem) return false;
    return (Date.now() - cachedItem.timestamp) < CACHE_DURATION;
  }
};

// Global type declaration for the window object
declare global {
  interface Window {
    __DATA_SERVICE_INITIALIZING__?: boolean;
    __DATA_SERVICE_INITIALIZED__?: boolean;
    __LC_DATA_CACHE_HELPER__?: (coinIds: string[]) => Promise<Record<string, CoinData>>;
  }
}

// Create persistent utility function - only needs to be set once
let cachedMultipleCoinsDataFn: ((coinIds: string[]) => Promise<Record<string, CoinData>>) | null = null;

// Provider component
export function DataCacheProvider({ children }: { children: ReactNode }) {
  // State
  const [btcPrice, setBtcPrice] = useState<number | null>(null);
  const [ethPrice, setEthPrice] = useState<number | null>(null);
  const [globalData, setGlobalData] = useState<GlobalData | null>(null);
  const [coinDataCache, setCoinDataCache] = useState<Record<string, CoinData>>({});
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  
  // Add failsafe timer to ensure we always exit loading state faster (reduced from 5000ms to 2000ms)
  useEffect(() => {
    if (isLoading) {
      const timeoutId = setTimeout(() => {
        console.log('DataCache: Forcing exit from loading state after timeout');
        setIsLoading(false);
        
        // Set fallback values if needed
        if (btcPrice === null) setBtcPrice(68000);
        if (ethPrice === null) setEthPrice(3500);
        if (globalData === null) {
          setGlobalData({
            totalMarketCap: 2500000000000,
            btcDominance: 52,
            ethDominance: 18,
            totalVolume24h: 98000000000
          });
        }
      }, 2000); // 2 seconds max loading time (reduced from 5 seconds)
      
      return () => clearTimeout(timeoutId);
    }
  }, [isLoading, btcPrice, ethPrice, globalData]);
  
  // Initialize the cache from localStorage
  useEffect(() => {
    const loadCachedData = () => {
      // Load global market data
      const cachedBtcPrice = storage.getItem<number>('btcPrice');
      const cachedEthPrice = storage.getItem<number>('ethPrice');
      const cachedGlobalData = storage.getItem<GlobalData>('globalData');
      
      // Load cached coin data
      const cachedCoinData = storage.getItem<Record<string, CoinData>>(COIN_DATA_KEY);
      
      let hasValidCache = false;
      
      // Set default values immediately to prevent white flash, then update with cache
      const defaultBtcPrice = 68000;
      const defaultEthPrice = 3500;
      const defaultGlobalData = {
        totalMarketCap: 2500000000000,
        btcDominance: 52,
        ethDominance: 18,
        totalVolume24h: 98000000000
      };
      
      // Start with defaults
      setBtcPrice(defaultBtcPrice);
      setEthPrice(defaultEthPrice);
      setGlobalData(defaultGlobalData);
      
      // Always set data from cache if available, even if expired
      // This ensures immediate display when navigating back to a page
      if (cachedBtcPrice) {
        setBtcPrice(cachedBtcPrice.data);
        hasValidCache = storage.isCacheValid(cachedBtcPrice) || hasValidCache;
      }
      
      if (cachedEthPrice) {
        setEthPrice(cachedEthPrice.data);
        hasValidCache = storage.isCacheValid(cachedEthPrice) || hasValidCache;
      }
      
      if (cachedGlobalData) {
        setGlobalData(cachedGlobalData.data);
        hasValidCache = storage.isCacheValid(cachedGlobalData) || hasValidCache;
      }
      
      if (cachedCoinData && storage.isCacheValid(cachedCoinData)) {
        setCoinDataCache(cachedCoinData.data);
        hasValidCache = storage.isCacheValid(cachedCoinData) || hasValidCache;
      }
      
      // Set last updated time
      const latestTimestamp = Math.max(
        cachedBtcPrice?.timestamp || 0,
        cachedEthPrice?.timestamp || 0,
        cachedGlobalData?.timestamp || 0,
        cachedCoinData?.timestamp || 0
      );
      
      if (latestTimestamp > 0) {
        setLastUpdated(new Date(latestTimestamp));
      }
      
      // If we have valid cache, we can hide the loading state immediately
      if (hasValidCache) {
        setIsLoading(false);
      } else {
        // Even without valid cache, exit loading state after a short delay
        // since we already set default values
        setTimeout(() => setIsLoading(false), 500);
      }
    };
    
    // Load the cache immediately
    loadCachedData();
    
    // Then check if we need to refresh, but with a longer delay to prevent double load
    // A small timeout prevents unnecessary refreshes during navigation
    const refreshTimeout = setTimeout(() => {
      if (isRefreshing) return; // Don't start a refresh if one is already in progress
      refreshDataIfNeeded();
    }, 2000); // Increased from 100ms to 2000ms to prevent double load
    
    // Set up auto-refresh interval with a much longer delay
    const intervalId = setInterval(() => {
      refreshDataIfNeeded();
    }, CACHE_DURATION / 2); // Refresh halfway through cache duration
    
    return () => {
      clearTimeout(refreshTimeout);
      clearInterval(intervalId);
    };
  }, []);
  
  // Check if we need to refresh any data
  const refreshDataIfNeeded = useCallback(async () => {
    // Skip if we're already refreshing
    if (isRefreshing) {
      return;
    }
    
    const cachedBtcPrice = storage.getItem<number>('btcPrice');
    const cachedEthPrice = storage.getItem<number>('ethPrice');
    const cachedGlobalData = storage.getItem<GlobalData>('globalData');
    
    // First set any data we already have from cache, even if it's stale
    // This ensures we always show something immediately after navigation
    if (cachedBtcPrice && !btcPrice) {
      setBtcPrice(cachedBtcPrice.data);
    }
    
    if (cachedEthPrice && !ethPrice) {
      setEthPrice(cachedEthPrice.data);
    }
    
    if (cachedGlobalData && !globalData) {
      setGlobalData(cachedGlobalData.data);
    }
    
    // Now determine if we need a background refresh - don't refresh if we already have valid data
    const needsRefresh = !cachedBtcPrice || !cachedEthPrice || !cachedGlobalData || 
                         !storage.isCacheValid(cachedBtcPrice) ||
                         !storage.isCacheValid(cachedEthPrice) ||
                         !storage.isCacheValid(cachedGlobalData);
    
    if (needsRefresh) {
      // Avoid showing loading state if we already have some data
      if (btcPrice || ethPrice) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
        setIsRefreshing(true);
      }
      
      // Signal that refresh is needed, but don't call refreshData here
      // The actual refresh will be handled in the refreshData function call
      // from the parent component
    } else {
      // Data is already loaded from cache and is valid
      setIsLoading(false);
    }
  }, [btcPrice, ethPrice, globalData, isRefreshing]); // Remove refreshData to fix circular dependency
  
  // Function to refresh all cached data - Now uses Supabase instead of CMC API
  const refreshData = useCallback(async () => {
    // Don't run multiple refreshes simultaneously
    if (isRefreshing) {
      return;
    }
    
    // Only set refreshing flag, NEVER go back to loading state once we have data
    setIsRefreshing(true);
    
    // Only log in development
    const verbose = false;
    
    try {
      // Try to get data from Supabase with proper error handling for each call
      let newBtcPrice = null;
      let newEthPrice = null;
      let newGlobalData = null;
      
      // Try all data sources in parallel to speed up the refresh
      const [btcResult, ethResult, globalResult] = await Promise.allSettled([
        // BTC Price
        (async () => {
          try {
            // First try Supabase
            const price = await getBtcPriceFromSupabase();
            if (price && price > 0) return price;
            
            // Fall back to API
            const apiPrice = await getBtcPrice();
            if (apiPrice && apiPrice > 0) return apiPrice;
            
            // Keep existing data if available
            if (btcPrice && btcPrice > 0) return btcPrice;
            
            // Last resort fallback
            return 68000;
          } catch (error) {
            // Keep existing data if available or use fallback
            return btcPrice || 68000;
          }
        })(),
        
        // ETH Price
        (async () => {
          try {
            // First try Supabase
            const price = await getEthPriceFromSupabase();
            if (price && price > 0) return price;
            
            // Fall back to API
            const apiPrice = await getEthPrice();
            if (apiPrice && apiPrice > 0) return apiPrice;
            
            // Keep existing data if available
            if (ethPrice && ethPrice > 0) return ethPrice;
            
            // Last resort fallback
            return 3500;
          } catch (error) {
            // Keep existing data if available or use fallback
            return ethPrice || 3500;
          }
        })(),
        
        // Global Data
        (async () => {
          try {
            // First try Supabase
            const data = await getGlobalDataFromSupabase();
            if (data && data.totalMarketCap > 0) return data;
            
            // Fall back to API
            const apiData = await getGlobalData();
            if (apiData && apiData.totalMarketCap > 0) return apiData;
            
            // Keep existing data if available
            if (globalData) return globalData;
            
            // Last resort fallback
            return {
              totalMarketCap: 2500000000000,
              btcDominance: 52,
              ethDominance: 18,
              totalVolume24h: 98000000000
            };
          } catch (error) {
            // Keep existing data if available or use fallback
            return globalData || {
              totalMarketCap: 2500000000000,
              btcDominance: 52,
              ethDominance: 18,
              totalVolume24h: 98000000000
            };
          }
        })()
      ]);
      
      // Process results
      if (btcResult.status === 'fulfilled' && btcResult.value) {
        newBtcPrice = btcResult.value;
      }
      
      if (ethResult.status === 'fulfilled' && ethResult.value) {
        newEthPrice = ethResult.value;
      }
      
      if (globalResult.status === 'fulfilled' && globalResult.value) {
        newGlobalData = globalResult.value;
      }
      
      // Update the state and storage with the new values
      if (newBtcPrice && newBtcPrice > 0) {
        setBtcPrice(newBtcPrice);
        storage.setItem('btcPrice', newBtcPrice);
      }
      
      if (newEthPrice && newEthPrice > 0) {
        setEthPrice(newEthPrice);
        storage.setItem('ethPrice', newEthPrice);
      }
      
      if (newGlobalData) {
        setGlobalData(newGlobalData);
        storage.setItem('globalData', newGlobalData);
      }
      
      // Update last updated timestamp
      const now = new Date();
      setLastUpdated(now);
      
    } catch (error) {
      console.error('Error refreshing data cache:', error);
    } finally {
      // Always exit loading state
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [btcPrice, ethPrice, globalData, setIsLoading, setIsRefreshing, setLastUpdated]);
  
  // Function to clear the entire cache
  const clearCache = useCallback(() => {
    setBtcPrice(null);
    setEthPrice(null);
    setGlobalData(null);
    setCoinDataCache({});
    setLastUpdated(null);
    
    storage.removeItem('btcPrice');
    storage.removeItem('ethPrice');
    storage.removeItem('globalData');
    storage.removeItem(COIN_DATA_KEY);
    
    if (process.env.NODE_ENV === 'development') {
      console.log('Data cache cleared');
    }
  }, []);
  
  // Coin data functions - Now uses Supabase instead of CMC API
  const getCoinData = useCallback(async (coinId: string): Promise<CoinData | null> => {
    if (!coinId) {
      console.error('Invalid coinId provided to getCoinData:', coinId);
      return null;
    }
    
    // Ensure coinId is a string
    const coinIdStr = String(coinId);
    if (process.env.NODE_ENV === 'development') {
      console.log(`Getting data for coin ID: ${coinIdStr}`);
    }
    
    // Check if we have it cached
    if (coinDataCache[coinIdStr]) {
      if (process.env.NODE_ENV === 'development') {
        console.log(`Found cached data for coin ${coinIdStr}`);
      }
      return coinDataCache[coinIdStr];
    }
    
    // Not in the cache, so fetch it
    try {
      if (process.env.NODE_ENV === 'development') {
        console.log(`Fetching coin data for ${coinIdStr} from Supabase...`);
      }
      
      // Try Supabase first
      let coinData = null;
      try {
        coinData = await fetchCoinDataFromSupabase(coinIdStr);
        
        // Validate the data
        if (coinData && coinData.priceUsd > 0) {
          if (process.env.NODE_ENV === 'development') {
            console.log(`Successfully retrieved data for ${coinIdStr} from Supabase`);
          }
        } else {
          if (process.env.NODE_ENV === 'development') {
            console.warn(`Invalid or missing data for ${coinIdStr} from Supabase`);
          }
          coinData = null;
        }
      } catch (supabaseError) {
        if (process.env.NODE_ENV === 'development') {
          console.error(`Error fetching coin ${coinIdStr} from Supabase:`, supabaseError);
        }
        coinData = null;
      }
      
      // Fall back to API if Supabase doesn't have valid data
      if (!coinData) {
        try {
          if (process.env.NODE_ENV === 'development') {
            console.log(`Coin ${coinIdStr} not found in Supabase, falling back to API`);
          }
          coinData = await fetchCoinData(coinIdStr);
          
          if (coinData && coinData.priceUsd > 0) {
            if (process.env.NODE_ENV === 'development') {
              console.log(`Successfully retrieved data for ${coinIdStr} from API`);
            }
          } else {
            if (process.env.NODE_ENV === 'development') {
              console.warn(`Invalid or missing data for ${coinIdStr} from API`);
            }
            return null;
          }
        } catch (apiError) {
          if (process.env.NODE_ENV === 'development') {
            console.error(`Error fetching coin ${coinIdStr} from API:`, apiError);
          }
          return null;
        }
      }
      
      // If we have valid data by now, update the cache
      if (coinData) {
        if (process.env.NODE_ENV === 'development') {
          console.log(`Updating cache with data for coin ${coinIdStr}`);
        }
        setCoinDataCache(prev => {
          const updated = { ...prev, [coinIdStr]: coinData };
          // Save to localStorage
          storage.setItem(COIN_DATA_KEY, updated);
          return updated;
        });
        
        return coinData;
      }
      
      return null;
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error(`Unexpected error fetching coin ${coinIdStr}:`, error);
      }
      return null;
    }
  }, [coinDataCache]);
  
  const getMultipleCoinsData = useCallback(async (coinIds: string[]): Promise<Record<string, CoinData>> => {
    if (!coinIds || coinIds.length === 0) {
      return {};
    }
    
    const verbose = process.env.NODE_ENV === 'development';
    
    if (verbose) {
      console.log(`Getting data for ${coinIds.length} coins...`);
    }
    
    // Ensure all IDs are strings
    const normalizedIds = coinIds.map(id => String(id));
    
    // Start with what we have in the cache
    const result: Record<string, CoinData> = {};
    const idsToFetch: string[] = [];
    
    normalizedIds.forEach(id => {
      if (coinDataCache[id]) {
        // Only log in extreme verbose mode - this is too noisy for most debugging
        if (verbose && process.env.DEBUG_EXTREME_VERBOSE) {
          console.log(`Using cached data for coin ${id}`);
        }
        result[id] = coinDataCache[id];
      } else {
        idsToFetch.push(id);
      }
    });
    
    // If we have all the data in the cache, return it
    if (idsToFetch.length === 0) {
      if (verbose) {
        console.log('All requested coin data was in cache');
      }
      return result;
    }
    
    if (verbose) {
      console.log(`Fetching data for ${idsToFetch.length} missing coins...`);
    }
    
    // Otherwise, fetch the missing data from Supabase
    try {
      // Try Supabase first
      let supabaseData: Record<string, CoinData> = {};
      try {
        if (verbose) {
          // Log IDs in a more compact format if there are many
          const idsStr = idsToFetch.length > 5 
            ? `${idsToFetch.slice(0, 3).join(', ')}... and ${idsToFetch.length - 3} more`
            : idsToFetch.join(', ');
          console.log(`Querying Supabase for coins: ${idsStr}`);
        }
        supabaseData = await fetchMultipleCoinsDataFromSupabase(idsToFetch);
        if (verbose) {
          console.log(`Retrieved ${Object.keys(supabaseData).length} coins from Supabase`);
        }
      } catch (supabaseError) {
        if (process.env.NODE_ENV === 'development') {
          console.error('Error fetching multiple coins from Supabase:', supabaseError);
        }
        supabaseData = {};
      }
      
      // Check which IDs we still need to fetch from the API
      const fetchedIds = Object.keys(supabaseData);
      const stillMissingIds = idsToFetch.filter(id => !fetchedIds.includes(id));
      
      // If we still have missing IDs, try the API fallback
      let apiData: Record<string, CoinData> = {};
      if (stillMissingIds.length > 0) {
        try {
          if (process.env.NODE_ENV === 'development') {
            console.log(`Falling back to API for ${stillMissingIds.length} missing coins: ${stillMissingIds.join(', ')}`);
          }
          apiData = await fetchMultipleCoinsData(stillMissingIds);
          if (process.env.NODE_ENV === 'development') {
            console.log(`Retrieved ${Object.keys(apiData).length} coins from API`);
          }
        } catch (apiError) {
          if (process.env.NODE_ENV === 'development') {
            console.error('Error fetching coins from API fallback:', apiError);
          }
          apiData = {};
        }
      }
      
      // Combine all the fetched data
      const allFetchedData = { ...supabaseData, ...apiData };
      
      // Update the cache with the new data
      if (Object.keys(allFetchedData).length > 0) {
        if (process.env.NODE_ENV === 'development') {
          console.log(`Updating cache with ${Object.keys(allFetchedData).length} coins`);
        }
        setCoinDataCache(prev => {
          const updated = { ...prev, ...allFetchedData };
          // Save to localStorage
          storage.setItem(COIN_DATA_KEY, updated);
          return updated;
        });
      }
      
      // Merge with the cached data for the final result
      const finalResult = { ...result, ...allFetchedData };
      
      // Log any coins we couldn't find data for
      const foundIds = Object.keys(finalResult);
      const missingIds = normalizedIds.filter(id => !foundIds.includes(id));
      if (missingIds.length > 0) {
        if (process.env.NODE_ENV === 'development') {
          console.warn(`Could not find data for ${missingIds.length} coins: ${missingIds.join(', ')}`);
        }
      }
      
      return finalResult;
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Unexpected error in getMultipleCoinsData:', error);
      }
      return result; // Return what we have from the cache
    }
  }, [coinDataCache]);
  
  const setCoinData = useCallback((coinId: string, data: CoinData) => {
    setCoinDataCache(prev => {
      const updated = { ...prev, [coinId]: data };
      // Update the cache in localStorage
      storage.setItem(COIN_DATA_KEY, updated);
      return updated;
    });
  }, []);
  
  const setMultipleCoinsData = useCallback((coinsData: Record<string, CoinData>) => {
    setCoinDataCache(prev => {
      const updated = { ...prev, ...coinsData };
      // Update the cache in localStorage
      storage.setItem(COIN_DATA_KEY, updated);
      return updated;
    });
  }, []);
  
  // Set up the global helper function for non-React components to access the cache
  useEffect(() => {
    // Only set the global helper once and only in the browser
    if (typeof window !== 'undefined' && !window.__LC_DATA_CACHE_HELPER__) {
      if (process.env.NODE_ENV === 'development') {
        console.log('Setting up global DataCache helper function');
      }
      
      // Store the function in the persistent variable
      cachedMultipleCoinsDataFn = getMultipleCoinsData;
      
      // Add it to the window for global access
      window.__LC_DATA_CACHE_HELPER__ = async (coinIds: string[]) => {
        if (cachedMultipleCoinsDataFn) {
          return cachedMultipleCoinsDataFn(coinIds);
        }
        return {};
      };
    }
  }, [getMultipleCoinsData]);
  
  // Create the context value
  const contextValue: DataCacheContextType = {
    btcPrice,
    ethPrice,
    globalData,
    getCoinData,
    getMultipleCoinsData,
    setCoinData,
    setMultipleCoinsData,
    isLoading,
    isRefreshing,
    lastUpdated,
    refreshData,
    clearCache
  };
  
  return (
    <DataCacheContext.Provider value={contextValue}>
      {children}
    </DataCacheContext.Provider>
  );
} 