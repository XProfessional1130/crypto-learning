#!/bin/bash

# Script to migrate remaining components
LOG_FILE="remaining-migration.log"
echo "Remaining Component Migration Log - $(date)" > $LOG_FILE

# Function to log messages
log_message() {
  echo "$1" | tee -a $LOG_FILE
}

log_message "Starting migration of remaining components..."

# 1. Move ThemeIcons.tsx to ui/atoms/icons
mkdir -p "src/components/ui/atoms/icons"
if [ -f "src/app/components/atoms/icons/ThemeIcons.tsx" ]; then
  log_message "Moving ThemeIcons.tsx to components/ui/atoms/icons"
  mv "src/app/components/atoms/icons/ThemeIcons.tsx" "src/components/ui/atoms/icons/ThemeIcons.tsx"
fi

# 2. Move DataRefreshOnMount.tsx to components/ui
if [ -f "src/app/components/common/DataRefreshOnMount.tsx" ]; then
  log_message "Moving DataRefreshOnMount.tsx to components/ui"
  mv "src/app/components/common/DataRefreshOnMount.tsx" "src/components/ui/DataRefreshOnMount.tsx"
fi

# 3. Move LC Dashboard components to components/features/team-dashboard
mkdir -p "src/components/features/team-dashboard"
for file in src/app/components/lc-dashboard/*.tsx; do
  if [ -f "$file" ]; then
    filename=$(basename "$file")
    log_message "Moving $filename to components/features/team-dashboard"
    mv "$file" "src/components/features/team-dashboard/$filename"
  fi
done

# 4. Move membership type files
mkdir -p "src/components/features/membership"
if [ -f "src/app/components/membership/types.ts" ] && [ ! -f "src/components/features/membership/types.ts" ]; then
  log_message "Moving membership/types.ts to components/features/membership"
  mv "src/app/components/membership/types.ts" "src/components/features/membership/types.ts"
fi

if [ -f "src/app/components/membership/index.ts" ] && [ ! -f "src/components/features/membership/index.ts" ]; then
  log_message "Moving membership/index.ts to components/features/membership"
  mv "src/app/components/membership/index.ts" "src/components/features/membership/index.ts"
fi

# 5. Update imports in the moved files
find src/components -type f -name "*.tsx" -o -name "*.ts" | while read -r file; do
  sed -i '' 's|"@/app/components/atoms/icons/ThemeIcons"|"@/components/ui/atoms/icons/ThemeIcons"|g' "$file"
  sed -i '' 's|"@/app/components/common/DataRefreshOnMount"|"@/components/ui/DataRefreshOnMount"|g' "$file"
  sed -i '' 's|"@/app/components/lc-dashboard/|"@/components/features/team-dashboard/|g' "$file"
done

# 6. Remove empty directories
find src/app/components -type d -empty -delete

log_message "Remaining component migration completed." 