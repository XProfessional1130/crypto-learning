'use client';

import { AdminAuthWrapper } from '@/components/admin/AdminAuthWrapper';
import ThemeLogo from '@/components/ui/ThemeLogo';
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
  BarChart,
  Moon,
  Sun,
  LogOut
} from 'lucide-react';
import { useTheme } from '@/lib/providers/theme-provider';
import { useAuth } from '@/lib/providers/auth-provider';
import { ThemeProvider } from '@/lib/providers/theme-provider';
import { AuthProvider } from "@/lib/providers/auth-provider";
import { DataCacheProvider } from "@/lib/providers/data-cache-provider";
import QueryProvider from "@/lib/providers/query-provider";
import { ModalProvider } from "@/lib/providers/modal-provider";
import { 
  AppEnhancer, 
  GlobalStyles, 
  AuthTokenScript, 
  BackgroundElements,
  DataPrefetcher
} from "@/app/components";

// Tell Next.js this is a root layout
export const runtime = 'edge';
export const preferredRegion = 'auto';

// Admin navigation items
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

// Creating a root layout
export default function Layout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning className="h-full">
      <body className="h-full antialiased overflow-x-hidden">
        <QueryProvider>
          <AuthProvider>
            <ThemeProvider>
              <DataCacheProvider>
                <ModalProvider>
                  <AppEnhancer />
                  <GlobalStyles />
                  <AuthTokenScript />
                  <DataPrefetcher />
                  <BackgroundElements />
                  <AdminAuthWrapper>
                    <div className="h-screen w-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white flex overflow-hidden">
                      {/* Admin Sidebar - with premium look and feel */}
                      <aside className="w-72 bg-white dark:bg-gray-800 border-r border-gray-100 dark:border-gray-700 shadow-lg h-screen flex-shrink-0 transition-all duration-300 ease-in-out">
                        {/* Logo area */}
                        <div className="h-20 flex items-center px-6 border-b border-gray-100 dark:border-gray-700">
                          <ThemeLogo width={150} height={38} className="mx-auto" />
                        </div>
                        
                        {/* Navigation menu */}
                        <div className="py-6 px-4 overflow-y-auto h-[calc(100vh-5rem)]">
                          <div className="mb-6">
                            <h3 className="text-xs uppercase font-semibold text-gray-500 dark:text-gray-400 px-3 mb-3 tracking-wider">
                              Platform Management
                            </h3>
                            <nav className="space-y-1">
                              {navItems.map((item) => (
                                <AdminNavItem key={item.name} item={item} />
                              ))}
                            </nav>
                          </div>
                          
                          <div className="mt-auto pt-6 border-t border-gray-100 dark:border-gray-700">
                            <ThemeToggle />
                            <SignOutButton />
                          </div>
                        </div>
                      </aside>
                      
                      {/* Main content area */}
                      <div className="flex-1 flex flex-col overflow-hidden">
                        {/* Admin Header */}
                        <header className="h-20 bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700 shadow-sm flex-shrink-0">
                          <div className="h-full px-8 flex items-center justify-between">
                            <h1 className="text-2xl font-semibold">Admin Platform</h1>
                            <div className="flex items-center">
                              <AdminProfileSection />
                            </div>
                          </div>
                        </header>
                        
                        {/* Main content with professional spacing and scrolling behavior */}
                        <main className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-900 p-8">
                          <div className="max-w-7xl mx-auto">
                            {children}
                          </div>
                        </main>
                      </div>
                    </div>
                  </AdminAuthWrapper>
                </ModalProvider>
              </DataCacheProvider>
            </ThemeProvider>
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}

// Sub-components to improve organization and readability

function AdminNavItem({ item }: { item: { name: string; href: string; icon: any } }) {
  'use client';
  const pathname = usePathname();
  const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`);
  const Icon = item.icon;
  
  return (
    <Link
      href={item.href}
      className={`flex items-center px-3 py-3 rounded-lg transition-all ${
        isActive 
          ? 'bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-400 font-medium'
          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/30'
      }`}
    >
      <Icon className={`w-5 h-5 mr-3 ${
        isActive 
          ? 'text-brand-600 dark:text-brand-400'
          : 'text-gray-500 dark:text-gray-400'
      }`} />
      {item.name}
    </Link>
  );
}

function ThemeToggle() {
  'use client';
  const { theme, toggleTheme } = useTheme();
  
  return (
    <button
      onClick={toggleTheme}
      className="flex items-center w-full px-3 py-3 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors"
    >
      {theme === 'dark' ? (
        <Sun className="w-5 h-5 mr-3 text-gray-500 dark:text-gray-400" />
      ) : (
        <Moon className="w-5 h-5 mr-3 text-gray-500 dark:text-gray-400" />
      )}
      {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
    </button>
  );
}

function SignOutButton() {
  'use client';
  const { signOut } = useAuth();
  
  return (
    <button
      onClick={() => signOut()}
      className="flex items-center w-full px-3 py-3 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors"
    >
      <LogOut className="w-5 h-5 mr-3 text-gray-500 dark:text-gray-400" />
      Sign Out
    </button>
  );
}

function AdminProfileSection() {
  'use client';
  const { user } = useAuth();
  
  if (!user) return null;
  
  return (
    <div className="flex items-center space-x-4">
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 rounded-full bg-brand-100 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400 flex items-center justify-center">
          <span className="text-lg font-medium">
            {user.email?.charAt(0).toUpperCase()}
          </span>
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-medium">
            {user.email?.split('@')[0]}
          </span>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            Administrator
          </span>
        </div>
      </div>
    </div>
  );
} 