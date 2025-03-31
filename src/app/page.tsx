"use client";

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import HeroSection from '@/components/features/home/HeroSection';
// Dynamically import below-the-fold components with client-side only loading
const FeaturesSection = dynamic(() => import('@/components/features/home/FeaturesSection'), { ssr: false });
const TestimonialsSection = dynamic(() => import('@/components/features/home/TestimonialsSection'), { ssr: false });
const PricingSection = dynamic(() => import('@/components/features/home/PricingSection'), { ssr: false });
const CTASection = dynamic(() => import('@/components/features/home/CTASection'), { ssr: false });
// Import auth handler conditionally to avoid unnecessary loading
const AuthCodeHandler = dynamic(() => import('@/components/features/auth/AuthCodeHandler'), { 
  ssr: false,
  loading: () => null
});

export default function Home() {
  const [isClient, setIsClient] = useState(false);
  const [shouldCheckAuth, setShouldCheckAuth] = useState(false);
  
  useEffect(() => {
    setIsClient(true);
    
    // Only load auth handler if URL has auth parameters
    const hasAuthParams = window.location.search.includes('code') || 
                         window.location.hash.includes('access_token');
    setShouldCheckAuth(hasAuthParams);
  }, []);
  
  return (
    <div className="w-full relative overflow-x-hidden overflow-y-hidden glow-overflow">
      {/* Only render auth handler when needed */}
      {shouldCheckAuth && <AuthCodeHandler />}
      
      {/* Unified background glow that spans the entire page */}
      <div className="fixed inset-0 pointer-events-none z-0" aria-hidden="true">
        {/* Optimized background elements with reduced blur for better performance */}
        <div className="absolute top-0 right-0 w-[1200px] h-[1200px] rounded-full bg-gradient-to-br from-brand-200/15 to-brand-300/5 dark:from-brand-700/15 dark:to-brand-900/5 blur-[120px] animate-pulse-slow opacity-70"></div>
        <div className="absolute bottom-0 left-0 w-[1200px] h-[1200px] rounded-full bg-gradient-to-tr from-indigo-300/10 dark:from-indigo-700/10 to-blue-200/5 dark:to-blue-800/5 blur-[120px] animate-pulse-slow opacity-70" style={{ animationDelay: '3s' }}></div>
        
        {/* Additional ambient glow with reduced complexity */}
        <div className="absolute top-1/3 left-1/4 w-[800px] h-[800px] rounded-full bg-gradient-to-br from-teal-200/10 dark:from-teal-700/10 to-teal-300/5 dark:to-teal-800/5 blur-[100px] animate-pulse-slow opacity-70" style={{ animationDelay: '5s' }}></div>
      </div>
      
      {/* Semi-transparent overlay with better performance */}
      <div className="fixed inset-0 bg-gradient-to-b from-transparent via-light-bg-primary/5 dark:via-dark-bg-primary/5 to-transparent pointer-events-none z-1" aria-hidden="true"></div>
      
      {/* Content sections with seamless flow - removed negative margin causing layout shift */}
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
