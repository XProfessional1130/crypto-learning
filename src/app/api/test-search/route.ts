import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  req: NextRequest
) {
  const url = new URL(req.url);
  const query = url.searchParams.get('query') || '';
  
  // Simple mock data for testing search functionality
  const mockCoins = [
    { id: '1', name: 'Bitcoin', symbol: 'BTC', cmcRank: 1 },
    { id: '2', name: 'Ethereum', symbol: 'ETH', cmcRank: 2 },
    { id: '3', name: 'Tether', symbol: 'USDT', cmcRank: 3 },
    { id: '4', name: 'Binance Coin', symbol: 'BNB', cmcRank: 4 },
    { id: '5', name: 'USD Coin', symbol: 'USDC', cmcRank: 5 },
    { id: '6', name: 'XRP', symbol: 'XRP', cmcRank: 6 },
    { id: '7', name: 'Cardano', symbol: 'ADA', cmcRank: 7 },
    { id: '8', name: 'Solana', symbol: 'SOL', cmcRank: 8 },
    { id: '9', name: 'Avalanche', symbol: 'AVAX', cmcRank: 9 },
    { id: '10', name: 'Polkadot', symbol: 'DOT', cmcRank: 10 },
    { id: '11', name: 'Dogecoin', symbol: 'DOGE', cmcRank: 11 },
    { id: '12', name: 'Polygon', symbol: 'MATIC', cmcRank: 12 },
    { id: '13', name: 'Shiba Inu', symbol: 'SHIB', cmcRank: 13 },
    { id: '14', name: 'TrueUSD', symbol: 'TUSD', cmcRank: 14 },
    { id: '15', name: 'Uniswap', symbol: 'UNI', cmcRank: 15 },
    { id: '16', name: 'Litecoin', symbol: 'LTC', cmcRank: 16 },
    { id: '17', name: 'Chainlink', symbol: 'LINK', cmcRank: 17 },
    { id: '18', name: 'Bitcoin Cash', symbol: 'BCH', cmcRank: 18 },
    { id: '19', name: 'Stellar', symbol: 'XLM', cmcRank: 19 },
    { id: '20', name: 'Tron', symbol: 'TRX', cmcRank: 20 },
  ];

  // Filter by query if provided
  const results = query
    ? mockCoins.filter(coin => {
        const lowerQuery = query.toLowerCase();
        return (
          coin.name.toLowerCase().includes(lowerQuery) ||
          coin.symbol.toLowerCase().includes(lowerQuery)
        );
      })
    : mockCoins;

  // Add additional mock data
  const enhancedResults = results.map(coin => ({
    ...coin,
    priceUsd: Math.random() * (coin.id === '1' ? 30000 : 5000),
    priceChange24h: (Math.random() * 10) - 5, // -5% to +5%
    marketCap: parseInt(coin.id) * 10000000000,
    volume24h: parseInt(coin.id) * 1000000000,
    logoUrl: `https://example.com/logos/${coin.symbol.toLowerCase()}.png`
  }));

  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 500));

  return NextResponse.json({ 
    success: true, 
    data: enhancedResults 
  }, { status: 200 });
} 