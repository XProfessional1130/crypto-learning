import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client using service role for admin access
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

// Helper to verify user has access to the subscription
async function verifyUserSubscriptionAccess(userId: string, subscriptionId: string) {
  const { data, error } = await supabaseAdmin
    .from('subscriptions')
    .select('*')
    .eq('user_id', userId)
    .eq('stripe_subscription_id', subscriptionId)
    .single();
    
  if (error || !data) {
    return { verified: false, subscription: null };
  }
  
  return { verified: true, subscription: data };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { subscriptionId, userId } = body;
    
    if (!subscriptionId || !userId) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }
    
    // Verify user has access to this subscription
    const { verified } = await verifyUserSubscriptionAccess(userId, subscriptionId);
    
    if (!verified) {
      return NextResponse.json(
        { error: 'Unauthorized access to subscription' },
        { status: 403 }
      );
    }
    
    console.log(`🔄 Syncing subscription ${subscriptionId} from Stripe...`);
    
    // Fetch latest subscription data from Stripe
    const stripeSubscription = await stripe.subscriptions.retrieve(subscriptionId);
    
    // Update subscription in database with latest data
    const { error } = await supabaseAdmin
      .from('subscriptions')
      .update({
        status: stripeSubscription.status,
        current_period_start: new Date(stripeSubscription.current_period_start * 1000).toISOString(),
        current_period_end: new Date(stripeSubscription.current_period_end * 1000).toISOString(),
        cancel_at_period_end: stripeSubscription.cancel_at_period_end,
      })
      .eq('stripe_subscription_id', subscriptionId);
    
    if (error) {
      console.error('❌ Error syncing subscription:', error);
      return NextResponse.json(
        { error: `Database error: ${error.message}` },
        { status: 500 }
      );
    }
    
    console.log('✅ Subscription synced successfully');
    
    return NextResponse.json({
      success: true,
      message: 'Subscription synced with Stripe',
      subscription: {
        id: stripeSubscription.id,
        status: stripeSubscription.status,
        cancel_at_period_end: stripeSubscription.cancel_at_period_end,
        current_period_start: new Date(stripeSubscription.current_period_start * 1000).toISOString(),
        current_period_end: new Date(stripeSubscription.current_period_end * 1000).toISOString(),
      }
    });
  } catch (error) {
    console.error('❌ Error in sync-subscription endpoint:', error);
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
} 