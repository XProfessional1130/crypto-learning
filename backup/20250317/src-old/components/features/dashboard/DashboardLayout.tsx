import { ReactNode, useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import LoadingSpinner from '@/components/LoadingSpinner';

interface DashboardLayoutProps {
  children: ReactNode;
  title?: string;
  showTitle?: boolean;
}

export default function DashboardLayout({ children, title = "Dashboard", showTitle = true }: DashboardLayoutProps) {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [showContent, setShowContent] = useState(false);
  
  // Check authentication and redirect if needed
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/signin');
    }
  }, [user, authLoading, router]);
  
  // Add a smooth transition for the main content
  useEffect(() => {
    if (!authLoading && user) {
      const timer = setTimeout(() => {
        setShowContent(true);
      }, 300);
      
      return () => clearTimeout(timer);
    }
  }, [authLoading, user]);

  // Loading state
  if (authLoading) {
    return (
      <div className="flex min-h-[calc(100vh-16rem)] items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300 animate-pulse">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  // Redirect case (handled by the effect, this is a fallback)
  if (!user) {
    return null;
  }

  return (
    <main className={`container mx-auto px-4 py-8 transition-opacity-transform duration-600 ${showContent ? 'opacity-100' : 'opacity-0'}`}>
      {showTitle && <h1 className="text-3xl font-bold mb-6">{title}</h1>}
      {children}
    </main>
  );
} 