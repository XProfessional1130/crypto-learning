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
  // Use useEffect for client-side only behaviors to prevent hydration mismatches
  const [mounted, setMounted] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  // Only enable hover effects after initial client render to prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  const baseClasses = className || 'relative flex items-center px-3 py-1.5 text-sm font-medium transition-colors duration-200 rounded-full hover:bg-gray-200/40 dark:hover:bg-white/5';
  
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
      <div className="relative z-10">
        {children}
        
        {/* Only render these elements after hydration to prevent mismatch */}
        {mounted && active && (
          <span className="absolute -bottom-1 left-1/2 w-1 h-1 bg-brand-primary dark:bg-brand-light rounded-full transform -translate-x-1/2"></span>
        )}
        
        {mounted && !active && isHovered && (
          <span className="absolute -bottom-1 left-1/2 w-1 h-1 bg-gray-400/60 dark:bg-gray-400/40 rounded-full transform -translate-x-1/2"></span>
        )}
      </div>
      
      {/* Background highlight - server/client safe, no animation or state dependency */}
      {active && (
        <span className="absolute inset-0 rounded-full bg-gray-200/30 dark:bg-white/5 -z-10"></span>
      )}
    </Link>
  );
} 