import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    // Get the API key from the Authorization header
    const apiKey = req.headers.get('Authorization')?.replace('Bearer ', '');
    
    // Validate API key (optional security measure)
    if (apiKey !== process.env.ADMIN_API_KEY) {
      return NextResponse.json({
        success: false,
        error: 'Unauthorized: Invalid API key'
      }, { status: 401 });
    }
    
    // Create admin client with service role that can bypass RLS
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || ''
    );
    
    // Execute SQL to fix the RLS policies
    const { error } = await supabaseAdmin.rpc('execute_sql', {
      sql: `
        BEGIN;
        
        -- 1. First, disable RLS temporarily to avoid recursion during fixes
        ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
        
        -- 2. Create a dedicated function for admin checks that doesn't rely on recursively querying profiles
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
        DO $$
        BEGIN
          -- Attempt to drop each policy, but don't fail if they don't exist
          BEGIN
            DROP POLICY "Admins can view all profiles" ON profiles;
          EXCEPTION WHEN undefined_object THEN
            -- Policy doesn't exist, continue
          END;
          
          BEGIN
            DROP POLICY "Admins can update all profiles" ON profiles;
          EXCEPTION WHEN undefined_object THEN
            -- Policy doesn't exist, continue
          END;
          
          BEGIN
            DROP POLICY "Users can view own profile" ON profiles;
          EXCEPTION WHEN undefined_object THEN
            -- Policy doesn't exist, continue
          END;
          
          BEGIN
            DROP POLICY "Users can update own profile" ON profiles;
          EXCEPTION WHEN undefined_object THEN
            -- Policy doesn't exist, continue
          END;
          
          BEGIN
            DROP POLICY "Users can insert own profile" ON profiles;
          EXCEPTION WHEN undefined_object THEN
            -- Policy doesn't exist, continue
          END;
          
          BEGIN
            DROP POLICY "Users can see their own profile" ON profiles;
          EXCEPTION WHEN undefined_object THEN
            -- Policy doesn't exist, continue
          END;
          
          BEGIN
            DROP POLICY "Users can update their own profile" ON profiles;
          EXCEPTION WHEN undefined_object THEN
            -- Policy doesn't exist, continue
          END;
          
          BEGIN
            DROP POLICY "Users can view their own profile" ON profiles;
          EXCEPTION WHEN undefined_object THEN
            -- Policy doesn't exist, continue
          END;
          
          BEGIN
            DROP POLICY "Allow users to view their own profile" ON profiles;
          EXCEPTION WHEN undefined_object THEN
            -- Policy doesn't exist, continue
          END;
          
          BEGIN
            DROP POLICY "Allow users to update their own profile" ON profiles;
          EXCEPTION WHEN undefined_object THEN
            -- Policy doesn't exist, continue
          END;
          
          BEGIN
            DROP POLICY "Admin access without recursion" ON profiles;
          EXCEPTION WHEN undefined_object THEN
            -- Policy doesn't exist, continue
          END;
        END
        $$;
        
        -- 4. Re-enable RLS
        ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
        
        -- 5. Check if policies already exist and create them if they don't
        DO $$
        BEGIN
          -- Create basic user access policies
          IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'Users can view their own profile') THEN
            CREATE POLICY "Users can view their own profile"
            ON profiles
            FOR SELECT
            USING (auth.uid() = id);
          END IF;
          
          IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'Users can update their own profile') THEN
            CREATE POLICY "Users can update their own profile"
            ON profiles
            FOR UPDATE
            USING (auth.uid() = id)
            WITH CHECK (auth.uid() = id);
          END IF;
          
          IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'Users can insert their own profile') THEN
            CREATE POLICY "Users can insert their own profile"
            ON profiles
            FOR INSERT
            WITH CHECK (auth.uid() = id);
          END IF;
          
          -- Admin access policies
          IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'Admins can view all profiles') THEN  
            CREATE POLICY "Admins can view all profiles"
            ON profiles
            FOR SELECT
            USING (is_admin_safe() OR auth.uid() = id);
          END IF;
          
          IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'Admins can update all profiles') THEN
            CREATE POLICY "Admins can update all profiles"
            ON profiles
            FOR UPDATE
            USING (is_admin_safe() OR auth.uid() = id)
            WITH CHECK (is_admin_safe() OR auth.uid() = id);
          END IF;
        END
        $$;
        
        COMMIT;
      `
    });
    
    if (error) {
      console.error('Error executing SQL:', error);
      throw error;
    }
    
    // Check if we can query profiles without issues
    const { data, error: queryError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .limit(10);
      
    if (queryError) {
      throw queryError;
    }
    
    return NextResponse.json({
      success: true,
      message: `RLS policies fixed successfully. Can now query ${data.length} profiles.`
    });
    
  } catch (error: any) {
    console.error('Error fixing RLS policies:', error);
    
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
} 