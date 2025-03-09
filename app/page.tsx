import HeroSection from './components/home/HeroSection';
import FeaturesSection from './components/home/FeaturesSection';
import TestimonialsSection from './components/home/TestimonialsSection';
import PricingSection from './components/home/PricingSection';
import CTASection from './components/home/CTASection';

export default function Home() {
  return (
    <div className="w-full">
      <HeroSection />
      <FeaturesSection />
      <TestimonialsSection />
      <PricingSection />
      <CTASection />
    </div>
  );
}
