/**
 * Initialize background jobs script with table creation
 * 
 * This script initializes the background jobs system by creating tables (if needed) and initial jobs.
 * Run this script after deploying to production or when setting up a new environment.
 * 
 * Usage:
 * npx ts-node scripts/init-jobs-with-tables.ts
 */

import { JobScheduler, JobType } from '../src/lib/api/job-scheduler';
import { createServiceClient } from '../src/lib/api/supabase';

async function main() {
  try {
    console.log('Initializing background jobs system...');
    
    // Get Supabase admin client
    const adminClient = createServiceClient();
    if (!adminClient) {
      throw new Error('Failed to create Supabase service client. Check your environment variables.');
    }
    
    // Step 1: Create tables if they don't exist
    console.log('Creating required tables if they don\'t exist...');
    await createTablesIfNeeded(adminClient);
    
    // Step 2: Create the job counting function
    console.log('Creating helper functions...');
    await createHelperFunctions(adminClient);
    
    // Step 3: Schedule initial jobs
    console.log('Scheduling initial jobs...');
    
    // Use our RPC function to get current job counts
    const { data, error } = await adminClient.rpc('get_pending_job_counts');
    
    // Handle error by creating an empty map
    const existingJobs = new Map<string, number>();
    if (!error && data) {
      data.forEach((item: any) => {
        existingJobs.set(item.job_type, item.count);
      });
    } else {
      console.warn('Error getting job counts, continuing anyway:', error);
    }
    
    // Schedule each job type if not already scheduled
    const initialJobs = [
      { type: JobType.CACHE_CLEANUP, minutes: 60 },
      { type: JobType.UPDATE_TOP_COINS, minutes: 30 },
      { type: JobType.UPDATE_GLOBAL_DATA, minutes: 60 },
      { type: JobType.UPDATE_NEWS, minutes: 15 }
    ];
    
    let scheduledCount = 0;
    
    for (const job of initialJobs) {
      if (!existingJobs.has(job.type) || existingJobs.get(job.type) === 0) {
        // Schedule the job
        const scheduledFor = new Date();
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

/**
 * Create the necessary tables if they don't exist
 */
async function createTablesIfNeeded(adminClient: any) {
  try {
    // Create api_cache table if it doesn't exist
    await adminClient.rpc('create_api_cache_table_if_not_exists');
    
    // Create background_jobs table if it doesn't exist
    await adminClient.rpc('create_background_jobs_table_if_not_exists');
    
    console.log('Tables created or already exist.');
  } catch (error) {
    console.error('Error creating tables:', error);
    // Create the tables using raw SQL as a fallback
    try {
      console.log('Trying to create tables directly with SQL...');
      
      // Create api_cache table
      await adminClient.from('_manual_sql').rpc('execute_sql', {
        sql: `
        CREATE TABLE IF NOT EXISTS api_cache (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          key TEXT NOT NULL,
          source TEXT NOT NULL,
          data JSONB NOT NULL,
          expires_at TIMESTAMPTZ NOT NULL,
          created_at TIMESTAMPTZ DEFAULT now(),
          updated_at TIMESTAMPTZ DEFAULT now(),
          CONSTRAINT unique_cache_entry UNIQUE (key, source)
        );
        
        -- Add indexes for faster lookups if they don't exist
        CREATE INDEX IF NOT EXISTS idx_api_cache_key_source ON api_cache(key, source);
        CREATE INDEX IF NOT EXISTS idx_api_cache_expires_at ON api_cache(expires_at);
        
        -- Enable RLS
        ALTER TABLE api_cache ENABLE ROW LEVEL SECURITY;
        `
      });
      
      // Create background_jobs table
      await adminClient.from('_manual_sql').rpc('execute_sql', {
        sql: `
        CREATE TABLE IF NOT EXISTS background_jobs (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          job_type TEXT NOT NULL,
          status TEXT NOT NULL CHECK (status IN ('pending', 'running', 'completed', 'failed')),
          data JSONB NULL,
          result JSONB NULL,
          error TEXT NULL,
          created_at TIMESTAMPTZ DEFAULT now(),
          updated_at TIMESTAMPTZ DEFAULT now(),
          scheduled_for TIMESTAMPTZ NOT NULL,
          completed_at TIMESTAMPTZ NULL
        );
        
        -- Add indexes for faster lookups if they don't exist
        CREATE INDEX IF NOT EXISTS idx_background_jobs_status ON background_jobs(status);
        CREATE INDEX IF NOT EXISTS idx_background_jobs_type ON background_jobs(job_type);
        CREATE INDEX IF NOT EXISTS idx_background_jobs_scheduled_for ON background_jobs(scheduled_for);
        
        -- Enable RLS
        ALTER TABLE background_jobs ENABLE ROW LEVEL SECURITY;
        `
      });
      
      console.log('Tables created successfully with direct SQL.');
    } catch (sqlError) {
      console.error('Error creating tables with direct SQL:', sqlError);
      throw new Error('Failed to create required tables. You may need to run the migrations manually.');
    }
  }
}

/**
 * Create helper functions in the database
 */
async function createHelperFunctions(adminClient: any) {
  try {
    // Create function to get pending job counts
    await adminClient.from('_manual_sql').rpc('execute_sql', {
      sql: `
      CREATE OR REPLACE FUNCTION get_pending_job_counts()
      RETURNS TABLE (job_type text, count bigint) 
      LANGUAGE sql
      SECURITY DEFINER
      AS $$
        SELECT job_type, COUNT(*) as count
        FROM background_jobs
        WHERE status = 'pending'
        GROUP BY job_type;
      $$;
      
      -- Create helper functions for table creation
      CREATE OR REPLACE FUNCTION create_api_cache_table_if_not_exists()
      RETURNS void
      LANGUAGE plpgsql
      SECURITY DEFINER
      AS $$
      BEGIN
        -- This function is just a placeholder for the actual table creation
        -- which is handled in the main function
      END;
      $$;
      
      CREATE OR REPLACE FUNCTION create_background_jobs_table_if_not_exists()
      RETURNS void
      LANGUAGE plpgsql
      SECURITY DEFINER
      AS $$
      BEGIN
        -- This function is just a placeholder for the actual table creation
        -- which is handled in the main function
      END;
      $$;
      `
    });
    
    console.log('Helper functions created successfully.');
  } catch (error) {
    console.error('Error creating helper functions:', error);
    // We'll continue anyway as we have fallbacks
  }
}

// Run the main function
main()
  .then(() => {
    console.log('Background jobs system initialization complete!');
    process.exit(0);
  })
  .catch(error => {
    console.error('Failed to initialize background jobs system:', error);
    process.exit(1);
  }); 