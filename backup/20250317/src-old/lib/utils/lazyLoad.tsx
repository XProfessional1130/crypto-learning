import React, { lazy, Suspense, ComponentType } from 'react';
import LoadingSpinner from '@/components/LoadingSpinner';

interface LazyLoadOptions {
  fallback?: React.ReactNode;
  errorComponent?: React.ReactNode;
}

/**
 * lazyLoad - Utility for lazy loading components with a loading fallback
 * @param importFn - Function that imports the component
 * @param options - Options for lazy loading
 */
export function lazyLoad<T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  options: LazyLoadOptions = {}
): React.ComponentType<React.ComponentProps<T>> {
  const LazyComponent = lazy(importFn);
  
  const { 
    fallback = <LoadingSpinner size="medium" text="Loading..." />,
    errorComponent = <div>Failed to load component</div>
  } = options;
  
  return function LazyLoadedComponent(props: React.ComponentProps<T>) {
    return (
      <Suspense fallback={fallback}>
        <ErrorBoundary fallback={errorComponent}>
          <LazyComponent {...props} />
        </ErrorBoundary>
      </Suspense>
    );
  };
}

/**
 * Simple error boundary for lazy loaded components
 */
class ErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode; fallback: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error loading lazy component:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }

    return this.props.children;
  }
} 