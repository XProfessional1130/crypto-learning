'use client';

import { useState, useEffect, useRef } from 'react';
import Section from '../ui/Section';
import Button from '../ui/Button';

export default function CTASection() {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Simple intersection observer to trigger animations when in view
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <Section background="none" className="pt-10 pb-20 relative">
      <div 
        ref={sectionRef} 
        className={`relative max-w-3xl mx-auto transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
      >
        <div className="glass rounded-xl overflow-hidden border border-white/10 dark:border-white/5 shadow-sm">
          <div className="px-8 py-12 text-center">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-light-text-primary dark:text-dark-text-primary">
              Ready to <span className="text-brand-primary dark:text-brand-light">Level Up</span> Your Crypto Knowledge?
            </h2>
            
            <p className="mx-auto mt-5 max-w-2xl text-lg text-light-text-secondary dark:text-dark-text-secondary">
              Join thousands of members who are already benefiting from our AI-driven crypto education platform.
            </p>
            
            <div className="mt-8">
              <Button
                href="/auth/signin"
                variant="primary"
                size="lg"
                className="px-6 py-3"
              >
                Get Started Now
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Section>
  );
} 