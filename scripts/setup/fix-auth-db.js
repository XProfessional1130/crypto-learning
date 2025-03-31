#!/usr/bin/env node

// This script fixes the authentication database issues by calling the fix-auth-relations endpoint
// Run it with: node scripts/fix-auth-db.js

const http = require('http');
const https = require('https');
require('dotenv').config();

const API_KEY = process.env.ADMIN_API_KEY;
const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

// Function to call our API endpoint
async function fixAuthDatabase() {
  console.log('🔧 Starting database fix for authentication...');
  
  const url = new URL('/api/db-setup/fix-auth-relations', BASE_URL);
  url.searchParams.append('api_key', API_KEY);
  
  const client = url.protocol === 'https:' ? https : http;
  
  return new Promise((resolve, reject) => {
    const req = client.get(url.toString(), (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            const jsonData = JSON.parse(data);
            resolve(jsonData);
          } catch (error) {
            reject(new Error(`Failed to parse response: ${data}`));
          }
        } else {
          reject(new Error(`Request failed with status code ${res.statusCode}: ${data}`));
        }
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    req.end();
  });
}

// Main function
async function main() {
  try {
    // Check if API_KEY is set
    if (!API_KEY) {
      console.error('❌ Missing ADMIN_API_KEY in .env file');
      process.exit(1);
    }
    
    console.log(`🔗 Using base URL: ${BASE_URL}`);
    
    // Call the API endpoint
    const result = await fixAuthDatabase();
    console.log('✅ Database fix complete:', result.message);
    
  } catch (error) {
    console.error('❌ Error fixing database:', error.message);
    process.exit(1);
  }
}

// Run the script
main(); 