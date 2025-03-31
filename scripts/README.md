# Scripts Organization

This directory contains all the scripts for the Learning Crypto Platform. The scripts are organized into the following categories:

## Setup Scripts (`/setup`)
Scripts for setting up the project, database, and environment.
- `setup.js` - Main setup script that orchestrates the setup process
- `fix-database.js` - Fixes database structure and conflicts
- `fix-auth-db.js` - Fixes auth database relationships
- `cleanup-unnecessary-files.sh` - Cleans up unnecessary files

## Testing Scripts (`/testing`)
Scripts for testing various aspects of the platform.
- `test-search.mjs` - Tests search functionality
- `test-subscription-events.sh` - Tests subscription lifecycle events
- `test-api.js` - Tests API endpoints
- `test-auth.ts` - Tests auth functionality

## Data Scripts (`/data`)
Scripts for managing and updating data.
- `update-crypto.js` - Updates cryptocurrency data
- `update-macro-market-data.ts` - Updates macro market data
- `populate-macro-market-data.ts` - Populates initial macro market data
- `schedule-crypto-update.ts` - Schedules crypto data updates
- `import-ghost-content.ts` - Imports content from Ghost

## Migration Scripts (`/migrations`)
Scripts for database migrations.
- `run-migration.ts` - Runs migrations from SQL files
- `run-migration.sh` - Shell script to run migrations
- `/sql` - Directory containing SQL migration files
  - `content-tables.sql` - Creates content tables

## Utility Scripts (`/utils`)
Utility scripts for various tasks.
- `create-admin.ts` - Creates or promotes a user to admin
- `init-jobs.ts` - Initializes background jobs
- `init-jobs-with-tables.ts` - Initializes jobs with tables
- `process-jobs-cli.ts` - Processes jobs from the CLI

## Using the Scripts

Most scripts can be run using npm scripts defined in `package.json`. For example:

```bash
# Setup
npm run setup

# Testing
npm run test:search
npm run test:subscription

# Data
npm run data:update-crypto
npm run data:update-market

# Admin
npm run admin:create your.email@example.com

# Migrations
npm run db:migrate
```

For scripts not defined in package.json, you can run them directly using Node.js or the appropriate interpreter. 