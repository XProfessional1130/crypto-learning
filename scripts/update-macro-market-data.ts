/**
 * Script to trigger an immediate update of macro market data
 * 
 * Run this script with:
 * npx ts-node scripts/update-macro-market-data.ts
 */

import { JobScheduler, JobType } from '../lib/services/job-scheduler';

async function main() {
  try {
    console.log('Scheduling immediate macro market data update...');
    
    // Schedule job to run immediately
    const jobId = await JobScheduler.scheduleJob(
      JobType.UPDATE_MACRO_MARKET_DATA,
      {},
      new Date()
    );
    
    if (jobId) {
      console.log(`Job scheduled successfully with ID: ${jobId}`);
      
      // Process the job right away
      console.log('Processing pending jobs...');
      const processedCount = await JobScheduler.processPendingJobs();
      console.log(`Processed ${processedCount} job(s)`);
    } else {
      console.error('Failed to schedule job');
    }
  } catch (error) {
    console.error('Error updating macro market data:', error);
  }
}

// Run the main function
main()
  .then(() => {
    console.log('Macro market data update complete!');
    process.exit(0);
  })
  .catch(error => {
    console.error('Failed to update macro market data:', error);
    process.exit(1);
  }); 