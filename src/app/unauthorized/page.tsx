'use client';

import Button from '@/components/ui/Button';
import { useRouter } from 'next/navigation';
import { Shield, AlertTriangle } from 'lucide-react';

export default function UnauthorizedPage() {
  const router = useRouter();
  
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="w-full max-w-md p-8 space-y-6 bg-white dark:bg-gray-800 shadow-md rounded-lg text-center">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20">
          <Shield className="h-10 w-10 text-red-600 dark:text-red-500" />
        </div>
        
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Access Denied
        </h1>
        
        <div className="flex items-center justify-center space-x-2 text-amber-500 bg-amber-50 dark:bg-amber-950/20 p-3 rounded-md">
          <AlertTriangle className="h-5 w-5" />
          <p className="text-sm">You don't have permission to access this area.</p>
        </div>
        
        <p className="text-gray-600 dark:text-gray-400">
          This section is restricted to administrators only. If you believe you should have access, please contact support.
        </p>
        
        <div className="pt-4">
          <Button 
            onClick={() => router.push('/')}
            className="w-full"
          >
            Return to Homepage
          </Button>
        </div>
      </div>
    </div>
  );
} 