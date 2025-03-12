'use client';

import Card from '../ui/Card';

interface TestimonialProps {
  name: string;
  role: string;
  content: string;
  isVisible?: boolean;
  delay?: number;
}

export default function Testimonial({ name, role, content, isVisible = true, delay = 0 }: TestimonialProps) {
  return (
    <div 
      className={`transition-all duration-500 transform ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
      style={{ transitionDelay: `${delay}s` }}
    >
      <Card variant="elevated" padding="lg" className="shadow-md">
        <div className="flex items-center">
          <div className="ml-4">
            <p className="text-lg font-semibold text-light-text-primary dark:text-dark-text-primary">{name}</p>
            <p className="text-light-text-secondary dark:text-dark-text-secondary">{role}</p>
          </div>
        </div>
        <p className="mt-4 text-light-text-secondary dark:text-dark-text-secondary">"{content}"</p>
      </Card>
    </div>
  );
} 