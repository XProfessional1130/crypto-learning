'use client';

import Button from '@/components/ui/Button';
import { useRouter, useSearchParams } from 'next/navigation';
import { XCircle } from 'lucide-react';

export default function ErrorPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const errorMessage = searchParams.get('message') || 'An unexpected error occurred';
  
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="w-full max-w-md p-8 space-y-6 bg-white dark:bg-gray-800 shadow-md rounded-lg text-center">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20">
          <XCircle className="h-10 w-10 text-red-600 dark:text-red-500" />
        </div>
        
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Error
        </h1>
        
        <p className="text-gray-600 dark:text-gray-400">
          {errorMessage}
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