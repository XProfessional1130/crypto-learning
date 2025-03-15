'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode, useRef } from 'react';
import { PortfolioSummary, CoinData } from '@/types/portfolio';
import { WatchlistItem } from '@/lib/hooks/useWatchlist';
import { useToast } from '@/lib/hooks/useToast';
import { useAuth } from '@/lib/auth-context';
import { 
  searchCoins,
  cleanupCaches,
  isCoinDataServiceInitialized 
} from '@/lib/services/coinmarketcap';
import {
  addCoinToTeamPortfolio,
  updateTeamPortfolioCoinAmount,
  removeFromTeamPortfolio,
  processTeamPortfolioWithCache
} from '@/lib/services/team-portfolio';
import {
  getTeamWatchlist,
  addToTeamWatchlist,
  updateTeamWatchlistPriceTarget,
  removeFromTeamWatchlist,
  processWatchlistItems
} from '@/lib/services/team-watchlist';
import { useDataCache } from '@/lib/context/data-cache-context';
import supabase from '@/lib/services/supabase-client';

// Admin ID for permission checks
const TEAM_ADMIN_ID = process.env.NEXT_PUBLIC_TEAM_ADMIN_ID || '529cfde5-d8c3-4a6a-a9dc-5bb67fb039b5';

// Refresh intervals and cache settings
const AUTO_REFRESH_INTERVAL = 10 * 60 * 1000; // 10 minutes
const CACHE_CLEANUP_INTERVAL = 30 * 60 * 1000; // 30 minutes
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes cache duration

// Track promise states to prevent duplicate requests
let isServiceInitializing = false;

// Define the context type
interface TeamDataContextType {
  // Portfolio state
  portfolio: PortfolioSummary | null;
  portfolioLoading: boolean;
  portfolioError: string | null;
  
  // Watchlist state
  watchlist: WatchlistItem[];
  watchlistLoading: boolean;
  watchlistError: string | null;
  
  // Admin state
  isAdmin: boolean;
  
  // Portfolio methods
  refreshPortfolio: (forceFetch?: boolean) => Promise<PortfolioSummary | null>;
  addCoin: (coinData: CoinData, amount: number) => Promise<any>;
  updateAmount: (itemId: string, amount: number) => Promise<any>;
  removeCoin: (itemId: string) => Promise<any>;
  
  // Watchlist methods
  refreshWatchlist: (forceFetch?: boolean) => Promise<{ items: WatchlistItem[] } | null>;
  addToWatchlist: (coinData: CoinData, priceTarget?: number) => Promise<any>;
  updatePriceTarget: (itemId: string, priceTarget: number) => Promise<any>;
  removeFromWatchlist: (itemId: string) => Promise<any>;
  getTargetPercentage: (item: WatchlistItem) => number;
  isInWatchlist: (coinId: string) => boolean;
}

// Create the context with a default value
const TeamDataContext = createContext<TeamDataContextType | null>(null);

