'use client';

import React from 'react';

interface ResourceSkeletonProps {
  count?: number;
}

export const ResourceListSkeleton: React.FC<ResourceSkeletonProps> = ({ count = 3 }) => {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, index) => (
        <ResourceCardSkeleton key={index} />
      ))}
    </div>
  );
};

export const ResourceCardSkeleton: React.FC = () => {
  return (
    <div className="neo-glass neo-glass-before rounded-xl overflow-hidden animate-pulse">
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="h-5 w-16 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
        </div>
        <div className="h-6 w-3/4 bg-gray-200 dark:bg-gray-700 rounded mb-3"></div>
        <div className="h-4 w-full bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
        <div className="h-4 w-5/6 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
        <div className="h-4 w-4/6 bg-gray-200 dark:bg-gray-700 rounded"></div>
      </div>
      <div className="border-t border-white/10 dark:border-dark-bg-accent/20 p-4">
        <div className="h-10 w-full bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
      </div>
    </div>
  );
}; 