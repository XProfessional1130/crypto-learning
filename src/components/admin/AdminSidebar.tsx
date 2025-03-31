'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { 
  LayoutDashboard,
  FileText,
  Tags,
  Users,
  Settings,
  Mail,
  Image,
  Tag,
  BarChart
} from 'lucide-react';

const navItems = [
  { name: 'Dashboard', href: '/admin-platform', icon: LayoutDashboard },
  { name: 'Content', href: '/admin-platform/content', icon: FileText },
  { name: 'Categories', href: '/admin-platform/categories', icon: Tags },
  { name: 'Tags', href: '/admin-platform/tags', icon: Tag },
  { name: 'Media', href: '/admin-platform/media', icon: Image },
  { name: 'Members', href: '/admin-platform/members', icon: Users },
  { name: 'Emails', href: '/admin-platform/emails', icon: Mail },
  { name: 'Analytics', href: '/admin-platform/analytics', icon: BarChart },
  { name: 'Settings', href: '/admin-platform/settings', icon: Settings },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 h-screen bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex-shrink-0">
      <div className="h-16 flex items-center px-6 border-b border-gray-200 dark:border-gray-700">
        <Link 
          href="/admin-platform" 
          className="text-xl font-semibold text-gray-900 dark:text-white hover:text-brand-primary dark:hover:text-brand-light transition-colors"
        >
          LC Platform
        </Link>
      </div>
      <div className="p-4 overflow-y-auto h-[calc(100vh-4rem)]">
        <ul className="space-y-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`);
            
            return (
              <li key={item.name}>
                <Link
                  href={item.href}
                  className={`flex items-center p-3 rounded-lg transition-colors ${
                    isActive 
                      ? 'bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-400' 
                      : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                  }`}
                >
                  <item.icon className={`w-5 h-5 ${
                    isActive 
                      ? 'text-brand-600 dark:text-brand-400' 
                      : 'text-gray-500 dark:text-gray-400'
                  }`} />
                  <span className="ml-3 font-medium">{item.name}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </aside>
  );
} 