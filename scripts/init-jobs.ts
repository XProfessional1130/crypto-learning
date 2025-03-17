/**
 * Initialize background jobs script
 * 
 * This script initializes the background jobs system by creating initial jobs.
 * Run this script after deploying to production or when setting up a new environment.
 * 
 * Usage:
 * npx ts-node scripts/init-jobs.ts
 */

import { JobScheduler, JobType } from '../lib/services/job-scheduler';
import { createServiceClient } from '../lib/supabase';

async function main() {
  try {
    console.log('Initializing background jobs...');
    
    // Check if we have any existing jobs first
    const adminClient = createServiceClient();
    
    // Use count() in a raw SQL query to get job counts by type
    const { data, error } = await adminClient.rpc('get_pending_job_counts');
    
    if (error) {
      console.warn('Error getting job counts, continuing anyway:', error);
      // Just create an empty map and continue
      const existingJobs = new Map<string, number>();
      
      // Schedule each job type
      const initialJobs = [
        { type: JobType.CACHE_CLEANUP, minutes: 60 },
        { type: JobType.UPDATE_TOP_COINS, minutes: 30 },
        { type: JobType.UPDATE_GLOBAL_DATA, minutes: 60 },
        { type: JobType.UPDATE_NEWS, minutes: 15 },
        { type: JobType.UPDATE_MACRO_MARKET_DATA, minutes: 60 }
      ];
      
      let scheduledCount = 0;
      
      for (const job of initialJobs) {
        // Schedule the job
        const scheduledFor = new Date();
        const jobId = await JobScheduler.scheduleJob(job.type, {}, scheduledFor);
        
        if (jobId) {
          console.log(`Scheduled initial job: ${job.type} (runs every ${job.minutes} minutes)`);
          scheduledCount++;
        } else {
          console.error(`Failed to schedule job: ${job.type}`);
        }
      }
      
      console.log(`Initialized ${scheduledCount} background jobs.`);
      return;
    }
    
    // Convert to a map for easier lookup
    const existingJobs = new Map<string, number>();
    data.forEach((item: any) => {
      existingJobs.set(item.job_type, item.count);
    });
    
    // Schedule each job type if not already scheduled
    const initialJobs = [
      { type: JobType.CACHE_CLEANUP, minutes: 60 },
      { type: JobType.UPDATE_TOP_COINS, minutes: 30 },
      { type: JobType.UPDATE_GLOBAL_DATA, minutes: 60 },
      { type: JobType.UPDATE_NEWS, minutes: 15 },
      { type: JobType.UPDATE_MACRO_MARKET_DATA, minutes: 60 }
    ];
    
    let scheduledCount = 0;
    
    for (const job of initialJobs) {
      if (!existingJobs.has(job.type) || existingJobs.get(job.type) === 0) {
        // Calculate scheduled time
        const scheduledFor = new Date();
        
        // Schedule the job
        const jobId = await JobScheduler.scheduleJob(job.type, {}, scheduledFor);
        
        if (jobId) {
          console.log(`Scheduled initial job: ${job.type} (runs every ${job.minutes} minutes)`);
          scheduledCount++;
        } else {
          console.error(`Failed to schedule job: ${job.type}`);
        }
      } else {
        console.log(`Job already scheduled: ${job.type}`);
      }
    }
    
    console.log(`Initialized ${scheduledCount} background jobs.`);
  } catch (error) {
    console.error('Error initializing background jobs:', error);
    process.exit(1);
  }
}

// Run the main function
main()
  .then(() => {
    console.log('Background jobs initialization complete!');
    process.exit(0);
  })
  .catch(error => {
    console.error('Failed to initialize background jobs:', error);
    process.exit(1);
  }); 