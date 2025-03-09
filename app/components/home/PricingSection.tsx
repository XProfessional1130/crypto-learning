'use client';

import Section from '../ui/Section';
import PricingCard from './PricingCard';

// Define pricing plans as constants to avoid recreation on each render
const pricingPlans = [
  {
    title: 'Monthly Subscription',
    description: 'Perfect for exploring all features',
    price: '$49',
    period: '/month',
    features: [
      'Unlimited AI chat with Tobo & Heido',
      'Personal portfolio tracking',
      'Market analytics dashboard',
      'Weekly market reports'
    ],
    ctaText: 'Get Started with Fiat',
    ctaLink: '/auth/signin',
    highlighted: false
  },
  {
    title: 'Annual Subscription',
    description: 'Save 20% with yearly billing',
    price: '$470',
    period: '/year',
    features: [
      'Everything in Monthly plan',
      'Priority access to new features',
      'On-chain analytics with Arkham API',
      'Advanced TradingView integrations'
    ],
    ctaText: 'Get Started with Crypto',
    ctaLink: '/auth/signin',
    highlighted: true,
    badge: 'Best Value'
  }
];

export default function PricingSection() {
  return (
    <Section background="white">
      <div className="text-center">
        <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
          Simple, Transparent Pricing
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-xl text-gray-500 sm:mt-4">
          Choose the plan that works for you. Pay with crypto or fiat.
        </p>
      </div>

      <div className="mt-16 grid grid-cols-1 gap-8 lg:grid-cols-2">
        {pricingPlans.map((plan, index) => (
          <PricingCard
            key={index}
            title={plan.title}
            description={plan.description}
            price={plan.price}
            period={plan.period}
            features={plan.features}
            ctaText={plan.ctaText}
            ctaLink={plan.ctaLink}
            highlighted={plan.highlighted}
            badge={plan.badge}
          />
        ))}
      </div>
    </Section>
  );
} 