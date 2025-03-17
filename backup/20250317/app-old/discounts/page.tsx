'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

// Custom icons instead of heroicons
const SearchIcon = () => (
  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);

const FilterIcon = () => (
  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
  </svg>
);

const XIcon = () => (
  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);

// Sample discount data - in a real app, this would come from Supabase
const SAMPLE_DISCOUNTS = [
  {
    id: '1',
    title: 'Binance: 20% Off Trading Fees',
    description: 'Get 20% off trading fees when you sign up using our referral link. Valid for new users only.',
    url: 'https://binance.com/ref=12345',
    category: 'Exchange',
    expires_at: '2023-12-31T23:59:59Z',
    created_at: '2023-06-01T10:00:00Z',
    updated_at: '2023-06-01T10:00:00Z',
  },
  {
    id: '2',
    title: 'Ledger: $20 Off Nano X',
    description: 'Save $20 on the Ledger Nano X hardware wallet. Secure your crypto with the industry-leading hardware wallet.',
    url: 'https://ledger.com/ref=12345',
    category: 'Hardware Wallet',
    expires_at: '2023-11-30T23:59:59Z',
    created_at: '2023-06-15T14:30:00Z',
    updated_at: '2023-06-15T14:30:00Z',
  },
  {
    id: '3',
    title: 'Kraken: Free $10 in Bitcoin',
    description: 'Get $10 in free Bitcoin when you make your first trade of $100 or more on Kraken.',
    url: 'https://kraken.com/ref=12345',
    category: 'Exchange',
    expires_at: '2023-10-15T23:59:59Z',
    created_at: '2023-07-01T09:15:00Z',
    updated_at: '2023-07-01T09:15:00Z',
  },
  {
    id: '4',
    title: 'TradingView: 30% Off Premium Plan',
    description: 'Save 30% on TradingView Premium. Access advanced charting tools and indicators for better trading decisions.',
    url: 'https://tradingview.com/ref=12345',
    category: 'Trading Tools',
    expires_at: '2023-09-30T23:59:59Z',
    created_at: '2023-07-10T16:45:00Z',
    updated_at: '2023-07-10T16:45:00Z',
  },
  {
    id: '5',
    title: 'Trezor: Buy One, Get 10% Off',
    description: 'Purchase a Trezor hardware wallet and get 10% off your order with our exclusive code.',
    url: 'https://trezor.com/ref=12345',
    category: 'Hardware Wallet',
    expires_at: '2023-12-15T23:59:59Z',
    created_at: '2023-08-05T11:20:00Z',
    updated_at: '2023-08-05T11:20:00Z',
  },
  {
    id: '6',
    title: 'CoinGecko Premium: 25% Discount',
    description: 'Get 25% off CoinGecko Premium for advanced crypto market data and portfolio tracking.',
    url: 'https://coingecko.com/ref=12345',
    category: 'Data & Analytics',
    expires_at: '2023-11-01T23:59:59Z',
    created_at: '2023-08-20T13:10:00Z',
    updated_at: '2023-08-20T13:10:00Z',
  },
];

