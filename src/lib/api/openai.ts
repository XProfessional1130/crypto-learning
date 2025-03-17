import OpenAI from 'openai';
import { ChatRequest } from '@/types/ai';
import personalities from '@/lib/config/ai-personalities';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Generate a completion from OpenAI based on the provided messages and personality
 */
export async function generateChatCompletion(params: ChatRequest) {
  try {
    const { messages, personality, userId } = params;
    
    // Get the personality configuration
    const personalityConfig = personalities[personality];
    
    if (!personalityConfig) {
      throw new Error(`Invalid personality: ${personality}`);
    }
    
    // Add system message with personality instructions
    const fullMessages = [
      { 
        role: 'system', 
        content: personalityConfig.instructions
      },
      ...messages.map(msg => ({
        role: msg.role,
        content: msg.content
      }))
    ];
    
    // Call OpenAI API
    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo',
      messages: fullMessages as any,
      temperature: 0.7,
      max_tokens: 800,
    });
    
    return completion.choices[0].message.content;
  } catch (error: any) {
    console.error('OpenAI API Error:', error);
    throw new Error(`Failed to generate AI response: ${error.message}`);
  }
}

/**
 * Generate a streaming chat completion from OpenAI
 */
export async function generateStreamingChatCompletion(params: ChatRequest) {
  try {
    const { messages, personality } = params;
    
    // Get the personality configuration
    const personalityConfig = personalities[personality];
    
    if (!personalityConfig) {
      throw new Error(`Invalid personality: ${personality}`);
    }
    
    // Add system message with personality instructions
    const fullMessages = [
      { 
        role: 'system', 
        content: personalityConfig.instructions 
      },
      ...messages.map(msg => ({
        role: msg.role,
        content: msg.content
      }))
    ];
    
    // Call OpenAI API with streaming
    const stream = await openai.chat.completions.create({
      model: 'gpt-4-turbo',
      messages: fullMessages as any,
      temperature: 0.7,
      max_tokens: 800,
      stream: true,
    });
    
    return stream;
  } catch (error: any) {
    console.error('OpenAI Streaming API Error:', error);
    throw new Error(`Failed to generate streaming AI response: ${error.message}`);
  }
} 