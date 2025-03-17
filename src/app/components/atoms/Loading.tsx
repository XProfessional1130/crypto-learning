'use client';

import { cn } from '@/lib/utils/classnames';

interface LoadingProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  fullScreen?: boolean;
}

const sizes = {
  sm: 'h-4 w-4',
  md: 'h-8 w-8',
  lg: 'h-12 w-12',
};

export default function Loading({ size = 'md', className, fullScreen }: LoadingProps) {
  const Spinner = (
    <div
      className={cn(
        'relative animate-spin rounded-full border-2 border-current border-t-transparent text-brand-primary',
        sizes[size],
        className
      )}
    >
      <span className="sr-only">Loading...</span>
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 dark:bg-black/80">
        {Spinner}
      </div>
    );
  }

  return Spinner;
} 