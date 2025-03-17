import { NextResponse } from 'next/server';
import { getMacroMarketData } from '@/lib/api/macro-market-data';

// Helper function to format large numbers
function formatLargeNumber(num: number): string {
  if (num >= 1_000_000_000_000) {
    return `$${(num / 1_000_000_000_000).toFixed(2)}T`;
  } else if (num >= 1_000_000_000) {
    return `$${(num / 1_000_000_000).toFixed(2)}B`;
  } else if (num >= 1_000_000) {
    return `$${(num / 1_000_000).toFixed(2)}M`;
  } else if (num >= 1_000) {
    return `$${(num / 1_000).toFixed(2)}K`;
  }
  return `$${num.toFixed(2)}`;
}

// Helper to format percentages
function formatPercentage(num: number): string {
  return `${num.toFixed(2)}%`;
}

// Helper to format date to readable format
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleString('en-US', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export async function GET() {
  try {
    const macroData = await getMacroMarketData();
    
    if (!macroData) {
      return NextResponse.json({
        success: false,
        error: 'No macro market data found'
      }, { status: 404 });
    }
    
    // Format the data for display
    const formattedData = {
      // Market Overview
      marketOverview: {
        totalMarketCap: formatLargeNumber(macroData.total_market_cap),
        totalVolume24h: formatLargeNumber(macroData.total_volume_24h),
        totalCryptocurrencies: macroData.total_cryptocurrencies.toLocaleString(),
        totalExchanges: macroData.total_exchanges.toLocaleString()
      },
      
      // Dominance
      dominance: {
        btc: formatPercentage(macroData.btc_dominance),
        eth: formatPercentage(macroData.eth_dominance),
        altcoins: formatPercentage(macroData.altcoin_dominance)
      },
      
      // Fear & Greed
      fearAndGreed: {
        value: macroData.fear_greed_value,
        classification: macroData.fear_greed_classification,
        updatedAt: formatDate(macroData.fear_greed_timestamp)
      },
      
      // On-chain Activity
      onChainActivity: {
        activeAddresses: macroData.active_addresses_count.toLocaleString(),
        activeAddressesChange: formatPercentage(macroData.active_addresses_change_24h),
        updatedAt: formatDate(macroData.active_addresses_timestamp)
      },
      
      // Whale Activity
      whaleActivity: {
        largeTransactions: macroData.large_transactions_count.toLocaleString(),
        largeTransactionsChange: formatPercentage(macroData.large_transactions_change_24h),
        updatedAt: formatDate(macroData.large_transactions_timestamp)
      },
      
      // Last Updated
      lastUpdated: formatDate(macroData.updated_at)
    };
    
    return NextResponse.json({
      success: true,
      data: formattedData
    });
  } catch (error) {
    console.error('Error fetching formatted macro market data:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Error fetching formatted macro market data',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
} 