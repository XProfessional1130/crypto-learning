import Stripe from 'stripe';

// Initialize Stripe with the secret key
// We use two different instances - one for server-side and one for client-side
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-02-24.acacia', // Update to match the latest API version supported by the types
});

// Helper function to format amount in cents (Stripe uses smallest currency unit)
export const formatAmountForStripe = (amount: number, currency: string): number => {
  const numberFormat = new Intl.NumberFormat(['en-US'], {
    style: 'currency',
    currency: currency,
    currencyDisplay: 'symbol',
  });
  const parts = numberFormat.formatToParts(amount);
  let zeroDecimalCurrency = true;
  
  for (const part of parts) {
    if (part.type === 'decimal') {
      zeroDecimalCurrency = false;
    }
  }
  
  return zeroDecimalCurrency ? amount : Math.round(amount * 100);
};

// Map of plan IDs to Stripe price IDs
// These will need to be updated with your actual Stripe price IDs
const PRICE_ID_MONTHLY = process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_MONTHLY || '';
const PRICE_ID_YEARLY = process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_YEARLY || '';

// Validate price IDs format
if (PRICE_ID_MONTHLY && !PRICE_ID_MONTHLY.startsWith('price_')) {
  console.error('⚠️ NEXT_PUBLIC_STRIPE_PRICE_ID_MONTHLY environment variable is not a valid price ID. It should start with "price_" but got:', PRICE_ID_MONTHLY);
}

if (PRICE_ID_YEARLY && !PRICE_ID_YEARLY.startsWith('price_')) {
  console.error('⚠️ NEXT_PUBLIC_STRIPE_PRICE_ID_YEARLY environment variable is not a valid price ID. It should start with "price_" but got:', PRICE_ID_YEARLY);
}

export const STRIPE_PRICE_IDS = {
  monthly: PRICE_ID_MONTHLY,
  yearly: PRICE_ID_YEARLY,
}; 