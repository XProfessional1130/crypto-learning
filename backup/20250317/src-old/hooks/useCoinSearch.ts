import { useState, useEffect, useCallback, useRef } from 'react';
import { CoinData } from '@/types/portfolio';
import { searchCoinsFromSupabase } from '@/lib/services/supabase-crypto';
import { getTopCoinsFromSupabase } from '@/lib/services/supabase-crypto';
import { useDataCache } from '@/lib/context/data-cache-context';

// Debounce setting
const SEARCH_DEBOUNCE = 300; // 300ms debounce for search
const TOP_COINS_LIMIT = 20; // Number of top coins to show

/**
 * Custom hook for searching cryptocurrencies with real-time results
 * Features:
 * - Debounced search as user types (client-side filtering first)
 * - Uses global data cache system
 * - Top coins shown when no search query
 */
export function useCoinSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<CoinData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [topCoins, setTopCoins] = useState<CoinData[]>([]);
  const [hasLoadedTopCoins, setHasLoadedTopCoins] = useState(false);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);
  const currentQueryRef = useRef<string>('');
  const pendingRequestRef = useRef<boolean>(false);
  
  // Use the global data cache
  const dataCache = useDataCache();

  // Function to get top coins (displayed when no search query)
  const fetchTopCoins = useCallback(async (force = false) => {
    // If we already have top coins and not forcing refresh, just use them
    if (topCoins.length > 0 && !force) {
      setResults(topCoins);
      return topCoins;
    }
    
    try {
      setIsLoading(true);
      
      // Use Supabase directly instead of the CoinMarketCap API
      const coins = await getTopCoinsFromSupabase(TOP_COINS_LIMIT);
      
      if (coins.length > 0) {
        // Store top coins in state
        setTopCoins(coins);
        setResults(coins);
        setHasLoadedTopCoins(true);
        
        // Add all top coins to the global cache for later use
        if (dataCache) {
          const coinsMap: Record<string, CoinData> = {};
          coins.forEach(coin => {
            coinsMap[coin.id] = coin;
          });
          dataCache.setMultipleCoinsData(coinsMap);
        }
        
        return coins;
      }
      return [];
    } catch (err) {
      console.error('Error fetching top coins:', err);
      setError('Failed to fetch top cryptocurrencies');
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [topCoins, dataCache]);

  // Client-side filtering for immediate responsiveness
  const filterCoins = useCallback((searchQuery: string, coins: CoinData[]) => {
    if (!searchQuery.trim()) {
      return coins;
    }
    
    const lowercaseQuery = searchQuery.toLowerCase();
    return coins.filter(coin => 
      coin.name.toLowerCase().includes(lowercaseQuery) || 
      coin.symbol.toLowerCase().includes(lowercaseQuery)
    );
  }, []);

  // Function to search coins with the current query
  const searchCoins = useCallback(async (searchQuery: string) => {
    if (pendingRequestRef.current) {
      return; // Prevent multiple simultaneous requests
    }
    
    // Skip API call for empty queries or if it's the same as current query
    if (!searchQuery.trim() || searchQuery === currentQueryRef.current) {
      return;
    }
    
    // Only make API calls for queries with 2 or more characters
    if (searchQuery.trim().length < 2) {
      return;
    }
    
    try {
      setIsLoading(true);
      pendingRequestRef.current = true;
      currentQueryRef.current = searchQuery;
      
      const searchResults = await searchCoinsFromSupabase(searchQuery.trim());
      
      // Add search results to global cache
      if (dataCache && searchResults.length > 0) {
        const coinsMap: Record<string, CoinData> = {};
        searchResults.forEach(coin => {
          coinsMap[coin.id] = coin;
        });
        dataCache.setMultipleCoinsData(coinsMap);
      }
      
      // Only update if this is still the current query
      if (query === searchQuery) {
        setResults(searchResults);
      }
    } catch (err) {
      console.error('Error searching coins:', err);
      setError('Failed to search cryptocurrencies');
    } finally {
      setIsLoading(false);
      pendingRequestRef.current = false;
    }
  }, [query, dataCache]);

  // Process query changes with a stable approach
  useEffect(() => {
    // Cancel any previous debounce timer
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
      debounceTimer.current = null;
    }
    
    // Handle empty query - show top coins
    if (!query.trim()) {
      setResults(topCoins);
      setError(null);
      return;
    }
    
    // Immediate client-side filtering for any query length
    const filteredResults = filterCoins(query, topCoins);
    setResults(filteredResults);
    
    // For queries with at least 2 characters, schedule an API call
    // but only if we don't have enough local results
    if (query.trim().length >= 2 && filteredResults.length < 5 && !pendingRequestRef.current) {
      debounceTimer.current = setTimeout(() => {
        searchCoins(query);
      }, SEARCH_DEBOUNCE);
    }
    
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
        debounceTimer.current = null;
      }
    };
  }, [query, topCoins, filterCoins, searchCoins]);

  // Load top coins once on initial mount
  useEffect(() => {
    if (!hasLoadedTopCoins) {
      fetchTopCoins();
    }
  }, [fetchTopCoins, hasLoadedTopCoins]);

  // Function to handle query changes (called on input change)
  const handleQueryChange = useCallback((newQuery: string) => {
    setQuery(newQuery);
  }, []);

  return {
    query,
    results,
    isLoading,
    error,
    setQuery: handleQueryChange,
    clearSearch: () => setQuery('')
  };
} 