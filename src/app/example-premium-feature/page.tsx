'use client';

import { useState } from 'react';
import PaidFeatureGate from '@/components/features/PaidFeatureGate';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';

export default function ExamplePremiumFeaturePage() {
  const [data, setData] = useState<string[]>([
    'Premium market analysis',
    'AI trading signals',
    'Real-time price alerts',
    'Advanced portfolio analytics'
  ]);

  return (
    <div className="container max-w-5xl mx-auto py-12 px-4">
      <h1 className="text-3xl font-bold mb-6">Premium Features Demo</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
        {/* Public feature available to all users */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Basic Feature</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            This content is available to all users, both free and paid.
          </p>
          <Button>Access Basic Feature</Button>
        </Card>
        
        {/* Premium feature with paywall */}
        <PaidFeatureGate>
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Premium Feature</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              This content is only visible to users with a paid subscription.
            </p>
            <Button>Access Premium Feature</Button>
          </Card>
        </PaidFeatureGate>
      </div>
      
      <h2 className="text-2xl font-semibold mb-6">Premium Data</h2>
      
      <PaidFeatureGate
        fallback={
          <div className="bg-gradient-to-b from-white to-gray-100 dark:from-gray-800 dark:to-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
            <h3 className="text-xl font-semibold mb-2">Premium Data</h3>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              Upgrade to access premium data including market analysis, AI trading signals, and more.
            </p>
            <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-md mb-4 blur-sm select-none">
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-2"></div>
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-2"></div>
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-2"></div>
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
            </div>
            <Button className="w-full">Upgrade Now</Button>
          </div>
        }
      >
        <Card className="p-6">
          <h3 className="text-xl font-semibold mb-4">Premium Data</h3>
          <div className="space-y-3 mb-6">
            {data.map((item, index) => (
              <div key={index} className="flex items-center">
                <div className="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 p-1 rounded-full mr-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <span>{item}</span>
              </div>
            ))}
          </div>
          <Button className="w-full">View Detailed Analysis</Button>
        </Card>
      </PaidFeatureGate>
    </div>
  );
} 