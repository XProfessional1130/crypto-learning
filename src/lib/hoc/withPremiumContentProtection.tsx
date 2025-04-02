'use client';

import React from 'react';
import usePaidFeatureAccess from '@/hooks/auth/usePaidFeatureAccess';
import { useAuth } from '@/hooks/auth/useAuth';
import Link from 'next/link';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

interface PremiumContentProps {
  /**
   * Flag indicating if this content is premium (paid) content
   */
  isPremium?: boolean;
  
  /**
   * Preview content to show to non-paid users
   */
  preview?: React.ReactNode;
  
  /**
   * Any other props that the wrapped component needs
   */
  [key: string]: any;
}

/**
 * Higher-Order Component (HOC) that protects premium content
 * Shows a preview or paywall for free users, and the full content for paid users
 */
export function withPremiumContentProtection<P extends PremiumContentProps>(
  WrappedComponent: React.ComponentType<P>
) {
  const WithPremiumContentProtection = (props: P) => {
    const { isPremium = false, preview, ...rest } = props;
    const { user, loading: authLoading } = useAuth();
    const hasPaidAccess = usePaidFeatureAccess();

    // If content is not premium, render the component normally
    if (!isPremium) {
      return <WrappedComponent {...props} />;
    }
    
    // Show loading state while checking authentication and access
    if (authLoading) {
      return (
        <div className="flex items-center justify-center min-h-[50vh]">
          <LoadingSpinner size="large" text="Loading content..." />
        </div>
      );
    }
    
    // If user has paid access, render the full component
    if (hasPaidAccess) {
      return <WrappedComponent {...props} />;
    }
    
    // If preview is provided, show it for free users
    if (preview) {
      return (
        <div className="premium-content-preview">
          {preview}
          <div className="bg-gradient-to-b from-white to-gray-100 dark:from-gray-800 dark:to-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-6 my-6">
            <h3 className="text-xl font-semibold mb-2">Premium Content</h3>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              This content is available to premium members only.
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
                  href={`/auth/signin?redirect=${encodeURIComponent(window.location.pathname)}`}
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
        </div>
      );
    }
    
    // Default paywall for free users (no preview)
    return (
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 min-h-[50vh] flex flex-col items-center justify-center text-center">
        <h2 className="text-2xl font-bold mb-4">Premium Content</h2>
        <p className="text-gray-600 dark:text-gray-300 mb-6 max-w-md">
          This content is exclusive to premium members. Upgrade your account to access our advanced resources and features.
        </p>
        {user ? (
          <Link 
            href="/membership" 
            className="inline-flex items-center justify-center px-6 py-3 bg-brand-primary hover:bg-brand-600 text-white rounded-md font-medium transition-colors"
          >
            Upgrade Now
          </Link>
        ) : (
          <div className="space-y-4">
            <Link 
              href={`/auth/signin?redirect=${encodeURIComponent(window.location.pathname)}`}
              className="inline-flex items-center justify-center px-6 py-3 bg-brand-primary hover:bg-brand-600 text-white rounded-md font-medium transition-colors"
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
  };

  // Set display name for debugging
  const wrappedComponentName = WrappedComponent.displayName || WrappedComponent.name || 'Component';
  WithPremiumContentProtection.displayName = `withPremiumContentProtection(${wrappedComponentName})`;
  
  return WithPremiumContentProtection as React.ComponentType<P>;
}

export default withPremiumContentProtection; 