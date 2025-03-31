'use client';

import { usePathname } from 'next/navigation';

/**
 * Navigation - Main navigation component
 */
export default function Navigation() {
  const pathname = usePathname();
  
  // Don't render navigation on admin pages
  if (pathname?.startsWith('/admin-platform')) {
    return null;
  }

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
      {/* Navigation content */}
    </nav>
  );
} 