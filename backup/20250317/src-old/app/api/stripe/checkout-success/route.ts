import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import Stripe from 'stripe';

// Initialize Supabase client using service role for admin access
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

// Define the site URL for redirects - allowing us to work with the correct environment
const getSiteUrl = () => {
  const url = process.env.NEXT_PUBLIC_SITE_URL 
    || (process.env.NEXT_PUBLIC_VERCEL_URL ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}` : '')
    || 'http://localhost:3000';
  
  console.log(`🔧 Environment variables:`);
  console.log(`  NEXT_PUBLIC_SITE_URL: ${process.env.NEXT_PUBLIC_SITE_URL || 'not set'}`);
  console.log(`  NEXT_PUBLIC_VERCEL_URL: ${process.env.NEXT_PUBLIC_VERCEL_URL || 'not set'}`);
  console.log(`  Using site URL: ${url}`);
  
  return url;
};

export async function GET(req: NextRequest) {
  try {
    // Get the session ID from the URL
    const url = new URL(req.url);
    const sessionId = url.searchParams.get('session_id');
    
    // Get the current environment URL
    const siteUrl = getSiteUrl();
    console.log(`🌐 Current environment URL: ${siteUrl}`);
    
    if (!sessionId) {
      return NextResponse.redirect(`${siteUrl}/membership?error=missing_session_id`);
    }
    
    // Retrieve the checkout session from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['customer', 'subscription']
    });
    
    // Safety check
    if (!session) {
      return NextResponse.redirect(`${siteUrl}/membership?error=invalid_session`);
    }
    
    // Get customer email
    let customerEmail = '';
    if (session.customer && typeof session.customer !== 'string') {
      // Cast to Stripe.Customer to access email property
      const customer = session.customer as Stripe.Customer;
      customerEmail = customer.email || '';
    }
    
    if (!customerEmail) {
      return NextResponse.redirect(`${siteUrl}/membership?error=missing_customer_email`);
    }
    
    // Check if we already have this user in auth.users
    const { data: existingUsers, error: userError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (userError) {
      console.error('Error listing users:', userError);
      return NextResponse.redirect(`${siteUrl}/membership?error=database_error`);
    }
    
    // Find a user with matching email
    const existingUser = existingUsers.users.find(user => 
      user.email?.toLowerCase() === customerEmail.toLowerCase()
    );
    
    let userId = '';
    
    if (existingUser) {
      // Use the existing user's ID
      userId = existingUser.id;
    } else {
      // Create a new user account with the email from Stripe
      // Generate a secure random password
      const password = Math.random().toString(36).slice(-10) + Math.random().toString(36).slice(-10);
      
      // Create the user
      const { data: newUser, error: createUserError } = await supabaseAdmin.auth.admin.createUser({
        email: customerEmail,
        password,
        email_confirm: true, // Auto-confirm email
      });
      
      if (createUserError || !newUser.user) {
        console.error('Failed to create user:', createUserError);
        return NextResponse.redirect(`${siteUrl}/membership?error=user_creation_failed`);
      }
      
      userId = newUser.user.id;
    }
    
    // Check if we have a subscription record already
    if (session.subscription) {
      const subscriptionId = typeof session.subscription === 'string' 
        ? session.subscription 
        : session.subscription.id;
      
      // Get customer ID
      let customerId = '';
      if (session.customer) {
        customerId = typeof session.customer === 'string' 
          ? session.customer 
          : session.customer.id;
      }
      
      if (customerId) {
        // Force an update to the subscription in our database to ensure it's linked to this user
        await supabaseAdmin
          .from('subscriptions')
          .upsert({
            user_id: userId,
            stripe_subscription_id: subscriptionId,
            stripe_customer_id: customerId,
            customer_email: customerEmail,
            status: typeof session.subscription === 'string' ? 'active' : session.subscription.status,
            plan_id: session.metadata?.planId || 'monthly',
          }, {
            onConflict: 'stripe_subscription_id'
          });
      }
    }
    
    // Create a direct sign-in link for the user
    const { data: signInData, error: signInError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'magiclink',
      email: customerEmail,
      options: {
        redirectTo: `${siteUrl}/dashboard?checkout=success`,
      }
    });
    
    if (signInError) {
      console.error('Failed to create sign-in link:', signInError);
      return NextResponse.redirect(`${siteUrl}/membership?error=login_failed`);
    }
    
    // Check for the action link in the properties
    if (signInData?.properties?.action_link) {
      // Get and log the original action link for debugging
      const originalLink = signInData.properties.action_link;
      console.log(`🔗 Original magic link: ${originalLink}`);
      
      // Force the URL to use the environment-specific URL
      const signInUrl = new URL(originalLink);
      
      // Make sure the redirect_to parameter is using the correct site URL
      const redirectParam = signInUrl.searchParams.get('redirect_to');
      if (redirectParam) {
        try {
          console.log(`🔄 Original redirect_to: ${redirectParam}`);
          
          const redirectUrl = new URL(redirectParam);
          const newRedirectUrl = new URL(redirectUrl.pathname + redirectUrl.search + redirectUrl.hash, siteUrl);
          
          console.log(`🔄 New redirect_to: ${newRedirectUrl.toString()}`);
          signInUrl.searchParams.set('redirect_to', newRedirectUrl.toString());
        } catch (e) {
          console.error('❌ Error modifying redirect URL:', e);
        }
      }
      
      const finalLink = signInUrl.toString();
      console.log(`🔗 Final magic link: ${finalLink}`);
      return NextResponse.redirect(finalLink);
    }
    
    // Fallback redirect if sign-in link generation fails
    return NextResponse.redirect(`${siteUrl}/dashboard?checkout=success`);
  } catch (error) {
    console.error('Error handling checkout success:', error);
    const siteUrl = getSiteUrl();
    return NextResponse.redirect(`${siteUrl}/membership?error=unknown`);
  }
} 