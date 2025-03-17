export interface PortfolioItem {
  id: string;
  userId: string;
  coinId: string;
  coinSymbol: string;
  coinName: string;
  amount: number;
  preferredCurrency: 'USD' | 'BTC';
  createdAt: string;
  updatedAt: string;
}

export interface CoinData {
  id: string;
  symbol: string;
  name: string;
  priceUsd: number;
  priceBtc: number;
  priceChange24h: number;
  marketCap: number;
  volume24h?: number;      // 24h trading volume
  logoUrl?: string;
  chain?: string;          // Blockchain the token is on (ethereum, bsc, etc.)
  liquidity?: number;      // Liquidity in USD
  trustScore?: number;     // Internal score for sorting/filtering
  dexId?: string;          // DEX identifier
  
  // CoinMarketCap specific properties
  cmcRank?: number;        // CoinMarketCap rank
  slug?: string;           // CoinMarketCap slug (url friendly name)
}

export interface PortfolioItemWithPrice extends PortfolioItem {
  priceUsd: number;
  priceBtc: number;
  valueUsd: number;
  valueBtc: number;
  priceChange24h: number;
  percentage: number;
  marketCap: number;
  logoUrl?: string;
}

export interface PortfolioSummary {
  totalValueUsd: number;
  totalValueBtc: number;
  dailyChangePercentage: number;
  dailyChangeUsd: number;
  dailyChangeBtc: number;
  items: PortfolioItemWithPrice[];
} 