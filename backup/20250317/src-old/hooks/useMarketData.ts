import { useState, useEffect, useCallback } from 'react';
import { getBtcPrice, getEthPrice, getGlobalData, GlobalData } from '@/lib/services/coinmarketcap';
import { useDataCache } from '@/lib/context/data-cache-context';

/**
 * @deprecated Use useDataCache hook from data-cache-context.tsx instead.
 * This hook is kept for backward compatibility with existing code.
 * 
 * Hook for fetching basic market data used by multiple dashboards
 */
export function useMarketData() {
  // Use the data cache context instead of managing our own state
  const {
    btcPrice,
    ethPrice,
    globalData,
    isLoading,
    isRefreshing,
    refreshData
  } = useDataCache();
  
  // Return the same interface as before for backward compatibility
  return {
    btcPrice,
    ethPrice,
    globalData,
    isLoading,
    isRefreshing,
    refreshData
  };
} 