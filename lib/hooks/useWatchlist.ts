import { useState, useEffect, useCallback, useRef } from 'react';
import { CoinData } from '@/types/portfolio';
import { useAuth } from '@/lib/auth-context';
import { 
  fetchWatchlist as fetchWatchlistFromDB, 
  addToWatchlist as addToWatchlistInDB,
  updatePriceTarget as updatePriceTargetInDB,
  removeFromWatchlist as removeFromWatchlistInDB
} from '@/lib/services/watchlist';
import { getMultipleCoinsData } from '@/lib/services/coinmarketcap';

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
const REFRESH_COOLDOWN = 10000; // 10 seconds between API requests
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Hook to manage a user's coin watchlist
 */
export function useWatchlist() {
  const { user } = useAuth();
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const lastRefreshRef = useRef<number>(0);
  const watchlistCacheRef = useRef<{data: WatchlistItem[], timestamp: number} | null>(null);

  // Fetch watchlist items from the database with rate limiting and caching
  const fetchWatchlist = useCallback(async () => {
    if (!user) {
      setWatchlist([]);
      setLoading(false);
      return;
    }

    // Check if we're in the cooldown period to prevent spamming API
    const now = Date.now();
    const timeSinceLastRefresh = now - lastRefreshRef.current;
    
    // If we have cached data and either in cooldown or cache is still fresh
    if (watchlistCacheRef.current) {
      // If in cooldown or cache is still fresh, use cached data
      if (timeSinceLastRefresh < REFRESH_COOLDOWN || 
          (now - watchlistCacheRef.current.timestamp) < CACHE_DURATION) {
        
        // If we're in loading state, update it
        if (loading) {
          setWatchlist(watchlistCacheRef.current.data);
          setLoading(false);
          setError(null);
        }
        
        // If we're in cooldown, don't proceed with fetch
        if (timeSinceLastRefresh < REFRESH_COOLDOWN) {
          console.log(`Skipping watchlist refresh (last refresh: ${timeSinceLastRefresh}ms ago)`);
          return;
        }
      }
    }

    setLoading(true);
    setError(null);
    lastRefreshRef.current = now;

    try {
      // Fetch watchlist items from the database
      const watchlistItems = await fetchWatchlistFromDB();
      
      if (watchlistItems.length === 0) {
        setWatchlist([]);
        watchlistCacheRef.current = { data: [], timestamp: now };
        setLoading(false);
        return;
      }
      
      // Get coin IDs for price fetching
      const coinIds = watchlistItems.map(item => item.coin_id);
      
      // Fetch current prices for all coins in the watchlist
      const pricesMap = await getMultipleCoinsData(coinIds);
      
      // Map database items to WatchlistItem format with current prices
      const watchlistWithPrices = watchlistItems.map(dbItem => {
        const coinData = pricesMap[dbItem.coin_id];
        
        return {
          id: dbItem.id,
          coinId: dbItem.coin_id,  // Store the coin_id from the database for CoinMarketCap images
          symbol: dbItem.symbol,
          name: dbItem.name,
          price: coinData?.priceUsd || 0,
          change24h: coinData?.priceChange24h || 0,
          icon: dbItem.symbol,
          priceTarget: dbItem.price_target || undefined,
          createdAt: dbItem.created_at
        };
      });
      
      // Update state and cache
      setWatchlist(watchlistWithPrices);
      watchlistCacheRef.current = { data: watchlistWithPrices, timestamp: now };
    } catch (err) {
      console.error('Error fetching watchlist:', err);
      setError('Failed to load watchlist. Please try again.');
      
      // If we have cached data, fall back to it
      if (watchlistCacheRef.current) {
        setWatchlist(watchlistCacheRef.current.data);
      }
    } finally {
      setLoading(false);
    }
  }, [user, loading]);

  // Load watchlist when user changes
  useEffect(() => {
    fetchWatchlist();
  }, [fetchWatchlist]);

  // Add a coin to watchlist
  const addToWatchlist = async (coin: CoinData, priceTarget: number) => {
    if (!user) {
      setError('You must be logged in to add coins to your watchlist');
      return;
    }
    
    try {
      await addToWatchlistInDB(coin, priceTarget);
      await fetchWatchlist(); // Refresh the watchlist
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
      await removeFromWatchlistInDB(coinId);
      setWatchlist(prev => {
        const updated = prev.filter(coin => coin.id !== coinId);
        // Update the cache
        if (watchlistCacheRef.current) {
          watchlistCacheRef.current.data = updated;
        }
        return updated;
      });
    } catch (err) {
      console.error('Error removing from watchlist:', err);
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to remove coin from watchlist');
      }
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
      setWatchlist(prev => {
        const updated = prev.map(item => 
          item.id === coinId 
            ? { ...item, priceTarget: newPriceTarget } 
            : item
        );
        // Update the cache
        if (watchlistCacheRef.current) {
          watchlistCacheRef.current.data = updated;
        }
        return updated;
      });
    } catch (err) {
      console.error('Error updating price target:', err);
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to update price target');
      }
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

  // Refresh watchlist prices (with rate limiting)
  const refreshWatchlist = async () => {
    // Check if we need to respect the cooldown
    const now = Date.now();
    const timeSinceLastRefresh = now - lastRefreshRef.current;
    
    if (timeSinceLastRefresh < REFRESH_COOLDOWN) {
      console.log(`Refresh rate limited. Try again in ${Math.ceil((REFRESH_COOLDOWN - timeSinceLastRefresh)/1000)}s`);
      return;
    }
    
    await fetchWatchlist();
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
    refreshWatchlist
  };
} 