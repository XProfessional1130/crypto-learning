'use client';

import { ReactNode, useState } from 'react';
import Card from './Card';

interface InteractiveCardProps {
  children: ReactNode;
  className?: string;
  variant?: 'default' | 'outlined' | 'elevated' | 'accent';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  hoverEffect?: 'none' | 'elevate' | 'highlight' | 'scale';
  onClick?: () => void;
}

/**
 * Interactive client component version of Card
 * 
 * This component uses the Card server component internally but adds
 * interactive hover effects and click handlers.
 */
export default function InteractiveCard({
  children,
  className = '',
  variant = 'default',
  padding = 'md',
  hoverEffect = 'none',
  onClick,
}: InteractiveCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  
  // Additional hover effect classes
  let hoverClasses = '';
  if (isHovered) {
    switch (hoverEffect) {
      case 'elevate':
        hoverClasses = 'shadow-xl -translate-y-1';
        break;
      case 'highlight':
        hoverClasses = 'ring-2 ring-brand-primary ring-opacity-50';
        break;
      case 'scale':
        hoverClasses = 'scale-[1.02]';
        break;
      default:
        hoverClasses = '';
    }
  }
  
  // Transition classes for smooth animations
  const transitionClasses = hoverEffect !== 'none' 
    ? 'transition-all duration-200' 
    : '';
  
  // Cursor pointer if onClick provided
  const cursorClasses = onClick ? 'cursor-pointer' : '';
  
  return (
    <div 
      className={`${transitionClasses} ${cursorClasses}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
    >
      <Card
        className={`${className} ${hoverClasses}`}
        variant={variant}
        padding={padding}
      >
        {children}
      </Card>
    </div>
  );
} 