-- Fix database conflicts between auth, profiles, and subscriptions
BEGIN;

-- 1. Fix profiles table schema to match Supabase auth expectations
-- Make sure profiles table exists with correct columns
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  recovery_sent_at TIMESTAMPTZ DEFAULT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add missing columns if they don't exist
ALTER TABLE profiles 
  ADD COLUMN IF NOT EXISTS username TEXT,
  ADD COLUMN IF NOT EXISTS email TEXT,
  ADD COLUMN IF NOT EXISTS full_name TEXT,
  ADD COLUMN IF NOT EXISTS avatar_url TEXT,
  ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user',
  ADD COLUMN IF NOT EXISTS recovery_sent_at TIMESTAMPTZ DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 2. Drop and recreate triggers to avoid conflicts
-- Drop all existing triggers that might conflict
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS sync_auth_user_changes ON auth.users;
DROP TRIGGER IF EXISTS sync_subscription_changes ON subscriptions;
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;

-- Recreate updated_at trigger for profiles
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON profiles
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- 3. Create a single clean trigger for auth.users changes
CREATE OR REPLACE FUNCTION handle_auth_user_changes()
RETURNS TRIGGER AS $$
BEGIN
  -- For new users, create a profile record
  IF (TG_OP = 'INSERT') THEN
    INSERT INTO profiles (id, email, role)
    VALUES (NEW.id, NEW.email, 
      CASE 
        WHEN NEW.email = 'admin@learningcrypto.com' THEN 'admin'
        ELSE 'user'
      END
    )
    ON CONFLICT (id) DO UPDATE
    SET email = EXCLUDED.email;
    
    -- Link any existing subscriptions with this email
    UPDATE subscriptions
    SET user_id = NEW.id
    WHERE customer_email = NEW.email AND user_id IS NULL;
    
  -- For updated users, update related tables
  ELSIF (TG_OP = 'UPDATE') THEN
    -- Only update if email actually changed
    IF NEW.email <> OLD.email THEN
      -- Update profile email
      UPDATE profiles
      SET email = NEW.email,
          updated_at = NOW()
      WHERE id = NEW.id;
      
      -- Update subscription email
      UPDATE subscriptions
      SET customer_email = NEW.email
      WHERE user_id = NEW.id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create single trigger for auth.users changes
CREATE TRIGGER handle_auth_user_changes
  AFTER INSERT OR UPDATE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_auth_user_changes();

-- 4. Simplify subscription trigger
CREATE OR REPLACE FUNCTION handle_subscription_changes()
RETURNS TRIGGER AS $$
BEGIN
  -- Only try to link subscription with user if it's not already linked
  IF (NEW.user_id IS NULL AND NEW.customer_email IS NOT NULL) THEN
    -- Look for matching user in auth.users and link if found
    UPDATE subscriptions
    SET user_id = u.id
    FROM auth.users u
    WHERE u.email = NEW.customer_email
    AND subscriptions.id = NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER handle_subscription_changes
  AFTER INSERT OR UPDATE ON subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION handle_subscription_changes();

-- 5. Fix RLS policies for profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Drop any existing policies to avoid duplicates
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;

-- Create new policies with correct permissions
CREATE POLICY "Users can view own profile"
  ON profiles
  FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
  ON profiles
  FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  ));

CREATE POLICY "Admins can update all profiles"
  ON profiles
  FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  ));

-- 6. Fix RLS policies for subscriptions
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- Drop any existing policies to avoid duplicates
DROP POLICY IF EXISTS "Users can view their own subscriptions" ON subscriptions;
DROP POLICY IF EXISTS "Service role can manage subscriptions" ON subscriptions;
DROP POLICY IF EXISTS "Admins can view all subscriptions" ON subscriptions;
DROP POLICY IF EXISTS "Admins can manage all subscriptions" ON subscriptions;

-- Create new policies with correct permissions
CREATE POLICY "Users can view their own subscriptions"
  ON subscriptions
  FOR SELECT
  USING (
    auth.uid() = user_id OR 
    customer_email = (SELECT email FROM auth.users WHERE id = auth.uid())
  );

-- Allow authenticated users to control their own subscriptions
CREATE POLICY "Users can manage their own subscriptions"
  ON subscriptions
  FOR ALL
  USING (
    auth.uid() = user_id OR 
    customer_email = (SELECT email FROM auth.users WHERE id = auth.uid())
  );

-- Admin policies for subscriptions
CREATE POLICY "Admins can view all subscriptions"
  ON subscriptions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can manage all subscriptions"
  ON subscriptions
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Service role always has full access
CREATE POLICY "Service role can manage subscriptions"
  ON subscriptions
  USING (auth.role() = 'service_role');

-- 7. Ensure username uniqueness but allow nulls (common issue)
-- First drop the constraint if it exists
ALTER TABLE profiles 
  DROP CONSTRAINT IF EXISTS profiles_username_key;

-- Add a functional index that ignores nulls
CREATE UNIQUE INDEX IF NOT EXISTS profiles_username_unique_idx 
  ON profiles (username) 
  WHERE username IS NOT NULL;

-- 8. Reconcile existing data
-- Match subscriptions with users where possible
UPDATE subscriptions
SET user_id = u.id
FROM auth.users u
WHERE u.email = subscriptions.customer_email 
AND subscriptions.user_id IS NULL;

-- Ensure all auth users have profiles
INSERT INTO profiles (id, email, role)
SELECT id, email, 'user'
FROM auth.users u
WHERE NOT EXISTS (
  SELECT 1 FROM profiles p WHERE p.id = u.id
)
ON CONFLICT (id) DO NOTHING;

-- Fix admin account if it exists
UPDATE profiles
SET role = 'admin'
WHERE email = 'admin@learningcrypto.com';

COMMIT; 