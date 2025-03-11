'use client';

import { ReactNode } from 'react';
import Card from '../ui/Card';

interface FeatureCardProps {
  title: string;
  description: string;
  icon: ReactNode;
}

export default function FeatureCard({ title, description, icon }: FeatureCardProps) {
  return (
    <div className="group relative">
      {/* Card background with glass effect */}
      <div className="absolute inset-0 rounded-2xl backdrop-blur-md bg-white/20 dark:bg-dark-bg-primary/20 border border-white/30 dark:border-white/5 shadow-lg transform transition-all duration-300 group-hover:translate-y-[-4px] group-hover:shadow-xl"></div>
      
      {/* Content */}
      <div className="relative p-8">
        <div className="mb-5 rounded-full bg-gradient-to-br from-brand-primary/10 to-brand-light/5 dark:from-brand-primary/20 dark:to-brand-light/10 p-4 text-brand-primary dark:text-brand-light inline-block">
          {icon}
        </div>
        <h3 className="text-xl font-bold text-light-text-primary dark:text-dark-text-primary mb-3">{title}</h3>
        <p className="text-light-text-secondary dark:text-dark-text-secondary">{description}</p>
      </div>
      
      {/* Decorative elements */}
      <div className="absolute -z-10 bottom-0 right-0 w-20 h-20 rounded-br-2xl bg-gradient-to-tl from-brand-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
    </div>
  );
} 