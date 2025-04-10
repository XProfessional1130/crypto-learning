'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode, useRef } from 'react';
import { PortfolioSummary, CoinData } from '@/types/portfolio';
import { WatchlistItem } from '@/hooks/dashboard/useWatchlist';
import { useToast } from '@/hooks/ui/useToast';
import { useAuth } from '@/lib/providers/auth-provider';
import { 
  searchCoins,
  isCoinDataServiceInitialized 
} from '@/lib/api/coinmarketcap';
import {
  addCoinToTeamPortfolio,
  updateTeamPortfolioCoinAmount,
  removeFromTeamPortfolio,
  processTeamPortfolioWithCache
} from '@/lib/api/team-portfolio';
import {
  getTeamWatchlist,
  addToTeamWatchlist,
  updateTeamWatchlistPriceTarget,
  removeFromTeamWatchlist,
  processWatchlistItems,
  processWatchlistItemsWithCache
} from '@/lib/api/team-watchlist';
import { useDataCache } from '@/lib/providers/data-cache-provider';
import supabase from '@/lib/api/supabase-client';

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
  // Refs for deduplication
  const portfolioPromiseRef = useRef<Promise<PortfolioSummary | null> | null>(null);
  const watchlistPromiseRef = useRef<Promise<{ items: WatchlistItem[] } | null> | null>(null);
  
  // State for portfolio
  const [portfolio, setPortfolio] = useState<PortfolioSummary | null>(null);
  const [portfolioLoading, setPortfolioLoading] = useState<boolean>(false);
  const [portfolioError, setPortfolioError] = useState<string | null>(null);
  const [portfolioLastRefreshed, setPortfolioLastRefreshed] = useState<Date | null>(null);
  
  // State for watchlist
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [watchlistLoading, setWatchlistLoading] = useState<boolean>(false);
  const [watchlistError, setWatchlistError] = useState<string | null>(null);
  const [watchlistLastRefreshed, setWatchlistLastRefreshed] = useState<Date | null>(null);
  
  // Admin state
  const [isAdmin, setIsAdmin] = useState(false);
  
  // Hooks
  const toast = useToast();
  const { user } = useAuth();
  
  // Use the DataCacheProvider for coin prices
  const { getMultipleCoinsData, setCoinData } = useDataCache();
  
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
      setPortfolioError(null);
      
      // Fetch raw portfolio data from Supabase
      const { data: portfolioItems, error } = await supabase
        .from('team_portfolio')
        .select('*');
        
      if (error) {
        console.error('Error fetching team portfolio:', error);
        setPortfolioError('Failed to load portfolio data');
        return null;
      }
      
      // Use the cache-aware processor with our data cache
      const processed = await processTeamPortfolioWithCache(portfolioItems || [], getMultipleCoinsData);
      
      // Set the portfolio data
      setPortfolio(processed);
      
      // Set last refreshed timestamp
      setPortfolioLastRefreshed(new Date());
      
      return processed;
    } catch (error) {
      console.error('Error fetching team portfolio:', error);
      setPortfolioError('Failed to load portfolio data');
      return null;
    } finally {
      setPortfolioLoading(false);
    }
  }, [getMultipleCoinsData]);
  
  // Fetch watchlist data with request deduplication
  const fetchWatchlist = useCallback(async (forceFetch = false): Promise<{ items: WatchlistItem[] } | null> => {
    // If a request is already in flight, use it
    if (watchlistPromiseRef.current && !forceFetch) {
      return watchlistPromiseRef.current;
    }
    
    try {
      setWatchlistLoading(true);
      setWatchlistError(null);
      
      // Fetch raw watchlist data from Supabase
      const { data: watchlistItems, error } = await supabase
        .from('team_watchlist')
        .select('*');
        
      if (error) {
        console.error('Error fetching team watchlist:', error);
        setWatchlistError('Failed to load watchlist data');
        return null;
      }
      
      // Use the cache-aware processor with our data cache
      const processed = await processWatchlistItemsWithCache(watchlistItems || [], getMultipleCoinsData);
      
      // Set the watchlist data
      setWatchlist(processed.items);
      
      // Set last refreshed timestamp
      setWatchlistLastRefreshed(new Date());
      
      return processed;
    } catch (error) {
      console.error('Error fetching team watchlist:', error);
      setWatchlistError('Failed to load watchlist data');
      return null;
    } finally {
      setWatchlistLoading(false);
    }
  }, [getMultipleCoinsData]);
  
  // Initialize service and data when component mounts
  useEffect(() => {
    let isActive = true;
    let refreshIntervalId: NodeJS.Timeout | null = null;
    
    const setup = async () => {
      try {
        // Initialize service first
        await initializeServiceRef.current();
        
        if (!isActive) return;
        
        // Set loading states first
        setPortfolioLoading(true);
        setWatchlistLoading(true);
        
        // Fetch initial data in parallel
        const results = await Promise.allSettled([
          fetchPortfolio(true),
          fetchWatchlist(true)
        ]);
        
        if (!isActive) return;
        
        // Handle results
        results.forEach((result, index) => {
          if (result.status === 'rejected') {
            console.error(`Failed to fetch ${index === 0 ? 'portfolio' : 'watchlist'}:`, result.reason);
          }
        });
        
        // Set loading states to false regardless of success/failure
        setPortfolioLoading(false);
        setWatchlistLoading(false);
        
        // Set up refresh interval
        refreshIntervalId = setInterval(() => {
          console.log('Auto-refreshing team data...');
          fetchPortfolio().catch(err => console.error('Error refreshing portfolio:', err));
          fetchWatchlist().catch(err => console.error('Error refreshing watchlist:', err));
        }, AUTO_REFRESH_INTERVAL);
      } catch (error) {
        console.error('Error in team data setup:', error);
        
        // Ensure loading states are set to false even if initialization fails
        setPortfolioLoading(false);
        setWatchlistLoading(false);
      }
    };
    
    // Start setup
    setup();
    
    return () => {
      isActive = false;
      if (refreshIntervalId) clearInterval(refreshIntervalId);
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