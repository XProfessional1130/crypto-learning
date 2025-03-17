/**
 * Simple script to trigger a macro market data update
 * 
 * Run with:
 * node scripts/trigger-macro-data-update.mjs
 */

import fetch from 'node-fetch';

const API_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

async function main() {
  try {
    console.log('Triggering macro market data update...');
    
    // Call the API endpoint
    const response = await fetch(`${API_URL}/api/jobs/update-macro-data`);
    
    if (!response.ok) {
      throw new Error(`API returned ${response.status}: ${response.statusText}`);
    }
    
    const result = await response.json();
    console.log('Update response:', result);
    
    // Get the formatted data to verify
    console.log('\nFetching formatted data to verify update:');
    const dataResponse = await fetch(`${API_URL}/api/macro-data/formatted`);
    
    if (!dataResponse.ok) {
      throw new Error(`API returned ${dataResponse.status}: ${dataResponse.statusText}`);
    }
    
    const data = await dataResponse.json();
    
    if (data.success) {
      console.log('\nSuccessfully updated macro market data:');
      console.log('Market Cap:   ', data.data.marketOverview.totalMarketCap);
      console.log('Volume 24h:   ', data.data.marketOverview.totalVolume24h);
      console.log('BTC Dominance:', data.data.dominance.btc);
      console.log('ETH Dominance:', data.data.dominance.eth);
      console.log('Fear & Greed: ', data.data.fearAndGreed.value, '(', data.data.fearAndGreed.classification, ')');
      console.log('Last Updated: ', data.data.lastUpdated);
    } else {
      throw new Error('Failed to fetch updated data: ' + data.error);
    }
    
    console.log('\nMacro market data update completed successfully!');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

main(); 