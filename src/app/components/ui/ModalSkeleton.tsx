import React from 'react';
import { Skeleton } from './skeleton';

type ModalSkeletonProps = {
  headerHeight?: number;
  contentItems?: number;
  footerHeight?: number;
  itemHeight?: number;
  className?: string;
};

/**
 * A reusable skeleton loader for modal components
 * This can be used to show loading states in various modal components
 */
export function ModalSkeleton({
  headerHeight = 40,
  contentItems = 5,
  footerHeight = 50,
  itemHeight = 40,
  className = '',
}: ModalSkeletonProps) {
  return (
    <div className={`space-y-4 animate-pulse ${className}`}>
      {/* Modal header skeleton */}
      <div className="flex justify-between items-center">
        <Skeleton className={`h-${headerHeight / 10} w-1/3 rounded-md`} />
        <Skeleton className="h-6 w-6 rounded-full" />
      </div>
      
      {/* Modal content skeleton */}
      <div className="space-y-3">
        {Array(contentItems).fill(0).map((_, index) => (
          <div key={index} className="flex items-center justify-between">
            <Skeleton className={`h-${itemHeight / 10} w-${index % 2 ? '1/2' : '1/3'} rounded-md`} />
            <Skeleton className={`h-${itemHeight / 10} w-${index % 2 ? '1/4' : '1/3'} rounded-md`} />
          </div>
        ))}
      </div>
      
      {/* Modal footer skeleton */}
      <div className="flex justify-end space-x-2">
        <Skeleton className={`h-${footerHeight / 10} w-1/4 rounded-md`} />
        <Skeleton className={`h-${footerHeight / 10} w-1/4 rounded-md`} />
      </div>
    </div>
  );
}

/**
 * A skeleton for form inputs to show loading states in modals with forms
 */
export function FormInputSkeleton() {
  return (
    <div className="space-y-1">
      <Skeleton className="h-3 w-1/4 rounded-md" />
      <Skeleton className="h-10 w-full rounded-md" />
    </div>
  );
}

/**
 * A skeleton for asset items in lists to show loading states
 */
export function AssetItemSkeleton() {
  return (
    <div className="flex items-center justify-between p-3 border-b border-gray-100 dark:border-gray-700">
      <div className="flex items-center gap-3">
        <Skeleton className="h-8 w-8 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-20 rounded-md" />
          <Skeleton className="h-3 w-16 rounded-md" />
        </div>
      </div>
      <div className="space-y-2">
        <Skeleton className="h-4 w-16 rounded-md" />
        <Skeleton className="h-3 w-12 rounded-md" />
      </div>
    </div>
  );
} 