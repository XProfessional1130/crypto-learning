'use client';

import { AdminAuthWrapper } from '@/components/admin/AdminAuthWrapper';
import ThemeLogo from '@/components/ui/ThemeLogo';
import { usePathname, useRouter } from 'next/navigation';
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
import { createContext, useContext, useState, useEffect } from 'react';
import AdminWrapper from '../AdminWrapper';

// Tell Next.js this is a root layout
export const runtime = 'edge';
export const preferredRegion = 'auto';

// Admin navigation items
const navItems = [
  { id: 'dashboard', name: 'Dashboard', icon: LayoutDashboard },
  { id: 'content', name: 'Content', icon: FileText },
  { id: 'categories', name: 'Categories', icon: Tags },
  { id: 'tags', name: 'Tags', icon: Tag },
  { id: 'media', name: 'Media', icon: Image },
  { id: 'members', name: 'Members', icon: Users },
  { id: 'emails', name: 'Emails', icon: Mail },
  { id: 'analytics', name: 'Analytics', icon: BarChart },
  { id: 'settings', name: 'Settings', icon: Settings },
];

// Create context for active tab state
type AdminContextType = {
  activeTab: string;
  setActiveTab: (tab: string) => void;
};

const AdminContext = createContext<AdminContextType | undefined>(undefined);

export function useAdmin() {
  const context = useContext(AdminContext);
  if (!context) {
    throw new Error('useAdmin must be used within an AdminProvider');
  }
  return context;
}

// Creating a root layout
export default function Layout({
  children
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const initialTab = pathname.split('/').pop() || 'dashboard';
  const [activeTab, setActiveTab] = useState(initialTab);
  const { user, loading } = useAuth();

  // Redirect if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      // User is not authenticated, redirect to login
      router.push(`/auth/signin?redirect=${encodeURIComponent('/admin-platform')}`);
    }
  }, [user, loading, router]);
  
  // Update active tab when pathname changes
  useEffect(() => {
    const currentTab = pathname.split('/').pop() || 'dashboard';
    setActiveTab(currentTab);
  }, [pathname]);

  // Show loading state while checking auth
  if (loading) {
    return (
      <div className="min-h-screen w-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-600"></div>
      </div>
    );
  }

  // If not authenticated and not loading, don't render anything
  // The redirect will handle this case
  if (!user) {
    return null;
  }

  return (
    <AdminContext.Provider value={{ activeTab, setActiveTab }}>
      <div className="min-h-screen w-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white flex overflow-hidden">
        {/* Admin Sidebar - with premium look and feel */}
        <aside className="w-72 bg-white dark:bg-gray-800 border-r border-gray-100 dark:border-gray-700 shadow-lg min-h-screen flex-shrink-0 transition-all duration-300 ease-in-out">
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
    </AdminContext.Provider>
  );
}

// Sub-components to improve organization and readability
function AdminNavItem({ item }: { item: { id: string; name: string; icon: any } }) {
  const { activeTab, setActiveTab } = useAdmin();
  const router = useRouter();
  const pathname = usePathname();
  const isActive = pathname.includes(`/admin-platform/${item.id}`);
  const Icon = item.icon;
  
  const handleClick = () => {
    setActiveTab(item.id);
    router.push(`/admin-platform/${item.id === 'dashboard' ? '' : item.id}`, { scroll: false });
  };
  
  return (
    <button
      onClick={handleClick}
      className={`w-full flex items-center px-3 py-3 rounded-lg transition-all ${
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
    </button>
  );
}

function AdminProfileSection() {
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

function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  
  return (
    <button
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      className="w-full flex items-center px-3 py-3 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors"
    >
      {theme === 'dark' ? (
        <>
          <Sun className="w-5 h-5 mr-3 text-gray-500 dark:text-gray-400" />
          Light Mode
        </>
      ) : (
        <>
          <Moon className="w-5 h-5 mr-3 text-gray-500 dark:text-gray-400" />
          Dark Mode
        </>
      )}
    </button>
  );
}

function SignOutButton() {
  const { signOut } = useAuth();
  
  return (
    <button
      onClick={signOut}
      className="w-full flex items-center px-3 py-3 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors mt-2"
    >
      <LogOut className="w-5 h-5 mr-3 text-gray-500 dark:text-gray-400" />
      Sign Out
    </button>
  );
} 