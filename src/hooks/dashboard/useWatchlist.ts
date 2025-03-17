import { useState, useEffect, useCallback, useRef } from 'react';
import { CoinData } from '@/types/portfolio';
import { useAuth } from '@/lib/providers/auth-provider';
import { 
  fetchWatchlist as fetchWatchlistFromDB, 
  addToWatchlist as addToWatchlistInDB,
  updatePriceTarget as updatePriceTargetInDB,
  removeFromWatchlist as removeFromWatchlistInDB
} from '@/lib/api/watchlist';
import { useToast } from '@/hooks/ui/useToast';
import { useDataCache } from '@/lib/providers/data-cache-provider';
import supabase from '@/lib/api/supabase-client';

// Define watchlist item type
export interface WatchlistItem {
  id: string;
  coinId: string;  // Added coinId to track the CoinMarketCap ID
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  icon: string;
  priceTarget?: number;
  createdAt?: string;
}

// Cache settings
const REFRESH_COOLDOWN = 30000; // 30 seconds between API requests (increased from 10s)
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes (increased from 5)
const PRICE_CACHE_DURATION = 2 * 60 * 1000; // 2 minutes for price data

// Global cache to share data between hook instances
const globalCache: {
  watchlistItems: { [userId: string]: { data: WatchlistItem[], timestamp: number } },
  priceData: { [coinId: string]: { data: any, timestamp: number } }
} = {
  watchlistItems: {},
  priceData: {}
};

/**
 * Hook to manage a user's coin watchlist with optimized caching and API calls
 */
