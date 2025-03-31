# LC Platform Database Structure

## Overview
This document provides a comprehensive overview of the Learning Crypto (LC) Platform's database structure implemented in Supabase (PostgreSQL).

## Database Architecture Principles
- **Security**: Row Level Security (RLS) on all tables
- **Performance**: Strategic indexing and query optimization
- **Scalability**: Proper normalization and relationship management
- **Flexibility**: JSON/JSONB fields for dynamic data
- **Auditability**: Timestamp tracking and logging

## Core Tables

### 1. User Management
#### `auth.users` (Supabase Managed)
- Core authentication table managed by Supabase
- Contains email, hashed password, and authentication metadata

#### `profiles`
- **Purpose**: Extended user information and role management
- **Key Fields**:
  - `id`: UUID (FK to auth.users)
  - `username`: Unique username
  - `email`: User email
  - `full_name`: User's full name
  - `avatar_url`: Profile picture URL
  - `role`: 'user' or 'admin'
- **RLS Policies**:
  - Users can view/edit their own profile
  - Admins can view all profiles

### 2. Content System
#### `content`
- **Purpose**: Stores all platform content (articles, guides, tutorials)
- **Key Fields**:
  - `id`: UUID
  - `title`, `slug`, `content`, `excerpt`
  - `author_id`: FK to auth.users
  - `status`: draft/published/scheduled
  - `visibility`: public/members/paid
  - SEO fields (meta descriptions, OG tags)
  - Analytics fields (view/like/share counts)
- **RLS Policies**:
  - Public content visible to all
  - Member content requires authentication
  - Paid content requires subscription

#### Content Organization
- `content_tags`: Tag management
- `content_categories`: Category management
- Junction tables:
  - `content_to_tags`
  - `content_to_categories`

### 3. Subscription Management
#### `subscriptions`
- **Purpose**: User subscription tracking
- **Key Fields**:
  - `user_id`: FK to auth.users
  - `stripe_customer_id`, `stripe_subscription_id`
  - `status`: active/trialing/canceled/etc.
  - `plan_id`, `price_id`
  - Billing period tracking
- **RLS Policies**:
  - Users view own subscriptions
  - Service role manages all

### 4. Portfolio & Watchlist
#### `user_portfolios`
- **Purpose**: Cryptocurrency holdings tracking
- **Key Fields**:
  - `user_id`: FK to auth.users
  - `coin_id`, `coin_symbol`, `coin_name`
  - `amount`, `preferred_currency`
- **RLS Policies**: User-specific access

#### `watchlist`
- **Purpose**: Cryptocurrency tracking
- **Key Fields**:
  - `user_id`: FK to auth.users
  - `coin_id`, `symbol`, `name`
  - `price_target`
- **RLS Policies**: User-specific access

### 5. Chat System
#### `chat_messages`
- **Purpose**: AI chat interaction storage
- **Key Fields**:
  - `user_id`: FK to auth.users
  - `role`: user/assistant/system
  - `content`: Message content
  - `personality`: tobo/heido
  - OpenAI integration fields
- **RLS Policies**: Private user messages

### 6. Background Processing
#### `background_jobs`
- **Purpose**: Async task management
- **Key Fields**:
  - `job_type`, `status`
  - `data`, `result` (JSONB)
  - Scheduling and completion tracking

### 7. Email System
#### Email Management Tables
- `email_templates`: Template storage
- `email_campaigns`: Campaign management
- `email_events`: Email tracking

### 8. Caching & Performance
#### `api_cache`
- **Purpose**: External API response caching
- **Key Fields**:
  - `key`, `source`
  - `data` (JSONB)
  - `expires_at`

### 9. Audit System
#### `audit_logs`
- **Purpose**: System event tracking
- **Key Fields**:
  - `actor_id`: FK to auth.users
  - `action`, `table_name`
  - `old_data`, `new_data` (JSONB)
  - IP and user agent tracking

## Common Table Features
All tables include:
1. UUID primary keys
2. Created/updated timestamps
3. RLS policies
4. Appropriate indexes
5. Foreign key constraints

## Database Maintenance
- Migrations managed in `supabase/migrations/`
- Version control with timestamp prefixes
- Automated deployment through Supabase CLI

## Performance Considerations
1. Indexed fields for common queries
2. Materialized views for complex reports
3. Regular VACUUM and maintenance
4. Query optimization through EXPLAIN ANALYZE

## Security Implementation
1. Row Level Security (RLS) on all tables
2. Role-based access control
3. Service role limitations
4. Secure function execution 