'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function Dashboard() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [portfolioValue, setPortfolioValue] = useState<number | null>(null);
  const [portfolioChange, setPortfolioChange] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is authenticated
    if (!loading && !user) {
      router.push('/auth/signin');
    }
  }, [user, loading, router]);

  useEffect(() => {
    // Simulate fetching portfolio data
    const fetchPortfolioData = async () => {
      try {
        // In a real app, this would fetch from Supabase or an API
        setTimeout(() => {
          // Dummy data
          setPortfolioValue(12453.67);
          setPortfolioChange(5.23);
          setIsLoading(false);
        }, 1000);
      } catch (error) {
        console.error('Error fetching portfolio data:', error);
        setIsLoading(false);
      }
    };

    if (user) {
      fetchPortfolioData();
    }
  }, [user]);

  if (loading || !user) {
    return (
      <div className="flex min-h-[calc(100vh-16rem)] items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-primary"></div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-light-text-primary dark:text-dark-text-primary">Your Dashboard</h1>
        <p className="mt-1 text-light-text-secondary dark:text-dark-text-secondary">
          Welcome back, {user.email ? user.email.split('@')[0] : 'User'}!
        </p>
      </div>

      {/* Overview Cards */}
      <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Portfolio Value */}
        <div className="rounded-lg bg-light-bg-secondary dark:bg-dark-bg-secondary p-6 shadow-md border border-light-bg-accent dark:border-dark-bg-accent hover:shadow-lg transition-shadow">
          <h2 className="text-sm font-medium text-light-text-secondary dark:text-dark-text-secondary">Portfolio Value</h2>
          {isLoading ? (
            <div className="mt-2 h-8 w-24 animate-pulse rounded bg-light-bg-accent dark:bg-dark-bg-accent"></div>
          ) : (
            <p className="mt-2 text-3xl font-semibold text-light-text-primary dark:text-dark-text-primary">
              ${portfolioValue?.toLocaleString()}
            </p>
          )}
        </div>

        {/* 24h Change */}
        <div className="rounded-lg bg-light-bg-secondary dark:bg-dark-bg-secondary p-6 shadow-md border border-light-bg-accent dark:border-dark-bg-accent hover:shadow-lg transition-shadow">
          <h2 className="text-sm font-medium text-light-text-secondary dark:text-dark-text-secondary">24h Change</h2>
          {isLoading ? (
            <div className="mt-2 h-8 w-24 animate-pulse rounded bg-light-bg-accent dark:bg-dark-bg-accent"></div>
          ) : (
            <p
              className={`mt-2 text-3xl font-semibold ${
                (portfolioChange || 0) >= 0
                  ? 'text-green-600 dark:text-green-500'
                  : 'text-red-600 dark:text-red-500'
              }`}
            >
              {(portfolioChange || 0) >= 0 ? '+' : ''}
              {portfolioChange}%
            </p>
          )}
        </div>

        {/* Bitcoin Price */}
        <div className="rounded-lg bg-light-bg-secondary dark:bg-dark-bg-secondary p-6 shadow-md border border-light-bg-accent dark:border-dark-bg-accent hover:shadow-lg transition-shadow">
          <h2 className="text-sm font-medium text-light-text-secondary dark:text-dark-text-secondary">Bitcoin Price</h2>
          {isLoading ? (
            <div className="mt-2 h-8 w-24 animate-pulse rounded bg-light-bg-accent dark:bg-dark-bg-accent"></div>
          ) : (
            <p className="mt-2 text-3xl font-semibold text-light-text-primary dark:text-dark-text-primary">$41,235</p>
          )}
        </div>

        {/* Ethereum Price */}
        <div className="rounded-lg bg-light-bg-secondary dark:bg-dark-bg-secondary p-6 shadow-md border border-light-bg-accent dark:border-dark-bg-accent hover:shadow-lg transition-shadow">
          <h2 className="text-sm font-medium text-light-text-secondary dark:text-dark-text-secondary">Ethereum Price</h2>
          {isLoading ? (
            <div className="mt-2 h-8 w-24 animate-pulse rounded bg-light-bg-accent dark:bg-dark-bg-accent"></div>
          ) : (
            <p className="mt-2 text-3xl font-semibold text-light-text-primary dark:text-dark-text-primary">$2,243</p>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Portfolio Section */}
        <div className="col-span-2 rounded-lg bg-light-bg-secondary dark:bg-dark-bg-secondary p-6 shadow-md border border-light-bg-accent dark:border-dark-bg-accent">
          <h2 className="mb-4 text-xl font-semibold text-light-text-primary dark:text-dark-text-primary">Your Portfolio</h2>
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-16 animate-pulse rounded bg-light-bg-accent dark:bg-dark-bg-accent"></div>
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-light-bg-accent dark:divide-dark-bg-accent">
                <thead className="bg-light-bg-accent/50 dark:bg-dark-bg-accent/50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-light-text-secondary dark:text-dark-text-secondary">
                      Asset
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-light-text-secondary dark:text-dark-text-secondary">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-light-text-secondary dark:text-dark-text-secondary">
                      Value
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-light-text-secondary dark:text-dark-text-secondary">
                      24h Change
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-light-bg-accent dark:divide-dark-bg-accent bg-light-bg-secondary dark:bg-dark-bg-secondary">
                  {/* Sample portfolio data - in real app, this would come from the API */}
                  <tr className="hover:bg-light-bg-accent/30 dark:hover:bg-dark-bg-accent/30 transition-colors">
                    <td className="whitespace-nowrap px-6 py-4">
                      <div className="flex items-center">
                        <div className="h-10 w-10 flex-shrink-0 rounded-full bg-orange-100 dark:bg-orange-900/40 flex items-center justify-center text-orange-600 dark:text-orange-400 font-bold">
                          BTC
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-light-text-primary dark:text-dark-text-primary">Bitcoin</div>
                          <div className="text-sm text-light-text-muted dark:text-dark-text-muted">BTC</div>
                        </div>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-light-text-secondary dark:text-dark-text-secondary">
                      0.25 BTC
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-light-text-primary dark:text-dark-text-primary">
                      $10,308.75
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-green-600 dark:text-green-500">
                      +2.3%
                    </td>
                  </tr>
                  <tr className="hover:bg-light-bg-accent/30 dark:hover:bg-dark-bg-accent/30 transition-colors">
                    <td className="whitespace-nowrap px-6 py-4">
                      <div className="flex items-center">
                        <div className="h-10 w-10 flex-shrink-0 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold">
                          ETH
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-light-text-primary dark:text-dark-text-primary">Ethereum</div>
                          <div className="text-sm text-light-text-muted dark:text-dark-text-muted">ETH</div>
                        </div>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-light-text-secondary dark:text-dark-text-secondary">
                      0.95 ETH
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-light-text-primary dark:text-dark-text-primary">
                      $2,130.85
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-red-600 dark:text-red-500">
                      -1.2%
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
          <div className="mt-4 text-center">
            <button className="rounded-md bg-brand-primary hover:bg-brand-light dark:hover:brightness-110 px-4 py-2 text-sm font-medium text-white hover:shadow-md transition-all">
              Add Asset
            </button>
          </div>
        </div>

        {/* Watchlist Section */}
        <div className="rounded-lg bg-light-bg-secondary dark:bg-dark-bg-secondary p-6 shadow-md border border-light-bg-accent dark:border-dark-bg-accent">
          <h2 className="mb-4 text-xl font-semibold text-light-text-primary dark:text-dark-text-primary">Your Watchlist</h2>
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-12 animate-pulse rounded bg-light-bg-accent dark:bg-dark-bg-accent"></div>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {/* Sample watchlist data - in real app, this would come from the API */}
              <div className="flex items-center justify-between rounded-lg border border-light-bg-accent dark:border-dark-bg-accent p-3 hover:bg-light-bg-accent/30 dark:hover:bg-dark-bg-accent/30 transition-colors">
                <div className="flex items-center">
                  <div className="h-8 w-8 flex-shrink-0 rounded-full bg-purple-100 dark:bg-purple-900/40 flex items-center justify-center text-purple-600 dark:text-purple-400 font-bold text-xs">
                    SOL
                  </div>
                  <div className="ml-3">
                    <div className="text-sm font-medium text-light-text-primary dark:text-dark-text-primary">Solana</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-light-text-primary dark:text-dark-text-primary">$105.72</div>
                  <div className="text-xs text-green-600 dark:text-green-500">+8.4%</div>
                </div>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-light-bg-accent dark:border-dark-bg-accent p-3 hover:bg-light-bg-accent/30 dark:hover:bg-dark-bg-accent/30 transition-colors">
                <div className="flex items-center">
                  <div className="h-8 w-8 flex-shrink-0 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold text-xs">
                    LINK
                  </div>
                  <div className="ml-3">
                    <div className="text-sm font-medium text-light-text-primary dark:text-dark-text-primary">Chainlink</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-light-text-primary dark:text-dark-text-primary">$14.25</div>
                  <div className="text-xs text-red-600 dark:text-red-500">-2.1%</div>
                </div>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-light-bg-accent dark:border-dark-bg-accent p-3 hover:bg-light-bg-accent/30 dark:hover:bg-dark-bg-accent/30 transition-colors">
                <div className="flex items-center">
                  <div className="h-8 w-8 flex-shrink-0 rounded-full bg-green-100 dark:bg-green-900/40 flex items-center justify-center text-green-600 dark:text-green-400 font-bold text-xs">
                    AVAX
                  </div>
                  <div className="ml-3">
                    <div className="text-sm font-medium text-light-text-primary dark:text-dark-text-primary">Avalanche</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-light-text-primary dark:text-dark-text-primary">$35.76</div>
                  <div className="text-xs text-green-600 dark:text-green-500">+5.2%</div>
                </div>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-light-bg-accent dark:border-dark-bg-accent p-3 hover:bg-light-bg-accent/30 dark:hover:bg-dark-bg-accent/30 transition-colors">
                <div className="flex items-center">
                  <div className="h-8 w-8 flex-shrink-0 rounded-full bg-red-100 dark:bg-red-900/40 flex items-center justify-center text-red-600 dark:text-red-400 font-bold text-xs">
                    DOT
                  </div>
                  <div className="ml-3">
                    <div className="text-sm font-medium text-light-text-primary dark:text-dark-text-primary">Polkadot</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-light-text-primary dark:text-dark-text-primary">$6.89</div>
                  <div className="text-xs text-green-600 dark:text-green-500">+1.8%</div>
                </div>
              </div>
            </div>
          )}
          <div className="mt-4 flex justify-center">
            <button className="rounded-md bg-light-bg-accent dark:bg-dark-bg-accent text-light-text-secondary dark:text-dark-text-secondary px-4 py-2 text-sm font-medium hover:bg-light-bg-accent/80 dark:hover:bg-dark-bg-accent/80 transition-colors">
              Edit Watchlist
            </button>
          </div>
        </div>
      </div>

      {/* News Section */}
      <div className="mt-8 rounded-lg bg-light-bg-secondary dark:bg-dark-bg-secondary p-6 shadow-md">
        <h2 className="mb-4 text-xl font-semibold text-light-text-primary dark:text-dark-text-primary">Latest Crypto News</h2>
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-24 animate-pulse rounded bg-light-bg-accent dark:bg-dark-bg-accent"></div>
            ))}
          </div>
        ) : (
          <div className="space-y-6">
            {/* Sample news data - in real app, this would come from the API */}
            <div className="border-b border-light-bg-accent dark:border-dark-bg-accent pb-6">
              <h3 className="text-lg font-medium text-light-text-primary dark:text-dark-text-primary">
                Bitcoin Reaches New Monthly High as Institutional Interest Grows
              </h3>
              <p className="mt-1 text-sm text-light-text-secondary dark:text-dark-text-secondary">
                Bitcoin surged to a new monthly high as institutional investors continue to show strong interest in the leading cryptocurrency...
              </p>
              <div className="mt-2 flex items-center text-sm text-light-text-muted dark:text-dark-text-muted">
                <span>CryptoNews</span>
                <span className="mx-2">•</span>
                <span>2 hours ago</span>
              </div>
            </div>
            <div className="border-b border-light-bg-accent dark:border-dark-bg-accent pb-6">
              <h3 className="text-lg font-medium text-light-text-primary dark:text-dark-text-primary">
                Ethereum Developers Announce Major Update to Scaling Solutions
              </h3>
              <p className="mt-1 text-sm text-light-text-secondary dark:text-dark-text-secondary">
                Ethereum developers have announced a significant update to the network's scaling solutions, aimed at reducing gas fees and increasing transaction throughput...
              </p>
              <div className="mt-2 flex items-center text-sm text-light-text-muted dark:text-dark-text-muted">
                <span>BlockchainDaily</span>
                <span className="mx-2">•</span>
                <span>5 hours ago</span>
              </div>
            </div>
          </div>
        )}
        <div className="mt-4 text-center">
          <Link
            href="/resources"
            className="text-brand-primary hover:text-brand-light dark:hover:text-brand-dark"
          >
            View all news →
          </Link>
        </div>
      </div>
    </div>
  );
} 