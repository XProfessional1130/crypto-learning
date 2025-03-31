#!/bin/bash

# Cleanup script to remove old script files after reorganization
# This script should be run after the script reorganization is complete and tested

echo "🧹 Cleaning up old script files after reorganization"
echo "===================================================="

# Color codes for better readability
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Confirmation
read -p "This will remove old script files. Are you sure you want to continue? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]
then
    echo -e "${YELLOW}Operation cancelled${NC}"
    exit 0
fi

# Root level scripts that have been moved
echo -e "${YELLOW}Removing scripts from root scripts directory...${NC}"
old_scripts=(
    "clean-setup.js"
    "fix-database.js"
    "fix-auth-db.js"
    "cleanup-unnecessary-files.sh"
    "test-search.mjs"
    "test-subscription-events.sh"
    "test-api.js"
    "manual-crypto-update.js"
    "update-macro-market-data.ts"
    "populate-macro-market-data.ts"
    "schedule-crypto-update.ts"
    "init-jobs.ts"
    "init-jobs-with-tables.ts"
    "process-jobs-cli.ts"
    "manual-init-jobs.mjs"
    "trigger-macro-data-update.mjs"
    "migrate-ghost-members.js"
)

for script in "${old_scripts[@]}"; do
    if [ -f "scripts/$script" ]; then
        echo "Removing scripts/$script"
        rm "scripts/$script"
    else
        echo -e "${YELLOW}scripts/$script not found, skipping${NC}"
    fi
done

# src/scripts files that have been moved
echo -e "${YELLOW}Removing scripts from src/scripts directory...${NC}"
old_src_scripts=(
    "create-first-admin.ts"
    "import-ghost-content.ts"
    "test-auth.ts"
    "test-search.ts"
    "test-search.js"
    "run-migration.ts"
    "run-migration.sh"
)

for script in "${old_src_scripts[@]}"; do
    if [ -f "src/scripts/$script" ]; then
        echo "Removing src/scripts/$script"
        rm "src/scripts/$script"
    else
        echo -e "${YELLOW}src/scripts/$script not found, skipping${NC}"
    fi
done

echo -e "${GREEN}✅ Cleanup complete!${NC}"
echo "The scripts have been reorganized and old files removed."
echo "You can now use the new npm scripts defined in package.json." 