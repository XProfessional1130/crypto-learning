import { NextRequest, NextResponse } from 'next/server';
import { stripe, STRIPE_PRICE_IDS, formatAmountForStripe } from '@/lib/api/stripe';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';
import { cookies } from 'next/headers';

// Initialize Supabase client using service role for admin access
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

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
    // Get request body
    const body = await req.json();
    const { planId, userId, email } = body;

    if (!planId) {
      return NextResponse.json(
        { error: 'Missing plan ID' },
        { status: 400 }
      );
    }

    // Get the price ID based on the plan ID
    const priceId = STRIPE_PRICE_IDS[planId as keyof typeof STRIPE_PRICE_IDS];
    
    // Detailed validation of price ID
    if (!priceId) {
      console.error(`No price ID found for plan: ${planId}. Available price IDs:`, STRIPE_PRICE_IDS);
      return NextResponse.json(
        { error: `Invalid plan ID or missing price configuration for plan: ${planId}` },
        { status: 400 }
      );
    }
    
    if (!priceId.startsWith('price_')) {
      console.error(`Invalid price ID format for plan ${planId}: ${priceId}. Price IDs should start with "price_"`);
      return NextResponse.json(
        { error: 'Invalid price ID format. Please check your Stripe configuration.' },
        { status: 500 }
      );
    }

    // Check if the user is logged in
    let customerId: string | undefined;
    let userEmail: string | undefined = email; // Use provided email if available
    let loggedInUserId: string | undefined;

    // If userId is provided, the user is logged in
    if (userId) {
      loggedInUserId = userId;
      
      // Only get user data from Supabase if we don't have an email already
      if (!userEmail) {
        // Get user data from Supabase
        const { data: userData, error: userError } = await supabaseAdmin
          .from('profiles')
          .select('email')
          .eq('id', userId)
          .single();

        if (userData) {
          userEmail = userData.email;
        }
      }
      
      // Check if user already has a Stripe customer ID
      const { data: existingSubscription } = await supabaseAdmin
        .from('subscriptions')
        .select('stripe_customer_id')
        .eq('user_id', userId)
        .maybeSingle();

      customerId = existingSubscription?.stripe_customer_id;
    }

    // Get properly formatted site URL with scheme
    const siteUrl = getSiteUrl();

    // Prepare checkout session parameters
    const sessionParams: any = {
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${siteUrl}/api/stripe/checkout-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl}/membership?checkout=canceled`,
      metadata: {
        planId,
      },
      allow_promotion_codes: true,
      billing_address_collection: 'required',
    };

    // If we have a logged-in user with a customer ID, use it
    if (customerId) {
      sessionParams.customer = customerId;
    } 
    // If we have a user email but no customer ID
    else if (userEmail) {
      sessionParams.customer_email = userEmail;
    }

    // Add user ID to metadata if available
    if (loggedInUserId) {
      sessionParams.metadata.userId = loggedInUserId;
      
      if (sessionParams.subscription_data) {
        sessionParams.subscription_data.metadata = {
          ...sessionParams.subscription_data.metadata,
          userId: loggedInUserId,
        };
      } else {
        sessionParams.subscription_data = {
          metadata: {
            userId: loggedInUserId,
          },
        };
      }
    }

    console.log('Creating Stripe checkout session with params:', JSON.stringify({
      ...sessionParams,
      // Redact any sensitive information
      customer: sessionParams.customer ? '[REDACTED]' : undefined,
      customer_email: sessionParams.customer_email ? '[REDACTED]' : undefined,
      success_url: sessionParams.success_url,
      cancel_url: sessionParams.cancel_url,
    }, null, 2));

    // Create a new checkout session
    const session = await stripe.checkout.sessions.create(sessionParams);

    return NextResponse.json({ sessionId: session.id, url: session.url });
  } catch (error) {
    // Log detailed error information
    if (error instanceof Error) {
      console.error('Error creating checkout session:', {
        message: error.message,
        name: error.name,
        stack: error.stack,
      });
      
      // Handle Stripe-specific errors
      if ('type' in error && typeof error.type === 'string') {
        const stripeError = error as any;
        console.error('Stripe API error:', {
          type: stripeError.type,
          code: stripeError.code,
          param: stripeError.param,
          detail: stripeError.detail,
        });
        
        // Return more specific error message to the client
        return NextResponse.json(
          { error: `Stripe error: ${stripeError.message || 'Unknown Stripe error'}` },
          { status: 500 }
        );
      }
      
      return NextResponse.json(
        { error: `Error: ${error.message}` },
        { status: 500 }
      );
    }
    
    console.error('Unknown error creating checkout session:', error);
    return NextResponse.json(
      { error: 'Something went wrong' },
      { status: 500 }
    );
  }
} 