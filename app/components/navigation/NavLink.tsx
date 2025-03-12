'use client';

import Link from 'next/link';
import { ReactNode, useState, useRef, useEffect } from 'react';

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
  const [isHovered, setIsHovered] = useState(false);
  const [rippleActive, setRippleActive] = useState(false);
  const [ripplePosition, setRipplePosition] = useState({ x: 0, y: 0 });
  const linkRef = useRef<HTMLAnchorElement>(null);
  
  // Clean up ripple effect after animation completes
  useEffect(() => {
    if (rippleActive) {
      const timer = setTimeout(() => {
        setRippleActive(false);
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [rippleActive]);

  const baseClasses = className || 'relative inline-flex items-center px-3 py-1.5 text-sm font-medium transition-all duration-300 rounded-full hover:bg-gray-200/40 dark:hover:bg-white/5';
  
  const activeClasses = activeClassName || 'text-brand-primary dark:text-brand-light font-medium';
  const inactiveClasses = 'text-gray-700 dark:text-dark-text-primary hover:text-brand-primary dark:hover:text-brand-light';
  
  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    // Get position for ripple
    if (linkRef.current) {
      const rect = linkRef.current.getBoundingClientRect();
      setRipplePosition({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      });
      setRippleActive(true);
    }
    
    if (onClick) onClick();
  };

  return (
    <Link 
      ref={linkRef}
      href={href} 
      className={`${baseClasses} ${active ? activeClasses : inactiveClasses} z-10`}
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {children}
      
      {/* Active background highlight with animation - using React state instead of DOM manipulation */}
      {active && (
        <span className="absolute inset-0 rounded-full bg-gray-200/50 dark:bg-white/10 shadow-sm animate-softPulse z-0"></span>
      )}
      
      {/* Ripple effect - controlled by React state */}
      {rippleActive && (
        <span 
          className="absolute rounded-full bg-white/30 pointer-events-none animate-ripple-fade z-0"
          style={{
            left: ripplePosition.x - 50 + 'px',
            top: ripplePosition.y - 50 + 'px',
            width: '100px',
            height: '100px',
          }}
        />
      )}
      
      {/* Hover indicator animation - shows only when not active */}
      {!active && (
        <span 
          className={`absolute bottom-0 left-1/2 right-1/2 h-0.5 bg-brand-primary/30 dark:bg-brand-light/30 rounded-full transform transition-all duration-300 z-0 ${
            isHovered ? 'w-1/2 left-1/4 right-1/4' : 'w-0'
          }`}
        ></span>
      )}
    </Link>
  );
} 