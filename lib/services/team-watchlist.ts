import { WatchlistItem } from '@/lib/hooks/useWatchlist';
import { getMultipleCoinsData } from './coinmarketcap';
import supabase from './supabase-client';

// Use environment variable for the admin email with a fallback
const TEAM_ADMIN_EMAIL = process.env.NEXT_PUBLIC_TEAM_ADMIN_EMAIL || 'admin@learningcrypto.com';

/**
 * Fetch the team watchlist for the admin user
 * This follows the same pattern as the team portfolio service
 */
export async function getTeamWatchlist(): Promise<{ items: WatchlistItem[] }> {
  try {
    console.log(`Attempting to fetch team watchlist for ${TEAM_ADMIN_EMAIL}`);
    
    // Check if the watchlist table exists by making a small query
    const { data: tableCheckData, error: tableCheckError } = await supabase
      .from('watchlist')
      .select('id')
      .limit(1);
    
    if (tableCheckError) {
      console.error('Error checking watchlist table:', tableCheckError);
      console.log('The watchlist table may not exist yet.');
      
      // Return empty watchlist
      return {
        items: []
      };
    }
    
    console.log('Connected to watchlist table successfully');
    
    // For demonstration purposes, just fetch all watchlist items (or none)
    // In a production environment, you'd want to filter for only the admin user's items
    const { data: watchlistItems, error } = await supabase
      .from('watchlist')
      .select('*');
      
    if (error) {
      console.error('Error fetching team watchlist items:', error);
      throw error;
    }
    
    if (!watchlistItems || watchlistItems.length === 0) {
      console.log('No watchlist items found.');
      // Return empty watchlist if no items exist yet
      return {
        items: []
      };
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
    
    return {
      items
    };
    
  } catch (error) {
    console.error('Error fetching team watchlist:', error);
    
    // Return empty watchlist on error
    return {
      items: []
    };
  }
} 