# Database Schema Documentation

## Overview

This document provides comprehensive documentation for the LearningCrypto platform database schema. The database is hosted on Supabase (PostgreSQL) and consists of multiple tables organized by functionality.

## Core Tables

### Profiles Table
The profiles table stores user profile information and handles role-based access control.

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
- `avatar_url`: TEXT - URL to user's avatar image
- `role`: TEXT - User's role ('user' or 'admin')
- `created_at`: TIMESTAMP WITH TIME ZONE - Record creation timestamp
- `updated_at`: TIMESTAMP WITH TIME ZONE - Record update timestamp

#### Triggers
1. `update_profiles_updated_at`
   - Automatically updates the `updated_at` timestamp when a record is modified
2. `on_auth_user_created`
   - Automatically creates a profile when a new user signs up
   - Sets default role to 'user'

#### Row Level Security (RLS) Policies
1. "Admins can view all profiles"
   - Allows admins to view all profiles
   - Regular users can only view their own profile
2. "Admins can update all profiles"
   - Allows admins to update any profile
   - Regular users can only update their own profile

### Content Table
The content table stores all types of content (articles, guides, tutorials, etc.).

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
- `slug`: TEXT - URL-friendly unique identifier
- `content`: TEXT - Main content body
- `excerpt`: TEXT - Short description/summary
- `author_id`: UUID - References the author's user ID
- `status`: TEXT - Content status ('draft', 'published', 'scheduled')
- `visibility`: TEXT - Access level ('public', 'members', 'paid')
- `type`: TEXT - Content type (article, guide, tutorial, etc.)
- SEO Fields:
  - `seo_title`: TEXT - SEO-optimized title
  - `seo_description`: TEXT - Meta description
  - `og_image`, `og_title`, `og_description`: TEXT - OpenGraph metadata
  - `twitter_image`, `twitter_title`, `twitter_description`: TEXT - Twitter card metadata
  - `canonical_url`: TEXT - Canonical URL if different from slug
- Timestamps:
  - `created_at`: TIMESTAMPTZ - Creation timestamp
  - `updated_at`: TIMESTAMPTZ - Last update timestamp
  - `published_at`: TIMESTAMPTZ - Publication timestamp
- Analytics:
  - `view_count`: INTEGER - Number of views
  - `like_count`: INTEGER - Number of likes
  - `share_count`: INTEGER - Number of shares

#### Indexes
- `idx_content_slug`: For URL lookups
- `idx_content_status`: For filtering by status
- `idx_content_visibility`: For access control
- `idx_content_type`: For content type filtering
- `idx_content_published_at`: For chronological ordering
- `idx_content_author_id`: For author lookups

#### RLS Policies
1. "Public can view published public content"
   - Allows anyone to view published public content
2. "Members can view member content"
   - Allows authenticated users to view member content
   - Allows paid subscribers to view paid content
3. "Content authors can manage their own content"
   - Authors can manage their own content
4. "Admins can manage all content"
   - Admins have full access to all content

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
1. "Users can view their own messages"
2. "Users can insert their own messages"
3. "Service role can do everything"

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