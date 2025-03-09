import { NavItem } from '@/types/components/navigation';

export const NAV_ITEMS: NavItem[] = [
  { name: 'Home', href: '/', public: true },
  { name: 'Dashboard', href: '/dashboard', public: false },
  { name: 'LC Dashboard', href: '/lc-dashboard', public: false },
  { name: 'Chat', href: '/chat', public: false },
  { name: 'Resources', href: '/resources', public: true },
  { name: 'Discounts', href: '/discounts', public: true },
  { name: 'About', href: '/about', public: true },
]; 