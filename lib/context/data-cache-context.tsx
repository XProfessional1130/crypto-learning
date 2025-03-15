'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { GlobalData, getBtcPrice, getEthPrice, getGlobalData, fetchCoinData, fetchMultipleCoinsData } from '@/lib/services/coinmarketcap';
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
  
  // Function to refresh all cached data
  const refreshData = useCallback(async () => {
    if (isRefreshing) return;
    
    setIsRefreshing(true);
    
    try {
      const [newBtcPrice, newEthPrice, newGlobalData] = await Promise.all([
        getBtcPrice(),
        getEthPrice(),
        getGlobalData()
      ]);
      
      // Update state
      setBtcPrice(newBtcPrice);
      setEthPrice(newEthPrice);
      setGlobalData(newGlobalData);
      
      // Update cache
      storage.setItem('btcPrice', newBtcPrice);
      storage.setItem('ethPrice', newEthPrice);
      storage.setItem('globalData', newGlobalData);
      
      // Update last refresh time
      const now = new Date();
      setLastUpdated(now);
      
      console.log('Data cache refreshed successfully at', now.toLocaleTimeString());
    } catch (error) {
      console.error('Error refreshing data cache:', error);
    } finally {
      setIsRefreshing(false);
      setIsLoading(false);
    }
  }, [isRefreshing]);
  
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
    
    console.log('Data cache cleared');
  }, []);
  
  // Coin data functions
  const getCoinData = useCallback(async (coinId: string): Promise<CoinData | null> => {
    // Check if we have it cached
    if (coinDataCache[coinId]) {
      return coinDataCache[coinId];
    }
    
    // Not in the cache, so fetch it
    try {
      const data = await fetchCoinData(coinId);
      
      if (data) {
        // Update the cache
        setCoinDataCache(prev => {
          const updated = { ...prev, [coinId]: data };
          // Save to localStorage
          storage.setItem(COIN_DATA_KEY, updated);
          return updated;
        });
        
        return data;
      }
    } catch (error) {
      console.error(`Error fetching data for coin ${coinId}:`, error);
    }
    
    return null;
  }, [coinDataCache]);
  
  const getMultipleCoinsData = useCallback(async (coinIds: string[]): Promise<Record<string, CoinData>> => {
    if (!coinIds || coinIds.length === 0) {
      return {};
    }
    
    // Start with what we have in the cache
    const result: Record<string, CoinData> = {};
    const idsToFetch: string[] = [];
    
    coinIds.forEach(id => {
      if (coinDataCache[id]) {
        result[id] = coinDataCache[id];
      } else {
        idsToFetch.push(id);
      }
    });
    
    // If we have all the data in the cache, return it
    if (idsToFetch.length === 0) {
      return result;
    }
    
    // Otherwise, fetch the missing data
    try {
      const fetchedData = await fetchMultipleCoinsData(idsToFetch);
      
      // Update the cache with the new data
      if (Object.keys(fetchedData).length > 0) {
        setCoinDataCache(prev => {
          const updated = { ...prev, ...fetchedData };
          // Save to localStorage
          storage.setItem(COIN_DATA_KEY, updated);
          return updated;
        });
        
        // Merge with the cached data
        return { ...result, ...fetchedData };
      }
    } catch (error) {
      console.error('Error fetching multiple coins data:', error);
    }
    
    return result;
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