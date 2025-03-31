import { JobScheduler, JobType } from '../src/lib/api/job-scheduler';

/**
 * Schedule initial crypto market data update job
 */
async function scheduleInitialJob() {
  try {
    console.log('Scheduling initial crypto market data update job...');
    
    // Schedule job to run immediately
    const jobId = await JobScheduler.scheduleJob(
      JobType.UPDATE_CRYPTO_MARKET_DATA,
      {},
      new Date()
    );
    
    if (jobId) {
      console.log(`Job scheduled successfully with ID: ${jobId}`);
    } else {
      console.error('Failed to schedule job');
    }
  } catch (error) {
    console.error('Error scheduling job:', error);
  }
}

// Run the function
scheduleInitialJob()
  .then(() => console.log('Done'))
  .catch(err => console.error('Error:', err)); 