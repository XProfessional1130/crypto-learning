'use client';

import { ReactNode } from 'react';
import usePaidFeatureAccess from '@/hooks/auth/usePaidFeatureAccess';
import { useAuth } from '@/hooks/auth/useAuth';
import Link from 'next/link';

interface PaidFeatureGateProps {
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * Component that renders its children only if the user has access to paid features.
 * Otherwise, it renders a fallback or a default upgrade message.
 */
export default function PaidFeatureGate({ 
  children, 
  fallback 
}: PaidFeatureGateProps) {
  const { user } = useAuth();
  const hasPaidAccess = usePaidFeatureAccess();
  
  // If user has paid access, render children
  if (hasPaidAccess) {
    return <>{children}</>;
  }
  
  // If fallback is provided, render it
  if (fallback) {
    return <>{fallback}</>;
  }
  
  // Default fallback with upgrade prompt
  return (
    <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 text-center">
      <h3 className="text-lg font-semibold mb-2">Premium Feature</h3>
      <p className="text-gray-600 dark:text-gray-300 mb-4">
        This feature is available to premium members only.
      </p>
      {user ? (
        <Link 
          href="/membership" 
          className="inline-flex items-center justify-center px-4 py-2 bg-brand-primary hover:bg-brand-600 text-white rounded-md font-medium transition-colors"
        >
          Upgrade Now
        </Link>
      ) : (
        <div className="space-y-2">
          <Link 
            href="/auth/signin?redirect=/membership" 
            className="inline-flex items-center justify-center px-4 py-2 bg-brand-primary hover:bg-brand-600 text-white rounded-md font-medium transition-colors"
          >
            Sign In
          </Link>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Don't have an account?{' '}
            <Link href="/auth/signup" className="text-brand-primary hover:text-brand-600">
              Sign Up
            </Link>
          </p>
        </div>
      )}
    </div>
  );
} 