import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client using service role for admin access
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

// FOR TESTING ONLY - DO NOT USE IN PRODUCTION
export async function GET(req: NextRequest) {
  try {
    // Check for a valid admin API key for security
    const url = new URL(req.url);
    const apiKey = url.searchParams.get('api_key');
    
    if (apiKey !== process.env.ADMIN_API_KEY) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get email parameter from URL
    const email = url.searchParams.get('email');
    
    if (!email) {
      return NextResponse.json({ error: 'Please provide an email parameter' }, { status: 400 });
    }
    
    // Check if user exists with this email in auth.users
    const { data: authUsers, error: authError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (authError) {
      return NextResponse.json({ error: `Auth error: ${authError.message}` }, { status: 500 });
    }
    
    // Find user with this email
    const existingUser = authUsers.users.find(user => 
      user.email?.toLowerCase() === email.toLowerCase()
    );
    
    if (!existingUser) {
      return NextResponse.json({ error: `No user found with email: ${email}` }, { status: 404 });
    }
    
    // Create a subscription record
    const now = new Date();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + 1); // One month from now
    
    const subscriptionData = {
      user_id: existingUser.id,
      stripe_customer_id: 'manual_' + existingUser.id,
      stripe_subscription_id: 'manual_sub_' + Date.now(),
      plan_id: 'monthly',
      status: 'active',
      price_id: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_MONTHLY,
      quantity: 1,
      current_period_start: now.toISOString(),
      current_period_end: endDate.toISOString(),
      cancel_at_period_end: false,
      metadata: { manual: true },
      customer_email: email,
    };
    
    // Check if subscription already exists for this user
    const { data: existingSubscription } = await supabaseAdmin
      .from('subscriptions')
      .select('*')
      .eq('user_id', existingUser.id)
      .maybeSingle();
    
    if (existingSubscription) {
      return NextResponse.json({ 
        message: 'Subscription already exists for this user',
        subscription: existingSubscription
      });
    }
    
    // Save to database
    const { error, data } = await supabaseAdmin
      .from('subscriptions')
      .insert(subscriptionData);
    
    if (error) {
      console.error('❌ Database error:', error);
      return NextResponse.json({ error: `Database error: ${error.message}` }, { status: 500 });
    }
    
    return NextResponse.json({
      success: true,
      message: 'Subscription manually created successfully',
      user: {
        id: existingUser.id,
        email: existingUser.email
      },
      subscription: subscriptionData
    });
    
  } catch (error) {
    console.error('❌ Error in manual-create endpoint:', error);
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
} 