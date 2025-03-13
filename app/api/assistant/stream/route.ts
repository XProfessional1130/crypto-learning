import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { getAssistantId } from '@/lib/services/openai-assistant';
import { saveChatMessage } from '@/lib/services/chat-history';
import { AIPersonality } from '@/types/ai';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const maxDuration = 60; // Set max duration to 60 seconds

export async function GET(request: Request) {
  // Setup response headers for SSE
  const headers = {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
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
        // First check if run is already completed
        const runStatus = await openai.beta.threads.runs.retrieve(threadId, runId);
        
        if (runStatus.status === 'failed') {
          controller.enqueue(
            new TextEncoder().encode(`data: ${JSON.stringify({
              status: 'failed',
              error: runStatus.last_error?.message || 'Run failed'
            })}\n\n`)
          );
          controller.close();
          return;
        }

        // If run isn't completed yet, we need to start polling
        let completed = runStatus.status === 'completed';
        let lastFetchedMessageId = null;
        let processingStartedAt = Date.now();
        const maxProcessingTime = 120000; // 2 minutes max

        // Send a processing message
        controller.enqueue(
          new TextEncoder().encode(`data: ${JSON.stringify({ status: 'processing' })}\n\n`)
        );

        // Poll until completion or timeout
        while (!completed && Date.now() - processingStartedAt < maxProcessingTime) {
          // Polling interval
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // Retrieve run status
          const currentStatus = await openai.beta.threads.runs.retrieve(threadId, runId);
          
          // Check if run is complete or failed
          if (currentStatus.status === 'failed') {
            controller.enqueue(
              new TextEncoder().encode(`data: ${JSON.stringify({
                status: 'failed',
                error: currentStatus.last_error?.message || 'Run failed'
              })}\n\n`)
            );
            controller.close();
            return;
          }
          
          // If completed, break out of loop
          if (currentStatus.status === 'completed') {
            completed = true;
            break;
          }
          
          // Send status update
          controller.enqueue(
            new TextEncoder().encode(`data: ${JSON.stringify({ status: currentStatus.status })}\n\n`)
          );
        }

        if (!completed) {
          controller.enqueue(
            new TextEncoder().encode(`data: ${JSON.stringify({
              status: 'timeout',
              error: 'Processing timed out'
            })}\n\n`)
          );
          controller.close();
          return;
        }

        // Fetch the assistant's response
        const messages = await openai.beta.threads.messages.list(threadId, { order: 'desc', limit: 10 });
        
        // Find the latest assistant message
        const assistantMessage = messages.data.find(msg => msg.role === 'assistant');
        
        if (!assistantMessage) {
          controller.enqueue(
            new TextEncoder().encode(`data: ${JSON.stringify({
              status: 'error',
              error: 'No assistant message found'
            })}\n\n`)
          );
          controller.close();
          return;
        }

        // Extract message content
        if (assistantMessage.content && assistantMessage.content.length > 0) {
          const contentPart = assistantMessage.content[0];
          if (contentPart.type === 'text') {
            fullMessage = contentPart.text.value;
            
            // Stream the content character by character
            let currentIndex = 0;
            const chunkSize = 1; // Reduce chunk size to one character at a time for smoother effect
            
            while (currentIndex < fullMessage.length) {
              const end = Math.min(currentIndex + chunkSize, fullMessage.length);
              const chunk = fullMessage.substring(currentIndex, end);
              
              controller.enqueue(
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

        // Send completion message
        controller.enqueue(
          new TextEncoder().encode(`data: ${JSON.stringify({
            status: 'completed',
            threadId,
            fullContent: fullMessage
          })}\n\n`)
        );
        
        controller.close();
      } catch (error: any) {
        console.error('Error in streaming assistant response:', error);
        controller.enqueue(
          new TextEncoder().encode(`data: ${JSON.stringify({
            status: 'error',
            error: error.message || 'An error occurred'
          })}\n\n`)
        );
        controller.close();
      }
    }
  });

  return new Response(stream, { headers });
} 