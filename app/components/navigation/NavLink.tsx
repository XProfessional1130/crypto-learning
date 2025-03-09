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
  const baseClasses = 'inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium';
  const activeClasses = active 
    ? 'border-brand-primary text-brand-primary dark:text-brand-light' 
    : 'border-transparent text-light-text-secondary dark:text-dark-text-secondary hover:border-light-bg-accent dark:hover:border-dark-bg-accent hover:text-light-text-primary dark:hover:text-dark-text-primary';
  
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