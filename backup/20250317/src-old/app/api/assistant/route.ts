import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { AssistantChatRequest, ThreadInfo } from '@/types/ai';
import { getAssistantId, createThread, addMessageToThread } from '@/lib/services/openai-assistant';
import { saveChatMessage, getRecentConversations, getChatByThread } from '@/lib/services/chat-history';

// Initialize OpenAI client with optimized settings
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  maxRetries: 1, // Reduce retries for faster error detection
  timeout: 15000, // 15 second timeout
});

// Store thread IDs for users
// In a real app, you would store this in a database
const userThreads: Record<string, ThreadInfo> = {};

// Extend the NextResponse to allow maxDuration
export const maxDuration = 60; // Set max duration to 60 seconds

/**
 * GET handler to retrieve chat history
 */
export async function GET(request: Request) {
  try {
    // Get query parameters
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const threadId = searchParams.get('threadId');
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Missing userId parameter' },
        { status: 400 }
      );
    }
    
    // If threadId is provided, get chat for specific thread
    if (threadId) {
      const messages = await getChatByThread(userId, threadId);
      return NextResponse.json({ messages });
    }
    
    // Otherwise get recent conversations
    const conversations = await getRecentConversations(userId);
    return NextResponse.json({ conversations });
    
  } catch (error: any) {
    console.error('Error retrieving chat history:', error);
    return NextResponse.json(
      { error: error.message || 'An error occurred' },
      { status: 500 }
    );
  }
}

/**
 * POST handler to send a message to the assistant
 */
export async function POST(request: Request) {
  try {
    // Parse request body
    const body = await request.json() as AssistantChatRequest;
    const { message, threadId, personality, userId } = body;
    
    if (!message) {
      return NextResponse.json(
        { error: 'Missing message' },
        { status: 400 }
      );
    }
    
    if (!personality) {
      return NextResponse.json(
        { error: 'Missing personality' },
        { status: 400 }
      );
    }
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Missing userId' },
        { status: 400 }
      );
    }
    
    // Get assistant ID for the personality
    const assistantId = getAssistantId(personality);
    
    // Get or create thread for the user
    let currentThreadId: string;
    
    if (threadId) {
      currentThreadId = threadId;
    } else if (userThreads[userId] && userThreads[userId].personality === personality) {
      // Use existing thread if personality matches
      currentThreadId = userThreads[userId].threadId;
    } else {
      // Create a new thread
      currentThreadId = await createThread();
      
      // Store the thread info
      userThreads[userId] = {
        threadId: currentThreadId,
        assistantId,
        personality
      };
    }
    
    // Add message to thread first - but don't await it
    const addMessagePromise = addMessageToThread(currentThreadId, message);
    
    // Start creating a run immediately
    const runPromise = openai.beta.threads.runs.create(
      currentThreadId,
      {
        assistant_id: assistantId,
      }
    );
    
    // Save user message to database (in background)
    const saveMessagePromise = saveChatMessage({
      user_id: userId,
      role: 'user',
      content: message,
      thread_id: currentThreadId,
      assistant_id: assistantId,
      created_at: new Date().toISOString(),
    });
    
    // Set a timeout to avoid waiting too long for the runId
    let runId: string;
    try {
      // Try to get the runId with a timeout
      const runPromiseWithTimeout = Promise.race([
        runPromise,
        new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('Run creation timed out')), 3000)
        )
      ]);
      
      // Wait for the run to be created, but with a timeout
      const run = await runPromiseWithTimeout as any;
      runId = run.id;
    } catch (timeoutError) {
      console.log('Run creation timed out, returning temporary ID');
      // Generate a temporary ID and initiate background processing
      runId = `temp-${Date.now()}`;
      
      // Continue run creation in the background
      runPromise.then(run => {
        console.log(`Run created in background: ${run.id} (replacing temp ${runId})`);
        // The client will reconnect when it doesn't find the temp ID
      }).catch(error => {
        console.error('Background run creation failed:', error);
      });
    }
    
    // Return response immediately with threadId and runId
    // Don't wait for all operations to complete
    return NextResponse.json({ 
      status: 'processing', 
      threadId: currentThreadId,
      runId
    });
    
    // Background operations will continue running
    
  } catch (error: any) {
    console.error('Error in assistant API:', error);
    return NextResponse.json(
      { error: error.message || 'An error occurred' },
      { status: 500 }
    );
  }
}

/**
 * New endpoint to check the status of a run and get the response when complete
 */
export async function GET_STATUS(request: Request) {
  try {
    // Get query parameters
    const { searchParams } = new URL(request.url);
    const threadId = searchParams.get('threadId');
    const runId = searchParams.get('runId');
    const userId = searchParams.get('userId');
    
    if (!threadId || !runId || !userId) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }
    
    // Get run status
    const runStatus = await openai.beta.threads.runs.retrieve(
      threadId,
      runId
    );
    
    if (runStatus.status === 'failed') {
      return NextResponse.json({
        status: 'failed',
        error: runStatus.last_error?.message || 'Run failed',
      });
    }
    
    if (runStatus.status !== 'completed') {
      return NextResponse.json({
        status: runStatus.status,
      });
    }
    
    // If the run is completed, fetch the messages
    const messages = await openai.beta.threads.messages.list(
      threadId,
      { order: 'desc', limit: 1 }
    );
    
    const latestMessage = messages.data[0];
    
    if (!latestMessage || latestMessage.role !== 'assistant') {
      return NextResponse.json({
        status: 'error',
        error: 'No assistant message found',
      });
    }
    
    // Extract the message content
    let messageContent = '';
    if (latestMessage.content && latestMessage.content.length > 0) {
      const contentPart = latestMessage.content[0];
      if (contentPart.type === 'text') {
        messageContent = contentPart.text.value;
      }
    }
    
    // Try to get the personality from user threads or default to 'tobo'
    const personality = userThreads[userId]?.personality || 'tobo';
    
    // Save to database
    await saveChatMessage({
      user_id: userId,
      role: 'assistant',
      content: messageContent,
      personality,
      thread_id: threadId,
      assistant_id: latestMessage.assistant_id || '',
      created_at: new Date().toISOString(),
    });
    
    // Return the message content
    return NextResponse.json({ 
      status: 'completed',
      content: messageContent,
      threadId,
    });
    
  } catch (error: any) {
    console.error('Error checking run status:', error);
    return NextResponse.json(
      { error: error.message || 'An error occurred' },
      { status: 500 }
    );
  }
} 