"use client";

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import HeroSection from './components/home/HeroSection';
// Dynamically import below-the-fold components with client-side only loading
const FeaturesSection = dynamic(() => import('./components/home/FeaturesSection'), { ssr: false });
const TestimonialsSection = dynamic(() => import('./components/home/TestimonialsSection'), { ssr: false });
const PricingSection = dynamic(() => import('./components/home/PricingSection'), { ssr: false });
const CTASection = dynamic(() => import('./components/home/CTASection'), { ssr: false });
import AuthCodeHandler from './components/auth/AuthCodeHandler';

export default function Home() {
  const [isClient, setIsClient] = useState(false);
  
  useEffect(() => {
    setIsClient(true);
  }, []);
  
  return (
    <div className="w-full relative overflow-x-hidden overflow-y-hidden glow-overflow -mt-10">
      <AuthCodeHandler />
      
      {/* Unified background glow that spans the entire page */}
      <div className="fixed inset-0 pointer-events-none z-0">
        {/* Larger, more spread out gradient orbs to create consistent ambient glow */}
        <div className="absolute top-0 right-0 w-[1200px] h-[1200px] rounded-full bg-gradient-to-br from-brand-200/15 to-brand-300/5 dark:from-brand-700/15 dark:to-brand-900/5 blur-[150px] animate-pulse-slow"></div>
        <div className="absolute bottom-0 left-0 w-[1200px] h-[1200px] rounded-full bg-gradient-to-tr from-indigo-300/10 dark:from-indigo-700/10 to-blue-200/5 dark:to-blue-800/5 blur-[150px] animate-pulse-slow" style={{ animationDelay: '3s' }}></div>
        
        {/* Additional ambient glow for consistent background */}
        <div className="absolute top-1/3 left-1/4 w-[800px] h-[800px] rounded-full bg-gradient-to-br from-teal-200/10 dark:from-teal-700/10 to-teal-300/5 dark:to-teal-800/5 blur-[120px] animate-pulse-slow" style={{ animationDelay: '5s' }}></div>
      </div>
      
      {/* Semi-transparent overlay to unify the page */}
      <div className="fixed inset-0 bg-gradient-to-b from-transparent via-light-bg-primary/5 dark:via-dark-bg-primary/5 to-transparent pointer-events-none z-1"></div>
      
      {/* Content sections with seamless flow */}
      <div className="relative z-10">
        <HeroSection />
        {isClient && (
          <>
            <FeaturesSection />
            <TestimonialsSection />
            <PricingSection />
            <CTASection />
          </>
        )}
      </div>
    </div>
  );
}
