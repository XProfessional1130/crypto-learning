'use client';

import Link from 'next/link';
import { ReactNode, useState } from 'react';

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

  const baseClasses = className || 'relative inline-flex items-center px-3 py-1.5 text-sm font-medium transition-all duration-300 rounded-full hover:bg-gray-200/40 dark:hover:bg-white/5';
  
  const activeClasses = activeClassName || 'bg-gray-200/50 dark:bg-white/10 text-brand-primary dark:text-brand-light font-medium shadow-sm';
  const inactiveClasses = 'text-gray-700 dark:text-dark-text-primary hover:text-brand-primary dark:hover:text-brand-light';
  
  return (
    <Link 
      href={href} 
      className={`${baseClasses} ${active ? activeClasses : inactiveClasses}`}
      onClick={(e) => {
        // Add a tiny ripple effect
        const target = e.currentTarget;
        const circle = document.createElement('span');
        const diameter = Math.max(target.clientWidth, target.clientHeight);
        
        circle.style.width = circle.style.height = `${diameter}px`;
        circle.style.position = 'absolute';
        circle.style.borderRadius = '50%';
        circle.style.transform = 'scale(0)';
        circle.style.backgroundColor = 'rgba(255, 255, 255, 0.4)';
        circle.style.pointerEvents = 'none';
        circle.style.transition = 'all 0.5s ease-out';
        
        const rect = target.getBoundingClientRect();
        circle.style.left = `${e.clientX - rect.left - diameter / 2}px`;
        circle.style.top = `${e.clientY - rect.top - diameter / 2}px`;
        
        target.appendChild(circle);
        
        requestAnimationFrame(() => {
          circle.style.transform = 'scale(1)';
          circle.style.opacity = '0';
          
          setTimeout(() => {
            circle.remove();
          }, 500);
        });
        
        if (onClick) onClick();
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {children}
      
      {/* Hover indicator animation - shows only when not active */}
      {!active && (
        <span 
          className={`absolute bottom-0 left-1/2 right-1/2 h-0.5 bg-brand-primary/30 dark:bg-brand-light/30 rounded-full transform transition-all duration-300 ${
            isHovered ? 'w-1/2 left-1/4 right-1/4' : 'w-0'
          }`}
        ></span>
      )}
    </Link>
  );
} 