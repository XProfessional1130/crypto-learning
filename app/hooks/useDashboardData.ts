import { useState, useEffect, useCallback } from 'react';
import { GlobalData } from '@/lib/services/coinmarketcap';
import { useDataCache } from '@/lib/context/data-cache-context';

interface DashboardDataState {
  btcPrice: number | null;
  ethPrice: number | null;
  globalData: GlobalData | null;
  loading: boolean;
  error: string | null;
}

export function useDashboardData(autoRefresh = true, refreshInterval = 5 * 60 * 1000) {
  // Use the shared data cache provider
  const {
    btcPrice: cachedBtcPrice,
    ethPrice: cachedEthPrice,
    globalData: cachedGlobalData,
    isLoading: cacheLoading,
    isRefreshing: cacheRefreshing,
    refreshData: refreshCache
  } = useDataCache();
  
  // Create a local state that mirrors the cache state
  const [state, setState] = useState<DashboardDataState>({
    btcPrice: cachedBtcPrice,
    ethPrice: cachedEthPrice,
    globalData: cachedGlobalData,
    loading: cacheLoading,
    error: null
  });
  
  // Update local state when cache changes
  useEffect(() => {
    setState({
      btcPrice: cachedBtcPrice,
      ethPrice: cachedEthPrice,
      globalData: cachedGlobalData,
      loading: cacheLoading,
      error: null
    });
  }, [cachedBtcPrice, cachedEthPrice, cachedGlobalData, cacheLoading]);
  
  // Set up auto refresh interval if enabled
  useEffect(() => {
    if (!autoRefresh) return;
    
    const intervalId = setInterval(() => {
      refreshCache();
    }, refreshInterval);
    
    return () => clearInterval(intervalId);
  }, [autoRefresh, refreshInterval, refreshCache]);
  
  // Manual refresh function just calls the cache refresh
  const refreshData = useCallback(() => {
    return refreshCache();
  }, [refreshCache]);
  
  return {
    ...state,
    isRefreshing: cacheRefreshing,
    refreshData
  };
} 