-- Fix infinite recursion in profiles RLS policies
-- Run this in the Supabase SQL Editor

-- 1. First, disable RLS temporarily to avoid recursion during fixes
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- 2. Create a dedicated function for admin checks that doesn't rely on recursively querying profiles
-- This function will be used in RLS policies to avoid recursion
CREATE OR REPLACE FUNCTION public.is_admin_safe()
RETURNS BOOLEAN AS $$
DECLARE
  user_role TEXT;
BEGIN
  -- Get the current user's role directly from the table, with RLS disabled
  SELECT role INTO user_role FROM profiles WHERE id = auth.uid();
  RETURN user_role = 'admin';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Drop all existing policies on profiles table
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can see their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Allow users to view their own profile" ON profiles;
DROP POLICY IF EXISTS "Allow users to update their own profile" ON profiles;
DROP POLICY IF EXISTS "Admin access without recursion" ON profiles;

-- 4. Re-enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 5. Create simple non-recursive policies using our safe function

-- Basic user access to own profile
CREATE POLICY "Users can view their own profile"
ON profiles
FOR SELECT
USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
ON profiles
FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
ON profiles
FOR INSERT
WITH CHECK (auth.uid() = id);

-- Admin access using our safe function
CREATE POLICY "Admins can view all profiles"
ON profiles
FOR SELECT
USING (is_admin_safe() OR auth.uid() = id);

CREATE POLICY "Admins can update all profiles"
ON profiles
FOR UPDATE
USING (is_admin_safe() OR auth.uid() = id)
WITH CHECK (is_admin_safe() OR auth.uid() = id);

-- 6. Test the function
SELECT is_admin_safe(); 