import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { getAssistantId } from '@/lib/api/openai-assistant';
import { saveChatMessage } from '@/lib/api/chat-history';
import { AIPersonality } from '@/types/ai';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Extend the NextResponse to allow maxDuration
export const maxDuration = 60; // Set max duration to 60 seconds

/**
 * GET handler to check the status of a run and get the response when complete
 */
export async function GET(request: Request) {
  try {
    // Get query parameters
    const { searchParams } = new URL(request.url);
    const threadId = searchParams.get('threadId');
    const runId = searchParams.get('runId');
    const userId = searchParams.get('userId');
    const personalityParam = searchParams.get('personality');
    
    if (!threadId || !runId || !userId || !personalityParam) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }
    
    // Validate personality is one of the expected values
    const personality = personalityParam as AIPersonality;
    if (personality !== 'tobo' && personality !== 'heido') {
      return NextResponse.json(
        { error: 'Invalid personality' },
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
    
    // Get assistant ID
    const assistantId = getAssistantId(personality);
    
    // Save to database
    await saveChatMessage({
      user_id: userId,
      role: 'assistant',
      content: messageContent,
      personality,
      thread_id: threadId,
      assistant_id: assistantId,
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