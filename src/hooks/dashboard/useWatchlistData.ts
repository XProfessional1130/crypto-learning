import { useState, useEffect, useCallback, useRef } from 'react';
import { WatchlistItem } from '../useWatchlist';
import { useAuth } from '@/lib/providers/auth-provider';
import { 
  fetchWatchlist as fetchWatchlistFromDB, 
  addToWatchlist as addToWatchlistInDB,
  updatePriceTarget as updatePriceTargetInDB,
  removeFromWatchlist as removeFromWatchlistInDB
} from '@/lib/api/watchlist';
import { logger } from '@/lib/utils/logger';

// Cache settings
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes

// Global cache to share data between hook instances
const globalCache: {
  watchlistItems: { [userId: string]: { data: WatchlistItem[], timestamp: number } }
} = {
  watchlistItems: {}
};

/**
 * Hook to manage watchlist database operations
 * Handles the CRUD operations for watchlist items
 */
export function useWatchlistData() {
  const { user } = useAuth();
  const userId = user?.id || '';
  
  // State management
  const [watchlistItems, setWatchlistItems] = useState<WatchlistItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  // Refs for tracking async operations
  const isMounted = useRef(true);
  
  // Check if data for this user is cached
  const isDataCached = useCallback(() => {
    if (!userId) return false;
    
    const cachedData = globalCache.watchlistItems[userId];
    if (!cachedData) return false;
    
    const now = Date.now();
    return (now - cachedData.timestamp) < CACHE_DURATION;
  }, [userId]);
  
  // Fetch watchlist data from DB
  const fetchWatchlist = useCallback(async () => {
    if (!userId) {
      setWatchlistItems([]);
      return null;
    }
    
    // Use cached data if available
    if (isDataCached()) {
      const cachedData = globalCache.watchlistItems[userId];
      setWatchlistItems(cachedData.data);
      return cachedData.data;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      logger.debug('Fetching watchlist from database', { userId });
      const items = await fetchWatchlistFromDB(userId);
      
      if (isMounted.current) {
        setWatchlistItems(items);
        
        // Update cache
        globalCache.watchlistItems[userId] = {
          data: items,
          timestamp: Date.now()
        };
      }
      
      return items;
    } catch (err) {
      logger.error('Error fetching watchlist', { error: err });
      if (isMounted.current) {
        setError(err instanceof Error ? err : new Error('Failed to fetch watchlist'));
      }
      return null;
    } finally {
      if (isMounted.current) {
        setIsLoading(false);
      }
    }
  }, [userId, isDataCached]);
  
  // Add a coin to the watchlist
  const addToWatchlist = useCallback(async (item: Omit<WatchlistItem, 'id'>) => {
    if (!userId) return null;
    
    setIsLoading(true);
    setError(null);
    
    try {
      logger.debug('Adding coin to watchlist', { userId, coinId: item.coinId });
      const newItem = await addToWatchlistInDB(userId, item);
      
      if (isMounted.current) {
        // Update local state
        setWatchlistItems(prev => [...prev, newItem]);
        
        // Update cache
        const cachedData = globalCache.watchlistItems[userId];
        if (cachedData) {
          globalCache.watchlistItems[userId] = {
            data: [...cachedData.data, newItem],
            timestamp: Date.now()
          };
        }
      }
      
      return newItem;
    } catch (err) {
      logger.error('Error adding to watchlist', { error: err });
      if (isMounted.current) {
        setError(err instanceof Error ? err : new Error('Failed to add to watchlist'));
      }
      return null;
    } finally {
      if (isMounted.current) {
        setIsLoading(false);
      }
    }
  }, [userId]);
  
  // Remove a coin from the watchlist
  const removeFromWatchlist = useCallback(async (coinId: string) => {
    if (!userId) return false;
    
    setIsLoading(true);
    setError(null);
    
    try {
      logger.debug('Removing coin from watchlist', { userId, coinId });
      await removeFromWatchlistInDB(userId, coinId);
      
      if (isMounted.current) {
        // Update local state
        setWatchlistItems(prev => prev.filter(item => item.coinId !== coinId));
        
        // Update cache
        const cachedData = globalCache.watchlistItems[userId];
        if (cachedData) {
          globalCache.watchlistItems[userId] = {
            data: cachedData.data.filter(item => item.coinId !== coinId),
            timestamp: Date.now()
          };
        }
      }
      
      return true;
    } catch (err) {
      logger.error('Error removing from watchlist', { error: err });
      if (isMounted.current) {
        setError(err instanceof Error ? err : new Error('Failed to remove from watchlist'));
      }
      return false;
    } finally {
      if (isMounted.current) {
        setIsLoading(false);
      }
    }
  }, [userId]);
  
  // Update price target for a coin
  const updatePriceTarget = useCallback(async (coinId: string, newPriceTarget: number) => {
    if (!userId) return false;
    
    setIsLoading(true);
    setError(null);
    
    try {
      logger.debug('Updating price target', { userId, coinId, newPriceTarget });
      await updatePriceTargetInDB(userId, coinId, newPriceTarget);
      
      if (isMounted.current) {
        // Update local state
        setWatchlistItems(prev => prev.map(item => 
          item.coinId === coinId ? { ...item, priceTarget: newPriceTarget } : item
        ));
        
        // Update cache
        const cachedData = globalCache.watchlistItems[userId];
        if (cachedData) {
          globalCache.watchlistItems[userId] = {
            data: cachedData.data.map(item => 
              item.coinId === coinId ? { ...item, priceTarget: newPriceTarget } : item
            ),
            timestamp: Date.now()
          };
        }
      }
      
      return true;
    } catch (err) {
      logger.error('Error updating price target', { error: err });
      if (isMounted.current) {
        setError(err instanceof Error ? err : new Error('Failed to update price target'));
      }
      return false;
    } finally {
      if (isMounted.current) {
        setIsLoading(false);
      }
    }
  }, [userId]);
  
  // Clear cache when component unmounts
  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);
  
  // Initial fetch
  useEffect(() => {
    fetchWatchlist();
  }, [fetchWatchlist]);
  
  return {
    watchlistItems,
    isLoading,
    error,
    fetchWatchlist,
    addToWatchlist,
    removeFromWatchlist,
    updatePriceTarget
  };
} 