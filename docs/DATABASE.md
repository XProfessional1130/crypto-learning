# Database Documentation

This document provides a comprehensive overview of the database structure used in the Learning Crypto Platform.

## Overview

The application uses Supabase as its primary database, which is built on PostgreSQL. The database stores user information, cryptocurrency data, portfolios, watchlists, and other related information.

## Key Tables

### User-Related Tables

#### Profiles
Stores extended user profile information beyond what's available in Supabase Auth.

```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE,
  email TEXT UNIQUE,
  display_name TEXT,
  avatar_url TEXT,
  tier TEXT DEFAULT 'free',
  is_admin BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

#### Subscriptions
Tracks user subscription status for paid plans.

```sql
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('active', 'trialing', 'canceled', 'incomplete', 'incomplete_expired', 'past_due', 'unpaid')),
  provider TEXT NOT NULL CHECK (provider IN ('stripe', 'radom')),
  provider_id TEXT,
  plan_id TEXT NOT NULL,
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  metadata JSONB DEFAULT '{}'
);
```

### Portfolio & Watchlist Tables

#### User Portfolios
Tracks individual user cryptocurrency holdings.

```sql
CREATE TABLE user_portfolios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  coin_id TEXT NOT NULL,
  coin_symbol TEXT NOT NULL,
  coin_name TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  preferred_currency TEXT DEFAULT 'USD',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, coin_id)
);
```

#### Team Portfolios
Allows teams to maintain shared cryptocurrency portfolios.

```sql
CREATE TABLE team_portfolios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL,
  coin_id TEXT NOT NULL,
  coin_symbol TEXT NOT NULL,
  coin_name TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  preferred_currency TEXT DEFAULT 'USD',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(team_id, coin_id)
);
```

#### Watchlists
Tracks coins that users want to monitor.

```sql
CREATE TABLE watchlists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  coin_id TEXT NOT NULL,
  coin_symbol TEXT NOT NULL,
  coin_name TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, coin_id)
);
```

#### Team Watchlists
Allows teams to maintain shared watchlists.

```sql
CREATE TABLE team_watchlists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL,
  coin_id TEXT NOT NULL,
  coin_symbol TEXT NOT NULL,
  coin_name TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(team_id, coin_id)
);
```

### Cryptocurrency Data Tables

#### Crypto Market Data
Stores current and historical price/market data for cryptocurrencies.

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

#### Macro Market Data
Stores global market indicators and metrics.

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

### Chat and AI Features

#### Chat History
Tracks user chat sessions with the AI assistant.

```sql
CREATE TABLE chat_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

#### Chat Messages
Stores individual messages within chat sessions.

```sql
CREATE TABLE chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id UUID NOT NULL REFERENCES chat_history(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### System Tables

#### API Cache
Caches external API responses to reduce rate limits and improve performance.

```sql
CREATE TABLE api_cache (
  id TEXT PRIMARY KEY,
  data JSONB NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

#### Background Jobs
Tracks scheduled and recurrent background jobs.

```sql
CREATE TABLE background_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_type TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed')),
  data JSONB,
  result JSONB,
  error TEXT,
  scheduled_for TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

## Row Level Security (RLS) Policies

Supabase uses PostgreSQL's Row Level Security to control access to data. Below are the key RLS policies implemented:

### Crypto Market Data
- **Allow authenticated users to read crypto market data**: Allows all authenticated users to read cryptocurrency market data
- **Service role can manage crypto market data**: Allows the service role to perform all operations on the crypto market data table

### User Portfolios
- **Users can only view/edit their own portfolio items**: Restricts users to only see and modify their own portfolio entries
- **Service role can manage all portfolio items**: Allows the service role to perform all operations

### Watchlists
- **Users can only view/edit their own watchlist items**: Restricts users to only see and modify their own watchlist entries
- **Service role can manage all watchlist items**: Allows the service role to perform all operations

### Team Portfolios and Watchlists
- **Team members can view their team portfolios/watchlists**: Allows team members to view shared team portfolios and watchlists
- **Team admins can edit team portfolios/watchlists**: Restricts editing capabilities to team administrators
- **Service role can manage all team portfolios/watchlists**: Allows the service role to perform all operations

## Database Updates and Migrations

Database migrations are stored in the `supabase/migrations` directory and are automatically applied during deployment. The migration files follow the naming convention `YYYYMMDD000000_description.sql`.

To add a new migration:
1. Create a new SQL file in the `supabase/migrations` directory with the appropriate naming convention
2. Write the SQL statements for the migration
3. Test the migration locally
4. Commit the migration file to the repository

## Data Synchronization

The application uses scheduled background jobs to keep cryptocurrency data up-to-date:

- **Crypto Market Data**: Updated every 5 minutes with the latest prices and market caps
- **Macro Market Data**: Updated hourly with global market indicators

## Troubleshooting

Common database issues and their solutions:

1. **Missing Tables**: If you encounter errors about missing tables, ensure all migrations have been applied
2. **RLS Policy Issues**: If users can't access data they should be able to, check the RLS policies
3. **Performance Issues**: For slow queries, consider adding indexes to frequently queried columns

## Backup and Recovery

Supabase automatically handles database backups. Additional manual backups can be taken through the Supabase dashboard or API. 