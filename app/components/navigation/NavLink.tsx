'use client';

import Link from 'next/link';
import { ReactNode } from 'react';

interface NavLinkProps {
  children: ReactNode;
  href: string;
  active: boolean;
  onClick?: () => void;
}

export default function NavLink({ 
  children, 
  href, 
  active, 
  onClick 
}: NavLinkProps) {
  const baseClasses = 'inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-all duration-200';
  const activeClasses = active 
    ? 'border-brand-primary nav-link-active' 
    : 'border-transparent nav-link hover:border-brand-primary/30';
  
  return (
    <Link 
      href={href} 
      className={`${baseClasses} ${activeClasses}`}
      onClick={onClick}
    >
      {children}
    </Link>
  );
} 