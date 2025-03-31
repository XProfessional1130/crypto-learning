-- This script fixes the "ERROR: column "customer_email" of relation "subscriptions" does not exist" error
-- Run this in your Supabase SQL Editor to create the auth.subscriptions table needed for magic link recovery

-- First ensure the auth.subscriptions table exists
CREATE TABLE IF NOT EXISTS auth.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT UNIQUE,
  plan_id TEXT,
  status TEXT CHECK (status IN ('active', 'trialing', 'past_due', 'canceled', 'incomplete', 'incomplete_expired', 'unpaid')),
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  price_id TEXT,
  quantity INTEGER DEFAULT 1,
  metadata JSONB,
  customer_email TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Add any missing columns to auth.subscriptions
DO $$
BEGIN
  -- Add stripe_customer_id if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'auth' AND table_name = 'subscriptions' AND column_name = 'stripe_customer_id'
  ) THEN
    ALTER TABLE auth.subscriptions ADD COLUMN stripe_customer_id TEXT;
  END IF;
  
  -- Add stripe_subscription_id if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'auth' AND table_name = 'subscriptions' AND column_name = 'stripe_subscription_id'
  ) THEN
    ALTER TABLE auth.subscriptions ADD COLUMN stripe_subscription_id TEXT UNIQUE;
  END IF;
  
  -- Add customer_email if missing (required for auth recovery)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'auth' AND table_name = 'subscriptions' AND column_name = 'customer_email'
  ) THEN
    ALTER TABLE auth.subscriptions ADD COLUMN customer_email TEXT NOT NULL DEFAULT 'placeholder@example.com';
    -- After adding with a default, you should update with real emails
  END IF;
END;
$$;

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_auth_subscriptions_user_id ON auth.subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_auth_subscriptions_stripe_customer_id ON auth.subscriptions(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_auth_subscriptions_stripe_subscription_id ON auth.subscriptions(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_auth_subscriptions_status ON auth.subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_auth_subscriptions_customer_email ON auth.subscriptions(customer_email);

-- Enable RLS on the subscriptions table
ALTER TABLE auth.subscriptions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
DO $$
BEGIN
  -- Check if policy exists first
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'subscriptions' 
    AND schemaname = 'auth'
    AND policyname = 'Users can view their own subscriptions'
  ) THEN
    -- Create policy if it doesn't exist
    CREATE POLICY "Users can view their own subscriptions"
      ON auth.subscriptions
      FOR SELECT
      USING (auth.uid() = user_id OR customer_email = auth.jwt() ->> 'email');
  END IF;
  
  -- Check if policy exists first
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'subscriptions' 
    AND schemaname = 'auth'
    AND policyname = 'Service role can manage subscriptions'
  ) THEN
    -- Create policy if it doesn't exist
    CREATE POLICY "Service role can manage subscriptions"
      ON auth.subscriptions
      USING (auth.role() = 'service_role');
  END IF;
END;
$$;

-- Create trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION auth.update_subscription_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'update_subscriptions_updated_at'
    AND tgrelid = 'auth.subscriptions'::regclass
  ) THEN
    CREATE TRIGGER update_subscriptions_updated_at
    BEFORE UPDATE ON auth.subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION auth.update_subscription_updated_at();
  END IF;
END;
$$;

-- Add an initial dummy record for the admin user if it doesn't exist
-- This ensures the table has at least one record with the customer_email field
DO $$
DECLARE
  admin_id UUID;
  admin_email TEXT;
BEGIN
  -- Get the admin user's ID and email
  SELECT id, email INTO admin_id, admin_email
  FROM auth.users
  WHERE email = 'admin@learningcrypto.com'
  LIMIT 1;
  
  -- If admin user exists, add a subscription record if one doesn't exist
  IF admin_id IS NOT NULL THEN
    -- Only insert if no record exists for this user
    IF NOT EXISTS (
      SELECT 1 FROM auth.subscriptions WHERE user_id = admin_id
    ) THEN
      INSERT INTO auth.subscriptions (
        user_id, 
        stripe_customer_id, 
        stripe_subscription_id, 
        plan_id, 
        status, 
        customer_email
      ) VALUES (
        admin_id,
        'dummy_customer_id',
        'dummy_sub_' || admin_id,
        'free',
        'active',
        admin_email
      );
    END IF;
  END IF;
END;
$$; 