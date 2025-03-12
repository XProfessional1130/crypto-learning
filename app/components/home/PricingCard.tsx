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
  isVisible?: boolean;
  delay?: number;
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
  badge,
  isVisible = true,
  delay = 0
}: PricingCardProps) {
  return (
    <div 
      className={`relative backdrop-blur-sm rounded-2xl overflow-hidden transition-all duration-500 transform ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
      } ${
        highlighted 
          ? 'bg-gradient-to-br from-brand-50/95 to-white/95 dark:from-brand-900/40 dark:to-dark-bg-primary/95 border border-brand-200/50 dark:border-brand-700/30 shadow-xl dark:shadow-brand-900/20' 
          : 'bg-white/95 dark:bg-dark-bg-secondary/95 border border-gray-200/50 dark:border-gray-700/30 shadow-lg'
      }`}
      style={{ transitionDelay: `${delay}s` }}
    >
      {/* Subtle background glow effect */}
      {highlighted && (
        <div className="absolute -inset-0.5 bg-gradient-to-r from-brand-300/20 to-indigo-300/20 dark:from-brand-500/20 dark:to-indigo-500/20 rounded-2xl blur-lg opacity-75 -z-10 animate-pulse-slow"></div>
      )}
      
      {badge && (
        <div className="absolute top-4 right-4 rounded-full bg-brand-100 dark:bg-brand-900/50 px-4 py-1 text-xs font-bold uppercase text-brand-700 dark:text-brand-300 border border-brand-200/50 dark:border-brand-700/50">
          {badge}
        </div>
      )}

      <div className="p-8">
        <div className="mb-6">
          <h3 className="text-xl font-bold text-light-text-primary dark:text-dark-text-primary">{title}</h3>
          <p className="mt-2 text-sm text-light-text-secondary dark:text-dark-text-secondary">{description}</p>
          <div className="mt-5 text-4xl font-extrabold tracking-tight text-light-text-primary dark:text-dark-text-primary">
            <span className="flex items-start">
              {price}
              <span className="text-xl font-medium text-light-text-tertiary dark:text-dark-text-tertiary ml-1 mt-1">{period}</span>
            </span>
          </div>
        </div>

        <ul className="mt-8 space-y-4 border-t border-gray-200/50 dark:border-gray-700/30 pt-6">
          {features.map((feature, index) => (
            <li key={index} className="flex items-start">
              <svg 
                className={`h-5 w-5 flex-shrink-0 ${highlighted ? 'text-brand-500 dark:text-brand-400' : 'text-green-500 dark:text-green-400'}`}
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
              <span className="ml-3 text-light-text-secondary dark:text-dark-text-secondary text-sm">{feature}</span>
            </li>
          ))}
        </ul>
        
        <div className="mt-8">
          <Button
            href={ctaLink}
            variant={highlighted ? "primary" : "outline"}
            className="w-full"
          >
            {ctaText}
          </Button>
        </div>
      </div>
    </div>
  );
} 