import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/providers/auth-provider';
import { NAV_ITEMS } from '@/lib/config/navigation';
import type { NavItem } from '@/types/components/navigation';

export function useNavigation() {
  const { user, signOut } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  // Get visible nav items based on auth state
  const visibleNavItems = NAV_ITEMS.filter(item => item.public || user);

  const handleSignOut = async () => {
    await signOut();
    setMobileMenuOpen(false);
  };

  const toggleMobileMenu = () => setMobileMenuOpen(!mobileMenuOpen);
  const closeMobileMenu = () => setMobileMenuOpen(false);

  return {
    user,
    pathname,
    visibleNavItems,
    mobileMenuOpen,
    handleSignOut,
    toggleMobileMenu,
    closeMobileMenu,
  };
} 