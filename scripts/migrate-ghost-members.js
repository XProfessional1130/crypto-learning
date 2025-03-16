/**
 * Ghost Members Migration Script
 * 
 * This script migrates members from Ghost to our application while preserving their Stripe subscriptions.
 * 
 * Prerequisites:
 * - Node.js 14+
 * - CSV export of Ghost members (with at least email addresses)
 * - Stripe API key with read access to customers and subscriptions
 * - Supabase service role key
 */

const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const Stripe = require('stripe');
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const crypto = require('crypto');

// Load environment variables
dotenv.config();

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Initialize Supabase with service role for admin access
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Configuration
const CSV_FILE_PATH = path.join(__dirname, '../data/ghost-members.csv');
const DEFAULT_PASSWORD_LENGTH = 12;
const BATCH_SIZE = 50;

/**
 * Generate a secure random password
 */
function generateRandomPassword(length = DEFAULT_PASSWORD_LENGTH) {
  return crypto.randomBytes(length).toString('hex').slice(0, length);
}

/**
 * Find a Stripe customer by email
 */
async function findStripeCustomerByEmail(email) {
  const customers = await stripe.customers.list({
    email: email,
    limit: 1
  });
  
  return customers.data.length > 0 ? customers.data[0] : null;
}

/**
 * Find active subscriptions for a Stripe customer
 */
async function findActiveSubscriptions(customerId) {
  const subscriptions = await stripe.subscriptions.list({
    customer: customerId,
    status: 'active'
  });
  
  return subscriptions.data;
}

/**
 * Create a user in Supabase
 */
async function createSupabaseUser(email, password) {
  const { data: user, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true, // Auto-confirm email
  });
  
  if (error) {
    console.error(`Error creating user ${email}:`, error);
    return null;
  }
  
  return user.user;
}

/**
 * Save subscription data to Supabase
 */
async function saveSubscriptionToSupabase(userId, subscription, customerEmail) {
  // Determine plan type (monthly/yearly) from price ID or metadata
  // This is an example - adjust based on your specific price IDs
  const priceId = subscription.items.data[0].price.id;
  const planId = priceId.includes('monthly') ? 'monthly' : 'yearly';
  
  const subscriptionData = {
    user_id: userId,
    stripe_customer_id: subscription.customer,
    stripe_subscription_id: subscription.id,
    plan_id: planId,
    status: subscription.status,
    price_id: priceId,
    quantity: subscription.items.data[0].quantity,
    current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
    current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
    cancel_at_period_end: subscription.cancel_at_period_end,
    metadata: subscription.metadata || {},
    customer_email: customerEmail
  };
  
  const { data, error } = await supabase
    .from('subscriptions')
    .upsert(subscriptionData, { onConflict: 'stripe_subscription_id' });
  
  if (error) {
    console.error(`Error saving subscription ${subscription.id}:`, error);
    return false;
  }
  
  return true;
}

/**
 * Send welcome email with password reset link
 */
async function sendWelcomeEmail(user) {
  // Use Supabase password reset flow to generate a link
  const { data, error } = await supabase.auth.admin.generateLink({
    type: 'magiclink',
    email: user.email,
  });
  
  if (error) {
    console.error(`Failed to generate magic link for ${user.email}:`, error);
    return false;
  }
  
  // In a real implementation, you would send this link via your email provider
  // For this script, we'll just log it
  console.log(`Magic link for ${user.email}: ${data?.link}`);
  
  // Example of email content:
  console.log(`
  Subject: Welcome to [Your App] - Your Account Has Been Created
  
  Hello,
  
  We've moved from Ghost to our new platform! Your membership has been transferred,
  and you can access all premium content with your new account.
  
  Please click this link to set your password and log in:
  ${data?.link}
  
  Your subscription details have been preserved, so you don't need to make any changes to continue enjoying our content.
  
  If you have any questions, please contact us at support@yourdomain.com.
  
  Thank you,
  [Your Name]
  `);
  
  return true;
}

