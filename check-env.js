// Simple script to check if environment variables are set
require('dotenv').config({ path: '.env.local' });

console.log('\nChecking required environment variables:');

// Supabase
console.log('\n--- Supabase ---');
console.log('NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL || 'NOT SET');
console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'SET (value hidden)' : 'NOT SET');
console.log('SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'SET (value hidden)' : 'NOT SET');

// General setup
console.log('\n--- Site Configuration ---');
console.log('NEXT_PUBLIC_SITE_URL:', process.env.NEXT_PUBLIC_SITE_URL || 'NOT SET');
console.log('NEXT_PUBLIC_TEAM_ADMIN_EMAIL:', process.env.NEXT_PUBLIC_TEAM_ADMIN_EMAIL || 'NOT SET');

// Admin and Security
console.log('\n--- Admin & Security ---');
console.log('ADMIN_API_KEY:', process.env.ADMIN_API_KEY ? 'SET (value hidden)' : 'NOT SET');
console.log('CRON_SECRET:', process.env.CRON_SECRET ? 'SET (value hidden)' : 'NOT SET');

// OpenAI for chat functionality
console.log('\n--- OpenAI ---');
console.log('OPENAI_API_KEY:', process.env.OPENAI_API_KEY ? 'SET (value hidden)' : 'NOT SET');
console.log('OPENAI_ASSISTANT_ID_TOBO:', process.env.OPENAI_ASSISTANT_ID_TOBO || 'NOT SET');
console.log('OPENAI_ASSISTANT_ID_HEIDO:', process.env.OPENAI_ASSISTANT_ID_HEIDO || 'NOT SET');

// Stripe for payments
console.log('\n--- Stripe ---');
console.log('STRIPE_SECRET_KEY:', process.env.STRIPE_SECRET_KEY ? 'SET (value hidden)' : 'NOT SET');
console.log('STRIPE_WEBHOOK_SECRET:', process.env.STRIPE_WEBHOOK_SECRET ? 'SET (value hidden)' : 'NOT SET');
console.log('NEXT_PUBLIC_STRIPE_PRICE_ID_MONTHLY:', process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_MONTHLY || 'NOT SET');
console.log('NEXT_PUBLIC_STRIPE_PRICE_ID_YEARLY:', process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_YEARLY || 'NOT SET');

// Other API keys (if used)
console.log('\n--- Other APIs ---');
console.log('CMC_API_KEY:', process.env.CMC_API_KEY ? 'SET (value hidden)' : 'NOT SET');

// Count missing required variables
const requiredVars = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'NEXT_PUBLIC_SITE_URL',
  'ADMIN_API_KEY',
  'STRIPE_SECRET_KEY'
];

const missingVars = requiredVars.filter(varName => !process.env[varName]);

console.log('\n--- Summary ---');
if (missingVars.length === 0) {
  console.log('\x1b[32m✓ All required environment variables are set\x1b[0m');
} else {
  console.log(`\x1b[31m✗ Missing ${missingVars.length} required variables: ${missingVars.join(', ')}\x1b[0m`);
} 