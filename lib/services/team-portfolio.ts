import { PortfolioItemWithPrice, PortfolioSummary } from '@/types/portfolio';
import { getMultipleCoinsData } from './coinmarketcap';
import supabase from './supabase-client';

// Use the admin's UID directly instead of email lookup
const TEAM_ADMIN_ID = process.env.NEXT_PUBLIC_TEAM_ADMIN_ID || '529cfde5-d8c3-4a6a-a9dc-5bb67fb039b5';

/**
 * Fetch the team portfolio for the admin user
 * Using the admin's UID directly for efficient queries
 */
export async function getTeamPortfolio(): Promise<PortfolioSummary> {
  try {
    console.log(`Attempting to fetch team portfolio for admin with ID: ${TEAM_ADMIN_ID}`);
    
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
    
    // Directly fetch portfolio items using the admin's UID
    const { data: portfolioItems, error } = await supabase
      .from('user_portfolios')
      .select('*')
      .eq('user_id', TEAM_ADMIN_ID);
      
    if (error) {
      console.error('Error fetching team portfolio items:', error);
      return createEmptyPortfolio();
    }
    
    if (!portfolioItems || portfolioItems.length === 0) {
      console.log('No portfolio items found for admin user. The user might not have added any assets yet.');
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