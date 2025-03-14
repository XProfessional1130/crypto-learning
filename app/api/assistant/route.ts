import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { AssistantChatRequest, ThreadInfo } from '@/types/ai';
import { getAssistantId, createThread, addMessageToThread } from '@/lib/services/openai-assistant';
import { saveChatMessage, getRecentConversations, getChatByThread } from '@/lib/services/chat-history';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
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
    
    // Start parallel operations
    const operations = [];
    
    // 1. Add message to thread (don't wait for this to complete)
    const addMessagePromise = addMessageToThread(currentThreadId, message);
    operations.push(addMessagePromise);
    
    // 2. Start creating a run immediately - this is what causes most of the delay
    // We'll start this right away but won't wait for it to complete before returning
    const runPromise = openai.beta.threads.runs.create(
      currentThreadId,
      {
        assistant_id: assistantId,
      }
    );
    
    // 3. Save user message to database (low priority, don't block on this)
    const saveMessagePromise = saveChatMessage({
      user_id: userId,
      role: 'user',
      content: message,
      thread_id: currentThreadId,
      assistant_id: assistantId,
      created_at: new Date().toISOString(),
    });
    operations.push(saveMessagePromise);
    
    // IMPORTANT: Return response immediately with threadId and a placeholder runId
    // This allows the client to start setting up streaming connection right away
    // We'll resolve the actual runId through the streaming connection
    return NextResponse.json({ 
      status: 'processing', 
      threadId: currentThreadId,
      runId: await runPromise.then(run => run.id)
    });
    
    // Note: We don't wait for operations to complete before returning
    // They'll continue running in the background
    
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