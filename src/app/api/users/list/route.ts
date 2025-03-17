import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client using service role for admin access
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

// Mark route as dynamic to prevent static optimization issues
export const dynamic = 'force-dynamic';

// FOR TESTING ONLY - DO NOT USE IN PRODUCTION
export async function GET(req: NextRequest) {
  try {
    // Check for a valid admin API key for security
    const { searchParams } = req.nextUrl;
    const apiKey = searchParams.get('api_key');
    
    if (apiKey !== process.env.ADMIN_API_KEY) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get users from auth.users table
    const { data: authUsers, error: authError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (authError) {
      return NextResponse.json({ error: `Auth error: ${authError.message}` }, { status: 500 });
    }
    
    // Get users from profiles table
    const { data: profileUsers, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (profileError) {
      return NextResponse.json({ error: `Profile error: ${profileError.message}` }, { status: 500 });
    }
    
    return NextResponse.json({
      auth_users: authUsers.users.map(user => ({
        id: user.id,
        email: user.email,
        created_at: user.created_at,
        last_sign_in_at: user.last_sign_in_at
      })),
      profile_users: profileUsers
    });
    
  } catch (error) {
    console.error('❌ Error in users/list endpoint:', error);
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
} 