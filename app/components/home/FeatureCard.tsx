'use client';

import { useState, useEffect, ReactNode } from 'react';
import Card from '../ui/Card';

interface FeatureCardProps {
  title: string;
  description: string;
  icon: ReactNode;
  delay?: number;
  isVisible?: boolean;
}

export default function FeatureCard({ title, description, icon, delay = 0, isVisible: parentIsVisible }: FeatureCardProps) {
  const [isVisible, setIsVisible] = useState(false);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 100);
    
    return () => clearTimeout(timer);
  }, []);
  
  // Use parent visibility state if provided, otherwise use local state
  const visibility = parentIsVisible !== undefined ? parentIsVisible : isVisible;
  
  return (
    <div 
      className={`group relative perspective-tilt transition-all duration-1000 transform ${visibility ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
      style={{ transitionDelay: `${delay}s` }}
    >
      {/* Enhanced glassmorphic card background with prismatic effects */}
      <div className="absolute inset-0 rounded-2xl neo-glass neo-glass-before backdrop-glow transform transition-all duration-500 group-hover:translate-y-[-6px] group-hover:shadow-[0_20px_40px_rgba(0,0,0,0.18)] dark:group-hover:shadow-[0_20px_40px_rgba(0,0,0,0.3)]"></div>
      
      {/* Subtle accent color on hover */}
      <div className="absolute inset-x-0 top-0 h-1 rounded-t-2xl bg-gradient-to-r from-brand-primary/0 via-brand-primary/0 to-brand-primary/0 group-hover:from-brand-primary/50 group-hover:via-brand-primary/70 group-hover:to-brand-primary/50 transition-all duration-700"></div>
      
      {/* Subtle border glow effect */}
      <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-700 z-[-1] bg-brand-200/30 dark:bg-brand-700/20 blur-xl scale-[0.95]"></div>
      
      {/* Refined prism edge effect */}
      <div className="absolute inset-0 rounded-2xl overflow-hidden">
        <div className="absolute -right-[150%] -top-[150%] w-[300%] h-[300%] bg-gradient-to-br from-brand-200/5 dark:from-brand-700/5 to-transparent rounded-full transform group-hover:-right-[120%] group-hover:-top-[120%] transition-all duration-700 ease-in-out"></div>
      </div>
      
      {/* Content with improved layout */}
      <div className="relative p-7 transition-all duration-300 z-10 isolate h-full flex flex-col">
        {/* Header: Horizontal layout for icon and title */}
        <div className="flex items-center space-x-5 mb-5">
          {/* Enhanced icon container with 3D float effect */}
          <div className="relative flex-shrink-0">
            <div className="absolute inset-0 rounded-full bg-brand-primary/10 dark:bg-brand-primary/20 blur-lg scale-[0.8] opacity-70 dark:opacity-50 animate-pulse-slow"></div>
            <div className="relative w-14 h-14 rounded-full bg-gradient-to-br from-brand-primary/20 via-brand-primary/10 to-brand-light/5 dark:from-brand-primary/30 dark:via-brand-primary/20 dark:to-brand-light/10 p-3 flex items-center justify-center border border-white/20 dark:border-white/10 backdrop-blur-md shadow-md transform transition-transform duration-300 group-hover:scale-110">
              <div className="text-brand-primary dark:text-brand-light">
                {icon}
              </div>
            </div>
          </div>
          
          {/* Enhanced title with improved hover effect */}
          <h3 className="text-xl font-bold text-light-text-primary dark:text-dark-text-primary relative transition-all duration-300 group-hover:text-brand-primary dark:group-hover:text-brand-light">
            {title}
            <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-brand-primary/50 to-transparent scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></div>
          </h3>
        </div>
        
        {/* Divider line for visual structure */}
        <div className="h-px w-full bg-gradient-to-r from-brand-primary/10 via-brand-primary/5 to-transparent mb-4 opacity-70"></div>
        
        {/* Improved description text with better line height for readability */}
        <p className="text-light-text-secondary dark:text-dark-text-secondary transition-all duration-300 group-hover:text-light-text-primary/90 dark:group-hover:text-dark-text-primary/90 leading-relaxed text-base flex-grow">{description}</p>
        
        {/* Improved call-to-action button with micro-interaction */}
        <div className="mt-5 flex items-center">
          <button 
            className="flex items-center text-sm font-medium px-4 py-2 rounded-lg transition-all duration-300 
            bg-brand-primary/10 hover:bg-brand-primary/20 dark:bg-brand-primary/20 dark:hover:bg-brand-primary/30 
            text-brand-primary dark:text-brand-light group/btn relative overflow-hidden"
          >
            <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-brand-primary/0 to-brand-primary/0 group-hover/btn:from-brand-primary/10 group-hover/btn:to-brand-primary/0 transition-all duration-500"></span>
            <span className="relative z-10 mr-2">Learn more</span>
            <svg className="relative z-10 w-4 h-4 transform group-hover/btn:translate-x-1 transition-transform duration-300" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
} 