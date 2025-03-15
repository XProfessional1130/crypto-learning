import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/lib/auth-context';
import { PortfolioSummary, PortfolioItemWithPrice } from '@/types/portfolio';
import { 
  getUserPortfolio,
  addCoinToPortfolio,
  updateCoinAmount,
  removeCoinFromPortfolio,
  updatePreferredCurrency
} from '@/lib/services/portfolio';
import { searchCoins, cleanupCaches } from '@/lib/services/coinmarketcap';
import { useToast } from '@/lib/hooks/useToast';

// Refresh intervals and cache settings
const AUTO_REFRESH_INTERVAL = 10 * 60 * 1000; // 10 minutes instead of 5
const CACHE_CLEANUP_INTERVAL = 30 * 60 * 1000; // 30 minutes
const MIN_FETCH_INTERVAL = 60 * 1000; // 1 minute minimum between fetches
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes cache duration

// Global cache for sharing data between hook instances
const globalCache: {
  portfolioData: { [userId: string]: { data: PortfolioSummary, timestamp: number } }
} = {
  portfolioData: {}
};

export function usePortfolio() {
  const { user } = useAuth();
  const [portfolio, setPortfolio] = useState<PortfolioSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [preferredCurrency, setPreferredCurrency] = useState<'USD' | 'BTC'>('USD');
  const toast = useToast();
  const lastFetchRef = useRef<number>(0);
  const localCacheRef = useRef<{data: PortfolioSummary, timestamp: number} | null>(null);
  const fetchingRef = useRef<boolean>(false);
  const hasInitialCheckedRef = useRef<boolean>(false);
  const verbose = process.env.NODE_ENV === 'development';

  // Fetch portfolio data with caching and throttling
  const fetchPortfolio = useCallback(async (forceFetch = false) => {
    if (!user) {
      setPortfolio(null);
      setLoading(false);
      return;
    }

    // Prevent concurrent fetches
    if (fetchingRef.current && !forceFetch) {
      if (verbose) {
        console.log('Already fetching portfolio, skipping duplicate request');
      }
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
        if (verbose) {
          console.log('Using global portfolio cache (in cooldown)');
        }
        return;
      } else if (canUseLocalCache) {
        setPortfolio(localCacheRef.current!.data);
        setLoading(false);
        if (verbose) {
          console.log('Using local portfolio cache (in cooldown)');
        }
        return;
      }
      // If no cache but in cooldown, we'll continue but log it
      if (verbose) {
        console.log('Skipping portfolio fetch - too soon since last fetch');
      }
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
        if (verbose) {
          console.log('Using cache and fetching portfolio in background');
        }
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
    fetchingRef.current = true;

    try {
      if (verbose) {
        console.log(`Fetching portfolio for user ${user.id}...`);
      }
      const data = await getUserPortfolio(user.id);
      if (verbose) {
        console.log(`Portfolio fetched successfully with ${data.items.length} items`);
      }
      
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
    } finally {
      fetchingRef.current = false;
    }
  }, [user, toast, verbose]);
  
  // Background refresh function that doesn't update loading state
  const backgroundRefresh = useCallback(async () => {
    if (!user) return;
    
    // Prevent concurrent background refreshes
    if (fetchingRef.current) {
      if (verbose) {
        console.log('Background refresh skipped - another fetch in progress');
      }
      return;
    }
    
    const now = Date.now();
    lastFetchRef.current = now;
    fetchingRef.current = true;
    
    try {
      const data = await getUserPortfolio(user.id);
      
      // Only update if we got valid data
      if (data && data.items) {
        setPortfolio(data);
        localCacheRef.current = { data, timestamp: now };
        globalCache.portfolioData[user.id] = { data, timestamp: now };
        
        if (verbose) {
          console.log('Background refresh complete with', data.items.length, 'items');
        }
      }
    } catch (err) {
      console.error('Error in background refresh:', err);
      // Don't show an error toast for background refresh failures
    } finally {
      fetchingRef.current = false;
    }
  }, [user, verbose]);

  // Auto-refresh for authenticated users
  useEffect(() => {
    if (!user) return;
    
    // Perform an initial fetch if needed
    const hasCache = globalCache.portfolioData[user.id] || localCacheRef.current;
    
    // If we don't have any cached data, fetch immediately
    if (!hasCache && !fetchingRef.current) {
      if (verbose) {
        console.log('No cached portfolio data, fetching on mount...');
      }
      fetchPortfolio(false);
    }
    
    // Set up auto-refresh interval
    const intervalId = setInterval(() => {
      // Only refresh if user is still logged in and enough time has passed
      if (user && Date.now() - lastFetchRef.current >= AUTO_REFRESH_INTERVAL) {
        if (verbose) {
          console.log('Auto-refreshing portfolio data...');
        }
        backgroundRefresh();
      }
    }, AUTO_REFRESH_INTERVAL);
    
    // Set up cache cleanup interval
    const cleanupIntervalId = setInterval(() => {
      if (verbose) {
        console.log('Cleaning up expired portfolio caches...');
      }
      
      // Clean up global cache
      const now = Date.now();
      Object.keys(globalCache.portfolioData).forEach(userId => {
        const cacheItem = globalCache.portfolioData[userId];
        if (now - cacheItem.timestamp > CACHE_CLEANUP_INTERVAL) {
          delete globalCache.portfolioData[userId];
        }
      });
    }, CACHE_CLEANUP_INTERVAL);
    
    // Cleanup on unmount
    return () => {
      clearInterval(intervalId);
      clearInterval(cleanupIntervalId);
    };
  }, [user, fetchPortfolio, backgroundRefresh, verbose]);
  
  // Whenever user changes, we need to check authentication
  useEffect(() => {
    // Skip if we've already done the initial check for this user
    if (hasInitialCheckedRef.current && user) {
      return;
    }
    
    // We already have a loading state, so we don't need to check authentication if we're already fetching
    if (user && !fetchingRef.current) {
      // Mark that we've checked for this user
      hasInitialCheckedRef.current = true;
      
      // Only log in verbose mode
      if (verbose) {
        console.log('User authenticated, fetching portfolio...');
      }
      
      // Only fetch if we don't have data or the data is stale
      const now = Date.now();
      const hasRecentData = 
        (globalCache.portfolioData[user.id] && 
         (now - globalCache.portfolioData[user.id].timestamp) < CACHE_DURATION) ||
        (localCacheRef.current && 
         (now - localCacheRef.current.timestamp) < CACHE_DURATION);
         
      if (!hasRecentData) {
        fetchPortfolio();
      } else if (verbose) {
        console.log('Using cached data for portfolio, skipping initial fetch');
      }
    } else if (!user) {
      setPortfolio(null);
      setLoading(false);
      // Reset check flag when user is null
      hasInitialCheckedRef.current = false;
    }
  }, [user, fetchPortfolio, verbose]);

  // Add a coin to the portfolio with optimistic UI updates
  const addCoin = useCallback(async (coinId: string, amount: number) => {
    if (!user) {
      toast({
        title: 'Error',
        description: 'You must be logged in to add coins',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      return { success: false };
    }

    try {
      if (verbose) {
        console.log(`Adding coin ${coinId} to portfolio...`);
      }
      const result = await addCoinToPortfolio(user.id, coinId, amount);
      
      if (result.success) {
        if (verbose) {
          console.log('Coin added successfully, refreshing portfolio...');
        }
        
        // Force fetch to get the updated portfolio data
        await fetchPortfolio(true);
        
        if (verbose) {
          console.log('Portfolio refreshed successfully after adding coin');
        }
        
        toast({
          title: 'Success',
          description: 'Coin added to portfolio',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      } else {
        console.error('Failed to add coin:', result.message);
        toast({
          title: 'Error',
          description: result.message || 'Failed to add coin',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      }
      
      return result;
    } catch (error) {
      console.error('Error adding coin:', error);
      toast({
        title: 'Error',
        description: 'An unexpected error occurred',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      return { success: false };
    }
  }, [user, toast, fetchPortfolio, verbose]);

  // Update the amount of a coin with optimistic UI updates
  const updateAmount = useCallback(async (portfolioItemId: string, amount: number) => {
    if (!user) return { success: false };

    // Optimistically update the UI
    if (portfolio) {
      const updatedItems = portfolio.items.map(item => 
        item.id === portfolioItemId 
          ? { ...item, amount } 
          : item
      );
      
      // Recalculate totals (simplified)
      const updatedPortfolio = {
        ...portfolio,
        items: updatedItems
      };
      
      // Update local state immediately
      setPortfolio(updatedPortfolio);
    }

    try {
      const result = await updateCoinAmount(user.id, portfolioItemId, amount);
      
      if (result.success) {
        // Fetch updated data (background)
        backgroundRefresh();
        
        toast({
          title: 'Success',
          description: 'Amount updated',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      } else {
        // Revert optimistic update
        await fetchPortfolio(true);
        
        toast({
          title: 'Error',
          description: result.message || 'Failed to update amount',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      }
      
      return result;
    } catch (error) {
      console.error('Error updating amount:', error);
      
      // Revert optimistic update
      await fetchPortfolio(true);
      
      toast({
        title: 'Error',
        description: 'An unexpected error occurred',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      return { success: false };
    }
  }, [user, portfolio, toast, fetchPortfolio]);

  // Remove a coin with optimistic UI updates
  const removeCoin = useCallback(async (portfolioItemId: string) => {
    if (!user) return { success: false };

    // Store original portfolio for rollback
    const originalPortfolio = portfolio;

    // Optimistically update the UI if we have a portfolio
    if (portfolio) {
      const updatedItems = portfolio.items.filter(item => item.id !== portfolioItemId);
      
      // Create a simplified updated portfolio
      const updatedPortfolio = {
        ...portfolio,
        items: updatedItems
      };
      
      // Update local state immediately
      setPortfolio(updatedPortfolio);
    }

    try {
      const result = await removeCoinFromPortfolio(user.id, portfolioItemId);
      
      if (result.success) {
        // Fetch accurate data in background
        backgroundRefresh();
        
        toast({
          title: 'Success',
          description: 'Coin removed from portfolio',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      } else {
        // Revert optimistic update
        if (originalPortfolio) {
          setPortfolio(originalPortfolio);
        } else {
          await fetchPortfolio(true);
        }
        
        toast({
          title: 'Error',
          description: result.message || 'Failed to remove coin',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      }
      
      return result;
    } catch (error) {
      console.error('Error removing coin:', error);
      
      // Revert optimistic update
      if (originalPortfolio) {
        setPortfolio(originalPortfolio);
      } else {
        await fetchPortfolio(true);
      }
      
      toast({
        title: 'Error',
        description: 'An unexpected error occurred',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      return { success: false };
    }
  }, [user, portfolio, toast, fetchPortfolio]);

  // Update preferred currency with optimistic UI updates
  const changeCurrency = useCallback(async (currency: 'USD' | 'BTC') => {
    if (!user) return { success: false };

    // Update local state immediately
    setPreferredCurrency(currency);

    try {
      // In a real implementation, you might need to update this for each item
      // or have a user-level setting. This is simplified.
      const result = { success: true };
      
      return result;
    } catch (error) {
      console.error('Error changing currency:', error);
      
      // Revert the optimistic update
      setPreferredCurrency(preferredCurrency);
      
      toast({
        title: 'Error',
        description: 'Failed to update currency preference',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      return { success: false };
    }
  }, [user, preferredCurrency, toast]);

  // Search for coins with caching
  const searchForCoins = useCallback(async (query: string) => {
    try {
      return await searchCoins(query);
    } catch (error) {
      console.error('Error searching for coins:', error);
      toast({
        title: 'Error',
        description: 'Failed to search for coins',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      return [];
    }
  }, [toast]);

  // Force refresh portfolio data
  const refreshPortfolio = useCallback(() => {
    return fetchPortfolio(true);
  }, [fetchPortfolio]);

  return {
    portfolio,
    loading,
    error,
    preferredCurrency,
    addCoin,
    updateAmount,
    removeCoin,
    changeCurrency,
    searchForCoins,
    refreshPortfolio
  };
} 