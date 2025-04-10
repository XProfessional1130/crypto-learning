import { useState, useEffect, useCallback, useRef } from 'react';
import { WatchlistItem } from '@/lib/api/team-watchlist';
import { getTeamWatchlist } from '@/lib/api/team-watchlist';
import { useToast } from '@/hooks/ui/useToast';
import { initCoinDataService } from '@/lib/api/coinmarketcap';
import { useAuth } from '@/lib/providers/auth-provider';

// Admin ID for permission checks
const TEAM_ADMIN_ID = process.env.NEXT_PUBLIC_TEAM_ADMIN_ID || '529cfde5-d8c3-4a6a-a9dc-5bb67fb039b5';

// Refresh intervals and cache settings
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

export function useTeamWatchlistData() {
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const toast = useToast();
  const lastFetchRef = useRef<number>(0);
  const { user } = useAuth();

  // Check if the current user is the admin
  useEffect(() => {
    if (user && user.id === TEAM_ADMIN_ID) {
      setIsAdmin(true);
    } else {
      setIsAdmin(false);
    }
  }, [user]);

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
      console.log('Initializing coin data service for useTeamWatchlist');
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
  }, [fetchTeamWatchlist]);

  // Check if a coin is already in the watchlist
  const isInWatchlist = useCallback((coinId: string): boolean => {
    return watchlist.some(item => item.coinId === coinId);
  }, [watchlist]);

  return {
    watchlist,
    loading,
    error,
    isAdmin,
    isInWatchlist,
    fetchTeamWatchlist,
    backgroundRefresh
  };
} 