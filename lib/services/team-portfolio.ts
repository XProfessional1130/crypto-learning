import { PortfolioItemWithPrice, PortfolioSummary } from '@/types/portfolio';
import { getMultipleCoinsData } from './coinmarketcap';
import supabase from './supabase-client';

// Use environment variable for the admin email with a fallback
const TEAM_PORTFOLIO_EMAIL = process.env.NEXT_PUBLIC_TEAM_ADMIN_EMAIL || 'admin@learningcrypto.com';

/**
 * Fetch the team portfolio for the admin user
 * With a simplified approach that doesn't require SQL functions
 */
export async function getTeamPortfolio(): Promise<PortfolioSummary> {
  try {
    console.log(`Attempting to fetch team portfolio for ${TEAM_PORTFOLIO_EMAIL}`);
    
    // Check if user_portfolios table exists by making a small query
    const { data: tableCheckData, error: tableCheckError } = await supabase
      .from('user_portfolios')
      .select('id')
      .limit(1);
    
    if (tableCheckError) {
      console.error('Error checking user_portfolios table:', tableCheckError);
      console.log('The user_portfolios table may not exist yet. Please run the database migrations.');
      
      // Return empty portfolio
      return createEmptyPortfolio();
    }
    
    console.log('Connected to user_portfolios table successfully');
    
    // First try to get user ID from profiles table
    let adminUserId: string | null = null;
    
    // Try the profiles table first (most likely to be accessible)
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', TEAM_PORTFOLIO_EMAIL)
      .maybeSingle();
      
    if (!profileError && profileData?.id) {
      adminUserId = profileData.id;
      console.log(`Found admin user ID in profiles: ${adminUserId}`);
    } else {
      // Try with auth.users if we have access
      try {
        // Check if profiles might have user_id that maps to auth.users
        const { data: userProfileData, error: userProfileError } = await supabase
          .from('profiles')
          .select('user_id')
          .eq('email', TEAM_PORTFOLIO_EMAIL)
          .maybeSingle();
          
        if (!userProfileError && userProfileData?.user_id) {
          adminUserId = userProfileData.user_id;
          console.log(`Found admin user ID via profile.user_id: ${adminUserId}`);
        }
      } catch (authError) {
        console.log('Unable to use auth admin API, likely insufficient permissions', authError);
      }
    }
      
    // If we found a user ID, query with it
    if (adminUserId) {
      const { data: portfolioItems, error } = await supabase
        .from('user_portfolios')
        .select('*')
        .eq('user_id', adminUserId);
        
      if (error) {
        console.error('Error fetching team portfolio items:', error);
        return createEmptyPortfolio();
      }
      
      return processPortfolioItems(portfolioItems || []);
    }
    
    console.log('Could not find admin user ID, trying to fall back to email field in user_portfolios');
    
    // Last resort: check if the user_portfolios table has an email column we can filter on
    try {
      const { data: portfolioItems, error } = await supabase
        .from('user_portfolios')
        .select('*')
        .eq('email', TEAM_PORTFOLIO_EMAIL);
        
      if (!error && portfolioItems && portfolioItems.length > 0) {
        console.log(`Found portfolio items via email column: ${portfolioItems.length} items`);
        return processPortfolioItems(portfolioItems);
      }
    } catch (emailError) {
      console.log('Table does not have an email column or other error occurred', emailError);
    }
    
    console.log('All attempts to find admin user failed, returning all portfolio items as fallback');
    
    // Final fallback: just get all items (not ideal, but better than nothing for demo purposes)
    const { data: portfolioItems, error } = await supabase
      .from('user_portfolios')
      .select('*')
      .limit(10);  // Limit to avoid too much data
      
    if (error) {
      console.error('Error fetching fallback team portfolio items:', error);
      return createEmptyPortfolio();
    }
    
    return processPortfolioItems(portfolioItems || []);
    
  } catch (error) {
    console.error('Error fetching team portfolio:', error);
    return createEmptyPortfolio();
  }
}

/**
 * Creates an empty portfolio object
 */
function createEmptyPortfolio(): PortfolioSummary {
  return {
    totalValueUsd: 0,
    totalValueBtc: 0,
    dailyChangePercentage: 0,
    dailyChangeUsd: 0,
    dailyChangeBtc: 0,
    items: []
  };
}

/**
 * Process portfolio items and calculate totals
 */
async function processPortfolioItems(portfolioItems: any[]): Promise<PortfolioSummary> {
  if (!portfolioItems || portfolioItems.length === 0) {
    console.log('No portfolio items found for admin user.');
    return createEmptyPortfolio();
  }
  
  // Get all coin prices - ensure IDs are strings
  const coinIds = portfolioItems.map(item => String(item.coin_id));
  const coinsData = await getMultipleCoinsData(coinIds);
  
  let totalValueUsd = 0;
  let totalValueBtc = 0;
  let totalPrevValueUsd = 0;
  let totalPrevValueBtc = 0;
  
  const items: PortfolioItemWithPrice[] = portfolioItems.map((item: any) => {
    // Ensure we're looking up with a string ID
    const coinStringId = String(item.coin_id);
    const coinData = coinsData[coinStringId];
    const valueUsd = item.amount * (coinData?.priceUsd || 0);
    const valueBtc = item.amount * (coinData?.priceBtc || 0);
    const prevValueUsd = valueUsd / (1 + (coinData?.priceChange24h || 0) / 100);
    const prevValueBtc = valueBtc / (1 + (coinData?.priceChange24h || 0) / 100);
    
    totalValueUsd += valueUsd;
    totalValueBtc += valueBtc;
    totalPrevValueUsd += prevValueUsd;
    totalPrevValueBtc += prevValueBtc;
    
    return {
      id: item.id,
      userId: item.user_id,
      coinId: item.coin_id,
      coinSymbol: item.coin_symbol,
      coinName: item.coin_name,
      amount: item.amount,
      preferredCurrency: item.preferred_currency as 'USD' | 'BTC',
      createdAt: item.created_at,
      updatedAt: item.updated_at,
      priceUsd: coinData?.priceUsd || 0,
      priceBtc: coinData?.priceBtc || 0,
      valueUsd,
      valueBtc,
      priceChange24h: coinData?.priceChange24h || 0,
      percentage: 0, // Will be calculated after total is known
      marketCap: coinData?.marketCap || 0,
      logoUrl: coinData?.logoUrl
    };
  });
  
  // Calculate daily change
  const dailyChangeUsd = totalValueUsd - totalPrevValueUsd;
  const dailyChangeBtc = totalValueBtc - totalPrevValueBtc;
  const dailyChangePercentage = totalPrevValueUsd > 0 
    ? ((totalValueUsd - totalPrevValueUsd) / totalPrevValueUsd) * 100 
    : 0;
  
  // Calculate percentages
  items.forEach(item => {
    item.percentage = totalValueUsd > 0 ? (item.valueUsd / totalValueUsd) * 100 : 0;
  });
  
  return {
    totalValueUsd,
    totalValueBtc,
    dailyChangePercentage,
    dailyChangeUsd,
    dailyChangeBtc,
    items
  };
} 