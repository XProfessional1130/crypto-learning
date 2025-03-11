'use client';

import { useState, useEffect } from 'react';
import { Skeleton } from '../../components/ui/skeleton';
import { Clock, Newspaper, RefreshCw, Filter } from 'lucide-react';

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

export default function CryptoNews() {
  const [newsItems, setNewsItems] = useState<NewsItem[]>([]);
  const [allNewsItems, setAllNewsItems] = useState<NewsItem[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const fetchNews = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/crypto-news');
      
      if (!response.ok) {
        throw new Error('Failed to fetch news');
      }
      
      const data = await response.json();
      setAllNewsItems(data.newsItems);
      setNewsItems(data.newsItems);
      setCategories(['All', ...data.categories]);
      console.log("News data:", data);
    } catch (err) {
      console.error('Error fetching news:', err);
      setError('Failed to load crypto news. Please try again later.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchNews();
  }, []);

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

  const handleRefresh = async () => {
    setRefreshing(true);
    setError(null);
    await fetchNews();
    setSelectedCategory('All');
  };

  const toggleFilters = () => {
    setShowFilters(!showFilters);
  };

  if (error) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-base font-semibold flex items-center">
            <Newspaper className="h-4 w-4 mr-1" />
            Crypto News
          </h2>
          <button 
            onClick={handleRefresh} 
            className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 focus:outline-none"
            aria-label="Refresh news"
          >
            <RefreshCw className="h-3 w-3" />
          </button>
        </div>
        <div className="rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 p-3">
          <p className="text-red-800 dark:text-red-200 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
      <div className="flex justify-between items-center mb-3">
        <h2 className="text-base font-semibold flex items-center">
          <Newspaper className="h-4 w-4 mr-1" />
          <span>Crypto News</span>
          {loading && <div className="h-3 w-3 rounded-full border-2 border-t-transparent border-gray-500 animate-spin ml-2" />}
        </h2>
        <div className="flex space-x-2">
          <button 
            onClick={toggleFilters}
            className="text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 focus:outline-none"
            aria-label="Filter news"
          >
            <Filter className={`h-3 w-3 ${showFilters ? 'text-blue-500 dark:text-blue-400' : ''}`} />
          </button>
          <button 
            onClick={handleRefresh} 
            disabled={loading || refreshing}
            className={`text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 focus:outline-none transition-transform ${refreshing ? 'animate-spin' : 'hover:scale-110'}`}
            aria-label="Refresh news"
          >
            <RefreshCw className="h-3 w-3" />
          </button>
        </div>
      </div>
      
      {showFilters && (
        <div className="mb-3 flex flex-wrap gap-1 py-1">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`text-xs px-2 py-0.5 rounded-full border transition-colors ${
                selectedCategory === category
                  ? 'bg-blue-100 border-blue-300 text-blue-800 dark:bg-blue-900 dark:border-blue-700 dark:text-blue-100'
                  : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-700'
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      )}
      
      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex gap-3 border border-gray-200 dark:border-gray-700 rounded-lg p-2">
              <div className="w-16 h-16 rounded overflow-hidden bg-gray-100 dark:bg-gray-700 flex-shrink-0">
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
        <div className="space-y-3">
          {newsItems.length === 0 ? (
            <div className="text-center p-3 text-gray-500 dark:text-gray-400 text-sm">
              <p>
                {selectedCategory === 'All' 
                  ? 'No news articles available.' 
                  : `No news articles about ${selectedCategory} available.`}
              </p>
            </div>
          ) : (
            newsItems.map((item, index) => (
              <a 
                key={index}
                href={item.link}
                target="_blank"
                rel="noopener noreferrer"
                className="flex gap-3 border border-gray-200 dark:border-gray-700 rounded-lg p-2 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <div className="w-16 h-16 rounded overflow-hidden bg-gray-100 dark:bg-gray-700 flex-shrink-0 relative">
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
                </div>
                <div className="flex-grow min-w-0">
                  <h3 className="text-sm font-medium mb-1 line-clamp-2 leading-tight">{item.title}</h3>
                  {item.contentSnippet && (
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-1 line-clamp-1">{item.contentSnippet}</p>
                  )}
                  <div className="flex flex-wrap items-center gap-1 mb-1">
                    {item.categories?.map((category, i) => (
                      <span 
                        key={i} 
                        className="inline-block text-[10px] px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full"
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
                    <span className="truncate max-w-[60px]">{item.source}</span>
                  </div>
                </div>
              </a>
            ))
          )}
        </div>
      )}
    </div>
  );
} 