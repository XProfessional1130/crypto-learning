import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { getAssistantId } from '@/lib/services/openai-assistant';
import { saveChatMessage } from '@/lib/services/chat-history';
import { AIPersonality } from '@/types/ai';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Set max duration to improve server response time for streaming
export const maxDuration = 300; // Increase max duration to 5 minutes for longer responses

export async function GET(request: Request) {
  // Setup response headers for SSE
  const headers = {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no', // Disable buffering for nginx
  };

  const { searchParams } = new URL(request.url);
  const threadId = searchParams.get('threadId');
  const runId = searchParams.get('runId');
  const userId = searchParams.get('userId');
  const personalityParam = searchParams.get('personality');

  if (!threadId || !runId || !userId || !personalityParam) {
    return new Response(
      `data: ${JSON.stringify({ error: 'Missing required parameters' })}\n\n`,
      { headers, status: 400 }
    );
  }

  // Validate personality
  const personality = personalityParam as AIPersonality;
  if (personality !== 'tobo' && personality !== 'heido') {
    return new Response(
      `data: ${JSON.stringify({ error: 'Invalid personality' })}\n\n`,
      { headers, status: 400 }
    );
  }

  let fullMessage = '';
  
  // Use ReadableStream for server-sent events
  const stream = new ReadableStream({
    async start(controller) {
      try {
        // Track if controller is closed to prevent further enqueuing
        let isControllerClosed = false;
        
        // Heartbeat interval to keep connection alive
        const heartbeatInterval = setInterval(() => {
          if (!isControllerClosed) {
            try {
              controller.enqueue(new TextEncoder().encode(`: heartbeat\n\n`));
            } catch (err) {
              console.warn("Warning: Could not send heartbeat, controller may be closed");
              isControllerClosed = true;
              clearInterval(heartbeatInterval);
            }
          } else {
            clearInterval(heartbeatInterval);
          }
        }, 15000); // Send heartbeat every 15 seconds
        
        // Safe wrapper for enqueuing data that checks if controller is closed
        const safeEnqueue = (data: Uint8Array) => {
          if (!isControllerClosed) {
            try {
              controller.enqueue(data);
            } catch (err) {
              console.warn("Warning: Could not enqueue data, controller may be closed");
              isControllerClosed = true;
              clearInterval(heartbeatInterval);
            }
          }
        };
        
        // Safe wrapper for closing the controller
        const safeClose = () => {
          if (!isControllerClosed) {
            try {
              clearInterval(heartbeatInterval);
              controller.close();
              isControllerClosed = true;
            } catch (err) {
              console.warn("Warning: Error closing controller", err);
            }
          }
        };

        // Send initial connection established message
        safeEnqueue(
          new TextEncoder().encode(`data: ${JSON.stringify({ status: 'connected' })}\n\n`)
        );

        // First check if run is already completed
        let runStatus;
        try {
          runStatus = await openai.beta.threads.runs.retrieve(threadId, runId);
        } catch (error: any) {
          console.error('Error retrieving run status:', error);
          safeEnqueue(
            new TextEncoder().encode(`data: ${JSON.stringify({
              status: 'error',
              error: `Failed to retrieve OpenAI run status: ${error.message || 'Unknown error'}`
            })}\n\n`)
          );
          safeClose();
          return;
        }
        
        if (runStatus.status === 'failed') {
          safeEnqueue(
            new TextEncoder().encode(`data: ${JSON.stringify({
              status: 'failed',
              error: runStatus.last_error?.message || 'Run failed'
            })}\n\n`)
          );
          safeClose();
          return;
        }

        // If run isn't completed yet, we need to start polling
        let completed = runStatus.status === 'completed';
        let lastFetchedMessageId = null;
        let processingStartedAt = Date.now();
        const maxProcessingTime = 240000; // 4 minutes max (increased from 2 minutes)

        // Send a processing message
        safeEnqueue(
          new TextEncoder().encode(`data: ${JSON.stringify({ status: 'processing' })}\n\n`)
        );

        // Poll until completion or timeout
        while (!completed && Date.now() - processingStartedAt < maxProcessingTime && !isControllerClosed) {
          // Polling interval
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // Retrieve run status
          try {
            const currentStatus = await openai.beta.threads.runs.retrieve(threadId, runId);
            
            // Check if run is complete or failed
            if (currentStatus.status === 'failed') {
              safeEnqueue(
                new TextEncoder().encode(`data: ${JSON.stringify({
                  status: 'failed',
                  error: currentStatus.last_error?.message || 'Run failed'
                })}\n\n`)
              );
              safeClose();
              return;
            }
            
            // If completed, break out of loop
            if (currentStatus.status === 'completed') {
              completed = true;
              break;
            }
            
            // Send status update
            safeEnqueue(
              new TextEncoder().encode(`data: ${JSON.stringify({ status: currentStatus.status })}\n\n`)
            );
          } catch (error: any) {
            console.error('Error during status polling:', error);
            
            // Don't immediately fail - try a few more times
            safeEnqueue(
              new TextEncoder().encode(`data: ${JSON.stringify({
                status: 'polling_error',
                error: `Error checking run status: ${error.message}. Will retry.`
              })}\n\n`)
            );
            
            // Wait a little longer before next attempt
            await new Promise(resolve => setTimeout(resolve, 2000));
          }
        }

        if (!completed && !isControllerClosed) {
          safeEnqueue(
            new TextEncoder().encode(`data: ${JSON.stringify({
              status: 'timeout',
              error: 'Processing timed out'
            })}\n\n`)
          );
          safeClose();
          return;
        }

        // Only proceed if controller is still open
        if (isControllerClosed) return;

        // Fetch the assistant's response
        let messages;
        try {
          messages = await openai.beta.threads.messages.list(threadId, { order: 'desc', limit: 10 });
        } catch (error: any) {
          console.error('Error fetching messages:', error);
          safeEnqueue(
            new TextEncoder().encode(`data: ${JSON.stringify({
              status: 'error',
              error: `Failed to fetch messages: ${error.message || 'Unknown error'}`
            })}\n\n`)
          );
          safeClose();
          return;
        }
        
        // Find the latest assistant message
        const assistantMessage = messages.data.find(msg => msg.role === 'assistant');
        
        if (!assistantMessage) {
          safeEnqueue(
            new TextEncoder().encode(`data: ${JSON.stringify({
              status: 'error',
              error: 'No assistant message found'
            })}\n\n`)
          );
          safeClose();
          return;
        }

        // Extract message content
        if (assistantMessage.content && assistantMessage.content.length > 0 && !isControllerClosed) {
          const contentPart = assistantMessage.content[0];
          if (contentPart.type === 'text') {
            fullMessage = contentPart.text.value;
            
            // Stream the content character by character
            let currentIndex = 0;
            const chunkSize = 1; // Reduce chunk size to one character at a time for smoother effect
            
            while (currentIndex < fullMessage.length && !isControllerClosed) {
              const end = Math.min(currentIndex + chunkSize, fullMessage.length);
              const chunk = fullMessage.substring(currentIndex, end);
              
              safeEnqueue(
                new TextEncoder().encode(`data: ${JSON.stringify({
                  status: 'streaming',
                  content: chunk,
                  done: end === fullMessage.length
                })}\n\n`)
              );
              
              currentIndex = end;
              
              // Add small delay between chunks for typing effect
              await new Promise(resolve => setTimeout(resolve, 40)); // Slightly faster typing speed for better flow
            }
          }
        }

        // Save the complete message to the database
        try {
          const assistantId = getAssistantId(personality);
          await saveChatMessage({
            user_id: userId,
            role: 'assistant',
            content: fullMessage,
            personality,
            thread_id: threadId,
            assistant_id: assistantId,
            created_at: new Date().toISOString(),
          });
        } catch (error: any) {
          console.error('Error saving chat message:', error);
          // Don't fail the stream if saving to DB fails - just log it
        }

        // Send completion message if controller is still open
        if (!isControllerClosed) {
          safeEnqueue(
            new TextEncoder().encode(`data: ${JSON.stringify({
              status: 'completed',
              threadId,
              fullContent: fullMessage
            })}\n\n`)
          );
          
          safeClose();
        }
      } catch (error: any) {
        console.error('Error in streaming assistant response:', error);
        try {
          controller.enqueue(
            new TextEncoder().encode(`data: ${JSON.stringify({
              status: 'error',
              error: error.message || 'An error occurred'
            })}\n\n`)
          );
          controller.close();
        } catch (closeError) {
          console.warn('Could not send error because controller is already closed');
        }
      }
    }
  });

  return new Response(stream, { headers });
}