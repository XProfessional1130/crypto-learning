# Cryptocurrency Data System

This document explains how cryptocurrency market data is obtained, stored, and utilized within the Learning Crypto Platform.

## Overview

The platform integrates with cryptocurrency market data from multiple sources:

1. **CoinMarketCap API** (primary external data source)
2. **Supabase Database** (internal storage and caching)

This architecture provides reliable, performant access to cryptocurrency data while minimizing API usage costs and rate limits.

## Data Flow

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  CoinMarketCap  │    │  Background     │    │   Supabase      │
│  API            │───▶│  Jobs           │───▶│   Database      │
└─────────────────┘    └─────────────────┘    └────────┬────────┘
                                                       │
                                                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│ Web Application │◀───│ API Layer       │◀───│ Data Cache      │
│ (Next.js)       │    │ Functions       │    │ Provider        │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

1. Background jobs fetch data from CoinMarketCap API
2. Data is stored in Supabase tables
3. Application fetches data from Supabase
4. Client-side caching improves performance

## CoinMarketCap API Integration

### API Key Management

The CoinMarketCap API key is stored in environment variables:

- Development: stored in `.env.local` as `CMC_API_KEY` (server-side only)
- Production: set in the hosting environment (e.g., Vercel environment variables)

> **Important Security Note**: The API key is intentionally NOT prefixed with `NEXT_PUBLIC_` to ensure it remains server-side only and is not exposed to the client.

### Architecture

The CoinMarketCap API is accessed through a server-side proxy pattern:

1. **Client-side service** (`/lib/services/coinmarketcap.ts`): Provides functions for the frontend components
2. **Server-side API routes**:
   - `/pages/api/coin-search.ts`: Handles searching for coins 
   - `/pages/api/coin-data.ts`: Fetches data for specific coins
   - Both endpoints implement rate limiting to prevent abuse

This proxy approach offers several benefits:
- Avoids CORS issues that occur with direct client-side API access
- Keeps the API key secure by preventing client-side access
- Allows for server-side caching and rate limiting
- Protects against API abuse through rate limiting

### Rate Limits

Two levels of rate limiting are implemented:

1. **Internal rate limiting**: 
   - Coin search: 10 requests per minute per IP
   - Coin data: 20 requests per minute per IP

2. **CoinMarketCap rate limits**:
   - Basic plan: 10,000 credits per month
   - Credit usage varies by endpoint

### Endpoints Used

1. `/cryptocurrency/listings/latest`: For searching and listing coins
2. `/cryptocurrency/quotes/latest`: For getting detailed coin data

## Data Structure

### CoinData Interface

The `CoinData` interface represents a cryptocurrency with its market data:

```typescript
export interface CoinData {
  id: string;                // Unique identifier (typically from CoinMarketCap)
  symbol: string;            // Trading symbol (e.g., BTC, ETH)
  name: string;              // Full name (e.g., Bitcoin)
  priceUsd: number;          // Current price in USD
  priceBtc: number;          // Current price in BTC
  priceChange24h: number;    // Price change percentage in last 24 hours
  marketCap: number;         // Market capitalization in USD
  volume24h?: number;        // 24h trading volume
  logoUrl?: string;          // URL to the coin/token logo image
  cmcRank?: number;          // CoinMarketCap rank
}
```

### GlobalData Interface

The `GlobalData` interface represents global cryptocurrency market statistics:

```typescript
export interface GlobalData {
  btcDominance: number;         // Bitcoin's market dominance percentage
  ethDominance: number;         // Ethereum's market dominance percentage
  totalMarketCap: number;       // Total crypto market capitalization
  totalVolume24h: number;       // Total 24h trading volume
  fearGreedValue?: number;      // Fear & Greed index value
  fearGreedClassification?: string; // Fear & Greed index classification
  altcoinDominance?: number;     // Altcoin dominance percentage
  totalCryptocurrencies?: number; // Total number of cryptocurrencies
  totalExchanges?: number;       // Total number of exchanges
}
```

## Database Schema

### Crypto Market Data Table

The `crypto_market_data` table stores cryptocurrency price and market data:

```sql
CREATE TABLE crypto_market_data (
  id TEXT PRIMARY KEY,
  symbol TEXT NOT NULL,
  name TEXT NOT NULL,
  price_usd NUMERIC(24, 8),
  price_btc NUMERIC(24, 8),
  price_change_24h NUMERIC(12, 4),
  market_cap NUMERIC(24, 2),
  volume_24h NUMERIC(24, 2),
  cmc_rank INT,
  logo_url TEXT,
  last_updated TIMESTAMPTZ DEFAULT now()
);
```

