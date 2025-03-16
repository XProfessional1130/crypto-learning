# Ghost to Application Migration Guide

This guide outlines the process of migrating members from Ghost to your new application while preserving their Stripe subscriptions.

## Overview

The migration involves several key steps:
1. Export member data from Ghost
2. Set up the migration environment
3. Run the migration script
4. Communicate with members
5. Test and monitor

## Prerequisites

- Administrative access to your Ghost installation
- Stripe API keys with read/write access
- Supabase service role key
- Node.js v14 or later
- npm or yarn

## 1. Preparation

### 1.1. Export Members from Ghost

1. Log in to your Ghost Admin panel
2. Go to Members > Export
3. Select all the relevant fields (make sure email is included)
4. Export as CSV
5. Save the CSV file to `/data/ghost-members.csv` in your project directory

### 1.2. Install Dependencies

```bash
npm install csv-parser stripe @supabase/supabase-js dotenv
```

### 1.3. Configure Environment Variables

Create a `.env` file with the following variables:

```
STRIPE_SECRET_KEY=sk_live_...
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJh...
```

## 2. Migration Process

### 2.1. Prepare Your Database

Ensure your Supabase database has the necessary tables, particularly the `subscriptions` table as defined in your application.

### 2.2. Test on a Small Sample

Before running the full migration:

1. Create a smaller CSV file with just a few members (3-5 is ideal)
2. Run the migration script on this sample
3. Verify that users and subscriptions are created correctly

```bash
# Test with a small sample
cp data/ghost-members.csv data/ghost-members-sample.csv
# Edit the sample file to just include a few members
# Update the CSV_FILE_PATH in the script to point to sample file
node scripts/migrate-ghost-members.js
```

### 2.3. Run the Full Migration

When you're confident in the process:

```bash
# Run the full migration
node scripts/migrate-ghost-members.js
```

The script:
1. Reads member data from the CSV file
2. For each member, checks if they have a Stripe customer account
3. Finds their active subscriptions
4. Creates a new user in your application
5. Links the Stripe subscription to the new user
6. Sends an email with a magic link to set a password

## 3. Post-Migration Tasks

### 3.1. Notify Members

After migration is complete, send a bulk email to all members explaining:
- The migration to a new platform
- How to log in (using the magic link they've received)
- That their subscription details remain unchanged
- Who to contact if they have issues

### 3.2. Update DNS and Redirects

Set up redirects from your Ghost site to the new application, particularly for:
- Article pages
- Member login pages
- Subscription management pages

### 3.3. Monitor and Support

1. Set up monitoring for login attempts and subscription access
2. Have a support team ready to assist with login issues
3. Create a FAQ document for common questions

## 4. Troubleshooting

### Common Issues

#### No Stripe Customer Found
If members don't have a corresponding Stripe customer, check that the email in Ghost matches the email in Stripe.

#### Failed User Creation
If Supabase user creation fails, check if:
- The email is already in use in Supabase
- The password meets complexity requirements
- Your service role key has proper permissions

#### Magic Link Issues
If magic links don't work:
- Verify that your Supabase authentication settings are configured correctly
- Check that email delivery is working properly
- Ensure links haven't expired

## 5. Technical Details

### Database Structure

The migration script assumes your `subscriptions` table has the following structure:

```sql
create table public.subscriptions (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id),
  stripe_customer_id text,
  stripe_subscription_id text unique,
  plan_id text,
  status text,
  price_id text,
  quantity integer,
  current_period_start timestamp with time zone,
  current_period_end timestamp with time zone,
  cancel_at_period_end boolean,
  metadata jsonb,
  customer_email text,
  created_at timestamp with time zone default now()
);
```

### Stripe Webhook Handling

After migration, ensure your webhooks are properly set up to handle subscription updates:

1. Verify webhook endpoints are pointing to your new application
2. Test the webhook delivery with Stripe CLI
3. Monitor webhook events during the transition period

## 6. Rollback Plan

In case of major issues:

1. Preserve access to the Ghost site
2. Disable login to the new application
3. Revert DNS changes if necessary
4. Communicate issues transparently with members

---

**Important:** Always backup your data before beginning the migration. Run the migration in a staging environment first if possible.

If you encounter any issues that aren't covered in this guide, please contact our development team. 