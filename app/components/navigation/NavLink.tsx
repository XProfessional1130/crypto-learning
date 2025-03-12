'use client';

import Link from 'next/link';
import { ReactNode, useState, useEffect } from 'react';

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
  // Ensure client-side only state
  const [mounted, setMounted] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  // Only enable client-side behavior after hydration
  useEffect(() => {
    setMounted(true);
  }, []);

  const baseClasses = className || 'relative px-3 py-1.5 text-sm font-medium transition-colors duration-200 rounded-full hover:bg-gray-200/40 dark:hover:bg-white/5';
  
  const activeClasses = activeClassName || 'text-brand-primary dark:text-brand-light font-medium';
  const inactiveClasses = 'text-gray-700 dark:text-dark-text-primary hover:text-brand-primary dark:hover:text-brand-light';
  
  return (
    <Link 
      href={href} 
      className={`${baseClasses} ${active ? activeClasses : inactiveClasses}`}
      onClick={onClick}
      onMouseEnter={() => mounted && setIsHovered(true)}
      onMouseLeave={() => mounted && setIsHovered(false)}
    >
      {/* Always render the same structure on server and client */}
      {children}
      
      {/* Always render with conditional visibility rather than conditional rendering */}
      <span 
        className={`absolute -bottom-1 left-1/2 w-1 h-1 rounded-full transform -translate-x-1/2 ${
          mounted && active 
            ? 'bg-brand-primary dark:bg-brand-light' 
            : mounted && !active && isHovered 
              ? 'bg-gray-400/60 dark:bg-gray-400/40' 
              : 'opacity-0'
        }`}
        aria-hidden="true"
      />
      
      {/* Background always exists but is conditionally styled */}
      <span 
        className={`absolute inset-0 rounded-full -z-10 ${
          active ? 'bg-gray-200/30 dark:bg-white/5' : ''
        }`}
        aria-hidden="true"
      />
    </Link>
  );
} 