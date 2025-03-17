import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

// Initialize OpenAI client with optimized settings
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  maxRetries: 1,
  timeout: 5000, // Short timeout since this is just a helper endpoint
});

// Mark route as dynamic to prevent static optimization issues
export const dynamic = 'force-dynamic';

// Extend the NextResponse to allow maxDuration
export const maxDuration = 20; // 20 seconds is more than enough

/**
 * GET handler to retrieve the latest runs for a thread
 */
export async function GET(req: NextRequest) {
  try {
    // Get query parameters
    const { searchParams } = req.nextUrl;
    const threadId = searchParams.get('threadId');
    const userId = searchParams.get('userId');
    
    if (!threadId || !userId) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }
    
    // Get latest runs for this thread
    const runsList = await openai.beta.threads.runs.list(threadId, { 
      limit: 5, // Get the 5 most recent runs
      order: 'desc' // Most recent first
    });
    
    // Return the runs
    return NextResponse.json({
      runs: runsList.data.map(run => ({
        id: run.id,
        status: run.status,
        created_at: run.created_at,
      }))
    });
    
  } catch (error: any) {
    console.error('Error retrieving runs:', error);
    return NextResponse.json(
      { error: error.message || 'An error occurred' },
      { status: 500 }
    );
  }
} 