'use client';

import Link from 'next/link';
import { cn } from '@/lib/utils/classnames';
import type { NavLinkProps } from '@/types/components/navigation';

export default function NavLink({ href, active, children, className, onClick }: NavLinkProps) {
  return (
    <Link
      href={href}
      className={cn(
        'inline-flex items-center border-b-2 px-1 pt-1 text-sm font-medium transition-colors',
        active
          ? 'border-brand-primary text-light-text-primary dark:text-dark-text-primary'
          : 'border-transparent text-light-text-secondary dark:text-dark-text-secondary hover:border-brand-primary/30 hover:text-light-text-primary dark:hover:text-dark-text-primary',
        className
      )}
      onClick={onClick}
    >
      {children}
    </Link>
  );
} 