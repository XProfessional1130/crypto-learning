import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { stripe } from '@/lib/api/stripe';

// Initialize Supabase client using service role for admin access
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export async function POST(req: NextRequest) {
  try {
    // Get the subscription ID from the request body
    const body = await req.json();
    const { subscriptionId, cancelImmediately = false } = body;
    
    if (!subscriptionId) {
      return NextResponse.json(
        { error: 'Subscription ID is required' },
        { status: 400 }
      );
    }
    
    // First, query our database to get the Stripe subscription ID
    const { data: subscriptions, error: queryError } = await supabaseAdmin
      .from('subscriptions')
      .select('stripe_subscription_id')
      .eq('id', subscriptionId)
      .limit(1);
    
    if (queryError) {
      console.error('Database error when fetching subscription:', queryError);
      return NextResponse.json(
        { error: 'Database error' },
        { status: 500 }
      );
    }
    
    if (!subscriptions || subscriptions.length === 0) {
      return NextResponse.json(
        { error: 'Subscription not found' },
        { status: 404 }
      );
    }
    
    const stripeSubscriptionId = subscriptions[0].stripe_subscription_id;
    
    if (!stripeSubscriptionId) {
      return NextResponse.json(
        { error: 'No Stripe subscription ID found' },
        { status: 400 }
      );
    }
    
    // Cancel the subscription in Stripe
    const canceledSubscription = await stripe.subscriptions.update(
      stripeSubscriptionId,
      {
        cancel_at_period_end: !cancelImmediately,
      }
    );
    
    // If canceling immediately, we need to cancel right away
    if (cancelImmediately) {
      await stripe.subscriptions.cancel(stripeSubscriptionId);
    }
    
    // Update our database
    const { error: updateError } = await supabaseAdmin
      .from('subscriptions')
      .update({
        cancel_at_period_end: !cancelImmediately,
        status: cancelImmediately ? 'canceled' : canceledSubscription.status,
      })
      .eq('id', subscriptionId);
    
    if (updateError) {
      console.error('Database error when updating subscription:', updateError);
      return NextResponse.json(
        { error: 'Database error when updating subscription' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      message: cancelImmediately 
        ? 'Subscription canceled immediately' 
        : 'Subscription will be canceled at the end of the billing period',
      canceledAt: cancelImmediately ? new Date().toISOString() : null,
      willCancelAt: !cancelImmediately ? new Date(canceledSubscription.current_period_end * 1000).toISOString() : null,
    });
  } catch (error) {
    console.error('Error canceling subscription:', error);
    return NextResponse.json(
      { error: 'An error occurred while canceling the subscription' },
      { status: 500 }
    );
  }
} 