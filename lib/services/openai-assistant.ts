import OpenAI from 'openai';
import { AIPersonality } from '@/types/ai';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Map personality types to assistant IDs from environment variables
const ASSISTANT_IDS: Record<AIPersonality, string> = {
  tobo: process.env.OPENAI_ASSISTANT_ID_TOBO || '',
  heido: process.env.OPENAI_ASSISTANT_ID_HEIDO || '',
};

/**
 * Get the OpenAI Assistant ID for the given personality
 */
export function getAssistantId(personality: AIPersonality): string {
  const assistantId = ASSISTANT_IDS[personality];
  
  if (!assistantId) {
    throw new Error(`No assistant ID configured for personality: ${personality}`);
  }
  
  return assistantId;
}

/**
 * Create a thread for a user
 */
export async function createThread() {
  try {
    const thread = await openai.beta.threads.create();
    return thread.id;
  } catch (error: any) {
    console.error('Error creating thread:', error);
    throw new Error(`Failed to create thread: ${error.message}`);
  }
}

/**
 * Add a message to a thread
 */
export async function addMessageToThread(threadId: string, content: string) {
  try {
    const message = await openai.beta.threads.messages.create(
      threadId,
      {
        role: "user",
        content: content
      }
    );
    return message;
  } catch (error: any) {
    console.error('Error adding message to thread:', error);
    throw new Error(`Failed to add message: ${error.message}`);
  }
}

/**
 * Run an assistant on a thread and stream the response
 */
export async function runAssistantOnThread(threadId: string, assistantId: string) {
  try {
    // Create a run
    const run = await openai.beta.threads.runs.create(
      threadId,
      {
        assistant_id: assistantId,
      }
    );

    return run;
  } catch (error: any) {
    console.error('Error running assistant:', error);
    throw new Error(`Failed to run assistant: ${error.message}`);
  }
}

/**
 * Get messages from a thread
 */
export async function getMessagesFromThread(threadId: string, limit = 10) {
  try {
    const messages = await openai.beta.threads.messages.list(
      threadId,
      {
        limit,
        order: "desc"
      }
    );
    return messages.data;
  } catch (error: any) {
    console.error('Error getting messages from thread:', error);
    throw new Error(`Failed to get messages: ${error.message}`);
  }
}

/**
 * Delete a thread
 */
export async function deleteThread(threadId: string) {
  try {
    await openai.beta.threads.del(threadId);
  } catch (error: any) {
    console.error('Error deleting thread:', error);
    throw new Error(`Failed to delete thread: ${error.message}`);
  }
} 