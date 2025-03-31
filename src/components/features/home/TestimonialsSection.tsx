'use client';

import { useIntersectionObserver } from '@/hooks/ui/useIntersectionObserver';
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
  // Use the optimized intersection observer hook
  const [isVisible, sectionRef] = useIntersectionObserver<HTMLDivElement>({
    threshold: 0.1,
    rootMargin: '0px 0px -10% 0px',
    triggerOnce: true
  });

  return (
    <div className="below-fold-section">
      <Section background="none" className="relative py-16 sm:py-20">
        {/* Simplified decorative elements for better performance */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none" aria-hidden="true">
          <div className="absolute top-40 -left-20 w-64 h-64 sm:w-72 sm:h-72 rounded-full bg-brand-primary/5 dark:bg-brand-primary/3 blur-2xl opacity-50"></div>
          <div className="absolute bottom-10 right-10 w-64 h-64 sm:w-80 sm:h-80 rounded-full bg-brand-secondary/3 dark:bg-brand-secondary/2 blur-2xl opacity-30"></div>
        </div>
        
        <div ref={sectionRef} className={`max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 transition-opacity duration-500 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
          <div className="text-center mb-10 sm:mb-12">
            <h2 className="text-3xl font-bold tracking-tight text-light-text-primary dark:text-dark-text-primary sm:text-4xl">
              What Our Members Say
            </h2>
            <div className="w-16 h-0.5 bg-brand-primary/20 dark:bg-brand-primary/30 mx-auto my-4"></div>
            <p className="mt-4 text-base text-light-text-secondary dark:text-dark-text-secondary max-w-xl mx-auto">
              Join thousands of satisfied members who are mastering crypto with our platform
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:gap-8 md:grid-cols-3">
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
    </div>
  );
} 