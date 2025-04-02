import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    // Parse request body to get user ID
    const body = await req.json();
    const { userId } = body;
    
    if (!userId) {
      return NextResponse.json({
        success: false,
        error: 'User ID is required'
      }, { status: 400 });
    }
    
    // Create admin client with service role that bypasses RLS
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || ''
    );
    
    // First delete any subscriptions related to this user
    const { error: subscriptionDeleteError } = await supabaseAdmin
      .from('subscriptions')
      .delete()
      .eq('user_id', userId);
    
    if (subscriptionDeleteError) {
      console.error('Error deleting subscriptions:', subscriptionDeleteError);
      // Continue with other deletions even if subscription deletion fails
    }
    
    // Then delete from profiles table
    const { error: profileDeleteError } = await supabaseAdmin
      .from('profiles')
      .delete()
      .eq('id', userId);
    
    if (profileDeleteError) {
      throw profileDeleteError;
    }
    
    // Finally delete the user from auth.users
    const { error: authDeleteError } = await supabaseAdmin.auth.admin.deleteUser(userId);
    
    if (authDeleteError) {
      throw authDeleteError;
    }
    
    return NextResponse.json({
      success: true,
      message: 'User deleted successfully'
    });
    
  } catch (error: any) {
    console.error('Error deleting user:', error);
    
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
} 