# Stripe Subscription Setup

How to set up Stripe subscriptions in the LC Platform.

## Prerequisites

- Stripe account (test mode for development)
- Supabase account with database access

## Environment Setup

Add to `.env.local`:

```
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret
NEXT_PUBLIC_STRIPE_PRICE_ID_MONTHLY=your_monthly_price_id
NEXT_PUBLIC_STRIPE_PRICE_ID_YEARLY=your_yearly_price_id
```

## Stripe Configuration

1. **Create Products**
   - Log in to Stripe dashboard
   - Products → Create product
   - Create Monthly ($29.99/month) and Annual ($299.99/year)
   - Copy Price IDs to environment variables

2. **Set Up Webhooks**
   - Developers → Webhooks
   - Add endpoint: `https://your-domain.com/api/stripe/webhook`
   - Events to track:
     - `checkout.session.completed`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
     - `invoice.payment_succeeded`
   - Copy signing secret to environment variables

## Database Setup

Apply migration for subscriptions table:

```bash
cd supabase
psql -d your_database_name -f migrations/20240610000001_create_subscriptions_table.sql
```

Or run SQL in Supabase SQL editor.

## Testing

1. Start server: `npm run dev`
2. Go to membership signup page
3. Select plan and proceed with payment
4. Test cards:
   - Success: `4242 4242 4242 4242`
   - Failure: `4000 0000 0000 0002`

## Local Webhook Testing

1. Install Stripe CLI
2. Login: `stripe login`
3. Forward events:
   ```bash
   stripe listen --forward-to localhost:3000/api/stripe/webhook
   ```
4. Use provided webhook secret for testing

## Deployment

1. Set all environment variables in production
2. Update webhook URL in Stripe dashboard
3. Generate new webhook secret for production

## Code Structure

- `/lib/stripe.ts` - Client and helpers
- `/app/api/stripe/create-checkout-session/route.ts` - Creates sessions
- `/app/api/stripe/webhook/route.ts` - Webhook handlers
- `/app/api/stripe/manage-subscription/route.ts` - Subscription management
- `/lib/hooks/useSubscription.ts` - Subscription hook
- `/app/components/dashboard/SubscriptionStatus.tsx` - Status display
- `/app/components/membership/MembershipPlanModal.tsx` - Plan selection
- `/supabase/migrations/20240610000001_create_subscriptions_table.sql` - Schema

## Subscription Flow

1. User selects plan
2. System creates checkout session
3. User completes payment on Stripe
4. Webhook creates subscription record
5. User returns to dashboard
6. Status shows subscription details
7. User can manage via Customer Portal 