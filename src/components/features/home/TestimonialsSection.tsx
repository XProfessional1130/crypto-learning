'use client';

import { useState, useEffect, useRef } from 'react';
import Section from '@/components/ui/Section';
import Testimonial from './Testimonial';

// Define testimonials as constants to avoid recreation on each render
const testimonials = [
  {
    name: 'Alex Thompson',
    role: 'Crypto Enthusiast',
    content: 'LearningCrypto transformed my understanding of blockchain technology. The AI chat feature is like having a personal tutor available 24/7.'
  },
  {
    name: 'Sarah Chen',
    role: 'Investment Analyst',
    content: 'The portfolio tracking tools are exceptional. I\'ve been able to optimize my investments and increase my returns by following the insights provided.'
  },
  {
    name: 'Michael Rivera',
    role: 'Day Trader',
    content: 'The market analytics and on-chain data have been game-changing for my trading strategy. I especially love the whale wallet tracking feature.'
  }
];

export default function TestimonialsSection() {
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
    <Section background="none" className="relative py-20">
      {/* Subtle decorative elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-40 -left-20 w-72 h-72 rounded-full bg-brand-primary/5 dark:bg-brand-primary/3 blur-3xl opacity-50"></div>
        <div className="absolute bottom-10 right-10 w-80 h-80 rounded-full bg-brand-secondary/3 dark:bg-brand-secondary/2 blur-3xl opacity-30"></div>
      </div>
      
      <div ref={sectionRef} className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold tracking-tight text-light-text-primary dark:text-dark-text-primary sm:text-4xl">
            What Our Members Say
          </h2>
          <div className="w-16 h-0.5 bg-brand-primary/20 dark:bg-brand-primary/30 mx-auto my-4"></div>
          <p className="mt-4 text-base text-light-text-secondary dark:text-dark-text-secondary max-w-xl mx-auto">
            Join thousands of satisfied members who are mastering crypto with our platform
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 md:gap-8 md:grid-cols-3">
          {testimonials.map((testimonial, index) => (
            <Testimonial
              key={index}
              name={testimonial.name}
              role={testimonial.role}
              content={testimonial.content}
              isVisible={isVisible}
              delay={index * 0.15}
            />
          ))}
        </div>
      </div>
    </Section>
  );
} 