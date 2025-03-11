import { NextApiRequest, NextApiResponse } from 'next';
import { JobScheduler } from '@/lib/services/job-scheduler';

// Secret key for authorization to prevent unauthorized access
const API_SECRET_KEY = process.env.JOBS_API_SECRET;

interface JobsResponse {
  success: boolean;
  processedCount?: number;
  error?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<JobsResponse>
) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false, 
      error: 'Method not allowed' 
    });
  }
  
  // Verify secret key to prevent unauthorized access
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
  
  try {
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