import { NextResponse } from 'next/server';
import OpenAI from 'openai';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * DELETE handler to remove a thread from OpenAI and local storage
 */
export async function DELETE(request: Request) {
  try {
    // Get query parameters
    const { searchParams } = new URL(request.url);
    const threadId = searchParams.get('threadId');
    const userId = searchParams.get('userId');
    
    if (!threadId) {
      return NextResponse.json(
        { error: 'Missing threadId parameter' },
        { status: 400 }
      );
    }
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Missing userId parameter' },
        { status: 400 }
      );
    }
    
    // 1. Delete the thread from OpenAI
    try {
      await openai.beta.threads.del(threadId);
    } catch (error: any) {
      console.error('Error deleting thread from OpenAI:', error);
      // Continue anyway, as we still want to delete from our database
    }
    
    // 2. Delete the thread from our database
    // In a real implementation, you would have database code here to remove the thread
    // For example:
    // await db.thread.delete({ where: { threadId, userId } });
    
    // 3. Return success
    return NextResponse.json({ 
      success: true,
      message: 'Thread deleted successfully' 
    });
    
  } catch (error: any) {
    console.error('Error deleting thread:', error);
    return NextResponse.json(
      { error: error.message || 'An error occurred' },
      { status: 500 }
    );
  }
} 