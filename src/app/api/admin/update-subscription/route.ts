import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    // Get request body
    const body = await req.json();
    const { subscriptionId, ...updateData } = body;

    if (!subscriptionId) {
      return NextResponse.json({
        success: false,
        error: 'Subscription ID is required'
      }, { status: 400 });
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No update data provided'
      }, { status: 400 });
    }

    // Create admin client with service role that bypasses RLS
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || ''
    );
    
    // Update the subscription
    const { error: updateError } = await supabaseAdmin
      .from('subscriptions')
      .update(updateData)
      .eq('id', subscriptionId);
    
    if (updateError) {
      throw updateError;
    }
    
    // Fetch the updated subscription
    const { data, error: fetchError } = await supabaseAdmin
      .from('subscriptions')
      .select('*')
      .eq('id', subscriptionId)
      .single();
    
    if (fetchError) {
      throw fetchError;
    }
    
    return NextResponse.json({
      success: true,
      message: 'Subscription updated successfully',
      data: data
    });
    
  } catch (error: any) {
    console.error('Error updating subscription:', error);
    
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
} 