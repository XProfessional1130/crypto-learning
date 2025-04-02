'use client';

import { useState, useEffect, useMemo, Suspense, useCallback } from 'react';
import { useTeamData } from '@/lib/providers/team-data-provider';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { ReactNode } from 'react';
import { TrendingUp, TrendingDown, Activity, DollarSign, AlertCircle, PlusCircle } from 'lucide-react';
import { useAuthRedirect } from '@/hooks/auth/useAuthRedirect';
import { useDataCache } from '@/lib/providers/data-cache-provider';
import { useModal } from '@/lib/providers/modal-provider';
import type { GlobalData } from '@/lib/api/coinmarketcap';
import DashboardLayout from '@/components/features/dashboard/DashboardLayout';
import { 
  DataCard,
  SectionLoader,
  ErrorDisplay
} from '@/components/features/dashboard/DashboardUI';
import MarketOverview from '@/components/features/dashboard/MarketOverview';
import TeamAddCoinModal from '@/components/features/dashboard/TeamAddCoinModal';
import TeamAddToWatchlistModal from '@/components/features/dashboard/TeamAddToWatchlistModal';
import PaidMembersOnly from '@/components/auth/PaidMembersOnly';

// Loading skeletons for better UX during component loading
const PortfolioLoadingSkeleton = () => (
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

const WatchlistLoadingSkeleton = () => (
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

// Dynamically import heavy components with proper loading skeletons
const TeamPortfolio = dynamic(() => import('@/components/features/dashboard/TeamPortfolio'), {
  loading: () => <PortfolioLoadingSkeleton />,
  ssr: false // Disable SSR for these components to prevent double initialization
});

const TeamWatchlist = dynamic(() => import('@/components/features/dashboard/TeamWatchlist'), {
  loading: () => <WatchlistLoadingSkeleton />,
  ssr: false // Disable SSR for these components to prevent double initialization
});

// Consolidated Market Card Component that replaces the four separate widgets
const ConsolidatedMarketCard = ({ 
  loading = false, 
  globalData,
  btcPrice,
  ethPrice
}: { 
  loading?: boolean, 
  globalData?: GlobalData | null,
  btcPrice?: number | null,
  ethPrice?: number | null
}) => {
  // Function to format large numbers with appropriate suffixes
  const formatNumber = (num: number, decimals = 2): string => {
    if (num >= 1e12) return `${(num / 1e12).toFixed(decimals)}T`;
    if (num >= 1e9) return `${(num / 1e9).toFixed(decimals)}B`;
    if (num >= 1e6) return `${(num / 1e6).toFixed(decimals)}M`;
    if (num >= 1e3) return `${(num / 1e3).toFixed(decimals)}K`;
    return num.toFixed(decimals);
  };
  
  // Helper function to render trend indicators
  const renderTrend = (value: number | undefined) => {
    if (value === undefined) return null;
    const isPositive = value >= 0;
    return (
      <span className={`flex items-center text-xs ml-1 ${isPositive ? "text-emerald-500" : "text-rose-500"}`}>
        {isPositive ? 
          <TrendingUp className="h-3 w-3 mr-0.5" /> : 
          <TrendingDown className="h-3 w-3 mr-0.5" />
        }
        {Math.abs(value).toFixed(1)}%
      </span>
    );
  };
  
  // Get Fear & Greed styling based on classification
  const getFearGreedColor = (classification: string | undefined) => {
    if (!classification) return "bg-gray-500";
    
    const colors: { [key: string]: string } = {
      "Extreme Fear": "bg-rose-500",
      "Fear": "bg-orange-500",
      "Neutral": "bg-amber-400",
      "Greed": "bg-emerald-500",
      "Extreme Greed": "bg-emerald-600"
    };
    
    return colors[classification] || "bg-gray-500";
  };
  
  // Get text color for fear & greed classification
  const getFearGreedTextColor = (classification: string | undefined) => {
    if (!classification) return "text-gray-500";
    
    const colors: { [key: string]: string } = {
      "Extreme Fear": "text-rose-500",
      "Fear": "text-orange-500",
      "Neutral": "text-amber-500",
      "Greed": "text-emerald-500",
      "Extreme Greed": "text-emerald-600"
    };
    
    return colors[classification] || "text-gray-500";
  };
  
  // Use real Fear & Greed data from globalData when available
  const fearGreedValue = globalData?.fearGreedValue ?? 50;
  
  // Derive classification from value if needed
  let fearGreedClassification = globalData?.fearGreedClassification;
  
  // Override classification based on value to ensure consistency with displayed ranges
  if (fearGreedValue <= 24) {
    fearGreedClassification = "Extreme Fear";
  } else if (fearGreedValue <= 49) {
    fearGreedClassification = "Fear";
  } else if (fearGreedValue === 50) {
    fearGreedClassification = "Neutral";
  } else if (fearGreedValue > 50) {
    fearGreedClassification = "Greed";
  }
  
  const fearGreedColor = getFearGreedColor(fearGreedClassification);
  const fearGreedTextColor = getFearGreedTextColor(fearGreedClassification);
  
  // Calculate altcoin dominance if not present in globalData
  const altcoinDominance = globalData?.altcoinDominance ?? 
    (globalData ? 100 - globalData.btcDominance - globalData.ethDominance : 0);

  // Generate sparkline-like mini chart for visual effect (simulated data)
  const generateSparklineData = (trend: number | undefined): string => {
    if (trend === undefined) return "M0,10 L10,10";
    
    // Create a wavy line based on trend
    const isPositive = trend >= 0;
    const points = [];
    const amplitude = Math.min(Math.abs(trend), 20) / 2;
    
    for (let i = 0; i < 10; i++) {
      const x = i * 3;
      // For positive trend, end higher; for negative, end lower
      const yOffset = isPositive ? -i * 0.5 : i * 0.5;
      const y = 10 + Math.sin(i * 0.6) * amplitude + yOffset;
      points.push(`${x},${y}`);
    }
    
    return `M${points.join(' L')}`;
  };
  
  // Generate data for each metric
  const marketCapSparkline = generateSparklineData(undefined);
  const volumeSparkline = generateSparklineData(undefined);
  const addressesSparkline = generateSparklineData(globalData?.activeAddressesChange24h);
  const whaleSparkline = generateSparklineData(globalData?.largeTransactionsChange24h);
  
  return (
    <div className="bg-white dark:bg-gradient-to-br dark:from-slate-800 dark:to-slate-900 bg-gradient-to-br from-gray-50 to-white p-5 rounded-xl shadow-md dark:shadow-lg border border-gray-200 dark:border-slate-700/50 backdrop-blur-sm transition-all duration-300">
      {/* Glass-like header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 pb-3 border-b border-gray-200 dark:border-slate-700/50">
        <h2 className="text-xl font-bold text-gray-800 dark:text-white tracking-tight flex items-center">
          <div className="w-2 h-8 bg-blue-500 rounded-full mr-2 animate-pulse"></div>
          Global Market Overview
        </h2>
        <div className="flex items-center mt-1 sm:mt-0 bg-gray-100/80 dark:bg-slate-800/80 px-3 py-1.5 rounded-full border border-gray-200 dark:border-slate-700/50 backdrop-blur-sm">
          <span className="text-xs text-gray-600 dark:text-slate-300 flex items-center">
            <span className="mr-1">Market Pulse:</span>
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium 
              ${fearGreedTextColor} bg-gray-50 dark:bg-slate-800/80 border border-gray-200 dark:border-slate-700/50`}>
              {fearGreedClassification}
            </span>
          </span>
        </div>
      </div>
      
      {loading ? (
        <div className="animate-pulse space-y-3">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 dark:bg-slate-700/50 rounded-lg"></div>
            ))}
          </div>
          <div className="h-36 bg-gray-200 dark:bg-slate-700/50 rounded-lg mt-3"></div>
        </div>
      ) : (
        <>
          {/* Main dashboard area */}
          <div className="grid grid-cols-12 gap-3">
            {/* Top Row - Key metrics that show health of market */}
            <div className="col-span-12 mb-2 flex items-center">
              <div className="h-1.5 w-1.5 rounded-full bg-blue-500 mr-2"></div>
              <h3 className="text-sm font-medium text-gray-700 dark:text-slate-300">Key Market Indicators</h3>
            </div>
            
            {/* Market Cap - Styled as a premium metric card */}
            <div className="col-span-6 sm:col-span-6 md:col-span-3 bg-gradient-to-br from-blue-50 to-blue-100/70 dark:from-blue-900/20 dark:to-blue-800/10 rounded-lg border border-blue-200 dark:border-blue-700/20 p-3 relative overflow-hidden group transition-all hover:shadow-md">
              <div className="absolute inset-0 bg-blue-500/5 dark:bg-blue-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center text-xs text-gray-500 dark:text-slate-400 mb-0.5">
                    <DollarSign className="w-3 h-3 mr-1 text-blue-500 dark:text-blue-400" />
                    <span>Market Cap</span>
                  </div>
                  <p className="text-lg font-bold text-gray-800 dark:text-white">
                    ${globalData && globalData.totalMarketCap ? formatNumber(globalData.totalMarketCap, 2) : '0'}
                  </p>
                  <div className="flex items-center text-xs text-gray-500 dark:text-slate-400 mt-1">
                    <span>{globalData?.totalCryptocurrencies ?? 0} assets</span>
                    {globalData && 'totalMarketCapChange24h' in globalData && (globalData as any).totalMarketCapChange24h !== undefined && (
                      <span className={`ml-2 px-1.5 py-0.5 rounded-full ${(globalData as any).totalMarketCapChange24h >= 0 ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400' : 'bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400'}`}>
                        {(globalData as any).totalMarketCapChange24h >= 0 ? '+' : ''}{(globalData as any).totalMarketCapChange24h.toFixed(1)}%
                      </span>
                    )}
                  </div>
                </div>
                <div className="h-10 w-16">
                  <svg viewBox="0 0 30 20" className="h-full w-full">
                    <path 
                      d={marketCapSparkline} 
                      fill="none" 
                      stroke={globalData && 'totalMarketCapChange24h' in globalData && (globalData as any).totalMarketCapChange24h !== undefined && (globalData as any).totalMarketCapChange24h >= 0 ? "#059669" : "#e11d48"} 
                      strokeWidth="1.5" 
                    />
                  </svg>
                </div>
              </div>
              
              {/* Animated gradient background effect */}
              <div className="absolute -bottom-6 -right-6 w-16 h-16 rounded-full bg-blue-500/10 blur-xl"></div>
            </div>
            
            {/* 24h Volume */}
            <div className="col-span-6 sm:col-span-6 md:col-span-3 bg-gradient-to-br from-purple-50 to-purple-100/70 dark:from-purple-900/20 dark:to-purple-800/10 rounded-lg border border-purple-200 dark:border-purple-700/20 p-3 relative overflow-hidden group transition-all hover:shadow-md">
              <div className="absolute inset-0 bg-purple-500/5 dark:bg-purple-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center text-xs text-gray-500 dark:text-slate-400 mb-0.5">
                    <Activity className="w-3 h-3 mr-1 text-purple-500 dark:text-purple-400" />
                    <span>24h Volume</span>
                  </div>
                  <p className="text-lg font-bold text-gray-800 dark:text-white">
                    ${globalData && globalData.totalVolume24h ? formatNumber(globalData.totalVolume24h, 2) : '0'}
                  </p>
                  <div className="flex items-center text-xs text-gray-500 dark:text-slate-400 mt-1">
                    <span>{globalData?.totalExchanges ?? 0} exchanges</span>
                    {globalData && 'totalVolume24hChange' in globalData && (globalData as any).totalVolume24hChange !== undefined && (
                      <span className={`ml-2 px-1.5 py-0.5 rounded-full ${(globalData as any).totalVolume24hChange >= 0 ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400' : 'bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400'}`}>
                        {(globalData as any).totalVolume24hChange >= 0 ? '+' : ''}{(globalData as any).totalVolume24hChange.toFixed(1)}%
                      </span>
                    )}
                  </div>
                </div>
                <div className="h-10 w-16">
                  <svg viewBox="0 0 30 20" className="h-full w-full">
                    <path 
                      d={volumeSparkline} 
                      fill="none" 
                      stroke={globalData && 'totalVolume24hChange' in globalData && (globalData as any).totalVolume24hChange !== undefined && (globalData as any).totalVolume24hChange >= 0 ? "#059669" : "#e11d48"} 
                      strokeWidth="1.5" 
                    />
                  </svg>
                </div>
              </div>
              
              {/* Animated gradient background effect */}
              <div className="absolute -bottom-6 -right-6 w-16 h-16 rounded-full bg-purple-500/10 blur-xl"></div>
            </div>
            
            {/* Active Addresses */}
            <div className="col-span-6 sm:col-span-6 md:col-span-3 bg-gradient-to-br from-teal-50 to-teal-100/70 dark:from-teal-900/20 dark:to-teal-800/10 rounded-lg border border-teal-200 dark:border-teal-700/20 p-3 relative overflow-hidden group transition-all hover:shadow-md">
              <div className="absolute inset-0 bg-teal-500/5 dark:bg-teal-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center text-xs text-gray-500 dark:text-slate-400 mb-0.5">
                    <svg className="w-3 h-3 mr-1 text-teal-500 dark:text-teal-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    <span>Active Addresses</span>
                  </div>
                  <p className="text-lg font-bold text-gray-800 dark:text-white">
                    {globalData?.activeAddressesCount 
                      ? formatNumber(globalData.activeAddressesCount, 0) 
                      : '0'}
                  </p>
                  <div className="flex items-center text-xs text-gray-500 dark:text-slate-400 mt-1">
                    <span>On-chain activity</span>
                    {globalData?.activeAddressesChange24h !== undefined && (
                      <span className={`ml-2 px-1.5 py-0.5 rounded-full ${globalData.activeAddressesChange24h >= 0 ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400' : 'bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400'}`}>
                        {globalData.activeAddressesChange24h >= 0 ? '+' : ''}{globalData.activeAddressesChange24h.toFixed(1)}%
                      </span>
                    )}
                  </div>
                </div>
                <div className="h-10 w-16">
                  <svg viewBox="0 0 30 20" className="h-full w-full">
                    <path 
                      d={addressesSparkline} 
                      fill="none" 
                      stroke={globalData?.activeAddressesChange24h && globalData.activeAddressesChange24h >= 0 ? "#059669" : "#e11d48"} 
                      strokeWidth="1.5" 
                    />
                  </svg>
                </div>
              </div>
              
              {/* Animated gradient background effect */}
              <div className="absolute -bottom-6 -right-6 w-16 h-16 rounded-full bg-teal-500/10 blur-xl"></div>
            </div>
            
            {/* Whale Transactions */}
            <div className="col-span-6 sm:col-span-6 md:col-span-3 bg-gradient-to-br from-amber-50 to-amber-100/70 dark:from-amber-900/20 dark:to-amber-800/10 rounded-lg border border-amber-200 dark:border-amber-700/20 p-3 relative overflow-hidden group transition-all hover:shadow-md">
              <div className="absolute inset-0 bg-amber-500/5 dark:bg-amber-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center text-xs text-gray-500 dark:text-slate-400 mb-0.5">
                    <DollarSign className="w-3 h-3 mr-1 text-amber-500 dark:text-amber-400" />
                    <span>Whale Transactions</span>
                  </div>
                  <p className="text-lg font-bold text-gray-800 dark:text-white">
                    {globalData?.largeTransactionsCount
                      ? formatNumber(globalData.largeTransactionsCount, 0)
                      : '0'}
                  </p>
                  <div className="flex items-center text-xs text-gray-500 dark:text-slate-400 mt-1">
                    <span>Large transfers ({'>'}$100K)</span>
                    {globalData?.largeTransactionsChange24h !== undefined && (
                      <span className={`ml-2 px-1.5 py-0.5 rounded-full ${globalData.largeTransactionsChange24h >= 0 ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400' : 'bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400'}`}>
                        {globalData.largeTransactionsChange24h >= 0 ? '+' : ''}{globalData.largeTransactionsChange24h.toFixed(1)}%
                      </span>
                    )}
                  </div>
                </div>
                <div className="h-10 w-16">
                  <svg viewBox="0 0 30 20" className="h-full w-full">
                    <path 
                      d={whaleSparkline} 
                      fill="none" 
                      stroke={globalData?.largeTransactionsChange24h && globalData.largeTransactionsChange24h >= 0 ? "#059669" : "#e11d48"} 
                      strokeWidth="1.5" 
                    />
                  </svg>
                </div>
              </div>
              
              {/* Animated gradient background effect */}
              <div className="absolute -bottom-6 -right-6 w-16 h-16 rounded-full bg-amber-500/10 blur-xl"></div>
            </div>
            
            {/* Market Composition Section */}
            <div className="col-span-12 mt-3 mb-2 flex items-center">
              <div className="h-1.5 w-1.5 rounded-full bg-blue-500 mr-2"></div>
              <h3 className="text-sm font-medium text-gray-700 dark:text-slate-300">Market Composition</h3>
            </div>
            
            {/* Crypto Ecosystem Visualization */}
            <div className="col-span-12 md:col-span-8 bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700/50 p-4 relative overflow-hidden shadow-sm">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-purple-500/3 to-amber-500/5 dark:from-blue-900/10 dark:via-purple-900/5 dark:to-amber-900/10 opacity-30"></div>
              
              {/* Section Title */}
              <div className="mb-3 flex justify-between items-center relative z-10">
                <span className="text-sm font-medium text-gray-800 dark:text-white">Crypto Ecosystem</span>
                <div className="flex text-xs text-gray-500 dark:text-slate-400 space-x-3">
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-amber-500 rounded-sm mr-1"></div>
                    <span>BTC</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-blue-500 rounded-sm mr-1"></div>
                    <span>ETH</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-fuchsia-500 rounded-sm mr-1"></div>
                    <span>Alts</span>
                  </div>
                </div>
              </div>
              
              {/* Market Distribution Visualization */}
              <div className="relative">
                {/* BTC Card */}
                <div className="bg-gradient-to-br from-amber-50 to-amber-100/70 dark:bg-gradient-to-br dark:from-amber-900/30 dark:to-amber-950/50 rounded-lg border border-amber-200 dark:border-amber-600/30 p-3 mb-3 relative overflow-hidden group">
                  <div className="absolute top-0 left-0 h-full bg-amber-400/10 dark:bg-amber-500/20" 
                       style={{ width: `${globalData?.btcDominance || 0}%` }}></div>
                  <div className="relative z-10 flex justify-between items-center">
                    <div className="flex items-center">
                      <svg className="w-5 h-5 text-amber-500 dark:text-amber-400 mr-2" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" />
                        <path d="M15 11.5V9h-4.5V6.5H9V9H7.5v1.5H9v6H7.5V18H9v2.5h1.5V18h4.5v-1.5h-4.5v-6h4.5V9h1.5v2.5H18V10h-1.5v1.5H15z" />
                      </svg>
                      <div>
                        <div className="text-amber-600 dark:text-amber-300 font-medium">Bitcoin</div>
                        <div className="text-xs text-gray-500 dark:text-slate-400">
                          {globalData?.btcDominance ? globalData.btcDominance.toFixed(1) : '0'}% market dominance
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-gray-800 dark:text-white font-bold">${btcPrice ? btcPrice.toLocaleString(undefined, { maximumFractionDigits: 0 }) : '0'}</div>
                      <div className="text-xs text-gray-500 dark:text-slate-400">Market Cap: ${formatNumber(globalData?.totalMarketCap ? (globalData.totalMarketCap * (globalData.btcDominance / 100)) : 0)}</div>
                    </div>
                  </div>
                </div>
                
                {/* ETH Card */}
                <div className="bg-gradient-to-br from-blue-50 to-blue-100/70 dark:bg-gradient-to-br dark:from-blue-900/30 dark:to-blue-950/50 rounded-lg border border-blue-200 dark:border-blue-600/30 p-3 mb-3 relative overflow-hidden group">
                  <div className="absolute top-0 left-0 h-full bg-blue-400/10 dark:bg-blue-500/20" 
                       style={{ width: `${globalData?.ethDominance || 0}%` }}></div>
                  <div className="relative z-10 flex justify-between items-center">
                    <div className="flex items-center">
                      <svg className="w-5 h-5 text-blue-500 dark:text-blue-400 mr-2" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" />
                        <path d="M11.5 7L7 12l4.5 3.5L16 12l-4.5-5zm0 7.5l-3-2.5 3-2.5 3 2.5-3 2.5z" />
                      </svg>
                      <div>
                        <div className="text-blue-600 dark:text-blue-300 font-medium">Ethereum</div>
                        <div className="text-xs text-gray-500 dark:text-slate-400">
                          {globalData?.ethDominance ? globalData.ethDominance.toFixed(1) : '0'}% market dominance
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-gray-800 dark:text-white font-bold">${ethPrice ? ethPrice.toLocaleString(undefined, { maximumFractionDigits: 0 }) : '0'}</div>
                      <div className="text-xs text-gray-500 dark:text-slate-400">Market Cap: ${formatNumber(globalData?.totalMarketCap ? (globalData.totalMarketCap * (globalData.ethDominance / 100)) : 0)}</div>
                    </div>
                  </div>
                </div>
                
                {/* Altcoin Market */}
                <div className="bg-gradient-to-br from-fuchsia-50 to-fuchsia-100/70 dark:bg-gradient-to-br dark:from-fuchsia-900/30 dark:to-fuchsia-950/50 rounded-lg border border-fuchsia-200 dark:border-fuchsia-600/30 p-3 relative overflow-hidden group">
                  <div className="absolute top-0 left-0 h-full bg-fuchsia-400/10 dark:bg-fuchsia-500/20" 
                       style={{ width: `${altcoinDominance || 0}%` }}></div>
                  <div className="relative z-10 flex justify-between items-center">
                    <div className="flex items-center">
                      <Activity className="w-5 h-5 text-fuchsia-500 dark:text-fuchsia-400 mr-2" />
                      <div>
                        <div className="text-fuchsia-600 dark:text-fuchsia-300 font-medium">Altcoin Market</div>
                        <div className="text-xs text-gray-500 dark:text-slate-400">
                          {altcoinDominance.toFixed(1)}% market dominance
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-gray-800 dark:text-white font-bold">${formatNumber(globalData?.totalMarketCap ? (globalData.totalMarketCap * (altcoinDominance / 100)) : 0)}</div>
                      <div className="text-xs text-gray-500 dark:text-slate-400">{globalData?.totalCryptocurrencies ? (globalData.totalCryptocurrencies - 2) : 0}+ altcoins</div>
                    </div>
                  </div>
                </div>
                
                {/* Decorative Elements */}
                <div className="absolute -bottom-8 -left-8 w-32 h-32 rounded-full bg-blue-500/5 dark:bg-blue-500/10 blur-xl"></div>
                <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-purple-500/5 dark:bg-purple-500/10 blur-xl"></div>
              </div>
            </div>
            
            {/* Fear & Greed Index Component */}
            <div className="col-span-12 md:col-span-4 bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700/50 p-4 relative overflow-hidden shadow-sm">
              <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 via-yellow-500/3 to-green-500/5 dark:from-red-900/10 dark:via-yellow-900/5 dark:to-green-900/10 opacity-30"></div>
              
              {/* Section Title */}
              <div className="mb-3 relative z-10">
                <div className="text-sm font-medium text-gray-800 dark:text-white flex items-center">
                  <AlertCircle className="w-4 h-4 mr-1 text-gray-500 dark:text-slate-400" />
                  Fear & Greed Index
                </div>
              </div>
              
              {/* F&G Meter with Advanced Styling */}
              <div className="bg-gray-50 dark:bg-slate-800/60 rounded-lg p-3 border border-gray-200 dark:border-slate-700/30">
                <div className="flex justify-between items-center">
                  <div className="text-xs text-gray-500 dark:text-slate-400">
                    Extreme Fear
                  </div>
                  <div className="text-xs text-gray-500 dark:text-slate-400">
                    Extreme Greed
                  </div>
                </div>
                
                {/* Main Meter */}
                <div className="relative mt-1 mb-3">
                  <div className="h-2.5 w-full bg-gray-200 dark:bg-slate-700 rounded-full overflow-hidden">
                    {/* Gradient Background */}
                    <div className="h-full w-full absolute top-0 left-0 bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 opacity-20 dark:opacity-30"></div>
                    
                    {/* Active Value */}
                    <div 
                      className={`h-full rounded-full ${fearGreedColor} relative`} 
                      style={{ width: `${fearGreedValue}%` }}
                    >
                      {/* Pulse Animation on Current Position */}
                      <div className="absolute right-0 -top-0.5 w-4 h-4 rounded-full bg-white/30 animate-ping"></div>
                      <div className="absolute right-0 top-0 w-3 h-3 rounded-full bg-white shadow-lg transform translate-x-1/2 -translate-y-1/4"></div>
                    </div>
                  </div>
                </div>
                
                {/* Fear & Greed Value Display */}
                <div className="mt-4">
                  <div className="flex items-center justify-center">
                    <div className={`text-4xl font-bold ${fearGreedTextColor}`}>
                      {fearGreedValue}
                    </div>
                    <div className="ml-2 text-sm">
                      <div className={`font-medium ${fearGreedTextColor}`}>
                        {fearGreedClassification}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-slate-400">Current market sentiment</div>
                    </div>
                  </div>
                </div>
                
                {/* Fear & Greed Context */}
                <div className="mt-3 pt-3 border-t border-gray-200 dark:border-slate-700/50 text-xs text-gray-500 dark:text-slate-400">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="inline-block w-2 h-2 bg-red-500 rounded-full mr-1"></span>
                      0-24: Extreme Fear
                    </div>
                    <div>
                      <span className="inline-block w-2 h-2 bg-orange-500 rounded-full mr-1"></span>
                      25-49: Fear
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <div>
                      <span className="inline-block w-2 h-2 bg-yellow-500 rounded-full mr-1"></span>
                      50: Neutral
                    </div>
                    <div>
                      <span className="inline-block w-2 h-2 bg-green-500 rounded-full mr-1"></span>
                      51-100: Greed
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Decorative Elements */}
              <div className="absolute -bottom-10 -right-10 w-32 h-32 rounded-full bg-gradient-to-r from-red-500/10 to-green-500/10 blur-xl"></div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default function LCDashboard() {
  const { user, authLoading, showContent } = useAuthRedirect();
  const router = useRouter();
  
  // Add a fail-safe timeout to ensure we eventually exit the loading state
  const [hasTimedOut, setHasTimedOut] = useState(false);
  
  // Use our shared data cache for market data
  const { 
    btcPrice, 
    ethPrice, 
    globalData, 
    isLoading: marketDataLoading,
    isRefreshing,
    refreshData,
    lastUpdated
  } = useDataCache();
  
  // Use the unified team data context instead of separate hooks
  const { 
    portfolio, 
    portfolioLoading,
    portfolioError,
    watchlist,
    watchlistLoading,
    watchlistError,
    getTargetPercentage,
    refreshPortfolio,
    refreshWatchlist,
    isAdmin
  } = useTeamData();
  
  // Use the modal context directly at component level
  const { openModal, closeModal } = useModal();
  
  // Create consistent animation classes based on loading state - initialize to true to avoid flicker
  const [initialLoadComplete, setInitialLoadComplete] = useState(true);
  
  // Track if content has been shown - once shown, never go back to loading
  const [hasShownContent, setHasShownContent] = useState(false);
  
  // Create handler functions for opening modals
  const handleOpenAddCoinModal = useCallback(() => {
    if (portfolio && isAdmin) {
      openModal(
        <TeamAddCoinModal
          onClose={closeModal}
          onCoinAdded={async (coin, amount) => {
            try {
              // Use TeamData context methods
              await refreshPortfolio(true);
              closeModal();
            } catch (error) {
              console.error('Error adding coin:', error);
            }
          }}
        />
      );
    }
  }, [portfolio, isAdmin, openModal, closeModal, refreshPortfolio]);
  
  const handleOpenAddToWatchlistModal = useCallback(() => {
    if (watchlist && isAdmin) {
      openModal(
        <TeamAddToWatchlistModal
          onClose={closeModal}
          isInWatchlist={(coinId) => {
            return watchlist.some(item => item.coinId.toString() === coinId.toString());
          }}
          onCoinAdded={async (coin, priceTarget) => {
            try {
              // Use TeamData context methods
              await refreshWatchlist(true);
              closeModal();
              return { success: true };
            } catch (error) {
              console.error('Error adding to watchlist:', error);
              return { success: false };
            }
          }}
        />
      );
    }
  }, [watchlist, isAdmin, openModal, closeModal, refreshWatchlist]);
  
  // Effect to track if content has been shown
  useEffect(() => {
    if (!marketDataLoading && !portfolioLoading && !watchlistLoading && 
        (portfolio || btcPrice || ethPrice || watchlist)) {
      setHasShownContent(true);
    }
  }, [marketDataLoading, portfolioLoading, watchlistLoading, 
      portfolio, btcPrice, ethPrice, watchlist]);
  
  // Ensure we exit loading state after a reasonable timeout
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setHasTimedOut(true);
      setInitialLoadComplete(true);
      setHasShownContent(true);
    }, 5000); // Reduced to 5 seconds
    
    return () => clearTimeout(timeoutId);
  }, []);

  // Force immediate data prefetch on first render to avoid white flash in widgets
  useEffect(() => {
    // This runs only once and immediately prefetches all data
    const fetchAllData = async () => {
      try {
        // Only prefetch market data if it's not already loaded
        if (!btcPrice || !ethPrice || !globalData) {
          console.log('Prefetching market data');
          refreshData().catch(err => console.error('Error prefetching market data:', err));
        }
        
        // Only prefetch portfolio data if it's not already loaded
        if (!portfolio) {
          console.log('Prefetching portfolio data');
          refreshPortfolio().catch(err => console.error('Error prefetching portfolio data:', err));
        }
        
        // Only prefetch watchlist data if it's not already loaded
        if (!watchlist) {
          console.log('Prefetching watchlist data');
          refreshWatchlist().catch(err => console.error('Error prefetching watchlist data:', err));
        }
      } catch (error) {
        console.error('Error during prefetch:', error);
      }
    };
    
    // Add a flag to prevent duplicate fetches when component remounts after tab switching
    if (typeof window !== 'undefined') {
      const lastFetchTime = parseInt(sessionStorage.getItem('dashboard_last_fetch') || '0', 10);
      const currentTime = Date.now();
      const timeSinceLastFetch = currentTime - lastFetchTime;
      
      // Only fetch if it's been more than 5 minutes since the last fetch or if it's the first fetch
      if (timeSinceLastFetch > 5 * 60 * 1000 || lastFetchTime === 0) {
        fetchAllData();
        sessionStorage.setItem('dashboard_last_fetch', currentTime.toString());
      } else {
        console.log('Skipping data fetch, last fetch was', Math.round(timeSinceLastFetch/1000), 'seconds ago');
      }
    } else {
      fetchAllData();
    }
  }, []); // Empty dependency array means this runs once on mount
  
  // Simplify loading state logic - never go back to loading once content shown
  const isLoading = hasTimedOut || hasShownContent ? false : 
                   (marketDataLoading || portfolioLoading || watchlistLoading);
  
  // Manual refresh function with visual feedback - simplified to prevent additional re-renders
  const handleManualRefresh = useCallback(() => {
    const refreshPromises = [
      refreshPortfolio(),
      refreshWatchlist(),
      refreshData()
    ];
    
    Promise.all(refreshPromises).catch(error => {
      console.error("Error during manual refresh:", error);
    });
  }, [refreshPortfolio, refreshWatchlist, refreshData]);

  // Show loading state while auth is being checked
  if (authLoading || !user) {
    return (
      <div className="flex min-h-[calc(100vh-16rem)] items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300 animate-pulse">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <PaidMembersOnly>
      <div className={`container mx-auto py-6 px-4 max-w-7xl transition-opacity-transform duration-600 ${showContent ? 'opacity-100' : 'opacity-0'}`}>
        {/* Dashboard Header */}
        <div className="w-full flex flex-col md:flex-row md:items-center md:justify-between mb-4">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-3 md:mb-0">Team Dashboard</h1>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleManualRefresh}
              disabled={isRefreshing}
              className={`px-3 py-1.5 rounded-lg bg-blue-500 hover:bg-blue-600 text-white transition-colors flex items-center ${isRefreshing ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              <svg className={`w-4 h-4 mr-1.5 ${isRefreshing ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
              </svg>
              {isRefreshing ? 'Refreshing...' : 'Refresh Data'}
            </button>
            {lastUpdated && (
              <span className="text-xs text-gray-500 dark:text-gray-400">
                Last updated: {lastUpdated.toLocaleTimeString()}
              </span>
            )}
          </div>
        </div>
        
        {/* Consolidated Market Card - replaces the four separate cards */}
        <div className="mb-8">
          <div className={initialLoadComplete ? "animate-scaleIn" : "opacity-0 transition-opacity-transform"} style={{ transitionDelay: '100ms', animationDelay: '100ms' }}>
            <ConsolidatedMarketCard 
              loading={isLoading} 
              globalData={globalData}
              btcPrice={btcPrice}
              ethPrice={ethPrice}
            />
          </div>
        </div>
        
        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Team Portfolio Section - Takes up 2/3 of the space */}
          <div className={`lg:col-span-2 ${initialLoadComplete ? "animate-slide-up" : "opacity-0 transition-opacity-transform"}`} style={{ transitionDelay: '300ms', animationDelay: '300ms' }}>
            <div className="bg-white dark:bg-gradient-to-br dark:from-slate-800 dark:to-slate-900 rounded-xl shadow-md dark:shadow-lg border border-gray-200 dark:border-slate-700/50 p-5 transition-all duration-300" style={{ minHeight: 'calc(100vh - 24rem)', overflow: 'visible' }}>
              {/* Portfolio Header */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 pb-3 border-b border-gray-200 dark:border-slate-700/50">
                <h2 className="text-xl font-bold text-gray-800 dark:text-white tracking-tight flex items-center">
                  <div className="w-2 h-8 bg-emerald-500 rounded-full mr-2 animate-pulse"></div>
                  Team Portfolio
                </h2>
                <div className="flex items-center gap-2">
                  {portfolio && !portfolioLoading && isAdmin && (
                    <button 
                      onClick={handleOpenAddCoinModal}
                      className="text-white bg-teal-600 hover:bg-teal-700 rounded-full w-7 h-7 flex items-center justify-center"
                    >
                      <PlusCircle className="h-5 w-5" />
                    </button>
                  )}
                  <div className="flex items-center mt-1 sm:mt-0 bg-gray-100/80 dark:bg-slate-800/80 px-3 py-1.5 rounded-full border border-gray-200 dark:border-slate-700/50 backdrop-blur-sm">
                    <span className="text-xs text-gray-600 dark:text-slate-300 flex items-center">
                      <span>Assets:</span>
                      <span className="ml-1.5 font-medium text-gray-800 dark:text-white">
                        {portfolio?.items?.length || 0}
                      </span>
                    </span>
                  </div>
                </div>
              </div>
              
              {/* Render without Suspense to prevent duplicate initialization */}
              {portfolioLoading ? (
                <PortfolioLoadingSkeleton />
              ) : (
                <div className="z-0" style={{ position: 'static' }}>
                  <TeamPortfolio 
                    portfolio={portfolio}
                    loading={portfolioLoading}
                    error={portfolioError}
                    isDataLoading={isLoading}
                    btcPrice={btcPrice}
                    ethPrice={ethPrice}
                    globalData={globalData}
                  />
                </div>
              )}
              
              <div className="relative pointer-events-none">
                {/* Decorative Elements */}
                <div className="absolute -bottom-8 -left-8 w-32 h-32 rounded-full bg-emerald-500/5 dark:bg-emerald-500/10 blur-xl"></div>
                <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-blue-500/5 dark:bg-blue-500/10 blur-xl"></div>
              </div>
            </div>
          </div>
          
          {/* Team Watchlist Section - Takes up 1/3 of the space */}
          <div className={`lg:col-span-1 ${initialLoadComplete ? "animate-slide-up" : "opacity-0 transition-opacity-transform"}`} style={{ transitionDelay: '300ms', animationDelay: '300ms' }}>
            <div className="bg-white dark:bg-gradient-to-br dark:from-slate-800 dark:to-slate-900 rounded-xl shadow-md dark:shadow-lg border border-gray-200 dark:border-slate-700/50 p-5 transition-all duration-300" style={{ minHeight: 'calc(100vh - 24rem)', overflow: 'visible' }}>
              {/* Watchlist Header */}
              <div className="flex flex-row justify-between items-center mb-4 pb-3 border-b border-gray-200 dark:border-slate-700/50">
                <h2 className="text-xl font-bold text-gray-800 dark:text-white tracking-tight flex items-center">
                  <div className="w-2 h-8 bg-violet-500 rounded-full mr-2 animate-pulse"></div>
                  Altcoin Watchlist
                </h2>
                <div className="flex items-center gap-2">
                  {watchlist && !watchlistLoading && isAdmin && (
                    <button 
                      onClick={handleOpenAddToWatchlistModal}
                      className="text-white bg-teal-600 hover:bg-teal-700 rounded-full w-7 h-7 flex items-center justify-center"
                    >
                      <PlusCircle className="h-5 w-5" />
                    </button>
                  )}
                  <div className="flex items-center bg-gray-100/80 dark:bg-slate-800/80 px-3 py-1.5 rounded-full border border-gray-200 dark:border-slate-700/50 backdrop-blur-sm">
                    <span className="text-xs text-gray-600 dark:text-slate-300">
                      {watchlist?.length || 0} assets
                    </span>
                  </div>
                </div>
              </div>
              
              {/* Render without Suspense to prevent duplicate initialization */}
              {watchlistLoading ? (
                <WatchlistLoadingSkeleton />
              ) : (
                <div className="z-0" style={{ position: 'static' }}>
                  <TeamWatchlist 
                    watchlist={watchlist}
                    loading={watchlistLoading}
                    error={watchlistError}
                    isDataLoading={isLoading}
                    globalData={globalData}
                    getTargetPercentage={getTargetPercentage}
                  />
                </div>
              )}
              
              <div className="relative pointer-events-none">
                {/* Decorative Elements */}
                <div className="absolute -bottom-8 -right-8 w-32 h-32 rounded-full bg-violet-500/5 dark:bg-violet-500/10 blur-xl"></div>
                <div className="absolute -top-8 -left-8 w-24 h-24 rounded-full bg-indigo-500/5 dark:bg-indigo-500/10 blur-xl"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PaidMembersOnly>
  );
} 