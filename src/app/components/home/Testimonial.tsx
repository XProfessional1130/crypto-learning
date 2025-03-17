'use client';

import { useState } from 'react';

interface TestimonialProps {
  name: string;
  role: string;
  content: string;
  isVisible?: boolean;
  delay?: number;
}

export default function Testimonial({ name, role, content, isVisible = true, delay = 0 }: TestimonialProps) {
  const [isHovered, setIsHovered] = useState(false);
  
  return (
    <div 
      className={`transition-all duration-500 transform ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
      style={{ transitionDelay: `${delay}s` }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div 
        className={`backdrop-blur-sm bg-white/5 dark:bg-dark-bg-primary/10 border border-white/10 dark:border-dark-bg-accent/10 rounded-xl p-6 h-full transition-all duration-300 ${
          isHovered ? 'shadow-[0_8px_30px_rgba(0,0,0,0.08)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.15)] scale-[1.01]' : 'shadow-none'
        }`}
      >
        <div className="flex flex-col h-full justify-between">
          <div>
            <svg className="w-5 h-5 mb-2 text-brand-primary/30 dark:text-brand-primary/40" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
              <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151C21.145 6.022 19.845 7.785 19.17 10H22v11h-7.983zm-14 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151C7.162 6.022 5.862 7.785 5.188 10H8v11H0z" />
            </svg>
            
            <p className="text-light-text-secondary dark:text-dark-text-secondary text-base sm:text-lg font-light leading-relaxed">
              {content}
            </p>
          </div>
          
          <div className="mt-6 pt-4 border-t border-white/5 dark:border-dark-bg-accent/10 flex items-center">
            <div className="w-8 h-8 rounded-full overflow-hidden bg-gradient-to-br from-brand-primary/80 to-brand-primary/60 flex items-center justify-center text-white text-sm">
              {name.charAt(0)}
            </div>
            <div className="ml-3 flex-1">
              <p className="text-sm font-medium text-light-text-primary dark:text-dark-text-primary">{name}</p>
              <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary">{role}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 