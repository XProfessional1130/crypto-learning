import { WatchlistItem } from '@/lib/hooks/useWatchlist';
import { CoinData } from '@/types/portfolio';
import supabase from './supabase-client';

export interface WatchlistDbItem {
  id: string;
  user_id: string;
  coin_id: string;
  symbol: string;
  name: string;
  price_target: number | null;
  created_at: string;
  updated_at: string;
}

/**
 * Fetch the user's watchlist items from Supabase
 */
export async function fetchWatchlist(): Promise<WatchlistDbItem[]> {
  // Get the current user session
  const { data: sessionData } = await supabase.auth.getSession();
  
  if (!sessionData.session || !sessionData.session.user) {
    // Return empty array if not logged in
    return [];
  }
  
  const { data, error } = await supabase
    .from('watchlist')
    .select('*')
    .order('created_at', { ascending: false });
    
  if (error) {
    console.error('Error fetching watchlist:', error);
    throw new Error('Failed to fetch watchlist');
  }
  
  return data || [];
}

/**
 * Add a coin to the user's watchlist
 */
export async function addToWatchlist(coin: CoinData, priceTarget: number): Promise<WatchlistDbItem> {
  // Get the current user session
  const { data: sessionData } = await supabase.auth.getSession();
  
  if (!sessionData.session || !sessionData.session.user) {
    throw new Error('You must be logged in to add items to your watchlist');
  }
  
  const userId = sessionData.session.user.id;
  
  const { data, error } = await supabase
    .from('watchlist')
    .upsert({
      user_id: userId,
      coin_id: coin.id,
      symbol: coin.symbol,
      name: coin.name,
      price_target: priceTarget
    }, { 
      onConflict: 'user_id,coin_id',
      ignoreDuplicates: false  // Update if there's a conflict
    })
    .select('*')
    .single();
    
  if (error) {
    console.error('Error adding coin to watchlist:', error);
    throw new Error('Failed to add coin to watchlist');
  }
  
  return data;
}

/**
 * Update the price target for a watchlist item
 */
export async function updatePriceTarget(itemId: string, priceTarget: number): Promise<WatchlistDbItem> {
  // Get the current user session
  const { data: sessionData } = await supabase.auth.getSession();
  
  if (!sessionData.session || !sessionData.session.user) {
    throw new Error('You must be logged in to update your watchlist');
  }
  
  const { data, error } = await supabase
    .from('watchlist')
    .update({ price_target: priceTarget })
    .eq('id', itemId)
    .select('*')
    .single();
    
  if (error) {
    console.error('Error updating price target:', error);
    throw new Error('Failed to update price target');
  }
  
  return data;
}

/**
 * Remove a coin from the watchlist
 */
export async function removeFromWatchlist(itemId: string): Promise<void> {
  // Get the current user session
  const { data: sessionData } = await supabase.auth.getSession();
  
  if (!sessionData.session || !sessionData.session.user) {
    throw new Error('You must be logged in to remove items from your watchlist');
  }
  
  const { error } = await supabase
    .from('watchlist')
    .delete()
    .eq('id', itemId);
    
  if (error) {
    console.error('Error removing coin from watchlist:', error);
    throw new Error('Failed to remove coin from watchlist');
  }
} 