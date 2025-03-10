import { useState } from 'react';

// Define watchlist item type
export interface WatchlistItem {
  id: string;
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  icon: string;
}

/**
 * Hook to manage a user's coin watchlist
 * Note: This is currently using mock data, will be replaced with 
 * actual database integration in a future update
 */
export function useWatchlist() {
  // Mock data for watchlist
  const mockWatchlist: WatchlistItem[] = [
    { id: '1', symbol: 'SOL', name: 'Solana', price: 128.04, change24h: 3.2, icon: 'SOL' },
    { id: '2', symbol: 'LINK', name: 'Chainlink', price: 14.76, change24h: -1.8, icon: 'LINK' },
    { id: '3', symbol: 'AVAX', name: 'Avalanche', price: 35.40, change24h: 0.5, icon: 'AVAX' }
  ];

  const [watchlist, setWatchlist] = useState<WatchlistItem[]>(mockWatchlist);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Add a coin to watchlist
  const addToWatchlist = (coin: any) => {
    setWatchlist(prev => {
      // Check if coin already exists in watchlist
      if (prev.some(item => item.id === coin.id)) {
        return prev;
      }
      return [...prev, coin];
    });
  };

  // Remove a coin from watchlist
  const removeFromWatchlist = (coinId: string) => {
    setWatchlist(prev => prev.filter(coin => coin.id !== coinId));
  };

  // Check if a coin is in the watchlist
  const isInWatchlist = (coinId: string): boolean => {
    return watchlist.some(coin => coin.id === coinId);
  };

  return {
    watchlist,
    loading,
    error,
    addToWatchlist,
    removeFromWatchlist,
    isInWatchlist
  };
} 