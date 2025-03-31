'use client';

import { usePathname } from 'next/navigation';
import NavigationContainer from '@/components/features/navigation/NavigationContainer';

/**
 * Navigation - Main navigation component
 * This is now a wrapper around the more modular NavigationContainer
 * Does not render navigation in the admin dashboard
 */
export default function Navigation() {
  const pathname = usePathname();
  
  // Don't render navigation on admin pages
  if (pathname?.startsWith('/admin-platform')) {
    return null;
  }

  return <NavigationContainer />;
} 