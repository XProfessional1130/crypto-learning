// Simple script to test the migrated API endpoints

// Set the base URL to your local development server
const baseUrl = 'http://localhost:3000';

// Function to test an API endpoint
async function testEndpoint(path) {
  try {
    console.log(`Testing endpoint: ${path}`);
    const response = await fetch(`${baseUrl}${path}`);
    const status = response.status;
    const data = await response.json();
    
    console.log(`Status: ${status}`);
    console.log('Response:', JSON.stringify(data, null, 2));
    console.log('------------------------------------');
    
    return { status, data };
  } catch (error) {
    console.error(`Error testing ${path}:`, error.message);
    console.log('------------------------------------');
    return { error: error.message };
  }
}

// Main function to run tests
async function runTests() {
  console.log('Starting API endpoint tests...');
  
  // Test global-data endpoint
  await testEndpoint('/api/global-data');
  
  // Test test-search endpoint
  await testEndpoint('/api/test-search?query=bitcoin');
  
  // Test coin-list endpoint
  await testEndpoint('/api/coin-list?limit=5');
  
  console.log('API tests completed!');
}

// Run the tests
runTests().catch(console.error); 