'use client';

import { ReactNode } from 'react';
import Container from './Container';

interface SectionProps {
  children: ReactNode;
  className?: string;
  background?: 'white' | 'light' | 'dark' | 'primary' | 'brand' | 'glass' | 'none';
  spacing?: 'sm' | 'md' | 'lg' | 'xl' | 'none';
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
    white: 'bg-light-bg-primary dark:bg-dark-bg-primary',
    light: 'bg-light-bg-secondary dark:bg-dark-bg-secondary',
    dark: 'bg-dark-bg-primary text-dark-text-primary',
    primary: 'bg-brand-primary/95 text-white',
    brand: 'bg-brand-gradient text-white',
    glass: 'glass',
    none: '',
  };
  
  // Spacing styles
  const spacingStyles = {
    none: '',
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