export function useWatchlist() {
  const { user } = useAuth();
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const lastRefreshRef = useRef<number>(0);
  const localCacheRef = useRef<{data: WatchlistItem[], timestamp: number} | null>(null);
  const toast = useToast();
  
  // Use DataCacheProvider for coin data
  const { getMultipleCoinsData } = useDataCache();
  
  // Fetch the base watchlist data from the database (without prices)
  const fetchBaseWatchlist = useCallback(async () => {
    if (!user) return [];
    
    try {
      // Fetch watchlist items from the database
      return await fetchWatchlistFromDB();
    } catch (err) {
      console.error('Error fetching base watchlist:', err);
      throw err;
    }
  }, [user]);
  
  // Fetch watchlist from database
  const fetchWatchlistFromDB = useCallback(async () => {
    if (!user) return [];
    
    try {
      // First check if table exists to avoid ugly errors
      const { error: tableCheckError } = await supabase
        .from('watchlist')
        .select('count')
        .limit(1)
        .single();
      
      if (tableCheckError && tableCheckError.code === '42P01') {
        // Table doesn't exist - show a friendly message instead of error
        console.log('Note: Watchlist table does not exist yet. This is expected for new installations.');
        toast({
          title: 'Watchlist Not Available',
          description: 'The watchlist feature requires additional setup. This is expected for new installations.',
          status: 'info',
          duration: 5000,
          isClosable: true,
        });
        return [];
      }
      
      // If we get here, the table exists, so proceed with the query
      const { data, error } = await supabase
        .from('watchlist')
        .select('*')
        .eq('user_id', user.id);
        
      if (error) {
        throw error;
      }
      
      return data || [];
    } catch (err: any) {
      // Only log as error if it's not the table missing error
      if (err.code !== '42P01') {
        console.error('Error fetching watchlist from database:', err);
      }
      return [];
    }
  }, [user, toast]);
  
  // Fetch price data for multiple coins
  const fetchPrices = useCallback(async (coinIds: string[]) => {
    try {
      // Use the DataCacheProvider instead of direct API calls
      return await getMultipleCoinsData(coinIds);
    } catch (err) {
      console.error('Error fetching prices:', err);
      return {};
    }
  }, [getMultipleCoinsData]);

  // Function to do the actual data refresh
  const refreshWatchlistData = useCallback(async () => {
    if (!user) return;
    
    try {
      // Fetch watchlist items from the database
      const watchlistItems = await fetchBaseWatchlist();
      
      // If we have no items, possibly due to empty watchlist or table missing
      if (!watchlistItems || watchlistItems.length === 0) {
        const emptyWatchlist: WatchlistItem[] = [];
        setWatchlist(emptyWatchlist);
        
        // Update caches
        const now = Date.now();
        localCacheRef.current = { data: emptyWatchlist, timestamp: now };
        if (user.id) {
          globalCache.watchlistItems[user.id] = { data: emptyWatchlist, timestamp: now };
        }
        return;
      }
      
      // Get coin IDs for price fetching
      const coinIds = watchlistItems.map(item => String(item.coin_id));
      
      // Fetch current prices for all coins in the watchlist
      const pricesMap = await fetchPrices(coinIds);
      
      // Map database items to WatchlistItem format with current prices
      const watchlistWithPrices = watchlistItems.map(dbItem => {
        const coinId = String(dbItem.coin_id);
        const coinData = pricesMap[coinId];
        
        return {
          id: String(dbItem.id),
          coinId: String(dbItem.coin_id),
          symbol: String(dbItem.symbol),
          name: String(dbItem.name),
          price: coinData?.priceUsd || 0,
          change24h: coinData?.priceChange24h || 0,
          icon: String(dbItem.symbol),
          priceTarget: dbItem.price_target ? Number(dbItem.price_target) : undefined,
          createdAt: dbItem.created_at ? String(dbItem.created_at) : undefined
        };
      });
      
      // Update state and caches
      setWatchlist(watchlistWithPrices);
      
      // Update caches
      const now = Date.now();
      localCacheRef.current = { data: watchlistWithPrices, timestamp: now };
      if (user.id) {
        globalCache.watchlistItems[user.id] = { data: watchlistWithPrices, timestamp: now };
      }
      
    } catch (err: any) {
      // If the error is about a missing table, handle it gracefully
      if (err.code === '42P01') {
        console.log('Note: Watchlist table does not exist yet. This is expected for new installations.');
        // Set an empty watchlist
        const emptyWatchlist: WatchlistItem[] = [];
        setWatchlist(emptyWatchlist);
        
        // Update caches
        const now = Date.now();
        localCacheRef.current = { data: emptyWatchlist, timestamp: now };
        if (user.id) {
          globalCache.watchlistItems[user.id] = { data: emptyWatchlist, timestamp: now };
        }
        return;
      }
      
      console.error('Error refreshing watchlist data:', err);
      throw err;
    }
  }, [user, fetchBaseWatchlist, fetchPrices]);

  // Background refresh that doesn't change the loading state
  const backgroundRefresh = async () => {
    if (!user) return;
    
    lastRefreshRef.current = Date.now();
    
    try {
      await refreshWatchlistData();
      if (process.env.NODE_ENV === 'development') {
        console.log('Background refresh completed');
      }
    } catch (err) {
      console.error('Background refresh failed:', err);
      // Don't update error state for background refreshes
    }
  };

  // Fetch watchlist items from the database with rate limiting and caching
  const fetchWatchlist = useCallback(async (forceRefresh = false) => {
    if (!user) {
      setWatchlist([]);
      setLoading(false);
      return;
    }

    const now = Date.now();
    const userId = user.id;
    const timeSinceLastRefresh = now - lastRefreshRef.current;
    const globalCacheForUser = globalCache.watchlistItems[userId];
    
    // Determine if we can use the cache
    const canUseGlobalCache = !forceRefresh && 
      globalCacheForUser && 
      (now - globalCacheForUser.timestamp) < CACHE_DURATION;
      
    const canUseLocalCache = !forceRefresh && 
      localCacheRef.current && 
      (now - localCacheRef.current.timestamp) < CACHE_DURATION;
    
    // If in cooldown and we have some cache, use it
    if (!forceRefresh && timeSinceLastRefresh < REFRESH_COOLDOWN) {
      if (canUseGlobalCache) {
        setWatchlist(globalCacheForUser.data);
        setLoading(false);
        if (process.env.NODE_ENV === 'development') {
          console.log('Using global cache (in cooldown)');
        }
        return;
      } else if (canUseLocalCache) {
        setWatchlist(localCacheRef.current!.data);
        setLoading(false);
        if (process.env.NODE_ENV === 'development') {
          console.log('Using local cache (in cooldown)');
        }
        return;
      }
      // If no cache but in cooldown, we have to wait - only log in dev mode
      if (process.env.NODE_ENV === 'development') {
        console.log(`Rate limited. Wait ${Math.ceil((REFRESH_COOLDOWN - timeSinceLastRefresh)/1000)}s`);
      }
      return;
    }
    
    // If not in cooldown but cache is still fresh, use it and do background refresh
    if (!forceRefresh && (canUseGlobalCache || canUseLocalCache)) {
      // Set data from cache immediately
      if (canUseGlobalCache) {
        setWatchlist(globalCacheForUser.data);
      } else if (canUseLocalCache) {
        setWatchlist(localCacheRef.current!.data);
      }
      
      // Only do background refresh if we're not in the cooldown
      if (timeSinceLastRefresh >= REFRESH_COOLDOWN) {
        console.log('Using cache and fetching in background');
        // Don't show loading indicator for background refresh
        setLoading(false);
        
        // Start background refresh
        backgroundRefresh();
        return;
      } else {
        // Just use the cache
        setLoading(false);
        return;
      }
    }
    
    // Full refresh needed
    setLoading(true);
    setError(null);
    lastRefreshRef.current = now;
    
    try {
      await refreshWatchlistData();
      setLoading(false);
    } catch (err: any) {
      console.error('Error in fetchWatchlist:', err);
      
      // If this is a missing table error, we want to handle it differently
      if (err.code === '42P01') {
        // This is expected, so don't show an error
        console.log('Note: Watchlist table does not exist yet. This is expected for new installations.');
        
        // Set an empty watchlist
        setWatchlist([]);
        setLoading(false);
        return;
      }
      
      setError('Failed to load watchlist. Please try again.');
      
      // Fall back to cache on error if available
      if (globalCacheForUser) {
        setWatchlist(globalCacheForUser.data);
      } else if (localCacheRef.current) {
        setWatchlist(localCacheRef.current.data);
      }
      setLoading(false);
    }
  }, [user, refreshWatchlistData]);

  // Load watchlist when user changes
  useEffect(() => {
    fetchWatchlist();
    
    // Cleanup function to handle component unmount
    return () => {
      // Cleanup logic if needed
    };
  }, [fetchWatchlist]);

  // Refresh watchlist prices (with improved rate limiting)
  const refreshWatchlist = async (bypassRateLimit = false) => {
    // Check if we've refreshed too recently
    const now = Date.now();
    const timeSinceLastRefresh = now - lastRefreshRef.current;
    
    // Enforce a stricter cooldown of 30 seconds minimum between refreshes
    // unless bypassRateLimit is true
    if (!bypassRateLimit && timeSinceLastRefresh < REFRESH_COOLDOWN) {
      if (process.env.NODE_ENV === 'development') {
        console.log(`Refresh rate limited. Skipping refresh, last refresh was ${Math.ceil(timeSinceLastRefresh/1000)}s ago`);
      }
      return;
    }
    
    // Update the last refresh time
    lastRefreshRef.current = now;
    
    // Force refresh with minimal caching
    await fetchWatchlist(true);
  };
  
  // Update just the price data without refreshing the whole watchlist
  const refreshPrices = async () => {
    if (!user || watchlist.length === 0) return;
    
    const now = Date.now();
    const timeSinceLastRefresh = now - lastRefreshRef.current;
    
    // Enforce refresh cooldown
    if (timeSinceLastRefresh < REFRESH_COOLDOWN) {
      if (process.env.NODE_ENV === 'development') {
        console.log(`Price refresh rate limited. Try again in ${Math.ceil((REFRESH_COOLDOWN - timeSinceLastRefresh)/1000)}s`);
      }
      return;
    }
    
    lastRefreshRef.current = now;
    
    try {
      // Get coin IDs from the current watchlist
      const coinIds = watchlist.map(item => item.coinId);
      
      // Only fetch prices
      const pricesMap = await fetchPrices(coinIds);
      
      // Update only the price data
      setWatchlist(prev => {
        const updated = prev.map(item => {
          const coinData = pricesMap[item.coinId];
          if (!coinData) return item;
          
          return {
            ...item,
            price: coinData.priceUsd || item.price,
            change24h: coinData.priceChange24h || item.change24h
          };
        });
        
        return updated;
      });
    } catch (err) {
      console.error('Error refreshing prices:', err);
    }
  };

  const addToWatchlist = async (coin: CoinData, priceTarget: number) => {
    if (!user) {
      setError('You must be logged in to add coins to your watchlist');
      return;
    }
    
    try {
      // Add to database
      const newItem = await addToWatchlistInDB(coin, priceTarget);
      
      // Create a new watchlist item with the returned data
      const watchlistItem: WatchlistItem = {
        id: newItem.id || Date.now().toString(),
        coinId: coin.id,
        symbol: coin.symbol,
        name: coin.name,
        price: coin.priceUsd,
        change24h: coin.priceChange24h,
        icon: coin.symbol,
        priceTarget: priceTarget
      };
      
      // Update the state immediately
      setWatchlist(prev => [...prev, watchlistItem]);
      
      // Reset last refresh time to allow immediate refresh
      lastRefreshRef.current = 0;
      
      // Clear caches to ensure fresh data on next refresh
      if (user && user.id) {
        if (globalCache.watchlistItems[user.id]) {
          globalCache.watchlistItems[user.id].timestamp = 0;
        }
        localCacheRef.current = null;
      }
      
      return true;
    } catch (err) {
      console.error('Error adding to watchlist:', err);
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to add coin to watchlist');
      }
    }
  };

  // Remove a coin from watchlist
  const removeFromWatchlist = async (coinId: string) => {
    if (!user) {
      setError('You must be logged in to remove coins from your watchlist');
      return;
    }
    
    try {
      // Remove from database
      await removeFromWatchlistInDB(coinId);
      
      // Update the state immediately
      setWatchlist(prev => prev.filter(coin => coin.id !== coinId));
      
      // Reset last refresh time to allow immediate refresh
      lastRefreshRef.current = 0;
      
      // Clear caches to ensure fresh data on next refresh
      if (user && user.id) {
        if (globalCache.watchlistItems[user.id]) {
          globalCache.watchlistItems[user.id].timestamp = 0;
        }
        localCacheRef.current = null;
      }
      
      return true;
    } catch (err) {
      console.error('Error removing from watchlist:', err);
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to remove coin from watchlist');
      }
      
      // If the operation failed, refresh to get correct data
      fetchWatchlist(true);
      return false;
    }
  };

  // Update price target for a coin
  const updatePriceTarget = async (coinId: string, newPriceTarget: number) => {
    if (!user) {
      setError('You must be logged in to update your watchlist');
      return;
    }
    
    try {
      await updatePriceTargetInDB(coinId, newPriceTarget);
      
      // Update the watchlist state optimistically
      setWatchlist(prev => {
        const updated = prev.map(item => 
          item.id === coinId 
            ? { ...item, priceTarget: newPriceTarget } 
            : item
        );
        return updated;
      });
      
      // Reset last refresh time to allow immediate refresh
      lastRefreshRef.current = 0;
      
      // Clear caches to ensure fresh data on next refresh
      if (user && user.id) {
        if (globalCache.watchlistItems[user.id]) {
          globalCache.watchlistItems[user.id].timestamp = 0;
        }
        localCacheRef.current = null;
      }
      
      return true;
    } catch (err) {
      console.error('Error updating price target:', err);
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to update price target');
      }
      
      // If the operation failed, refresh to get correct data
      fetchWatchlist(true);
    }
  };

  // Check if a coin is in the watchlist
  const isInWatchlist = (coinId: string): boolean => {
    return watchlist.some(coin => coin.coinId === coinId);
  };
  
  // Get target percentage difference
  const getTargetPercentage = (coin: WatchlistItem): number => {
    if (!coin.priceTarget || coin.price === 0) return 0;
    return ((coin.priceTarget - coin.price) / coin.price) * 100;
  };

  return {
    watchlist,
    loading,
    error,
    addToWatchlist,
    removeFromWatchlist,
    updatePriceTarget,
    isInWatchlist,
    getTargetPercentage,
    refreshWatchlist,
    refreshPrices
  };
} 