import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { AssistantChatRequest, ThreadInfo } from '@/types/ai';
import { getAssistantId, createThread, addMessageToThread } from '@/lib/api/openai-assistant';
import { saveChatMessage } from '@/lib/api/chat-history';

// Initialize OpenAI client with optimized settings
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  maxRetries: 1, // Reduce retries for faster error detection
  timeout: 15000, // 15 second timeout
});

// Store thread IDs for users (in a real app, this would be in a database)
const userThreads: Record<string, ThreadInfo> = {};

// Ensures dynamic routes
export const dynamic = 'force-dynamic';

/**
 * POST handler to send a message to the assistant
 */
export async function POST(request: Request) {
  // Create a streaming response
  const encoder = new TextEncoder();
  
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
    
    // Validate personality is a supported value
    if (personality !== 'tobo' && personality !== 'heido') {
      return NextResponse.json(
        { error: 'Invalid personality. Must be either "tobo" or "heido"' },
        { status: 400 }
      );
    }
    
    // Get assistant ID for the personality
    const assistantId = getAssistantId(personality);
    
    // Create a streaming response
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Send initial empty chunk to trigger typing animation immediately
          controller.enqueue(encoder.encode("data: " + JSON.stringify({ content: "" }) + "\n\n"));
          
          // Get or create thread for the user
          let currentThreadId: string;
          
          try {
            if (threadId) {
              // Verify thread exists before using it
              try {
                // Try to retrieve the thread to verify it exists
                await openai.beta.threads.retrieve(threadId);
                currentThreadId = threadId;
              } catch (threadError) {
                console.error("Thread not found, creating new thread:", threadError);
                // Thread doesn't exist, create a new one
                currentThreadId = await createThread();
                
                // Update with new thread info
                userThreads[userId] = {
                  threadId: currentThreadId,
                  assistantId,
                  personality
                };
              }
            } else if (userThreads[userId] && userThreads[userId].personality === personality) {
              // Use existing thread if personality matches
              try {
                // Verify the cached thread still exists
                await openai.beta.threads.retrieve(userThreads[userId].threadId);
                currentThreadId = userThreads[userId].threadId;
              } catch (threadError) {
                console.error("Cached thread not found, creating new thread:", threadError);
                // Thread doesn't exist, create a new one
                currentThreadId = await createThread();
                
                // Update with new thread info
                userThreads[userId] = {
                  threadId: currentThreadId,
                  assistantId,
                  personality
                };
              }
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
            
            // Send progress update to keep connection alive
            controller.enqueue(encoder.encode("data: " + JSON.stringify({ content: "" }) + "\n\n"));
            
            // Add message to thread
            await addMessageToThread(currentThreadId, message);
            
            // Start creating a run
            const run = await openai.beta.threads.runs.create(
              currentThreadId,
              {
                assistant_id: assistantId,
              }
            );
            
            // Save user message to database
            try {
              await saveChatMessage({
                user_id: userId,
                role: 'user',
                content: message,
                thread_id: currentThreadId,
                assistant_id: assistantId,
                personality, // Ensure we explicitly set personality here
                created_at: new Date().toISOString(),
              });
            } catch (dbError) {
              console.error("Error saving chat message:", dbError);
              // Continue with API processing even if DB save fails
            }
            
            // Poll for completion
            let runStatus = await openai.beta.threads.runs.retrieve(
              currentThreadId,
              run.id
            );
            
            let attempts = 0;
            const maxAttempts = 20;
            
            // Send periodic updates to keep connection alive and show typing activity
            const typingInterval = setInterval(() => {
              controller.enqueue(encoder.encode("data: " + JSON.stringify({ content: "" }) + "\n\n"));
            }, 2000);
            
            // Poll until the run completes or fails
            while (runStatus.status !== 'completed' && runStatus.status !== 'failed' && attempts < maxAttempts) {
              // Wait for a short time before polling again
              await new Promise(resolve => setTimeout(resolve, 1000));
              
              // Check run status
              runStatus = await openai.beta.threads.runs.retrieve(
                currentThreadId,
                run.id
              );
              
              attempts++;
            }
            
            // Clear typing interval
            clearInterval(typingInterval);
            
            if (runStatus.status === 'failed') {
              controller.enqueue(encoder.encode("data: " + JSON.stringify({ 
                error: runStatus.last_error?.message || 'Run failed' 
              }) + "\n\n"));
              controller.close();
              return;
            }
            
            if (runStatus.status !== 'completed') {
              controller.enqueue(encoder.encode("data: " + JSON.stringify({ 
                error: 'Run timed out' 
              }) + "\n\n"));
              controller.close();
              return;
            }
            
            // Get assistant's response
            const messages = await openai.beta.threads.messages.list(
              currentThreadId,
              { order: 'desc', limit: 1 }
            );
            
            const latestMessage = messages.data[0];
            
            if (!latestMessage || latestMessage.role !== 'assistant') {
              controller.enqueue(encoder.encode("data: " + JSON.stringify({ 
                error: 'No assistant message found' 
              }) + "\n\n"));
              controller.close();
              return;
            }
            
            // Extract the message content
            let messageContent = '';
            if (latestMessage.content && latestMessage.content.length > 0) {
              const contentPart = latestMessage.content[0];
              if (contentPart.type === 'text') {
                messageContent = contentPart.text.value;
              }
            }
            
            // Save assistant message to database
            try {
              await saveChatMessage({
                user_id: userId,
                role: 'assistant',
                content: messageContent,
                personality, // Make sure we use the valid personality
                thread_id: currentThreadId,
                assistant_id: latestMessage.assistant_id || '',
                created_at: new Date().toISOString(),
              });
            } catch (dbError) {
              console.error("Error saving assistant message:", dbError);
              // Continue with API processing even if DB save fails
            }
            
            // Send the final message content
            controller.enqueue(encoder.encode("data: " + JSON.stringify({ 
              content: messageContent,
              threadId: currentThreadId,
              status: 'completed'
            }) + "\n\n"));
            
            // End the stream
            controller.enqueue(encoder.encode("data: [DONE]\n\n"));
            controller.close();
          } catch (error) {
            console.error("Error processing chat:", error);
            controller.enqueue(encoder.encode("data: " + JSON.stringify({ 
              error: error instanceof Error ? error.message : 'Unknown error occurred'
            }) + "\n\n"));
            controller.close();
          }
        } catch (error: any) {
          // Send error through the stream
          controller.enqueue(encoder.encode("data: " + JSON.stringify({ 
            error: error.message || 'An error occurred' 
          }) + "\n\n"));
          controller.close();
        }
      }
    });
    
    // Return streaming response
    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
    
  } catch (error: any) {
    console.error('Error in chat API:', error);
    return NextResponse.json(
      { error: error.message || 'An error occurred' },
      { status: 500 }
    );
  }
} 