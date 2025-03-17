import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { stripe } from '@/lib/stripe';

// Initialize Supabase client using service role for admin access
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const userId = url.searchParams.get('userId');
    const email = url.searchParams.get('email');

    // We require either userId or email
    if (!userId && !email) {
      return NextResponse.json(
        { error: 'Must provide either userId or email parameter' },
        { status: 400 }
      );
    }

    let query = supabaseAdmin.from('subscriptions').select('*');

    if (userId) {
      query = query.eq('user_id', userId);
    } else if (email) {
      query = query.eq('customer_email', email);
    }

    // Get the most recent subscription
    const { data: subscriptions, error } = await query.order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching subscription:', error);
      return NextResponse.json(
        { error: 'Database error' },
        { status: 500 }
      );
    }

    // If no subscriptions found
    if (!subscriptions || subscriptions.length === 0) {
      return NextResponse.json(
        { 
          hasActiveSubscription: false,
          message: 'No subscription found' 
        }
      );
    }

    const subscription = subscriptions[0];
    
    // Check if we should get the latest details from Stripe
    const refreshStripe = url.searchParams.get('refresh') === 'true';
    
    if (refreshStripe && subscription.stripe_subscription_id) {
      try {
        // Get the latest subscription details from Stripe
        const stripeSubscription = await stripe.subscriptions.retrieve(subscription.stripe_subscription_id);
        
        // Update our database with the latest status
        await supabaseAdmin
          .from('subscriptions')
          .update({
            status: stripeSubscription.status,
            current_period_start: new Date(stripeSubscription.current_period_start * 1000).toISOString(),
            current_period_end: new Date(stripeSubscription.current_period_end * 1000).toISOString(),
            cancel_at_period_end: stripeSubscription.cancel_at_period_end,
          })
          .eq('id', subscription.id);
          
        // Update our local copy for the response
        subscription.status = stripeSubscription.status;
        subscription.current_period_start = new Date(stripeSubscription.current_period_start * 1000).toISOString();
        subscription.current_period_end = new Date(stripeSubscription.current_period_end * 1000).toISOString();
        subscription.cancel_at_period_end = stripeSubscription.cancel_at_period_end;
      } catch (stripeError) {
        console.error('Error fetching subscription from Stripe:', stripeError);
        // We'll continue with the data we have in our database
      }
    }

    // Check if the subscription is active
    const isActive = ['active', 'trialing'].includes(subscription.status);
    
    return NextResponse.json({
      hasActiveSubscription: isActive,
      subscription: {
        id: subscription.id,
        stripeSubscriptionId: subscription.stripe_subscription_id,
        stripeCustomerId: subscription.stripe_customer_id,
        status: subscription.status,
        planId: subscription.plan_id,
        currentPeriodStart: subscription.current_period_start,
        currentPeriodEnd: subscription.current_period_end,
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
        customerEmail: subscription.customer_email,
        userId: subscription.user_id,
      }
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Unexpected error occurred' },
      { status: 500 }
    );
  }
} 