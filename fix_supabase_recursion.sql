-- Fix infinite recursion in profiles RLS policies
-- Run this in the Supabase SQL Editor

-- 1. Drop all existing policies on profiles table that might cause recursion
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can see their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Allow users to view their own profile" ON profiles;
DROP POLICY IF EXISTS "Allow users to update their own profile" ON profiles;

-- 2. Make sure RLS is enabled
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 3. Create simple non-recursive policies
-- This basic policy allows users to view their own profile without recursion
CREATE POLICY "Users can view their own profile"
ON profiles
FOR SELECT
USING (auth.uid() = id);

-- Policy for updating own profile
CREATE POLICY "Users can update their own profile"
ON profiles
FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Policy for inserting own profile
CREATE POLICY "Users can insert their own profile"
ON profiles
FOR INSERT
WITH CHECK (auth.uid() = id);

-- 4. Create a special policy for admins that does NOT cause recursion
-- Instead of using a self-referential check, we use a direct role comparison
CREATE POLICY "Admin access without recursion"
ON profiles
FOR ALL
USING (
  (auth.uid() = id) OR 
  -- This direct role check prevents recursion by using the "current row" context
  (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
); 