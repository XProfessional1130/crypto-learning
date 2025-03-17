/**
 * Utility functions for formatting data consistently across the application
 */

/**
 * Formats a crypto price with appropriate precision based on its value
 * @param price - The price to format
 * @returns Formatted price string with $ symbol
 */
export function formatCryptoPrice(price: number): string {
  if (!price && price !== 0) return '$---';

  if (price >= 1) {
    return `$${price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  } else if (price >= 0.01) {
    return `$${price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  } else if (price >= 0.0001) {
    return `$${price.toLocaleString(undefined, { minimumFractionDigits: 4, maximumFractionDigits: 4 })}`;
  } else {
    return `< $0.0001`;
  }
}

/**
 * Formats large numbers (like market cap and volume) with appropriate suffixes
 * @param num - The number to format
 * @returns Formatted number string with $ symbol and B/M/K suffix
 */
export function formatLargeNumber(num: number): string {
  if (!num && num !== 0) return '$---';
  
  if (num >= 1_000_000_000) {
    return `$${(num / 1_000_000_000).toFixed(1)}B`;
  } else if (num >= 1_000_000) {
    return `$${(num / 1_000_000).toFixed(1)}M`;
  } else if (num >= 1_000) {
    return `$${(num / 1_000).toFixed(1)}K`;
  } else {
    return `$${num.toFixed(0)}`;
  }
}

/**
 * Calculates progress percentage toward a target price (for progress bars)
 * @param currentPrice - The current price
 * @param targetPrice - The target price
 * @returns A percentage from 0-100
 */
export function calculateProgressPercentage(currentPrice: number, targetPrice: number): number {
  if (!targetPrice || currentPrice === targetPrice) return 100;
  
  // If target is higher than current (we want price to go up)
  if (targetPrice > currentPrice) {
    // Calculate how far we've moved toward the target
    return Math.min(100, Math.max(0, (currentPrice / targetPrice) * 100));
  } 
  // If target is lower than current (we want price to go down)
  else {
    // Calculate how far we've moved toward the target (reverse direction)
    return Math.min(100, Math.max(0, (targetPrice / currentPrice) * 100));
  }
}

/**
 * Formats a percentage value
 * @param percentage - The percentage to format
 * @param includePlusSign - Whether to include a + sign for positive values
 * @returns Formatted percentage string with % symbol
 */
export function formatPercentage(percentage: number, includePlusSign = true): string {
  if (!percentage && percentage !== 0) return '---';
  
  const sign = percentage > 0 && includePlusSign ? '+' : '';
  return `${sign}${percentage.toFixed(2)}%`;
} 