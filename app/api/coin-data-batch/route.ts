import { NextRequest, NextResponse } from 'next/server';

type CoinDataBatchResponse = {
  success: boolean;
  data?: Record<string, any>;
  error?: string;
}

// Simple in-memory store for rate limiting
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute window
const MAX_REQUESTS_PER_WINDOW = 10; // 10 requests per minute
const ipRequestCounts = new Map<string, { count: number; timestamp: number }>();

// Helper function to get client IP address
const getClientIp = (req: NextRequest): string => {
  const forwarded = req.headers.get('x-forwarded-for');
  const ip = forwarded 
    ? forwarded.split(',')[0]
    : 'unknown';
  return ip;
};

export async function GET(
  req: NextRequest
) {
  // Basic rate limiting
  const clientIp = getClientIp(req);
  const now = Date.now();
  const clientRateLimit = ipRequestCounts.get(clientIp);
  
  // Reset count if window has expired
  if (clientRateLimit && now - clientRateLimit.timestamp > RATE_LIMIT_WINDOW) {
    ipRequestCounts.set(clientIp, { count: 1, timestamp: now });
  } 
  // Increment count if exists
  else if (clientRateLimit) {
    // Check if rate limit exceeded
    if (clientRateLimit.count >= MAX_REQUESTS_PER_WINDOW) {
      return NextResponse.json({ 
        success: false, 
        error: 'Rate limit exceeded. Please try again later.' 
      }, { status: 429 });
    }
    
    clientRateLimit.count += 1;
  } 
  // Initialize new client
  else {
    ipRequestCounts.set(clientIp, { count: 1, timestamp: now });
  }

  const url = new URL(req.url);
  const ids = url.searchParams.get('ids');
  
  if (!ids) {
    return NextResponse.json({ success: false, error: 'IDs parameter is required' }, { status: 400 });
  }
  
  // Parse the comma-separated IDs
  const coinIds = ids.split(',');
  
  if (coinIds.length === 0) {
    return NextResponse.json({ success: false, error: 'No valid IDs provided' }, { status: 400 });
  }
  
  if (coinIds.length > 100) {
    return NextResponse.json({ 
      success: false, 
      error: 'Too many IDs requested. Maximum is 100 coins per batch.' 
    }, { status: 400 });
  }
  
  try {
    // Get API key from environment variable
    const apiKey = process.env.CMC_API_KEY;
    
    if (!apiKey) {
      return NextResponse.json({ success: false, error: 'API key not configured' }, { status: 500 });
    }
    
    // Make request to CoinMarketCap
    const response = await fetch(`https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest?id=${ids}`, {
      headers: {
        'X-CMC_PRO_API_KEY': apiKey,
        'Accept': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`CoinMarketCap API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (!data.data) {
      return NextResponse.json({ success: false, error: 'Invalid response from CoinMarketCap' }, { status: 500 });
    }
    
    // Transform the data for each coin to a simpler format
    const coinData: Record<string, any> = {};
    
    Object.entries(data.data).forEach(([id, coinInfo]: [string, any]) => {
      const coin = coinInfo;
      const usdQuote = coin.quote.USD;
      
      coinData[id] = {
        id: coin.id.toString(),
        symbol: coin.symbol,
        name: coin.name,
        priceUsd: usdQuote.price,
        priceBtc: 0, // This would need another API call to calculate
        priceChange24h: usdQuote.percent_change_24h || 0,
        marketCap: usdQuote.market_cap || 0,
        logoUrl: `https://s2.coinmarketcap.com/static/img/coins/64x64/${coin.id}.png`,
        chain: coin.platform?.name || 'Various',
        liquidity: usdQuote.volume_24h || 0,
        cmcRank: coin.cmc_rank,
        slug: coin.slug
      };
    });
    
    return NextResponse.json({ success: true, data: coinData }, { status: 200 });
  } catch (error) {
    console.error('Error fetching batch coin data:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch coin data' }, { status: 500 });
  }
} 