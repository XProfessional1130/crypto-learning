export interface WatchlistItem {
  id: number;
  coinId: number;
  coinSymbol: string;
  coinName: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface WatchlistItemWithPrice extends WatchlistItem {
  priceUsd: number;
  priceBtc: number;
  priceChange24h: number;
  marketCap: number;
  volume24h: number;
  logoUrl?: string;
}

export interface WatchlistSummary {
  items: WatchlistItemWithPrice[];
} 