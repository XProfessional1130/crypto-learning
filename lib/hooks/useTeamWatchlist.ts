import { useState, useEffect, useCallback, useRef } from 'react';
import { WatchlistItem } from '@/lib/hooks/useWatchlist';
import { getTeamWatchlist } from '@/lib/services/team-watchlist';
import { useToast } from '@/lib/hooks/useToast';
import { initCoinDataService } from '@/lib/services/coinmarketcap';

// Refresh intervals and cache settings - reuse same settings as portfolio for consistency
const AUTO_REFRESH_INTERVAL = 10 * 60 * 1000; // 10 minutes
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes cache duration

// Global cache for the team watchlist
const teamWatchlistCache: {
  data: { items: WatchlistItem[] } | null;
  timestamp: number;
} = {
  data: null,
  timestamp: 0
};

// Track initialization of coin data service
let isCoinDataServiceInitialized = false;

export function useTeamWatchlist() {
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const toast = useToast();
  const lastFetchRef = useRef<number>(0);

  // Fetch watchlist data with caching
  const fetchTeamWatchlist = useCallback(async (forceFetch = false) => {
    const now = Date.now();
    
    // Determine if we can use the cache
    const canUseCache = !forceFetch && 
      teamWatchlistCache.data && 
      (now - teamWatchlistCache.timestamp) < CACHE_DURATION;
    
    // If cache is fresh, use it
    if (canUseCache && teamWatchlistCache.data) {
      setWatchlist(teamWatchlistCache.data.items);
      setLoading(false);
      console.log('Using team watchlist cache');
      return;
    }

    // Full refresh needed
    setLoading(true);
    setError(null);
    lastFetchRef.current = now;

    try {
      console.log('Fetching team watchlist...');
      const data = await getTeamWatchlist();
      console.log(`Team watchlist fetched successfully with ${data.items.length} items`);
      
      // Update state and cache
      setWatchlist(data.items);
      teamWatchlistCache.data = data;
      teamWatchlistCache.timestamp = now;
      
      setLoading(false);
    } catch (err) {
      console.error('Error fetching team watchlist:', err);
      setError('Failed to load team watchlist');
      
      // Fall back to cache on error if available
      if (teamWatchlistCache.data) {
        setWatchlist(teamWatchlistCache.data.items);
      }
      
      toast({
        title: 'Error',
        description: 'Failed to load team watchlist',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      
      setLoading(false);
    }
  }, [toast]);
  
  // Background refresh function that doesn't update loading state
  const backgroundRefresh = async () => {
    lastFetchRef.current = Date.now();
    
    try {
      console.log('Background refreshing team watchlist...');
      const data = await getTeamWatchlist();
      
      // Update state and cache
      setWatchlist(data.items);
      const now = Date.now();
      teamWatchlistCache.data = data;
      teamWatchlistCache.timestamp = now;
      
      console.log('Background team watchlist refresh completed');
    } catch (err) {
      console.error('Background team watchlist refresh failed:', err);
      // Don't set error state for background refreshes
    }
  };

  useEffect(() => {
    // Make sure coin data service is initialized
    if (!isCoinDataServiceInitialized) {
      initCoinDataService()
        .then(() => {
          console.log('Coin data service initialized for watchlist');
          isCoinDataServiceInitialized = true;
        })
        .catch(err => console.error('Failed to initialize coin data service for watchlist:', err));
    }
    
    // Initial fetch when component mounts
    console.log('Fetching team watchlist on mount...');
    fetchTeamWatchlist(true); // Force fetch on initial load
    
    // Set up refresh interval
    const refreshIntervalId = setInterval(() => {
      console.log('Auto-refreshing team watchlist...');
      backgroundRefresh();
    }, AUTO_REFRESH_INTERVAL);
    
    return () => {
      clearInterval(refreshIntervalId);
    };
  }, []);

  // Calculate target percentage (useful for watchlist items with price targets)
  const getTargetPercentage = (item: WatchlistItem): number => {
    if (!item.priceTarget || !item.price) return 0;
    
    // Calculate percentage to reach the target from current price
    return ((item.priceTarget - item.price) / item.price) * 100;
  };

  return {
    watchlist,
    loading,
    error,
    refreshWatchlist: fetchTeamWatchlist,
    getTargetPercentage
  };
} 