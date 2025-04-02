import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    // Create a Supabase client with the user's context
    const supabase = createRouteHandlerClient({ cookies });
    
    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Not authenticated', details: authError?.message || 'No user found' },
        { status: 401 }
      );
    }
    
    // Update the user's profile to have admin role
    const { data, error } = await supabase
      .from('profiles')
      .update({ role: 'admin' })
      .eq('id', user.id)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating profile to admin:', error);
      return NextResponse.json(
        { error: 'Failed to update user role', details: error.message },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      message: `User ${user.email} now has admin role`,
      user: data
    });
    
  } catch (err: any) {
    console.error('Error in promote-to-admin API:', err);
    return NextResponse.json(
      { error: 'Server error', details: err.message },
      { status: 500 }
    );
  }
} 