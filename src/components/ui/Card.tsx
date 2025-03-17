'use client';

import { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  variant?: 'default' | 'outlined' | 'elevated' | 'accent';
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export default function Card({
  children,
  className = '',
  variant = 'default',
  padding = 'md',
}: CardProps) {
  // Base styles
  const baseStyles = 'rounded-lg';
  
  // Variant styles
  const variantStyles = {
    default: 'bg-white',
    outlined: 'bg-white border border-gray-200',
    elevated: 'bg-white shadow-lg',
    accent: 'bg-white border-l-4 border-brand-primary shadow-sm',
  };
  
  // Padding styles
  const paddingStyles = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  };
  
  // Combine all styles
  const cardStyles = `${baseStyles} ${variantStyles[variant]} ${paddingStyles[padding]} ${className}`;
  
  return (
    <div className={cardStyles}>
      {children}
    </div>
  );
} 