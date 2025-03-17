# Dashboard Components Architecture

This directory contains shared components used across both the regular user dashboard and the Learning Crypto team dashboard. The architecture focuses on reusability, maintainability, and performance.

## Component Organization

### Core Components

- `DashboardLayout.tsx`: Shared layout component that handles authentication, loading states, and basic structure
- `DashboardUI.tsx`: Collection of reusable UI components like cards, loading skeletons, and empty states
- `MarketOverview.tsx`: Market data display component that shows BTC, ETH prices and market statistics

### Data Management

- `useDashboardData.ts`: Hook for fetching and refreshing market data
- `dashboard-context.tsx`: Context provider for shared dashboard data
- `team-data-context.tsx`: Context provider for team-specific portfolio and watchlist data

## Usage

### Basic Dashboard Setup

```tsx
import DashboardLayout from '@/app/components/dashboard/DashboardLayout';
import MarketOverview from '@/app/components/dashboard/MarketOverview';
import { useDashboardData } from '@/app/hooks/useDashboardData';

export default function YourDashboard() {
  const { btcPrice, ethPrice, globalData, loading } = useDashboardData();

  return (
    <DashboardLayout title="Your Dashboard Title">
      <MarketOverview 
        loading={loading}
        btcPrice={btcPrice}
        ethPrice={ethPrice}
        globalData={globalData}
      />
      
      {/* Additional dashboard sections */}
    </DashboardLayout>
  );
}
```

### Using UI Components

```tsx
import { 
  StatsCard, 
  DataCard, 
  EmptyState, 
  SectionLoader 
} from '@/app/components/dashboard/DashboardUI';

// Example usage
<StatsCard 
  title="Bitcoin Price"
  value="$65,432"
  loading={false}
  icon={<img src="/assets/icons/btc.svg" alt="BTC" className="w-5 h-5" />}
  changeInfo={{
    value: 2.5,
    isPositive: true,
    label: '24h'
  }}
  showChangeIcon={true}
/>

<DataCard title="Your Data Section">
  {/* Card content */}
</DataCard>

<EmptyState 
  message="No data available"
  actionLabel="Add Data"
  onAction={() => console.log('action clicked')}
/>
```

## Design Principles

1. **Component Composition**: Components are designed to be composed together rather than duplicated
2. **Separation of Concerns**: UI components are separated from data fetching logic
3. **Consistent Loading States**: Loading skeletons and animations are consistent across all dashboard sections
4. **Responsive Design**: All components are fully responsive and adapt to different screen sizes
5. **Performance Optimized**: Heavy components use dynamic imports and memo to optimize performance

## Adding New Dashboard Features

When adding new features to either dashboard:

1. First check if the component already exists in the shared components
2. If not, consider if it should be shared between dashboards
3. For dashboard-specific components, place them in the appropriate directory
4. Reuse UI patterns and loading states from the shared components

## Data Fetching Strategy

- Market data is refreshed automatically on an interval (configurable)
- Manual refresh functionality available through the context
- Error handling is built into the data hooks and contexts 