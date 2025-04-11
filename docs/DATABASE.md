# Database Documentation

This document provides a comprehensive overview of the database structure used in the Learning Crypto Platform.

## Overview

The application uses Supabase as its primary database, which is built on PostgreSQL. The database follows these architecture principles:

- **Security**: Row Level Security (RLS) on all tables
- **Performance**: Strategic indexing and query optimization 
- **Scalability**: Proper normalization and relationship management
- **Flexibility**: JSON/JSONB fields for dynamic data
- **Auditability**: Timestamp tracking and logging

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

### Content System

#### Content
Stores all platform content (articles, guides, tutorials)

```sql
CREATE TABLE content (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  content TEXT NOT NULL,
  excerpt TEXT,
  author_id UUID REFERENCES auth.users(id),
  status TEXT NOT NULL CHECK (status IN ('draft', 'published', 'scheduled')),
  visibility TEXT NOT NULL CHECK (visibility IN ('public', 'members', 'paid')),
  type TEXT NOT NULL,
  
  -- SEO fields
  seo_title TEXT,
  seo_description TEXT,
  og_image TEXT,
  og_title TEXT,
  og_description TEXT,
  twitter_image TEXT,
  twitter_title TEXT,
  twitter_description TEXT,
  canonical_url TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  published_at TIMESTAMPTZ,
  
  -- Analytics fields
  view_count INTEGER DEFAULT 0,
  like_count INTEGER DEFAULT 0,
  share_count INTEGER DEFAULT 0
);
```

#### Content Organization
- `content_tags`: Tag management
- `content_categories`: Category management
- Junction tables:
  - `content_to_tags`
  - `content_to_categories`

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

#### Audit Logs
Tracks important system events for security and troubleshooting.

```sql
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  actor_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL,
  table_name TEXT,
  record_id UUID,
  old_data JSONB,
  new_data JSONB,
  ip_address TEXT,
  user_agent TEXT,
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

### Content Access
- **Public users can view published public content**: Anyone can read content with 'public' visibility
- **Members access member content**: Authenticated users can access member-restricted content
- **Paid subscribers access paid content**: Users with active subscriptions can access paid content
- **Authors manage their own content**: Content creators can edit their own content
- **Admins manage all content**: Admin users have full content management rights

## Database Updates and Migrations

Database migrations are stored in the `supabase/migrations` directory and are automatically applied during deployment. The migration files follow the naming convention `YYYYMMDD000000_description.sql`.

To add a new migration:
1. Create a new SQL file in the `supabase/migrations` directory with the appropriate naming convention
2. Write the SQL statements for the migration
3. Test the migration locally
4. Commit the migration file to the repository

## Validating Database Setup

To ensure your database is set up correctly and security policies are working as expected, follow these validation steps:

### 1. Verify Database Structure

Run the setup validation script to check if all required tables exist:

```bash
npm run setup:db
```

This script validates the database structure and reports any missing or misconfigured tables.

### 2. Test RLS Policies

Run the database security test script to verify that RLS policies are enforced correctly:

```bash
npm run test:db
```

This script tests database access with different user roles:
- Service role (should have full access)
- Anonymous users (should be restricted from protected data)
- Authenticated users (should only access their own data)
- Admin users (should have broader access)

#### Setting up Test Users

For complete testing, you should set up test users with different roles:

1. **Test User**: Create a standard test user via the Supabase dashboard or API.
2. **Admin User**: Create an admin user with the following command:
   ```bash
   npm run admin:create -- --email test-admin@example.com --password your_secure_password
   ```

Then set these credentials in your environment for testing:
```
TEST_USER_EMAIL=test-user@example.com
TEST_USER_PASSWORD=your_test_password
TEST_ADMIN_EMAIL=test-admin@example.com
TEST_ADMIN_PASSWORD=your_secure_password
```

You can add these to your `.env.local` file for development, but make sure not to commit these values to your repository.

#### Note on Email Confirmation

By default, Supabase requires email confirmation for new users. The test script works around this by using the service role to simulate authenticated and admin user permissions. This approach verifies that the database structure is correct, but doesn't fully test RLS under actual user authentication.

For complete RLS testing, either:
1. Disable email confirmation in your Supabase project settings (for development/testing only)
2. Use pre-confirmed user accounts with known credentials
3. Use the admin panel to manually confirm test users before running tests

### 3. Common RLS Issues and Solutions

If you encounter RLS policy issues, try these solutions:

#### Recursion Issues with Profile Queries

The most common issue is recursion in RLS policies when an RLS policy needs to query the same table it's protecting. To fix:
```sql
CREATE OR REPLACE FUNCTION public.is_admin_safe()
RETURNS BOOLEAN AS $$
DECLARE
  user_role TEXT;
BEGIN
  -- Get the current user's role directly, bypassing RLS
  -- The SECURITY DEFINER ensures this runs with owner privileges
  SELECT role INTO user_role FROM profiles WHERE id = auth.uid();
  RETURN user_role = 'admin';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

2. Use this function in policies instead of directly querying the profiles table:
```sql
CREATE POLICY "Admins can view all profiles"
ON profiles
FOR SELECT
USING (is_admin_safe() OR auth.uid() = id);
```

#### Permission Errors

If users can't access data they should be able to:
1. Verify the RLS policy syntax
2. Check that the user's session contains required claims
3. Test with the service role to bypass RLS temporarily

## Data Synchronization

The application uses scheduled background jobs to keep cryptocurrency data up-to-date:

- **Crypto Market Data**: Updated every 5 minutes with the latest prices and market caps
- **Macro Market Data**: Updated hourly with global market indicators

## Performance Considerations

1. Indexed fields for common queries
2. Materialized views for complex reports
3. Regular VACUUM and maintenance
4. Query optimization through EXPLAIN ANALYZE

## Troubleshooting

Common database issues and their solutions:

1. **Missing Tables**: If you encounter errors about missing tables, ensure all migrations have been applied
2. **RLS Policy Issues**: If users can't access data they should be able to, check the RLS policies
3. **Performance Issues**: For slow queries, consider adding indexes to frequently queried columns

## Backup and Recovery

Supabase automatically handles database backups. Additional manual backups can be taken through the Supabase dashboard or API. 