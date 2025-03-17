#!/bin/bash

# Cleanup Old Directory Structure Script
# This script removes old directories that are no longer needed after the reorganization

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${RED}WARNING: This will permanently delete old directories!${NC}"
echo -e "${YELLOW}Make sure you have tested the application with the new structure before proceeding.${NC}"
echo -e "${YELLOW}It's recommended to run 'npm run dev' and verify everything works before proceeding.${NC}"
echo -e "${YELLOW}Have you tested the application with the new structure? (y/n)${NC}"
read -p "> " confirm

if [[ "$confirm" != "y" && "$confirm" != "Y" ]]; then
  echo -e "${YELLOW}Operation cancelled. Please test the application first.${NC}"
  exit 0
fi

echo -e "${YELLOW}Creating one final backup before removing old directories...${NC}"
BACKUP_FILE="backup/final-backup-$(date +%Y%m%d%H%M%S).tar.gz"
tar -czf "$BACKUP_FILE" --exclude=node_modules --exclude=.git --exclude=backup app components lib types src-old
echo -e "${GREEN}Backup created at $BACKUP_FILE${NC}"

echo -e "${YELLOW}Removing old directories...${NC}"
rm -rf app components lib types src-old

echo -e "${GREEN}Cleanup complete! Old directories have been removed.${NC}"
echo -e "${YELLOW}The application is now fully migrated to the new structure.${NC}" 