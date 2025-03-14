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
        
        // Use shorter polling intervals for better responsiveness
        const initialPollingInterval = 300; // 300ms initial poll (was 500ms)
        const subsequentPollingInterval = 800; // 800ms for following polls (was 1000ms)
        
        // Send another processing message to keep the UI responsive
        safeEnqueue(
          new TextEncoder().encode(`data: ${JSON.stringify({ 
            status: 'processing',
            message: 'Thinking...'
          })}\n\n`)
        );
        
        // Wait for first poll (shorter interval)
        if (!completed && !isControllerClosed) {
          await new Promise(resolve => setTimeout(resolve, initialPollingInterval));
        }

        // Add early content streaming
        let earlyStreamAttempt = false;
        
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
            
            // After a few seconds, try to get early messages even if the run isn't complete
            if (!earlyStreamAttempt && Date.now() - processingStartedAt > 3000) {
              earlyStreamAttempt = true;
              
              try {
                // Check if there are any early messages we can start streaming
                const earlyMessages = await openai.beta.threads.messages.list(threadId, { order: 'desc', limit: 1 });
                const latestMessage = earlyMessages.data[0];
                
                // If we have a fresh assistant message, start streaming it early
                if (latestMessage && latestMessage.role === 'assistant' && latestMessage.content && latestMessage.content.length > 0) {
                  const contentPart = latestMessage.content[0];
                  if (contentPart.type === 'text' && contentPart.text.value.trim().length > 0) {
                    // Send the first part as an early response to improve perceived latency
                    safeEnqueue(
                      new TextEncoder().encode(`data: ${JSON.stringify({
                        status: 'streaming',
                        content: contentPart.text.value,
                        done: false
                      })}\n\n`)
                    );
                    
                    // Update full message
                    fullMessage = contentPart.text.value;
                  }
                }
              } catch (earlyError) {
                // Just log and continue if early streaming fails
                console.warn('Early streaming attempt failed:', earlyError);
              }
            }
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
            await new Promise(resolve => setTimeout(resolve, 1500));
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
            // Use single character chunks for smoother letter-by-letter animation
            const chunkSize = 1; // Exactly 1 character per chunk for smooth letter-by-letter typing
            
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
              // Calculate typing delay based on message length for consistent speed
              // Use constant timing for smoother appearance
              const baseDelayMs = 30; // Keep the 30ms base delay for consistent speed
              
              // Function to determine if we should pause longer at punctuation
              const shouldPauseAtPosition = (position: number): number => {
                if (position >= fullMessage.length) return 0;
                
                // More subtle pauses for smoother appearance
                const char = fullMessage[position];
                if (char === '.' || char === '!' || char === '?') {
                  // End of sentence pause - reduced slightly
                  return 80; // Reduced from 100ms for smoother flow
                } else if (char === ',') {
                  // Comma pause - very subtle
                  return 40; // Reduced from 50ms for smoother flow
                } else if (char === '\n') {
                  // New line pause
                  return 60; // Reduced from 80ms for smoother flow
                }
                return 0;
              };
              
              // To prevent performance issues with very large messages, we'll batch multiple characters 
              // into a single update when the message is large
              const useBatchUpdates = totalLength > 1000;
              let batchContent = '';
              const batchInterval = 12; // Update UI every 12 chars for very long messages
              
              // Stream characters one by one
              while (currentIndex < totalLength && !isControllerClosed) {
                const end = Math.min(currentIndex + chunkSize, totalLength);
                const chunk = fullMessage.substring(currentIndex, end);
                
                if (useBatchUpdates) {
                  // For long messages, accumulate characters and send in small batches
                  batchContent += chunk;
                  if (batchContent.length >= batchInterval || end === totalLength) {
                    safeEnqueue(
                      new TextEncoder().encode(`data: ${JSON.stringify({
                        status: 'streaming',
                        content: batchContent,
                        done: end === totalLength
                      })}\n\n`)
                    );
                    batchContent = '';
                  }
                } else {
                  // For shorter messages, send each character for smooth animation
                  safeEnqueue(
                    new TextEncoder().encode(`data: ${JSON.stringify({
                      status: 'streaming',
                      content: chunk,
                      done: end === totalLength
                    })}\n\n`)
                  );
                }
                
                // Determine if we should add an extra pause at this position
                const extraPauseMs = shouldPauseAtPosition(currentIndex);
                
                currentIndex = end;
                
                // Wait the calculated amount of time before the next character
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