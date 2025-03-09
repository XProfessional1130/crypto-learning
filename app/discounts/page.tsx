'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

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
  const [isLoading, setIsLoading] = useState(true);

  // Categories for filtering
  const categories = ['All', 'Exchange', 'Hardware Wallet', 'Trading Tools', 'Data & Analytics'];

  useEffect(() => {
    // Simulate loading data
    setTimeout(() => {
      setIsLoading(false);
    }, 1000);
  }, []);

  // Filter discounts based on category
  const filteredDiscounts = discounts.filter((discount) => {
    return selectedCategory === 'All' || discount.category === selectedCategory;
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
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Exclusive Discounts</h1>
        <p className="mt-2 text-xl text-gray-600">
          Special deals and referral links for LearningCrypto members
        </p>
      </div>

      {/* Category Filter */}
      <div className="mb-8">
        <div className="flex flex-wrap gap-2">
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
      </div>

      {/* Discounts Grid */}
      {isLoading ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-64 animate-pulse rounded-lg bg-gray-200"></div>
          ))}
        </div>
      ) : filteredDiscounts.length > 0 ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredDiscounts.map((discount) => (
            <div key={discount.id} className="flex flex-col rounded-lg border border-gray-200 bg-white shadow-sm">
              {isExpiringSoon(discount.expires_at) && (
                <div className="rounded-t-lg bg-yellow-100 px-4 py-1 text-center text-sm font-medium text-yellow-800">
                  Expiring Soon - {formatDate(discount.expires_at)}
                </div>
              )}
              <div className="flex-1 p-6">
                <div className="flex items-center justify-between">
                  <span className="rounded-full bg-indigo-100 px-2.5 py-0.5 text-xs font-medium text-indigo-800">
                    {discount.category}
                  </span>
                </div>
                <h2 className="mt-2 text-xl font-semibold text-gray-900">{discount.title}</h2>
                <p className="mt-3 text-gray-600">{discount.description}</p>
              </div>
              <div className="border-t border-gray-200 p-4">
                <a
                  href={discount.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full rounded-md bg-indigo-600 px-4 py-2 text-center font-medium text-white hover:bg-indigo-700"
                >
                  Get Discount
                </a>
                <p className="mt-2 text-center text-xs text-gray-500">
                  {discount.expires_at ? `Valid until ${formatDate(discount.expires_at)}` : 'No expiration date'}
                </p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-gray-200 bg-white p-8 text-center">
          <h3 className="text-lg font-medium text-gray-900">No discounts found</h3>
          <p className="mt-2 text-gray-600">
            No discounts available in this category at the moment.
          </p>
          <button
            onClick={() => setSelectedCategory('All')}
            className="mt-4 rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
          >
            View All Discounts
          </button>
        </div>
      )}

      {/* Referral Program */}
      <div className="mt-16 rounded-lg bg-indigo-700 p-8 text-center text-white">
        <h2 className="text-2xl font-bold">Earn While You Share</h2>
        <p className="mx-auto mt-2 max-w-2xl text-indigo-100">
          Join our referral program and earn rewards when your friends sign up for LearningCrypto. Share your unique referral link and earn up to 20% commission on their subscription.
        </p>
        <Link
          href="/auth/signin"
          className="mt-6 inline-block rounded-md bg-white px-6 py-3 text-base font-medium text-indigo-600 hover:bg-indigo-50"
        >
          Join Referral Program
        </Link>
      </div>
    </div>
  );
} 