import { WatchlistItem } from '@/lib/hooks/useWatchlist';
import { getMultipleCoinsData } from './coinmarketcap';
import supabase from './supabase-client';

// Use the admin's UID directly instead of email lookup
const TEAM_ADMIN_ID = process.env.NEXT_PUBLIC_TEAM_ADMIN_ID || '529cfde5-d8c3-4a6a-a9dc-5bb67fb039b5';

/**
 * Fetch the team watchlist for the admin user
 * Using the admin's UID directly for efficient queries
 */
export async function getTeamWatchlist(): Promise<{ items: WatchlistItem[] }> {
  try {
    console.log(`Attempting to fetch team watchlist for admin with ID: ${TEAM_ADMIN_ID}`);
    
    // Check if the watchlist table exists by making a small query
    const { data: tableCheckData, error: tableCheckError } = await supabase
      .from('watchlist')
      .select('id')
      .limit(1);
    
    if (tableCheckError) {
      console.error('Error checking watchlist table:', tableCheckError);
      console.log('The watchlist table may not exist yet.');
      
      // Return empty watchlist
      return { items: [] };
    }
    
    console.log('Connected to watchlist table successfully');
    
    // Directly fetch watchlist items using the admin's UID
    const { data: watchlistItems, error } = await supabase
      .from('watchlist')
      .select('*')
      .eq('user_id', TEAM_ADMIN_ID);
      
    if (error) {
      console.error('Error fetching team watchlist items:', error);
      return { items: [] };
    }
    
    if (!watchlistItems || watchlistItems.length === 0) {
      console.log('No watchlist items found for admin user. The user might not have added any assets yet.');
    }
    
    return processWatchlistItems(watchlistItems || []);
    
  } catch (error) {
    console.error('Error fetching team watchlist:', error);
    
    // Return empty watchlist on error
    return { items: [] };
  }
}

/**
 * Process watchlist items and add price data
 */
async function processWatchlistItems(watchlistItems: any[]): Promise<{ items: WatchlistItem[] }> {
  if (!watchlistItems || watchlistItems.length === 0) {
    console.log('No watchlist items found for admin user.');
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