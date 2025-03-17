#!/bin/bash

# Update Import Paths Script
# This script updates import paths to match the new directory structure

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Updating import paths to match new structure...${NC}"

# Common import path patterns and their replacements
# Format: find and replace pairs
REPLACEMENTS=(
  # Update lib imports
  "@/lib/auth-context"           "@/lib/providers/auth-provider"
  "@/lib/theme-context"          "@/lib/providers/theme-provider"
  "@/lib/context/auth-context"   "@/lib/providers/auth-provider"
  "@/lib/context/data-cache-context"  "@/lib/providers/data-cache-provider"
  "@/lib/context/dashboard-context"   "@/lib/providers/dashboard-provider"
  "@/lib/context/modal-context"       "@/lib/providers/modal-provider"
  "@/lib/context/team-data-context"   "@/lib/providers/team-data-provider"
  
  # Update service imports
  "@/lib/services/"              "@/lib/api/"
  "@/lib/stripe"                 "@/lib/api/stripe"
  "@/lib/supabase"               "@/lib/api/supabase"
  
  # Update component imports
  "@/app/components/"            "@/components/"
  "@/components/LoadingSpinner"  "@/components/ui/LoadingSpinner"
  "@/components/dashboard/"      "@/components/features/dashboard/"
  
  # Update hook imports
  "@/lib/hooks/"                 "@/hooks/"
  "@/lib/hooks/useAuthRedirect"  "@/hooks/auth/useAuthRedirect"
  "@/lib/hooks/useSubscription"  "@/hooks/auth/useSubscription"
  "@/hooks/useAuthRedirect"      "@/hooks/auth/useAuthRedirect"
)

# Function to update imports in a single file
update_imports() {
  local file=$1
  local changed=false
  
  # Make a temporary copy of the file
  cp "$file" "$file.tmp"
  
  # Apply all replacements
  for (( i=0; i<${#REPLACEMENTS[@]}; i+=2 )); do
    local find="${REPLACEMENTS[$i]}"
    local replace="${REPLACEMENTS[$i+1]}"
    
    # Use sed to replace the import paths
    if grep -q "$find" "$file.tmp"; then
      sed -i.bak "s|$find|$replace|g" "$file.tmp"
      changed=true
    fi
  done
  
  # If changes were made, replace the original file
  if [ "$changed" = true ]; then
    mv "$file.tmp" "$file"
    echo "Updated imports in $file"
  else
    rm "$file.tmp"
  fi
  
  # Clean up backup files
  rm -f "$file.tmp.bak"
}

# Find all TypeScript and TSX files in both src directory and app directory
echo "Finding all TypeScript and TSX files..."
FILES=$(find ./src -type f -name "*.ts" -o -name "*.tsx" 2>/dev/null || true)

# Update imports in each file
echo "Updating import paths in files..."
for file in $FILES; do
  update_imports "$file"
done

echo -e "${GREEN}Import paths updated successfully!${NC}"
echo -e "${YELLOW}Note: Manual review may still be necessary for some import paths.${NC}"
echo -e "${YELLOW}Also, we still need to handle files in the /app directory. Consider one of these approaches:${NC}"
echo -e "1. ${YELLOW}Move the app directory files to src/app if they're not already duplicated${NC}"
echo -e "2. ${YELLOW}Delete the app directory if it's fully duplicated in src/app${NC}" 