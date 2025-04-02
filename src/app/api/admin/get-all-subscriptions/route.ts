import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    // Create admin client with service role that bypasses RLS
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || ''
    );
    
    // Fetch all subscriptions
    const { data, error } = await supabaseAdmin
      .from('subscriptions')
      .select('*');
    
    if (error) {
      throw error;
    }
    
    return NextResponse.json({
      success: true,
      data: data
    });
    
  } catch (error: any) {
    console.error('Error fetching all subscriptions:', error);
    
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
} 