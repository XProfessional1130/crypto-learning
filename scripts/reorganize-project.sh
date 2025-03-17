#!/bin/bash

# Reorganize Project Structure
# This script reorganizes the project structure to improve maintainability and organization

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Creating backup...${NC}"
mkdir -p backup
BACKUP_FILE="backup/repo-backup-$(date +%Y%m%d%H%M%S).tar.gz"
tar -czf "$BACKUP_FILE" --exclude=node_modules --exclude=.git --exclude=backup --exclude=src-new .
echo -e "${GREEN}Backup created at $BACKUP_FILE${NC}"

# Check if src-new exists, if not abort
if [ ! -d "src-new" ]; then
  echo -e "${RED}Error: src-new directory does not exist. Please run the reorganization preparation first.${NC}"
  exit 1
fi

echo -e "${YELLOW}Moving new structure into place...${NC}"

# Create temporary directory for old src
echo "Moving current src directory to src-old..."
if [ -d "src" ]; then
  mv src src-old
fi

# Move new structure into place
echo "Moving src-new to src..."
mv src-new src

# Update imports
echo -e "${YELLOW}Starting to update import paths...${NC}"
echo "This is a placeholder for a more sophisticated import updating process."
echo "For a complete migration, all imports would need to be updated to reflect the new structure."

echo -e "${GREEN}Reorganization complete!${NC}"
echo -e "${YELLOW}Next steps:${NC}"
echo "1. Review the new structure and ensure all files are in the correct location"
echo "2. Update import paths throughout the codebase"
echo "3. Test the application to ensure everything works as expected"
echo "4. Once you're satisfied, you can remove the src-old directory"

echo -e "${GREEN}To remove the old directories after verification, run:${NC}"
echo "rm -rf app components lib types src-old" 