/**
 * Process a single Ghost member
 */
async function processMember(member) {
  console.log(`\nProcessing member: ${member.email}`);
  
  try {
    // Step 1: Find Stripe customer by email
    const customer = await findStripeCustomerByEmail(member.email);
    
    if (!customer) {
      console.log(`No Stripe customer found for ${member.email}`);
      return { success: false, reason: 'no_stripe_customer' };
    }
    
    console.log(`Found Stripe customer: ${customer.id}`);
    
    // Step 2: Find active subscriptions
    const subscriptions = await findActiveSubscriptions(customer.id);
    
    if (subscriptions.length === 0) {
      console.log(`No active subscriptions found for ${member.email}`);
      return { success: false, reason: 'no_active_subscription' };
    }
    
    console.log(`Found ${subscriptions.length} active subscription(s)`);
    
    // Step 3: Create user in Supabase
    const password = generateRandomPassword();
    const user = await createSupabaseUser(member.email, password);
    
    if (!user) {
      return { success: false, reason: 'user_creation_failed' };
    }
    
    console.log(`Created user with ID: ${user.id}`);
    
    // Step 4: Save subscription data to Supabase
    for (const subscription of subscriptions) {
      const saved = await saveSubscriptionToSupabase(user.id, subscription, member.email);
      if (!saved) {
        console.error(`Failed to save subscription ${subscription.id}`);
      } else {
        console.log(`Saved subscription ${subscription.id} to database`);
      }
    }
    
    // Step 5: Send welcome email
    await sendWelcomeEmail(user);
    
    return { success: true, userId: user.id };
  } catch (error) {
    console.error(`Error processing member ${member.email}:`, error);
    return { success: false, reason: 'exception', error };
  }
}

/**
 * Process members in batches
 */
async function processMembersInBatches(members) {
  const results = {
    total: members.length,
    success: 0,
    failure: 0,
    reasons: {}
  };
  
  // Process in batches to avoid rate limits
  for (let i = 0; i < members.length; i += BATCH_SIZE) {
    const batch = members.slice(i, i + BATCH_SIZE);
    console.log(`\nProcessing batch ${Math.floor(i / BATCH_SIZE) + 1} (${batch.length} members)`);
    
    // Process each member in the batch
    const batchResults = await Promise.all(batch.map(processMember));
    
    // Update overall results
    batchResults.forEach(result => {
      if (result.success) {
        results.success++;
      } else {
        results.failure++;
        results.reasons[result.reason] = (results.reasons[result.reason] || 0) + 1;
      }
    });
    
    console.log(`Batch completed. Progress: ${i + batch.length}/${members.length}`);
    
    // Avoid hitting rate limits
    if (i + BATCH_SIZE < members.length) {
      console.log('Waiting 5 seconds before next batch...');
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }
  
  return results;
}

/**
 * Main function
 */
async function main() {
  console.log('Starting Ghost members migration...');
  
  // Load members from CSV
  const members = [];
  
  await new Promise((resolve, reject) => {
    fs.createReadStream(CSV_FILE_PATH)
      .pipe(csv())
      .on('data', (data) => members.push(data))
      .on('end', resolve)
      .on('error', reject);
  });
  
  console.log(`Loaded ${members.length} members from CSV`);
  
  // Process members
  const results = await processMembersInBatches(members);
  
  // Output results
  console.log('\n--- Migration Results ---');
  console.log(`Total members: ${results.total}`);
  console.log(`Successfully migrated: ${results.success}`);
  console.log(`Failed migrations: ${results.failure}`);
  console.log('Failure reasons:');
  Object.entries(results.reasons).forEach(([reason, count]) => {
    console.log(`  - ${reason}: ${count}`);
  });
}

// Run the script
main()
  .then(() => {
    console.log('\nMigration completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Migration failed with error:', error);
    process.exit(1);
  }); 