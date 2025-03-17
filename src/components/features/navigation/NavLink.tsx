'use client';

import Link from 'next/link';
import { ReactNode, useState, useEffect, useCallback } from 'react';

interface NavLinkProps {
  children: ReactNode;
  href: string;
  active: boolean;
  onClick?: () => void;
  className?: string;
  activeClassName?: string;
  isScrolled?: boolean;
}

export default function NavLink({ 
  children, 
  href, 
  active, 
  onClick,
  className,
  activeClassName,
  isScrolled = false
}: NavLinkProps) {
  // Client-side state
  const [mounted, setMounted] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const baseClasses = className || `relative px-3 py-1.5 text-sm font-medium transition-all duration-300 rounded-full ${
    isScrolled 
      ? 'hover:bg-gray-200/60 dark:hover:bg-white/10' 
      : 'hover:bg-gray-200/40 dark:hover:bg-white/5'
  }`;
  
  const activeClasses = activeClassName || 'text-brand-primary dark:text-brand-light font-medium';
  const inactiveClasses = 'text-gray-700 dark:text-dark-text-primary hover:text-brand-primary dark:hover:text-brand-light';
  
  // Determine indicator color - always render the element but change the color based on state
  const indicatorColor = mounted ? (
    active 
      ? 'bg-brand-primary dark:bg-brand-light'
      : isHovered
        ? 'bg-gray-400/60 dark:bg-gray-400/40'
        : 'bg-transparent'
  ) : 'bg-transparent'; // Initially transparent on server
  
  // Handlers defined with useCallback to avoid recreation on each render
  const handleMouseEnter = useCallback(() => {
    if (mounted) setIsHovered(true);
  }, [mounted]);
  
  const handleMouseLeave = useCallback(() => {
    if (mounted) setIsHovered(false);
  }, [mounted]);
  
  const handleClick = useCallback((e: React.MouseEvent) => {
    if (onClick) onClick();
  }, [onClick]);
  
  return (
    <Link 
      href={href} 
      className={`${baseClasses} ${active ? activeClasses : inactiveClasses}`}
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className="relative">
        {children}
        
        {/* Indicator with mobile-specific positioning */}
        <div className={`absolute bottom-[-6px] inset-x-0 flex justify-center mobile-nav-indicator`}>
          <div className={`h-1 transition-all duration-300 rounded-full ${indicatorColor} ${
            active ? 'w-1/2' : 'w-1'
          }`} aria-hidden="true" />
        </div>
      </div>
      
      {/* Always render the background highlight, but conditionally apply visibility */}
      <span 
        className={`absolute inset-0 rounded-full -z-10 transition-all duration-300 ${
          active 
            ? isScrolled 
              ? 'bg-gray-200/50 dark:bg-white/8' 
              : 'bg-gray-200/30 dark:bg-white/5'
            : 'bg-transparent'
        }`} 
        aria-hidden="true" 
      />
    </Link>
  );
} 