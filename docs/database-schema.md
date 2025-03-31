# Database Schema Documentation

## Overview

Database schema for the LearningCrypto platform using Supabase (PostgreSQL).

## Core Tables

### Profiles Table
Stores user profile information and handles access control.

```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### Columns
- `id`: UUID (Primary Key) - References auth.users(id)
- `email`: TEXT - User's email address
- `full_name`: TEXT - User's full name
- `avatar_url`: TEXT - Avatar image URL
- `role`: TEXT - 'user' or 'admin'
- `created_at`: TIMESTAMP - Creation time
- `updated_at`: TIMESTAMP - Update time

#### Triggers
1. `update_profiles_updated_at`: Updates timestamp on modification
2. `on_auth_user_created`: Creates profile on user signup

#### RLS Policies
1. Admins view all profiles, users view only their own
2. Admins update all profiles, users update only their own

### Content Table
Stores articles, guides, tutorials, and other content.

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

#### Columns
- `id`: UUID (Primary Key)
- `title`: TEXT - Content title
- `slug`: TEXT - URL-friendly identifier
- `content`: TEXT - Main content body
- `excerpt`: TEXT - Summary
- `author_id`: UUID - Author reference
- `status`: TEXT - 'draft', 'published', 'scheduled'
- `visibility`: TEXT - 'public', 'members', 'paid'
- `type`: TEXT - Content type
- **SEO Fields**: Various metadata for search engines
- **Timestamps**: created_at, updated_at, published_at
- **Analytics**: view_count, like_count, share_count

#### Indexes
- `idx_content_slug`: URL lookups
- `idx_content_status`: Status filtering
- `idx_content_visibility`: Access control
- `idx_content_type`: Content type filtering
- `idx_content_published_at`: Chronological ordering
- `idx_content_author_id`: Author lookups

#### RLS Policies
1. Public users can view published public content
2. Members access member content, paid subscribers access paid content
3. Authors manage their own content
4. Admins manage all content

### Content Tags Table
Manages content categorization through tags.

```sql
CREATE TABLE content_tags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### Content Categories Table
Manages content categorization through categories.

```sql
CREATE TABLE content_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### Junction Tables

#### Content to Tags
```sql
CREATE TABLE content_to_tags (
  content_id UUID REFERENCES content(id) ON DELETE CASCADE,
  tag_id UUID REFERENCES content_tags(id) ON DELETE CASCADE,
  PRIMARY KEY (content_id, tag_id)
);
```

#### Content to Categories
```sql
CREATE TABLE content_to_categories (
  content_id UUID REFERENCES content(id) ON DELETE CASCADE,
  category_id UUID REFERENCES content_categories(id) ON DELETE CASCADE,
  PRIMARY KEY (content_id, category_id)
);
```

## Email Management

### Email Templates
```sql
CREATE TABLE email_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  content TEXT NOT NULL,
  variables JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

### Email Campaigns
```sql
CREATE TABLE email_campaigns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  template_id UUID REFERENCES email_templates(id),
  name TEXT NOT NULL,
  subject TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('draft', 'scheduled', 'sending', 'completed', 'failed')),
  scheduled_for TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  recipient_filter JSONB,
  variables JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

### Email Events
```sql
CREATE TABLE email_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id UUID REFERENCES email_campaigns(id),
  user_id UUID REFERENCES auth.users(id),
  event_type TEXT NOT NULL CHECK (event_type IN ('sent', 'delivered', 'opened', 'clicked', 'bounced', 'complained', 'unsubscribed')),
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

## User Interaction

### Chat Messages
Stores chat interactions between users and AI assistants.

```sql
CREATE TABLE chat_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  personality TEXT CHECK (personality IN ('tobo', 'heido')),
  thread_id TEXT,
  assistant_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT fk_user FOREIGN KEY(user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);
```

#### Indexes
- `idx_chat_messages_user_id`
- `idx_chat_messages_created_at`
- `idx_chat_messages_thread_id`

#### RLS Policies
1. Users view only their own messages
2. Users insert only their own messages
3. Service role has full access

### Background Jobs
Manages asynchronous tasks and scheduled operations.

```sql
CREATE TABLE background_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_type TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'running', 'completed', 'failed')),
  payload JSONB,
  result JSONB,
  error TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
);
```

## Subscription Management

### Subscriptions
Stores user subscription information.

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

#### Indexes
- `idx_subscriptions_user_id`: For quick lookup by user
- `idx_subscriptions_provider_id`: For integration with payment providers

#### RLS Policies
1. "Users can read their own subscriptions"
2. "Admins can read all subscriptions"
3. "Service role can manage all subscriptions"

## User Portfolios and Watchlists

### User Portfolios
Tracks user cryptocurrency holdings.

```sql
CREATE TABLE user_portfolios (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  coin_id TEXT NOT NULL,
  quantity DECIMAL(24, 8) NOT NULL,
  average_buy_price DECIMAL(24, 8),
  notes TEXT,
  is_private BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, coin_id)
);
```

### Watchlists
Tracks coins that users are following.

```sql
CREATE TABLE watchlists (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  coin_id TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, coin_id)
);
```

## Referral Program

### Referrals
Tracks user referrals and associated rewards.

```sql
CREATE TABLE referrals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  referrer_id UUID NOT NULL REFERENCES auth.users(id),
  referred_id UUID NOT NULL REFERENCES auth.users(id),
  status TEXT NOT NULL CHECK (status IN ('pending', 'converted', 'rewarded')),
  reward_amount DECIMAL(10, 2),
  reward_currency TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  converted_at TIMESTAMPTZ,
  rewarded_at TIMESTAMPTZ
);
```

## Utility Tables

### Audit Logs
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

## Database Functions

For database functions and stored procedures, see [Admin Authentication](./admin-authentication.md) documentation.

## Index Reference

This section lists all database indexes for performance optimization.

## Migration Management

Database schema changes are managed through:
1. Migration files in `supabase/migrations/`
2. Versioned using timestamp prefixes (e.g., `20240310123456_create_content_table.sql`)
3. Applied automatically during deployment or manually using the Supabase CLI

## Security Model

The database implements a comprehensive security model through:
1. Row Level Security (RLS) policies on all tables
2. Role-based access control via the profiles table
3. Function-based security using `SECURITY DEFINER` functions
4. Service role access limited to secure server-side operations 