### Macro Market Data Table

The `macro_market_data` table stores global market indicators:

```sql
CREATE TABLE macro_market_data (
  id SERIAL PRIMARY KEY,
  updated_at TIMESTAMPTZ DEFAULT now(),
  fear_greed_value INT,
  fear_greed_classification TEXT,
  fear_greed_timestamp TIMESTAMPTZ,
  total_market_cap NUMERIC(24, 2),
  total_volume_24h NUMERIC(24, 2),
  btc_dominance NUMERIC(12, 4),
  eth_dominance NUMERIC(12, 4),
  altcoin_dominance NUMERIC(12, 4),
  total_cryptocurrencies INT,
  total_exchanges INT
);
```

## Core API Functionality

### Data Fetching Functions

#### Single Coin Data
```typescript
// Fetch data for a single coin
const bitcoinData = await fetchCoinData('1'); // Bitcoin's ID is 1
```

#### Multiple Coins Data
```typescript
// Fetch data for multiple coins at once
const coinIds = ['1', '1027', '825']; // BTC, ETH, USDT
const coinsData = await fetchMultipleCoinsData(coinIds);
```

#### Global Market Data
```typescript
// Fetch global market statistics
const globalMarketData = await getGlobalData();
console.log('Bitcoin dominance:', globalMarketData.btcDominance);
```

#### Search Functionality
```typescript
// Search for coins by keyword
const searchResults = await searchCoins('bitcoin');
```

### Data Update Frequency

- Cryptocurrency prices: Every 5 minutes
- Market metrics: Hourly

## Usage in React Components

Data is accessed in UI components via custom hooks:

```typescript
// Example React component using crypto data
import { useCoinData } from '@/hooks/useCoinData';

function CoinPriceDisplay({ coinId }) {
  const { data, isLoading, error } = useCoinData(coinId);
  
  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  
  return (
    <div>
      <h2>{data.name} ({data.symbol})</h2>
      <p>Price: ${data.priceUsd.toLocaleString()}</p>
      <p>24h Change: {data.priceChange24h}%</p>
    </div>
  );
}
```

## Background Jobs

Data is kept up-to-date via scheduled background jobs:

### Crypto Market Data Update
```typescript
// Scheduled job that runs every 5 minutes
private static async updateCryptoMarketData(): Promise<any> {
  // Fetch latest data from CoinMarketCap API
  // Update Supabase database
}
```

### Macro Market Data Update
```typescript
// Scheduled job that runs hourly
private static async updateMacroMarketData(): Promise<any> {
  // Fetch global market data
  // Update Supabase database
}
```

## Error Handling

The system includes fallback mechanisms:

1. If the CoinMarketCap API is unavailable, cached data is used
2. If cached data is stale, a visual indicator shows the user
3. Rate limiting protection prevents API quota exhaustion

The service includes error handling to manage API failures gracefully:
- Network errors
- Rate limiting (both internal and CMC)
- Invalid data
- Missing API keys

## Troubleshooting

### Common Issues

1. **Missing CoinMarketCap API Key**:
   - Ensure the `CMC_API_KEY` environment variable is set
   - Check API key validity in the CoinMarketCap dashboard

2. **Rate Limiting**:
   - Increase caching duration
   - Reduce update frequency
   - Consider upgrading CMC subscription tier

3. **Data Freshness Issues**:
   - Check if background jobs are running
   - Verify the `last_updated` timestamp in the database
   - Ensure the data synchronization schedule is appropriate

4. **Missing Cryptocurrency Data**:
   - Verify the coin ID is correct
   - Check if the coin is supported by CoinMarketCap
   - Ensure the data is being correctly stored in Supabase

### Debugging Tools

Use these commands to debug data synchronization issues:

```bash
# Check the most recent crypto market data update
npx supabase-cli db query "SELECT last_updated FROM crypto_market_data ORDER BY last_updated DESC LIMIT 5;"

# Verify background job execution
npx supabase-cli db query "SELECT * FROM background_jobs WHERE job_type = 'updateCryptoMarketData' ORDER BY created_at DESC LIMIT 5;"
```

## Future Improvements

Potential improvements to consider:
- Implement more comprehensive server-side caching
- Add support for more CoinMarketCap endpoints
- Replace in-memory rate limiting with Redis for distributed deployments
- Integrate with additional data providers (CoinGecko, Binance, etc.)
- Implement historical data storage for price history
- Add on-chain metrics from sources like Glassnode or Arkham
- Calculate and store custom trading indicators
- Implement WebSocket connections for real-time price updates 