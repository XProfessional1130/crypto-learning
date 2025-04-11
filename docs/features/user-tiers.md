# User Tiers System

This document outlines the user tier system in the Learning Crypto Platform.

## Overview

The platform offers a tiered access model, providing different levels of features based on the user's subscription tier. This enables a freemium model with premium paid features.

## Tier Structure

The platform has the following user tiers:

| Tier | Description | Pricing |
|------|-------------|---------|
| **Free** | Basic access with limited features | $0/month |
| **Premium** | Enhanced access with more features | $14.99/month or $149.90/year |
| **Pro** | Full access with all features | $29.99/month or $299.90/year |

## Feature Availability by Tier

| Feature | Free | Premium | Pro |
|---------|------|---------|-----|
| Portfolio Tracking | ✅ (Limited) | ✅ | ✅ |
| Watchlist | ✅ (Up to 10 coins) | ✅ (Up to 50 coins) | ✅ (Unlimited) |
| AI Chat | ✅ (5 messages/day) | ✅ (100 messages/day) | ✅ (Unlimited) |
| Price Alerts | ❌ | ✅ (10 alerts) | ✅ (Unlimited) |
| Advanced Analytics | ❌ | ✅ | ✅ |
| Team Features | ❌ | ❌ | ✅ |
| API Access | ❌ | ❌ | ✅ |
| Early Access to New Features | ❌ | ❌ | ✅ |

## Technical Implementation

### User Tier Storage

The user's tier is stored in the `profiles` table:

```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  username TEXT UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  tier TEXT DEFAULT 'free',
  is_admin BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Subscription Table

Subscription details are stored in the `subscriptions` table:

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

### Tier Enforcement

Tier restrictions are enforced at multiple levels:

1. **UI Level**: Features are hidden/disabled based on the user's tier
2. **API Level**: API endpoints validate the user's tier before processing requests
3. **Database Level**: RLS policies restrict access to data based on the user's tier

### Feature Limit Implementation

```typescript
// Example: Enforcing watchlist limits
export async function addToWatchlist(userId: string, coinId: string) {
  // Get user's current tier
  const { data: profile } = await supabase
    .from('profiles')
    .select('tier')
    .eq('id', userId)
    .single();
    
  // Get current watchlist count
  const { count } = await supabase
    .from('watchlists')
    .select('id', { count: 'exact' })
    .eq('user_id', userId);
    
  // Check limits based on tier
  const limits = {
    free: 10,
    premium: 50,
    pro: Infinity
  };
  
  if (count >= limits[profile.tier]) {
    throw new Error(`Watchlist limit reached for ${profile.tier} tier`);
  }
  
  // Proceed with adding the coin
  return supabase
    .from('watchlists')
    .insert({
      user_id: userId,
      coin_id: coinId
    });
}
```

## Payment Processing

The platform supports two payment methods:

1. **Stripe**: For traditional credit card/debit card payments
2. **Radom**: For cryptocurrency payments

### Upgrading a User's Tier

When a payment is successful:

1. The webhook handler receives the event
2. Validates the payment
3. Updates the subscription record
4. Updates the user's tier in the profiles table

```typescript
// Example: Processing a successful payment
async function handleSuccessfulPayment(event) {
  const subscription = event.data.object;
  
  // Map Stripe plan IDs to tiers
  const planToTier = {
    'price_1234567890': 'premium',
    'price_0987654321': 'pro'
  };
  
  const tier = planToTier[subscription.plan.id] || 'free';
  
  // Update subscription record
  await supabase
    .from('subscriptions')
    .update({
      status: subscription.status,
      current_period_start: new Date(subscription.current_period_start * 1000),
      current_period_end: new Date(subscription.current_period_end * 1000),
      cancel_at_period_end: subscription.cancel_at_period_end
    })
    .eq('stripe_subscription_id', subscription.id);
    
  // Update user tier
  await supabase
    .from('profiles')
    .update({ tier })
    .eq('id', subscription.metadata.user_id);
}
```

## User Experience

### Upgrade Flow

1. User navigates to the subscription page
2. Selects a tier to upgrade to
3. Chooses payment method (Stripe or Radom)
4. Completes payment flow
5. Is immediately granted access to new tier features

### Downgrade/Cancellation

1. User can cancel subscription at any time
2. Access remains until the end of the current billing period
3. After period end, tier is automatically downgraded
4. User data is preserved, but access to premium features is restricted

## Testing Tier Functionality

For development and testing, you can manually set a user's tier:

```sql
-- Set a user to premium tier
UPDATE profiles
SET tier = 'premium'
WHERE id = 'user-uuid-here';
```

Or use the testing endpoints with the appropriate authentication in development:

```
POST /api/testing/set-tier
Body: { "tier": "premium" }
```

## Monitoring and Analytics

The platform tracks tier-related metrics:

- Conversion rate from free to paid tiers
- Churn rate by tier
- Feature usage by tier
- Revenue per tier

This data helps optimize pricing and feature allocation across tiers. 