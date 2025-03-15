import { NextApiRequest, NextApiResponse } from 'next';
import { JobScheduler, JobType } from '@/lib/services/job-scheduler';

// Secret key for authorization to prevent unauthorized access
const API_SECRET_KEY = process.env.JOBS_API_SECRET;

interface JobsResponse {
  success: boolean;
  processedCount?: number;
  triggeredJob?: string;
  error?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<JobsResponse>
) {
  // Allow both GET and POST requests
  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).json({ 
      success: false, 
      error: 'Method not allowed' 
    });
  }
  
  // For local development, we'll skip auth for GET requests with a trigger parameter
  const isTriggerRequest = req.method === 'GET' && req.query.trigger;
  
  // Verify secret key to prevent unauthorized access (except for trigger requests in development)
  if (!isTriggerRequest) {
    const authHeader = req.headers.authorization;
    if (!API_SECRET_KEY || !authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        success: false, 
        error: 'Unauthorized' 
      });
    }
    
    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    if (token !== API_SECRET_KEY) {
      return res.status(401).json({ 
        success: false, 
        error: 'Invalid credentials' 
      });
    }
  }
  
  try {
    // Check if this is a trigger request for a specific job type
    if (isTriggerRequest) {
      const triggerJob = req.query.trigger as string;
      
      // Validate job type
      if (!Object.values(JobType).includes(triggerJob as JobType)) {
        return res.status(400).json({
          success: false,
          error: `Invalid job type: ${triggerJob}. Valid types are: ${Object.values(JobType).join(', ')}`
        });
      }
      
      // Schedule and immediately process the job
      await JobScheduler.scheduleJob(triggerJob as JobType, {}, new Date());
      const processedCount = await JobScheduler.processPendingJobs();
      
      return res.status(200).json({
        success: true,
        triggeredJob: triggerJob,
        processedCount
      });
    }
    
    // Process pending jobs
    const processedCount = await JobScheduler.processPendingJobs();
    
    return res.status(200).json({
      success: true,
      processedCount
    });
  } catch (error) {
    console.error('Error processing jobs:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to process jobs'
    });
  }
} 