// User types
export interface User {
  id: string;
  email: string;
  subscription_id?: string;
  stripe_id?: string;
  referral_id?: string;
  created_at: string;
  updated_at: string;
}

// Subscription types
export interface Subscription {
  id: string;
  user_id: string;
  type: 'crypto' | 'fiat';
  provider: 'stripe' | 'square' | 'radom';
  status: 'active' | 'canceled' | 'expired' | 'trial';
  expires_at: string;
  created_at: string;
  updated_at: string;
}

// Portfolio types
export interface Asset {
  symbol: string;
  name: string;
  amount: number;
  purchase_price: number;
  current_price?: number;
}

export interface Portfolio {
  id: string;
  user_id: string;
  name: string;
  assets: Asset[];
  created_at: string;
  updated_at: string;
}

// Watchlist types
export interface WatchlistItem {
  symbol: string;
  name: string;
  price?: number;
  change_24h?: number;
}

export interface Watchlist {
  id: string;
  user_id: string;
  name: string;
  coins: WatchlistItem[];
  created_at: string;
  updated_at: string;
}

// Article types
export interface Article {
  id: string;
  title: string;
  content: string;
  author: string;
  category: string;
  tags: string[];
  created_at: string;
  updated_at: string;
}

// Discount/Deal types
export interface Discount {
  id: string;
  title: string;
  description: string;
  url: string;
  category: string;
  expires_at?: string;
  created_at: string;
  updated_at: string;
}

// Market Update types
export interface MarketUpdate {
  id: string;
  title: string;
  content: string;
  author: string;
  category: string;
  created_at: string;
  updated_at: string;
}

// Referral types
export interface Referral {
  id: string;
  user_id: string;
  referral_code: string;
  referrals_count: number;
  earnings: number;
  created_at: string;
  updated_at: string;
}

// Chat Message types
export interface ChatMessage {
  id: string;
  user_id: string;
  role: 'user' | 'assistant';
  content: string;
  personality?: 'tobo' | 'heido';
  thread_id?: string;
  assistant_id?: string;
  created_at: string;
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
} 