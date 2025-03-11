import { PortfolioItemWithPrice, PortfolioSummary } from '@/types/portfolio';
import { getMultipleCoinsData } from './coinmarketcap';
import supabase from './supabase-client';

// Use environment variable for the admin email with a fallback
const TEAM_PORTFOLIO_EMAIL = process.env.NEXT_PUBLIC_TEAM_ADMIN_EMAIL || 'admin@learningcrypto.com';

/**
 * Fetch the team portfolio for the admin user
 * Since we don't have access to the auth.users or profiles table directly,
 * we'll just return an empty portfolio for now. In a production environment,
 * you would need to configure your Supabase database with the correct tables.
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
      return {
        totalValueUsd: 0,
        totalValueBtc: 0,
        dailyChangePercentage: 0,
        dailyChangeUsd: 0,
        dailyChangeBtc: 0,
        items: []
      };
    }
    
    console.log('Connected to user_portfolios table successfully');

    // Get the user ID for the admin email
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('email', TEAM_PORTFOLIO_EMAIL)
      .single();
      
    if (userError) {
      console.error('Error finding user with admin email:', userError);
      
      // Try to find the user in the auth.users table via RPC if accessible
      const { data: authUserData, error: authUserError } = await supabase
        .rpc('get_user_id_by_email', { user_email: TEAM_PORTFOLIO_EMAIL });
        
      if (authUserError || !authUserData) {
        console.error('Could not find user ID for admin email:', authUserError || 'No data returned');
        console.log('Trying to fetch portfolio items without user ID filter');
        
        // Return empty portfolio as we can't find the admin user
        return {
          totalValueUsd: 0,
          totalValueBtc: 0,
          dailyChangePercentage: 0,
          dailyChangeUsd: 0,
          dailyChangeBtc: 0,
          items: []
        };
      }
      
      console.log(`Found admin user ID via RPC: ${authUserData}`);
      
      // Fetch portfolio items for the admin user
      const { data: portfolioItems, error } = await supabase
        .from('user_portfolios')
        .select('*')
        .eq('user_id', authUserData);
        
      if (error) {
        console.error('Error fetching team portfolio items:', error);
        throw error;
      }
      
      return processPortfolioItems(portfolioItems || []);
    }
    
    const adminUserId = userData.id;
    console.log(`Found admin user ID: ${adminUserId}`);
    
    // Fetch portfolio items for the admin user
    const { data: portfolioItems, error } = await supabase
      .from('user_portfolios')
      .select('*')
      .eq('user_id', adminUserId);
      
    if (error) {
      console.error('Error fetching team portfolio items:', error);
      throw error;
    }
    
    return processPortfolioItems(portfolioItems || []);
    
  } catch (error) {
    console.error('Error fetching team portfolio:', error);
    
    // Return empty portfolio on error
    return {
      totalValueUsd: 0,
      totalValueBtc: 0,
      dailyChangePercentage: 0,
      dailyChangeUsd: 0,
      dailyChangeBtc: 0,
      items: []
    };
  }
}

/**
 * Process portfolio items and calculate totals
 */
async function processPortfolioItems(portfolioItems: any[]): Promise<PortfolioSummary> {
  if (!portfolioItems || portfolioItems.length === 0) {
    console.log('No portfolio items found for admin user.');
    // Return empty portfolio if the user doesn't have any items yet
    return {
      totalValueUsd: 0,
      totalValueBtc: 0,
      dailyChangePercentage: 0,
      dailyChangeUsd: 0,
      dailyChangeBtc: 0,
      items: []
    };
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