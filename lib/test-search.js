/**
 * Test script for coin search functionality
 * 
 * Run this script with: node lib/test-search.js
 */

const { searchCoins, getCoinData } = require('./services/dexscreener');

async function testSearch() {
  console.log('=== Testing Coin Search Functionality ===');
  
  // Test a common coin
  console.log('\nTest 1: Searching for "Bitcoin"');
  const btcResults = await searchCoins('Bitcoin');
  console.log(`Results found: ${btcResults.length}`);
  if (btcResults.length > 0) {
    console.log('First result:', {
      id: btcResults[0].id,
      symbol: btcResults[0].symbol,
      name: btcResults[0].name,
      priceUsd: btcResults[0].priceUsd,
    });
  }
  
  // Test a less common coin
  console.log('\nTest 2: Searching for "Solana"');
  const solResults = await searchCoins('Solana');
  console.log(`Results found: ${solResults.length}`);
  if (solResults.length > 0) {
    console.log('First result:', {
      id: solResults[0].id,
      symbol: solResults[0].symbol,
      name: solResults[0].name,
      priceUsd: solResults[0].priceUsd,
    });
  }
  
  // Test a coin by address
  console.log('\nTest 3: Searching for a specific address (ETH)');
  const addressResults = await searchCoins('0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2');
  console.log(`Results found: ${addressResults.length}`);
  if (addressResults.length > 0) {
    console.log('First result:', {
      id: addressResults[0].id,
      symbol: addressResults[0].symbol,
      name: addressResults[0].name,
      priceUsd: addressResults[0].priceUsd,
    });
  }
  
  // Test getting detailed data for a coin
  if (btcResults.length > 0) {
    console.log('\nTest 4: Getting detailed data for found coin');
    const coinData = await getCoinData(btcResults[0].id);
    console.log('Coin data:', coinData);
  }
  
  console.log('\n=== Tests Complete ===');
}

testSearch().catch(error => {
  console.error('Test failed with error:', error);
}); 