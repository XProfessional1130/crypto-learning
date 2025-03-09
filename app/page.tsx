"use client";

import HeroSection from './components/home/HeroSection';
import FeaturesSection from './components/home/FeaturesSection';
import TestimonialsSection from './components/home/TestimonialsSection';
import PricingSection from './components/home/PricingSection';
import CTASection from './components/home/CTASection';
import AuthCodeHandler from './components/auth/AuthCodeHandler';

export default function Home() {
  return (
    <div className="w-full">
      <AuthCodeHandler />
      <HeroSection />
      <FeaturesSection />
      <TestimonialsSection />
      <PricingSection />
      <CTASection />
    </div>
  );
}
