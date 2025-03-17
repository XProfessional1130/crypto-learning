import { memo, ReactNode } from 'react';

// Common formatting utilities 
export const formatCryptoPrice = (price: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(price);
};

// Memoized Stats Card component
export const StatsCard = memo(({ 
  title, 
  value, 
  icon = null, 
  dominance = null, 
  loading = false, 
  valueClassName = '', 
  changeInfo = null, 
  showChangeIcon = false,
  compact = false
}: {
  title: string;
  value: string;
  icon?: ReactNode;
  dominance?: number | null;
  loading?: boolean;
  valueClassName?: string;
  changeInfo?: {
    value: number;
    isPositive: boolean;
    label?: string;
  } | null;
  showChangeIcon?: boolean;
  compact?: boolean;
}) => {
  // Adjust styling based on compact mode
  const containerClass = compact 
    ? "bg-white dark:bg-gray-800 p-3 rounded-lg shadow-sm"
    : "bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm transition-all duration-300 hover:shadow-card-hover transform hover:-translate-y-1";
  
  const titleClass = compact
    ? "text-xs text-gray-500 dark:text-gray-400"
    : "text-sm text-gray-500 dark:text-gray-400";
    
  const valueClass = compact
    ? `text-lg font-bold ${valueClassName}`
    : `text-3xl font-bold ${valueClassName}`;
  
  return (
    <div className={containerClass}>
      <div className="flex items-center mb-2">
        {icon && <div className="mr-2">{icon}</div>}
        <p className={titleClass}>{title}</p>
      </div>
      
      {loading ? (
        <div className="flex items-center h-9">
          <div className="animate-pulse bg-gray-200 dark:bg-gray-700 h-8 w-24 rounded"></div>
        </div>
      ) : (
        <>
          <div className="flex items-center">
            <p className={valueClass}>
              {value}
            </p>
            {changeInfo && showChangeIcon && (
              <div className={`ml-2 ${changeInfo.isPositive ? 'text-green-500' : 'text-red-500'}`}>
                {changeInfo.isPositive ? (
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={compact ? "w-3 h-3" : "w-5 h-5"}>
                    <path fillRule="evenodd" d="M10 17a.75.75 0 01-.75-.75V5.612L5.29 9.77a.75.75 0 01-1.08-1.04l5.25-5.5a.75.75 0 011.08 0l5.25 5.5a.75.75 0 11-1.08 1.04l-3.96-4.158V16.25A.75.75 0 0110 17z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={compact ? "w-3 h-3" : "w-5 h-5"}>
                    <path fillRule="evenodd" d="M10 3a.75.75 0 01.75.75v10.638l3.96-4.158a.75.75 0 111.08 1.04l-5.25 5.5a.75.75 0 01-1.08 0l-5.25-5.5a.75.75 0 111.08-1.04l3.96 4.158V3.75A.75.75 0 0110 3z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
            )}
          </div>
          
          {changeInfo && (
            <p className={`${compact ? 'text-xs' : 'text-sm'} mt-1 ${changeInfo.isPositive ? 'text-green-500' : 'text-red-500'}`}>
              {changeInfo.isPositive ? '+' : ''}{changeInfo.value.toFixed(2)}% 
              {changeInfo.label && <span className="text-gray-500 dark:text-gray-400 ml-1">({changeInfo.label})</span>}
            </p>
          )}
          
          {dominance !== null && (
            <p className={`${compact ? 'text-xs' : 'text-sm'} text-gray-500 dark:text-gray-400 mt-1`}>
              Dominance: {dominance.toFixed(2)}%
            </p>
          )}
        </>
      )}
    </div>
  );
});

// Portfolio loading skeleton
export const PortfolioLoadingSkeleton = () => (
  <div className="animate-pulse space-y-4">
    <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="bg-gray-100 dark:bg-gray-800 p-6 rounded-lg">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-3"></div>
          <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
        </div>
      ))}
    </div>
    <div className="mt-6">
      <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-full mb-4"></div>
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex justify-between items-center p-3 border-b border-gray-100 dark:border-gray-700">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/5"></div>
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/6"></div>
        </div>
      ))}
    </div>
  </div>
);

// Watchlist loading skeleton
export const WatchlistLoadingSkeleton = () => (
  <div className="animate-pulse space-y-4">
    <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
    <div className="mt-6">
      <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-full mb-4"></div>
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex justify-between items-center p-3 border-b border-gray-100 dark:border-gray-700">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/5"></div>
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/6"></div>
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/6"></div>
        </div>
      ))}
    </div>
  </div>
);

// Data card component with common styling
export const DataCard = ({ 
  title, 
  children, 
  className = '',
  icon = null
}: {
  title: string;
  children: ReactNode;
  className?: string;
  icon?: ReactNode;
}) => (
  <div className={`bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm ${className}`}>
    <div className="flex items-center mb-4">
      {icon && <div className="mr-2">{icon}</div>}
      <h3 className="text-lg font-medium">{title}</h3>
    </div>
    {children}
  </div>
);

// Generic section loader
export const SectionLoader = ({ text = "Loading data..." }) => (
  <div className="flex items-center justify-center min-h-[200px]">
    <div className="flex flex-col items-center">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500 mb-4"></div>
      <p className="text-gray-600 dark:text-gray-300 animate-pulse">{text}</p>
    </div>
  </div>
);

// Generic empty state component
export const EmptyState = ({ 
  message, 
  actionLabel = null, 
  onAction = null 
}: {
  message: string;
  actionLabel?: string | null;
  onAction?: (() => void) | null;
}) => (
  <div className="flex flex-col items-center justify-center py-10 text-center">
    <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-300 dark:text-gray-600 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
    </svg>
    <p className="text-gray-500 dark:text-gray-400 mb-4">{message}</p>
    {actionLabel && onAction && (
      <button
        onClick={onAction}
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
      >
        {actionLabel}
      </button>
    )}
  </div>
);

// Error display component
export const ErrorDisplay = ({ 
  message, 
  onRetry = null 
}: {
  message: string;
  onRetry?: (() => void) | null;
}) => (
  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 my-4">
    <div className="flex items-start">
      <div className="flex-shrink-0">
        <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
        </svg>
      </div>
      <div className="ml-3">
        <p className="text-sm text-red-700 dark:text-red-400">{message}</p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="mt-2 text-sm font-medium text-red-700 dark:text-red-400 hover:text-red-600 dark:hover:text-red-300"
          >
            Try again
          </button>
        )}
      </div>
    </div>
  </div>
); 