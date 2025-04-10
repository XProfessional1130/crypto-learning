# Cryptocurrency Data System

This document explains how cryptocurrency market data is managed in the Learning Crypto Platform.

## Overview

The platform integrates with external cryptocurrency data providers to display market information, power portfolio tracking, and enable watchlist functionality.

## Data Sources

- **Primary**: CoinMarketCap API
- **Secondary**: Our Supabase database (for cached data)

## Implementation

### Core Components

- **API Client**: `src/lib/api/coinmarketcap.ts`
- **Database Interface**: `src/lib/api/supabase-crypto.ts`
- **Types**: `src/types/portfolio.ts`

### Data Flow

1. **Data Retrieval**: Scheduled background jobs fetch data from CoinMarketCap
2. **Data Storage**: Information is stored in the `crypto_market_data` table
3. **Data Access**: React components access data through custom hooks
4. **Caching**: API responses are cached to minimize external API calls

## Database Structure

The primary tables for cryptocurrency data:

```sql
-- Stores current cryptocurrency market data
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

-- Stores global market indicators
CREATE TABLE macro_market_data (
  id SERIAL PRIMARY KEY,
  updated_at TIMESTAMPTZ DEFAULT now(),
  fear_greed_value INT,
  fear_greed_classification TEXT,
  total_market_cap NUMERIC(24, 2),
  total_volume_24h NUMERIC(24, 2),
  btc_dominance NUMERIC(12, 4),
  eth_dominance NUMERIC(12, 4),
  altcoin_dominance NUMERIC(12, 4),
  total_cryptocurrencies INT,
  total_exchanges INT
);
```

## Data Update Frequency

- Cryptocurrency prices: Every 5 minutes
- Market metrics: Hourly

## Usage in Code

### Fetching Crypto Data

```typescript
import { getCryptoData } from '@/lib/api/coinmarketcap';

// Get data for a specific coin
const btcData = await getCryptoData('bitcoin');

// Get data for multiple coins
const data = await getCryptoData(['bitcoin', 'ethereum']);
```

### Using the Custom Hook

```typescript
import { useCryptoData } from '@/hooks/useCryptoData';

function CryptoPrice({ coinId }) {
  const { data, isLoading, error } = useCryptoData(coinId);
  
  if (isLoading) return <p>Loading...</p>;
  if (error) return <p>Error loading data</p>;
  
  return <p>${data.price_usd}</p>;
}
```

## Error Handling

The system includes fallback mechanisms:

1. If the CoinMarketCap API is unavailable, cached data is used
2. If cached data is stale, a visual indicator shows the user
3. Rate limiting protection prevents API quota exhaustion

## Troubleshooting

Common issues and solutions:

1. **Missing Data**: Check the `last_updated` field in the database to ensure the background job is running
2. **Rate Limit Errors**: Review the API usage and adjust caching strategy
3. **Inconsistent Prices**: Verify the data source priority configuration 