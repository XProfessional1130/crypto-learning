import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/api/stripe';
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
  console.log('🔍 Testing webhook handler with manual trigger');
  
  try {
    // Get session ID from URL if provided
    const { searchParams } = req.nextUrl;
    const sessionId = searchParams.get('session_id');
    const simulateCancel = searchParams.get('simulate_cancel') === 'true';
    
    if (!sessionId) {
      return NextResponse.json({ error: 'Please provide a session_id parameter' }, { status: 400 });
    }
    
    // Retrieve the checkout session
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['customer', 'subscription']
    });
    
    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }
    
    console.log('✅ Retrieved session:', {
      id: session.id,
      customer: session.customer ? (typeof session.customer === 'string' ? session.customer : session.customer.id) : null,
      subscription: session.subscription ? (typeof session.subscription === 'string' ? session.subscription : session.subscription.id) : null,
      metadata: session.metadata,
    });
    
    // Get subscription details
    if (!session.subscription) {
      return NextResponse.json({ error: 'No subscription in session' }, { status: 400 });
    }
    
    const subscriptionId = typeof session.subscription === 'string' 
      ? session.subscription 
      : session.subscription.id;
    
    // If simulating cancellation, update the subscription in Stripe
    if (simulateCancel) {
      console.log('🔄 Simulating cancellation from Stripe dashboard...');
      await stripe.subscriptions.update(subscriptionId, {
        cancel_at_period_end: true,
      });
      console.log('✅ Subscription marked to cancel at period end');
    }
    
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    
    console.log('✅ Retrieved subscription:', {
      id: subscription.id,
      status: subscription.status,
      cancel_at_period_end: subscription.cancel_at_period_end,
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
    });
    
    // Get customer information
    const customerId = typeof session.customer === 'string' ? session.customer : session.customer?.id;
    if (!customerId) {
      return NextResponse.json({ error: 'No customer found' }, { status: 400 });
    }
    
    const customer = await stripe.customers.retrieve(customerId);
    const customerEmail = 'email' in customer ? customer.email : null;
    
    console.log('✅ Retrieved customer:', {
      id: customerId,
      email: customerEmail,
    });
    
    // Save subscription to database
    const planId = session.metadata?.planId || 'unknown';
    
    // Check if we have a userId in metadata (logged-in user)
    let userId = session.metadata?.userId;
    
    // If no userId (guest checkout), check if user exists with this email
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
    
    // Create or update subscription in database
    const subscriptionData: any = {
      stripe_customer_id: customerId,
      stripe_subscription_id: subscriptionId,
      plan_id: planId,
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
      .eq('stripe_subscription_id', subscriptionId);
    
    console.log(`Found ${existingSubscriptions?.length || 0} existing subscriptions with this ID`);
    
    // Attempt to save or update subscription
    const { error, data } = await supabaseAdmin
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
      .eq('stripe_subscription_id', subscriptionId)
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
    console.error('❌ Error in test webhook handler:', error);
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
} 