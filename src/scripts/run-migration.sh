#!/bin/bash

# Script to run the content tables migration
echo "Running content tables migration..."

# Determine if we have access to the Supabase database
if [ -n "$SUPABASE_DB_URL" ]; then
  # Use direct PostgreSQL connection if we have a DB URL
  echo "Using direct PostgreSQL connection"
  psql "$SUPABASE_DB_URL" -f src/scripts/migrations/content-tables.sql
elif command -v supabase &> /dev/null; then
  # Use Supabase CLI if available
  echo "Using Supabase CLI"
  supabase db push --db-url "$SUPABASE_URL" src/scripts/migrations/content-tables.sql
else
  # Fallback to manual instructions
  echo "Error: Unable to run migration automatically"
  echo "Please run the migration manually using one of the following methods:"
  echo "1. With psql: psql YOUR_SUPABASE_DB_URL -f src/scripts/migrations/content-tables.sql"
  echo "2. With Supabase Dashboard SQL Editor: Copy the contents of src/scripts/migrations/content-tables.sql and paste into the SQL Editor"
  exit 1
fi

# Check if the migration was successful
if [ $? -eq 0 ]; then
  echo "✅ Migration completed successfully!"
else
  echo "❌ Migration failed!"
  exit 1
fi 