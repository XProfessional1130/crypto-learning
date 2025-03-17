/**
 * CLI tool for manually processing background jobs
 * 
 * This script lets you manually process pending jobs for testing
 * and debugging purposes.
 * 
 * Usage:
 * npx ts-node scripts/process-jobs-cli.ts
 */

import { JobScheduler, JobType, JobStatus } from '../src/lib/api/job-scheduler';
import { createServiceClient } from '../src/lib/api/supabase';

async function main() {
  try {
    console.log('=== Background Jobs CLI Tool ===');
    
    // Process pending jobs
    console.log('\nProcessing pending jobs...');
    const processedCount = await JobScheduler.processPendingJobs();
    console.log(`Processed ${processedCount} jobs.`);
    
    // Get job status summary
    const adminClient = createServiceClient();
    const { data: statusSummary, error: summaryError } = await adminClient.rpc('get_jobs_status_summary');
    
    if (summaryError) {
      console.error('Error getting status summary:', summaryError);
    } else {
      console.log('\nJob Status Summary:');
      console.table(statusSummary);
    }
    
    // Get recent jobs
    const { data: recentJobs, error: recentError } = await adminClient
      .from('background_jobs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);
    
    if (recentError) {
      console.error('Error getting recent jobs:', recentError);
    } else {
      console.log('\nRecent Jobs:');
      recentJobs.forEach(job => {
        console.log(`- ${job.job_type} (${job.status}) created at ${new Date(job.created_at).toLocaleString()}`);
        if (job.status === JobStatus.FAILED) {
          console.log(`  ERROR: ${job.error}`);
        }
      });
    }
    
    // Create the RPC function if it doesn't exist yet
    await createHelperFunctions(adminClient);
    
    return processedCount;
  } catch (error) {
    console.error('Error processing jobs:', error);
    return 0;
  }
}

/**
 * Create helper functions in the database
 */
async function createHelperFunctions(adminClient: any) {
  try {
    // Create function to get job status summary
    await adminClient.from('_manual_sql').rpc('execute_sql', {
      sql: `
      CREATE OR REPLACE FUNCTION get_jobs_status_summary()
      RETURNS TABLE (status text, count bigint) 
      LANGUAGE sql
      SECURITY DEFINER
      AS $$
        SELECT status, COUNT(*) as count
        FROM background_jobs
        GROUP BY status
        ORDER BY status;
      $$;
      `
    });
  } catch (error) {
    // Ignore errors, as the function might already exist
  }
}

// Run the main function
main()
  .then((count) => {
    console.log(`\nJob processing complete. Processed ${count} jobs.`);
    process.exit(0);
  })
  .catch(error => {
    console.error('Failed to process jobs:', error);
    process.exit(1);
  }); 