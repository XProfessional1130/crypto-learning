#!/bin/bash

# Script to finalize the App Router migration by removing Pages Router files

echo "Starting App Router migration finalization..."

# Step 1: Check for any remaining references to the Pages Router
echo "Checking for any remaining references to the Pages Router..."
ROUTER_IMPORTS=$(grep -r "from 'next/router'" --include="*.tsx" --include="*.ts" --include="*.jsx" --include="*.js" . | grep -v "node_modules" | grep -v "scripts/finalize-app-router-migration.sh" | grep -v "./pages/_app.tsx")

if [ -n "$ROUTER_IMPORTS" ]; then
  echo "WARNING: Found references to next/router that should be updated to next/navigation:"
  echo "$ROUTER_IMPORTS"
  echo "Please update these imports before proceeding."
  echo "Refer to app/api/updating-imports.md for guidance."
  exit 1
fi

# Step 2: Remove the Pages Router directories and files
echo "Removing Pages Router directories and files..."

# Remove the pages directory
if [ -d "pages" ]; then
  echo "Removing pages directory..."
  rm -rf pages
fi

# Step 3: Update next.config.js to fully embrace App Router
echo "Updating next.config.js..."
sed -i '' 's/appDir: true,//g' next.config.js
sed -i '' 's/\/\/ Prefer App Router while still supporting Pages Router during migration/\/\/ App Router is now the default/g' next.config.js
sed -i '' 's/\/\/ This will disable the Pages Router once we'"'"'re fully migrated/\/\/ Pages Router has been removed/g' next.config.js

# Step 4: Add a note to the migration document
echo "Updating migration document..."
echo "
## App Router Migration Complete

The migration from Pages Router to App Router has been completed. All API routes and pages have been migrated to the App Router format. The Pages Router directories and files have been removed.

Date: $(date)
" >> refactoring-progress.md

echo "App Router migration finalization complete!"
echo "Please rebuild and test the application to ensure everything is working properly." 