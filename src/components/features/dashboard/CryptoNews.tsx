'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Clock, Newspaper, RefreshCw, Filter, Sparkles, TrendingUp } from 'lucide-react';
import { memoize } from '@/lib/utils/memoize';
import { logger } from '@/lib/utils/logger';

type NewsItem = {
  title: string;
  link: string;
  source: string;
  date: string;
  contentSnippet?: string;
  creator?: string;
  imageUrl?: string | null;
  categories?: string[];
};

// Extract NewsItemCard into a memoized component for better performance
const NewsItemCard = memoize(({ item }: { item: NewsItem }) => {
  return (
    <a 
      href={item.link}
      target="_blank"
      rel="noopener noreferrer"
      className="flex gap-3 border border-gray-200 dark:border-gray-700 rounded-lg p-3 hover:bg-gray-50/70 dark:hover:bg-gray-700/70 transition-all duration-300 group relative overflow-hidden backdrop-blur-sm"
    >
      {/* Hover effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/0 via-blue-500/0 to-blue-500/0 dark:from-blue-600/0 dark:via-blue-600/0 dark:to-blue-600/0 opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>
      
      <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700 flex-shrink-0 relative shadow-sm transform group-hover:scale-105 transition-transform duration-300">
        {item.imageUrl ? (
          // Using standard img tag for simpler implementation with remote URLs
          <img 
            src={item.imageUrl} 
            alt=""
            className="w-full h-full object-cover"
            onError={(e) => {
              // Replace broken images with a fallback
              const target = e.target as HTMLImageElement;
              target.src = 'https://www.coindesk.com/resizer/86_-JpS2CQ6k9FxoRHIxg3nGcvo=/500x500/filters:quality(80):format(png):base64(0)/cloudfront-us-east-1.images.arcpublishing.com/coindesk/F6KQ7VEWHFGTBKP2FKTWMJOUXA.png';
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-200 dark:bg-gray-600">
            <Newspaper className="h-6 w-6 text-gray-400 dark:text-gray-500" />
          </div>
        )}
        
        {/* Overlay glow effect on hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
      </div>
      
      <div className="flex-grow min-w-0">
        <h3 className="text-sm font-medium mb-1 line-clamp-2 leading-tight text-gray-800 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-300">{item.title}</h3>
        {item.contentSnippet && (
          <p className="text-xs text-gray-600 dark:text-gray-400 mb-1 line-clamp-1">{item.contentSnippet}</p>
        )}
        <div className="flex flex-wrap items-center gap-1 mb-1">
          {item.categories?.map((category, i) => (
            <span 
              key={i} 
              className="inline-block text-[10px] px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700/80 text-gray-700 dark:text-gray-300 rounded-full group-hover:bg-blue-50 dark:group-hover:bg-blue-900/20 group-hover:text-blue-700 dark:group-hover:text-blue-300 transition-colors duration-300"
            >
              {category}
            </span>
          ))}
        </div>
        <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
          <span className="flex items-center">
            <Clock className="h-2.5 w-2.5 mr-1" />
            {item.date}
          </span>
          <span className="mx-1 text-gray-300 dark:text-gray-600">•</span>
          <span className="truncate max-w-[80px]">{item.source}</span>
        </div>
      </div>
    </a>
  );
});
NewsItemCard.displayName = 'NewsItemCard';

// Create a memoized category pill component
const CategoryPill = memoize(({ 
  category, 
  isSelected, 
  onClick 
}: {
  category: string;
  isSelected: boolean;
  onClick: () => void;
}) => {
  return (
    <button
      onClick={onClick}
      className={`text-xs px-2.5 py-1 rounded-full border transition-all duration-300 transform ${
        isSelected
          ? 'bg-blue-100 border-blue-300 text-blue-800 dark:bg-blue-900/50 dark:border-blue-700 dark:text-blue-100 shadow-sm scale-105'
          : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100 dark:bg-gray-800/60 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-700/60 hover:scale-105'
      }`}
    >
      {category}
      {isSelected && (
        <span className="ml-1 inline-flex h-1.5 w-1.5 rounded-full bg-blue-500 dark:bg-blue-400"></span>
      )}
    </button>
  );
});
CategoryPill.displayName = 'CategoryPill';

function CryptoNewsComponent() {
  const [newsItems, setNewsItems] = useState<NewsItem[]>([]);
  const [allNewsItems, setAllNewsItems] = useState<NewsItem[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [hasInitialLoad, setHasInitialLoad] = useState(false);

  // Use useCallback to memoize the fetchNews function
  const fetchNews = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/crypto-news');
      
      if (!response.ok) {
        throw new Error('Failed to fetch news');
      }
      
      const data = await response.json();
      logger.debug('Crypto news fetched successfully', { count: data.newsItems.length });
      setAllNewsItems(data.newsItems);
      setNewsItems(data.newsItems);
      setCategories(['All', ...data.categories]);
      setHasInitialLoad(true);
    } catch (err) {
      logger.error('Error fetching crypto news', { error: err });
      setError('Failed to load crypto news. Please try again later.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Fetch news on component mount
  useEffect(() => {
    fetchNews();
  }, [fetchNews]);

  // Use useMemo to filter news items when category changes
  useEffect(() => {
    if (selectedCategory === 'All') {
      setNewsItems(allNewsItems);
    } else {
      setNewsItems(
        allNewsItems.filter(item => 
          item.categories?.includes(selectedCategory)
        )
      );
    }
  }, [selectedCategory, allNewsItems]);

  // Use useCallback for event handlers
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    setError(null);
    await fetchNews();
    setSelectedCategory('All');
  }, [fetchNews]);

  const toggleFilters = useCallback(() => {
    setShowFilters(prev => !prev);
  }, []);

  // Render error state
  if (error) {
    return (
      <div className="bg-white dark:bg-gradient-to-br dark:from-slate-800 dark:to-slate-900 rounded-xl shadow-md dark:shadow-lg border border-gray-200 dark:border-slate-700/50 p-4 transition-all duration-300">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-base font-semibold flex items-center text-gray-800 dark:text-white">
            <Newspaper className="h-4 w-4 mr-1.5 text-blue-500 dark:text-blue-400" />
            Crypto News
          </h2>
          <button 
            onClick={handleRefresh} 
            className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 focus:outline-none transform hover:scale-110 transition-transform"
            aria-label="Refresh news"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </button>
        </div>
        <div className="rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 p-3">
          <p className="text-red-800 dark:text-red-200 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  // Define animation classes based on loading state
  const newsHeaderClass = hasInitialLoad ? "animate-scaleIn" : "";
  const newsItemAnimationClass = hasInitialLoad ? "animate-fadeIn" : "opacity-0";

  return (
    <div className="bg-white dark:bg-gradient-to-br dark:from-slate-800 dark:to-slate-900 rounded-xl shadow-md dark:shadow-lg border border-gray-200 dark:border-slate-700/50 p-5 transition-all duration-300 relative overflow-hidden">
      <div className={`flex justify-between items-center mb-4 pb-3 border-b border-gray-200 dark:border-slate-700/50 relative z-10 ${newsHeaderClass}`}>
        <h2 className="text-base font-bold flex items-center text-gray-800 dark:text-white tracking-tight">
          <div className="w-2 h-8 bg-blue-500 rounded-full mr-2 animate-pulse"></div>
          <span>Market Insights</span>
          <span className="ml-1.5 flex items-center text-xs px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 rounded-full">
            <TrendingUp className="h-3 w-3 mr-0.5" />
            <span>Live</span>
            {loading && <div className="h-1.5 w-1.5 rounded-full bg-blue-500 dark:bg-blue-400 animate-pulse ml-1" />}
          </span>
        </h2>
        <div className="flex space-x-2 items-center">
          <button 
            onClick={toggleFilters}
            className="text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 focus:outline-none p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors"
            aria-label="Filter news"
          >
            <Filter className={`h-3.5 w-3.5 ${showFilters ? 'text-blue-500 dark:text-blue-400' : ''}`} />
          </button>
          <button 
            onClick={handleRefresh} 
            disabled={loading || refreshing}
            className={`text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 focus:outline-none transition-all p-1.5 rounded-full hover:bg-blue-50 dark:hover:bg-blue-900/20 ${refreshing ? 'animate-spin' : ''}`}
            aria-label="Refresh news"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
      
      {showFilters && (
        <div className="mb-4 flex flex-wrap gap-1.5 py-1 overflow-x-auto scrollbar-thin relative z-10">
          {categories.map((category, index) => (
            <CategoryPill 
              key={category}
              category={category}
              isSelected={selectedCategory === category}
              onClick={() => setSelectedCategory(category)}
            />
          ))}
        </div>
      )}
      
      {loading ? (
        <div className="space-y-3 relative z-10">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex gap-3 border border-gray-200 dark:border-gray-700 rounded-lg p-3">
              <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700 flex-shrink-0">
                <Skeleton className="h-full w-full" />
              </div>
              <div className="flex-grow min-w-0">
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-3 w-3/4 mb-2" />
                <div className="flex items-center space-x-2">
                  <Skeleton className="h-2 w-12" />
                  <Skeleton className="h-2 w-12" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-3 relative z-10">
          {newsItems.length === 0 ? (
            <div className="text-center p-4 text-gray-500 dark:text-gray-400 text-sm bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-100 dark:border-gray-700/50">
              <p>
                {selectedCategory === 'All' 
                  ? 'No news articles available.' 
                  : `No news articles about ${selectedCategory} available.`}
              </p>
              <button 
                onClick={handleRefresh}
                className="mt-2 text-blue-600 dark:text-blue-400 text-xs hover:underline"
              >
                Refresh
              </button>
            </div>
          ) : (
            newsItems.map((item, index) => (
              <div 
                key={index} 
                className={newsItemAnimationClass}
                style={{ animationDelay: `${(index * 150)}ms` }}
              >
                <NewsItemCard item={item} />
              </div>
            ))
          )}
        </div>
      )}
      
      {/* Decorative Elements */}
      <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-blue-500/5 dark:bg-blue-500/10 blur-xl"></div>
      <div className="absolute bottom-0 left-1/3 w-64 h-24 bg-gradient-to-tr from-blue-500/0 via-blue-500/5 to-purple-500/5 dark:from-blue-500/0 dark:via-blue-500/10 dark:to-purple-500/10 blur-xl"></div>
    </div>
  );
}

// Export a memoized version of the component to prevent unnecessary re-renders
export default memoize(CryptoNewsComponent); 