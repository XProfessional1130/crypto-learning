import { WatchlistItem } from '@/lib/hooks/useWatchlist';
import { getMultipleCoinsData } from './coinmarketcap';
import supabase from './supabase-client';

// Use environment variable for the admin email with a fallback
const TEAM_ADMIN_EMAIL = process.env.NEXT_PUBLIC_TEAM_ADMIN_EMAIL || 'admin@learningcrypto.com';

/**
 * Fetch the team watchlist for the admin user
 * With a simplified approach that doesn't require SQL functions
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
      return { items: [] };
    }
    
    console.log('Connected to watchlist table successfully');
    
    // First try to get user ID from profiles table
    let adminUserId: string | null = null;
    
    // Try the profiles table first (most likely to be accessible)
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', TEAM_ADMIN_EMAIL)
      .maybeSingle();
      
    if (!profileError && profileData?.id) {
      adminUserId = profileData.id;
      console.log(`Found admin user ID in profiles: ${adminUserId}`);
    } else {
      // Try with any custom auth functions
      try {
        // Check if profiles might have user_id that maps to auth.users
        const { data: userProfileData, error: userProfileError } = await supabase
          .from('profiles')
          .select('user_id')
          .eq('email', TEAM_ADMIN_EMAIL)
          .maybeSingle();
          
        if (!userProfileError && userProfileData?.user_id) {
          adminUserId = userProfileData.user_id;
          console.log(`Found admin user ID via profile.user_id: ${adminUserId}`);
        }
      } catch (authError) {
        console.log('Unable to find user ID from profiles', authError);
      }
    }
      
    // If we found a user ID, query with it
    if (adminUserId) {
      const { data: watchlistItems, error } = await supabase
        .from('watchlist')
        .select('*')
        .eq('user_id', adminUserId);
        
      if (error) {
        console.error('Error fetching team watchlist items:', error);
        return { items: [] };
      }
      
      return processWatchlistItems(watchlistItems || []);
    }
    
    console.log('Could not find admin user ID, trying to fall back to email field in watchlist');
    
    // Last resort: check if the watchlist table has an email column we can filter on
    try {
      const { data: watchlistItems, error } = await supabase
        .from('watchlist')
        .select('*')
        .eq('email', TEAM_ADMIN_EMAIL);
        
      if (!error && watchlistItems && watchlistItems.length > 0) {
        console.log(`Found watchlist items via email column: ${watchlistItems.length} items`);
        return processWatchlistItems(watchlistItems);
      }
    } catch (emailError) {
      console.log('Table does not have an email column or other error occurred', emailError);
    }
    
    console.log('All attempts to find admin user failed, returning all watchlist items as fallback');
    
    // Final fallback: just get all items (not ideal, but better than nothing for demo purposes)
    const { data: watchlistItems, error } = await supabase
      .from('watchlist')
      .select('*')
      .limit(10);  // Limit to avoid too much data
      
    if (error) {
      console.error('Error fetching fallback team watchlist items:', error);
      return { items: [] };
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