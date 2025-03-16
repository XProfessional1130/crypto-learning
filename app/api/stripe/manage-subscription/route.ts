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

// Helper to get a properly formatted site URL
function getSiteUrl() {
  // First, try to use NEXT_PUBLIC_SITE_URL environment variable
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 
                 (process.env.NEXT_PUBLIC_VERCEL_URL ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}` : null) || 
                 'http://localhost:3000';
  
  // Ensure URL has a scheme
  if (siteUrl.startsWith('http://') || siteUrl.startsWith('https://')) {
    return siteUrl;
  }
  
  // Add http:// scheme if missing (in production, you should use https://)
  return `http://${siteUrl}`;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, subscriptionId, userId } = body;
    
    if (!action || !subscriptionId || !userId) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }
    
    // Verify that the user has access to this subscription
    const { verified, subscription } = await verifyUserSubscriptionAccess(userId, subscriptionId);
    
    if (!verified) {
      return NextResponse.json(
        { error: 'Unauthorized access to subscription' },
        { status: 403 }
      );
    }
    
    // Handle different subscription management actions
    switch (action) {
      case 'cancel': {
        // Cancel at period end
        const updatedSubscription = await stripe.subscriptions.update(subscriptionId, {
          cancel_at_period_end: true,
        });
        
        // Update subscription in database
        await supabaseAdmin
          .from('subscriptions')
          .update({
            cancel_at_period_end: true,
          })
          .eq('stripe_subscription_id', subscriptionId);
          
        return NextResponse.json({
          success: true,
          message: `Subscription will be canceled at the end of the billing period (${new Date(updatedSubscription.current_period_end * 1000).toLocaleDateString()})`,
        });
      }
      
      case 'reactivate': {
        // Reactivate a subscription set to cancel
        const updatedSubscription = await stripe.subscriptions.update(subscriptionId, {
          cancel_at_period_end: false,
        });
        
        // Update subscription in database
        await supabaseAdmin
          .from('subscriptions')
          .update({
            cancel_at_period_end: false,
          })
          .eq('stripe_subscription_id', subscriptionId);
          
        return NextResponse.json({
          success: true,
          message: 'Subscription reactivated successfully',
        });
      }
      
      case 'immediate_cancel': {
        // Immediately cancel subscription
        await stripe.subscriptions.cancel(subscriptionId);
        
        // Update subscription in database
        await supabaseAdmin
          .from('subscriptions')
          .update({
            status: 'canceled',
          })
          .eq('stripe_subscription_id', subscriptionId);
          
        return NextResponse.json({
          success: true,
          message: 'Subscription canceled immediately',
        });
      }
      
      case 'customer_portal': {
        // Create a customer portal session for more detailed management
        if (!subscription.stripe_customer_id) {
          return NextResponse.json(
            { error: 'Customer ID not found' },
            { status: 400 }
          );
        }
        
        // Get properly formatted site URL with scheme
        const siteUrl = getSiteUrl();
        const returnUrl = `${siteUrl}/dashboard`;
        
        console.log(`Creating Stripe customer portal with return URL: ${returnUrl}`);
        
        const session = await stripe.billingPortal.sessions.create({
          customer: subscription.stripe_customer_id,
          return_url: returnUrl,
        });
        
        return NextResponse.json({ url: session.url });
      }
      
      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Error managing subscription:', error);
    return NextResponse.json(
      { error: 'Something went wrong' },
      { status: 500 }
    );
  }
} 