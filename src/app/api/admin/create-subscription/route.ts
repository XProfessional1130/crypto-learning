import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    // Get request body
    const body = await req.json();
    const { email, planId } = body;

    if (!email) {
      return NextResponse.json({
        success: false,
        error: 'Email is required'
      }, { status: 400 });
    }

    if (!planId) {
      return NextResponse.json({
        success: false,
        error: 'Plan ID is required'
      }, { status: 400 });
    }

    // Create admin client with service role that bypasses RLS
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || ''
    );
    
    // Find the user by email
    const { data: userData, error: userError } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('email', email.trim())
      .single();
    
    if (userError) {
      return NextResponse.json({
        success: false,
        error: 'User not found with the provided email'
      }, { status: 404 });
    }
    
    // Generate a random ID for the subscription
    const subscriptionId = `admin_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    
    // Create the subscription
    const { data: subscriptionData, error: subscriptionError } = await supabaseAdmin
      .from('subscriptions')
      .insert({
        user_id: userData.id,
        stripe_subscription_id: subscriptionId,
        plan_id: planId,
        status: 'active',
        customer_email: email.trim(),
        current_period_start: new Date().toISOString(),
        current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
        cancel_at_period_end: false,
        metadata: { source: 'admin_manual_creation' }
      })
      .select()
      .single();
    
    if (subscriptionError) {
      throw subscriptionError;
    }
    
    return NextResponse.json({
      success: true,
      message: 'Subscription created successfully',
      data: subscriptionData
    });
    
  } catch (error: any) {
    console.error('Error creating subscription:', error);
    
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
} 