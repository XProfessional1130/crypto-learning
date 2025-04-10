/**
 * Portfolio Types
 * 
 * This module defines TypeScript interfaces for portfolio-related data structures 
 * used throughout the application for tracking user cryptocurrency holdings.
 */

/**
 * PortfolioItem represents a single cryptocurrency holding in a user's portfolio
 */
export interface PortfolioItem {
  id: string;                          // Unique identifier for the portfolio item
  userId: string;                      // User who owns this portfolio item
  coinId: string;                      // Coin/token unique identifier
  coinSymbol: string;                  // Coin/token symbol (e.g., BTC, ETH)
  coinName: string;                    // Full name of the coin/token (e.g., Bitcoin)
  amount: number;                      // Quantity of the coin/token held
  preferredCurrency: 'USD' | 'BTC';    // Currency to display values in
  createdAt: string;                   // ISO timestamp of when the item was created
  updatedAt: string;                   // ISO timestamp of when the item was last updated
}

/**
 * CoinData represents price and market data for a cryptocurrency
 * Used across various portfolio, watchlist and market data features
 */
export interface CoinData {
  id: string;                // Unique identifier (typically from CoinMarketCap or similar)
  symbol: string;            // Trading symbol (e.g., BTC, ETH)
  name: string;              // Full name (e.g., Bitcoin)
  priceUsd: number;          // Current price in USD
  priceBtc: number;          // Current price in BTC
  priceChange24h: number;    // Price change percentage in last 24 hours
  marketCap: number;         // Market capitalization in USD
  volume24h?: number;        // 24h trading volume
  logoUrl?: string;          // URL to the coin/token logo image
  chain?: string;            // Blockchain the token is on (ethereum, bsc, etc.)
  liquidity?: number;        // Liquidity in USD
  trustScore?: number;       // Internal score for sorting/filtering
  dexId?: string;            // DEX identifier
  
  // CoinMarketCap specific properties
  cmcRank?: number;          // CoinMarketCap rank
  slug?: string;             // CoinMarketCap slug (url friendly name)
}

/**
 * PortfolioItemWithPrice extends PortfolioItem with current price data
 * Used to display portfolio items with their current values
 */
export interface PortfolioItemWithPrice extends PortfolioItem {
  priceUsd: number;          // Current price in USD
  priceBtc: number;          // Current price in BTC
  valueUsd: number;          // Total value in USD (amount * priceUsd)
  valueBtc: number;          // Total value in BTC (amount * priceBtc)
  priceChange24h: number;    // Price change percentage in last 24 hours
  percentage: number;        // Percentage of total portfolio value
  marketCap: number;         // Market capitalization in USD
  logoUrl?: string;          // URL to the coin/token logo image
}

/**
 * PortfolioSummary provides aggregated information about a complete portfolio
 * Used for portfolio overview displays
 */
export interface PortfolioSummary {
  totalValueUsd: number;           // Total portfolio value in USD
  totalValueBtc: number;           // Total portfolio value in BTC
  dailyChangePercentage: number;   // Portfolio change percentage in last 24 hours
  dailyChangeUsd: number;          // Portfolio change value in USD over last 24 hours
  dailyChangeBtc: number;          // Portfolio change value in BTC over last 24 hours
  items: PortfolioItemWithPrice[]; // List of individual portfolio items with prices
} 