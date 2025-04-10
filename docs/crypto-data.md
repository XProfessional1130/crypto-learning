# Cryptocurrency Data Integration

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
  chain?: string;            // Blockchain the token is on (ethereum, bsc, etc.)
  liquidity?: number;        // Liquidity in USD
  trustScore?: number;       // Internal score for sorting/filtering
  dexId?: string;            // DEX identifier
  
  // CoinMarketCap specific properties
  cmcRank?: number;          // CoinMarketCap rank
  slug?: string;             // CoinMarketCap slug (url friendly name)
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
  activeAddressesCount?: number; // Count of active blockchain addresses
  largeTransactionsCount?: number; // Count of large transactions
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
  active_addresses_count INT,
  active_addresses_change_24h NUMERIC(12, 4),
  active_addresses_timestamp TIMESTAMPTZ,
  large_transactions_count INT,
  large_transactions_change_24h NUMERIC(12, 4),
  large_transactions_timestamp TIMESTAMPTZ,
  total_market_cap NUMERIC(24, 2),
  total_volume_24h NUMERIC(24, 2),
  btc_dominance NUMERIC(12, 4),
  eth_dominance NUMERIC(12, 4),
  altcoin_dominance NUMERIC(12, 4),
  total_cryptocurrencies INT,
  total_exchanges INT
);
```

## API Integration

### CoinMarketCap API

The platform uses the CoinMarketCap Pro API. To set up the integration:

1. Sign up for a [CoinMarketCap API key](https://coinmarketcap.com/api/)
2. Add the API key to your environment variables:
   ```
   CMC_API_KEY=your_coinmarketcap_api_key
   ```

### Rate Limits and Caching

CoinMarketCap API has rate limits based on your subscription tier. The platform implements several strategies to handle these:

1. **Batch Processing**: Fetches multiple coins in a single request
2. **Database Caching**: Stores results in Supabase
3. **Background Jobs**: Updates data on a schedule rather than on-demand
4. **Client-side Caching**: Prevents duplicate requests from the frontend

## Core API Functionality

### Initialization

The service is initialized during application startup:

```typescript
// Initialize the service during app startup
initCoinDataService()
  .then(() => console.log('Coin data service initialized'))
  .catch(err => console.error('Failed to initialize coin data service:', err));
```

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

#### Top Coins
```typescript
// Get top 100 coins by market cap
const topCoins = await getTopCoins(100);
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

## Data Access in UI Components

Data is accessed in UI components via custom hooks:

```typescript
// Example React component using crypto data
function CoinPriceDisplay({ coinId }) {
  const { data: coinData, isLoading, error } = useCoinData(coinId);
  
  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  
  return (
    <div>
      <h2>{coinData.name} ({coinData.symbol})</h2>
      <p>Price: ${coinData.priceUsd.toLocaleString()}</p>
      <p>24h Change: {coinData.priceChange24h}%</p>
    </div>
  );
}
```

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

## Further Development

To extend the cryptocurrency data functionality:

1. **Additional Data Sources**: Integrate with other providers (CoinGecko, Binance, etc.)
2. **Historical Data**: Implement time-series data storage for price history
3. **On-chain Metrics**: Add blockchain analytics from sources like Glassnode or Arkham
4. **Custom Indicators**: Calculate and store custom trading indicators
5. **Real-time Updates**: Implement WebSocket connections for real-time price updates 