import { NavItem } from '@/types/components/navigation';

export const NAV_ITEMS: NavItem[] = [
  { name: 'Home', href: '/', public: true },
  { name: 'Dashboard', href: '/dashboard', public: false },
  { name: 'Hub', href: '/lc-dashboard', public: false },
  // Chat is now accessible via a global bubble
  { name: 'Resources', href: '/resources', public: true },
  { name: 'Discounts', href: '/discounts', public: true },
  { name: 'About', href: '/about', public: true },
]; 