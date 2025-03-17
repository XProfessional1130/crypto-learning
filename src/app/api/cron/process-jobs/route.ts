import { NextResponse } from 'next/server';
import { JobScheduler } from '@/lib/api/job-scheduler';

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
    // Process pending jobs
    const processedCount = await JobScheduler.processPendingJobs();
    
    return NextResponse.json({
      success: true,
      processedCount,
      message: `Processed ${processedCount} jobs`
    });
  } catch (error) {
    console.error('Error processing jobs:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to process jobs',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
} 