import { WatchlistItem } from '@/hooks/useWatchlist';
import { getMultipleCoinsData } from './coinmarketcap';
import supabase from './supabase-client';
import { CoinData } from '@/types/portfolio';

// Admin ID is needed for permission checks
const TEAM_ADMIN_ID = process.env.NEXT_PUBLIC_TEAM_ADMIN_ID || '529cfde5-d8c3-4a6a-a9dc-5bb67fb039b5';

/**
 * Fetch the team watchlist from the dedicated team_watchlist table
 */
export async function getTeamWatchlist(): Promise<{ items: WatchlistItem[] }> {
  try {
    console.log('Attempting to fetch team watchlist from team_watchlist table');
    
    // Check if the team_watchlist table exists by making a small query
    const { data: tableCheckData, error: tableCheckError } = await supabase
      .from('team_watchlist')
      .select('id')
      .limit(1);
    
    if (tableCheckError) {
      console.error('Error checking team_watchlist table:', tableCheckError);
      console.log('The team_watchlist table may not exist yet. Please run the database migrations.');
      
      // Return empty watchlist
      return { items: [] };
    }
    
    console.log('Connected to team_watchlist table successfully');
    
    // Fetch all watchlist items from the team_watchlist table
    const { data: watchlistItems, error } = await supabase
      .from('team_watchlist')
      .select('*');
      
    if (error) {
      console.error('Error fetching team watchlist items:', error);
      return { items: [] };
    }
    
    if (!watchlistItems || watchlistItems.length === 0) {
      console.log('No watchlist items found in the team watchlist.');
    }
    
    return processWatchlistItems(watchlistItems || []);
    
  } catch (error) {
    console.error('Error fetching team watchlist:', error);
    
    // Return empty watchlist on error
    return { items: [] };
  }
}

/**
 * Add a coin to the team watchlist
 * Only admin users can call this function successfully
 */
export async function addToTeamWatchlist(coinData: CoinData, priceTarget?: number): Promise<{success: boolean, message: string}> {
  console.log('addToTeamWatchlist called with coinData:', coinData);
  console.log('priceTarget:', priceTarget);
  
  try {
    // Verify the user is the admin
    const session = await supabase.auth.getSession();
    const currentUserId = session.data.session?.user?.id;
    
    console.log('Current user ID:', currentUserId);
    console.log('TEAM_ADMIN_ID:', TEAM_ADMIN_ID);
    
    if (!currentUserId || currentUserId !== TEAM_ADMIN_ID) {
      console.error('Only the admin can modify the team watchlist');
      return { success: false, message: 'Only the admin can modify the team watchlist' };
    }
    
    console.log('User is admin, proceeding with database insert');
    
    // Insert the coin into the team watchlist
    const { data, error } = await supabase
      .from('team_watchlist')
      .insert({
        coin_id: coinData.id,
        symbol: coinData.symbol,
        name: coinData.name,
        price_target: priceTarget || null
      })
      .select('*')
      .single();
      
    if (error) {
      console.error('Error adding coin to team watchlist:', error);
      return { success: false, message: 'Failed to add coin to team watchlist' };
    }
    
    console.log('Coin added successfully:', data);
    return { success: true, message: 'Coin added to team watchlist successfully' };
    
  } catch (error) {
    console.error('Error adding coin to team watchlist:', error);
    return { success: false, message: 'An unexpected error occurred' };
  }
}

/**
 * Update a coin's price target in the team watchlist
 * Only admin users can call this function successfully
 */
export async function updateTeamWatchlistPriceTarget(itemId: string, priceTarget: number): Promise<{success: boolean, message: string}> {
  try {
    // Verify the user is the admin
    const session = await supabase.auth.getSession();
    const currentUserId = session.data.session?.user?.id;
    
    if (!currentUserId || currentUserId !== TEAM_ADMIN_ID) {
      console.error('Only the admin can modify the team watchlist');
      return { success: false, message: 'Only the admin can modify the team watchlist' };
    }
    
    // Update the price target
    const { data, error } = await supabase
      .from('team_watchlist')
      .update({ price_target: priceTarget })
      .eq('id', itemId)
      .select('*')
      .single();
      
    if (error) {
      console.error('Error updating coin in team watchlist:', error);
      return { success: false, message: 'Failed to update coin in team watchlist' };
    }
    
    return { success: true, message: 'Coin updated in team watchlist successfully' };
    
  } catch (error) {
    console.error('Error updating coin in team watchlist:', error);
    return { success: false, message: 'An unexpected error occurred' };
  }
}

