import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client using service role for admin access
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

// FOR TESTING ONLY - DO NOT USE IN PRODUCTION
export async function GET(req: NextRequest) {
  console.log('🔍 Testing subscription processing');
  
  try {
    // Get subscription ID from URL
    const url = new URL(req.url);
    const subscriptionId = url.searchParams.get('subscription_id');
    
    if (!subscriptionId) {
      return NextResponse.json({ error: 'Please provide a subscription_id parameter' }, { status: 400 });
    }
    
    // Retrieve the subscription
    const subscription = await stripe.subscriptions.retrieve(subscriptionId, {
      expand: ['customer']
    });
    
    if (!subscription) {
      return NextResponse.json({ error: 'Subscription not found' }, { status: 404 });
    }
    
    console.log('✅ Retrieved subscription:', {
      id: subscription.id,
      status: subscription.status,
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
    });
    
    // Get customer information
    if (!subscription.customer) {
      return NextResponse.json({ error: 'No customer found on subscription' }, { status: 400 });
    }
    
    const customer = typeof subscription.customer === 'string' 
      ? await stripe.customers.retrieve(subscription.customer)
      : subscription.customer;
      
    const customerEmail = 'email' in customer ? customer.email : null;
    const customerId = typeof subscription.customer === 'string' ? subscription.customer : subscription.customer.id;
    
    console.log('✅ Retrieved customer:', {
      id: customerId,
      email: customerEmail,
    });
    
    // Check if we have a userId in metadata
    let userId = subscription.metadata?.userId;
    
    // If no userId, check if user exists with this email
    if (!userId && customerEmail) {
      // Look for existing user with this email
      const { data: existingUser } = await supabaseAdmin
        .from('profiles')
        .select('id')
        .eq('email', customerEmail)
        .maybeSingle();
        
      if (existingUser) {
        // Use existing user ID
        userId = existingUser.id;
      }
    }
    
    // Create subscription data
    const subscriptionData: any = {
      stripe_customer_id: customerId,
      stripe_subscription_id: subscription.id,
      plan_id: subscription.metadata?.planId || 'unknown',
      status: subscription.status,
      price_id: subscription.items.data[0].price.id,
      quantity: subscription.items.data[0].quantity,
      current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      cancel_at_period_end: subscription.cancel_at_period_end,
      metadata: subscription.metadata,
      customer_email: customerEmail, // Always store email for reference
    };
    
    // Add user_id if available
    if (userId) {
      subscriptionData.user_id = userId;
    }
    
    console.log('📝 Saving subscription data:', {
      ...subscriptionData,
      metadata: '[REDACTED]',
    });
    
    // Check existing subscriptions
    const { data: existingSubscriptions } = await supabaseAdmin
      .from('subscriptions')
      .select('*')
      .eq('stripe_subscription_id', subscription.id);
    
    console.log(`Found ${existingSubscriptions?.length || 0} existing subscriptions with this ID`);
    
    // Save subscription to database
    const { error } = await supabaseAdmin
      .from('subscriptions')
      .upsert(subscriptionData, {
        onConflict: 'stripe_subscription_id',
      });
    
    if (error) {
      console.error('❌ Database error:', error);
      return NextResponse.json({ error: `Database error: ${error.message}` }, { status: 500 });
    }
    
    // Check if the insert was successful
    const { data: confirmedSubscription, error: confirmError } = await supabaseAdmin
      .from('subscriptions')
      .select('*')
      .eq('stripe_subscription_id', subscription.id)
      .single();
    
    if (confirmError) {
      console.error('❌ Could not confirm subscription was saved:', confirmError);
    } else {
      console.log('✅ Confirmed subscription was saved with ID:', confirmedSubscription.id);
    }
    
    return NextResponse.json({
      success: true,
      message: 'Subscription saved successfully',
      subscription: confirmedSubscription || 'Could not confirm',
    });
    
  } catch (error) {
    console.error('❌ Error in test subscription handler:', error);
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
} 