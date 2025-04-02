'use client';

import { useState, useEffect } from 'react';
import withPremiumContentProtection from '@/lib/hoc/withPremiumContentProtection';
import Image from 'next/image';

interface ArticleProps {
  isPremium?: boolean;
  preview?: React.ReactNode;
}

function Article({ isPremium }: ArticleProps) {
  const [publishDate] = useState(new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }));
  
  return (
    <div className="container max-w-4xl mx-auto py-12 px-4">
      <article className="prose prose-lg dark:prose-invert max-w-none">
        <h1 className="text-3xl md:text-4xl font-bold mb-4">Advanced Crypto Trading Strategies</h1>
        
        <div className="flex items-center text-gray-600 dark:text-gray-400 mb-6">
          <div className="flex items-center">
            <div className="w-10 h-10 rounded-full bg-gray-300 dark:bg-gray-700 mr-3"></div>
            <span className="font-medium">Learning Crypto Team</span>
          </div>
          <span className="mx-3">•</span>
          <span>{publishDate}</span>
          {isPremium && (
            <>
              <span className="mx-3">•</span>
              <span className="bg-brand-500/10 text-brand-600 dark:text-brand-400 text-xs font-semibold px-2.5 py-1 rounded">
                Premium Content
              </span>
            </>
          )}
        </div>
        
        <div className="relative w-full h-72 md:h-96 mb-8 rounded-lg overflow-hidden">
          <Image 
            src="/images/trading.jpg" 
            alt="Advanced Crypto Trading Strategies" 
            fill
            style={{ objectFit: 'cover' }}
            priority
          />
        </div>

        <h2>Introduction to Advanced Trading</h2>
        <p>
          The cryptocurrency market offers unique opportunities for traders who understand how to leverage its volatility
          and 24/7 nature. While basic trading approaches can yield results, advanced strategies can significantly
          improve your risk management and potential returns.
        </p>
        
        <p>
          This article explores sophisticated trading methodologies used by professional crypto traders, with specific
          examples and backtested results. We'll examine how these approaches have performed across various market
          conditions and provide actionable guidance for implementation.
        </p>

        <h2>Market Microstructure Analysis</h2>
        <p>
          Understanding the inner workings of crypto exchanges and order flow can provide significant advantages.
          Microstructure analysis examines the processes and outcomes of exchanging assets under specific trading rules.
        </p>

        <h3>Order Book Imbalance</h3>
        <p>
          One key metric to monitor is order book imbalance - the ratio between buy and sell orders at various price levels.
          Significant imbalances can indicate potential price movement, especially when combined with volume analysis.
        </p>

        <h2>Technical Analysis Beyond Basics</h2>
        <p>
          Moving beyond simple indicators requires understanding how to combine multiple signals into coherent trading systems.
          Here we discuss advanced approaches to technical analysis that go beyond the typical moving average crossovers.
        </p>

        <h3>Market Regime Detection</h3>
        <p>
          Different indicators perform best in specific market environments. Detecting the current market regime (trending, ranging, etc.)
          allows you to dynamically adjust your trading approach to match current conditions.
        </p>

        <h2>On-Chain Analysis for Traders</h2>
        <p>
          Blockchain data provides unprecedented transparency into network activity. Smart traders leverage this data
          to gain insights unavailable in traditional markets.
        </p>

        <h3>Exchange Flow Analysis</h3>
        <p>
          Tracking the movement of funds to and from exchanges can signal potential buying or selling pressure.
          Large outflows from exchanges often indicate accumulation, while inflows may signal upcoming selling pressure.
        </p>
        
        {/* The rest of the premium content is only visible to paid members */}
      </article>
    </div>
  );
}

// Define the article preview for free users
const articlePreview = (
  <>
    <h1 className="text-3xl md:text-4xl font-bold mb-4">Advanced Crypto Trading Strategies</h1>
    
    <div className="flex items-center text-gray-600 dark:text-gray-400 mb-6">
      <div className="flex items-center">
        <div className="w-10 h-10 rounded-full bg-gray-300 dark:bg-gray-700 mr-3"></div>
        <span className="font-medium">Learning Crypto Team</span>
      </div>
      <span className="mx-3">•</span>
      <span>{new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })}</span>
      <span className="mx-3">•</span>
      <span className="bg-brand-500/10 text-brand-600 dark:text-brand-400 text-xs font-semibold px-2.5 py-1 rounded">
        Premium Content
      </span>
    </div>
    
    <div className="relative w-full h-72 md:h-96 mb-8 rounded-lg overflow-hidden">
      <Image 
        src="/images/trading.jpg" 
        alt="Advanced Crypto Trading Strategies" 
        fill
        style={{ objectFit: 'cover' }}
        priority
      />
    </div>

    <h2>Introduction to Advanced Trading</h2>
    <p>
      The cryptocurrency market offers unique opportunities for traders who understand how to leverage its volatility
      and 24/7 nature. While basic trading approaches can yield results, advanced strategies can significantly
      improve your risk management and potential returns.
    </p>
    
    <p>
      This article explores sophisticated trading methodologies used by professional crypto traders, with specific
      examples and backtested results. We'll examine how these approaches have performed across various market
      conditions and provide actionable guidance for implementation.
    </p>
  </>
);

// Wrap the Article component with premium content protection
// The full article is premium content, and we provide a preview for free users
export default withPremiumContentProtection(Article);

// Set the component's default props
Article.defaultProps = {
  isPremium: true,
  preview: articlePreview
}; 