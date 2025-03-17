export type MembershipPlan = {
  id: string;
  name: string;
  description: string;
  price: number;
  interval: 'month' | 'year';
  features: string[];
  popular?: boolean;
  discount?: number;
};

// Sample plans data (to be replaced with real data later)
export const membershipPlans: MembershipPlan[] = [
  {
    id: 'monthly',
    name: 'Monthly Plan',
    description: 'Perfect for getting started with full platform access',
    price: 29.99,
    interval: 'month',
    features: [
      'Full platform access',
      'Real-time market data',
      'Portfolio tracking',
      'Trading insights',
      'Community access'
    ],
  },
  {
    id: 'yearly',
    name: 'Annual Plan',
    description: 'Our best value option with 2 months free',
    price: 299.99,
    interval: 'year',
    popular: true,
    discount: 16.7, // Approximately 2 months free
    features: [
      'All Monthly features',
      'Advanced analytics',
      'Priority support',
      'Extended historical data',
      'API access',
      'Custom watchlists'
    ],
  }
]; 