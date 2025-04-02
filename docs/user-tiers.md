# User Tier System Documentation

## Overview

The Learning Crypto platform implements a simple user tier system to differentiate between free and paid users. This system controls access to premium features and content.

## User Tiers

Currently, the platform supports two user tiers:

1. **Free** - Default tier for all new users
2. **Paid** - Users with an active subscription

## Database Schema

The tier system is implemented in the database with the following components:

### Profiles Table

The `profiles` table includes a `plan_type` column:

```sql
ALTER TABLE profiles
ADD COLUMN plan_type TEXT DEFAULT 'free' CHECK (plan_type IN ('free', 'paid'));
```

### Subscription Trigger

A database trigger automatically updates a user's plan_type based on their subscription status:

```sql
CREATE OR REPLACE FUNCTION update_user_plan_type()
RETURNS TRIGGER AS $$
BEGIN
  -- If subscription becomes active, set to paid
  IF NEW.status = 'active' THEN
    UPDATE profiles SET plan_type = 'paid' WHERE id = NEW.user_id;
  -- If subscription is canceled and grace period ended, set to free
  ELSIF (NEW.status = 'canceled' AND NEW.current_period_end < NOW()) THEN
    UPDATE profiles SET plan_type = 'free' WHERE id = NEW.user_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

## Frontend Implementation

### Checking for Paid Access

To check if a user has access to paid features, use the `usePaidFeatureAccess` hook:

```jsx
import usePaidFeatureAccess from '@/hooks/auth/usePaidFeatureAccess';

function MyComponent() {
  const hasPaidAccess = usePaidFeatureAccess();
  
  return (
    <div>
      {hasPaidAccess ? (
        <PremiumFeature />
      ) : (
        <FreeTierFeature />
      )}
    </div>
  );
}
```

### Paid Feature Gate Component

For convenience, you can use the `PaidFeatureGate` component to conditionally render content:

```jsx
import PaidFeatureGate from '@/components/features/PaidFeatureGate';

function MyComponent() {
  return (
    <div>
      <PaidFeatureGate>
        {/* This content is only visible to paid users */}
        <PremiumContent />
      </PaidFeatureGate>
    </div>
  );
}
```

The component also accepts a `fallback` prop to customize what free users see:

```jsx
<PaidFeatureGate fallback={<CustomUpgradeBanner />}>
  <PremiumContent />
</PaidFeatureGate>
```

## Content Access Control

Content visibility is controlled through Row Level Security (RLS) policies:

```sql
CREATE POLICY "Paid content access based on plan_type"
ON content
FOR SELECT
USING (
  status = 'published' AND 
  (
    visibility = 'public' OR 
    (visibility = 'members' AND auth.role() = 'authenticated') OR
    (
      visibility = 'paid' AND EXISTS (
        SELECT 1 FROM profiles p
        WHERE p.id = auth.uid() 
        AND (p.plan_type = 'paid' OR p.role = 'admin')
      )
    )
  )
);
```

## Future Expansion

This system is designed to be easily expandable to support multiple tiers in the future. When additional tiers are needed:

1. Add new tier values to the CHECK constraint
2. Create a `subscription_tiers` table
3. Implement a feature flag system

## Common Tasks

### Checking a User's Plan Type

```sql
SELECT plan_type FROM profiles WHERE id = 'user-id';
```

### Manually Updating a User's Plan Type

```sql
UPDATE profiles SET plan_type = 'paid' WHERE id = 'user-id';
```

### Finding All Paid Users

```sql
SELECT * FROM profiles WHERE plan_type = 'paid';
``` 