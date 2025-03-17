import { NextRequest, NextResponse } from 'next/server';
import { JobScheduler, JobType } from '@/lib/api/job-scheduler';

// Secret key for authorization to prevent unauthorized access
const API_SECRET_KEY = process.env.JOBS_API_SECRET;

interface JobsResponse {
  success: boolean;
  processedCount?: number;
  triggeredJob?: string;
  error?: string;
}

export async function GET(
  req: NextRequest
) {
  // For local development, we'll allow GET requests with a trigger parameter
  const url = new URL(req.url);
  const trigger = url.searchParams.get('trigger');
  
  if (!trigger) {
    return handleRequest(req);
  }
  
  // Check if this is a trigger request for a specific job type
  const triggerJob = trigger;
      
  // Validate job type
  if (!Object.values(JobType).includes(triggerJob as JobType)) {
    return NextResponse.json({
      success: false,
      error: `Invalid job type: ${triggerJob}. Valid types are: ${Object.values(JobType).join(', ')}`
    }, { status: 400 });
  }
      
  // Schedule and immediately process the job
  await JobScheduler.scheduleJob(triggerJob as JobType, {}, new Date());
  const processedCount = await JobScheduler.processPendingJobs();
      
  return NextResponse.json({
    success: true,
    triggeredJob: triggerJob,
    processedCount
  }, { status: 200 });
}

export async function POST(
  req: NextRequest
) {
  return handleRequest(req);
}

async function handleRequest(req: NextRequest): Promise<NextResponse<JobsResponse>> {
  // Verify secret key to prevent unauthorized access
  const authHeader = req.headers.get('authorization');
  if (!API_SECRET_KEY || !authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json({ 
      success: false, 
      error: 'Unauthorized' 
    }, { status: 401 });
  }
  
  const token = authHeader.substring(7); // Remove 'Bearer ' prefix
  if (token !== API_SECRET_KEY) {
    return NextResponse.json({ 
      success: false, 
      error: 'Invalid credentials' 
    }, { status: 401 });
  }
  
  try {
    // Process pending jobs
    const processedCount = await JobScheduler.processPendingJobs();
    
    return NextResponse.json({
      success: true,
      processedCount
    }, { status: 200 });
  } catch (error) {
    console.error('Error processing jobs:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to process jobs'
    }, { status: 500 });
  }
} 