import { searchCoins, getCoinData } from '@/lib/services/dexscreener';

export default async function handler(req, res) {
  try {
    const results = {
      tests: []
    };
    
    // Test 1: Search for Bitcoin
    console.log('Test 1: Searching for Bitcoin');
    const btcResults = await searchCoins('Bitcoin');
    results.tests.push({
      name: 'Bitcoin search',
      query: 'Bitcoin',
      resultsCount: btcResults.length,
      firstResult: btcResults.length > 0 ? {
        id: btcResults[0].id,
        symbol: btcResults[0].symbol,
        name: btcResults[0].name,
        priceUsd: btcResults[0].priceUsd,
      } : null
    });
    
    // Test 2: Search for Solana
    console.log('Test 2: Searching for Solana');
    const solResults = await searchCoins('Solana');
    results.tests.push({
      name: 'Solana search',
      query: 'Solana',
      resultsCount: solResults.length,
      firstResult: solResults.length > 0 ? {
        id: solResults[0].id,
        symbol: solResults[0].symbol,
        name: solResults[0].name,
        priceUsd: solResults[0].priceUsd,
      } : null
    });
    
    // Test 3: Search by address
    console.log('Test 3: Searching by ETH address');
    const addressResults = await searchCoins('0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2');
    results.tests.push({
      name: 'Address search',
      query: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
      resultsCount: addressResults.length,
      firstResult: addressResults.length > 0 ? {
        id: addressResults[0].id,
        symbol: addressResults[0].symbol,
        name: addressResults[0].name,
        priceUsd: addressResults[0].priceUsd,
      } : null
    });
    
    // Test 4: Get coin data
    if (btcResults.length > 0) {
      console.log('Test 4: Getting coin data');
      const coinData = await getCoinData(btcResults[0].id);
      results.tests.push({
        name: 'Get coin data',
        coinId: btcResults[0].id,
        data: coinData
      });
    }
    
    res.status(200).json(results);
  } catch (error) {
    console.error('Test failed:', error);
    res.status(500).json({ error: error.message });
  }
} 