export default function Discounts() {
  const [discounts, setDiscounts] = useState(SAMPLE_DISCOUNTS);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);

  // Categories for filtering
  const categories = ['All', 'Exchange', 'Hardware Wallet', 'Trading Tools', 'Data & Analytics'];

  useEffect(() => {
    // Simulate loading data
    setTimeout(() => {
      setIsLoading(false);
    }, 1000);
  }, []);

  // Filter discounts based on category and search term
  const filteredDiscounts = discounts.filter((discount) => {
    const matchesCategory = selectedCategory === 'All' || discount.category === selectedCategory;
    const matchesSearch = searchTerm === '' || 
      discount.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
      discount.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Format date for display
  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Check if discount is expiring soon (within 7 days)
  const isExpiringSoon = (expiresAt: string) => {
    const expiryDate = new Date(expiresAt);
    const now = new Date();
    const diffTime = expiryDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 7 && diffDays > 0;
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header with glassmorphic background */}
      <div className="neo-glass neo-glass-before rounded-2xl p-8 mb-10 relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-brand-300/10 dark:bg-brand-500/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-16 -left-16 w-40 h-40 bg-blue-300/10 dark:bg-blue-500/10 rounded-full blur-3xl"></div>
        
        <div className="relative z-10">
          <h1 className="text-3xl font-bold text-light-text-primary dark:text-dark-text-primary mb-2">
            Exclusive <span className="text-gradient">Discounts</span>
          </h1>
          <p className="text-xl text-light-text-secondary dark:text-dark-text-secondary">
            Special deals and referral links for LearningCrypto members
          </p>
        </div>
      </div>

      {/* Search and filters bar */}
      <div className="glass rounded-xl mb-8 p-4 flex flex-col md:flex-row gap-4 items-center">
        {/* Search box */}
        <div className="relative flex-grow">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <SearchIcon />
          </div>
          <input
            type="text"
            className="input pl-10"
            placeholder="Search discounts..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button 
              onClick={() => setSearchTerm('')}
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
            >
              <XIcon />
            </button>
          )}
        </div>

        {/* Filter toggle for mobile */}
        <button 
          className="md:hidden btn btn-secondary" 
          onClick={() => setShowFilters(!showFilters)}
        >
          <FilterIcon />
          Filters
        </button>

        {/* Filter buttons - visible on desktop or when toggled on mobile */}
        <div className={`flex-wrap gap-2 ${showFilters ? 'flex' : 'hidden md:flex'}`}>
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`rounded-md px-4 py-2 text-sm font-medium transition-all duration-300 ${
                selectedCategory === category
                  ? 'neo-glass bg-brand-primary/10 dark:bg-brand-primary/20 border border-brand-primary/30 text-brand-primary dark:text-brand-light'
                  : 'bg-white/50 dark:bg-dark-bg-accent/30 border border-white/10 dark:border-dark-bg-accent/20 text-light-text-secondary dark:text-dark-text-secondary hover:bg-white/70 dark:hover:bg-dark-bg-accent/50'
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {/* Discounts Grid */}
      {isLoading ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="neo-glass neo-glass-before rounded-xl h-64 animate-pulse relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-brand-50/30 to-transparent dark:from-brand-900/20 dark:to-transparent"></div>
            </div>
          ))}
        </div>
      ) : filteredDiscounts.length > 0 ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredDiscounts.map((discount) => (
            <div 
              key={discount.id} 
              className="neo-glass neo-glass-before rounded-xl overflow-hidden transition-all duration-300 transform hover:-translate-y-1 hover:shadow-[0_15px_30px_rgba(0,0,0,0.15)] dark:hover:shadow-[0_15px_30px_rgba(0,0,0,0.4)] perspective-tilt backdrop-glow flex flex-col"
            >
              {isExpiringSoon(discount.expires_at) && (
                <div className="bg-gradient-to-r from-yellow-400/90 to-yellow-500/90 dark:from-yellow-500/90 dark:to-yellow-600/90 px-4 py-1 text-center text-sm font-medium text-white">
                  Expiring Soon - {formatDate(discount.expires_at)}
                </div>
              )}
              <div className="p-6 flex-grow">
                <div className="flex items-center justify-between">
                  <span className="rounded-full neo-glass px-2.5 py-0.5 text-xs font-medium text-brand-primary dark:text-brand-light border border-brand-primary/20 dark:border-brand-light/20">
                    {discount.category}
                  </span>
                </div>
                <h2 className="mt-3 text-xl font-semibold text-light-text-primary dark:text-dark-text-primary">{discount.title}</h2>
                <p className="mt-3 text-light-text-secondary dark:text-dark-text-secondary">{discount.description}</p>
              </div>
              <div className="border-t border-white/10 dark:border-dark-bg-accent/20 p-4 mt-auto">
                <a
                  href={discount.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full rounded-lg bg-brand-primary hover:bg-brand-dark text-white text-center px-4 py-2 font-medium transition-all duration-300 hover:shadow-[0_0_15px_rgba(77,181,176,0.5)]"
                >
                  Get Discount
                </a>
                <p className="mt-2 text-center text-xs text-light-text-secondary dark:text-dark-text-secondary">
                  {discount.expires_at ? `Valid until ${formatDate(discount.expires_at)}` : 'No expiration date'}
                </p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="neo-glass neo-glass-before rounded-xl p-8 text-center">
          <h3 className="text-lg font-medium text-light-text-primary dark:text-dark-text-primary">No discounts found</h3>
          <p className="mt-2 text-light-text-secondary dark:text-dark-text-secondary">
            No discounts available matching your filters at the moment.
          </p>
          <button
            onClick={() => {setSelectedCategory('All'); setSearchTerm('');}}
            className="mt-4 rounded-lg bg-brand-primary hover:bg-brand-dark text-white text-center px-4 py-2 font-medium transition-all duration-300 hover:shadow-[0_0_15px_rgba(77,181,176,0.5)]"
          >
            View All Discounts
          </button>
        </div>
      )}

      {/* Referral Program - enhanced with glassmorphic effects */}
      <div className="mt-16 neo-glass neo-glass-before rounded-xl p-8 text-center relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute -top-24 left-1/2 w-48 h-48 bg-brand-primary/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-24 right-1/4 w-48 h-48 bg-brand-light/20 rounded-full blur-3xl"></div>
        
        <div className="relative z-10">
          <h2 className="text-2xl font-bold text-gradient">Earn While You Share</h2>
          <p className="mx-auto mt-3 max-w-2xl text-light-text-secondary dark:text-dark-text-secondary">
            Join our referral program and earn rewards when your friends sign up for LearningCrypto. Share your unique referral link and earn up to 20% commission on their subscription.
          </p>
          <Link
            href="/auth/signin"
            className="mt-6 inline-block rounded-lg bg-white/70 dark:bg-dark-bg-accent/30 border border-white/10 dark:border-dark-bg-accent/20 text-light-text-primary dark:text-dark-text-primary hover:bg-white/80 dark:hover:bg-dark-bg-accent/50 px-6 py-3 font-medium transition-all duration-300 hover:shadow-[0_0_15px_rgba(77,181,176,0.5)]"
          >
            Join Referral Program
          </Link>
        </div>
      </div>
    </div>
  );
} 