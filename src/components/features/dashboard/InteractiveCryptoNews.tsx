'use client';

import { useState, useEffect, useCallback } from 'react';
import { RefreshCw, Filter, Sparkles, TrendingUp } from 'lucide-react';
import CryptoNewsServer from './CryptoNewsServer';

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

/**
 * Interactive client component wrapper for CryptoNewsServer
 * 
 * This component adds client-side interactivity like filtering, 
 * refresh functionality, and animations while using the server
 * component for data display.
 */
export default function InteractiveCryptoNews() {
  const [newsItems, setNewsItems] = useState<NewsItem[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  // Fetch news from API
  const fetchNews = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/crypto-news');
      
      if (!response.ok) {
        throw new Error('Failed to fetch news');
      }
      
      const data = await response.json();
      setNewsItems(data.news || []);
      
      // Extract categories
      const extractedCategories = extractCategories(data.news || []);
      setCategories(['All', ...extractedCategories]);
      
      setError(null);
    } catch (error) {
      console.error('Error fetching news:', error);
      setError('Failed to load news. Please try again later.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchNews();
    
    // Also try to get categories from the hidden input (set by server component)
    const categoriesData = document.getElementById('news-categories-data') as HTMLInputElement;
    if (categoriesData && categoriesData.value) {
      try {
        const parsedCategories = JSON.parse(categoriesData.value);
        if (Array.isArray(parsedCategories) && parsedCategories.length > 0) {
          setCategories(['All', ...parsedCategories]);
        }
      } catch (error) {
        console.error('Error parsing categories data:', error);
      }
    }
  }, [fetchNews]);

  // Handle refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchNews();
  };

  // Filter news items by category
  const filteredNewsItems = selectedCategory === 'All'
    ? newsItems
    : newsItems.filter(item => 
        item.categories?.includes(selectedCategory)
      );

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center">
          <TrendingUp className="w-5 h-5 mr-2 text-brand-primary" />
          Crypto News
        </h2>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
            aria-label="Toggle filters"
          >
            <Filter className="w-4 h-4 text-gray-500 dark:text-gray-400" />
          </button>
          
          <button
            onClick={handleRefresh}
            disabled={refreshing || loading}
            className={`p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 ${
              (refreshing || loading) ? 'opacity-50 cursor-not-allowed' : ''
            }`}
            aria-label="Refresh news"
          >
            <RefreshCw 
              className={`w-4 h-4 text-gray-500 dark:text-gray-400 ${
                refreshing ? 'animate-spin' : ''
              }`} 
            />
          </button>
        </div>
      </div>
      
      {/* Category filters */}
      {showFilters && (
        <div className="mb-4 flex flex-wrap gap-2">
          {categories.map(category => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-3 py-1 text-xs font-medium rounded-full 
                ${selectedCategory === category 
                  ? 'bg-brand-primary text-white' 
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
            >
              {category}
            </button>
          ))}
        </div>
      )}
      
      {/* Error state */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-300 rounded-lg">
          {error}
        </div>
      )}
      
      {/* Loading state or server component */}
      {loading ? (
        <div className="space-y-4 animate-pulse">
          {[1, 2, 3].map(i => (
            <div key={i} className="p-4 rounded-lg border border-gray-100 dark:border-gray-700">
              <div className="flex gap-4">
                <div className="hidden sm:block w-20 h-20 bg-gray-200 dark:bg-gray-700 rounded-md"></div>
                <div className="flex-1">
                  <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-3"></div>
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-3"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full mb-2"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        // Render filtered news through the server component
        <CryptoNewsServer newsItems={filteredNewsItems} />
      )}
    </div>
  );
}

// Helper function to extract categories
function extractCategories(newsItems: NewsItem[]): string[] {
  const categorySet = new Set<string>();
  
  newsItems.forEach(item => {
    if (item.categories && item.categories.length > 0) {
      item.categories.forEach(category => {
        categorySet.add(category);
      });
    }
  });
  
  return Array.from(categorySet);
} 