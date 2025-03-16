/**
 * Script to populate the macro_market_data table with sample data
 * 
 * Run this script with:
 * npx ts-node scripts/populate-macro-market-data.ts
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Create Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials in environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Sample macro market data to insert
const macroMarketData = {
  // Fear & Greed Index
  fear_greed_value: 62,
  fear_greed_classification: 'Greed',
  fear_greed_timestamp: new Date().toISOString(),
  
  // On-chain activity
  active_addresses_count: 1543291,
  active_addresses_change_24h: 3.8,
  active_addresses_timestamp: new Date().toISOString(),
  
  // Whale transactions
  large_transactions_count: 4235,
  large_transactions_change_24h: 1.2,
  large_transactions_timestamp: new Date().toISOString(),
  
  // Market metrics
  total_market_cap: 2715432000000,
  total_volume_24h: 118492000000,
  btc_dominance: 53.2,
  eth_dominance: 17.8,
  altcoin_dominance: 29.0,
  total_cryptocurrencies: 12741,
  total_exchanges: 243,
  
  // Timestamp for the entire record
  timestamp: new Date().toISOString()
};

async function populateMacroMarketData() {
  console.log('Starting macro market data population script...');
  
  // Try to insert data - if table doesn't exist, it will fail
  const { error: insertError } = await supabase
    .from('macro_market_data')
    .insert(macroMarketData);
  
  if (insertError) {
    console.error('Error inserting data:', insertError);
    console.log('Make sure the macro_market_data table exists with the following structure:');
    console.log(`
      fear_greed_value: number
      fear_greed_classification: string
      fear_greed_timestamp: timestamp
      active_addresses_count: number
      active_addresses_change_24h: number
      active_addresses_timestamp: timestamp
      large_transactions_count: number
      large_transactions_change_24h: number
      large_transactions_timestamp: timestamp
      total_market_cap: number
      total_volume_24h: number
      btc_dominance: number
      eth_dominance: number
      altcoin_dominance: number
      total_cryptocurrencies: number
      total_exchanges: number
      timestamp: timestamp
    `);
    process.exit(1);
  }
  
  console.log('Successfully populated macro market data');
}

// Run the script
populateMacroMarketData()
  .catch(error => {
    console.error('Script failed:', error);
    process.exit(1);
  })
  .finally(() => {
    console.log('Script completed');
  }); 