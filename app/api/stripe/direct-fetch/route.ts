import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client using service role for admin access
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

// FOR TESTING ONLY - DO NOT USE IN PRODUCTION
export async function GET(req: NextRequest) {
  try {
    // Initialize Stripe with the secret key
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
      apiVersion: '2025-02-24.acacia',
    });
    
    // Get subscription ID from URL
    const url = new URL(req.url);
    const subscriptionId = url.searchParams.get('subscription_id');
    
    if (!subscriptionId) {
      return NextResponse.json({ error: 'Please provide a subscription_id parameter' }, { status: 400 });
    }
    
    // Try to retrieve the subscription
    console.log(`🔍 Attempting to retrieve subscription: ${subscriptionId}`);
    
    try {
      const subscription = await stripe.subscriptions.retrieve(subscriptionId);
      
      console.log('✅ Successfully retrieved subscription data:', {
        id: subscription.id,
        status: subscription.status,
        customer: subscription.customer,
      });
      
      // Try to get customer data
      try {
        const customer = await stripe.customers.retrieve(subscription.customer as string);
        console.log('✅ Successfully retrieved customer data:', {
          id: typeof customer === 'string' ? customer : customer.id,
          email: 'email' in customer ? customer.email : null,
        });
        
        const customerEmail = 'email' in customer ? customer.email : null;
        
        // Try to save to database
        const subscriptionData = {
          stripe_customer_id: subscription.customer as string,
          stripe_subscription_id: subscription.id,
          plan_id: subscription.metadata?.planId || 'unknown',
          status: subscription.status,
          price_id: subscription.items.data[0].price.id,
          quantity: subscription.items.data[0].quantity,
          current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
          current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
          cancel_at_period_end: subscription.cancel_at_period_end,
          metadata: subscription.metadata,
          customer_email: customerEmail,
        };
        
        console.log('📝 Attempting to save subscription data to database');
        
        const { error, data } = await supabaseAdmin
          .from('subscriptions')
          .upsert(subscriptionData, {
            onConflict: 'stripe_subscription_id',
          });
        
        if (error) {
          console.error('❌ Database error:', error);
          return NextResponse.json({
            subscription: subscription,
            customer: customer,
            database_error: error.message
          });
        }
        
        return NextResponse.json({
          success: true,
          subscription: subscription,
          customer: customer,
          saved: true
        });
        
      } catch (customerError) {
        console.error('❌ Error retrieving customer:', customerError);
        return NextResponse.json({
          subscription: subscription,
          customer_error: customerError instanceof Error ? customerError.message : 'Unknown error'
        });
      }
      
    } catch (subscriptionError) {
      console.error('❌ Error retrieving subscription:', subscriptionError);
      return NextResponse.json({
        error: subscriptionError instanceof Error ? subscriptionError.message : 'Unknown error'
      }, { status: 500 });
    }
    
  } catch (error) {
    console.error('❌ General error:', error);
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
} 