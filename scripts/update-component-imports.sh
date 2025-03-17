#!/bin/bash

# Script to update imports after component migration
LOG_FILE="import-updates.log"
echo "Import Update Log - $(date)" > $LOG_FILE

# Function to log messages
log_message() {
  echo "$1" | tee -a $LOG_FILE
}

log_message "Starting import updates..."

# Find all typescript files in the src directory
find src -type f -name "*.tsx" -o -name "*.ts" | while read -r file; do
  log_message "Processing: $file"
  
  # Update UI component imports
  sed -i '' 's|"@/app/components/ui/|"@/components/ui/|g' "$file"
  
  # Update feature component imports
  for feature in auth dashboard home membership; do
    sed -i '' "s|\"@/app/components/$feature/|\"@/components/features/$feature/|g" "$file"
  done
  
  # Update atomic design imports
  sed -i '' 's|"@/app/components/atoms/|"@/components/ui/atoms/|g' "$file"
  sed -i '' 's|"@/app/components/molecules/|"@/components/ui/molecules/|g' "$file"
  sed -i '' 's|"@/app/components/organisms/|"@/components/ui/organisms/|g' "$file"
  
  # Update navigation imports
  sed -i '' 's|"@/app/components/navigation/|"@/components/features/navigation/|g' "$file"
  
  # Update modal imports
  sed -i '' 's|"@/app/components/modals/|"@/components/features/modals/|g' "$file"
  
  # Update standalone component imports
  sed -i '' 's|"@/app/components/BackgroundElements|"@/components/layouts/BackgroundElements|g' "$file"
  sed -i '' 's|"@/app/components/Footer|"@/components/layouts/Footer|g' "$file"
  sed -i '' 's|"@/app/components/|"@/components/ui/|g' "$file"
done

log_message "Import updates completed." 