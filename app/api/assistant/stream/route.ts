import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { getAssistantId } from '@/lib/services/openai-assistant';
import { saveChatMessage } from '@/lib/services/chat-history';
import { AIPersonality } from '@/types/ai';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Set max duration to comply with Vercel hobby plan limits
export const maxDuration = 60; // 60 seconds is the maximum for Vercel hobby plan

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
        
        // Send a processing message immediately to improve perceived latency
        safeEnqueue(
          new TextEncoder().encode(`data: ${JSON.stringify({ status: 'processing' })}\n\n`)
        );
        
        // Check run status immediately to see if it's already processed
        let initialRunStatus;
        try {
          initialRunStatus = await openai.beta.threads.runs.retrieve(threadId, runId);
          
          // If run is already completed from the start, handle it right away
          if (initialRunStatus.status === 'completed') {
            // Send status update
            safeEnqueue(
              new TextEncoder().encode(`data: ${JSON.stringify({ status: 'completed' })}\n\n`)
            );
            
            // Go directly to fetch messages
            const messages = await openai.beta.threads.messages.list(threadId, { order: 'desc', limit: 1 });
            const assistantMessage = messages.data.find(msg => msg.role === 'assistant');
            
            if (assistantMessage && assistantMessage.content && assistantMessage.content.length > 0) {
              const contentPart = assistantMessage.content[0];
              if (contentPart.type === 'text') {
                fullMessage = contentPart.text.value;
                
                // Stream the full content directly without typing effect for completed runs
                safeEnqueue(
                  new TextEncoder().encode(`data: ${JSON.stringify({
                    status: 'streaming',
                    content: fullMessage,
                    done: true
                  })}\n\n`)
                );
                
                safeEnqueue(
                  new TextEncoder().encode(`data: ${JSON.stringify({
                    status: 'completed',
                    threadId,
                    fullContent: fullMessage
                  })}\n\n`)
                );
                
                safeClose();
                return;
              }
            }
          } else if (initialRunStatus.status === 'failed') {
            safeEnqueue(
              new TextEncoder().encode(`data: ${JSON.stringify({
                status: 'failed',
                error: initialRunStatus.last_error?.message || 'Run failed'
              })}\n\n`)
            );
            safeClose();
            return;
          }
        } catch (error) {
          // Ignore error from initial check, we'll retry in polling
          console.warn('Initial run status check failed, will retry in polling:', error);
        }

        // If run isn't completed yet, we need to start polling
        let completed = initialRunStatus?.status === 'completed';
        let lastFetchedMessageId = null;
        let processingStartedAt = Date.now();
        const maxProcessingTime = 45000; // 45 seconds max to allow for other operations within the 60s limit
        
        // Use shorter first polling interval for better responsiveness
        const initialPollingInterval = 500; // 500ms initial poll
        const subsequentPollingInterval = 1000; // 1000ms for following polls
        
        // Wait for first poll (shorter interval)
        if (!completed && !isControllerClosed) {
          await new Promise(resolve => setTimeout(resolve, initialPollingInterval));
        }

        // Poll until completion or timeout
        while (!completed && Date.now() - processingStartedAt < maxProcessingTime && !isControllerClosed) {
          // Polling interval (longer for subsequent polls)
          await new Promise(resolve => setTimeout(resolve, subsequentPollingInterval));
          
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
            
            // Stream the content in larger chunks for better performance
            let currentIndex = 0;
            // Use larger chunks for faster rendering while maintaining typing appearance
            const chunkSize = 2; // Reduced to 2 characters per chunk for more natural feel
            
            // Calculate approximate word boundaries for more natural streaming
            const totalLength = fullMessage.length;
            
            // For very short messages, just send it all at once
            if (totalLength < 30) {
              safeEnqueue(
                new TextEncoder().encode(`data: ${JSON.stringify({
                  status: 'streaming',
                  content: fullMessage,
                  done: true
                })}\n\n`)
              );
            } else {
              // Calculate typing delay based on message length to approximate 2x reading speed
              // Average reading speed is ~250 wpm, or ~1000 chars/minute
              // For 2x reading speed, we want ~30-35ms per character
              const baseDelayMs = 30; // Base delay of 30ms per character (for 2x reading speed)
              
              // Function to determine if we should pause longer at punctuation
              const shouldPauseAtPosition = (position: number): number => {
                if (position >= fullMessage.length) return 0;
                
                // Add natural pauses at sentence endings and commas
                const char = fullMessage[position];
                if (char === '.' || char === '!' || char === '?') {
                  // End of sentence pause
                  return 100; // Add 100ms at end of sentences
                } else if (char === ',') {
                  // Comma pause
                  return 50; // Add 50ms at commas
                } else if (char === '\n') {
                  // New line pause
                  return 80; // Add 80ms at new lines
                }
                return 0;
              };
              
              while (currentIndex < totalLength && !isControllerClosed) {
                const end = Math.min(currentIndex + chunkSize, totalLength);
                const chunk = fullMessage.substring(currentIndex, end);
                
                safeEnqueue(
                  new TextEncoder().encode(`data: ${JSON.stringify({
                    status: 'streaming',
                    content: chunk,
                    done: end === totalLength
                  })}\n\n`)
                );
                
                // Determine if we should add an extra pause at this position
                const extraPauseMs = shouldPauseAtPosition(currentIndex);
                
                currentIndex = end;
                
                // Wait the calculated amount of time before the next chunk
                await new Promise(resolve => setTimeout(resolve, baseDelayMs + extraPauseMs));
              }
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