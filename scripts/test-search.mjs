/**
 * Test script for coin search functionality
 * 
 * Run this script with: node scripts/test-search.mjs
 */

import fetch from 'node-fetch';

async function searchCoins(query) {
  try {
    console.log(`Searching for coins with query: ${query}`);
    const response = await fetch(`https://api.dexscreener.com/latest/dex/search?q=${encodeURIComponent(query)}`, {
      headers: {
        'Accept': 'application/json',
      },
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`DexScreener API error (${response.status}): ${errorText}`);
      throw new Error(`Network response was not ok: ${response.status}`);
    }
    
    const data = await response.json();
    console.log(`Found ${data.pairs?.length || 0} pairs from DexScreener`);
    
    if (!data.pairs || !Array.isArray(data.pairs) || data.pairs.length === 0) {
      console.log('No results found from DexScreener');
      return [];
    }
    
    const mappedResults = data.pairs.slice(0, 20).map((pair) => {
      const priceUsd = parseFloat(pair.priceUsd) || 0;
      return {
        id: pair.baseToken.address,
        symbol: pair.baseToken.symbol,
        name: pair.baseToken.name || pair.baseToken.symbol,
        priceUsd,
        priceChange24h: parseFloat(pair.priceChange?.h24) || 0,
        marketCap: parseFloat(pair.liquidity?.usd) || 0,
        logoUrl: pair.baseToken.logoURI || `https://raw.githubusercontent.com/Uniswap/assets/master/blockchains/ethereum/assets/${pair.baseToken.address}/logo.png`
      };
    });
    
    console.log(`Returning ${mappedResults.length} formatted results`);
    return mappedResults;
  } catch (error) {
    console.error('Error searching coins:', error);
    return [];
  }
}

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
  
  console.log('\n=== Tests Complete ===');
}

testSearch().catch(error => {
  console.error('Test failed with error:', error);
}); 