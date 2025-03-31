'use client';

import { useIntersectionObserver } from '@/hooks/ui/useIntersectionObserver';
import Section from '@/components/ui/Section';
import PricingCard from './PricingCard';

// Define pricing plans as constants to avoid recreation on each render
const pricingPlans = [
  {
    title: 'Free',
    description: 'Perfect for beginners exploring the world of crypto',
    price: '$0',
    period: 'forever',
    features: [
      'Basic AI-powered crypto education',
      'Limited portfolio tracking',
      'Public market analytics',
      'Community forum access'
    ],
    ctaText: 'Get Started',
    ctaLink: '/auth/signup?plan=free',
    highlighted: false
  },
  {
    title: 'Pro',
    description: 'For serious crypto investors and enthusiasts',
    price: '$19',
    period: 'per month',
    features: [
      'Unlimited AI-powered learning sessions',
      'Advanced portfolio analytics',
      'Real-time market data & alerts',
      'On-chain analytics & whale tracking',
      'Tax reporting tools',
      'Priority support'
    ],
    ctaText: 'Start Free Trial',
    ctaLink: '/auth/signup?plan=pro',
    highlighted: true
  }
];

export default function PricingSection() {
  // Use the optimized intersection observer hook
  const [isVisible, sectionRef] = useIntersectionObserver<HTMLDivElement>({
    threshold: 0.1,
    rootMargin: '0px 0px -10% 0px',
    triggerOnce: true,
    // Earlier loading on mobile
    mobileRootMargin: '0px 0px 0px 0px'
  });

  return (
    <div className="below-fold-section">
      <Section background="none" className="relative overflow-hidden py-16 sm:py-20">      
        <div 
          ref={sectionRef} 
          className={`max-w-5xl mx-auto px-4 sm:px-6 transition-opacity duration-700 ${isVisible ? 'opacity-100' : 'opacity-0'}`}
        >
          <div className="text-center mb-10 sm:mb-12">
            <h2 className="text-3xl font-bold tracking-tight text-light-text-primary dark:text-dark-text-primary sm:text-4xl">
              Choose Your Plan
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg sm:text-xl text-light-text-secondary dark:text-dark-text-secondary">
              Flexible plans designed to fit your learning journey
            </p>
          </div>

          <div className="mt-10 sm:mt-12 grid gap-6 sm:gap-8 lg:grid-cols-2">
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
                isVisible={isVisible}
                delay={index * 0.2}
              />
            ))}
          </div>
        </div>
      </Section>
    </div>
  );
} 