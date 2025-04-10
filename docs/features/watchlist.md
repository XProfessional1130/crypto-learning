# Watchlist System

This document explains the watchlist functionality in the Learning Crypto Platform.

## Overview

The watchlist system allows users to track cryptocurrencies they're interested in without adding them to their portfolio. The platform supports both individual user watchlists and team watchlists.

## Key Features

- Add/remove cryptocurrencies to watchlists
- View detailed information about watchlisted coins
- Add personal notes to watchlist entries
- Share watchlists with team members

## Implementation

### Core Components

- **User Watchlist API**: `src/lib/api/watchlist.ts`
- **Team Watchlist API**: `src/lib/api/team-watchlist.ts`
- **UI Components**:
  - `src/components/features/dashboard/WatchlistComponent.tsx`
  - `src/components/features/dashboard/WatchlistItemDetailModal.tsx`
  - `src/components/features/team-dashboard/TeamWatchlist.tsx`
- **Custom Hooks**:
  - `src/hooks/dashboard/useWatchlist.ts`
  - `src/hooks/dashboard/useTeamWatchlistData.ts`

## Database Structure

```sql
-- Individual user watchlists
CREATE TABLE watchlists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  coin_id TEXT NOT NULL,
  coin_symbol TEXT NOT NULL,
  coin_name TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, coin_id)
);

-- Team watchlists
CREATE TABLE team_watchlists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL,
  coin_id TEXT NOT NULL,
  coin_symbol TEXT NOT NULL,
  coin_name TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(team_id, coin_id)
);
```

## Security Model

Access control is managed through Row Level Security (RLS) policies:

- Users can only view and modify their own watchlist items
- Team members can view shared team watchlists
- Team administrators can modify team watchlists

## Usage Examples

### Add Coin to User Watchlist

```typescript
import { addToWatchlist } from '@/lib/api/watchlist';

// Add Bitcoin to user's watchlist
await addToWatchlist({
  coinId: 'bitcoin',
  coinSymbol: 'BTC',
  coinName: 'Bitcoin',
  notes: 'Watching for potential entry around $25K'
});
```

### Using the Watchlist Hooks

```typescript
import { useWatchlist } from '@/hooks/dashboard/useWatchlist';

function WatchlistView() {
  const { 
    watchlistItems,
    isLoading, 
    addItem,
    removeItem,
    updateNotes
  } = useWatchlist();
  
  // Component implementation
}
```

### Team Watchlist Integration

```typescript
import { useTeamWatchlistData } from '@/hooks/dashboard/useTeamWatchlistData';

function TeamWatchlistView() {
  const {
    teamWatchlist,
    isLoading,
    addToTeamWatchlist,
    removeFromTeamWatchlist
  } = useTeamWatchlistData();
  
  // Component implementation
}
```

## Real-time Updates

Watchlists support real-time updates through Supabase Realtime:

```typescript
// In useWatchlist.ts
useEffect(() => {
  const watchlistChannel = supabase
    .channel('watchlist-changes')
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'watchlists',
      filter: `user_id=eq.${user.id}`
    }, (payload) => {
      // Update local state based on changes
    })
    .subscribe();
    
  return () => {
    supabase.removeChannel(watchlistChannel);
  };
}, [user.id]);
```

## Troubleshooting

Common issues and solutions:

1. **Missing Watchlist Items**: Check the RLS policies to ensure the user has access
2. **Duplicate Entries**: The database has UNIQUE constraints that should prevent this
3. **Real-time Updates Not Working**: Verify Supabase Realtime is enabled and configured 