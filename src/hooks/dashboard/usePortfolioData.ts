import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/lib/providers/auth-provider';
import { PortfolioSummary } from '@/types/portfolio';
import { getUserPortfolio } from '@/lib/api/portfolio';
import { useToast } from '@/hooks/useToast';

// Refresh intervals and cache settings
const AUTO_REFRESH_INTERVAL = 10 * 60 * 1000; // 10 minutes
const CACHE_CLEANUP_INTERVAL = 30 * 60 * 1000; // 30 minutes
const MIN_FETCH_INTERVAL = 60 * 1000; // 1 minute minimum between fetches
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes cache duration

// Global cache for sharing data between hook instances
const globalCache: {
  portfolioData: { [userId: string]: { data: PortfolioSummary, timestamp: number } }
} = {
  portfolioData: {}
};

export function usePortfolioData() {
  const { user } = useAuth();
  const [portfolio, setPortfolio] = useState<PortfolioSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const toast = useToast();
  const lastFetchRef = useRef<number>(0);
  const localCacheRef = useRef<{data: PortfolioSummary, timestamp: number} | null>(null);

  // Fetch portfolio data with caching and throttling
  const fetchPortfolio = useCallback(async (forceFetch = false) => {
    if (!user) {
      setPortfolio(null);
      setLoading(false);
      return;
    }

    const now = Date.now();
    const userId = user.id;
    const timeSinceLastFetch = now - lastFetchRef.current;
    const globalCacheForUser = globalCache.portfolioData[userId];
    
    // Determine if we can use the cache
    const canUseGlobalCache = !forceFetch && 
      globalCacheForUser && 
      (now - globalCacheForUser.timestamp) < CACHE_DURATION;
      
    const canUseLocalCache = !forceFetch && 
      localCacheRef.current && 
      (now - localCacheRef.current.timestamp) < CACHE_DURATION;
    
    // If in cooldown and we have some cache, use it
    if (!forceFetch && timeSinceLastFetch < MIN_FETCH_INTERVAL) {
      if (canUseGlobalCache) {
        setPortfolio(globalCacheForUser.data);
        setLoading(false);
        console.log('Using global portfolio cache (in cooldown)');
        return;
      } else if (canUseLocalCache) {
        setPortfolio(localCacheRef.current!.data);
        setLoading(false);
        console.log('Using local portfolio cache (in cooldown)');
        return;
      }
      // If no cache but in cooldown, we'll continue but log it
      console.log('Skipping portfolio fetch - too soon since last fetch');
    }
    
    // If not in cooldown but cache is still fresh, use it and do background refresh
    if (!forceFetch && (canUseGlobalCache || canUseLocalCache)) {
      // Set data from cache immediately
      if (canUseGlobalCache) {
        setPortfolio(globalCacheForUser.data);
      } else if (canUseLocalCache) {
        setPortfolio(localCacheRef.current!.data);
      }
      
      // Only do background refresh if we're not in the cooldown
      if (timeSinceLastFetch >= MIN_FETCH_INTERVAL) {
        console.log('Using cache and fetching portfolio in background');
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
    lastFetchRef.current = now;

    try {
      console.log(`Fetching portfolio for user ${user.id}...`);
      const data = await getUserPortfolio(user.id);
      console.log(`Portfolio fetched successfully with ${data.items.length} items`);
      
      // Update state and caches
      setPortfolio(data);
      localCacheRef.current = { data, timestamp: now };
      globalCache.portfolioData[userId] = { data, timestamp: now };
      
      setLoading(false);
    } catch (err) {
      console.error('Error fetching portfolio:', err);
      setError('Failed to load portfolio');
      
      // Fall back to cache on error if available
      if (globalCacheForUser) {
        setPortfolio(globalCacheForUser.data);
      } else if (localCacheRef.current) {
        setPortfolio(localCacheRef.current.data);
      }
      
      toast({
        title: 'Error',
        description: 'Failed to load portfolio',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      
      setLoading(false);
    }
  }, [user, toast]);
  
  // Background refresh function that doesn't update loading state
  const backgroundRefresh = async () => {
    if (!user) return;
    
    lastFetchRef.current = Date.now();
    
    try {
      console.log(`Background refreshing portfolio for user ${user.id}...`);
      const data = await getUserPortfolio(user.id);
      
      // Update state and caches
      setPortfolio(data);
      const now = Date.now();
      localCacheRef.current = { data, timestamp: now };
      globalCache.portfolioData[user.id] = { data, timestamp: now };
      
      console.log('Background portfolio refresh completed');
    } catch (err) {
      console.error('Background portfolio refresh failed:', err);
      // Don't set error state for background refreshes
    }
  };

  useEffect(() => {
    // Initial fetch when component mounts or user changes
    if (user) {
      console.log('User authenticated, fetching portfolio...');
      fetchPortfolio(true); // Force fetch on initial load
    }
    
    // Set up refresh interval (now 10 minutes instead of 5)
    const refreshIntervalId = setInterval(() => {
      if (user) {
        console.log('Auto-refreshing portfolio...');
        backgroundRefresh(); // Use background refresh for intervals
      }
    }, AUTO_REFRESH_INTERVAL);
    
    return () => {
      clearInterval(refreshIntervalId);
    };
  }, [user, fetchPortfolio]);

  // Force refresh portfolio data
  const refreshPortfolio = useCallback(() => {
    return fetchPortfolio(true);
  }, [fetchPortfolio]);

  return {
    portfolio,
    loading,
    error,
    fetchPortfolio,
    backgroundRefresh,
    refreshPortfolio
  };
} 