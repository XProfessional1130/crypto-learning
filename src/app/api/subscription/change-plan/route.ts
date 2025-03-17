import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { stripe } from '@/lib/api/stripe';
import { STRIPE_PRICE_IDS } from '@/lib/api/stripe';

// Initialize Supabase client using service role for admin access
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export async function POST(req: NextRequest) {
  try {
    // Get the subscription ID and new plan from the request body
    const body = await req.json();
    const { subscriptionId, newPlanId } = body;
    
    if (!subscriptionId) {
      return NextResponse.json(
        { error: 'Subscription ID is required' },
        { status: 400 }
      );
    }
    
    if (!newPlanId || !['monthly', 'yearly'].includes(newPlanId)) {
      return NextResponse.json(
        { error: 'Valid new plan ID is required (monthly or yearly)' },
        { status: 400 }
      );
    }
    
    // Properly type the plan ID as a key of STRIPE_PRICE_IDS
    const typedPlanId = newPlanId as keyof typeof STRIPE_PRICE_IDS;
    
    // Get the price ID for the new plan
    const newPriceId = STRIPE_PRICE_IDS[typedPlanId];
    
    if (!newPriceId) {
      return NextResponse.json(
        { error: 'Could not determine price ID for the new plan' },
        { status: 400 }
      );
    }
    
    // First, query our database to get the Stripe subscription ID
    const { data: subscriptions, error: queryError } = await supabaseAdmin
      .from('subscriptions')
      .select('stripe_subscription_id, plan_id')
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
    
    const subscription = subscriptions[0];
    const stripeSubscriptionId = subscription.stripe_subscription_id;
    
    if (!stripeSubscriptionId) {
      return NextResponse.json(
        { error: 'No Stripe subscription ID found' },
        { status: 400 }
      );
    }
    
    // If the current plan is the same as the new plan, return early
    if (subscription.plan_id === newPlanId) {
      return NextResponse.json({
        success: true,
        message: 'Subscription is already on this plan',
        planId: newPlanId,
      });
    }
    
    // Retrieve the Stripe subscription to get the item ID
    const stripeSubscription = await stripe.subscriptions.retrieve(stripeSubscriptionId);
    const subscriptionItemId = stripeSubscription.items.data[0].id;
    
    // Update the subscription in Stripe with the new price
    const updatedSubscription = await stripe.subscriptions.update(
      stripeSubscriptionId,
      {
        items: [
          {
            id: subscriptionItemId,
            price: newPriceId,
          },
        ],
        // Prorate the charges if upgrading from monthly to yearly
        proration_behavior: 'create_prorations',
        // Make changes effective immediately
        billing_cycle_anchor: 'now',
        metadata: {
          planId: newPlanId,
        },
      }
    );
    
    // Update our database
    const { error: updateError } = await supabaseAdmin
      .from('subscriptions')
      .update({
        plan_id: newPlanId,
        price_id: newPriceId,
        current_period_start: new Date(updatedSubscription.current_period_start * 1000).toISOString(),
        current_period_end: new Date(updatedSubscription.current_period_end * 1000).toISOString(),
        status: updatedSubscription.status,
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
      message: `Subscription updated to ${newPlanId} plan`,
      planId: newPlanId,
      currentPeriodStart: new Date(updatedSubscription.current_period_start * 1000).toISOString(),
      currentPeriodEnd: new Date(updatedSubscription.current_period_end * 1000).toISOString(),
    });
  } catch (error) {
    console.error('Error changing subscription plan:', error);
    return NextResponse.json(
      { error: 'An error occurred while changing the subscription plan' },
      { status: 500 }
    );
  }
} 