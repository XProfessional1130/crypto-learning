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
}

export default function NavLink({ 
  children, 
  href, 
  active, 
  onClick,
  className,
  activeClassName
}: NavLinkProps) {
  // Client-side state
  const [mounted, setMounted] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const baseClasses = className || 'relative px-3 py-1.5 text-sm font-medium transition-colors duration-200 rounded-full hover:bg-gray-200/40 dark:hover:bg-white/5';
  
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
        
        {/* Always render the indicator, but conditionally apply colors */}
        <div className="absolute bottom-[-6px] inset-x-0 flex justify-center">
          <div className={`w-1 h-1 rounded-full ${indicatorColor}`} aria-hidden="true" />
        </div>
      </div>
      
      {/* Always render the background highlight, but conditionally apply visibility */}
      <span 
        className={`absolute inset-0 rounded-full -z-10 ${active ? 'bg-gray-200/30 dark:bg-white/5' : 'bg-transparent'}`} 
        aria-hidden="true" 
      />
    </Link>
  );
} 