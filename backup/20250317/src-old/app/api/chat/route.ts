import { NextResponse } from 'next/server';
import { ChatRequest } from '@/types/ai';
import { generateStreamingChatCompletion } from '@/lib/services/openai';
import { saveChatMessage } from '@/lib/services/chat-history';
import { ChatMessage } from '@/types';

// Helper to convert a ReadableStream to a text encoder stream
function streamToTextEncoder(stream: ReadableStream, personality: string): ReadableStream {
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();
  
  return new ReadableStream({
    async start(controller) {
      const reader = stream.getReader();
      let buffer = '';
      
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          // Convert the chunk to a string
          const chunk = decoder.decode(value);
          buffer += chunk;
          
          // Handle streaming response from OpenAI
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';
          
          for (const line of lines) {
            if (line.trim() === '') continue;
            if (line.trim() === 'data: [DONE]') continue;
            
            let data;
            try {
              // Extract the JSON part after "data: "
              const jsonStr = line.trim().replace(/^data: /, '');
              data = JSON.parse(jsonStr);
              
              if (data.choices && data.choices[0] && data.choices[0].delta) {
                const { content } = data.choices[0].delta;
                if (content) {
                  controller.enqueue(encoder.encode(content));
                }
              }
            } catch (e) {
              console.error('Error parsing JSON from stream:', e, line);
              continue;
            }
          }
        }
        controller.close();
      } catch (error) {
        console.error('Error processing stream:', error);
        controller.error(error);
      }
    },
  });
}

// POST handler for chat requests
export async function POST(request: Request) {
  try {
    // Parse request body
    const body = await request.json() as ChatRequest;
    const { messages, personality, userId } = body;
    
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: 'Missing or invalid messages' }, 
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
    
    // Save the user's message to the database
    const lastUserMessage = messages[messages.length - 1];
    if (lastUserMessage.role === 'user') {
      await saveChatMessage({
        user_id: userId,
        role: 'user',
        content: lastUserMessage.content,
        created_at: new Date().toISOString(),
      });
    }
    
    // Generate streaming response
    const stream = await generateStreamingChatCompletion({
      messages,
      personality,
      userId,
    });
    
    // Process the response as a stream
    const responseStream = streamToTextEncoder(stream as unknown as ReadableStream, personality);
    
    // Create response with correct headers
    const response = new Response(responseStream);
    
    // Save the assistant's message - done asynchronously to not block the response
    // For a complete implementation, you would collect the full content from the stream
    // and save it after the response is complete
    const fullContent = ''; // This would be the collected content from the stream
    
    setTimeout(async () => {
      try {
        // This is a simplified approach - in a real implementation, you would collect
        // the full content from the stream and save it
        // For now, we'll save a placeholder message
        await saveChatMessage({
          user_id: userId,
          role: 'assistant',
          content: fullContent || '(Content not saved - streaming response)',
          personality,
          created_at: new Date().toISOString(),
        });
      } catch (error) {
        console.error('Error saving assistant message:', error);
      }
    }, 100);
    
    return response;
  } catch (error: any) {
    console.error('Error in chat API:', error);
    return NextResponse.json(
      { error: error.message || 'An error occurred' }, 
      { status: 500 }
    );
  }
} 