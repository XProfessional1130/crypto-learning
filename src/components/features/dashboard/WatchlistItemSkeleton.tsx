import React from 'react';

// Create a memoized WatchlistItemSkeleton component for better loading UX
const WatchlistItemSkeleton = () => (
  <div className="px-3 py-3 border-b border-gray-100 dark:border-gray-700/50">
    <div className="flex items-center justify-between mb-2">
      <div className="flex items-center">
        <div className="w-7 h-7 rounded-full bg-gray-200 dark:bg-gray-700 mr-2"></div>
        <div>
          <div className="h-4 w-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
          <div className="h-3 w-24 bg-gray-100 dark:bg-gray-800 rounded mt-1"></div>
        </div>
      </div>
      <div className="flex flex-col items-end">
        <div className="h-4 w-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
        <div className="h-3 w-16 bg-gray-100 dark:bg-gray-800 rounded mt-1"></div>
      </div>
    </div>
  </div>
);

export default WatchlistItemSkeleton; 