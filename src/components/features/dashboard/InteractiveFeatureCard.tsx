'use client';

import { ReactNode, useState, useEffect } from 'react';
import FeatureCardServer from './FeatureCardServer';

interface InteractiveFeatureCardProps {
  title: string;
  description: string;
  icon: ReactNode;
  delay?: number;
  isVisible?: boolean;
  onClick?: () => void;
}

/**
 * Interactive client component wrapper for FeatureCardServer
 * 
 * This component adds client-side interactivity like animation,
 * hover effects, and click handlers to the server component.
 */
export default function InteractiveFeatureCard({ 
  title, 
  description, 
  icon, 
  delay = 0, 
  isVisible: parentIsVisible,
  onClick
}: InteractiveFeatureCardProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 100);
    
    return () => clearTimeout(timer);
  }, []);
  
  // Use parent visibility state if provided, otherwise use local state
  const visibility = parentIsVisible !== undefined ? parentIsVisible : isVisible;
  
  return (
    <div 
      className={`relative transition-all duration-1000 transform ${visibility ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'} ${isHovered ? 'scale-[1.02]' : ''}`}
      style={{ transitionDelay: `${delay}s` }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
    >
      {/* Hover effects */}
      {isHovered && (
        <>
          {/* Subtle border glow effect on hover */}
          <div className="absolute inset-0 rounded-2xl z-[-1] bg-brand-200/30 dark:bg-brand-700/20 blur-xl scale-[0.95]"></div>
          
          {/* Shadow effect on hover */}
          <div className="absolute inset-0 rounded-2xl transform translate-y-[-6px] shadow-[0_20px_40px_rgba(0,0,0,0.18)] dark:shadow-[0_20px_40px_rgba(0,0,0,0.3)]"></div>
        </>
      )}
      
      {/* We render the FeatureCardServer and apply interactive wrappers */}
      <div className={`${onClick ? 'cursor-pointer' : ''} transition-all duration-300`}>
        <FeatureCardServer 
          title={title}
          description={description}
          icon={icon}
        />
      </div>
    </div>
  );
} 