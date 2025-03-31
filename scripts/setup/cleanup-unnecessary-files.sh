#!/bin/bash

echo "Starting cleanup of unnecessary files and directories..."

# Function to safely remove a file or directory
safe_remove() {
    if [ -e "$1" ]; then
        echo "Removing: $1"
        rm -rf "$1"
    else
        echo "Not found: $1"
    fi
}

# Remove old library directory
safe_remove "lib-old"

# Remove backup directory
safe_remove "backup"

# Remove migration documentation files
safe_remove "README-APP-ROUTER-MIGRATION.md"
safe_remove "app-router-migration.md"
safe_remove "refactoring-progress.md"

# Remove migration scripts
safe_remove "scripts/finalize-app-router-migration.sh"
safe_remove "scripts/reorganize-project.sh"
safe_remove "scripts/update-imports.sh"
safe_remove "scripts/cleanup-old-structure.sh"

# Remove one-time SQL script
safe_remove "apply_chat_history.sql"

# Remove performance test file
safe_remove "performance-test.html"

echo "Cleanup complete!"
echo "Please verify that the application still works as expected." 