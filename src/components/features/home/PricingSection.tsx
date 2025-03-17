'use client';

import { useState, useEffect, useRef } from 'react';
import Section from '@/components/ui/Section';
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
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Simple intersection observer to trigger animations when in view
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <Section background="none" className="relative overflow-hidden">
      {/* Removed explicit backgrounds for a seamless flow with the global background */}
      
      <div ref={sectionRef} className={`max-w-5xl mx-auto ${isVisible ? 'opacity-100' : 'opacity-0'} transition-opacity duration-1000`}>
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold tracking-tight text-light-text-primary dark:text-dark-text-primary sm:text-4xl">
            Choose Your Plan
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-xl text-light-text-secondary dark:text-dark-text-secondary">
            Flexible plans designed to fit your learning journey
          </p>
        </div>

        <div className="mt-12 grid gap-8 lg:grid-cols-2">
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
  );
} 