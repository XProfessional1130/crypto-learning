import { NextRequest, NextResponse } from 'next/server';
import { JobScheduler, JobType } from '@/lib/services/job-scheduler';

export async function GET(req: NextRequest) {
  // For security in production, you would add some authentication here
  try {
    // Schedule job to run immediately
    const jobId = await JobScheduler.scheduleJob(
      JobType.UPDATE_MACRO_MARKET_DATA,
      {},
      new Date()
    );
    
    if (!jobId) {
      return NextResponse.json({
        success: false,
        error: 'Failed to schedule job'
      }, { status: 500 });
    }
    
    // Process pending jobs
    const processedCount = await JobScheduler.processPendingJobs();
    
    return NextResponse.json({
      success: true,
      jobId,
      processedCount,
      message: `Scheduled and processed macro market data update job. Processed ${processedCount} total jobs.`
    });
  } catch (error) {
    console.error('Error updating macro market data:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Error updating macro market data',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
} 