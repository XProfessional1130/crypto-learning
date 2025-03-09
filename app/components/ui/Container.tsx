'use client';

import { ReactNode } from 'react';

interface ContainerProps {
  children: ReactNode;
  className?: string;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
  padding?: boolean;
}

export default function Container({
  children,
  className = '',
  maxWidth = 'xl',
  padding = true,
}: ContainerProps) {
  // Max width styles
  const maxWidthStyles = {
    sm: 'max-w-screen-sm',
    md: 'max-w-screen-md',
    lg: 'max-w-screen-lg',
    xl: 'max-w-screen-xl',
    '2xl': 'max-w-screen-2xl',
    'full': 'max-w-full',
  };
  
  // Padding styles
  const paddingStyles = padding ? 'px-4 sm:px-6 lg:px-8' : '';
  
  // Combine all styles
  const containerStyles = `mx-auto ${maxWidthStyles[maxWidth]} ${paddingStyles} ${className}`;
  
  return (
    <div className={containerStyles}>
      {children}
    </div>
  );
} 