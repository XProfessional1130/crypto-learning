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
  
  // Initialize the cache from localStorage
  useEffect(() => {
    const loadCachedData = () => {
      // Load global market data
      const cachedBtcPrice = storage.getItem<number>('btcPrice');
      const cachedEthPrice = storage.getItem<number>('ethPrice');
      const cachedGlobalData = storage.getItem<GlobalData>('globalData');
      
      // Load cached coin data
      const cachedCoinData = storage.getItem<Record<string, CoinData>>(COIN_DATA_KEY);
      
      // Set state from cache if valid
      if (cachedBtcPrice && storage.isCacheValid(cachedBtcPrice)) {
        setBtcPrice(cachedBtcPrice.data);
      }
      
      if (cachedEthPrice && storage.isCacheValid(cachedEthPrice)) {
        setEthPrice(cachedEthPrice.data);
      }
      
      if (cachedGlobalData && storage.isCacheValid(cachedGlobalData)) {
        setGlobalData(cachedGlobalData.data);
      }
      
      if (cachedCoinData && storage.isCacheValid(cachedCoinData)) {
        setCoinDataCache(cachedCoinData.data);
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
    };
    
    loadCachedData();
    
    // Fetch fresh data if needed
    refreshDataIfNeeded();
    
    // Set up auto-refresh interval
    const intervalId = setInterval(() => {
      refreshDataIfNeeded();
    }, CACHE_DURATION / 2); // Refresh halfway through cache duration
    
    return () => {
      clearInterval(intervalId);
    };
  }, []);
  
  // Check if we need to refresh any data
  const refreshDataIfNeeded = useCallback(async () => {
    const cachedBtcPrice = storage.getItem<number>('btcPrice');
    const cachedEthPrice = storage.getItem<number>('ethPrice');
    const cachedGlobalData = storage.getItem<GlobalData>('globalData');
    
    const needsRefresh = !cachedBtcPrice || !cachedEthPrice || !cachedGlobalData || 
                         !storage.isCacheValid(cachedBtcPrice) ||
                         !storage.isCacheValid(cachedEthPrice) ||
                         !storage.isCacheValid(cachedGlobalData);
    
    if (needsRefresh) {
      await refreshData();
    } else {
      // Data is already loaded from cache and is valid
      setIsLoading(false);
    }
  }, []);
  
  // Function to refresh all cached data - Now uses Supabase instead of CMC API
  const refreshData = useCallback(async () => {
    if (isRefreshing) return;
    
    setIsRefreshing(true);
    const verbose = process.env.NODE_ENV === 'development';
    
    if (verbose) {
      console.log('🔄 Refreshing data cache...');
    }
    
    try {
      // Try to get data from Supabase with proper error handling for each call
      let newBtcPrice = null;
      let newEthPrice = null;
      let newGlobalData = null;
      
      try {
        if (verbose) {
          console.log('Attempting to fetch BTC price from Supabase...');
        }
        // Use Supabase data source instead of direct API calls
        newBtcPrice = await getBtcPriceFromSupabase();
        
        // Validate the data - if it's 0 or null, we didn't get a valid price
        if (newBtcPrice <= 0) {
          console.warn('⚠️ Received invalid/zero BTC price from Supabase');
          // Don't set to null - keep existing data if any
          if (btcPrice && btcPrice > 0) {
            newBtcPrice = btcPrice;
            if (verbose) {
              console.log('Using cached BTC price:', newBtcPrice);
            }
          }
        } else {
          if (verbose) {
            console.log('✅ Successfully fetched BTC price from Supabase:', newBtcPrice);
          }
        }
      } catch (btcError) {
        console.error('❌ Error fetching BTC price from Supabase:', btcError);
        // Fall back to cached value if available
        if (btcPrice && btcPrice > 0) {
          if (verbose) {
            console.log('Using cached BTC price:', btcPrice);
          }
          newBtcPrice = btcPrice;
        }
      }
      
      // If we didn't get a valid price from Supabase, try the API
      if (newBtcPrice === null || newBtcPrice <= 0) {
        try {
          if (verbose) {
            console.log('Falling back to CoinMarketCap API for BTC price');
          }
          newBtcPrice = await getBtcPrice();
          if (verbose) {
            console.log('✅ Successfully fetched BTC price from API fallback:', newBtcPrice);
          }
        } catch (apiBtcError) {
          console.error('❌ Error fetching BTC price from API fallback:', apiBtcError);
          // Fall back to cached value if available
          if (btcPrice && btcPrice > 0) {
            if (verbose) {
              console.log('Using cached BTC price:', btcPrice);
            }
            newBtcPrice = btcPrice;
          }
        }
      }
      
      try {
        if (verbose) {
          console.log('Attempting to fetch ETH price from Supabase...');
        }
        // Use Supabase data source instead of direct API calls
        newEthPrice = await getEthPriceFromSupabase();
        
        // Validate the data - if it's 0 or null, we didn't get a valid price
        if (newEthPrice <= 0) {
          console.warn('⚠️ Received invalid/zero ETH price from Supabase');
          // Don't set to null - keep existing data if any
          if (ethPrice && ethPrice > 0) {
            newEthPrice = ethPrice;
            if (verbose) {
              console.log('Using cached ETH price:', newEthPrice);
            }
          }
        } else {
          if (verbose) {
            console.log('✅ Successfully fetched ETH price from Supabase:', newEthPrice);
          }
        }
      } catch (ethError) {
        console.error('❌ Error fetching ETH price from Supabase:', ethError);
        // Fall back to cached value if available
        if (ethPrice && ethPrice > 0) {
          if (verbose) {
            console.log('Using cached ETH price:', ethPrice);
          }
          newEthPrice = ethPrice;
        }
      }
      
      // If we didn't get a valid price from Supabase, try the API
      if (newEthPrice === null || newEthPrice <= 0) {
        try {
          if (verbose) {
            console.log('Falling back to CoinMarketCap API for ETH price');
          }
          newEthPrice = await getEthPrice();
          if (verbose) {
            console.log('✅ Successfully fetched ETH price from API fallback:', newEthPrice);
          }
        } catch (apiEthError) {
          console.error('❌ Error fetching ETH price from API fallback:', apiEthError);
          // Fall back to cached value if available
          if (ethPrice && ethPrice > 0) {
            if (verbose) {
              console.log('Using cached ETH price:', ethPrice);
            }
            newEthPrice = ethPrice;
          }
        }
      }
      
      try {
        if (verbose) {
          console.log('Attempting to fetch global market data from Supabase...');
        }
        // Use Supabase data source instead of direct API calls
        newGlobalData = await getGlobalDataFromSupabase();
        
        // Validate global data - check if totalMarketCap is valid
        if (!newGlobalData || newGlobalData.totalMarketCap <= 0) {
          console.warn('⚠️ Received invalid global market data from Supabase');
          // Don't set to null - keep existing data if any
          if (globalData) {
            newGlobalData = globalData;
            if (verbose) {
              console.log('Using cached global market data');
            }
          }
        } else {
          if (verbose) {
            console.log('✅ Successfully fetched global market data from Supabase');
          }
        }
      } catch (globalError) {
        console.error('❌ Error fetching global market data from Supabase:', globalError);
        // Fall back to cached value if available
        if (globalData) {
          if (verbose) {
            console.log('Using cached global market data');
          }
          newGlobalData = globalData;
        }
      }
      
      // If we didn't get valid global data from Supabase, try the API
      if (newGlobalData === null || !newGlobalData || newGlobalData.totalMarketCap <= 0) {
        try {
          if (verbose) {
            console.log('Falling back to CoinMarketCap API for global market data');
          }
          newGlobalData = await getGlobalData();
          if (verbose) {
            console.log('✅ Successfully fetched global market data from API fallback');
          }
        } catch (apiGlobalError) {
          console.error('❌ Error fetching global market data from API fallback:', apiGlobalError);
          // Fall back to cached value if available
          if (globalData) {
            if (verbose) {
              console.log('Using cached global market data');
            }
            newGlobalData = globalData;
          }
        }
      }
      
      // Even if some data is missing, update what we have
      let dataUpdated = false;
      
      // Update state with new data if available
      if (newBtcPrice !== null && newBtcPrice > 0) {
        setBtcPrice(newBtcPrice);
        // Save to localStorage with proper format
        try {
          localStorage.setItem(`${STORAGE_KEY_PREFIX}btcPrice`, JSON.stringify({
            data: newBtcPrice,
            timestamp: Date.now()
          }));
          if (verbose) {
            console.log('Updated BTC price in cache:', newBtcPrice);
          }
          dataUpdated = true;
        } catch (error) {
          console.error('Error saving BTC price to cache:', error);
        }
      }
      
      if (newEthPrice !== null && newEthPrice > 0) {
        setEthPrice(newEthPrice);
        // Save to localStorage with proper format
        try {
          localStorage.setItem(`${STORAGE_KEY_PREFIX}ethPrice`, JSON.stringify({
            data: newEthPrice,
            timestamp: Date.now()
          }));
          if (verbose) {
            console.log('Updated ETH price in cache:', newEthPrice);
          }
          dataUpdated = true;
        } catch (error) {
          console.error('Error saving ETH price to cache:', error);
        }
      }
      
      if (newGlobalData !== null && newGlobalData.totalMarketCap > 0) {
        setGlobalData(newGlobalData);
        // Save to localStorage with proper format
        try {
          localStorage.setItem(`${STORAGE_KEY_PREFIX}globalData`, JSON.stringify({
            data: newGlobalData,
            timestamp: Date.now()
          }));
          if (verbose) {
            console.log('Updated global market data in cache:', newGlobalData);
          }
          dataUpdated = true;
        } catch (error) {
          console.error('Error saving global market data to cache:', error);
        }
      }
      
      // Set last updated timestamp if any data was updated
      if (dataUpdated) {
        const now = new Date();
        setLastUpdated(now);
        if (verbose) {
          console.log('Cache refresh completed at:', now.toLocaleTimeString());
        }
      } else {
        if (verbose) {
          console.warn('No data was updated during refresh, keeping existing cache');
        }
      }
      
      // Always reset loading state even if no data was updated
      setIsLoading(false);
      
    } catch (error) {
      console.error('Fatal error during data refresh:', error);
      // Always reset loading state even on error
      setIsLoading(false);
    } finally {
      setIsRefreshing(false);
    }
  }, [isRefreshing, btcPrice, ethPrice, globalData]);
  
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
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`Getting data for ${coinIds.length} coins...`);
    }
    
    // Ensure all IDs are strings
    const normalizedIds = coinIds.map(id => String(id));
    
    // Start with what we have in the cache
    const result: Record<string, CoinData> = {};
    const idsToFetch: string[] = [];
    
    normalizedIds.forEach(id => {
      if (coinDataCache[id]) {
        if (process.env.NODE_ENV === 'development') {
          console.log(`Using cached data for coin ${id}`);
        }
        result[id] = coinDataCache[id];
      } else {
        idsToFetch.push(id);
      }
    });
    
    // If we have all the data in the cache, return it
    if (idsToFetch.length === 0) {
      if (process.env.NODE_ENV === 'development') {
        console.log('All requested coin data was in cache');
      }
      return result;
    }
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`Fetching data for ${idsToFetch.length} missing coins...`);
    }
    
    // Otherwise, fetch the missing data from Supabase
    try {
      // Try Supabase first
      let supabaseData: Record<string, CoinData> = {};
      try {
        if (process.env.NODE_ENV === 'development') {
          console.log(`Querying Supabase for coins: ${idsToFetch.join(', ')}`);
        }
        supabaseData = await fetchMultipleCoinsDataFromSupabase(idsToFetch);
        if (process.env.NODE_ENV === 'development') {
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