// Provider component
export function TeamDataProvider({ children }: { children: ReactNode }) {
  // Portfolio state
  const [portfolio, setPortfolio] = useState<PortfolioSummary | null>(null);
  const [portfolioLoading, setPortfolioLoading] = useState(true);
  const [portfolioError, setPortfolioError] = useState<string | null>(null);
  
  // Watchlist state
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [watchlistLoading, setWatchlistLoading] = useState(true);
  const [watchlistError, setWatchlistError] = useState<string | null>(null);
  
  // Admin state
  const [isAdmin, setIsAdmin] = useState(false);
  
  // Refs for tracking promise state
  const portfolioPromiseRef = useRef<Promise<PortfolioSummary> | null>(null);
  const watchlistPromiseRef = useRef<Promise<{ items: WatchlistItem[] }> | null>(null);
  
  // Hooks
  const toast = useToast();
  const { user } = useAuth();
  
  // Use the DataCacheProvider for coin prices
  const { getMultipleCoinsData } = useDataCache();
  
  // Use refs to make functions stable across renders
  const initializeServiceRef = useRef(async () => {
    if (isServiceInitializing) return;
    
    // Prevent concurrent initializations
    isServiceInitializing = true;
    
    if (!isCoinDataServiceInitialized()) {
      console.log('TeamDataProvider: Coin data service already initialized by DataPrefetcher');
    }
    
    isServiceInitializing = false;
  });
  
  // Check if the current user is the admin
  useEffect(() => {
    if (user && user.id === TEAM_ADMIN_ID) {
      setIsAdmin(true);
    } else {
      setIsAdmin(false);
    }
  }, [user]);
  
  // Fetch portfolio data with request deduplication
  const fetchPortfolio = useCallback(async (forceFetch = false): Promise<PortfolioSummary | null> => {
    // If a request is already in flight, use it
    if (portfolioPromiseRef.current && !forceFetch) {
      return portfolioPromiseRef.current;
    }
    
    // Create new request
    try {
      setPortfolioLoading(true);
      
      // Store the promise for deduplication
      const fetchPortfolioPromise = async () => {
        console.log('Starting Supabase query for team_portfolio');
        
        try {
          // Fetch raw portfolio items from Supabase
          const { data: portfolioItems, error } = await supabase
            .from('team_portfolio')
            .select('*')
            .order('coin_name', { ascending: true });
          
          if (error) {
            console.error('Supabase query error:', error);
            throw new Error(`Failed to fetch portfolio items: ${error.message}`);
          }

          console.log(`Supabase query successful: got ${portfolioItems?.length || 0} items`);
          
          // Process the portfolio items using the DataCacheProvider
          return processTeamPortfolioWithCache(portfolioItems || [], getMultipleCoinsData);
        } catch (err) {
          console.error('Error in fetch portfolio promise:', err);
          throw err;
        }
      };
      
      portfolioPromiseRef.current = fetchPortfolioPromise();
      
      // Wait for data
      console.log('Fetching team portfolio...');
      const data = await portfolioPromiseRef.current;
      console.log(`Team portfolio fetched successfully with ${data.items.length} items`);
      
      // Update state
      setPortfolio(data);
      setPortfolioLoading(false);
      setPortfolioError(null);
      
      return data;
    } catch (err) {
      console.error('Error fetching team portfolio:', err);
      setPortfolioError('Failed to load team portfolio');
      setPortfolioLoading(false);
      
      // Display error
      toast({
        title: 'Error',
        description: 'Failed to load team portfolio',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      
      return null;
    } finally {
      // Clear promise reference
      portfolioPromiseRef.current = null;
    }
  }, [toast, getMultipleCoinsData]);
  
  // Fetch watchlist data with request deduplication
  const fetchWatchlist = useCallback(async (forceFetch = false): Promise<{ items: WatchlistItem[] } | null> => {
    // If a request is already in flight, use it
    if (watchlistPromiseRef.current && !forceFetch) {
      return watchlistPromiseRef.current;
    }
    
    try {
      setWatchlistLoading(true);
      
      // Store the promise for deduplication
      const fetchWatchlistPromise = async () => {
        console.log('Starting Supabase query for team_watchlist');
        
        try {
          // Direct Supabase query instead of using getTeamWatchlist
          const { data: watchlistItems, error } = await supabase
            .from('team_watchlist')
            .select('*')
            .order('name', { ascending: true });
          
          if (error) {
            console.error('Supabase watchlist query error:', error);
            throw new Error(`Failed to fetch watchlist items: ${error.message}`);
          }
          
          console.log(`Supabase watchlist query successful: got ${watchlistItems?.length || 0} items`);
          
          // Process the items with the existing function
          const processedData = await processWatchlistItems(watchlistItems || []);
          return processedData;
        } catch (err) {
          console.error('Error in fetch watchlist promise:', err);
          throw err;
        }
      };
      
      watchlistPromiseRef.current = fetchWatchlistPromise();
      
      // Wait for data
      console.log('Fetching team watchlist...');
      const data = await watchlistPromiseRef.current;
      console.log(`Team watchlist fetched successfully with ${data.items.length} items`);
      
      // Update state
      setWatchlist(data.items);
      setWatchlistLoading(false);
      setWatchlistError(null);
      
      return data;
    } catch (err) {
      console.error('Error fetching team watchlist:', err);
      setWatchlistError('Failed to load team watchlist');
      setWatchlistLoading(false);
      
      // Display error
      toast({
        title: 'Error',
        description: 'Failed to load team watchlist',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      
      return null;
    } finally {
      // Clear promise reference
      watchlistPromiseRef.current = null;
    }
  }, [toast]);
  
  // Initialize service and data when component mounts
  useEffect(() => {
    let isActive = true;
    let refreshIntervalId: NodeJS.Timeout | null = null;
    let cacheCleanupIntervalId: NodeJS.Timeout | null = null;
    
    const setup = async () => {
      // Initialize service first
      await initializeServiceRef.current();
      
      if (!isActive) return;
      
      // Fetch initial data in parallel
      await Promise.all([
        fetchPortfolio(true),
        fetchWatchlist(true)
      ]);
      
      if (!isActive) return;
      
      // Set up refresh interval
      refreshIntervalId = setInterval(() => {
        console.log('Auto-refreshing team data...');
        fetchPortfolio();
        fetchWatchlist();
      }, AUTO_REFRESH_INTERVAL);
      
      // Set up cache cleanup interval
      cacheCleanupIntervalId = setInterval(() => {
        console.log('Cleaning up coin data caches...');
        cleanupCaches();
      }, CACHE_CLEANUP_INTERVAL);
    };
    
    setup();
    
    return () => {
      isActive = false;
      if (refreshIntervalId) clearInterval(refreshIntervalId);
      if (cacheCleanupIntervalId) clearInterval(cacheCleanupIntervalId);
    };
  }, []);
  
  // Add a coin to the team portfolio (admin only)
  const addCoin = useCallback(async (coinData: CoinData, amount: number) => {
    if (!user) {
      toast({
        title: 'Error',
        description: 'You must be logged in to perform this action',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      return { success: false };
    }

    if (user.id !== TEAM_ADMIN_ID) {
      toast({
        title: 'Error',
        description: 'Only the admin can modify the team portfolio',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      return { success: false };
    }

    try {
      const result = await addCoinToTeamPortfolio(coinData, amount);
      
      if (result.success) {
        // Refresh the portfolio to get the updated data
        await fetchPortfolio(true);
        
        toast({
          title: 'Success',
          description: 'Coin added to team portfolio',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      } else {
        toast({
          title: 'Error',
          description: result.message,
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      }
      
      return result;
    } catch (error) {
      console.error('Error adding coin to team portfolio:', error);
      
      toast({
        title: 'Error',
        description: 'Failed to add coin to team portfolio',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      
      return { success: false, message: 'An unexpected error occurred' };
    }
  }, [user, toast, fetchPortfolio]);
  
  // Update a coin's amount in the team portfolio (admin only)
  const updateAmount = useCallback(async (itemId: string, amount: number) => {
    if (!user) {
      toast({
        title: 'Error',
        description: 'You must be logged in to perform this action',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      return { success: false };
    }

    if (user.id !== TEAM_ADMIN_ID) {
      toast({
        title: 'Error',
        description: 'Only the admin can modify the team portfolio',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      return { success: false };
    }

    try {
      const result = await updateTeamPortfolioCoinAmount(itemId, amount);
      
      if (result.success) {
        // Refresh the portfolio to get the updated data
        await fetchPortfolio(true);
        
        toast({
          title: 'Success',
          description: 'Coin amount updated in team portfolio',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      } else {
        toast({
          title: 'Error',
          description: result.message,
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      }
      
      return result;
    } catch (error) {
      console.error('Error updating coin in team portfolio:', error);
      
      toast({
        title: 'Error',
        description: 'Failed to update coin in team portfolio',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      
      return { success: false, message: 'An unexpected error occurred' };
    }
  }, [user, toast, fetchPortfolio]);
  
  // Remove a coin from the team portfolio (admin only)
  const removeCoin = useCallback(async (itemId: string) => {
    if (!user) {
      toast({
        title: 'Error',
        description: 'You must be logged in to perform this action',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      return { success: false };
    }

    if (user.id !== TEAM_ADMIN_ID) {
      toast({
        title: 'Error',
        description: 'Only the admin can modify the team portfolio',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      return { success: false };
    }

    try {
      const result = await removeFromTeamPortfolio(itemId);
      
      if (result.success) {
        // Refresh the portfolio to get the updated data
        await fetchPortfolio(true);
        
        toast({
          title: 'Success',
          description: 'Coin removed from team portfolio',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      } else {
        toast({
          title: 'Error',
          description: result.message,
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      }
      
      return result;
    } catch (error) {
      console.error('Error removing coin from team portfolio:', error);
      
      toast({
        title: 'Error',
        description: 'Failed to remove coin from team portfolio',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      
      return { success: false, message: 'An unexpected error occurred' };
    }
  }, [user, toast, fetchPortfolio]);
  
  // Add a coin to the team watchlist (admin only)
  const addToWatchlist = useCallback(async (coinData: CoinData, priceTarget?: number) => {
    if (!user) {
      toast({
        title: 'Error',
        description: 'You must be logged in to perform this action',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      return { success: false };
    }

    if (user.id !== TEAM_ADMIN_ID) {
      toast({
        title: 'Error',
        description: 'Only the admin can modify the team watchlist',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      return { success: false };
    }

    try {
      const result = await addToTeamWatchlist(coinData, priceTarget);
      
      if (result.success) {
        // Refresh the watchlist to get the updated data
        await fetchWatchlist(true);
        
        toast({
          title: 'Success',
          description: 'Coin added to team watchlist',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      } else {
        toast({
          title: 'Error',
          description: result.message,
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      }
      
      return result;
    } catch (error) {
      console.error('Error adding coin to team watchlist:', error);
      
      toast({
        title: 'Error',
        description: 'Failed to add coin to team watchlist',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      
      return { success: false, message: 'An unexpected error occurred' };
    }
  }, [user, toast, fetchWatchlist]);
  
  // Update a coin's price target in the team watchlist (admin only)
  const updatePriceTarget = useCallback(async (itemId: string, priceTarget: number) => {
    if (!user) {
      toast({
        title: 'Error',
        description: 'You must be logged in to perform this action',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      return { success: false };
    }

    if (user.id !== TEAM_ADMIN_ID) {
      toast({
        title: 'Error',
        description: 'Only the admin can modify the team watchlist',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      return { success: false };
    }

    try {
      const result = await updateTeamWatchlistPriceTarget(itemId, priceTarget);
      
      if (result.success) {
        // Refresh the watchlist to get the updated data
        await fetchWatchlist(true);
        
        toast({
          title: 'Success',
          description: 'Price target updated in team watchlist',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      } else {
        toast({
          title: 'Error',
          description: result.message,
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      }
      
      return result;
    } catch (error) {
      console.error('Error updating coin in team watchlist:', error);
      
      toast({
        title: 'Error',
        description: 'Failed to update coin in team watchlist',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      
      return { success: false, message: 'An unexpected error occurred' };
    }
  }, [user, toast, fetchWatchlist]);
  
  // Remove a coin from the team watchlist (admin only)
  const removeFromWatchlist = useCallback(async (itemId: string) => {
    if (!user) {
      toast({
        title: 'Error',
        description: 'You must be logged in to perform this action',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      return { success: false };
    }

    if (user.id !== TEAM_ADMIN_ID) {
      toast({
        title: 'Error',
        description: 'Only the admin can modify the team watchlist',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      return { success: false };
    }

    try {
      const result = await removeFromTeamWatchlist(itemId);
      
      if (result.success) {
        // Refresh the watchlist to get the updated data
        await fetchWatchlist(true);
        
        toast({
          title: 'Success',
          description: 'Coin removed from team watchlist',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      } else {
        toast({
          title: 'Error',
          description: result.message,
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      }
      
      return result;
    } catch (error) {
      console.error('Error removing coin from team watchlist:', error);
      
      toast({
        title: 'Error',
        description: 'Failed to remove coin from team watchlist',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      
      return { success: false, message: 'An unexpected error occurred' };
    }
  }, [user, toast, fetchWatchlist]);
  
  // Calculate target percentage (useful for watchlist items with price targets)
  const getTargetPercentage = useCallback((item: WatchlistItem): number => {
    if (!item.priceTarget || !item.price) return 0;
    
    // Calculate percentage to reach the target from current price
    return ((item.priceTarget - item.price) / item.price) * 100;
  }, []);
  
  // Check if a coin is already in the watchlist
  const isInWatchlist = useCallback((coinId: string): boolean => {
    return watchlist.some(item => item.coinId === coinId);
  }, [watchlist]);
  
  // Create the context value
  const contextValue: TeamDataContextType = {
    // Portfolio state
    portfolio,
    portfolioLoading,
    portfolioError,
    
    // Watchlist state
    watchlist,
    watchlistLoading,
    watchlistError,
    
    // Admin state
    isAdmin,
    
    // Portfolio methods
    refreshPortfolio: fetchPortfolio,
    addCoin,
    updateAmount,
    removeCoin,
    
    // Watchlist methods
    refreshWatchlist: fetchWatchlist,
    addToWatchlist,
    updatePriceTarget,
    removeFromWatchlist,
    getTargetPercentage,
    isInWatchlist
  };
  
  return (
    <TeamDataContext.Provider value={contextValue}>
      {children}
    </TeamDataContext.Provider>
  );
}

// Custom hook to use the context
export function useTeamData() {
  const context = useContext(TeamDataContext);
  
  if (!context) {
    throw new Error('useTeamData must be used within a TeamDataProvider');
  }
  
  return context;
} 