#!/bin/bash

# Script to resolve component conflicts after migration
LOG_FILE="conflict-resolution.log"
echo "Conflict Resolution Log - $(date)" > $LOG_FILE

# Function to log messages
log_message() {
  echo "$1" | tee -a $LOG_FILE
}

log_message "Starting conflict resolution..."

# Function to resolve conflicts
resolve_conflict() {
  local component_path=$1
  local component_name=$2
  local feature_path=$3
  
  log_message "Resolving conflict for $component_name"
  
  # Keep the version in the src/components directory
  # Update any outdated imports in that file
  if [ -f "src/components/$component_path/$component_name" ] && [ -f "src/app/components/$feature_path/$component_name" ]; then
    # Apply path corrections to the file in components directory
    sed -i '' 's|"@/app/lib/utils"|"@/lib/utils/classnames"|g' "src/components/$component_path/$component_name"
    sed -i '' 's|"@/app/hooks/|"@/hooks/|g' "src/components/$component_path/$component_name"
    sed -i '' 's|"@/hooks/usePortfolio"|"@/hooks/dashboard/usePortfolio"|g' "src/components/$component_path/$component_name"
    sed -i '' 's|"@/hooks/useWatchlist"|"@/hooks/dashboard/useWatchlist"|g' "src/components/$component_path/$component_name"
    
    # Remove the app/components version
    rm "src/app/components/$feature_path/$component_name"
    log_message "Kept src/components/$component_path/$component_name and removed src/app/components/$feature_path/$component_name"
  fi
}

# Resolve UI components
resolve_conflict "ui" "skeleton.tsx" "ui"

# Resolve molecule components
resolve_conflict "molecules" "ResourceSkeleton.tsx" "molecules"

# Resolve dashboard components
for component in AddCoinModal.tsx AddToWatchlistModal.tsx AssetDetailModal.tsx CryptoNews.tsx PortfolioDashboard.tsx WatchlistComponent.tsx WatchlistItemDetailModal.tsx; do
  resolve_conflict "features/dashboard" "$component" "dashboard"
done

# Resolve home components
for component in CTASection.tsx FeaturesSection.tsx HeroSection.tsx PricingCard.tsx PricingSection.tsx TestimonialsSection.tsx; do
  resolve_conflict "features/home" "$component" "home"
done

# Resolve membership components
for component in MembershipPlanModal.tsx MembershipSignup.tsx; do
  resolve_conflict "features/membership" "$component" "membership"
done

log_message "Conflict resolution completed." 