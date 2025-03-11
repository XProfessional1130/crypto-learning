'use client';

import { useState, useEffect, ReactNode } from 'react';
import Card from '../ui/Card';

interface FeatureCardProps {
  title: string;
  description: string;
  icon: ReactNode;
}

export default function FeatureCard({ title, description, icon }: FeatureCardProps) {
  const [isVisible, setIsVisible] = useState(false);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 100);
    
    return () => clearTimeout(timer);
  }, []);
  
  return (
    <div 
      className={`group relative perspective-tilt transition-all duration-1000 transform ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
    >
      {/* Enhanced glassmorphic card background with prismatic effects */}
      <div className="absolute inset-0 rounded-2xl neo-glass neo-glass-before backdrop-glow transform transition-all duration-500 group-hover:translate-y-[-6px] group-hover:shadow-[0_20px_40px_rgba(0,0,0,0.18)] dark:group-hover:shadow-[0_20px_40px_rgba(0,0,0,0.3)]"></div>
      
      {/* Subtle border glow effect */}
      <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-700 z-[-1] bg-brand-200/30 dark:bg-brand-700/20 blur-xl scale-[0.95]"></div>
      
      {/* Light reflections */}
      <div className="absolute top-0 right-0 w-[80%] h-[20%] bg-gradient-to-br from-white/20 dark:from-white/5 to-transparent rounded-bl-full transform opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
      
      {/* Prism edge effect */}
      <div className="absolute inset-0 rounded-2xl overflow-hidden">
        <div className="absolute -right-[150%] -top-[150%] w-[300%] h-[300%] bg-gradient-to-br from-brand-200/10 dark:from-brand-700/10 to-transparent rounded-full transform group-hover:-right-[120%] group-hover:-top-[120%] transition-all duration-700 ease-in-out"></div>
      </div>
      
      {/* Content */}
      <div className="relative p-8 transition-all duration-300 z-10 isolate">
        {/* Enhanced icon container with 3D float effect */}
        <div className="mb-6 relative">
          <div className="absolute inset-0 rounded-full bg-brand-primary/10 dark:bg-brand-primary/20 blur-xl scale-[0.8] opacity-70 dark:opacity-50 animate-pulse-slow"></div>
          <div className="relative w-14 h-14 rounded-full bg-gradient-to-br from-brand-primary/20 via-brand-primary/10 to-brand-light/5 dark:from-brand-primary/30 dark:via-brand-primary/20 dark:to-brand-light/10 p-4 flex items-center justify-center border border-white/20 dark:border-white/10 backdrop-blur-md shadow-md animate-float">
            <div className="text-brand-primary dark:text-brand-light">
              {icon}
            </div>
          </div>
        </div>
        
        {/* Enhanced title and description */}
        <h3 className="text-xl font-bold text-light-text-primary dark:text-dark-text-primary mb-3 relative inline-block transition-all duration-300 group-hover:text-gradient-vibrant">
          {title}
          <div className="absolute inset-x-0 bottom-0 h-[1px] bg-gradient-to-r from-brand-primary/50 to-transparent scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></div>
        </h3>
        
        <p className="text-light-text-secondary dark:text-dark-text-secondary transition-all duration-300 group-hover:text-light-text-primary/80 dark:group-hover:text-dark-text-primary/80">{description}</p>
        
        {/* Animated arrow on hover */}
        <div className="mt-5 flex items-center text-brand-primary dark:text-brand-light text-sm font-medium opacity-0 transform translate-x-[-10px] group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
          <span className="mr-2">Learn more</span>
          <svg className="w-4 h-4 transform group-hover:translate-x-1 transition-transform duration-300" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      </div>
    </div>
  );
} 