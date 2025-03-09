'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

// Sample article data - in a real app, this would come from Supabase
const SAMPLE_ARTICLES = [
  {
    id: '1',
    title: 'Understanding Bitcoin: The Basics',
    content: 'Bitcoin is a decentralized digital currency that was created in 2009 by an unknown person or group using the pseudonym Satoshi Nakamoto...',
    author: 'Alex Smith',
    category: 'Beginner',
    tags: ['Bitcoin', 'Cryptocurrency', 'Blockchain'],
    created_at: '2023-06-15T10:30:00Z',
    updated_at: '2023-06-15T10:30:00Z',
  },
  {
    id: '2',
    title: 'Ethereum and Smart Contracts Explained',
    content: 'Ethereum is a decentralized, open-source blockchain platform that enables the creation of smart contracts and decentralized applications (dApps)...',
    author: 'Jessica Chen',
    category: 'Intermediate',
    tags: ['Ethereum', 'Smart Contracts', 'DApps'],
    created_at: '2023-07-02T14:45:00Z',
    updated_at: '2023-07-02T14:45:00Z',
  },
  {
    id: '3',
    title: 'DeFi: The Future of Finance?',
    content: 'Decentralized Finance, or DeFi, refers to financial applications built on blockchain technologies, typically using smart contracts...',
    author: 'Michael Rodriguez',
    category: 'Advanced',
    tags: ['DeFi', 'Finance', 'Yield Farming'],
    created_at: '2023-07-18T09:15:00Z',
    updated_at: '2023-07-18T09:15:00Z',
  },
  {
    id: '4',
    title: 'NFTs and Digital Ownership',
    content: 'Non-Fungible Tokens (NFTs) represent ownership of unique digital items like art, collectibles, and even virtual real estate...',
    author: 'Sarah Johnson',
    category: 'Intermediate',
    tags: ['NFT', 'Digital Art', 'Collectibles'],
    created_at: '2023-08-05T16:20:00Z',
    updated_at: '2023-08-05T16:20:00Z',
  },
  {
    id: '5',
    title: 'Crypto Security: Protecting Your Digital Assets',
    content: 'Security is paramount in the world of cryptocurrency. This guide covers best practices for securing your digital assets...',
    author: 'David Lee',
    category: 'Beginner',
    tags: ['Security', 'Wallets', 'Best Practices'],
    created_at: '2023-08-22T11:10:00Z',
    updated_at: '2023-08-22T11:10:00Z',
  },
  {
    id: '6',
    title: 'Technical Analysis for Crypto Trading',
    content: 'Technical analysis involves studying price charts and using statistical figures to determine future price movements...',
    author: 'Emma Wilson',
    category: 'Advanced',
    tags: ['Trading', 'Technical Analysis', 'Charts'],
    created_at: '2023-09-10T13:25:00Z',
    updated_at: '2023-09-10T13:25:00Z',
  },
];

export default function Resources() {
  const [articles, setArticles] = useState(SAMPLE_ARTICLES);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Categories for filtering
  const categories = ['All', 'Beginner', 'Intermediate', 'Advanced'];

  useEffect(() => {
    // Simulate loading data
    setTimeout(() => {
      setIsLoading(false);
    }, 1000);
  }, []);

  // Filter articles based on category and search query
  const filteredArticles = articles.filter((article) => {
    const matchesCategory = selectedCategory === 'All' || article.category === selectedCategory;
    const matchesSearch = article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          article.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          article.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    
    return matchesCategory && matchesSearch;
  });

  // Format date for display
  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Resources</h1>
        <p className="mt-2 text-xl text-gray-600">
          Educational articles and guides to help you navigate the crypto ecosystem
        </p>
      </div>

      {/* Search and Filter */}
      <div className="mb-8 flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
        <div className="flex space-x-2">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`rounded-md px-4 py-2 text-sm font-medium ${
                selectedCategory === category
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {category}
            </button>
          ))}
        </div>
        <div className="relative">
          <input
            type="text"
            placeholder="Search articles..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-md border border-gray-300 px-4 py-2 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:w-64"
          />
          <svg
            className="absolute right-3 top-2.5 h-5 w-5 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            ></path>
          </svg>
        </div>
      </div>

      {/* Articles Grid */}
      {isLoading ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-64 animate-pulse rounded-lg bg-gray-200"></div>
          ))}
        </div>
      ) : filteredArticles.length > 0 ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredArticles.map((article) => (
            <div key={article.id} className="flex flex-col rounded-lg border border-gray-200 bg-white shadow-sm">
              <div className="flex-1 p-6">
                <div className="flex items-center">
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    article.category === 'Beginner' ? 'bg-green-100 text-green-800' :
                    article.category === 'Intermediate' ? 'bg-blue-100 text-blue-800' :
                    'bg-purple-100 text-purple-800'
                  }`}>
                    {article.category}
                  </span>
                  <span className="ml-2 text-sm text-gray-500">{formatDate(article.created_at)}</span>
                </div>
                <h2 className="mt-2 text-xl font-semibold text-gray-900">{article.title}</h2>
                <p className="mt-3 text-gray-600 line-clamp-3">{article.content}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {article.tags.map((tag) => (
                    <span key={tag} className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
              <div className="border-t border-gray-200 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-900">By {article.author}</span>
                  <button className="text-sm font-medium text-indigo-600 hover:text-indigo-500">
                    Read More →
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-gray-200 bg-white p-8 text-center">
          <h3 className="text-lg font-medium text-gray-900">No articles found</h3>
          <p className="mt-2 text-gray-600">
            Try adjusting your search or filter to find what you're looking for.
          </p>
          <button
            onClick={() => {
              setSelectedCategory('All');
              setSearchQuery('');
            }}
            className="mt-4 rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
          >
            Reset Filters
          </button>
        </div>
      )}

      {/* Newsletter Signup */}
      <div className="mt-16 rounded-lg bg-indigo-50 p-8">
        <div className="mx-auto max-w-xl text-center">
          <h2 className="text-2xl font-bold text-gray-900">Stay Updated</h2>
          <p className="mt-2 text-gray-600">
            Subscribe to our newsletter to receive the latest articles, market updates, and educational content.
          </p>
          <form className="mt-6">
            <div className="flex">
              <input
                type="email"
                placeholder="Enter your email"
                className="w-full rounded-l-md border border-gray-300 px-4 py-2 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
              <button
                type="submit"
                className="rounded-r-md bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700"
              >
                Subscribe
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 