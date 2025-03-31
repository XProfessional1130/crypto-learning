# Database Fix Instructions

This document provides instructions for fixing the database issues between Supabase authentication, profiles, and subscriptions tables.

## The Problem

The current database setup has several issues:

1. Multiple conflicting triggers on the auth.users table
2. Inconsistent relationships between auth.users, profiles, and subscriptions tables
3. Mismatched schema columns causing errors with Supabase Auth
4. Issues with Row Level Security (RLS) policies

## The Solution

A comprehensive fix has been created to address these issues:

1. **SQL Migration**: `supabase/migrations/20240701000000_fix_database_conflicts.sql`
   - Standardizes the profiles table schema
   - Simplifies and consolidates triggers
   - Fixes RLS policies for both profiles and subscriptions tables
   - Ensures data consistency between tables

2. **Fix Script**: `scripts/fix-database.js`
   - Applies the SQL migration
   - Verifies the fix was successful
   - Provides detailed feedback

## How to Apply the Fix

### Option 1: Run the Fix Script (Recommended)

1. Ensure you have the required environment variables set:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`

2. Run the fix script:
   ```bash
   node scripts/fix-database.js
   ```

3. The script will:
   - Apply the database fixes
   - Verify the tables exist and are accessible
   - Report any issues

### Option 2: Manual SQL Execution

If the script doesn't work for any reason:

1. Go to your Supabase dashboard and open the SQL Editor
2. If needed, enable `pgrest` by running:
   ```sql
   CREATE EXTENSION IF NOT EXISTS pgrest;
   ```
3. Copy the content of `supabase/migrations/20240701000000_fix_database_conflicts.sql`
4. Paste it into the SQL Editor and run

## Verifying the Fix

After applying the fix, you should verify that:

1. User authentication works correctly
2. Profiles are automatically created for new users
3. The admin dashboard can view and manage subscriptions
4. No database errors appear during sign-up/sign-in operations

## Troubleshooting

If you encounter issues:

1. Check Supabase logs for any database errors
2. Verify that your Supabase service role key has appropriate permissions
3. Make sure all required tables exist (auth.users, profiles, subscriptions)
4. If needed, you can run the SQL script again - it's designed to be idempotent

## Technical Details

The fix addresses several specific issues:

1. **Duplicate Triggers**: Removed multiple triggers on auth.users that had overlapping functionality
2. **Missing Columns**: Added necessary columns to profiles table that Supabase Auth expects
3. **RLS Policy Conflicts**: Simplified and standardized RLS policies
4. **Data Consistency**: Added code to reconcile any existing inconsistencies

If you have any questions or encounter issues applying this fix, please contact the development team. 