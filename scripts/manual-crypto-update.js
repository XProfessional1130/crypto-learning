const { exec } = require('child_process');

// Call the process-jobs API endpoint with the trigger parameter for crypto update
const apiUrl = 'http://localhost:3000/api/jobs/process-pending?trigger=update_crypto_market_data';

console.log(`Manually triggering crypto market data update job: ${apiUrl}`);

// Use curl to make the API call
exec(`curl "${apiUrl}"`, (error, stdout, stderr) => {
  if (error) {
    console.error(`Error: ${error.message}`);
    return;
  }
  
  // Print stderr as info, not error, as curl outputs progress to stderr
  if (stderr) {
    console.log(`Curl progress:`, stderr);
  }
  
  // Try to parse and pretty-print the JSON response
  try {
    const response = JSON.parse(stdout);
    console.log('API Response:');
    console.log(JSON.stringify(response, null, 2));
    
    if (response.success) {
      console.log('✅ Crypto market data update job has been triggered successfully.');
      if (response.processedCount) {
        console.log(`Processed ${response.processedCount} job(s).`);
      }
      if (response.triggeredJob) {
        console.log(`Triggered job: ${response.triggeredJob}`);
      }
    } else {
      console.error('❌ Failed to trigger job:', response.error || 'Unknown error');
    }
  } catch (parseError) {
    console.log('Raw response:', stdout);
    console.error('Error parsing response:', parseError.message);
  }
}); 