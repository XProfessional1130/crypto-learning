import { useState, useEffect, useCallback, useRef } from 'react';
import { PortfolioSummary } from '@/types/portfolio';
import { getTeamPortfolio } from '@/lib/services/team-portfolio';
import { useToast } from '@/lib/hooks/useToast';
import { initCoinDataService, cleanupCaches } from '@/lib/services/coinmarketcap';
import { useAuth } from '@/lib/auth-context';

// Admin ID for permission checks
const TEAM_ADMIN_ID = process.env.NEXT_PUBLIC_TEAM_ADMIN_ID || '529cfde5-d8c3-4a6a-a9dc-5bb67fb039b5';

// Refresh intervals and cache settings
const AUTO_REFRESH_INTERVAL = 10 * 60 * 1000; // 10 minutes
const CACHE_CLEANUP_INTERVAL = 30 * 60 * 1000; // 30 minutes
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes cache duration

// Global cache for the team portfolio
const teamPortfolioCache: {
  data: PortfolioSummary | null;
  timestamp: number;
} = {
  data: null,
  timestamp: 0
};

export function useTeamPortfolioData() {
  const [portfolio, setPortfolio] = useState<PortfolioSummary | null>(null);
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

  // Fetch portfolio data with caching
  const fetchTeamPortfolio = useCallback(async (forceFetch = false) => {
    const now = Date.now();
    
    // Determine if we can use the cache
    const canUseCache = !forceFetch && 
      teamPortfolioCache.data && 
      (now - teamPortfolioCache.timestamp) < CACHE_DURATION;
    
    // If cache is fresh, use it
    if (canUseCache) {
      setPortfolio(teamPortfolioCache.data);
      setLoading(false);
      console.log('Using team portfolio cache');
      return;
    }

    // Full refresh needed
    setLoading(true);
    setError(null);
    lastFetchRef.current = now;

    try {
      console.log('Fetching team portfolio...');
      const data = await getTeamPortfolio();
      console.log(`Team portfolio fetched successfully with ${data.items.length} items`);
      
      // Update state and cache
      setPortfolio(data);
      teamPortfolioCache.data = data;
      teamPortfolioCache.timestamp = now;
      
      setLoading(false);
    } catch (err) {
      console.error('Error fetching team portfolio:', err);
      setError('Failed to load team portfolio');
      
      // Fall back to cache on error if available
      if (teamPortfolioCache.data) {
        setPortfolio(teamPortfolioCache.data);
      }
      
      toast({
        title: 'Error',
        description: 'Failed to load team portfolio',
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
      console.log('Background refreshing team portfolio...');
      const data = await getTeamPortfolio();
      
      // Update state and cache
      setPortfolio(data);
      const now = Date.now();
      teamPortfolioCache.data = data;
      teamPortfolioCache.timestamp = now;
      
      console.log('Background team portfolio refresh completed');
    } catch (err) {
      console.error('Background team portfolio refresh failed:', err);
      // Don't set error state for background refreshes
    }
  };

  useEffect(() => {
    // Initialize the coin data service when the component mounts
    initCoinDataService()
      .then(() => console.log('Coin data service initialized'))
      .catch(err => console.error('Failed to initialize coin data service:', err));
    
    // Initial fetch when component mounts
    console.log('Fetching team portfolio on mount...');
    fetchTeamPortfolio(true); // Force fetch on initial load
    
    // Set up refresh interval
    const refreshIntervalId = setInterval(() => {
      console.log('Auto-refreshing team portfolio...');
      backgroundRefresh();
    }, AUTO_REFRESH_INTERVAL);
    
    // Set up cache cleanup interval
    const cacheCleanupIntervalId = setInterval(() => {
      console.log('Cleaning up coin data caches...');
      cleanupCaches();
    }, CACHE_CLEANUP_INTERVAL);
    
    return () => {
      clearInterval(refreshIntervalId);
      clearInterval(cacheCleanupIntervalId);
    };
  }, [fetchTeamPortfolio]);

  return {
    portfolio,
    loading,
    error,
    isAdmin,
    fetchTeamPortfolio,
    backgroundRefresh
  };
} 