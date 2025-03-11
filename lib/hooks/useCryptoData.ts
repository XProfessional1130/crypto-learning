'use client';

import { useQuery } from '@tanstack/react-query';
import { getBtcPrice, getEthPrice, getGlobalData } from '@/lib/services/coinmarketcap';

const PRICE_CACHE_TIME = 5 * 60 * 1000; // 5 minutes

/**
 * Hook for fetching Bitcoin price data
 */
export function useBtcPrice() {
  return useQuery({
    queryKey: ['btcPrice'],
    queryFn: getBtcPrice,
    staleTime: PRICE_CACHE_TIME,
    refetchInterval: PRICE_CACHE_TIME,
  });
}

/**
 * Hook for fetching Ethereum price data
 */
export function useEthPrice() {
  return useQuery({
    queryKey: ['ethPrice'],
    queryFn: getEthPrice,
    staleTime: PRICE_CACHE_TIME,
    refetchInterval: PRICE_CACHE_TIME,
  });
}

/**
 * Hook for fetching global market data
 */
export function useGlobalData() {
  return useQuery({
    queryKey: ['globalData'],
    queryFn: getGlobalData,
    staleTime: PRICE_CACHE_TIME,
    refetchInterval: PRICE_CACHE_TIME,
  });
}

/**
 * Combined hook for fetching all basic crypto data
 * This avoids multiple separate hooks in components
 */
export function useCryptoData() {
  const btcQuery = useBtcPrice();
  const ethQuery = useEthPrice();
  const globalQuery = useGlobalData();
  
  const isLoading = btcQuery.isLoading || ethQuery.isLoading || globalQuery.isLoading;
  const isError = btcQuery.isError || ethQuery.isError || globalQuery.isError;
  
  return {
    btcPrice: btcQuery.data,
    ethPrice: ethQuery.data,
    globalData: globalQuery.data,
    isLoading,
    isError,
    refetch: async () => {
      await Promise.all([
        btcQuery.refetch(),
        ethQuery.refetch(),
        globalQuery.refetch()
      ]);
    }
  };
} 