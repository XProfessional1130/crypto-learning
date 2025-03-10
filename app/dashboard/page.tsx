'use client';

import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import PortfolioDashboard from '../components/dashboard/PortfolioDashboard';

export default function Dashboard() {
  const { user, loading } = useAuth();
  const router = useRouter();

  if (loading) {
    return (
      <div className="flex min-h-[calc(100vh-16rem)] items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!user) {
    router.push('/auth/signin');
    return null;
  }

  return <PortfolioDashboard />;
} 