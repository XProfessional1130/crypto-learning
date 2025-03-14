import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { getAssistantId } from '@/lib/services/openai-assistant';
import { saveChatMessage } from '@/lib/services/chat-history';
import { AIPersonality } from '@/types/ai';

// Initialize OpenAI client with optimized client settings
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  maxRetries: 1, // Reduce retries for faster error detection
  timeout: 10000, // 10 second timeout to avoid long waits
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

        // Send initial connection established message IMMEDIATELY
        safeEnqueue(
          new TextEncoder().encode(`data: ${JSON.stringify({ status: 'connected' })}\n\n`)
        );
        
        // Send a processing message IMMEDIATELY to improve perceived latency
        safeEnqueue(
          new TextEncoder().encode(`data: ${JSON.stringify({ 
            status: 'processing',
            message: 'Processing your request...'
          })}\n\n`)
        );
        
        // Use shorter polling intervals for better responsiveness
        const initialPollingInterval = 200; // 200ms initial poll (was 300ms)
        const subsequentPollingInterval = 600; // 600ms for following polls (was 800ms)
        
        // Start polling immediately
        let completed = false;
        let processingStartedAt = Date.now();
        const maxProcessingTime = 45000; // 45 seconds max
        
        // Wait very briefly before first poll - just enough time for the UI to update
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Poll until completion or timeout
        while (!completed && Date.now() - processingStartedAt < maxProcessingTime && !isControllerClosed) {
          // Retrieve run status with shorter timeout
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
            
            // After just 2 seconds, try to get early messages even if the run isn't complete
            if (Date.now() - processingStartedAt > 2000) {
              try {
                // Check if there are any early messages we can start streaming
                const earlyMessages = await openai.beta.threads.messages.list(threadId, { order: 'desc', limit: 1 });
                const latestMessage = earlyMessages.data[0];
                
                // If we have a fresh assistant message, start streaming it early
                if (latestMessage && latestMessage.role === 'assistant' && latestMessage.content && latestMessage.content.length > 0) {
                  const contentPart = latestMessage.content[0];
                  if (contentPart.type === 'text' && contentPart.text.value.trim().length > 0) {
                    // Only send the first few characters to start the typing effect
                    // Instead of sending the whole message at once
                    const previewLength = Math.min(5, contentPart.text.value.length);
                    const previewContent = contentPart.text.value.substring(0, previewLength);
                    
                    safeEnqueue(
                      new TextEncoder().encode(`data: ${JSON.stringify({
                        status: 'streaming',
                        content: previewContent,
                        done: false
                      })}\n\n`)
                    );
                    
                    // Update full message but don't send the rest yet
                    fullMessage = contentPart.text.value;
                    
                    // Break out of poll loop since we have content to show
                    break;
                  }
                }
              } catch (earlyError) {
                // Just log and continue if early streaming fails
                console.warn('Early streaming attempt failed:', earlyError);
              }
            }
          } catch (error: any) {
            console.error('Error during status polling:', error);
            
            // Don't immediately fail - try again
            safeEnqueue(
              new TextEncoder().encode(`data: ${JSON.stringify({
                status: 'polling_error',
                error: `Error checking run status: ${error.message}. Will retry.`
              })}\n\n`)
            );
          }
          
          // Wait before next poll - use shorter interval for initial polls
          const pollWaitTime = Date.now() - processingStartedAt < 2000 ? 
            initialPollingInterval : subsequentPollingInterval;
          await new Promise(resolve => setTimeout(resolve, pollWaitTime));
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
            // Always use single character chunks for smooth typing
            const chunkSize = 1;
            
            // Calculate approximate word boundaries for more natural streaming
            const totalLength = fullMessage.length;
            
            // For very short messages, just send it all at once
            if (totalLength < 20) {  // Reduced from 30
              // Instead of sending all at once, still do character-by-character typing
              // but use a faster typing speed to keep it snappy
              // This ensures consistent behavior across all message lengths
              const fastTypeSpeed = () => 15 + (Math.random() * 5); // 15-20ms per character for short messages
              
              while (currentIndex < totalLength && !isControllerClosed) {
                // Get next character
                const end = Math.min(currentIndex + chunkSize, totalLength);
                const char = fullMessage.substring(currentIndex, end);
                
                // Send character
                safeEnqueue(
                  new TextEncoder().encode(`data: ${JSON.stringify({
                    status: 'streaming',
                    content: char,
                    done: end === totalLength
                  })}\n\n`)
                );
                
                // Move to next character
                currentIndex = end;
                
                // Use fast typing for short messages
                await new Promise(resolve => setTimeout(resolve, fastTypeSpeed()));
              }
            } else {
              // Typing speed calculations with natural variation
              const getTypeSpeed = (): number => {
                // Base delay with slight randomness for human-like variation
                // Average human typing speed is around 40-60 words per minute
                // At ~5 chars per word, that's 200-300 chars per minute
                // Which works out to ~25-35ms per character
                const baseSpeeds = [25, 27, 28, 30, 32]; // Slightly varied base speeds
                const baseDelay = baseSpeeds[Math.floor(Math.random() * baseSpeeds.length)];
                
                // Add tiny random variations (-5ms to +5ms) to make it look less mechanical
                return baseDelay + (Math.random() * 8 - 4); 
              };
              
              // Function for natural pauses at punctuation and word boundaries
              const getPauseTime = (position: number): number => {
                if (position >= fullMessage.length) return 0;
                
                const char = fullMessage[position];
                const nextChar = position < fullMessage.length - 1 ? fullMessage[position + 1] : '';
                
                // Longer pauses at sentence endings
                if ((char === '.' || char === '!' || char === '?') && (nextChar === ' ' || nextChar === '\n')) {
                  // Natural sentence ending pause (70-100ms)
                  return 70 + Math.floor(Math.random() * 30);
                } 
                // Medium pauses at punctuation
                else if (char === ',' || char === ';' || char === ':') {
                  // Brief pause (30-50ms)
                  return 30 + Math.floor(Math.random() * 20);
                } 
                // Short pauses at natural word boundaries
                else if (char === ' ') {
                  // Very brief pause between words (10-20ms)
                  return 10 + Math.floor(Math.random() * 10);
                }
                // Extra pauses at paragraph breaks
                else if (char === '\n') {
                  // Paragraph break (100-150ms)
                  return 100 + Math.floor(Math.random() * 50);
                }
                return 0;
              };
              
              // For performance optimization on very long messages
              const batchSize = totalLength > 1000 ? 3 : 1;  // Use micro-batches for very long messages
              let batchedChars = '';
              
              // Stream characters with variable timing for natural effect
              while (currentIndex < totalLength && !isControllerClosed) {
                // Get next character
                const end = Math.min(currentIndex + chunkSize, totalLength);
                const char = fullMessage.substring(currentIndex, end);
                
                // For very long messages, batch characters but keep it small
                if (totalLength > 1000) {
                  batchedChars += char;
                  
                  if (batchedChars.length >= batchSize || end === totalLength) {
                    safeEnqueue(
                      new TextEncoder().encode(`data: ${JSON.stringify({
                        status: 'streaming',
                        content: batchedChars,
                        done: end === totalLength
                      })}\n\n`)
                    );
                    batchedChars = '';
                  }
                } else {
                  // For normal messages, send each character individually
                  safeEnqueue(
                    new TextEncoder().encode(`data: ${JSON.stringify({
                      status: 'streaming',
                      content: char,
                      done: end === totalLength
                    })}\n\n`)
                  );
                }
                
                // Move to next character
                currentIndex = end;
                
                // Calculate natural delays with human-like variation
                const typeSpeed = getTypeSpeed();
                const pauseTime = getPauseTime(currentIndex - 1);
                const totalDelay = typeSpeed + pauseTime;
                
                // Wait variable time before next character for natural feel
                await new Promise(resolve => setTimeout(resolve, totalDelay));
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