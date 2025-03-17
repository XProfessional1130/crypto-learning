import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/api/stripe';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

// Initialize Supabase client using service role for admin access
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

// This is your Stripe webhook secret for testing your endpoint locally.
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get('stripe-signature') as string;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      webhookSecret
    );
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    console.log(`❌ Error message: ${errorMessage}`);
    return NextResponse.json(
      { error: `Webhook Error: ${errorMessage}` },
      { status: 400 }
    );
  }

  // Successfully constructed event
  console.log(`✅ Webhook event received: ${event.type} - ID: ${event.id}`);

  // Handle the event
  switch (event.type) {
    case 'checkout.session.completed': {
      console.log('🔄 Processing checkout.session.completed event');
      const session = event.data.object as Stripe.Checkout.Session;
      
      // Extract metadata
      const planId = session.metadata?.planId || 'monthly';
      console.log(`📦 Metadata: ${JSON.stringify(session.metadata)}`);
      
      // Get subscription details from session
      if (session.subscription) {
        console.log(`🔄 Processing subscription: ${session.subscription}`);
        const subscriptionId = typeof session.subscription === 'string' 
          ? session.subscription 
          : session.subscription.id;
        
        // Retrieve detailed subscription data
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        console.log(`✅ Retrieved subscription details: ${subscription.status}`);
        
        // Get customer information
        const customerId = typeof session.customer === 'string' ? session.customer : session.customer?.id;
        if (!customerId) {
          console.error('❌ No customer ID in session');
          return NextResponse.json({ error: 'No customer found' }, { status: 400 });
        }
        
        const customer = await stripe.customers.retrieve(customerId) as Stripe.Customer;
        const customerEmail = customer.email;
        console.log(`📧 Customer email: ${customerEmail}`);
        
        // Check if we have a userId in metadata (logged-in user)
        let userId = session.metadata?.userId;
        console.log(`👤 User ID from metadata: ${userId || 'None'}`);
        
        // If no userId (guest checkout), check if user exists with this email
        if (!userId && customerEmail) {
          console.log(`🔍 Looking for existing user with email: ${customerEmail}`);
          
          // Look for existing user with this email directly in auth.users
          const { data: existingUsers, error: userError } = await supabaseAdmin.auth.admin.listUsers();
          
          if (userError) {
            console.error('❌ Error fetching users:', userError);
          } else {
            // Find a user with matching email
            const existingUser = existingUsers.users.find(user => 
              user.email?.toLowerCase() === customerEmail.toLowerCase()
            );
            
            if (existingUser) {
              // Use existing user ID
              userId = existingUser.id;
              console.log(`✅ Found existing user: ${userId}`);
            } else {
              // Create a new user
              console.log(`🆕 Creating new user for email: ${customerEmail}`);
              try {
                // Generate a random password
                const password = Math.random().toString(36).slice(-10);
                
                // Create auth user
                const { data: newUser, error: createUserError } = await supabaseAdmin.auth.admin.createUser({
                  email: customerEmail,
                  password,
                  email_confirm: true, // Auto-confirm email
                });
                
                if (createUserError || !newUser.user) {
                  throw createUserError || new Error('Failed to create user');
                }
                
                userId = newUser.user.id;
                console.log(`✅ Created new user: ${userId}`);
                
                // Send welcome email with password reset link (implement this separately)
                // This would allow the user to set their own password
              } catch (error) {
                console.error('❌ Error creating new user:', error);
                // Still save the subscription with the customer email as reference
              }
            }
          }
        }
        
        // Create or update subscription in database
        // If we couldn't create a user, just store the subscription with customer email
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
        
        console.log(`💾 Saving subscription data: ${JSON.stringify({
          ...subscriptionData,
          metadata: '[REDACTED]', // Don't log potentially sensitive metadata
        })}`);
        
        const { error } = await supabaseAdmin
          .from('subscriptions')
          .upsert(subscriptionData, { onConflict: 'stripe_subscription_id' });

        if (error) {
          console.error('❌ Error saving subscription to database:', error);
          return NextResponse.json({ error: 'Database error' }, { status: 500 });
        }
        
        console.log('✅ Subscription saved successfully');
      } else {
        console.log('⚠️ No subscription in checkout session');
      }
      break;
    }
    
    case 'invoice.payment_succeeded': {
      const invoice = event.data.object as Stripe.Invoice;
      
      if (invoice.subscription) {
        const subscriptionId = typeof invoice.subscription === 'string'
          ? invoice.subscription
          : invoice.subscription.id;
        
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        
        // Update subscription in database
        const { error } = await supabaseAdmin
          .from('subscriptions')
          .update({
            status: subscription.status,
            current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
            cancel_at_period_end: subscription.cancel_at_period_end,
          })
          .eq('stripe_subscription_id', subscriptionId);
        
        if (error) {
          console.error('❌ Error updating subscription after payment:', error);
          return NextResponse.json({ error: 'Database error' }, { status: 500 });
        }
      }
      break;
    }

    case 'customer.subscription.updated': {
      const subscription = event.data.object as Stripe.Subscription;
      
      console.log(`📝 Processing subscription update for ${subscription.id}`);
      console.log(`   Status: ${subscription.status}`);
      console.log(`   Cancel at period end: ${subscription.cancel_at_period_end}`);
      
      // Update subscription in database
      const { error } = await supabaseAdmin
        .from('subscriptions')
        .update({
          status: subscription.status,
          current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
          current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
          cancel_at_period_end: subscription.cancel_at_period_end,
        })
        .eq('stripe_subscription_id', subscription.id);
      
      if (error) {
        console.error('❌ Error updating subscription:', error);
        return NextResponse.json({ error: 'Database error' }, { status: 500 });
      }
      
      console.log('✅ Subscription updated successfully');
      break;
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription;
      
      // Update subscription to canceled in database
      const { error } = await supabaseAdmin
        .from('subscriptions')
        .update({
          status: 'canceled',
        })
        .eq('stripe_subscription_id', subscription.id);
      
      if (error) {
        console.error('❌ Error updating subscription to canceled:', error);
        return NextResponse.json({ error: 'Database error' }, { status: 500 });
      }
      break;
    }

    default:
      // Unexpected event type
      console.log(`Unhandled event type ${event.type}`);
  }

  // Return a 200 response to acknowledge receipt of the event
  return NextResponse.json({ received: true });
} 