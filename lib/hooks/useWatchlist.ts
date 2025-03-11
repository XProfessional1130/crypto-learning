import { useState } from 'react';
import { CoinData } from '@/types/portfolio';

// Define watchlist item type
export interface WatchlistItem {
  id: string;
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  icon: string;
  priceTarget?: number;
  createdAt?: string;
}

/**
 * Hook to manage a user's coin watchlist
 * Note: This is currently using mock data, will be replaced with 
 * actual database integration in a future update
 */
export function useWatchlist() {
  // Mock data for watchlist
  const mockWatchlist: WatchlistItem[] = [
    { 
      id: '1', 
      symbol: 'SOL', 
      name: 'Solana', 
      price: 128.04, 
      change24h: 3.2, 
      icon: 'SOL',
      priceTarget: 150.00,
      createdAt: new Date().toISOString()
    },
    { 
      id: '2', 
      symbol: 'LINK', 
      name: 'Chainlink', 
      price: 14.76, 
      change24h: -1.8, 
      icon: 'LINK',
      priceTarget: 20.00,
      createdAt: new Date().toISOString()
    },
    { 
      id: '3', 
      symbol: 'AVAX', 
      name: 'Avalanche', 
      price: 35.40, 
      change24h: 0.5, 
      icon: 'AVAX',
      priceTarget: 50.00,
      createdAt: new Date().toISOString()
    }
  ];

  const [watchlist, setWatchlist] = useState<WatchlistItem[]>(mockWatchlist);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Add a coin to watchlist
  const addToWatchlist = (coin: CoinData, priceTarget: number) => {
    setWatchlist(prev => {
      // Check if coin already exists in watchlist
      if (prev.some(item => item.id === coin.id)) {
        // Update the existing item with new target price
        return prev.map(item => 
          item.id === coin.id 
            ? { 
                ...item, 
                price: coin.priceUsd,
                change24h: coin.priceChange24h,
                priceTarget: priceTarget,
                updatedAt: new Date().toISOString()
              } 
            : item
        );
      }
      
      // Add new watchlist item
      const newItem: WatchlistItem = {
        id: coin.id,
        symbol: coin.symbol,
        name: coin.name,
        price: coin.priceUsd,
        change24h: coin.priceChange24h,
        icon: coin.symbol,
        priceTarget: priceTarget,
        createdAt: new Date().toISOString()
      };
      
      return [...prev, newItem];
    });
  };

  // Remove a coin from watchlist
  const removeFromWatchlist = (coinId: string) => {
    setWatchlist(prev => prev.filter(coin => coin.id !== coinId));
  };

  // Update price target for a coin
  const updatePriceTarget = (coinId: string, newPriceTarget: number) => {
    setWatchlist(prev => 
      prev.map(item => 
        item.id === coinId 
          ? { ...item, priceTarget: newPriceTarget } 
          : item
      )
    );
  };

  // Check if a coin is in the watchlist
  const isInWatchlist = (coinId: string): boolean => {
    return watchlist.some(coin => coin.id === coinId);
  };
  
  // Get target percentage difference
  const getTargetPercentage = (coin: WatchlistItem): number => {
    if (!coin.priceTarget || coin.price === 0) return 0;
    return ((coin.priceTarget - coin.price) / coin.price) * 100;
  };

  // Refresh watchlist prices (would connect to API in production)
  const refreshWatchlist = async () => {
    setLoading(true);
    try {
      // In a real implementation, this would fetch current prices
      // For now, we'll just simulate a refresh with small price changes
      setWatchlist(prev => 
        prev.map(item => ({
          ...item,
          price: item.price * (1 + (Math.random() * 0.02 - 0.01)), // ±1% change
          change24h: item.change24h + (Math.random() * 1 - 0.5)   // ±0.5% change
        }))
      );
    } catch (error) {
      console.error('Error refreshing watchlist:', error);
      setError('Failed to refresh watchlist prices');
    } finally {
      setLoading(false);
    }
  };

  return {
    watchlist,
    loading,
    error,
    addToWatchlist,
    removeFromWatchlist,
    updatePriceTarget,
    isInWatchlist,
    getTargetPercentage,
    refreshWatchlist
  };
} 