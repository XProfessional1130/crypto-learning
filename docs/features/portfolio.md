# Portfolio System

This document explains the portfolio management functionality in the Learning Crypto Platform.

## Overview

The portfolio system allows users to track their cryptocurrency holdings, view performance metrics, and analyze their investments. The platform supports both individual user portfolios and team portfolios.

## Key Features

- Add/remove cryptocurrency holdings 
- Track investment performance over time
- View portfolio allocation and diversification
- Calculate profit/loss metrics
- Share portfolio insights with team members

## Implementation

### Core Components

- **User Portfolio API**: `src/lib/api/portfolio.ts`
- **Team Portfolio API**: `src/lib/api/team-portfolio.ts`
- **UI Components**:
  - `src/components/features/dashboard/PortfolioDashboard.tsx`
  - `src/components/features/team-dashboard/TeamPortfolio.tsx`
- **Custom Hooks**:
  - `src/hooks/dashboard/usePortfolio.ts`
  - `src/hooks/dashboard/useTeamPortfolio.ts`

## Database Structure

```sql
-- Individual user portfolios
CREATE TABLE user_portfolios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  coin_id TEXT NOT NULL,
  coin_symbol TEXT NOT NULL,
  coin_name TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  preferred_currency TEXT DEFAULT 'USD',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, coin_id)
);

-- Team portfolios
CREATE TABLE team_portfolios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL,
  coin_id TEXT NOT NULL,
  coin_symbol TEXT NOT NULL,
  coin_name TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  preferred_currency TEXT DEFAULT 'USD',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(team_id, coin_id)
);
```

## Security Model

Access control is managed through Row Level Security (RLS) policies:

- Users can only view and modify their own portfolio items
- Team members can view shared team portfolios
- Team administrators can modify team portfolios

## Usage Examples

### Add Coin to User Portfolio

```typescript
import { addToPortfolio } from '@/lib/api/portfolio';

// Add Bitcoin to user's portfolio
await addToPortfolio({
  coinId: 'bitcoin',
  coinSymbol: 'BTC',
  coinName: 'Bitcoin',
  amount: 0.5, // 0.5 BTC
  preferredCurrency: 'USD'
});
```

### Using the Portfolio Hooks

```typescript
import { usePortfolio } from '@/hooks/dashboard/usePortfolio';

function PortfolioView() {
  const { 
    portfolioItems,
    totalValue,
    isLoading, 
    addCoin,
    updateAmount,
    removeCoin
  } = usePortfolio();
  
  // Component implementation
}
```

### Portfolio Value Calculation

```typescript
// Calculate total portfolio value
const calculatePortfolioValue = (items, priceData) => {
  return items.reduce((total, item) => {
    const price = priceData[item.coin_id]?.price_usd || 0;
    return total + (item.amount * price);
  }, 0);
};
```

## Data Visualization

The portfolio system includes several visualization components:

1. **Allocation Chart**: Displays the percentage allocation of coins
2. **Performance Graph**: Shows historical performance over time
3. **Profit/Loss Indicators**: Visual indicators of investment performance

## Troubleshooting

Common issues and solutions:

1. **Missing Portfolio Items**: Check the RLS policies to ensure the user has access
2. **Incorrect Total Values**: Verify the price data is being correctly fetched for all coins
3. **Performance Data Not Showing**: Confirm historical price data is available

## Future Enhancements

Planned improvements to the portfolio system:

1. **Transaction History**: Track individual buy/sell transactions
2. **Tax Reporting**: Generate tax reports for cryptocurrency investments
3. **Portfolio Alerts**: Set up price alerts for portfolio assets 