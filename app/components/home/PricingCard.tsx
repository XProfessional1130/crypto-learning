'use client';

import Card from '../ui/Card';
import Button from '../ui/Button';

interface PricingCardProps {
  title: string;
  description: string;
  price: string;
  period: string;
  features: string[];
  ctaText: string;
  ctaLink: string;
  highlighted?: boolean;
  badge?: string;
}

export default function PricingCard({
  title,
  description,
  price,
  period,
  features,
  ctaText,
  ctaLink,
  highlighted = false,
  badge
}: PricingCardProps) {
  return (
    <Card 
      variant={highlighted ? 'outlined' : 'default'} 
      padding="lg" 
      className={`relative ${highlighted ? 'border-indigo-200' : 'border border-gray-200'} shadow-sm`}
    >
      {badge && (
        <div className="absolute -top-4 right-4 rounded-full bg-indigo-100 px-4 py-1 text-xs font-bold uppercase text-indigo-600">
          {badge}
        </div>
      )}
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        <p className="mt-1 text-sm text-gray-500">{description}</p>
        <p className="mt-4 text-4xl font-bold tracking-tight text-gray-900">{price}<span className="text-xl font-medium text-gray-500">{period}</span></p>
      </div>
      <ul className="mt-6 space-y-4">
        {features.map((feature, index) => (
          <li key={index} className="flex items-start">
            <svg className="h-6 w-6 flex-shrink-0 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
            <span className="ml-3 text-gray-600">{feature}</span>
          </li>
        ))}
      </ul>
      <div className="mt-8">
        <Button
          href={ctaLink}
          variant="primary"
          className="w-full"
        >
          {ctaText}
        </Button>
      </div>
    </Card>
  );
} 