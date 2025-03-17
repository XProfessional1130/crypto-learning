'use client';

import { useState } from 'react';
import TestimonialServer from './TestimonialServer';

interface InteractiveTestimonialProps {
  name: string;
  role: string;
  content: string;
  isVisible?: boolean;
  delay?: number;
  onClick?: () => void;
}

/**
 * Interactive client component wrapper for TestimonialServer
 * 
 * This component adds client-side interactivity like hover effects,
 * animations, and click handlers to the server component.
 */
export default function InteractiveTestimonial({ 
  name, 
  role, 
  content, 
  isVisible = true, 
  delay = 0,
  onClick
}: InteractiveTestimonialProps) {
  const [isHovered, setIsHovered] = useState(false);
  
  return (
    <div 
      className={`transition-all duration-500 transform ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'} ${isHovered ? 'shadow-[0_8px_30px_rgba(0,0,0,0.08)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.15)] scale-[1.01]' : ''}`}
      style={{ transitionDelay: `${delay}s` }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
    >
      <div className={`${onClick ? 'cursor-pointer' : ''} transition-all duration-300`}>
        <TestimonialServer 
          name={name}
          role={role}
          content={content}
        />
      </div>
    </div>
  );
} 