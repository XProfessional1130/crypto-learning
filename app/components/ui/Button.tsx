'use client';

import Link from 'next/link';
import { ReactNode } from 'react';

interface ButtonProps {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'glass';
  size?: 'sm' | 'md' | 'lg';
  href?: string;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  type?: 'button' | 'submit' | 'reset';
}

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  href,
  onClick,
  disabled = false,
  className = '',
  type = 'button',
}: ButtonProps) {
  const baseStyles = 'inline-flex items-center justify-center font-medium transition-all duration-200 rounded-lg focus:outline-none focus:ring-2 shadow-sm hover:shadow-md';
  
  const variantStyles = {
    primary: 'bg-brand-primary hover:bg-brand-dark text-white focus:ring-brand-primary',
    secondary: 'bg-white hover:bg-gray-50 text-gray-900 focus:ring-brand-primary',
    outline: 'border-2 border-brand-primary bg-transparent text-brand-primary hover:bg-brand-primary/10 dark:hover:bg-brand-primary/20 focus:ring-brand-primary',
    ghost: 'bg-transparent hover:bg-white/10 dark:hover:bg-dark-bg-accent/20 text-light-text-primary dark:text-dark-text-primary focus:ring-brand-primary',
    glass: 'bg-glass-white backdrop-blur-md dark:bg-glass-dark border border-white/10 dark:border-dark-bg-accent/20 text-light-text-primary dark:text-dark-text-primary hover:bg-white/80 dark:hover:bg-dark-bg-accent/70 focus:ring-brand-primary',
  };

  const sizeStyles = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  };

  const disabledStyles = disabled ? 'opacity-50 cursor-not-allowed' : '';

  const styles = `${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${disabledStyles} ${className}`;

  if (href) {
    return (
      <Link href={href} className={styles}>
        {children}
      </Link>
    );
  }

  return (
    <button
      type={type}
      className={styles}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
} 