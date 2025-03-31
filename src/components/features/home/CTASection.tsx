'use client';

import { useIntersectionObserver } from '@/hooks/ui/useIntersectionObserver';
import Section from '@/components/ui/Section';
import Button from '@/components/ui/Button';

export default function CTASection() {
  // Use the optimized intersection observer hook
  const [isVisible, sectionRef] = useIntersectionObserver<HTMLDivElement>({
    threshold: 0.1,
    rootMargin: '0px 0px -5% 0px',
    triggerOnce: true
  });

  return (
    <Section background="none" className="pt-10 pb-20 relative">
      {/* Light decorative elements for better performance */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
        <div className="absolute top-1/2 left-0 -translate-x-1/4 -translate-y-1/2 w-96 h-96 rounded-full bg-gradient-to-br from-brand-primary/10 to-brand-light/5 dark:from-brand-primary/10 dark:to-brand-light/5 blur-2xl opacity-70"></div>
      </div>
      
      <div 
        ref={sectionRef} 
        className={`max-w-4xl mx-auto text-center px-4 sm:px-6 transition-all duration-700 transform ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
      >
        <div className="bg-glass-white dark:bg-glass-dark backdrop-blur-md border border-white/20 dark:border-dark-bg-accent/20 rounded-2xl p-8 sm:p-10 shadow-lg">
          <h2 className="text-3xl font-bold mb-4 tracking-tight text-light-text-primary dark:text-dark-text-primary">
            Ready to Master Crypto?
          </h2>
          <p className="text-xl text-light-text-secondary dark:text-dark-text-secondary mb-8 max-w-2xl mx-auto">
            Join thousands of users who are already improving their crypto knowledge and portfolio performance.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4 sm:gap-6">
            <Button 
              href="/auth/signin" 
              variant="primary"
              size="lg"
              className="min-h-[44px] sm:min-h-[48px] px-8"
            >
              Get Started Today
            </Button>
            <Button 
              href="/about" 
              variant="outline"
              size="lg"
              className="min-h-[44px] sm:min-h-[48px]"
            >
              Learn More
            </Button>
          </div>
        </div>
      </div>
    </Section>
  );
} 