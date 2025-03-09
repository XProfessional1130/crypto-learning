'use client';

import { ReactNode } from 'react';
import Link from 'next/link';

interface ButtonProps {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'outline' | 'text';
  size?: 'sm' | 'md' | 'lg';
  href?: string;
  onClick?: () => void;
  className?: string;
  type?: 'button' | 'submit' | 'reset';
  disabled?: boolean;
}

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  href,
  onClick,
  className = '',
  type = 'button',
  disabled = false,
}: ButtonProps) {
  // Base styles
  const baseStyles = 'inline-flex items-center justify-center font-medium rounded-md focus:outline-none transition-colors';
  
  // Size styles
  const sizeStyles = {
    sm: 'px-3 py-2 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  };
  
  // Variant styles
  const variantStyles = {
    primary: 'bg-brand-primary text-white hover:bg-brand-light focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-primary dark:hover:brightness-110',
    secondary: 'bg-light-bg-primary dark:bg-dark-bg-secondary text-brand-primary hover:bg-light-bg-accent dark:hover:bg-dark-bg-accent border border-brand-primary',
    outline: 'bg-transparent border border-current text-brand-primary hover:bg-brand-primary/10 dark:text-brand-light dark:hover:bg-brand-primary/20',
    text: 'bg-transparent text-brand-primary hover:text-brand-light dark:text-brand-light dark:hover:text-brand-primary',
  };
  
  // Disabled styles
  const disabledStyles = disabled ? 'opacity-50 cursor-not-allowed' : '';
  
  // Combine all styles
  const buttonStyles = `${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${disabledStyles} ${className}`;
  
  // Use Link for href, button otherwise
  if (href) {
    return (
      <Link href={href} className={buttonStyles}>
        {children}
      </Link>
    );
  }
  
  return (
    <button
      type={type}
      className={buttonStyles}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
} 