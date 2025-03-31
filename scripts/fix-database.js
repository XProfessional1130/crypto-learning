#!/usr/bin/env node
require('dotenv').config({ path: '.env.local' });
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Hardcode credentials temporarily for immediate execution
const supabaseUrl = 'https://yajkpjgfkfencejznfyl.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlhamtwamdma2ZlbmNlanpuZnlsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MTAyNTk3OCwiZXhwIjoyMDU2NjAxOTc4fQ.fRZMTJz5kp_wFUtckLXF0hgQ_CQdFyKTqbC8XTDGRKY';

// Create Supabase client with admin privileges
const supabaseAdmin = createClient(
  supabaseUrl,
  supabaseServiceKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

async function main() {
  try {
    console.log('🔧 Starting database fix...');
    
    // Read the SQL fix script
    const fixScript = fs.readFileSync(
      path.join(__dirname, '../supabase/migrations/20240701000000_fix_database_conflicts.sql'),
      'utf8'
    );
    
    // Execute the script
    console.log('💾 Applying database fixes...');
    
    // Check if pgrest_sql function is available
    const { data: functionExists, error: functionCheckError } = await supabaseAdmin.rpc(
      'pgrest_sql', 
      { query: "SELECT 1 FROM pg_proc WHERE proname = 'pgrest_sql'" }
    );
    
    if (functionCheckError) {
      console.log('⚠️ Checking for pgrest_sql function failed. Attempting direct execution...');
      
      // Use the Supabase REST API for SQL queries directly
      const { error } = await supabaseAdmin.rpc('pgrest_sql', { query: fixScript });
      
      if (error) {
        // If pgrest_sql is not available, provide instructions
        console.error('❌ Error executing SQL:', error.message);
        console.log('\n🚨 The pgrest_sql function may not be enabled in your Supabase project.');
        console.log('To enable it, go to the SQL Editor in your Supabase dashboard and run:');
        console.log('  CREATE EXTENSION IF NOT EXISTS pgrest;');
        console.log('\nAlternatively, you can run the SQL script directly from the SQL Editor:');
        console.log('1. Copy the contents of supabase/migrations/20240701000000_fix_database_conflicts.sql');
        console.log('2. Paste into the Supabase SQL Editor');
        console.log('3. Run the script');
        process.exit(1);
      }
    } else {
      // pgrest_sql is available, execute the script
      const { error } = await supabaseAdmin.rpc('pgrest_sql', { query: fixScript });
      
      if (error) {
        console.error('❌ Error executing SQL:', error.message);
        process.exit(1);
      }
    }
    
    console.log('✅ Database fixes applied successfully!');
    
    // Verify key tables
    console.log('\n🔍 Verifying database structure...');
    
    // Check profiles table
    const { data: profiles, error: profilesError } = await supabaseAdmin
      .from('profiles')
      .select('count(*)', { count: 'exact' })
      .limit(1);
    
    if (profilesError) {
      console.error('❌ Profiles table check failed:', profilesError.message);
    } else {
      console.log(`✅ Profiles table exists with ${profiles[0].count} records`);
    }
    
    // Check subscriptions table
    const { data: subscriptions, error: subscriptionsError } = await supabaseAdmin
      .from('subscriptions')
      .select('count(*)', { count: 'exact' })
      .limit(1);
    
    if (subscriptionsError) {
      console.error('❌ Subscriptions table check failed:', subscriptionsError.message);
    } else {
      console.log(`✅ Subscriptions table exists with ${subscriptions[0].count} records`);
    }
    
    // Check auth users
    const { data: authUsers, error: authUsersError } = await supabaseAdmin.rpc(
      'pgrest_sql', 
      { query: "SELECT COUNT(*) FROM auth.users" }
    );
    
    if (authUsersError) {
      console.error('❌ Auth users check failed:', authUsersError.message);
    } else {
      console.log(`✅ Auth users table exists with ${authUsers[0].count} users`);
    }
    
    console.log('\n🎉 Database fix completed successfully!');
    
  } catch (error) {
    console.error('❌ Database fix failed:', error);
    process.exit(1);
  }
}

main(); 