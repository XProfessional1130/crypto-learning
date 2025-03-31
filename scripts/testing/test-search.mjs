#!/usr/bin/env node

/**
 * Search Testing Utility
 * Tests the search functionality with various queries
 */

import dotenv from 'dotenv';
import fetch from 'node-fetch';

// Load environment variables
dotenv.config({ path: '.env.local' });

const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';
const API_KEY = process.env.ADMIN_API_KEY;

if (!API_KEY) {
  console.error('❌ ADMIN_API_KEY environment variable is not set');
  process.exit(1);
}

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m'
};

// Test search queries
const testQueries = [
  'bitcoin',
  'cryptocurrency market',
  'blockchain technology',
  'ethereum',
  'defi',
  'nft'
];

async function testSearch() {
  console.log(`${colors.blue}🔍 Testing Search API${colors.reset}`);
  console.log(`${colors.yellow}API URL: ${apiUrl}/search${colors.reset}`);
  
  let passedTests = 0;
  let failedTests = 0;
  
  for (const query of testQueries) {
    try {
      const response = await fetch(`${apiUrl}/search?q=${encodeURIComponent(query)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${API_KEY}`
        }
      });
      
      const data = await response.json();
      
      if (response.ok && Array.isArray(data.results)) {
        console.log(`${colors.green}✓ "${query}" - ${data.results.length} results${colors.reset}`);
        passedTests++;
      } else {
        console.log(`${colors.red}✗ "${query}" - Failed: ${data.error || 'Unknown error'}${colors.reset}`);
        failedTests++;
      }
    } catch (error) {
      console.error(`${colors.red}✗ "${query}" - Exception: ${error.message}${colors.reset}`);
      failedTests++;
    }
  }
  
  console.log(`\n${colors.blue}📊 Test Summary:${colors.reset}`);
  console.log(`${colors.green}Passed: ${passedTests}${colors.reset}`);
  console.log(`${colors.red}Failed: ${failedTests}${colors.reset}`);
  console.log(`${colors.yellow}Total: ${testQueries.length}${colors.reset}`);
  
  return failedTests === 0;
}

console.log(`${colors.blue}=== Learning Crypto Platform Search Test ===${colors.reset}`);

testSearch()
  .then(success => {
    if (success) {
      console.log(`${colors.green}🎉 All tests passed!${colors.reset}`);
      process.exit(0);
    } else {
      console.log(`${colors.red}❌ Some tests failed${colors.reset}`);
      process.exit(1);
    }
  })
  .catch(error => {
    console.error(`${colors.red}❌ Test execution failed: ${error.message}${colors.reset}`);
    process.exit(1);
  }); 