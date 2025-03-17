import { NextResponse } from 'next/server';
import { saveChatMessage } from '@/lib/api/chat-history';
import { ChatMessage } from '@/types';

export const maxDuration = 60; // Set max duration to 60 seconds

/**
 * POST handler to save a thread and its messages
 */
export async function POST(request: Request) {
  try {
    // Parse the request body
    const body = await request.json();
    const { userId, messages, threadId } = body;
    
    if (!userId || !messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Get existing thread ID or generate a new one if not provided
    const actualThreadId = threadId || `thread_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    
    // Save each message to the database
    for (const message of messages) {
      await saveChatMessage({
        user_id: userId,
        thread_id: actualThreadId,
        role: message.role,
        content: message.content,
        personality: message.personality || 'default',
        assistant_id: message.assistant_id || null,
        created_at: message.created_at || new Date().toISOString(),
      });
    }
    
    // Return the thread ID
    return NextResponse.json({ threadId: actualThreadId });
  } catch (error) {
    console.error('Error saving thread:', error);
    return NextResponse.json(
      { error: 'Failed to save thread' },
      { status: 500 }
    );
  }
} 