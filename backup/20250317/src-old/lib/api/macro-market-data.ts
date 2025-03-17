import supabase from './supabase-client';

// Define MacroMarketData type with all fields from the table
export interface MacroMarketData {
  id: number;
  updated_at: string;
  fear_greed_value: number;
  fear_greed_classification: string;
  fear_greed_timestamp: string;
  active_addresses_count: number;
  active_addresses_change_24h: number;
  active_addresses_timestamp: string;
  large_transactions_count: number;
  large_transactions_change_24h: number;
  large_transactions_timestamp: string;
  total_market_cap: number;
  total_volume_24h: number;
  btc_dominance: number;
  eth_dominance: number;
  altcoin_dominance: number;
  total_cryptocurrencies: number;
  total_exchanges: number;
}

/**
 * Get the latest macro market data from Supabase
 */
export async function getMacroMarketData(): Promise<MacroMarketData | null> {
  try {
    // Simply query the most recent row
    const { data, error } = await supabase
      .from('macro_market_data')
      .select('*')
      .order('updated_at', { ascending: false })
      .limit(1);
    
    if (error) {
      console.error('Error fetching macro market data:', error);
      return null;
    }
    
    if (!data || data.length === 0) {
      console.warn('No macro market data found');
      return null;
    }
    
    return data[0] as MacroMarketData;
  } catch (error) {
    console.error('Exception fetching macro market data:', error);
    return null;
  }
} 