/**
 * Remove a coin from the team watchlist
 * Only admin users can call this function successfully
 */
export async function removeFromTeamWatchlist(itemId: string): Promise<{success: boolean, message: string}> {
  try {
    // Verify the user is the admin
    const session = await supabase.auth.getSession();
    const currentUserId = session.data.session?.user?.id;
    
    if (!currentUserId || currentUserId !== TEAM_ADMIN_ID) {
      console.error('Only the admin can modify the team watchlist');
      return { success: false, message: 'Only the admin can modify the team watchlist' };
    }
    
    // Delete the coin from the team watchlist
    const { error } = await supabase
      .from('team_watchlist')
      .delete()
      .eq('id', itemId);
      
    if (error) {
      console.error('Error removing coin from team watchlist:', error);
      return { success: false, message: 'Failed to remove coin from team watchlist' };
    }
    
    return { success: true, message: 'Coin removed from team watchlist successfully' };
    
  } catch (error) {
    console.error('Error removing coin from team watchlist:', error);
    return { success: false, message: 'An unexpected error occurred' };
  }
}

/**
 * Process watchlist items and add price data
 */
export async function processWatchlistItems(watchlistItems: any[]): Promise<{ items: WatchlistItem[] }> {
  if (!watchlistItems || watchlistItems.length === 0) {
    console.log('No watchlist items found in the team watchlist.');
    // Return empty watchlist if no items exist yet
    return { items: [] };
  }
  
  // Get all coin prices - ensure IDs are strings
  const coinIds = watchlistItems.map(item => String(item.coin_id));
  const coinsData = await getMultipleCoinsData(coinIds);
  
  const items: WatchlistItem[] = watchlistItems.map((item: any) => {
    // Ensure we're looking up with a string ID
    const coinStringId = String(item.coin_id);
    const coinData = coinsData[coinStringId];
    
    return {
      id: item.id,
      coinId: item.coin_id,
      symbol: item.symbol,
      name: item.name,
      price: coinData?.priceUsd || 0,
      change24h: coinData?.priceChange24h || 0,
      icon: item.symbol,
      priceTarget: item.price_target || undefined,
      createdAt: item.created_at
    };
  });
  
  return { items };
}

/**
 * Process watchlist items and add price data using DataCache
 * This function should be used in conjunction with the DataCacheProvider
 */
export async function processWatchlistItemsWithCache(
  watchlistItems: any[],
  getCoinsDataFn: (coinIds: string[]) => Promise<Record<string, CoinData>>
): Promise<{ items: WatchlistItem[] }> {
  if (!watchlistItems || watchlistItems.length === 0) {
    console.log('No watchlist items found in the team watchlist.');
    // Return empty watchlist if no items exist yet
    return { items: [] };
  }
  
  // Get all coin prices using the provided function (from DataCacheProvider)
  const coinIds = watchlistItems.map(item => String(item.coin_id));
  const coinsData = await getCoinsDataFn(coinIds);
  
  const items: WatchlistItem[] = watchlistItems.map((item: any) => {
    // Ensure we're looking up with a string ID
    const coinStringId = String(item.coin_id);
    const coinData = coinsData[coinStringId];
    
    return {
      id: item.id,
      coinId: item.coin_id,
      symbol: item.symbol,
      name: item.name,
      price: coinData?.priceUsd || 0,
      change24h: coinData?.priceChange24h || 0,
      icon: item.symbol,
      priceTarget: item.price_target || undefined,
      createdAt: item.created_at
    };
  });
  
  return { items };
} 