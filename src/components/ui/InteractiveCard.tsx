'use client';

import { ReactNode, useState } from 'react';
import ServerCard from './ServerCard';

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
 * This component uses the ServerCard internally but adds
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
  
  // We need to wrap the ServerCard in a div to handle events since
  // the ServerCard is a server component and can't handle client events
  return (
    <div 
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
    >
      <ServerCard
        className={`${className} ${hoverClasses} ${transitionClasses} ${cursorClasses}`}
        variant={variant}
        padding={padding}
      >
        {children}
      </ServerCard>
    </div>
  );
} 