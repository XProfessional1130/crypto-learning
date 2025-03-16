# Stripe Subscription Integration Setup

This document outlines how to set up and configure Stripe subscriptions in the LC Platform.

## Prerequisites

1. A Stripe account (sandbox/test mode is fine for development)
2. Supabase account with database access

## Environment Variables

Ensure your `.env.local` file contains the following variables:

```
# Stripe configuration
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret
NEXT_PUBLIC_STRIPE_PRICE_ID_MONTHLY=your_stripe_monthly_price_id
NEXT_PUBLIC_STRIPE_PRICE_ID_YEARLY=your_stripe_yearly_price_id
```

## Stripe Product & Price Setup

1. Log in to your Stripe dashboard
2. Go to Products → Create product
3. Create two products:
   - Monthly Subscription
   - Annual Subscription
4. For each product, add a recurring price:
   - Monthly: $29.99/month
   - Annual: $299.99/year
5. Note the Price IDs for both products and add them to your environment variables

## Stripe Webhook Setup

1. In the Stripe dashboard, go to Developers → Webhooks
2. Add an endpoint: `https://your-domain.com/api/stripe/webhook`
3. Select the following events to listen for:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
4. Save the endpoint, then grab the signing secret
5. Add the signing secret to your environment variables as `STRIPE_WEBHOOK_SECRET`

## Supabase Database Setup

1. Apply the migration to create the `subscriptions` table:
   ```bash
   cd supabase
   psql -d your_database_name -f migrations/20240610000001_create_subscriptions_table.sql
   ```

   Alternatively, you can run the SQL commands in the Supabase SQL editor.

## Testing the Integration

1. Start your development server
2. Navigate to the membership signup page
3. Select a plan and proceed with payment
4. Use Stripe test cards:
   - For successful payments: `4242 4242 4242 4242`
   - For declined payments: `4000 0000 0000 0002`

## Local Webhook Testing

For local testing of webhooks, you can use the Stripe CLI:

1. Install the [Stripe CLI](https://stripe.com/docs/stripe-cli)
2. Login to Stripe: `stripe login`
3. Forward events to your local webhook endpoint:
   ```bash
   stripe listen --forward-to localhost:3000/api/stripe/webhook
   ```
4. This will provide a webhook secret for local testing

## Deployment Considerations

1. When deploying, ensure all environment variables are properly set
2. Update the webhook endpoint URL in the Stripe dashboard to point to your production URL
3. Generate a new webhook signing secret for production

## File Structure

The stripe integration is spread across the following files:

- `/lib/stripe.ts` - Stripe client and helper functions
- `/app/api/stripe/create-checkout-session/route.ts` - Creates checkout sessions
- `/app/api/stripe/webhook/route.ts` - Handles webhook events
- `/app/api/stripe/manage-subscription/route.ts` - Manages existing subscriptions
- `/lib/hooks/useSubscription.ts` - React hook for subscription management
- `/lib/hooks/useAuth.ts` - Auth hook for user authentication
- `/app/components/dashboard/SubscriptionStatus.tsx` - Displays subscription status
- `/app/components/membership/MembershipPlanModal.tsx` - Modal for selecting plans
- `/supabase/migrations/20240610000001_create_subscriptions_table.sql` - Subscription table schema

## Subscription Lifecycle

1. User selects a plan and clicks "Subscribe"
2. Frontend creates a checkout session via API
3. User is redirected to Stripe Checkout
4. After payment, Stripe sends webhook event
5. Webhook handler creates/updates subscription record
6. User is redirected back to dashboard
7. SubscriptionStatus component shows current status
8. User can manage subscription via Customer Portal 