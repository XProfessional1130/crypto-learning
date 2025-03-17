import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { AIPersonality } from '@/types/ai';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const threadId = searchParams.get('threadId');
  const userId = searchParams.get('userId');
  const personalityParam = searchParams.get('personality');

  if (!threadId || !userId || !personalityParam) {
    return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
  }

  // Validate personality
  const personality = personalityParam as AIPersonality;
  if (personality !== 'tobo' && personality !== 'heido') {
    return NextResponse.json({ error: 'Invalid personality' }, { status: 400 });
  }

  try {
    // Fetch the latest messages from the thread
    const messages = await openai.beta.threads.messages.list(threadId, { order: 'desc', limit: 1 });
    
    // Find the latest assistant message
    const assistantMessage = messages.data.find(msg => msg.role === 'assistant');
    
    if (!assistantMessage) {
      return NextResponse.json({ error: 'No assistant message found' }, { status: 404 });
    }

    // Extract the full content
    let fullContent = '';
    if (assistantMessage.content && assistantMessage.content.length > 0) {
      const contentPart = assistantMessage.content[0];
      if (contentPart.type === 'text') {
        fullContent = contentPart.text.value;
      }
    }

    return NextResponse.json({ 
      fullContent,
      threadId
    });
  } catch (error: any) {
    console.error('Error fetching full content:', error);
    return NextResponse.json(
      { error: `Failed to fetch full content: ${error.message || 'Unknown error'}` },
      { status: 500 }
    );
  }
} 