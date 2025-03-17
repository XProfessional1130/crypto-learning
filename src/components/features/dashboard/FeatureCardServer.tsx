import { ReactNode } from 'react';
import Card from '@/components/ui/Card';

interface FeatureCardServerProps {
  title: string;
  description: string;
  icon: ReactNode;
}

/**
 * Server Component version of FeatureCard
 * 
 * This component renders a feature card with an icon, title, and description.
 * Since it's a server component, it has no client-side JavaScript overhead.
 */
export default function FeatureCardServer({ 
  title, 
  description, 
  icon 
}: FeatureCardServerProps) {
  return (
    <div className="group relative perspective-tilt">
      {/* Enhanced glassmorphic card background with prismatic effects */}
      <div className="absolute inset-0 rounded-2xl neo-glass neo-glass-before backdrop-glow"></div>
      
      {/* Subtle accent color */}
      <div className="absolute inset-x-0 top-0 h-1 rounded-t-2xl bg-gradient-to-r from-brand-primary/50 via-brand-primary/70 to-brand-primary/50"></div>
      
      {/* Content with improved layout */}
      <div className="relative p-7 z-10 isolate h-full flex flex-col">
        {/* Header: Horizontal layout for icon and title */}
        <div className="flex items-center space-x-5 mb-5">
          {/* Icon container */}
          <div className="relative flex-shrink-0">
            <div className="relative w-14 h-14 rounded-full bg-gradient-to-br from-brand-primary/20 via-brand-primary/10 to-brand-light/5 dark:from-brand-primary/30 dark:via-brand-primary/20 dark:to-brand-light/10 p-3 flex items-center justify-center border border-white/20 dark:border-white/10 backdrop-blur-md shadow-md">
              <div className="text-brand-primary dark:text-brand-light">
                {icon}
              </div>
            </div>
          </div>
          
          {/* Title */}
          <h3 className="text-xl font-bold text-light-text-primary dark:text-dark-text-primary">
            {title}
          </h3>
        </div>
        
        {/* Divider line for visual structure */}
        <div className="h-px w-full bg-gradient-to-r from-brand-primary/10 via-brand-primary/5 to-transparent mb-4 opacity-70"></div>
        
        {/* Description text */}
        <p className="text-light-text-secondary dark:text-dark-text-secondary leading-relaxed text-base flex-grow">
          {description}
        </p>
        
        {/* Static Learn more text (non-interactive) */}
        <div className="mt-5">
          <div className="text-sm font-medium text-brand-primary dark:text-brand-light">
            Learn more
          </div>
        </div>
      </div>
    </div>
  );
} 