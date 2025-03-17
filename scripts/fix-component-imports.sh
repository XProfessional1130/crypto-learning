#!/bin/bash

# Script to fix the remaining component import paths
LOG_FILE="import-fixes.log"
echo "Import Fixes Log - $(date)" > $LOG_FILE

# Function to log messages
log_message() {
  echo "$1" | tee -a $LOG_FILE
}

log_message "Starting import path fixes..."

# Fix NavigationContainer imports
log_message "Fixing NavigationContainer imports..."
sed -i '' 's|import ThemeLogo from "../ThemeLogo";|import ThemeLogo from "@/components/ui/ThemeLogo";|' src/components/features/navigation/NavigationContainer.tsx
sed -i '' 's|import ThemeToggle from "../ThemeToggle";|import ThemeToggle from "@/components/ui/ThemeToggle";|' src/components/features/navigation/NavigationContainer.tsx

# Fix AuthButtons imports
log_message "Fixing AuthButtons imports..."
sed -i '' 's|import Button from "../ui/Button";|import Button from "@/components/ui/Button";|' src/components/features/navigation/AuthButtons.tsx

# Fix AccountButton imports
log_message "Fixing AccountButton imports..."
sed -i '' 's|import Button from "../ui/Button";|import Button from "@/components/ui/Button";|' src/components/features/navigation/AccountButton.tsx
sed -i '' 's|import AccountModal from "../modals/AccountModal";|import AccountModal from "@/components/features/modals/AccountModal";|' src/components/features/navigation/AccountButton.tsx

# Fix AccountModal imports
log_message "Fixing AccountModal imports..."
sed -i '' 's|import Button from "../ui/Button";|import Button from "@/components/ui/Button";|' src/components/features/modals/AccountModal.tsx

log_message "Import path fixes completed." 