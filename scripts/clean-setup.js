#!/usr/bin/env node

/**
 * Clean Setup Script
 * 
 * This script ensures all necessary setup and migration steps are run
 * in the correct order for a clean project setup.
 */

require('dotenv').config({ path: '.env.local' });
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';
const RESET = '\x1b[0m';

// Helper function to run a command and handle errors
function runCommand(command, name) {
  console.log(`\n${YELLOW}Running ${name}...${RESET}`);
  try {
    execSync(command, { stdio: 'inherit' });
    console.log(`${GREEN}✓ ${name} completed successfully${RESET}`);
    return true;
  } catch (error) {
    console.error(`${RED}✗ ${name} failed: ${error.message}${RESET}`);
    return false;
  }
}

// Helper function to check if a file exists
function fileExists(filePath) {
  try {
    return fs.existsSync(filePath);
  } catch (error) {
    return false;
  }
}

// Main setup function
async function setup() {
  console.log(`${GREEN}=== Learning Crypto Platform Setup ===${RESET}`);
  
  // 1. Check environment variables
  console.log(`\n${YELLOW}Checking environment variables...${RESET}`);
  const requiredVars = [
    'NEXT_PUBLIC_SUPABASE_URL', 
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
    'ADMIN_API_KEY'
  ];
  
  const missingVars = requiredVars.filter(varName => !process.env[varName]);
  if (missingVars.length > 0) {
    console.error(`${RED}✗ Missing required environment variables: ${missingVars.join(', ')}${RESET}`);
    console.log(`Please add these variables to your .env.local file.`);
    return false;
  }
  console.log(`${GREEN}✓ All required environment variables are set${RESET}`);
  
  // 2. Fix database structure
  const dbScriptSuccess = runCommand('node scripts/fix-database.js', 'Database structure fix');
  if (!dbScriptSuccess) {
    console.log(`\n${YELLOW}The database fix script failed. This might be because:${RESET}`);
    console.log(`- The pgrest extension isn't enabled in Supabase`);
    console.log(`- Your Supabase URL or service role key is invalid`);
    console.log(`\nYou can manually run the SQL migration in the Supabase dashboard:`);
    console.log(`1. Open the SQL Editor in your Supabase project`);
    console.log(`2. Run: CREATE EXTENSION IF NOT EXISTS pgrest;`);
    console.log(`3. Copy the SQL from supabase/migrations/20240701000000_fix_database_conflicts.sql`);
    console.log(`4. Paste and run the SQL in the editor`);
    
    const forceContinue = process.argv.includes('--force');
    if (!forceContinue) {
      console.log(`\n${YELLOW}Setup halted. Fix the issues above or run with --force to continue anyway.${RESET}`);
      return false;
    }
    console.log(`\n${YELLOW}Continuing setup despite errors (--force flag used)${RESET}`);
  }
  
  // 3. Fix auth database relationships
  runCommand('node scripts/fix-auth-db.js', 'Auth database fix');
  
  // 4. Cleanup unnecessary files
  runCommand('node scripts/cleanup-unnecessary-files.sh', 'Cleanup of unnecessary files');
  
  // 5. Install dependencies if node_modules doesn't exist or is empty
  const nodeModulesPath = path.join(process.cwd(), 'node_modules');
  if (!fileExists(nodeModulesPath) || fs.readdirSync(nodeModulesPath).length === 0) {
    runCommand('npm install', 'Installing dependencies');
  } else {
    console.log(`${GREEN}✓ Dependencies already installed${RESET}`);
  }
  
  // 6. Run a build to verify everything works
  runCommand('npm run build', 'Build verification');
  
  console.log(`\n${GREEN}=== Setup Complete ===${RESET}`);
  console.log(`\nTo start the development server, run: npm run dev`);
  console.log(`To create your first admin user, run: npm run create-first-admin`);
  
  return true;
}

// Run the setup
setup().catch(error => {
  console.error(`${RED}Setup failed with an unexpected error: ${error.message}${RESET}`);
  process.exit(1);
}); 