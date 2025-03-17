import { NextResponse } from 'next/server';
import { JobScheduler, JobType } from '@/lib/services/job-scheduler';
import { createServiceClient } from '@/lib/supabase';

export async function GET(request: Request) {
  // Verify the authorization token
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ') || 
      authHeader.substring(7) !== process.env.CRON_SECRET) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 401 }
    );
  }
  
  try {
    // Get admin client
    const adminClient = createServiceClient();
    
    // Get current pending jobs
    const { data, error } = await adminClient.rpc('get_pending_job_counts');
    
    if (error) {
      console.warn('Error getting job counts, continuing anyway:', error);
    }
    
    // Convert to a map for easier lookup
    const existingJobs = new Map<string, number>();
    if (data) {
      data.forEach((item: any) => {
        existingJobs.set(item.job_type, item.count);
      });
    }
    
    // Define job types and schedules
    const initialJobs = [
      { type: JobType.CACHE_CLEANUP, minutes: 60 },
      { type: JobType.UPDATE_TOP_COINS, minutes: 30 },
      { type: JobType.UPDATE_GLOBAL_DATA, minutes: 60 },
      { type: JobType.UPDATE_NEWS, minutes: 15 },
      { type: JobType.UPDATE_MACRO_MARKET_DATA, minutes: 60 }
    ];
    
    // Schedule jobs if not already scheduled
    let scheduledCount = 0;
    const scheduledJobs = [];
    
    for (const job of initialJobs) {
      if (!existingJobs.has(job.type) || existingJobs.get(job.type) === 0) {
        // Schedule for now
        const scheduledFor = new Date();
        const jobId = await JobScheduler.scheduleJob(job.type, {}, scheduledFor);
        
        if (jobId) {
          scheduledCount++;
          scheduledJobs.push({
            type: job.type,
            id: jobId,
            runs_every: `${job.minutes} minutes`
          });
        }
      }
    }
    
    if (scheduledCount === 0) {
      return NextResponse.json({
        success: true,
        message: 'All jobs already scheduled'
      });
    }
    
    return NextResponse.json({
      success: true,
      message: `Scheduled ${scheduledCount} jobs`,
      jobs: scheduledJobs
    });
  } catch (error) {
    console.error('Error initializing jobs:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to initialize jobs',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
} 