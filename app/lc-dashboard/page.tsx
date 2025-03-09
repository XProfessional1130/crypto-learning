'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LCDashboard() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('team-portfolio');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is authenticated
    if (!loading && !user) {
      router.push('/auth/signin');
    }
  }, [user, loading, router]);

  useEffect(() => {
    // Simulate data loading
    if (user) {
      setTimeout(() => {
        setIsLoading(false);
      }, 1500);
    }
  }, [user]);

  if (loading || !user) {
    return (
      <div className="flex min-h-[calc(100vh-16rem)] items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'team-portfolio':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">LC Team Portfolio</h2>
            <p className="text-gray-600">
              Our team's top picks and current market allocations. This portfolio is managed by our expert analysts and is updated regularly.
            </p>
            
            {isLoading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-16 animate-pulse rounded bg-gray-200"></div>
                ))}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                        Asset
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                        Allocation
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                        Current Price
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                        7d Change
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                        Target Price
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {/* Sample portfolio data */}
                    <tr>
                      <td className="whitespace-nowrap px-6 py-4">
                        <div className="flex items-center">
                          <div className="h-10 w-10 flex-shrink-0 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-bold">
                            BTC
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">Bitcoin</div>
                            <div className="text-sm text-gray-500">BTC</div>
                          </div>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                        45%
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                        $41,235
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-green-600">
                        +3.5%
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                        $55,000
                      </td>
                    </tr>
                    <tr>
                      <td className="whitespace-nowrap px-6 py-4">
                        <div className="flex items-center">
                          <div className="h-10 w-10 flex-shrink-0 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                            ETH
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">Ethereum</div>
                            <div className="text-sm text-gray-500">ETH</div>
                          </div>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                        30%
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                        $2,243
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-red-600">
                        -1.2%
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                        $3,000
                      </td>
                    </tr>
                    <tr>
                      <td className="whitespace-nowrap px-6 py-4">
                        <div className="flex items-center">
                          <div className="h-10 w-10 flex-shrink-0 rounded-full bg-green-100 flex items-center justify-center text-green-600 font-bold">
                            SOL
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">Solana</div>
                            <div className="text-sm text-gray-500">SOL</div>
                          </div>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                        15%
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                        $105.72
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-green-600">
                        +8.4%
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                        $150
                      </td>
                    </tr>
                    <tr>
                      <td className="whitespace-nowrap px-6 py-4">
                        <div className="flex items-center">
                          <div className="h-10 w-10 flex-shrink-0 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 font-bold">
                            LINK
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">Chainlink</div>
                            <div className="text-sm text-gray-500">LINK</div>
                          </div>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                        10%
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                        $14.25
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-red-600">
                        -2.1%
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                        $20
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
            
            <div className="bg-indigo-50 p-4 rounded-lg mt-6">
              <h3 className="text-lg font-medium text-indigo-800">Portfolio Analysis</h3>
              <p className="text-indigo-600 mt-1">
                Our team is currently overweight on Bitcoin and Solana due to strong technical signals and increasing institutional adoption. We expect a market correction in Q3 but remain bullish on the long-term outlook.
              </p>
            </div>
          </div>
        );
      
      case 'altcoin-watchlist':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Altcoin Watchlist</h2>
            <p className="text-gray-600">
              Promising altcoins with strong fundamentals and growth potential. These assets are on our radar for potential future inclusion in our portfolio.
            </p>
            
            {isLoading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-16 animate-pulse rounded bg-gray-200"></div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {/* Sample altcoin cards */}
                <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="h-10 w-10 flex-shrink-0 rounded-full bg-red-100 flex items-center justify-center text-red-600 font-bold">
                        ATOM
                      </div>
                      <div className="ml-3">
                        <div className="text-lg font-medium text-gray-900">Cosmos</div>
                        <div className="text-sm text-gray-500">ATOM</div>
                      </div>
                    </div>
                    <div className="text-sm font-medium text-green-600">+12.4%</div>
                  </div>
                  <div className="mt-4">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Current Price</span>
                      <span className="text-sm font-medium text-gray-900">$10.23</span>
                    </div>
                    <div className="mt-1 flex justify-between">
                      <span className="text-sm text-gray-500">Market Cap</span>
                      <span className="text-sm font-medium text-gray-900">$3.8B</span>
                    </div>
                    <div className="mt-1 flex justify-between">
                      <span className="text-sm text-gray-500">Volume (24h)</span>
                      <span className="text-sm font-medium text-gray-900">$287M</span>
                    </div>
                  </div>
                  <div className="mt-4 text-sm text-gray-600">
                    Cosmos ecosystem continues to show strong growth with new chain integrations.
                  </div>
                </div>
                
                <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="h-10 w-10 flex-shrink-0 rounded-full bg-yellow-100 flex items-center justify-center text-yellow-600 font-bold">
                        AVAX
                      </div>
                      <div className="ml-3">
                        <div className="text-lg font-medium text-gray-900">Avalanche</div>
                        <div className="text-sm text-gray-500">AVAX</div>
                      </div>
                    </div>
                    <div className="text-sm font-medium text-green-600">+5.7%</div>
                  </div>
                  <div className="mt-4">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Current Price</span>
                      <span className="text-sm font-medium text-gray-900">$27.85</span>
                    </div>
                    <div className="mt-1 flex justify-between">
                      <span className="text-sm text-gray-500">Market Cap</span>
                      <span className="text-sm font-medium text-gray-900">$9.2B</span>
                    </div>
                    <div className="mt-1 flex justify-between">
                      <span className="text-sm text-gray-500">Volume (24h)</span>
                      <span className="text-sm font-medium text-gray-900">$412M</span>
                    </div>
                  </div>
                  <div className="mt-4 text-sm text-gray-600">
                    Avalanche is gaining traction with institutional investors and DeFi users.
                  </div>
                </div>
                
                <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="h-10 w-10 flex-shrink-0 rounded-full bg-pink-100 flex items-center justify-center text-pink-600 font-bold">
                        MATIC
                      </div>
                      <div className="ml-3">
                        <div className="text-lg font-medium text-gray-900">Polygon</div>
                        <div className="text-sm text-gray-500">MATIC</div>
                      </div>
                    </div>
                    <div className="text-sm font-medium text-red-600">-3.2%</div>
                  </div>
                  <div className="mt-4">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Current Price</span>
                      <span className="text-sm font-medium text-gray-900">$0.92</span>
                    </div>
                    <div className="mt-1 flex justify-between">
                      <span className="text-sm text-gray-500">Market Cap</span>
                      <span className="text-sm font-medium text-gray-900">$8.5B</span>
                    </div>
                    <div className="mt-1 flex justify-between">
                      <span className="text-sm text-gray-500">Volume (24h)</span>
                      <span className="text-sm font-medium text-gray-900">$356M</span>
                    </div>
                  </div>
                  <div className="mt-4 text-sm text-gray-600">
                    Polygon's zkEVM solution is showing promise for Ethereum scaling.
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      
      case 'market-analysis':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Market Analysis</h2>
            <p className="text-gray-600">
              Our expert analysis of current market conditions, trends, and on-chain metrics.
            </p>
            
            {isLoading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-24 animate-pulse rounded bg-gray-200"></div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                {/* Fear & Greed Index */}
                <div className="rounded-lg bg-white p-6 shadow-md">
                  <h3 className="text-xl font-medium text-gray-900">Fear & Greed Index</h3>
                  <div className="mt-4 flex items-center">
                    <div className="relative h-6 w-full rounded-full bg-gray-200">
                      <div className="absolute left-0 top-0 h-6 w-2/3 rounded-full bg-yellow-500"></div>
                    </div>
                    <span className="ml-4 text-xl font-bold text-gray-900">63</span>
                  </div>
                  <p className="mt-2 text-yellow-600">Greed</p>
                  <p className="mt-4 text-sm text-gray-600">
                    The market is currently in a state of greed, indicating potential overvaluation. This could be a signal for cautious investment strategies.
                  </p>
                </div>
                
                {/* On-Chain Activity */}
                <div className="rounded-lg bg-white p-6 shadow-md">
                  <h3 className="text-xl font-medium text-gray-900">On-Chain Activity</h3>
                  <div className="mt-4 space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Bitcoin Active Addresses</span>
                      <span className="text-sm font-medium text-green-600">+12% (30d)</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Ethereum Gas Price</span>
                      <span className="text-sm font-medium text-red-600">-8% (7d)</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Exchange BTC Reserves</span>
                      <span className="text-sm font-medium text-green-600">-2.3% (30d)</span>
                    </div>
                  </div>
                  <p className="mt-4 text-sm text-gray-600">
                    Decreasing exchange reserves and increasing active addresses suggest accumulation phase is ongoing.
                  </p>
                </div>
                
                {/* Whale Wallet Tracking */}
                <div className="col-span-1 md:col-span-2 rounded-lg bg-white p-6 shadow-md">
                  <h3 className="text-xl font-medium text-gray-900">Whale Wallet Tracking</h3>
                  <div className="mt-4 overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                            Wallet
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                            Asset
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                            Action
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                            Amount
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                            Value
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                            Time
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 bg-white">
                        <tr>
                          <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-600">
                            0x7a2...3f1b
                          </td>
                          <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                            <div className="flex items-center">
                              <div className="h-5 w-5 flex-shrink-0 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-bold text-xs">
                                B
                              </div>
                              <span className="ml-2">BTC</span>
                            </div>
                          </td>
                          <td className="whitespace-nowrap px-6 py-4 text-sm text-green-600">
                            Buy
                          </td>
                          <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                            235 BTC
                          </td>
                          <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                            $9.7M
                          </td>
                          <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                            2 hours ago
                          </td>
                        </tr>
                        <tr>
                          <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-600">
                            0x3b4...9c7e
                          </td>
                          <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                            <div className="flex items-center">
                              <div className="h-5 w-5 flex-shrink-0 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs">
                                E
                              </div>
                              <span className="ml-2">ETH</span>
                            </div>
                          </td>
                          <td className="whitespace-nowrap px-6 py-4 text-sm text-red-600">
                            Sell
                          </td>
                          <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                            1,250 ETH
                          </td>
                          <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                            $2.8M
                          </td>
                          <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                            5 hours ago
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  <p className="mt-4 text-sm text-gray-600">
                    Significant BTC accumulation by institutional investors suggests confidence in the medium-term outlook.
                  </p>
                </div>
              </div>
            )}
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">LC Dashboard</h1>
        <p className="mt-1 text-gray-600">
          Expert analysis, team portfolio, and market insights from the LearningCrypto team.
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="mb-8 border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('team-portfolio')}
            className={`border-b-2 py-4 px-1 text-sm font-medium ${
              activeTab === 'team-portfolio'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
            }`}
          >
            Team Portfolio
          </button>
          <button
            onClick={() => setActiveTab('altcoin-watchlist')}
            className={`border-b-2 py-4 px-1 text-sm font-medium ${
              activeTab === 'altcoin-watchlist'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
            }`}
          >
            Altcoin Watchlist
          </button>
          <button
            onClick={() => setActiveTab('market-analysis')}
            className={`border-b-2 py-4 px-1 text-sm font-medium ${
              activeTab === 'market-analysis'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
            }`}
          >
            Market Analysis
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        {renderTabContent()}
      </div>
    </div>
  );
} 