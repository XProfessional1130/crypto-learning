'use client';

import Link from 'next/link';
import { ReactNode } from 'react';

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
  const baseClasses = className || 'inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-all duration-200';
  const activeClasses = active 
    ? (activeClassName || 'border-brand-primary nav-link-active') 
    : 'border-transparent nav-link hover:border-brand-primary/30';
  
  return (
    <Link 
      href={href} 
      className={`${baseClasses} ${active ? activeClasses : ''}`}
      onClick={onClick}
    >
      {children}
    </Link>
  );
} 