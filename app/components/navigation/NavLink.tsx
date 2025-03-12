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
  // Client-side state
  const [mounted, setMounted] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

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
      <div className="relative">
        {children}
        
        {/* The indicator is positioned relative to this div */}
        {mounted && (
          <div className="absolute bottom-[-6px] inset-x-0 flex justify-center">
            <div className={`w-1 h-1 rounded-full ${
              active 
                ? 'bg-brand-primary dark:bg-brand-light'
                : isHovered
                  ? 'bg-gray-400/60 dark:bg-gray-400/40'
                  : 'bg-transparent'
            }`} />
          </div>
        )}
      </div>
      
      {/* Background highlight */}
      {active && (
        <span className="absolute inset-0 rounded-full bg-gray-200/30 dark:bg-white/5 -z-10" aria-hidden="true" />
      )}
    </Link>
  );
} 