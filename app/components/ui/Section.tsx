'use client';

import { ReactNode } from 'react';
import Container from './Container';

interface SectionProps {
  children: ReactNode;
  className?: string;
  background?: 'white' | 'light' | 'dark' | 'primary' | 'none';
  spacing?: 'sm' | 'md' | 'lg' | 'xl';
  containerMaxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
}

export default function Section({
  children,
  className = '',
  background = 'white',
  spacing = 'lg',
  containerMaxWidth = 'xl',
}: SectionProps) {
  // Background styles
  const backgroundStyles = {
    white: 'bg-white',
    light: 'bg-gray-50',
    dark: 'bg-gray-900 text-white',
    primary: 'bg-indigo-700 text-white',
    none: '',
  };
  
  // Spacing styles
  const spacingStyles = {
    sm: 'py-8',
    md: 'py-12',
    lg: 'py-16 sm:py-24',
    xl: 'py-20 sm:py-32',
  };
  
  // Combine section styles
  const sectionStyles = `${backgroundStyles[background]} ${spacingStyles[spacing]} ${className}`;
  
  return (
    <section className={sectionStyles}>
      <Container maxWidth={containerMaxWidth}>
        {children}
      </Container>
    </section>
  );
} 